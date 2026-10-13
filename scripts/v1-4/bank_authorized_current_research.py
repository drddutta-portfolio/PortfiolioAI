"""Execute one owner-authorized current-research batch through signed CI identity.
Only five fixed source actions; zero retries; never writes reviews or readiness.
"""
import concurrent.futures, hashlib, json, os, pathlib, time, urllib.request, urllib.parse, urllib.error
PROJECT="lrgpjimipfkyoqbpsqzz"
AUD=f"https://{PROJECT}.supabase.co/functions/v1/v14-bank-authorized-research-grants"
FINANCIAL=f"https://{PROJECT}.supabase.co/functions/v1/v14-bank-financial-acquisition"
APPROVAL="9a5aa51e99647e4b26faa800ea8383f5c87eb6b7e6269f079a65b886f8ac5762"
doc=pathlib.Path("docs/private/v1-4-industry-batches/Banking_13_Owner_Execution_Directive_2026-10-12.md").read_bytes()
assert hashlib.sha256(doc).hexdigest()==APPROVAL
# Waiting for a deployment is not a provider retry. No grant request occurs here.
for _ in range(30):
    try:
        probe=urllib.request.Request(AUD,data=b"{}",headers={"Content-Type":"application/json"},method="POST")
        urllib.request.urlopen(probe,timeout=10)
    except urllib.error.HTTPError as e:
        payload=json.load(e)
        if e.code==401 and payload.get("code")=="SIGNED_RESEARCH_EXECUTOR_REQUIRED":break
    except (OSError,ValueError):pass
    time.sleep(20)
else:raise SystemExit("VERIFIED_RESEARCH_EXECUTOR_NOT_DEPLOYED; NO_PROVIDER_CALLS")
request=urllib.request.Request(os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]+"&audience="+urllib.parse.quote(AUD,safe=""),
 headers={"Authorization":"Bearer "+os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]})
with urllib.request.urlopen(request,timeout=30) as response:token=json.load(response)["value"]
request=urllib.request.Request(AUD,data=json.dumps({"action":"V1_4_BANK_APPROVED_CURRENT_RESEARCH_V1","approvalHash":APPROVAL}).encode(),
 headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
try:
    with urllib.request.urlopen(request,timeout=60) as response:batch=json.load(response)
except urllib.error.HTTPError as e:
    print(json.dumps({"stage":"SIGNED_GRANT_ISSUANCE","http_status":e.code,"response":json.load(e)}))
    raise SystemExit(1)
assert batch["code"]=="FIVE_SCOPED_RESEARCH_GRANTS" and batch["canonicalPromotion"] is False
assert len(batch["grants"])==5
workers=max(1,min(3,int(batch["concurrencyLimit"])))
def acquire(target):
    identity={k:target[k] for k in ("action","sliceId","scope")}
    if target["state"] not in ("ISSUED","REUSED_UNCONSUMED"):
        return {**identity,"execution":"NOT_RETRIED","grant_state":target["state"],"providerCalls":0}
    body={"action":target["action"],"sliceId":target["sliceId"],"portfolioId":batch["portfolioId"],"grantId":target["grantId"]}
    if target.get("queryKey"):body["queryKey"]=target["queryKey"]
    request=urllib.request.Request(FINANCIAL,data=json.dumps(body).encode(),headers={"Content-Type":"application/json"},method="POST")
    try:
        with urllib.request.urlopen(request,timeout=240) as response:result=json.load(response);http_status=response.status
    except urllib.error.HTTPError as e:
        http_status=e.code;result=json.load(e)
    except OSError:
        # Invocation may still be completing server-side. Do not infer zero spend.
        return {**identity,"execution":"TRANSPORT_UNCERTAIN_DO_NOT_RETRY","providerCalls":None}
    return {**identity,"execution":"INVOKED_ONCE","http_status":http_status,"result":result}
with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
    results=list(pool.map(acquire,batch["grants"]))
out=pathlib.Path("bank-authorized-research-result");out.mkdir(exist_ok=True)
report={"authorization_reference":APPROVAL,"executor":"SIGNED_GITHUB_ACTIONS_CODEX","maximum_parallel":workers,"maximum_planned_calls":5,"paid_retries":0,"canonical_promotion":False,"results":results}
(out/"execution.json").write_text(json.dumps(report,indent=2)+"\n")
# Grant capabilities and bearer tokens are deliberately excluded from logs/artifacts.
print(json.dumps(report))
if any(r.get("execution")=="TRANSPORT_UNCERTAIN_DO_NOT_RETRY" or r.get("http_status",200)>=400 for r in results):
    raise SystemExit(1)
