import io,json,unittest
from unittest.mock import Mock,patch
import r4_monitor_cache as cache
from r4_source_archive import canonical

class Missing(Exception):
    response={'Error':{'Code':'NoSuchKey'}}

class PrivateObjects:
    def __init__(self):self.objects={}
    def get_object(self,**args):
        if args['Key'] not in self.objects:raise Missing()
        return {'Body':io.BytesIO(self.objects[args['Key']])}
    def put_object(self,**args):
        if args['Key'] in self.objects:raise AssertionError('Immutable cache replacement')
        self.objects[args['Key']]=args['Body']

class MonitorCacheTests(unittest.TestCase):
    def setup_reader(self):
        reader=Mock();reader.readback.return_value={'equities':262,'total_slots':2096,'status_counts':{'QUALIFIED':2038},'unresolved':[],'period_ends':('2024-09-30',)}
        return reader,PrivateObjects(),object()
    def test_unchanged_exact_inputs_reuse_private_canonical_report(self):
        reader,client,connection=self.setup_reader()
        with patch.object(cache,'engine_revision',return_value='engine'),patch.object(cache,'input_fingerprint',return_value='inputs'):
            first=cache.snapshot_readback(reader,'db',client,connection)
            second=cache.snapshot_readback(reader,'db',client,connection)
        self.assertEqual(first,second);reader.readback.assert_called_once_with('db',connection=connection)
        self.assertEqual(len(client.objects),1)
        self.assertEqual(first['period_ends'],['2024-09-30'])
        self.assertEqual(reader.readback.return_value['period_ends'],('2024-09-30',))
    def test_changed_input_or_classifier_code_recomputes_canonical_owner(self):
        reader,client,connection=self.setup_reader()
        with patch.object(cache,'engine_revision',side_effect=['v1','v1','v2']),patch.object(cache,'input_fingerprint',side_effect=['a','b','b']):
            for _ in range(3):cache.snapshot_readback(reader,'db',client,connection)
        self.assertEqual(reader.readback.call_count,3);self.assertEqual(len(client.objects),3)
    def test_modified_cached_report_is_rejected(self):
        reader,client,connection=self.setup_reader()
        with patch.object(cache,'engine_revision',return_value='engine'),patch.object(cache,'input_fingerprint',return_value='inputs'):
            cache.snapshot_readback(reader,'db',client,connection)
            key=next(iter(client.objects));value=json.loads(client.objects[key]);value['report']['status_counts']['QUALIFIED']=2096
            client.objects[key]=canonical(value)
            with self.assertRaisesRegex(ValueError,'CACHE_UNPROVEN'):cache.snapshot_readback(reader,'db',client,connection)
        self.assertEqual(reader.readback.call_count,1)
    def test_failed_canonical_read_never_creates_cache(self):
        reader,client,connection=self.setup_reader();reader.readback.side_effect=ValueError('source unavailable')
        with patch.object(cache,'engine_revision',return_value='engine'),patch.object(cache,'input_fingerprint',return_value='inputs'):
            with self.assertRaises(ValueError):cache.snapshot_readback(reader,'db',client,connection)
        self.assertEqual(client.objects,{})
if __name__=='__main__':unittest.main()
