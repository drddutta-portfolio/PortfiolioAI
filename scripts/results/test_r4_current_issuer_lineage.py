import io,unittest
from copy import deepcopy
import r4_current_issuer_lineage as m
from test_r4_avanti_correction import xml

def case():
    raw=xml().replace(b'INE871C01038',b'INE871C01012');url='https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_123_WEB.xml'
    metadata={'symbol':'AVANTIFEED','qe_Date':'31-DEC-2025','seq_Id':'123','smName':'AVANTI FEEDS LIMITED','cmName':'AVANTI FEEDS LIMITED','xbrl':url,'consolidated':'Consolidated'}
    header={'SecurityCode':'512573','ISIN':'INE871C01038'};listing={'SCRIP_CD':'512573','ISIN_NUMBER':'INE871C01038','Issuer_Name':'AVANTI FEEDS LIMITED'}
    bridge=m.bridge_from_sources(raw,metadata,'AVANTIFEED','INE871C01038',header,listing);facts=m.extract(raw,'AVANTIFEED','INE871C01038','2025-12-31','CONSOLIDATED','AVANTI FEEDS LIMITED',bridge);digest=m.sha(raw)
    identity={'nse_catalog_record':metadata,'bse_header':header,'bse_listing':listing,'nse_original_sha256':digest};encoded_identity=m.canonical(identity);ih=m.sha(encoded_identity);ik=m.PREFIX+'evidence/source_version='+ih+'/exchange-issuer-identity.json'
    manifest={'contract':m.CONTRACT,'symbol':'AVANTIFEED','isin':'INE871C01038','security_id':'security','issuer_name':'AVANTI FEEDS LIMITED','period_start':'2025-10-01','period_end':'2025-12-31','consolidation_scope':'CONSOLIDATED','reporting_currency':'INR','issuer_filing_url':url,'original_sha256_retained':digest,'original_r2_key':m.PREFIX+'evidence/original_version='+digest+'/original-xbrl.xml','raw_nse_bytes_retained':True,'original_xbrl_retained':True,'facts':facts,'issuer_bridge':bridge.payload(),'issuer_identity_evidence_sha256':ih,'issuer_identity_evidence_r2_key':ik}
    encoded=m.canonical(manifest);mh=m.sha(encoded);key=m.PREFIX+'security_id=INE871C01038/period_end=2025-12-31/source_version='+mh+'/manifest.json';payload={**manifest,'r2_key':key,'r2_manifest_sha256':mh};source={'source_record_id':'source','source_url':url,'raw_payload':payload,'payload_hash':m.sha(m.canonical(payload))}
    observations=[{'symbol':'AVANTIFEED','isin':'INE871C01038','security_id':'security','period_start':'2025-10-01','period_end':'2025-12-31','consolidation_scope':'CONSOLIDATED','source_code':'COMPANY_EXCHANGE_FILING','source_record_id':'source','currency':'INR','evidence_status':'AVAILABLE','metric_code':k,'unit':f['unit'],'numeric_value':f['value']} for k,f in facts.items()];objects={key:encoded,manifest['original_r2_key']:raw,ik:encoded_identity}
    class Client:
        def get_object(self,**kw):return {'Body':io.BytesIO(objects[kw['Key']])}
    return source,observations,Client(),objects,raw,bridge

class CurrentLineageTests(unittest.TestCase):
    def test_exact_issuer_lineage_preserves_original_isin_and_eps(self):
        s,o,c,_,_,b=case();result=m.qualify(s,o,c);self.assertEqual(result['issuer_bridge']['xml_reported_isin'],'INE871C01012');self.assertEqual(result['facts']['EPS_DILUTED']['value'],'2');self.assertIn('COMPARABILITY_UNPROVEN',b.share_basis)
    def test_both_bse_endpoints_must_tie_code_to_canonical_isin(self):
        _,_,_,_,raw,_=case();meta={'symbol':'AVANTIFEED','companyName':'AVANTI FEEDS LIMITED','xbrl':'https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_123_WEB.xml'}
        for h,l in [({'SecurityCode':'999999','ISIN':'INE871C01038'},{'SCRIP_CD':'512573','ISIN_NUMBER':'INE871C01038','Issuer_Name':'AVANTI FEEDS LIMITED'}),({'SecurityCode':'512573','ISIN':'INE871C01038'},{'SCRIP_CD':'512573','ISIN_NUMBER':'OTHER','Issuer_Name':'AVANTI FEEDS LIMITED'})]:
            with self.assertRaises(ValueError):m.bridge_from_sources(raw,meta,'AVANTIFEED','INE871C01038',h,l)
    def test_raw_quarter_scope_and_structural_currency_fail_closed(self):
        _,_,_,_,raw,b=case()
        for bad in [raw.replace(b'2025-10-01',b'2025-04-01'),raw.replace(b'Consolidated',b'Standalone'),raw.replace(b'iso4217:INR',b'iso4217:USD')]:
            with self.assertRaises(ValueError):m.extract(bad,'AVANTIFEED','INE871C01038','2025-12-31','CONSOLIDATED','AVANTI FEEDS LIMITED',b)
    def test_canonical_trio_exact_and_complete(self):
        s,o,c,_,_,_=case()
        with self.assertRaises(ValueError):m.qualify(s,o[:-1],c)
        for f,v in [('numeric_value','999'),('currency','USD'),('source_record_id','other'),('period_start','2025-04-01')]:
            changed=deepcopy(o);changed[0][f]=v
            with self.assertRaises(ValueError):m.qualify(s,changed,c)
    def test_identity_manifest_and_original_bytes_immutable(self):
        s,o,c,objects,_,_=case()
        for k in objects:
            old=objects[k];objects[k]+=b' '
            with self.assertRaises(ValueError):m.qualify(s,o,c)
            objects[k]=old
    def test_reused_identity_requires_exact_retained_prior_bytes(self):
        import json
        s,o,c,objects,_,_=case();p=s['raw_payload'];old_key=p['issuer_identity_evidence_r2_key'];old_hash=p['issuer_identity_evidence_sha256'];identity=json.loads(objects[old_key]);identity['reused_bse_identity_reference']={'sha256':old_hash,'r2_key':old_key};body=m.canonical(identity);ih=m.sha(body);ik=m.PREFIX+'evidence/source_version='+ih+'/exchange-issuer-identity.json';objects[ik]=body
        manifest={k:v for k,v in p.items() if k not in ('r2_key','r2_manifest_sha256')};manifest.update(issuer_identity_evidence_sha256=ih,issuer_identity_evidence_r2_key=ik);encoded=m.canonical(manifest);mh=m.sha(encoded);key=m.PREFIX+'security_id=INE871C01038/period_end=2025-12-31/source_version='+mh+'/manifest.json';objects[key]=encoded;s['raw_payload']={**manifest,'r2_key':key,'r2_manifest_sha256':mh};s['payload_hash']=m.sha(m.canonical(s['raw_payload']))
        self.assertEqual(m.qualify(s,o,c)['facts']['EPS_DILUTED']['value'],'2')
        objects[old_key]+=b' '
        with self.assertRaisesRegex(ValueError,'REUSED_BYTES'):m.qualify(s,o,c)

    def test_no_historical_relabel(self):
        _,_,_,_,raw,b=case()
        with self.assertRaises(ValueError):m.extract(raw,'AVANTIFEED','INE871C01038','2024-12-31','CONSOLIDATED','AVANTI FEEDS LIMITED',b)
    def test_no_arbitrary_origin(self):
        s,_,_,_,_,_=case();self.assertTrue(m.origin(s['source_url']));self.assertFalse(m.origin(s['source_url'].replace('nsearchives.nseindia.com','example.com')))

if __name__=='__main__':unittest.main()
