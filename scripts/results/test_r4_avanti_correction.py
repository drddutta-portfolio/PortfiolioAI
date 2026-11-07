import io,unittest
from copy import deepcopy
from unittest.mock import patch
from decimal import Decimal
import fitz
import r4_avanti_correction as m

def xml(eps='2',revenue='10000000000',scope='Consolidated'):
    return ('''<xbrl xmlns="http://www.xbrl.org/2003/instance" xmlns:i="urn:issuer"><i:Symbol>AVANTIFEED</i:Symbol><i:ISIN>INE871C01038</i:ISIN><i:ScripCode>512573</i:ScripCode><i:NameOfTheCompany>AVANTI FEEDS LIMITED</i:NameOfTheCompany><i:NatureOfReportStandaloneConsolidated>'''+scope+'''</i:NatureOfReportStandaloneConsolidated><context id="OneD"><entity><identifier scheme="issuer">512573</identifier></entity><period><startDate>2025-10-01</startDate><endDate>2025-12-31</endDate></period></context><unit id="money"><measure>iso4217:INR</measure></unit><unit id="eps"><divide><unitNumerator><measure>iso4217:INR</measure></unitNumerator><unitDenominator><measure>xbrli:shares</measure></unitDenominator></divide></unit><i:RevenueFromOperations contextRef="OneD" unitRef="money">'''+revenue+'''</i:RevenueFromOperations><i:ProfitLossForPeriod contextRef="OneD" unitRef="money">500000000</i:ProfitLossForPeriod><i:DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations contextRef="OneD" unitRef="eps">'''+eps+'''</i:DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations></xbrl>''').encode()

def notice(eps='2',continuing='99',first_date='31.12.2025',statement='Other than the above, the Financial Results stand unchanged'):
    d=fitz.open();p=d.new_page(width=800,height=650)
    text=['AVANTI FEEDS LIMITED','February 12, 2026','BSE Code: 512573 NSE Symbol: AVANTIFEED','Minor Correction in the Consolidated financial results for December 31, 2025,','submitted on February 11, 2026. Inadvertent error crept in Earnings Per Share.',statement]
    for i,s in enumerate(text):p.insert_text((20,30+i*18),s,fontsize=9)
    p.insert_text((295,180),'Quarter ended',fontsize=10)
    for x,date in [(300,first_date),(430,'30.09.2025'),(560,'31.12.2024'),(690,'31.12.2025')]:p.insert_text((x,205),date,fontsize=10)
    for y,label,v in [(250,'For continuing operations',None),(275,'(b) Diluted (in Rs.)',continuing),(310,'For discontinued operations',None),(335,'(b) Diluted (in Rs.)','1'),(370,'For continuing &',None),(385,'discontinued operations',None),(410,'(a) Basic (in Rs.)',eps),(435,'(b) Diluted (in Rs.)',eps)]:
        p.insert_text((25,y),label,fontsize=10)
        if v is not None:
            for x in [315,445,575,705]:p.insert_text((x,y),v,fontsize=10)
    return d.tobytes()

class CorrectionTests(unittest.TestCase):
    def setup_case(self):
        old,new,pdf=xml('1'),xml('2'),notice()
        hashes={'OLD_SHA':m.digest(old),'NEW_SHA':m.digest(new),'NOTICE_SHA':m.digest(pdf)}
        raw={hashes['OLD_SHA']:old,hashes['NEW_SHA']:new,hashes['NOTICE_SHA']:pdf}
        facts=[]
        for sid,url,digest,eps in [('old',m.OLD_URL,hashes['OLD_SHA'],'1'),('new',m.NEW_URL,hashes['NEW_SHA'],'2')]:
            for metric,value in [('OPERATING_REVENUE_QUARTER','1000'),('NET_PROFIT_QUARTER','50'),('EPS_DILUTED',eps)]:
                facts.append({'symbol':m.SYMBOL,'isin':m.ISIN,'period_start':m.START,'period_end':m.PERIOD,'consolidation_scope':m.SCOPE,'source_record_id':sid,'source_url':url,'currency':'INR','unit':'INR_PER_SHARE' if metric=='EPS_DILUTED' else 'INR_CRORE','metric_code':metric,'numeric_value':Decimal(value),'raw_payload':{'contract':'PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1','original_sha256_unretained':digest}})
        class Client:
            def get_object(self,**kwargs):return {'Body':io.BytesIO(next(v for k,v in raw.items() if '/'+k+'/' in kwargs['Key'] or '='+k+'/' in kwargs['Key']))}
        return old,new,pdf,hashes,facts,Client()

    def test_notice_selects_total_operation_diluted_row_never_continuing_eps(self):
        self.assertEqual(m.notice_eps(notice()),Decimal('2'))
        self.assertEqual(m.notice_eps(notice(continuing='100')),Decimal('2'))

    def test_wrong_quarter_or_missing_unchanged_financial_statement_rejects(self):
        for raw in [notice(first_date='31.12.2024'),notice(statement='Other figures may change')]:
            with self.assertRaises(ValueError):m.notice_eps(raw)

    def test_originals_replay_exact_money_units_scope_identity_and_period(self):
        raw=xml()
        p=m.original_trio(raw,m.digest(raw));self.assertEqual(p['OPERATING_REVENUE_QUARTER'],Decimal('1000'))
        for bad in [xml(scope='Standalone'),raw.replace(b'2025-10-01',b'2025-04-01'),raw.replace(b'INE871C01038',b'INE000000000'),raw.replace(b'unitRef="money"',b'unitRef="eps"')]:
            with self.assertRaises(ValueError):m.original_trio(bad,m.digest(bad))
        with self.assertRaisesRegex(ValueError,'ORIGINAL_UNPROVEN'):m.original_trio(raw,'0'*64)

    def test_explicit_correction_omits_only_superseded_unselected_original(self):
        old,new,pdf,hashes,facts,client=self.setup_case();other={**facts[0],'symbol':'OTHER','source_record_id':'other'}
        with patch.multiple(m,**hashes):
            a,b=m.validate_originals(old,new,pdf);self.assertEqual(a['EPS_DILUTED'],1);self.assertEqual(b['EPS_DILUTED'],2)
            selected,ok=m.qualify(facts+[other],client)
        self.assertTrue(ok);self.assertEqual([r['source_record_id'] for r in selected],['new']*3+['other'])
        self.assertEqual(len(facts),6)

    def test_changed_non_eps_financials_do_not_use_eps_only_notice(self):
        old,new,pdf,hashes,_,_=self.setup_case();new=xml('2',revenue='20000000000');hashes['NEW_SHA']=m.digest(new)
        with patch.multiple(m,**hashes),self.assertRaisesRegex(ValueError,'DO_NOT_RECONCILE'):m.validate_originals(old,new,pdf)

    def test_mutated_facts_units_scopes_or_incomplete_trio_never_override_conflict(self):
        for field,value in [('numeric_value',Decimal('999')),('unit','INR_LAKH'),('period_start','2025-04-01'),('isin','OTHER')]:
            _,_,_,hashes,facts,client=self.setup_case();facts[0][field]=value
            with patch.multiple(m,**hashes):self.assertFalse(m.qualify(facts,client)[1])
        _,_,_,hashes,facts,client=self.setup_case()
        with patch.multiple(m,**hashes):self.assertFalse(m.qualify(facts[:-1],client)[1])

    def test_retained_notice_and_both_originals_are_mandatory(self):
        _,_,_,hashes,facts,client=self.setup_case()
        class Missing:
            def get_object(self,**kwargs):raise RuntimeError('missing evidence')
        with patch.multiple(m,**hashes):
            selected,ok=m.qualify(facts,Missing());self.assertFalse(ok);self.assertEqual(selected,facts)
        with patch.multiple(m,**{**hashes,'NOTICE_SHA':'0'*64}):self.assertFalse(m.qualify(facts,client)[1])

    def test_unknown_source_version_stays_in_conflict_pool(self):
        _,_,_,hashes,facts,client=self.setup_case();other={**facts[0],'source_record_id':'third','source_url':'https://other.example/original','numeric_value':Decimal('2000')}
        with patch.multiple(m,**hashes):selected,ok=m.qualify(facts+[other],client)
        self.assertTrue(ok);self.assertIn(other,selected)

if __name__=='__main__':unittest.main()
