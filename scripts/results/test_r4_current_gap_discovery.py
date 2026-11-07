import tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from r4_current_gap_discovery import plan_requests,run

class CurrentDiscoveryTests(unittest.TestCase):
    def test_every_exact_slot_gets_two_bounded_searches_without_relative_quarters(self):
        rows=[('id-a','MGL','ISIN-a','2026-03-31','provider-a'),('id-b','YATRA','ISIN-b','2026-03-31','provider-b')]
        tasks,blocked=plan_requests(rows)
        self.assertEqual(len(tasks),4);self.assertEqual(blocked,[])
        self.assertEqual(len({x[0] for x in tasks}),4)
        self.assertTrue(all('31 March 2026' in x[4]['query'] for x in tasks))
        self.assertIn('Mahanagar Gas Limited',tasks[0][4]['query'])
        self.assertEqual({x[1] for x in tasks},{'id-a','id-b'})

    def test_unmatched_provider_identity_is_explicitly_blocked_never_guessed(self):
        tasks,blocked=plan_requests([('id','BDL','ISIN','2025-09-30',None)])
        self.assertEqual(tasks,[]);self.assertEqual(blocked[0]['reason'],'EXACT_PROVIDER_IDENTITY_UNRESOLVED')

    def test_duplicate_projection_is_idempotent_but_conflicting_identities_reject(self):
        row=('id','MGL','ISIN','2026-03-31','provider')
        self.assertEqual(len(plan_requests([row,row])[0]),2)
        with self.assertRaisesRegex(ValueError,'CONFLICTING_IDENTITY'):plan_requests([row,('id','MGL','OTHER','2026-03-31','provider')])

    def test_historical_annual_or_unknown_period_cannot_be_relabelled_current(self):
        for period in ['2024-12-31','2026-04-30',None]:
            with self.assertRaisesRegex(ValueError,'EXACT_PERIOD'):plan_requests([('id','MGL','ISIN',period,'provider')])

    def test_one_failed_provider_request_still_attempts_all_other_slots(self):
        rows=[('a','MGL','ISIN-a','2026-03-31','p'),('b','YATRA','ISIN-b','2026-03-31','q')];attempts=[];retained=[]
        def call(request,tool,args,sid):
            attempts.append(sid)
            if len(attempts)==1:raise RuntimeError('source failed')
        class DB:
            def rollback(self):pass
        batch=SimpleNamespace(PREFIX='private/',canonical=lambda x:__import__('json').dumps(x).encode(),sha=lambda x:__import__('hashlib').sha256(x).hexdigest(),immutable_put=lambda *args:retained.append(args))
        with tempfile.TemporaryDirectory() as tmp,patch('r4_current_gap_discovery.pending_current',return_value=rows):
            with self.assertRaisesRegex(RuntimeError,'PARTIAL_BATCH'):run(DB(),call,{'get_document_search_results':{}},object(),batch,Path(tmp))
            self.assertTrue((Path(tmp)/'current-corrections-report.json').exists())
        self.assertEqual(attempts,['a','a','b','b']);self.assertEqual(len(retained),4)

if __name__=='__main__':unittest.main()
