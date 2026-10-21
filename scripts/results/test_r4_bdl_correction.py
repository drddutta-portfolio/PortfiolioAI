import copy,io,unittest
from hashlib import sha256
from unittest.mock import patch
import fitz
import r4_bdl_correction as b

class BDLReconciliation(unittest.TestCase):
    def sample(self):
        xmls=(b'<xbrl>retained original one</xbrl>',b'<xbrl>retained original two</xbrl>')
        hashes=tuple(sha256(x).hexdigest() for x in xmls)
        with fitz.open() as pdf:
            pdf.new_page();page=pdf.new_page();page.insert_text((30,40),'Signed exact-quarter statement')
            raw=pdf.tobytes()
            image=page.get_pixmap(dpi=110,alpha=False).tobytes('jpeg',jpg_quality=65)
        ps=sha256(raw).hexdigest();ims=sha256(image).hexdigest()
        objects={b.PREFIX+'evidence/original_version='+h+'/original-xbrl.xml':x for h,x in zip(hashes,xmls)}
        objects[b.PREFIX+'evidence/original_version='+ps+'/issuer-original.pdf']=raw
        rows=[]
        for sid in sorted(b.OLD|b.NEW):
            old=sid in b.OLD
            for metric,value in (b.ORIGINAL if old else b.CORRECT).items():
                rows.append({'symbol':'BDL','isin':'INE171Z01026','source_record_id':sid,
                    'period_start':'2025-01-01','period_end':'2025-03-31','currency':'INR',
                    'consolidation_scope':'STANDALONE','source_url':b.OLD_URL if old else b.NEW_URL,
                    'raw_payload':{'original_sha256_retained':hashes[0 if old else 1]},
                    'metric_code':metric,'numeric_value':str(value),
                    'unit':'INR_PER_SHARE' if metric=='EPS_DILUTED' else 'INR_CRORE'})
        class Client:
            def get_object(self,*,Bucket,Key):
                if Bucket!=b.BUCKET:raise ValueError('WRONG_BUCKET')
                return {'Body':io.BytesIO(objects[Key])}
        return rows,Client(),objects,{'OLD_SHA':hashes[0],'NEW_SHA':hashes[1],'PDF_SHA':ps,'IMAGE_SHA':ims}

    def test_exact_signed_original_reconciles_without_mutating_observations(self):
        rows,client,objects,pins=self.sample();before=copy.deepcopy(rows)
        with patch.multiple(b,**pins):result,ok=b.qualify(rows,client)
        self.assertTrue(ok);self.assertEqual(len(result),6);self.assertEqual(rows,before)
        self.assertTrue(all(r['source_record_id'] in b.NEW for r in result))

    def test_changed_original_or_missing_statement_preserves_conflict(self):
        for corrupt in (False,True):
            rows,client,objects,pins=self.sample()
            key=b.PREFIX+'evidence/original_version='+pins['PDF_SHA']+'/issuer-original.pdf'
            if corrupt:objects[key]+=b'changed'
            else:del objects[key]
            with patch.multiple(b,**pins):result,ok=b.qualify(rows,client)
            self.assertFalse(ok);self.assertEqual(result,rows)

    def test_signed_page_image_must_also_match(self):
        rows,client,objects,pins=self.sample();pins['IMAGE_SHA']='0'*64
        with patch.multiple(b,**pins):result,ok=b.qualify(rows,client)
        self.assertFalse(ok);self.assertEqual(result,rows)

    def test_wrong_period_unit_currency_issuer_or_value_cannot_be_reconciled(self):
        for field,value in [('period_start','2024-04-01'),('unit','INR_LAKH'),('currency','USD'),('isin','OTHER'),('numeric_value','999')]:
            rows,client,objects,pins=self.sample();rows[0][field]=value
            with patch.multiple(b,**pins):result,ok=b.qualify(rows,client)
            self.assertFalse(ok,field);self.assertEqual(result,rows)

    def test_no_revised_complete_trio_no_override(self):
        rows,client,objects,pins=self.sample();rows=[r for r in rows if r['source_record_id']!=b.NEW_BRIDGE]
        with patch.multiple(b,**pins):result,ok=b.qualify(rows,client)
        self.assertFalse(ok);self.assertEqual(result,rows)

    def test_other_issuer_scope_and_quarters_are_untouched(self):
        rows,client,objects,pins=self.sample()
        extra={**rows[0],'symbol':'OTHER','numeric_value':'100'};rows.append(extra)
        with patch.multiple(b,**pins):result,ok=b.qualify(rows,client)
        self.assertTrue(ok);self.assertIn(extra,result)

if __name__=='__main__':unittest.main()
