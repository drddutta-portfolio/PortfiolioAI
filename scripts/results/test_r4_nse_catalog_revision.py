import io,json,unittest
from copy import deepcopy
from urllib.parse import urlencode
from decimal import Decimal
import r4_nse_catalog_revision as m
from test_r4_avanti_correction import xml

SID='11111111-1111-4111-8111-111111111111'
def html(eps='2',unit='Crores'):
    table=lambda rows:'<table>'+''.join('<tr>'+''.join('<td>'+c+'</td>' for c in row)+'</tr>' for row in rows)+'</table>'
    return (table([['NSE Symbol','AVANTIFEED'],['ISIN','INE871C01038'],['Name of company','AVANTI FEEDS LIMITED'],['Reporting type','Quarterly'],['Description of presentation currency','INR'],['Level of rounding used in financial results',unit]])+
      table([['Date of start of reporting period','01-10-2025'],['Date of end of reporting period','31-12-2025'],['Nature of report standalone or consolidated','Consolidated'],['Revenue from operations','1000'],['Total profit (loss) for period','50'],['Diluted earnings per share',eps]])).encode()

def fixture():
    objects={}
    def retain(raw,kind):
        r=m.ref(raw,kind);objects[r['r2_key']]=raw;return r
    def row(seq,revision):
        return {'symbol':'AVANTIFEED','qe_Date':'31-DEC-2025','consolidated':'Consolidated','type':'Integrated Filing- Financials','type_Sub':'Revision' if revision else 'Original','cmName':'AVANTI FEEDS LIMITED','smName':'AVANTI FEEDS LIMITED','seq_Id':str(seq),
            'creation_Date':'12-Feb-2026 10:00:00' if revision else '11-Feb-2026 10:00:00','revised_Date':'12-FEB-2026 09:59:59' if revision else None,'revision_Remark':'Corrected quarterly financial results and EPS' if revision else None,
            'xbrl':f'https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_{seq}_WEB.xml','ixbrl':f'https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_{seq}_WEB.html'}
    rows=[row(100,False),row(200,True)]
    proof={'contract':m.CONTRACT,'security_id':SID,'symbol':'AVANTIFEED','isin':'INE871C01038','period_end':'2025-12-31','scope':'CONSOLIDATED','issuer_name':'AVANTI FEEDS LIMITED','captured_at_utc':'2026-11-07T06:00:00+00:00',
        'catalog_url':m.BASE+'?'+urlencode({'index':'equities','symbol':'AVANTIFEED','type':'Integrated Filing- Financials','page':1,'size':100,'from_date':'01-01-2025','to_date':'07-11-2026'}),
        'catalog':retain(m.canonical(rows),'catalog'),'revised_originals':{},'source_records':[]}
    proof['revised_originals']={'xbrl':{**retain(xml('2'),'xml'),'source_url':rows[1]['xbrl']},'ixbrl':{**retain(html('2'),'html'),'source_url':rows[1]['ixbrl']}}
    facts=[]
    for sid,row,eps in [('old',rows[0],'1'),('new',rows[1],'2')]:
        reference=retain(html(eps),'html');proof['source_records'].append({'source_record_id':sid,'source_url':row['ixbrl'],'source_contract':'PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1','recorded_original_sha256':reference['sha256'],'snapshot_basis':'EXACT_ORIGINAL_BYTES','original_bytes_previously_retained':False,**reference})
        for metric,value in [('OPERATING_REVENUE_QUARTER','1000'),('NET_PROFIT_QUARTER','50'),('EPS_DILUTED',eps)]:
            facts.append({'security_id':SID,'symbol':'AVANTIFEED','isin':proof['isin'],'period_end':proof['period_end'],'period_start':'2025-10-01','consolidation_scope':proof['scope'],'source_record_id':sid,'source_url':row['ixbrl'],'metric_code':metric,'numeric_value':Decimal(value),'currency':'INR','unit':'INR_PER_SHARE' if metric=='EPS_DILUTED' else 'INR_CRORE','raw_payload':{'contract':'PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1','original_sha256_unretained':reference['sha256'],'raw_nse_bytes_retained':False}})
    class Client:
        def get_object(self,**kw):return {'Body':io.BytesIO(objects[kw['Key']])}
    index={k:proof[k] for k in ('contract','security_id','symbol','isin','period_end','scope')};index['proof']=retain(m.canonical(proof),'proof')
    return proof,rows,objects,Client(),facts,{'raw_payload':index,'payload_hash':m.sha(m.canonical(index))},retain

class DeclaredRevisionTests(unittest.TestCase):
    def test_explicit_revision_replays_both_formats_and_only_retires_proven_old_rows(self):
        p,_,_,client,facts,index,_=fixture();vectors,old,new,_=m.validate_proof(p,client)
        self.assertEqual(old,{'old'});self.assertEqual(new,{'new'})
        selected,accepted,errors=m.qualify(facts,[index],client)
        self.assertEqual(errors,{});self.assertEqual(accepted,{'new'});self.assertEqual([r['source_record_id'] for r in selected],['new']*3);self.assertEqual(len(facts),6)

    def test_a_later_original_is_never_a_revision(self):
        p,rows,_,_,_,_,_=fixture();rows[1]['type_Sub']='Original'
        with self.assertRaisesRegex(ValueError,'SINGLE_ORIGINAL_CHAIN'):m.catalog_group(m.canonical(rows),p)

    def test_missing_explicit_reason_or_revision_event_cannot_supersede(self):
        for field,value in [('revision_Remark',None),('revision_Remark','  '),('revised_Date',None),('revised_Date','13-Feb-2026 10:00:00')]:
            p,rows,_,_,_,_,_=fixture();rows[1][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):m.catalog_group(m.canonical(rows),p)

    def test_wrong_issuer_quarter_scope_or_original_link_is_not_corroboration(self):
        for field,value in [('cmName','OTHER ISSUER LIMITED'),('seq_Id','999'),('ixbrl','https://evil.example/source.html')]:
            p,rows,_,_,_,_,_=fixture();rows[1][field]=value
            with self.assertRaises(ValueError):m.catalog_group(m.canonical(rows),p)
        p,rows,_,_,_,_,_=fixture();p['scope']='STANDALONE'
        with self.assertRaises(ValueError):m.catalog_group(m.canonical(rows),p)

    def test_catalog_page_completeness_and_unique_revision_chain_are_required(self):
        p,rows,_,_,_,_,_=fixture()
        for bad in [rows*50,rows+[rows[-1]],list(reversed([rows[0],{**rows[1],'creation_Date':rows[0]['creation_Date']}]))]:
            with self.assertRaises(ValueError):m.catalog_group(m.canonical(bad),p)
        p['catalog_url']=p['catalog_url'].replace('size=100','size=10')
        with self.assertRaisesRegex(ValueError,'COMPLETE_CATALOG'):m.catalog_group(m.canonical(rows),p)

    def test_xml_and_html_must_agree_exactly_without_tolerance_or_scale_guess(self):
        p,_,_,client,_,_,retain=fixture();p['revised_originals']['ixbrl']={**retain(html('3'),'html'),'source_url':p['revised_originals']['ixbrl']['source_url']}
        with self.assertRaisesRegex(ValueError,'TRIOS_DISAGREE'):m.validate_proof(p,client)

    def test_xml_requires_exact_identity_scope_duration_context_and_units(self):
        p,_,_,_,_,_,_=fixture();raw=xml('2')
        for bad in [raw.replace(b'2025-10-01',b'2025-04-01'),raw.replace(b'Consolidated',b'Standalone'),raw.replace(b'INE871C01038',b'INE000000000'),raw.replace(b'unitRef="money"',b'unitRef="eps"'),raw.replace(b'<identifier scheme="issuer">512573',b'<identifier scheme="issuer">OTHER')]:
            with self.assertRaises(ValueError):m.xml_trio(bad,p)
        self.assertEqual(m.xml_trio(raw.replace(b'<identifier scheme="issuer">512573',b'<identifier scheme="issuer">AVANTIFEED'),p)['EPS_DILUTED'],Decimal('2'))

    def test_share_product_is_not_eps_and_naive_capture_is_not_utc(self):
        p,rows,_,_,_,_,_=fixture();raw=xml('2')
        wrong=raw.replace(b'<divide><unitNumerator><measure>iso4217:INR</measure></unitNumerator><unitDenominator><measure>xbrli:shares</measure></unitDenominator></divide>',b'<measure>iso4217:INR</measure><measure>xbrli:shares</measure>')
        with self.assertRaises(ValueError):m.xml_trio(wrong,p)
        p['captured_at_utc']='2026-11-07T06:00:00'
        with self.assertRaises(ValueError):m.catalog_group(m.canonical(rows),p)

    def test_one_bad_proof_does_not_block_an_independent_valid_proof(self):
        _,_,_,client,facts,index,_=fixture();bad=deepcopy(index);bad['payload_hash']='0'*64
        selected,new,errors=m.qualify(facts,[bad,index],client)
        self.assertEqual(new,{'new'});self.assertEqual(len(selected),3);self.assertEqual(errors['NSE_REVISION_INDEX_HASH_UNPROVEN'],1)

    def test_missing_originals_or_changed_bytes_leave_all_source_facts_unchanged(self):
        p,_,objects,client,facts,index,_=fixture();objects[p['revised_originals']['xbrl']['r2_key']]=b'changed'
        selected,new,errors=m.qualify(facts,[index],client)
        self.assertEqual(selected,facts);self.assertEqual(new,set());self.assertTrue(errors)

    def test_candidate_values_and_context_must_match_the_exact_original(self):
        for field,value in [('numeric_value',Decimal('999')),('currency','USD'),('unit','INR_LAKH'),('isin','OTHER'),('period_start','2025-04-01')]:
            _,_,_,client,facts,index,_=fixture();facts[0][field]=value
            selected,new,errors=m.qualify(facts,[index],client)
            self.assertEqual(selected,facts);self.assertEqual(new,set());self.assertTrue(errors)

    def test_incomplete_trios_and_unknown_source_versions_remain_unresolved(self):
        _,_,_,client,facts,index,_=fixture();selected,new,errors=m.qualify(facts[:-1],[index],client)
        self.assertEqual(selected,facts[:-1]);self.assertEqual(new,set());self.assertTrue(errors)
        _,_,_,client,facts,index,_=fixture();unknown={**facts[0],'source_record_id':'unknown','source_url':'https://other.example/source'}
        selected,new,_=m.qualify(facts+[unknown],[index],client)
        self.assertIn(unknown,selected);self.assertEqual(new,{'new'})

    def test_fresh_rendition_preserves_earlier_hash_and_requires_exact_financial_replay(self):
        p,_,_,client,facts,index,retain=fixture()
        source=p['source_records'][0];earlier=source['recorded_original_sha256']
        source.update(retain(html('1')+b'<!-- fresh exchange rendition -->','html'))
        source['snapshot_basis']='FRESH_EXCHANGE_RENDITION_FINANCIAL_TRIO_REPLAY'
        index['raw_payload']['proof']=retain(m.canonical(p),'proof');index['payload_hash']=m.sha(m.canonical(index['raw_payload']))
        selected,new,errors=m.qualify(facts,[index],client)
        self.assertEqual(new,{'new'});self.assertEqual(errors,{})
        self.assertEqual(facts[0]['raw_payload']['original_sha256_unretained'],earlier)
        self.assertNotEqual(earlier,source['sha256'])
        source['original_bytes_previously_retained']=True
        with self.assertRaisesRegex(ValueError,'RENDITION_BASIS'):m.validate_proof(p,client)

    def test_changed_fresh_financial_values_cannot_be_called_equivalent_to_old_capture(self):
        p,_,_,client,facts,index,retain=fixture();source=p['source_records'][0]
        source.update(retain(html('3'),'html'));source['snapshot_basis']='FRESH_EXCHANGE_RENDITION_FINANCIAL_TRIO_REPLAY'
        index['raw_payload']['proof']=retain(m.canonical(p),'proof');index['payload_hash']=m.sha(m.canonical(index['raw_payload']))
        selected,new,errors=m.qualify(facts,[index],client)
        self.assertEqual(new,set());self.assertEqual(selected,facts);self.assertTrue(errors)

    def test_byte_hash_difference_never_silently_uses_rendition_mode(self):
        p,_,_,client,_,_,retain=fixture();source=p['source_records'][0]
        source.update(retain(html('1')+b'<!-- changed bytes -->','html'))
        with self.assertRaisesRegex(ValueError,'EXACT_ORIGINAL_VERSION_CHANGED'):m.validate_proof(p,client)

    def test_non_canonical_catalog_url_or_reference_cannot_authorize(self):
        p,rows,_,_,_,_,_=fixture();p['catalog_url']=p['catalog_url'].replace('www.nseindia.com','evil.example')
        with self.assertRaises(ValueError):m.catalog_group(m.canonical(rows),p)
        _,_,_,client,facts,index,_=fixture();index['raw_payload']['proof']['r2_key']='other/key';index['payload_hash']=m.sha(m.canonical(index['raw_payload']))
        self.assertFalse(m.qualify(facts,[index],client)[1])

if __name__=='__main__':unittest.main()
