import hashlib,io,json,unittest
from unittest.mock import MagicMock
from r4_private_inventory import reports,slots

class InventoryTest(unittest.TestCase):
    def test_merges_every_retained_original_without_dropping_newer_status(self):
        def report(status,sources):return {"companies":[{"symbol":"FIXTURE","results":[{"period":"2024-09-30","status":status,"sources":sources}]}]}
        a={"sha256":"a","original_r2_key":"a"};b={"sha256":"b","original_r2_key":"b"}
        result=slots([report("NEW",[a]),report("OLD",[a,b])])[("FIXTURE","2024-09-30")]
        self.assertEqual(result["status"],"NEW");self.assertEqual(result["sources"],[a,b])

    def test_paginates_and_hash_verifies_private_reports(self):
        raw=json.dumps({"companies":[]}).encode();digest=hashlib.sha256(raw).hexdigest();prefix="root/"
        key=prefix+"private-recovery-traces/sha256="+digest+"/bse.json"
        client=MagicMock();client.list_objects_v2.side_effect=[{"IsTruncated":True,"NextContinuationToken":"next"},{"Contents":[{"Key":key,"LastModified":1}]}]
        client.get_object.return_value={"Body":io.BytesIO(raw)}
        self.assertEqual(list(reports(client,"bucket",prefix)),[{"companies":[]}])
        self.assertEqual(client.list_objects_v2.call_args.kwargs["ContinuationToken"],"next")

    def test_tampered_trace_is_not_used(self):
        key="root/private-recovery-traces/sha256="+"0"*64+"/bse.json"
        client=MagicMock();client.list_objects_v2.return_value={"Contents":[{"Key":key,"LastModified":1}]}
        client.get_object.return_value={"Body":io.BytesIO(b'{"companies":[]}')}
        with self.assertRaisesRegex(RuntimeError,"HASH_OR_SIZE"):list(reports(client,"bucket","root/"))

    def test_company_failures_are_retained_for_every_requested_quarter(self):
        result=slots([{"companies":[{"symbol":"FIXTURE","error":"LOOKUP_FAILED","unresolved_periods":["2024-09-30","2024-12-31"]}]}])
        self.assertEqual(len(result),2);self.assertTrue(all(r["company_error"]=="LOOKUP_FAILED" for r in result.values()))

if __name__=="__main__":unittest.main()
