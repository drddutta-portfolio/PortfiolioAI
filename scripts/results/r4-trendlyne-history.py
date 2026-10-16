#!/usr/bin/env python3
"""Fresh authenticated historical MCP discovery; immutable review evidence only."""
import hashlib,json,os,urllib.request,sys
from pathlib import Path
import psycopg
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
        tools=call("capabilities","LIST_TOOLS",{})
        if not isinstance(tools,dict) or not isinstance(tools.get("tools"),list):raise RuntimeError("MCP_TOOL_LIST_SCHEMA_UNKNOWN")
        names={t["name"]:t for t in tools["tools"]}
        for name,tool in names.items():
            if any(x in name.lower() for x in ("financ","param","document","histor")):
                print("R4_MCP_TOOL_SCHEMA",json.dumps(tool),flush=True)
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
