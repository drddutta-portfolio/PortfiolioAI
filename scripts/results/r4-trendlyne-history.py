#!/usr/bin/env python3
"""Fresh authenticated historical MCP discovery; immutable review evidence only."""
import hashlib,json,os,urllib.request,urllib.error,sys
from pathlib import Path
import psycopg
from r4_recovery_queue import task_id,attempt_all
sys.path.insert(0,str(Path(__file__).resolve().parent))
import importlib.util
spec=importlib.util.spec_from_file_location("batch",Path(__file__).with_name("r4-bse-historical-batch.py"))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    dest=Path("tmp/results-r4/trendlyne");dest.mkdir(parents=True,exist_ok=True)
    def oidc():
        request=urllib.request.Request(os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]+"&audience=portfolioai-results-r4",
            headers={"Authorization":"Bearer "+os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]})
        with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)["value"]
    client=batch.r2_client()
    with psycopg.connect(url,autocommit=False) as db:
        def call(request_id,tool,args,security=None):
            body={"tool":tool,"args":args,"requestId":request_id}
            if security:body["securityId"]=security
            with db.cursor() as cur:
                cur.execute("""SELECT raw_payload->>'r2_key' FROM data_source_records
                  WHERE record_kind='RESULTS_R4_HISTORY_CAPTURE_V2'
                    AND raw_payload->'request'->>'tool'=%s
                    AND raw_payload->'request'->'args'=%s::jsonb
                    AND coalesce(raw_payload->'request'->>'securityId','')=%s
                    AND retrieved_at>=current_date ORDER BY retrieved_at DESC LIMIT 1""",
                    (tool,json.dumps(args),security or ""))
                cached=cur.fetchone()
            db.rollback()
            if cached:
                data=json.loads(client.get_object(Bucket=batch.BUCKET,Key=cached[0])["Body"].read())
                print("R4_TRENDLYNE_REUSED",request_id,tool,flush=True)
                return data["result"]
            request=urllib.request.Request("https://"+batch.REF+".supabase.co/functions/v1/discover-trendlyne-capabilities",
                data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+oidc(),
                "content-type":"application/json","x-portfolioai-r4":"history"})
            try:
                with urllib.request.urlopen(request,timeout=120) as response:result=json.load(response)
            except urllib.error.HTTPError as error:
                text=error.read().decode()
                print("R4_TRENDLYNE_REQUEST_FAILED",error.code,text[:1200],flush=True)
                raise
            raw=batch.canonical(result);digest=hashlib.sha256(raw).hexdigest()
            key=batch.PREFIX+"trendlyne-history/sha256="+digest+"/capture.json"
            batch.immutable_put(client,key,raw)
            (dest/(request_id+".json")).write_bytes(raw)
            metadata={"contract":"RESULTS_R4_TRENDLYNE_HISTORY_REVIEW_V2",
                "request":body,"provider_run_id":result["runId"],"r2_key":key,"sha256":digest,
                "canonical_promotion_performed":False,"original_source_qualification_required":True}
            encoded=batch.canonical(metadata)
            with db.cursor() as cur:
                cur.execute("""INSERT INTO data_source_records
                  (source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                  VALUES('TRENDLYNE_MCP','RESULTS_R4_HISTORY_CAPTURE_V2',%s,%s,%s::jsonb,%s::jsonb)
                  ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",
                  (result["runId"],batch.sha(encoded),encoded.decode(),
                   '{"review_only":true,"retention":"IMMUTABLE_R2"}'))
            db.commit()
            print("R4_TRENDLYNE_CAPTURE",json.dumps({"tool":tool,"runId":result["runId"],"r2_key":key,"bytes":len(raw),"canonical_facts":0}),flush=True)
            return result["result"]
        with db.cursor() as cur:
            cur.execute("""SELECT raw_payload->>'r2_key' key FROM data_source_records
              WHERE record_kind='RESULTS_R4_HISTORY_CAPTURE_V2'
                AND raw_payload->'request'->>'tool'='LIST_TOOLS'
              ORDER BY retrieved_at DESC LIMIT 1""")
            prior=cur.fetchone()
        db.rollback()
        if prior:
            tools=json.loads(client.get_object(Bucket=batch.BUCKET,Key=prior[0])["Body"].read())["result"]
        else:tools=call("capabilities","LIST_TOOLS",{})
        if not isinstance(tools,dict) or not isinstance(tools.get("tools"),list):raise RuntimeError("MCP_TOOL_LIST_SCHEMA_UNKNOWN")
        names={t["name"]:t for t in tools["tools"]}
        for name,tool in names.items():
            if any(x in name.lower() for x in ("financ","param","document","histor")):
                print("R4_MCP_TOOL_SCHEMA",json.dumps(tool),flush=True)
        if os.getenv("RESULTS_R4_TRENDLYNE_MODE")=="PARAMETERS":
            if "search_financial_parameters" not in names:raise RuntimeError("PARAMETER_DISCOVERY_UNSUPPORTED")
            for index,query in enumerate([
                "historical quarterly revenue from operations sales 6Q 7Q 8Q ago",
                "historical quarterly net profit after tax 6Q 7Q 8Q ago",
                "historical diluted earnings per share EPS 6Q 7Q 8Q ago",
                "financial reporting quarter end date results period date"]):
                result=call("parameters-"+str(index),"search_financial_parameters",{"query":query})
                print("R4_EXACT_PARAMETER_DISCOVERY",index,str(result)[:40000],flush=True)
            return
        if os.getenv("RESULTS_R4_TRENDLYNE_MODE")=="HISTORICAL":
            with db.cursor() as cur:
                cur.execute("""SELECT raw_payload->>'r2_key' FROM data_source_records
                  WHERE record_kind='RESULTS_R4_HISTORY_CAPTURE_V2'
                    AND raw_payload->'request'->>'tool'='search_financial_parameters'""")
                keys=[r[0] for r in cur.fetchall()]
            db.rollback()
            parameters={}
            for key in keys:
                value=json.loads(client.get_object(Bucket=batch.BUCKET,Key=key)["Body"].read())["result"]
                decoded=json.loads(value) if isinstance(value,str) else value
                for p in decoded.get("data",[]):parameters[p["parameter"]]=p["helping_text"]
            wanted=[p for p in ("srqmq7","srqmq6","srqmy2","npqmq7","npqmq6","npqmy2",
                "beforedilutedepsq","epsadjqmq7","epsadjqmq6","epsadjqmq8") if p in parameters]
            if not wanted:raise RuntimeError("OBSERVED_PARAMETER_TOKENS_REQUIRED")
            cohort=batch.candidates(db);db.rollback()
            planned=[];blocked=[]
            for symbol,isin,sid,name,periods in cohort:
                with db.cursor() as cur:
                    cur.execute("""SELECT provider_instrument_id FROM security_identity_observations
                      WHERE security_id=%s AND source_code='TRENDLYNE_MCP' AND evidence_status='MATCHED'
                        AND observed_isin=%s AND provider_instrument_id IS NOT NULL
                      ORDER BY created_at DESC LIMIT 1""",(sid,isin))
                    identity=cur.fetchone()
                db.rollback()
                if not identity:
                    blocked.append({"symbol":symbol,"reason":"EXACT_PROVIDER_IDENTITY_UNRESOLVED","periods":periods});continue
                pid=identity[0]
                planned.append((str(sid),symbol,None,"get_stock_parameter_values",
                    {"stock_codes":[symbol],"parameters":wanted}))
                for period in periods:
                    query=(f"Only {name} ({symbol}), Trendlyne stock ID {pid}, ISIN {isin}: signed consolidated quarterly financial results for the three months ended {period}. "
                           "Revenue from operations, profit after tax for the period, diluted EPS, original units, exact dated quarter column and official BSE/NSE/issuer filing URL. "
                           "Exclude unrelated companies, annual and cumulative period figures.")
                    planned.append((str(sid),symbol,period,"get_document_search_results",{"query":query}))
            shard=int(os.getenv("RESULTS_R4_TRENDLYNE_SHARD","0"));shards=16
            identified=[(task_id(p[0],p[3],p[2],p[4]),p) for p in planned]
            selected=sorted((key,p) for key,p in identified if int(key,16)%shards==shard)
            if len(selected)>40:raise RuntimeError("PROVIDER_PER_RUN_BOUND_EXCEEDED")
            print("R4_TRENDLYNE_PLAN",json.dumps({"shard":shard,"planned_all":len(planned),"planned_shard":len(selected),"identity_blocked":blocked,"parameter_labels":{p:parameters[p] for p in wanted}}),flush=True)
            outcomes=[]
            def process(task):
                key,(sid,symbol,period,tool,args)=task
                result=call("historical-"+key[:48],tool,args,sid)
                print("R4_TRENDLYNE_EVIDENCE",json.dumps({"symbol":symbol,"period":period,"tool":tool,"result":str(result)[:18000],
                    "relative_parameter_dates_not_inferred":True,"canonical_promotion_performed":False}),flush=True)
                return {"status":"CAPTURED_REVIEW_ONLY"}
            def failed(task,error):
                db.rollback()
                return {"status":"RETRY_REQUIRED","reason":type(error).__name__,
                    "http_status":getattr(error,"code",None)}
            def checkpoint(task,result):
                key,(_,symbol,period,tool,_)=task
                outcomes.append({"task_id":key,"symbol":symbol,"period":period,"tool":tool,**result})
                (dest/"requests-report.json").write_text(json.dumps({"shard":shard,"identity_blocked":blocked,
                    "planned":len(selected),"outcomes":outcomes},sort_keys=True))
                print("R4_TRENDLYNE_REQUEST_STATUS",json.dumps(outcomes[-1]),flush=True)
            attempt_all(selected,process,failed,checkpoint)
            failures=sum(r["status"]=="RETRY_REQUIRED" for r in outcomes)
            print("R4_TRENDLYNE_BATCH_COMPLETE",json.dumps({"planned":len(selected),"attempted":len(outcomes),"failed":failures}),flush=True)
            if failures:raise RuntimeError("R4_TRENDLYNE_PARTIAL_BATCH_SEE_REQUESTS_REPORT")
            return
        with db.cursor() as cur:
            cur.execute("""SELECT s.id::text,s.symbol,s.isin,i.provider_instrument_id
              FROM securities s JOIN LATERAL (
                 SELECT provider_instrument_id FROM security_identity_observations
                 WHERE security_id=s.id AND source_code='TRENDLYNE_MCP' AND evidence_status='MATCHED'
                   AND observed_isin=s.isin AND provider_instrument_id IS NOT NULL
                 ORDER BY created_at DESC LIMIT 1
              ) i ON true WHERE s.symbol='AUROPHARMA' AND s.asset_class='EQUITY'""")
            rows=cur.fetchall()
        db.rollback()
        if len(rows)!=1:raise RuntimeError("EXACT_TRENDLYNE_IDENTITY_REQUIRED")
        sid,symbol,isin,pid=rows[0]
        name="get_parameter_values_multi_stock"
        if name not in names:raise RuntimeError("EXACT_QUARTER_PROVIDER_TOOL_UNPROVEN")
        schema=names[name].get("inputSchema",{})
        properties=schema.get("properties",{})
        if "query" not in properties:raise RuntimeError("PROVIDER_QUERY_CONTRACT_CHANGED")
        args={"query":f"Only {symbol}, Trendlyne instrument ID {pid}, ISIN {isin}. Retrieve exact originally reported CONSOLIDATED quarterly revenue from operations, net profit for the period after tax, and diluted earnings per share for the three months ended 30 September 2024 and 31 December 2024. Return exact financial period dates, scope, units and original exchange filing URLs. Do not return annual, TTM, half-year or latest relative-quarter values or unrelated companies."}
        if "type" in properties:args["type"]="stock"
        result=call("exact-quarter-probe",name,args,sid)
        print("R4_TRENDLYNE_EXACT_QUARTER_RESPONSE",str(result)[:18000],flush=True)

if __name__=="__main__":main()
