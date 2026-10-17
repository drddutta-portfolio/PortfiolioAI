"""Exercise the real collector loop with transport/storage/DB boundaries replaced."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import MagicMock,patch

class IsolationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # These are I/O dependencies only; production loop and queue control are real.
        def unavailable(name):
            try:return importlib.util.find_spec(name) is None
            except (ModuleNotFoundError,ValueError):return True
        missing={name:MagicMock() for name in ("psycopg","requests","boto3","botocore",
                 "botocore.config","portfolio_bse","bs4") if unavailable(name)}
        spec=importlib.util.spec_from_file_location("nse_isolation",Path(__file__).with_name("r4-nse-lineage-batch.py"))
        cls.module=importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules,missing):
            spec.loader.exec_module(cls.module)
            trend_spec=importlib.util.spec_from_file_location("trend_isolation",Path(__file__).with_name("r4-trendlyne-history.py"))
            cls.trend=importlib.util.module_from_spec(trend_spec);trend_spec.loader.exec_module(cls.trend)
            ocr_spec=importlib.util.spec_from_file_location("ocr_isolation",Path(__file__).with_name("r4-ocr-retained-batch.py"))
            cls.ocr=importlib.util.module_from_spec(ocr_spec);ocr_spec.loader.exec_module(cls.ocr)

    def run_case(self,fail_first=None,catalog_failure=False):
        m=self.module;sid="fixture-security"
        shard=int(hashlib.sha256(sid.encode()).hexdigest(),16)%8
        db=MagicMock();client=MagicMock();bse=MagicMock();session=MagicMock()
        bse.get_scrip_candidate.return_value={"bse_scrip_code":"500001"}
        bse._bse.listSecurities.return_value=[{"SCRIP_CD":"500001","ISIN_NUMBER":"FIXTURE"}]
        filings=[{"toDate":"30-Sep-2024","xbrl":"https://example.test/bad.xml"},
                 {"toDate":"31-Dec-2024","xbrl":"https://example.test/good.xml"}]
        if catalog_failure:filings=[{"toDate":"31-Mar-2025","xbrl":"https://example.test/good.xml"}]
        def cache(client,key):
            if "nse-catalog" in key:
                if catalog_failure and "2024" in key:raise OSError("catalog unavailable")
                return filings if catalog_failure or "window=2024" in key else []
            return None
        def get(url,**kwargs):
            if url.endswith("bad.xml") and fail_first=="download":raise OSError("404")
            response=MagicMock();response.content=b"fixture original";return response
        session.get.side_effect=get
        parsed={"scope":"CONSOLIDATED","facts":{metric:{"value":"1","unit":"fixture"}
            for metric in ("OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED")}}
        called=[]
        def persist(*args):
            item=args[4];called.append(item["xbrl"])
            if item["xbrl"].endswith("bad.xml") and fail_first=="database":raise OSError("DB write failed")
            return 3
        def bridge(raw,item,*args):
            if item["xbrl"].endswith("bad.xml") and fail_first=="identity":raise ValueError("IDENTITY_UNPROVEN")
            return MagicMock()
        with tempfile.TemporaryDirectory() as directory,contextlib.chdir(directory),contextlib.redirect_stdout(io.StringIO()), \
             patch.dict(os.environ,{"SUPABASE_DB_URL":"postgres://lrgpjimipfkyoqbpsqzz","CLOUDFLARE_R2_BUCKET":m.batch.BUCKET}), \
             patch.object(sys,"argv",["collector","--shard",str(shard)]), \
             patch.object(m.psycopg,"connect",return_value=MagicMock(__enter__=lambda _:db)), \
             patch.object(m.batch,"PortfolioBSE",return_value=MagicMock(__enter__=lambda _:bse)), \
             patch.object(m.batch,"candidates",return_value=[("FIXTURE","FIXTURE",sid,"Fixture",list(m.batch.WINDOWS))]), \
             patch.object(m.batch,"r2_client",return_value=client),patch.object(m,"get_json",side_effect=cache), \
             patch.object(m.requests,"Session",return_value=session),patch.object(m.batch,"immutable_put"), \
             patch.object(m,"bridge_from_sources",side_effect=bridge),patch.object(m.legacy,"extract",return_value=(parsed,None)), \
             patch.object(m,"persist",side_effect=persist):
            m.main()
            report=json.loads(Path(f"tmp/results-r4/nse-lineage-shard-{shard}.json").read_text())
        self.assertTrue(any(x.endswith("good.xml") for x in called),called)
        self.assertEqual(report["counts"]["facts_inserted"],3)
        return report

    def test_bse_404_does_not_skip_next_pdf_for_same_quarter(self):
        batch=self.module.batch;db=MagicMock();bse=MagicMock()
        bse.get_scrip_candidate.return_value={"bse_scrip_code":"500001"}
        bse._bse.equityMetaInfo.return_value={"ISIN":"FIXTURE","SecurityCode":"500001"}
        bse.financial_announcements.return_value={"results":[{"attachment_name":"bad.pdf"},{"attachment_name":"good.pdf"}]}
        visited=[]
        def original(bse,client,filename):
            visited.append(filename)
            if filename=="bad.pdf":raise OSError("404")
            return b"fixture",{"source_url":"https://example.test/good.pdf"},False
        parsed={"scope":"CONSOLIDATED","facts":{"EPS_DILUTED":{"value":"1"}}}
        with tempfile.TemporaryDirectory() as directory,contextlib.chdir(directory),contextlib.redirect_stdout(io.StringIO()), \
             patch.dict(os.environ,{"SUPABASE_DB_URL":"postgres://lrgpjimipfkyoqbpsqzz","CLOUDFLARE_R2_BUCKET":batch.BUCKET}), \
             patch.object(sys,"argv",["collector","--shard-count","1","--max-pdfs-per-quarter","3"]), \
             patch.object(batch.psycopg,"connect",return_value=MagicMock(__enter__=lambda _:db)), \
             patch.object(batch,"PortfolioBSE",return_value=MagicMock(__enter__=lambda _:bse)), \
             patch.object(batch,"candidates",return_value=[("FIXTURE","FIXTURE","sid","Fixture",["2024-09-30"])]), \
             patch.object(batch,"verified_issuer",return_value="Fixture"),patch.object(batch,"retained_original",side_effect=original), \
             patch.object(batch,"extract",return_value=parsed),patch.object(batch.time,"sleep"):
            batch.main()
            report=json.loads(Path("tmp/results-r4/bse-batch.json").read_text())
        self.assertEqual(visited,["bad.pdf","good.pdf"])
        self.assertEqual(report["companies"][0]["results"][0]["status"],"SOURCE_TRIO_QUALIFIED")
        self.assertEqual(report["companies"][0]["results"][0]["source_errors"][0]["status"],"RETRY_REQUIRED")

    def test_ocr_storage_failure_does_not_skip_other_sources_or_periods(self):
        from r4_recovery_queue import task_id
        m=self.ocr;sid="fixture";shard=int(task_id(sid,"OCR",None,{}),16)%8
        db=MagicMock();bse=MagicMock();client=MagicMock()
        bse.get_scrip_candidate.return_value={"bse_scrip_code":"500001"}
        periods=["2024-09-30","2024-12-31"]
        class Missing(Exception):response={"Error":{"Code":"NoSuchKey"}}
        def get_object(**kwargs):
            key=kwargs["Key"]
            if key=="bad":raise OSError("storage unavailable")
            if key=="good":return {"Body":io.BytesIO(b"good")}
            raise Missing()
        client.get_object.side_effect=get_object
        parsed={"scope":"CONSOLIDATED","facts":{"EPS_DILUTED":{"value":"1"}}}
        report={"companies":[{"symbol":"FIXTURE","results":[{"period":p,"sources":[
            {"sha256":m.batch.sha(b"bad"),"original_r2_key":"bad","attachment_name":"bad.pdf"},
            {"sha256":m.batch.sha(b"good"),"original_r2_key":"good","attachment_name":"good.pdf"}]} for p in periods]}]}
        with tempfile.TemporaryDirectory() as directory,contextlib.chdir(directory),contextlib.redirect_stdout(io.StringIO()), \
             patch.dict(os.environ,{"SUPABASE_DB_URL":"postgres://lrgpjimipfkyoqbpsqzz","CLOUDFLARE_R2_BUCKET":m.batch.BUCKET}), \
             patch.object(sys,"argv",["collector","--shard",str(shard),"--reports","reports"]), \
             patch.object(m.psycopg,"connect",return_value=MagicMock(__enter__=lambda _:db)), \
             patch.object(m.batch,"PortfolioBSE",return_value=MagicMock(__enter__=lambda _:bse)), \
             patch.object(m.batch,"candidates",return_value=[("FIXTURE","FIXTURE",sid,"Fixture",periods)]), \
             patch.object(m.batch,"r2_client",return_value=client),patch.object(m.batch,"verified_issuer",return_value="Fixture"), \
             patch.object(m.batch,"immutable_put"),patch.object(m,"extract_ocr",side_effect=lambda *args:dict(parsed)), \
             patch.object(m,"run_with_timeout",side_effect=lambda operation,args,timeout:operation(*args)), \
             patch.object(m.fitz,"open",return_value=[]),patch.object(m.batch,"issuer_identity",return_value=True), \
             patch.object(m.batch,"persist",return_value=3):
            Path("reports").mkdir();Path("reports/bse-original-shard-0.json").write_text(json.dumps(report))
            m.main()
            result=json.loads(Path(f"tmp/results-r4/ocr-shard-{shard}.json").read_text())
        self.assertEqual(result["counts"]["source_errors"],2)
        self.assertEqual(result["counts"]["facts_inserted"],6)
        self.assertEqual(len(result["details"]),2)

    def test_404_does_not_skip_later_quarter(self):self.run_case("download")

    def test_fresh_bse_pull_does_not_reuse_or_overwrite_original_cache(self):
        batch=self.module.batch;bse=MagicMock();client=MagicMock()
        raw=b"%PDF-new source version"
        bse.retrieve_original_pdf.return_value=(raw,{"sha256":batch.sha(raw),"attachment_name":"fixture.pdf"})
        with patch.dict(os.environ,{"RESULTS_R4_FORCE_FRESH":"1","GITHUB_RUN_ID":"123","GITHUB_RUN_ATTEMPT":"2"}), \
             patch.object(batch,"immutable_put") as put:
            result,origin,reused=batch.retained_original(bse,client,"fixture.pdf")
        self.assertEqual(result,raw);self.assertFalse(reused)
        bse.retrieve_original_pdf.assert_called_once_with("fixture.pdf",max_bytes=32_000_000)
        client.get_object.assert_not_called()
        keys=[call.args[1] for call in put.call_args_list]
        self.assertTrue(any("original_version="+batch.sha(raw) in key for key in keys))
        self.assertTrue(any("run=123/attempt=2/fixture.pdf.json" in key for key in keys))
        self.assertFalse(any("bse-source-cache/" in key for key in keys))

    def test_fresh_bse_pull_requires_auditable_run_identity(self):
        batch=self.module.batch;bse=MagicMock()
        with patch.dict(os.environ,{"RESULTS_R4_FORCE_FRESH":"1","GITHUB_RUN_ID":"","GITHUB_RUN_ATTEMPT":""}):
            with self.assertRaisesRegex(RuntimeError,"FRESH_CAPTURE_RUN_ID_REQUIRED"):
                batch.retained_original(bse,None,"fixture.pdf")
        bse.retrieve_original_pdf.assert_not_called()

    def test_fresh_trendlyne_citations_only_discover_hash_verified_bse_pdfs(self):
        batch=self.module.batch;db=MagicMock();client=MagicMock()
        filename="12345678-1234-1234-1234-123456789abc.pdf"
        raw=json.dumps({"result":"https://evil.test/"+filename+" https://www.bseindia.com.evil.test/xml-data/corpfiling/AttachHis/"+filename+
            " https://www.bseindia.com/xml-data/corpfiling/AttachHis/"+filename}).encode()
        db.cursor.return_value.__enter__.return_value.fetchall.return_value=[("private-capture",batch.sha(raw))]
        client.get_object.return_value={"Body":io.BytesIO(raw)}
        sources=batch.fresh_trendlyne_bse_sources(db,client,"sid","2024-09-30")
        self.assertEqual([r["attachment_name"] for r in sources],[filename])
        self.assertNotIn("facts",sources[0])
        client.get_object.return_value={"Body":io.BytesIO(raw+b"tampered")}
        with self.assertRaisesRegex(RuntimeError,"TRENDLYNE_CAPTURE_HASH_MISMATCH"):
            batch.fresh_trendlyne_bse_sources(db,client,"sid","2024-09-30")

    def test_explicit_fresh_trendlyne_pull_calls_provider_despite_daily_capture(self):
        m=self.trend
        for fresh in ("0","1"):
            with self.subTest(fresh=fresh):
                db=MagicMock();cursor=db.cursor.return_value.__enter__.return_value
                cursor.fetchone.side_effect=[("capabilities",),("daily-capture",)]
                cursor.fetchall.return_value=[("sid","AUROPHARMA","ISIN","provider-id")]
                client=MagicMock()
                tools={"tools":[{"name":"get_parameter_values_multi_stock","inputSchema":{"properties":{"query":{}}}}]}
                def stored(**kwargs):
                    result=tools if kwargs["Key"]=="capabilities" else "old private source"
                    return {"Body":io.BytesIO(json.dumps({"result":result}).encode())}
                client.get_object.side_effect=stored
                responses=[MagicMock(__enter__=lambda _:io.BytesIO(b'{"value":"fixture-token"}')),
                    MagicMock(__enter__=lambda _:io.BytesIO(b'{"runId":"new-run","result":"new private source"}'))]
                with tempfile.TemporaryDirectory() as directory,contextlib.chdir(directory),contextlib.redirect_stdout(io.StringIO()) as output, \
                     patch.dict(os.environ,{"SUPABASE_DB_URL":"postgres://lrgpjimipfkyoqbpsqzz","CLOUDFLARE_R2_BUCKET":m.batch.BUCKET,
                        "RESULTS_R4_FORCE_FRESH":fresh,"RESULTS_R4_TRENDLYNE_MODE":"PROBE",
                        "ACTIONS_ID_TOKEN_REQUEST_URL":"https://example.test/token?x=1","ACTIONS_ID_TOKEN_REQUEST_TOKEN":"fixture"}), \
                     patch.object(m.psycopg,"connect",return_value=MagicMock(__enter__=lambda _:db)), \
                     patch.object(m.batch,"r2_client",return_value=client),patch.object(m.batch,"immutable_put") as put, \
                     patch.object(m.urllib.request,"urlopen",side_effect=responses) as opened:
                    m.main()
                self.assertEqual(opened.call_count,2 if fresh=="1" else 0)
                self.assertEqual(put.call_count,1 if fresh=="1" else 0)
                self.assertNotIn("private source",output.getvalue())
    def test_identity_rejection_does_not_skip_other_filing(self):self.run_case("identity")
    def test_failed_database_write_does_not_skip_later_filing(self):self.run_case("database")
    def test_one_failed_catalog_does_not_skip_other_year(self):self.run_case(catalog_failure=True)

if __name__=="__main__":unittest.main()
