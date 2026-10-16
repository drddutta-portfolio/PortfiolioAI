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
    def test_identity_rejection_does_not_skip_other_filing(self):self.run_case("identity")
    def test_failed_database_write_does_not_skip_later_filing(self):self.run_case("database")
    def test_one_failed_catalog_does_not_skip_other_year(self):self.run_case(catalog_failure=True)

if __name__=="__main__":unittest.main()
