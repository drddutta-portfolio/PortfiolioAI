"""Bounded Development recovery controller; inspect every ten minutes and rotate sources."""
import importlib.util,json,os,time,urllib.request
from pathlib import Path
from r4_recovery_queue import SOURCES,next_source,dispatched,dispatch_failed

REPO="drddutta-portfolio/PortfiolioAI"
BRANCH="PortfolioAI-Development"
HISTORICAL={"2024-09-30","2024-12-31","2025-03-31","2025-06-30"}

def api(path,payload=None):
    request=urllib.request.Request("https://api.github.com/repos/"+REPO+path,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={"Authorization":"Bearer "+os.environ["GH_TOKEN"],
                 "Accept":"application/vnd.github+json","Content-Type":"application/json"},
        method="GET" if payload is None else "POST")
    with urllib.request.urlopen(request,timeout=40) as response:
        body=response.read()
        return json.loads(body) if body else None

def check_once(report,state,now,request=api,allow_trendlyne=True):
    if report.get("equities")!=262 or report.get("total_slots")!=2096:
        raise RuntimeError("EXACT_COHORT_READBACK_REQUIRED")
    remaining=sum(x["period_end"] in HISTORICAL for x in report["unresolved"])
    point={"time":now,"historical_remaining":remaining,"all_status_counts":report["status_counts"],
           "source_runs":{},"errors":[],"active_runs":[]}
    if not remaining:
        point["state"]="HISTORICAL_COMPLETE_R3_STILL_SEPARATE"
        return point
    runs={}
    for source in SOURCES:
        try:
            # Query each workflow independently: unrelated CI runs cannot hide an active collector.
            rows=request("/actions/workflows/"+source+"/runs?branch="+BRANCH+"&per_page=10")["workflow_runs"]
            runs[source]=rows
            point["source_runs"][source]=[{"id":r["id"],"status":r["status"],"conclusion":r.get("conclusion")} for r in rows[:1]]
            point["active_runs"].extend(r["id"] for r in rows if r["status"]!="completed")
        except Exception as error:
            point["errors"].append({"source":source,"stage":"INSPECT","reason":type(error).__name__})
    if point["active_runs"]:
        point["state"]="COLLECTORS_RUNNING"
        return point
    if not allow_trendlyne:
        runs.pop("results-r4-trendlyne-history.yml",None)
        point["trendlyne_dispatch"]="PAUSED_PENDING_APPROVED_WORKFLOW_AUTH_DEPLOYMENT"
    # Failed dispatches are deferred individually; try the next available source in this same check.
    for _ in SOURCES:
        source=next_source(now,state,runs)
        if source is None:break
        try:
            request("/actions/workflows/"+source+"/dispatches",{"ref":BRANCH})
            dispatched(state,source,now)
            point.update(state="DISPATCHED_NEXT_SOURCE",dispatched_source=source)
            return point
        except Exception as error:
            dispatch_failed(state,source,now)
            point["errors"].append({"source":source,"stage":"DISPATCH","reason":type(error).__name__})
    point["state"]="WAITING_FOR_SOURCE_RETRY_WINDOW"
    return point

def main():
    if os.environ.get("GITHUB_REPOSITORY")!=REPO or os.environ.get("GITHUB_REF")!="refs/heads/"+BRANCH:
        raise RuntimeError("DEVELOPMENT_BRANCH_REQUIRED")
    if "lrgpjimipfkyoqbpsqzz" not in os.environ["SUPABASE_DB_URL"]:
        raise RuntimeError("DEVELOPMENT_DATABASE_REQUIRED")
    spec=importlib.util.spec_from_file_location("readback",Path(__file__).with_name("r4-eight-quarter-readback.py"))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    cycle=int(os.environ.get("MONITOR_CYCLE","0"))
    if not 0<=cycle<28:raise RuntimeError("SEVEN_DAY_CONTROLLER_LIMIT")
    state=json.loads(os.environ.get("RECOVERY_STATE","{}"))
    if not isinstance(state,dict) or any(k not in SOURCES for k in state):raise RuntimeError("INVALID_RECOVERY_STATE")
    for entry in state.values():
        if not isinstance(entry,dict) or any(not isinstance(v,(int,float)) or v<0 for v in entry.values()):
            raise RuntimeError("INVALID_RECOVERY_STATE")
    checkpoints=[]
    for iteration in range(30):
        try:
            report=module.readback(os.environ["SUPABASE_DB_URL"])
            point=check_once(report,state,time.time(),allow_trendlyne=os.environ.get("RESULTS_R4_TRENDLYNE_DISPATCH_READY")=="1")
        except Exception as error:
            point={"time":time.time(),"state":"READBACK_RETRY_REQUIRED","reason":type(error).__name__}
        checkpoints.append(point)
        Path("tmp/results-r4").mkdir(parents=True,exist_ok=True)
        Path("tmp/results-r4/monitor-checkpoints.json").write_text(json.dumps({"checkpoints":checkpoints,"retry_state":state},indent=2))
        print("R4_MONITOR",json.dumps(point),flush=True)
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a") as output:
            output.write(f"\n- Historical gaps: **{point.get('historical_remaining','readback unavailable')}**; {point['state']}; source: {point.get('dispatched_source','—')}\n")
        if point["state"]=="HISTORICAL_COMPLETE_R3_STILL_SEPARATE":return
        if iteration<29:time.sleep(600)
    if cycle<27:
        api("/actions/workflows/results-r4-recovery-monitor.yml/dispatches",{"ref":BRANCH,
            "inputs":{"cycle":str(cycle+1),"recovery_state":json.dumps(state,separators=(",",":"))}})
    else:raise RuntimeError("MONITOR_SEVEN_DAY_LIMIT_REACHED_REVIEW_REMAINING_GAPS")

if __name__=="__main__":main()
