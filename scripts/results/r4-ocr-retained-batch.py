"""Recover unresolved quarters from already retained original PDFs only."""
import argparse,importlib.util,json,os,hashlib
from collections import Counter
from pathlib import Path
import fitz,psycopg
from r4_ocr_geometry import extract_ocr
from r4_recovery_queue import task_id,attempt_all,run_with_timeout
spec=importlib.util.spec_from_file_location("batch",Path(__file__).with_name("r4-bse-historical-batch.py"))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--shard",type=int,required=True)
    parser.add_argument("--reports",required=True)
    args=parser.parse_args()
    if not 0<=args.shard<8:raise RuntimeError("INVALID_SHARD")
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();counts=Counter();details=[]
    with psycopg.connect(url) as db:
        missing=batch.candidates(db);db.rollback()
        targets={symbol:(isin,sid,name,periods) for symbol,isin,sid,name,periods in missing if int(task_id(sid,"OCR",None,{}),16)%8==args.shard}
        sources={}
        for filename in Path(args.reports).rglob("bse-original-shard-*.json"):
            report=json.loads(filename.read_text())
            for company in report.get("companies",[]):
                symbol=company["symbol"]
                if symbol not in targets:continue
                for slot in company.get("results",[]):
                    period=slot["period"]
                    if period not in targets[symbol][3]:continue
                    for source in slot.get("sources",[]):
                        if source.get("original_r2_key"):
                            sources.setdefault((symbol,period),{})[source["sha256"]]=source
        with batch.PortfolioBSE() as bse:
            for symbol,(isin,sid,name,periods) in targets.items():
                try:
                    scrip=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                    legal=batch.verified_issuer(bse,scrip,isin)
                    def collect_period(period):
                        approved=[];entry={"symbol":symbol,"period":period,"sources":[]}
                        def collect_source(pair):
                            digest,source=pair
                            raw=client.get_object(Bucket=batch.BUCKET,Key=source["original_r2_key"])["Body"].read()
                            if batch.sha(raw)!=digest:raise RuntimeError("IMMUTABLE_ORIGINAL_MISMATCH")
                            counts["retained_originals_read"]+=1
                            proof_key=batch.PREFIX+"ocr-replay-v1/original_version="+digest+"/period_end="+period+"/proof.json"
                            try:
                                try:
                                    proof=json.loads(client.get_object(Bucket=batch.BUCKET,Key=proof_key)["Body"].read())
                                    parsed=proof.get("parsed")
                                    if not parsed:raise ValueError(proof["rejection"])
                                    counts["ocr_proofs_reused"]+=1
                                except Exception as error:
                                    code=getattr(error,"response",{}).get("Error",{}).get("Code")
                                    if code not in ("404","NoSuchKey","NotFound"):raise
                                    try:
                                        parsed=run_with_timeout(extract_ocr,(raw,period,symbol in batch.BANKS,symbol in batch.INSURERS),180)
                                        proof={"original_sha256":digest,"parsed":parsed}
                                    except ValueError as rejected:
                                        proof={"original_sha256":digest,"parsed":None,"rejection":str(rejected)}
                                        batch.immutable_put(client,proof_key,batch.canonical(proof))
                                        raise
                                    batch.immutable_put(client,proof_key,batch.canonical(proof))
                                doc=fitz.open(stream=raw,filetype="pdf")
                                cover=" ".join(p.get_text("text") for p in list(doc)[:3])
                                if not batch.issuer_identity(legal,cover+" "+parsed.get("ocr_issuer_text","")):
                                    raise ValueError("OCR_ISSUER_LEGAL_IDENTITY_UNPROVEN")
                                parsed.update(original_r2_key=source["original_r2_key"],ocr_proof_r2_key=proof_key)
                                origin={"source_url":"https://www.bseindia.com/xml-data/corpfiling/AttachHis/"+source["attachment_name"]}
                                approved.append((raw,origin,parsed))
                                entry["sources"].append({"sha256":digest,"status":"DOUBLE_OCR_VALIDATED"})
                            except ValueError as error:
                                counts["ocr_rejected"]+=1
                                entry["sources"].append({"sha256":digest,"status":"REVIEW_REQUIRED","reason":str(error)[:300]})
                        def source_error(pair,error):
                            db.rollback();counts["source_errors"]+=1
                            entry["sources"].append({"sha256":pair[0],"status":"RETRY_REQUIRED",
                                "reason":type(error).__name__+":"+str(error)[:200]})
                        attempt_all(sources.get((symbol,period),{}).items(),collect_source,source_error,lambda item,result:None)
                        if approved:
                            scopes={p["scope"] for _,_,p in approved}
                            scope="CONSOLIDATED" if "CONSOLIDATED" in scopes else "STANDALONE"
                            eligible=[x for x in approved if x[2]["scope"]==scope]
                            fingerprints={tuple(sorted((k,f["value"]) for k,f in p["facts"].items())) for _,_,p in eligible}
                            if len(fingerprints)>1:
                                entry["status"]="CONFLICTING_ORIGINAL_VERSIONS";counts["conflicts"]+=1
                            else:
                                raw,origin,parsed=eligible[0]
                                new=batch.persist(db,client,(symbol,isin,sid,legal,scrip),period,origin,raw,parsed,None)
                                entry.update(status="SOURCE_PERSISTED_PENDING_R4_SELECTION",facts_inserted=new,
                                    values={k:f["value"] for k,f in parsed["facts"].items()})
                                counts["facts_inserted"]+=new;counts["quarter_candidates"]+=1
                        else:entry["status"]="NO_DOUBLE_VALIDATED_OCR_TRIO"
                        details.append(entry)
                        output=Path(f"tmp/results-r4/ocr-shard-{args.shard}.json");output.parent.mkdir(parents=True,exist_ok=True)
                        output.write_text(json.dumps({"counts":dict(counts),"details":details},sort_keys=True))
                        print("R4_OCR_PROGRESS",json.dumps({"symbol":symbol,"period":period,"status":entry["status"],"counts":dict(counts)}),flush=True)
                    def period_error(period,error):
                        db.rollback();counts["period_errors"]+=1
                        details.append({"symbol":symbol,"period":period,"status":"RETRY_REQUIRED",
                            "reason":type(error).__name__+":"+str(error)[:200]})
                    attempt_all(periods,collect_period,period_error,lambda item,result:None)
                except Exception as error:
                    db.rollback();counts["company_error"]+=1
                    for period in periods:
                        details.append({"symbol":symbol,"period":period,"stage":"ISSUER_OR_COMPANY",
                            "status":"RETRY_REQUIRED","reason":type(error).__name__+":"+str(error)[:200]})
                    print("R4_OCR_COMPANY_ERROR",symbol,type(error).__name__,str(error)[:200],flush=True)
    output=Path(f"tmp/results-r4/ocr-shard-{args.shard}.json");output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps({"counts":dict(counts),"details":details},sort_keys=True))
    print("R4_OCR_FINAL",json.dumps({"shard":args.shard,"counts":dict(counts)}),flush=True)

if __name__=="__main__":main()
