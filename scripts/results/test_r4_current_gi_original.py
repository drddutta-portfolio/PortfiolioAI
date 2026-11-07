import io,json,unittest
from copy import deepcopy
import r4_current_gi_original as m
from test_r4_avanti_correction import xml as nbfc_xml

def xml(scope='Standalone'):
    return (nbfc_xml(scope=scope).replace(b'AVANTIFEED',b'STARHEALTH').replace(b'INE871C01038',b'INE575P01011')
        .replace(b'AVANTI FEEDS LIMITED',b'STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED').replace(b'512573',b'543412')
        .replace(b'RevenueFromOperations',b'PremiumEarned').replace(b'ProfitLossForPeriod',b'ProfitLossAfterTax')
        .replace(b'DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations',b'BasicAndDilutedEPSAfterExtraordinaryItemsNetOfTaxExpenseForThePeriodNotToBeAnnualized'))

class CurrentGiTests(unittest.TestCase):
    def case(self):
        raw=xml();facts=m.extract(raw,'STARHEALTH','INE575P01011','2025-12-31','STANDALONE','STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED');digest=m.sha(raw)
        manifest={'contract':m.CONTRACT,'symbol':'STARHEALTH','isin':'INE575P01011','security_id':'security','issuer_name':'STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED','period_start':'2025-10-01','period_end':'2025-12-31','consolidation_scope':'STANDALONE','reporting_currency':'INR','issuer_filing_url':'https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_GI_123_WEB.xml','original_sha256_retained':digest,'original_r2_key':m.PREFIX+'evidence/original_version='+digest+'/original-xbrl.xml','raw_nse_bytes_retained':True,'original_xbrl_retained':True,'facts':facts}
        encoded=m.canonical(manifest);mh=m.sha(encoded);key=m.PREFIX+'security_id=INE575P01011/period_end=2025-12-31/source_version='+mh+'/manifest.json'
        payload={**manifest,'r2_key':key,'r2_manifest_sha256':mh};source={'source_record_id':'source','source_url':manifest['issuer_filing_url'],'raw_payload':payload,'payload_hash':m.sha(m.canonical(payload))}
        observations=[{'symbol':'STARHEALTH','isin':'INE575P01011','security_id':'security','period_start':'2025-10-01','period_end':'2025-12-31','consolidation_scope':'STANDALONE','source_code':'COMPANY_EXCHANGE_FILING','source_record_id':'source','currency':'INR','evidence_status':'AVAILABLE','metric_code':metric,'unit':f['unit'],'numeric_value':f['value']} for metric,f in facts.items()]
        objects={key:encoded,manifest['original_r2_key']:raw}
        class Client:
            def get_object(self,**kw):
                if kw['Bucket']!=m.BUCKET:raise ValueError('bucket')
                return {'Body':io.BytesIO(objects[kw['Key']])}
        return source,observations,Client(),objects
    def test_exact_retained_trio_independent_replay(self):
        s,o,c,_=self.case();result=m.qualify(s,o,c);self.assertEqual(result['facts']['NET_PREMIUM_EARNED_QUARTER']['value'],'1000');self.assertEqual(result['facts']['EPS_DILUTED']['value'],'2')
    def test_no_ytd_scope_or_identity_substitution(self):
        for raw in [xml().replace(b'2025-10-01',b'2025-04-01'),xml(scope='Consolidated'),xml().replace(b'INE575P01011',b'INE000000000')]:
            with self.assertRaises(ValueError):m.extract(raw,'STARHEALTH','INE575P01011','2025-12-31','STANDALONE','STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED')
    def test_only_explicit_structurally_qualified_units(self):
        with self.assertRaises(ValueError):m.extract(xml().replace(b'iso4217:INR',b'iso4217:USD'),'STARHEALTH','INE575P01011','2025-12-31','STANDALONE','STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED')
        raw=xml().replace(b'</xbrl>',b'<unit id="usd"><measure>iso4217:USD</measure></unit><i:PremiumEarned contextRef="OneD" unitRef="usd">999</i:PremiumEarned></xbrl>')
        facts=m.extract(raw,'STARHEALTH','INE575P01011','2025-12-31','STANDALONE','STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED');self.assertEqual(facts['NET_PREMIUM_EARNED_QUARTER']['original_values'],['10000000000'])
    def test_complete_canonical_trio_and_exact_values_required(self):
        s,o,c,_=self.case()
        with self.assertRaises(ValueError):m.qualify(s,o[:-1],c)
        for field,value in [('numeric_value','999'),('currency','USD'),('source_record_id','other'),('consolidation_scope','CONSOLIDATED'),('period_start','2025-04-01')]:
            changed=deepcopy(o);changed[0][field]=value
            with self.assertRaises(ValueError):m.qualify(s,changed,c)
    def test_mutated_private_original_or_manifest_rejected(self):
        for original in (True,False):
            s,o,c,objects=self.case();key=s['raw_payload']['original_r2_key' if original else 'r2_key'];objects[key]+=b' '
            with self.assertRaises(ValueError):m.qualify(s,o,c)
    def test_immutable_payload_hash_required(self):
        s,o,c,_=self.case();s['raw_payload']['facts']['EPS_DILUTED']['value']='999'
        with self.assertRaises(ValueError):m.qualify(s,o,c)
    def test_only_actual_gi_primary_origin(self):
        s,_,_,_=self.case();url=s['source_url'];self.assertTrue(m.origin(url))
        for bad in [url.replace('nsearchives.nseindia.com','example.com'),url+'?x=1',url.replace('GI_','INDAS_'),url.replace('https://','http://')]:self.assertFalse(m.origin(bad))
    def test_no_historical_window_relabel(self):
        with self.assertRaises(ValueError):m.extract(xml(),'STARHEALTH','INE575P01011','2024-12-31','STANDALONE','STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED')

if __name__=='__main__':unittest.main()
