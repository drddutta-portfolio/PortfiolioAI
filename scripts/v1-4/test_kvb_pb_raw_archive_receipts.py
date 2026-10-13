import unittest
import io
import hashlib
import calendar
import zipfile
from botocore.exceptions import ClientError
from kvb_pb_raw_archive_receipts import extract, PREFIX

def digest(body): return hashlib.sha256(body).hexdigest()
def zipped(member, content, repack=False):
    buffer=io.BytesIO()
    with zipfile.ZipFile(buffer,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(member,content)
        if repack: archive.comment=b'Preserved NSE repack; exact original CSV'
    return buffer.getvalue()
class FakeS3:
    def __init__(self,objects,denied=None): self.objects=objects;self.denied=denied;self.requests=[]
    def get_object(self,*,Bucket,Key):
        self.requests.append(Key)
        if Key==self.denied: raise ClientError({'Error':{'Code':'AccessDenied'}},'GetObject')
        if Key not in self.objects: raise ClientError({'Error':{'Code':'NoSuchKey'}},'GetObject')
        return {'Body':io.BytesIO(self.objects[Key])}
def fixtures(repack=False):
    archives=[];objects={}
    for i in range(36):
        ordinal=2023*12+9+i;y,m=divmod(ordinal,12);date=f'{y}-{m+1:02}-{calendar.monthrange(y,m+1)[1]:02}';member=f'nse-{date}.csv';file=member+'.zip'
        csv=('ISIN,SERIES,SYMBOL,TIMESTAMP,CLOSE\nINE036D01028,EQ,KARURVYSYA,'+date+',321.1000\n').encode()
        original=zipped(member,csv);transport=zipped(member,csv,repack=repack)
        archives.append({'id':f'archive-{i}','source_period_start':date,'source_file_name':file,'raw_metadata':{'csv_member':member},'content_sha256':digest(csv),'compressed_sha256':digest(original)})
        objects[f'{PREFIX}/content/trade_date={date}/{member}']=csv
        folder='repacked-zip/' if repack else ''
        objects[f'{PREFIX}/{folder}trade_date={date}/{file}']=transport
    return archives,objects
class RawArchiveTransport(unittest.TestCase):
    def test_original_transport_must_match_catalog_hash(self):
        archives,objects=fixtures();r=extract(FakeS3(objects),'portfolioai-history-dev',archives)
        self.assertEqual(len(r),36);self.assertTrue(all(x['transportRepresentation']=='ORIGINAL_HASH_MATCH' for x in r))
        self.assertTrue(all(x['actualCompressedSha256']==x['catalogCompressedSha256'] for x in r))
    def test_missing_original_reuses_only_known_repack_with_exact_csv(self):
        archives,objects=fixtures(repack=True);client=FakeS3(objects);r=extract(client,'portfolioai-history-dev',archives)
        self.assertEqual(len(r),36);self.assertTrue(all(x['transportRepresentation']=='REPACKED_EXACT_CSV_CONTENT_MATCH' for x in r))
        self.assertTrue(all(x['actualCompressedSha256']!=x['catalogCompressedSha256'] for x in r))
        self.assertTrue(all('/repacked-zip/' in x['r2CompressedKey'] for x in r))
        self.assertEqual(len(client.requests),108)
    def test_existing_wrong_original_does_not_fall_back(self):
        archives,objects=fixtures();a=archives[0];key=f"{PREFIX}/trade_date={a['source_period_start']}/{a['source_file_name']}";objects[key]=objects[key]+b'changed'
        with self.assertRaisesRegex(ValueError,'R2_ORIGINAL_HASH_CONFLICT'):extract(FakeS3(objects),'portfolioai-history-dev',archives)
    def test_tampered_repack_csv_fails_even_when_catalog_csv_exists(self):
        archives,objects=fixtures(repack=True);a=archives[0];key=f"{PREFIX}/repacked-zip/trade_date={a['source_period_start']}/{a['source_file_name']}";csv=objects[f"{PREFIX}/content/trade_date={a['source_period_start']}/{a['raw_metadata']['csv_member']}"]
        objects[key]=zipped(a['raw_metadata']['csv_member'],csv.replace(b'321.1000',b'999.1000'),True)
        with self.assertRaisesRegex(ValueError,'R2_CSV_ZIP_BYTES_CONFLICT'):extract(FakeS3(objects),'portfolioai-history-dev',archives)
    def test_missing_both_and_access_denied_produce_sanitized_dated_errors(self):
        archives,objects=fixtures(repack=True);a=archives[0];key=f"{PREFIX}/repacked-zip/trade_date={a['source_period_start']}/{a['source_file_name']}";del objects[key]
        with self.assertRaisesRegex(ValueError,'R2_COMPRESSED_ORIGINAL_AND_REPACK_MISSING:2023-10-31'):extract(FakeS3(objects),'portfolioai-history-dev',archives)
        original=f"{PREFIX}/trade_date={a['source_period_start']}/{a['source_file_name']}"
        with self.assertRaisesRegex(ValueError,'R2_COMPRESSED_READ_FAILED:2023-10-31'):extract(FakeS3(objects,denied=original),'portfolioai-history-dev',archives)
    def test_catalog_keys_cannot_escape_fixed_prefix(self):
        for field,value in [('source_file_name','../private.zip'),('source_period_start','2023-02-31')]:
            archives,objects=fixtures();archives[0][field]=value;client=FakeS3(objects)
            with self.assertRaises(ValueError):extract(client,'portfolioai-history-dev',archives)
            self.assertEqual(client.requests,[])
if __name__=='__main__':unittest.main()
