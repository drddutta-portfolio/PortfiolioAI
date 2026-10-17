"""Hash-verified private BSE trace inventory shared by recovery and diagnostics."""
import hashlib
import json
import re

def reports(client,bucket,prefix):
    token=None;objects=[]
    for _ in range(5):
        args={"Bucket":bucket,"Prefix":prefix+"private-recovery-traces/","MaxKeys":1000}
        if token:args["ContinuationToken"]=token
        result=client.list_objects_v2(**args)
        objects.extend(x for x in result.get("Contents",[]) if x["Key"].endswith("/bse.json"))
        if not result.get("IsTruncated"):break
        token=result["NextContinuationToken"]
    else:raise RuntimeError("PRIVATE_INVENTORY_LIST_BOUND_EXCEEDED")
    if len(objects)>512:raise RuntimeError("PRIVATE_INVENTORY_REPORT_BOUND_EXCEEDED")
    for obj in sorted(objects,key=lambda x:x["LastModified"],reverse=True):
        key=obj["Key"]
        match=re.fullmatch(re.escape(prefix)+r"private-recovery-traces/sha256=([0-9a-f]{64})/bse\.json",key)
        if not match:raise RuntimeError("PRIVATE_INVENTORY_KEY_INVALID")
        raw=client.get_object(Bucket=bucket,Key=key)["Body"].read()
        if len(raw)>2_000_000 or hashlib.sha256(raw).hexdigest()!=match[1]:
            raise RuntimeError("PRIVATE_INVENTORY_HASH_OR_SIZE_MISMATCH")
        yield json.loads(raw)

def slots(inventory):
    out={}
    for report in inventory:
        for company in report.get("companies",[]):
            for slot in company.get("results",[]):
                key=(company["symbol"],slot["period"])
                current=out.setdefault(key,{**slot,"sources":[],"company_error":company.get("error")})
                present={s["sha256"] for s in current["sources"]}
                for source in slot.get("sources",[]):
                    if source.get("original_r2_key") and source.get("sha256") and source["sha256"] not in present:
                        current["sources"].append(source);present.add(source["sha256"])
            if company.get("error"):
                for period in company.get("unresolved_periods",[]):
                    out.setdefault((company["symbol"],period),{"period":period,"sources":[],"company_error":company["error"]})
    return out
