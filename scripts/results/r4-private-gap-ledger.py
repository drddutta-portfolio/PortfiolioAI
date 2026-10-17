"""Private per-slot diagnostic metadata; never selects financial observations."""
import importlib.util,json,os,re
from collections import Counter
from pathlib import Path
import fitz,psycopg
from r4_private_inventory import reports,slots
from r4_pdf_geometry import extract_page

spec=importlib.util.spec_from_file_location("batch",Path(__file__).with_name("r4-bse-historical-batch.py"))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ.get("CLOUDFLARE_R2_BUCKET")!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();inventory=slots(reports(client,batch.BUCKET,batch.PREFIX));counts=Counter()
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,name,periods in cohort:
            for period in periods:
                slot=inventory.get((symbol,period),{});sources=[]
                for source in slot.get("sources",[]):
                    item={k:source[k] for k in ("attachment_name","sha256","original_r2_key") if k in source}
                    filename=item.get("attachment_name","")
                    if not re.fullmatch(r"[0-9a-fA-F-]{36}\.pdf",filename):continue
                    item["source_url"]="https://www.bseindia.com/xml-data/corpfiling/AttachHis/"+filename
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=item["original_r2_key"])["Body"].read()
                        if batch.sha(raw)!=item["sha256"]:raise RuntimeError("ORIGINAL_HASH_MISMATCH")
                        with fitz.open(stream=raw,filetype="pdf") as pdf:
                            item["pages"]=len(pdf);pages=[]
                            for i in range(min(len(pdf),40)):
                                page=pdf[i];text=page.get_text("text")
                                if not re.search(r"financial results|diluted|revenue from operations|premium|interest earned",text,re.I):continue
                                metadata={"page":i+1,"text_length":len(text),"images":len(page.get_images())}
                                try:
                                    parsed=extract_page(page,i+1,period,symbol in batch.BANKS,symbol in batch.INSURERS)
                                    metadata.update(native_table="CORE_TRIO_PRESENT",scope=parsed["scope"],metrics=sorted(parsed["facts"]))
                                except ValueError as error:metadata["native_table"]=";".join(re.findall(r"[A-Z][A-Z_]{5,}",str(error)))[:200]
                                pages.append(metadata)
                            item["financial_pages"]=pages
                    except Exception as error:item["read_status"]=type(error).__name__
                    proof_key=batch.PREFIX+"ocr-replay-v1/original_version="+item.get("sha256","")+"/parser_revision=quarter-group-v2/period_end="+period+"/proof.json"
                    try:
                        proof=json.loads(client.get_object(Bucket=batch.BUCKET,Key=proof_key)["Body"].read())
                        item["ocr_status"]="TRIO_PRESENT" if proof.get("parsed") else "REJECTED"
                        detail=str(proof.get("rejection",""))
                        try:
                            reasons=json.loads(detail.split(":",1)[1])
                            categories=Counter()
                            for reason,n in reasons.items():categories[reason.split(":")[0]]+=n
                            item["ocr_reject_categories"]=dict(categories)
                        except (ValueError,IndexError,AttributeError):
                            item["ocr_reject_categories"]={detail.split(":")[0]:1} if detail else {}
                    except Exception as error:
                        code=getattr(error,"response",{}).get("Error",{}).get("Code")
                        item["ocr_status"]="NO_PROOF" if code in ("404","NoSuchKey","NotFound") else type(error).__name__
                    sources.append(item)
                value={"contract":"RESULTS_R4_PRIVATE_GAP_DIAGNOSTIC_V1","diagnostic_only":True,
                    "canonical_promotion_performed":False,"symbol":symbol,"isin":isin,"security_id":str(sid),"period_end":period,
                    "bse_status":slot.get("status","NO_RETAINED_SOURCE_INVENTORY"),"company_error":slot.get("company_error"),
                    "rejection_counts":slot.get("rejection_counts",{}),"sources":sources}
                encoded=batch.canonical(value);digest=batch.sha(encoded)
                key=batch.PREFIX+"private-gap-ledger/sha256="+digest+"/diagnostic.json"
                batch.immutable_put(client,key,encoded)
                # Small diagnostic metadata only. Original statements remain in R2.
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                      VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_GAP_DIAGNOSTIC_V1',%s,%s,%s::jsonb,%s::jsonb)
                      ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",
                      (str(sid)+":"+period,digest,encoded.decode(),'{"diagnostic_only":true,"retention":"PRIVATE_DEVELOPMENT_R2"}'))
                db.commit();counts["slots_diagnosed"]+=1;counts["retained_sources"]+=len(sources)
        print("R4_PRIVATE_GAP_LEDGER",json.dumps(dict(counts)),flush=True)

if __name__=="__main__":main()
