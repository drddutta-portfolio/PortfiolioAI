import importlib.util
from pathlib import Path
import unittest
import re
import time

from r4_recovery_queue import native_shard_for,run_with_timeout,SOURCES,attempt_all,task_id,next_source,dispatched,dispatch_failed,observe_completed

spec=importlib.util.spec_from_file_location("monitor",Path(__file__).with_name("r4-recovery-monitor.py"))
monitor=importlib.util.module_from_spec(spec);spec.loader.exec_module(monitor)

class RecoveryTest(unittest.TestCase):
    def test_native_partition_covers_every_security_once(self):
        securities=[str(i) for i in range(262)]
        groups=[{s for s in securities if native_shard_for(s,4)==n} for n in range(4)]
        self.assertEqual(set.union(*groups),set(securities))
        self.assertEqual(sum(map(len,groups)),262)
        self.assertTrue(all(groups))
        for i,one in enumerate(groups):
            for two in groups[i+1:]:self.assertFalse(one&two)

    def test_legacy_unsharded_native_call_and_invalid_counts(self):
        self.assertEqual(native_shard_for("issuer",1),0)
        for invalid in (0,-1,17):
            with self.assertRaises(ValueError):native_shard_for("issuer",invalid)

    def test_partial_provider_pass_retries_without_waiting_a_day(self):
        state={};source=SOURCES[-1];dispatched(state,source,100)
        observe_completed(state,source,{"id":1,"conclusion":"failure"},200)
        self.assertEqual(state[source]["not_before"],2000)
        observe_completed(state,source,{"id":1,"conclusion":"failure"},300)
        self.assertEqual(state[source]["not_before"],2000)
        self.assertEqual(state[source]["consecutive_failures"],1)

    def test_repeated_source_failures_back_off_and_success_resets(self):
        state={};source=SOURCES[-1]
        for index in range(1,5):
            dispatched(state,source,index*100)
            observe_completed(state,source,{"id":index,"conclusion":"failure"},index*100+10)
        self.assertEqual(state[source]["not_before"],410+21600)
        observe_completed(state,source,{"id":5,"conclusion":"success"},500)
        self.assertEqual(state[source]["consecutive_failures"],0)

    def test_native_worker_returns_verified_parser_output(self):
        self.assertEqual(run_with_timeout(int,("7",),5),7)

    def test_native_worker_preserves_validation_rejection(self):
        with self.assertRaises(ValueError):run_with_timeout(int,("invalid",),5)

    def test_native_worker_timeout_does_not_block_next_item(self):
        with self.assertRaises(TimeoutError):run_with_timeout(time.sleep,(60,),0.1)
        self.assertEqual(run_with_timeout(int,("8",),5),8)

    def test_workflow_output_references_have_a_defining_step(self):
        root=Path(__file__).resolve().parents[2]/".github"/"workflows"
        for path in root.glob("results-r4-*.yml"):
            content=path.read_text()
            identifiers=set(re.findall(r"^\s+id:\s+([\w-]+)\s*$",content,re.M))
            references=set(re.findall(r"steps\.([\w-]+)\.outputs\.",content))
            self.assertTrue(references.issubset(identifiers),(str(path),references-identifiers))

    def test_bad_filing_does_not_skip_other_filings(self):
        visited=[];saved=[]
        def process(item):
            visited.append(item)
            if item=="bad":raise OSError("404")
            return "ok"
        attempt_all(["bad","good","later-quarter"],process,
                    lambda item,error:"retry",lambda item,result:saved.append((item,result)))
        self.assertEqual(visited,["bad","good","later-quarter"])
        self.assertEqual(saved,[("bad","retry"),("good","ok"),("later-quarter","ok")])

    def test_checkpoint_failure_is_not_swallowed(self):
        with self.assertRaises(OSError):
            attempt_all([1,2],lambda item:True,lambda item,error:False,
                        lambda item,result:(_ for _ in ()).throw(OSError("checkpoint failed")))

    def test_request_assignment_survives_removing_other_company(self):
        first=task_id("a","documents","2024-09-30",{"q":"A"})
        second=task_id("b","documents","2024-09-30",{"q":"B"})
        before={key:int(key,16)%16 for key in [first,second]}
        self.assertEqual(before[second],int(second,16)%16)
        self.assertEqual(task_id("b","documents","2024-09-30",{"b":2,"a":1}),
                         task_id("b","documents","2024-09-30",{"a":1,"b":2}))
        self.assertNotEqual(second,task_id("b","documents","2024-12-31",{"q":"B"}))

    def test_no_progress_rotates_to_every_source(self):
        state={};runs={s:[] for s in SOURCES}
        selected=[]
        for _ in SOURCES:
            source=next_source(100,state,runs);selected.append(source);dispatched(state,source,100)
        self.assertEqual(tuple(selected),SOURCES)
        self.assertIsNone(next_source(101,state,runs))
        self.assertEqual(next_source(21700,state,runs),SOURCES[0])

    def test_provider_has_daily_cooldown(self):
        state={};dispatched(state,SOURCES[-1],100)
        runs={SOURCES[-1]:[]}
        self.assertIsNone(next_source(86500-1,state,runs))
        self.assertEqual(next_source(86500,state,runs),SOURCES[-1])

    def test_no_overlap_with_active_workflow(self):
        self.assertIsNone(next_source(100,{}, {SOURCES[0]:[{"status":"queued"}]}))

    def test_failed_dispatch_does_not_block_other_source(self):
        state={};dispatch_failed(state,SOURCES[0],100)
        self.assertEqual(next_source(100,state,{s:[] for s in SOURCES}),SOURCES[1])

    def report(self,count=119):
        return {"equities":262,"total_slots":2096,"status_counts":{"QUALIFIED":1959},
                "unresolved":[{"period_end":"2024-09-30"}]*count+[{"period_end":"2025-09-30"}]*18}

    def test_monitor_moves_past_failed_dispatch_in_same_tick(self):
        called=[]
        def request(path,payload=None):
            if payload is None:return {"workflow_runs":[]}
            called.append(path)
            if SOURCES[0] in path:raise OSError("503")
        point=monitor.check_once(self.report(),{},100,request)
        self.assertEqual(point["historical_remaining"],119)
        self.assertEqual(point["dispatched_source"],SOURCES[1])
        self.assertEqual(len(called),2)

    def test_monitor_remains_alive_when_all_sources_wait(self):
        state={}
        for source in SOURCES:dispatched(state,source,100)
        point=monitor.check_once(self.report(),state,101,lambda path:{"workflow_runs":[]})
        self.assertEqual(point["state"],"WAITING_FOR_SOURCE_RETRY_WINDOW")

    def test_one_uninspectable_source_does_not_block_others(self):
        def request(path,payload=None):
            if SOURCES[0] in path:raise OSError("503")
            if payload is None:return {"workflow_runs":[]}
        point=monitor.check_once(self.report(),{},100,request)
        self.assertEqual(point["dispatched_source"],SOURCES[1])

    def test_provider_dispatch_stays_paused_until_auth_deployment(self):
        state={}
        for source in SOURCES[:-1]:dispatched(state,source,100)
        point=monitor.check_once(self.report(),state,101,lambda path:{"workflow_runs":[]},allow_trendlyne=False)
        self.assertEqual(point["state"],"WAITING_FOR_SOURCE_RETRY_WINDOW")
        self.assertEqual(point["trendlyne_dispatch"],"PAUSED_PENDING_APPROVED_WORKFLOW_AUTH_DEPLOYMENT")

    def test_one_active_source_does_not_stall_other_collectors(self):
        def request(path,payload=None):
            if payload is not None:return None
            return {"workflow_runs":[{"id":1,"status":"in_progress"}]} if SOURCES[0] in path else {"workflow_runs":[]}
        point=monitor.check_once(self.report(),{},100,request)
        self.assertEqual(point["dispatched_source"],SOURCES[1])
        self.assertEqual(point["active_runs"],[1])

    def test_monitor_bounds_concurrent_sources_without_duplicate_dispatches(self):
        def request(path,payload=None):
            self.assertIsNone(payload)
            return {"workflow_runs":[{"id":1,"status":"in_progress"}]} if any(s in path for s in SOURCES[:2]) else {"workflow_runs":[]}
        self.assertEqual(monitor.check_once(self.report(),{},100,request)["state"],"COLLECTORS_RUNNING")

    def test_source_queue_skips_only_active_source_within_concurrency_limit(self):
        runs={s:[] for s in SOURCES};runs[SOURCES[0]]=[{"status":"queued"}]
        self.assertEqual(next_source(100,{},runs),SOURCES[1])
        runs[SOURCES[1]]=[{"status":"in_progress"}]
        self.assertIsNone(next_source(100,{},runs))

    def test_historical_completion_does_not_require_deferred_r3(self):
        point=monitor.check_once(self.report(0),{},100,lambda *args:self.fail("unexpected dispatch"))
        self.assertEqual(point["state"],"HISTORICAL_COMPLETE_R3_STILL_SEPARATE")

    def test_incomplete_cohort_cannot_claim_completion(self):
        report=self.report(0);report["equities"]=261
        with self.assertRaisesRegex(RuntimeError,"EXACT_COHORT"):
            monitor.check_once(report,{},100)

if __name__=="__main__":unittest.main()
