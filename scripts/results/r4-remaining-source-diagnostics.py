"""Inspect retained originals and issuer fields; no canonical financial writes."""
import sys,json,os,requests,psycopg,hashlib,xml.etree.ElementTree as ET
from collections import Counter
from r4_nse_issuer_bridge import legal_key,bridge_from_sources
from r4_issuer_rename import RULES,verify_rename_pdf
import fitz
from pathlib import Path
from datetime import datetime,timezone
sys.path.insert(0,str(Path(__file__).resolve().parent))
import importlib.util
spec=importlib.util.spec_from_file_location("lineage",Path(__file__).with_name("r4-nse-lineage-batch.py"))
lineage=importlib.util.module_from_spec(spec);spec.loader.exec_module(lineage)
batch= lineage.batch

def main():
    if os.environ.get("R4_PUBLIC_RENAME_ONLY")=="1":
        counts=Counter()
        for symbol,rule in RULES.items():
            try:
                response=requests.get(rule["url"],timeout=35);response.raise_for_status();raw=response.content
                counts["public_notices_retrieved"]+=1
                counts["prefix_is_pdf" if raw.startswith(b"%PDF") else "prefix_not_pdf"]+=1
                if not raw.startswith(b"%PDF"):
                    if raw.lstrip().startswith(b"%PDF"):counts["pdf_has_whitespace_prefix"]+=1
                    continue
                with fitz.open(stream=raw,filetype="pdf") as document:
                    normalized="".join(" ".join(p.get_text("text") for p in document).upper().split())
                    counts["public_notice_pages"]+=len(document)
                for field in ("old_symbol","old_name","new_name"):
                    token="".join(rule[field].upper().split())
                    counts[field+"_present" if token in normalized else field+"_absent"]+=1
                try:verify_rename_pdf(raw,symbol,rule["url"]);counts["verified_notices"]+=1
                except ValueError as error:
                    safe={"QUALIFIED_OFFICIAL_RENAME_DOCUMENT_REQUIRED","RENAME_AUTHORITY_PAGE_BOUND_EXCEEDED",
                        "OFFICIAL_RENAME_IDENTITY_NOT_PROVEN","OFFICIAL_RENAME_EFFECTIVE_DATE_NOT_PROVEN","OFFICIAL_RENAME_SCRIP_NOT_PROVEN"}
                    counts[str(error) if str(error) in safe else "NOTICE_VALIDATION_ERROR"]+=1
            except Exception as error:counts["public_notice_transport_or_decode_error"]+=1
        print("R4_PUBLIC_AUTHORITY_AGGREGATE",json.dumps(dict(counts)),flush=True)
        return
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();session=requests.Session();session.headers.update({"User-Agent":"Mozilla/5.0"})
    with psycopg.connect(url) as db,batch.PortfolioBSE() as bse:
        cohort=batch.candidates(db);db.rollback()
        counts=Counter();schemas={}
        for symbol,isin,sid,name,missing in cohort:
            try:
                code=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                header=bse._bse.equityMetaInfo(code)
                listings=bse._bse.listSecurities(scripcode=code,group="")
                listing=next((x for x in listings if str(x.get("SCRIP_CD"))==code and x.get("ISIN_NUMBER")==isin),{})
                for year,provider in (("2024",lineage.legacy),("2025",lineage.integrated)):
                    if not any(p.startswith(year) for p in missing):continue
                    day=datetime.now(timezone.utc).date().isoformat()
                    catalog_key=batch.PREFIX+f"nse-catalog-v2/symbol={symbol}/window={year}/retrieved_date={day}/records.json"
                    records=lineage.get_json(client,catalog_key)
                    if records is None:records=provider.list_filings(session,symbol)
                    for item in records[:2]:
                        original=item["xbrl"]
                        cached=lineage.get_json(client,batch.PREFIX+"nse-source-cache/"+hashlib.sha256(original.encode()).hexdigest()+"/source.json")
                        if not cached:continue
                        raw=client.get_object(Bucket=batch.BUCKET,Key=cached["original_r2_key"])["Body"].read()
                        if batch.sha(raw)!=cached["sha256"]:raise RuntimeError("RETAINED_ORIGINAL_HASH_MISMATCH")
                        try:
                            root=ET.fromstring(raw)
                            tags={lineage.legacy.local(n.tag) for n in root}
                            counts[year+":xml_parsed"]+=1
                            schema=",".join(sorted(item))
                            schemas[year+":"+schema]=sorted(item)
                            legal=legal_key(listing.get("Issuer_Name"))
                            for key,value in item.items():
                                if "name" in key.lower() or "company" in key.lower():
                                    counts[year+":catalog_field_present:"+key]+=1
                                    if legal and legal_key(value)==legal:counts[year+":legal_match_field:"+key]+=1
                            for name in ("Symbol","ScripCode","NameOfCompany","CompanyName","ISIN"):
                                nodes=[n for n in root if lineage.legacy.local(n.tag)==name]
                                if nodes:counts[year+":xml_identity_field_present:"+name]+=1
                                if name=="Symbol" and any((n.text or "").strip()==symbol for n in nodes):counts[year+":xml_symbol_exact"]+=1
                            for tag in tags:
                                if any(t in tag.lower() for t in ("revenuefrom","profit","earningspershare","earningslosspershare","diluted","premium","interest")):
                                    counts[year+":financial_tag_present:"+tag]+=1
                            for node in root:
                                if lineage.legacy.local(node.tag)=="context":
                                    if node.attrib.get("id")=="OneD":
                                        counts[year+":expected_quarter_context_present"]+=1
                                        ids=[(n.text or "").strip() for n in node.iter() if lineage.legacy.local(n.tag)=="identifier"]
                                        starts=[(n.text or "").strip() for n in node.iter() if lineage.legacy.local(n.tag)=="startDate"]
                                        ends=[(n.text or "").strip() for n in node.iter() if lineage.legacy.local(n.tag)=="endDate"]
                                        period=provider.dateval(item.get("toDate"))
                                        if period in batch.WINDOWS and starts==[batch.WINDOWS[period][0]] and ends==[period]:counts[year+":quarter_dates_exact"]+=1
                                        if any(lineage.legacy.local(n.tag) in ("scenario","segment") for n in node.iter()):counts[year+":quarter_has_dimensions"]+=1
                                        embedded_isins={(n.text or "").strip() for n in root if lineage.legacy.local(n.tag)=="ISIN"}
                                        if ids==[symbol]:counts[year+":quarter_identifier_matches_symbol"]+=1
                                        elif ids==[code]:counts[year+":quarter_identifier_matches_scrip"]+=1
                                        elif len(ids)==1 and ids[0] in embedded_isins:counts[year+":quarter_identifier_matches_embedded_isin"]+=1
                                        else:counts[year+":quarter_identifier_other"]+=1
                                    else:counts[year+":other_context_present"]+=1
                            try:
                                proof=bridge_from_sources(raw,item,symbol,isin,header,listing)
                                period=provider.dateval(item.get("toDate"))
                                normalized={**item,"fromDate":datetime.fromisoformat(batch.WINDOWS[period][0]).strftime("%d-%b-%Y")}
                                parsed,error=lineage.legacy.extract(raw,normalized,symbol,isin,proof)
                                if error:counts[year+":parser_error:"+error]+=1
                                else:
                                    for metric in parsed["facts"]:counts[year+":parsed_metric:"+metric]+=1
                            except ValueError as error:counts[year+":identity_rejection:"+str(error)]+=1
                        except ET.ParseError:counts[year+":invalid_xml"]+=1
            except Exception as error:counts["operational_error:"+type(error).__name__]+=1
        # No issuer identifiers, raw source values, portfolio data or artifacts are exported.
        print("R4_AGGREGATE_SCHEMA_DIAGNOSTIC",json.dumps({"counts":dict(counts),"catalog_schema_keys":list(schemas.values())}),flush=True)

if __name__=="__main__":main()
