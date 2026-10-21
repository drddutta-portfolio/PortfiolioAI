"""Failure isolation and deterministic retry scheduling; no financial interpretation."""
import hashlib
import json
import multiprocessing

SOURCES=("results-r4-nse-lineage-recovery.yml",
         "results-r4-historical-recovery-v3.yml",
         "results-r4-retained-ocr-recovery.yml",
         "results-r4-bse-dated-quarter-review.yml",
         "results-r4-dated-ocr-backlog.yml",
         "results-r4-scope-anchor-review.yml",
         "results-r4-official-issuer-recovery.yml",
         "results-r4-trendlyne-history.yml")

def task_id(security,tool,period,args):
    body=json.dumps([str(security),tool,period,args],sort_keys=True,separators=(",",":"))
    return hashlib.sha256(body.encode()).hexdigest()


def native_shard_for(security,shards=1):
    if not 1<=shards<=16:raise ValueError("INVALID_NATIVE_SHARD_COUNT")
    return int(task_id(security,"NATIVE_DATED_ORIGINAL",None,{}),16)%shards

def attempt_all(items,process,on_error,on_result):
    """A failed item is checkpointed before proceeding to the next item."""
    for item in items:
        try:
            result=process(item)
        except Exception as error:
            result=on_error(item,error)
        # Checkpoint errors are fatal: continuing without an audit trail is unsafe.
        on_result(item,result)

def _isolated_worker(connection,operation,args):
    try:
        connection.send(("OK",operation(*args)))
    except ValueError as error:
        connection.send(("REJECTED",str(error)))
    except Exception as error:
        connection.send(("ERROR",type(error).__name__+":"+str(error)[:200]))
    finally:
        connection.close()

def run_with_timeout(operation,args,timeout):
    """Terminate a stuck native OCR operation without losing the parent queue."""
    context=multiprocessing.get_context("spawn")
    reader,writer=context.Pipe(duplex=False)
    process=context.Process(target=_isolated_worker,args=(writer,operation,args))
    process.start();writer.close()
    try:
        if not reader.poll(timeout):raise TimeoutError("PER_ORIGINAL_PROCESSING_TIMEOUT")
        try:status,value=reader.recv()
        except EOFError as error:raise RuntimeError("ORIGINAL_WORKER_EXITED_WITHOUT_RESULT") from error
        if status=="REJECTED":raise ValueError(value)
        if status!="OK":raise RuntimeError(value)
        return value
    finally:
        reader.close()
        process.join(0.1)
        if process.is_alive():process.terminate();process.join(2)
        if process.is_alive():process.kill();process.join(2)

def next_source(now,state,runs):
    """Rotate through all sources even when a preceding source made no progress."""
    active={source for source,rows in runs.items() if any(r.get("status")!="completed" for r in rows)}
    # One slow source must not monopolize recovery; bound total source overlap.
    if len(active)>=2:return None
    due=[]
    for index,source in enumerate(SOURCES):
        entry=state.get(source,{})
        if now>=entry.get("not_before",0) and source in runs and source not in active:
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

def observe_completed(state,source,run,now):
    """Retry transient failed passes sooner, without hammering persistent failures."""
    entry=state.setdefault(source,{})
    if entry.get("last_completed_run")==run["id"]:return
    entry["last_completed_run"]=run["id"]
    if run.get("conclusion") in ("failure","timed_out","cancelled"):
        failures=entry.get("consecutive_failures",0)+1
        entry["consecutive_failures"]=failures
        if entry.get("last_dispatched",0):
            entry["not_before"]=min(entry.get("not_before",now+1800),now+(1800 if failures<=3 else 21600))
    elif run.get("conclusion")=="success":entry["consecutive_failures"]=0
