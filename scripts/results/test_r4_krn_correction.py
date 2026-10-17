import copy
import io
import json
from decimal import Decimal
import unittest
from unittest.mock import MagicMock
import fitz
import r4_krn_correction as correction

def notice():
    doc=fitz.open();page=doc.new_page()
    lines=["KRN HEAT EXCHANGER AND REFRIGERATION LIMITED","L29309RJ2017PLC058905","Script Symbol: KRN",
        "quarter and year ended 31st March, 2025","identified and corrected discrepancies",
        "revised and accurate XBRL","Acknowledgement","NATIONAL STOCK EXCHANGE OF INDIA",
        "received the submission for Integrated Filing - Financials 10-JUL-2025"]
    for i,line in enumerate(lines):page.insert_text((20,30+20*i),line,fontsize=8)
    return doc.tobytes()

def facts():
    rows=[]
    for sid,digest in correction.HASHES.items():
        values={"OPERATING_REVENUE_QUARTER":"131.5024","NET_PROFIT_QUARTER":"14.867",
            "EPS_DILUTED":"0" if sid in correction.OLD else "2.39"}
        for metric,value in values.items():
            rows.append({"symbol":"KRN","isin":"INE0Q3J01015","period_end":"2025-03-31",
                "consolidation_scope":"CONSOLIDATED","source_record_id":sid,"metric_code":metric,
                "numeric_value":Decimal(value),"source_url":correction.OLD_URL if sid in correction.OLD else correction.NEW_URL,
                "raw_payload":{"original_sha256_retained":digest}})
    return rows

class CorrectionTest(unittest.TestCase):
    def client(self,raw=None):
        raw=notice() if raw is None else raw
        digest=correction.sha256(raw).hexdigest()
        ref={"source_url":correction.NOTICE,"sha256":digest,
            "r2_key":correction.PREFIX+"evidence/original_version="+digest+"/issuer-correction.pdf"}
        client=MagicMock()
        client.get_object.side_effect=lambda **kwargs:{"Body":io.BytesIO(json.dumps(ref).encode() if kwargs["Key"]==correction.REFERENCE else raw)}
        return client

    def test_original_and_revised_source_with_actual_pdf_text_required(self):
        rows=facts();result,qualified=correction.qualify(rows,self.client())
        self.assertTrue(qualified);self.assertEqual(len(result),3);self.assertEqual(len(rows),6)
        self.assertTrue(all(r["source_record_id"] in correction.NEW for r in result))

    def test_missing_notice_fails_closed(self):
        client=MagicMock();client.get_object.side_effect=OSError("missing")
        rows=facts();result,qualified=correction.qualify(rows,client)
        self.assertFalse(qualified);self.assertEqual(result,rows)

    def test_non_pdf_and_unrelated_pdf_fail_closed(self):
        unrelated=fitz.open();unrelated.new_page().insert_text((20,30),"Unrelated issuer announcement")
        for raw in (b"not a PDF",b"%PDF-invalid",unrelated.tobytes()):
            rows=facts();result,qualified=correction.qualify(rows,self.client(raw))
            self.assertFalse(qualified);self.assertEqual(result,rows)

    def test_identity_hash_original_url_and_values_are_all_bound(self):
        for field,value in (("isin","OTHER"),("source_url",correction.NEW_URL),("numeric_value",Decimal("999"))):
            rows=facts();rows[0][field]=value
            self.assertFalse(correction.qualify(rows,self.client())[1])
        rows=facts();rows[0]["raw_payload"]["original_sha256_retained"]="0"*64
        self.assertFalse(correction.qualify(rows,self.client())[1])

    def test_other_period_and_scope_untouched(self):
        rows=facts();other=copy.deepcopy(rows[0]);other["period_end"]="2024-12-31"
        standalone=copy.deepcopy(rows[0]);standalone["consolidation_scope"]="STANDALONE"
        result,qualified=correction.qualify(rows+[other,standalone],self.client())
        self.assertTrue(qualified);self.assertIn(other,result);self.assertIn(standalone,result)

    def test_pdf_hash_readback_mismatch_fails_closed(self):
        raw=notice();client=self.client(raw)
        ref={"source_url":correction.NOTICE,"sha256":"0"*64,
            "r2_key":correction.PREFIX+"evidence/original_version="+"0"*64+"/issuer-correction.pdf"}
        client.get_object.side_effect=lambda **kwargs:{"Body":io.BytesIO(json.dumps(ref).encode() if kwargs["Key"]==correction.REFERENCE else raw)}
        self.assertFalse(correction.qualify(facts(),client)[1])

if __name__=="__main__":unittest.main()
