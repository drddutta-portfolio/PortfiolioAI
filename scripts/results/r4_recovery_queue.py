"""Failure isolation and deterministic retry scheduling; no financial interpretation."""
import hashlib
import json

SOURCES=("results-r4-nse-lineage-recovery.yml",
         "results-r4-historical-recovery-v3.yml",
         "results-r4-retained-ocr-recovery.yml",
         "results-r4-trendlyne-history.yml")

def task_id(security,tool,period,args):
    body=json.dumps([str(security),tool,period,args],sort_keys=True,separators=(",",":"))
    return hashlib.sha256(body.encode()).hexdigest()

def attempt_all(items,process,on_error,on_result):
    """A failed item is checkpointed before proceeding to the next item."""
    for item in items:
        try:
            result=process(item)
        except Exception as error:
            result=on_error(item,error)
        # Checkpoint errors are fatal: continuing without an audit trail is unsafe.
        on_result(item,result)

def next_source(now,state,runs):
    """Rotate through all sources even when a preceding source made no progress."""
    if any(r.get("status")!="completed" for rows in runs.values() for r in rows):
        return None
    due=[]
    for index,source in enumerate(SOURCES):
        entry=state.get(source,{})
        if now>=entry.get("not_before",0) and source in runs:
            due.append((entry.get("last_dispatched",0),index,source))
    return min(due)[2] if due else None

def dispatched(state,source,now):
    entry=state.setdefault(source,{})
    entry["last_dispatched"]=now
    # Repeated source passes are deliberately less frequent than monitoring.
    entry["not_before"]=now+(86400 if "trendlyne" in source else 21600)
    entry["attempts"]=entry.get("attempts",0)+1

def dispatch_failed(state,source,now):
    entry=state.setdefault(source,{})
    entry["last_dispatched"]=now
    entry["not_before"]=now+1800
    entry["dispatch_failures"]=entry.get("dispatch_failures",0)+1
