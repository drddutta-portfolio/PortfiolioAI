"""Bounded Development-only recovery controller; checkpoints every ten minutes."""
import importlib.util,json,os,time,urllib.request
from pathlib import Path

REPO="drddutta-portfolio/PortfiolioAI"
BRANCH="PortfolioAI-Development"
WORKFLOW="results-r4-nse-lineage-recovery.yml"
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

def main():
    if os.environ.get("GITHUB_REPOSITORY")!=REPO or os.environ.get("GITHUB_REF")!="refs/heads/"+BRANCH:
        raise RuntimeError("DEVELOPMENT_BRANCH_REQUIRED")
    if "lrgpjimipfkyoqbpsqzz" not in os.environ["SUPABASE_DB_URL"]:
        raise RuntimeError("DEVELOPMENT_DATABASE_REQUIRED")
    spec=importlib.util.spec_from_file_location("readback",Path(__file__).with_name("r4-eight-quarter-readback.py"))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    cycle=int(os.environ.get("MONITOR_CYCLE","0"))
    if not 0<=cycle<28:raise RuntimeError("SEVEN_DAY_CONTROLLER_LIMIT")
    last=int(os.environ.get("LAST_DISPATCH_REMAINING","2097"))
    checkpoints=[]
    for iteration in range(30):
        report=module.readback(os.environ["SUPABASE_DB_URL"])
        remaining=sum(x["period_end"] in HISTORICAL for x in report["unresolved"])
        runs=api("/actions/runs?branch="+BRANCH+"&per_page=100")["workflow_runs"]
        active=[r for r in runs if r["status"]!="completed" and r["path"].endswith((WORKFLOW,"results-r4-retained-ocr-recovery.yml","results-r4-trendlyne-history.yml"))]
        point={"time":time.time(),"historical_remaining":remaining,"all_status_counts":report["status_counts"],"active_runs":[r["id"] for r in active]}
        if not remaining:
            point["state"]="HISTORICAL_COMPLETE_R3_STILL_SEPARATE"
        elif not active and remaining<last:
            api("/actions/workflows/"+WORKFLOW+"/dispatches",{"ref":BRANCH})
            last=remaining;point["state"]="DISPATCHED_CACHED_ORIGINAL_RECOVERY"
        elif not active:
            point["state"]="BLOCKED_NO_PROGRESS_REQUIRES_PARSER_OR_SOURCE_REVIEW"
        else:point["state"]="COLLECTORS_RUNNING"
        checkpoints.append(point)
        Path("tmp/results-r4").mkdir(parents=True,exist_ok=True)
        Path("tmp/results-r4/monitor-checkpoints.json").write_text(json.dumps(checkpoints,indent=2))
        print("R4_MONITOR",json.dumps(point),flush=True)
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a") as output:
            output.write(f"\n- Historical gaps: **{remaining}**; {point['state']}; active runs: {point['active_runs']}\n")
        if not remaining or point["state"].startswith("BLOCKED"):
            return
        if iteration<29:time.sleep(600)
    if cycle<27:
        api("/actions/workflows/results-r4-recovery-monitor.yml/dispatches",{"ref":BRANCH,"inputs":{"cycle":str(cycle+1),"last_remaining":str(last)}})
    else:
        raise RuntimeError("MONITOR_SEVEN_DAY_LIMIT_REACHED_REVIEW_REMAINING_GAPS")

if __name__=="__main__":main()
