"""Full-cohort native dated-quarter PDF review; no canonical promotion."""
import argparse,importlib.util,json,os,re
from collections import Counter
from datetime import date
from pathlib import Path
import fitz,psycopg
from r4_private_inventory import reports,slots
from r4_pdf_geometry import extract_page,rows_for,row_text,date_cells
from r4_recovery_queue import task_id

spec=importlib.util.spec_from_file_location("batch",Path(__file__).with_name("r4-bse-historical-batch.py"))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)
WINDOWS=(("2025-10-01","2025-11-30"),("2026-01-01","2026-02-28"),("2026-04-01","2026-05-31"),("2026-07-01","2026-08-31"))

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--shard",type=int,required=True);args=parser.parse_args()
    if not 0<=args.shard<4:raise RuntimeError("INVALID_SHARD")
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ.get("CLOUDFLARE_R2_BUCKET")!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();inventory=slots(reports(client,batch.BUCKET,batch.PREFIX));counts=Counter()
    with psycopg.connect(url) as db,batch.PortfolioBSE() as bse:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,name,periods in cohort:
            if int(task_id(sid,"BSE_DATED_PDF",None,{}),16)%4!=args.shard:continue
            result={p:{"period_end":p,"candidates":[],"rejections":{},"sources_checked":0} for p in periods}
            notices=[];seen=set();sources=[];company_error=None;all_sources=[];identity=None
            try:
                scrip=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                header=bse._bse.equityMetaInfo(scrip)
                if str(header.get("SecurityCode"))!=scrip or header.get("ISIN")!=isin:raise ValueError("BSE_CANONICAL_IDENTITY_MISMATCH")
                legal=batch.verified_issuer(bse,scrip,isin)
                listing=next(x for x in bse._bse.listSecurities(scripcode=scrip,group="") if str(x.get("SCRIP_CD"))==scrip and x.get("ISIN_NUMBER")==isin)
                identity={"header":header,"listing":listing,"issuer_name":legal,"bse_scrip_code":scrip}
                for period in periods:
                    sources.extend(inventory.get((symbol,period),{}).get("sources",[]))
                windows=list(WINDOWS)
                if symbol=="BDL":windows.append(("2025-06-01","2025-08-31"))
                for start,end in windows:
                    try:
                        discovered=bse.financial_announcements(scrip,date.fromisoformat(start),date.fromisoformat(end),max_pages=5)
                        ordered=sorted(discovered["results"],key=lambda x:(bool(re.search(r"newspaper|presentation|advertisement|press release",x.get("title",""),re.I)),not bool(re.search(r"financial results|audited|board meeting outcome",x.get("title",""),re.I))))
                        sources.extend({"attachment_name":x["attachment_name"]} for x in ordered[:4 if symbol=="BDL" else 2] if x.get("attachment_name"))
                    except Exception as error:counts["catalog_error_"+type(error).__name__]+=1
                for source in sources:
                    filename=source.get("attachment_name")
                    if not filename or filename in seen:continue
                    seen.add(filename)
                    try:
                        if source.get("original_r2_key"):
                            raw=client.get_object(Bucket=batch.BUCKET,Key=source["original_r2_key"])["Body"].read()
                            if batch.sha(raw)!=source["sha256"]:raise ValueError("BSE_RETAINED_ORIGINAL_HASH_MISMATCH")
                            origin={"source_url":"https://www.bseindia.com/xml-data/corpfiling/AttachHis/"+filename,"original_r2_key":source["original_r2_key"]}
                        else:
                            raw,origin,_=batch.retained_original(bse,client,filename)
                        counts["originals_checked"]+=1
                        source_meta={"source_url":origin["source_url"],"original_sha256":batch.sha(raw),"original_r2_key":origin["original_r2_key"],"header_layouts":[]}
                        all_sources.append(source_meta)
                        with fitz.open(stream=raw,filetype="pdf") as pdf:
                            cover=" ".join(p.get_text("text") for p in list(pdf)[:3])
                            if not batch.issuer_identity(legal,cover):raise ValueError("BSE_COMPLETE_ISSUER_LEGAL_NAME_UNPROVEN")
                            text=" ".join(p.get_text("text") for p in list(pdf)[:40])
                            flags=sorted(set(re.findall(r"\b(?:restated|recast|pro[ -]?forma|carve[ -]?out)\b",text,re.I)))
                            source_meta["review_basis_flags"]=flags
                            source_meta["basis_excerpts"]=[text[max(0,m.start()-140):m.end()+420] for m in list(re.finditer(r"\b(?:restated|recast|pro[ -]?forma|carve[ -]?out)\b",text,re.I))[:4]]
                            for page_index,page in enumerate(list(pdf)[:40]):
                                native=page.get_text("text")
                                if not re.search(r"diluted",native,re.I) or len(source_meta["header_layouts"])>=2:continue
                                rows=rows_for(page)
                                revenue_index=next((i for i,(_,ws) in enumerate(rows) if re.search(r"revenue\s+from\s+operations|interest\s+earned|premium.*earned",row_text(ws),re.I)),None)
                                if revenue_index is None:continue
                                header_rows=rows[max(0,revenue_index-18):revenue_index]
                                labels=[re.sub(r"[\d.,()+−-]+"," ",row_text(ws))[:200] for _,ws in rows[revenue_index:] if re.search(r"profit|tax|diluted|revenue|interest|premium",row_text(ws),re.I)][:20]
                                source_meta["header_layouts"].append({"page":page_index+1,"rows":[{"y":y,"words":[[w[0],w[2],w[4]] for w in ws]} for y,ws in header_rows],"labels_without_amounts":labels})
                            if symbol=="BDL" and re.search(r"(?:correct|revis|discrepanc|clarif).{0,100}(?:xbrl|financial results)|xbrl.{0,100}(?:correct|revis|discrepanc)",text,re.I|re.S):
                                match=re.search(r".{0,200}(?:xbrl|discrepanc).{0,900}",text,re.I|re.S)
                                notices.append({"source_url":origin["source_url"],"original_sha256":batch.sha(raw),"original_r2_key":origin["original_r2_key"],"correction_excerpt":match.group(0) if match else "REVISION_TEXT_PRESENT"})
                            for period,entry in result.items():
                                entry["sources_checked"]+=1;options=[]
                                for i in range(min(len(pdf),40)):
                                    try:
                                        parsed=extract_page(pdf[i],i+1,period,symbol in batch.BANKS,symbol in batch.INSURERS,allow_comparative=True)
                                        options.append(parsed)
                                    except ValueError as error:
                                        code=str(error).split(":")[0]
                                        entry["rejections"][code]=entry["rejections"].get(code,0)+1
                                for parsed in options:
                                    entry["candidates"].append({"parsed":parsed,"source_url":origin["source_url"],"original_sha256":batch.sha(raw),
                                        "original_r2_key":origin["original_r2_key"],"issuer_name":legal,"bse_scrip_code":scrip,"bse_header":header,
                                        "review_basis_flags":flags,"source_reporting_basis":"AS_FILED_OWN_QUARTER" if parsed["first_column_period"]==period else "LATER_FILING_REPORTED_COMPARATIVE"})
                                    counts["dated_pdf_candidates"]+=1
                    except Exception as error:counts["source_error_"+type(error).__name__]+=1
            except Exception as error:
                db.rollback();company_error=str(error).split(":")[0] if isinstance(error,ValueError) and re.fullmatch(r"[A-Z_]+",str(error)) else type(error).__name__
                counts["company_errors"]+=1
            for period,entry in result.items():
                value={"contract":"RESULTS_R4_BSE_DATED_PDF_REVIEW_V1","diagnostic_only":True,"canonical_promotion_performed":False,
                    "symbol":symbol,"isin":isin,"security_id":str(sid),"company_error":company_error,"correction_notices":notices,"bse_identity":identity,"all_sources":all_sources,**entry}
                encoded=batch.canonical(value);digest=batch.sha(encoded)
                key=batch.PREFIX+"bse-dated-pdf-review/sha256="+digest+"/capture.json";batch.immutable_put(client,key,encoded)
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                      VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_BSE_DATED_PDF_REVIEW_V1',%s,%s,%s::jsonb,%s::jsonb)
                      ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",
                      (str(sid)+":"+period,digest,encoded.decode(),'{"retention":"ISSUER_ORIGINAL_IMMUTABLE_PRIVATE_R2","review_only":true}'))
                db.commit();counts["slots_reviewed"]+=1
                if entry["candidates"]:counts["slots_with_dated_candidates"]+=1
            print("R4_BSE_DATED_PDF_PROGRESS",json.dumps(dict(counts)),flush=True)
    print("R4_BSE_DATED_PDF_FINAL",json.dumps({"shard":args.shard,"counts":dict(counts)}),flush=True)

if __name__=="__main__":main()
