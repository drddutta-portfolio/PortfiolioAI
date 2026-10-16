"""Inspect retained originals and issuer fields; no canonical financial writes."""
import sys,json,os,requests,psycopg,hashlib,xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime,timezone
sys.path.insert(0,str(Path(__file__).resolve().parent))
import importlib.util
spec=importlib.util.spec_from_file_location("lineage",Path(__file__).with_name("r4-nse-lineage-batch.py"))
lineage=importlib.util.module_from_spec(spec);spec.loader.exec_module(lineage)
batch= lineage.batch

def main():
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();session=requests.Session();session.headers.update({"User-Agent":"Mozilla/5.0"})
    with psycopg.connect(url) as db,batch.PortfolioBSE() as bse:
        cohort=batch.candidates(db);db.rollback()
        reports=[]
        for symbol,isin,sid,name,missing in cohort:
            try:
                code=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                header=bse._bse.equityMetaInfo(code)
                listings=bse._bse.listSecurities(scripcode=code,group="")
                listing=next((x for x in listings if str(x.get("SCRIP_CD"))==code and x.get("ISIN_NUMBER")==isin),{})
                for year,provider in (("2024",lineage.legacy),("2025",lineage.integrated)):
                    if not any(p.startswith(year) for p in missing):continue
                    day=datetime.now(timezone.utc).date().isoformat()
                    catalog_key=batch.PREFIX+f"nse-catalog-v1/symbol={symbol}/window={year}/retrieved_date={day}/records.json"
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
                            identity=[{"tag":lineage.legacy.local(n.tag),"value":(n.text or "").strip(),"context":n.attrib.get("contextRef")}
                                for n in root.iter() if any(t in lineage.legacy.local(n.tag).lower() for t in ("symbol","scripcode","companyname","nameofcompany","isin","identifier"))][:20]
                            financial=[{"tag":lineage.legacy.local(n.tag),"value":(n.text or "").strip(),"attributes":n.attrib}
                                for n in root if n.attrib.get("contextRef")=="OneD" and any(t in lineage.legacy.local(n.tag).lower() for t in ("revenuefrom","profitlossfor","diluted","premium","interestearned","interestexpended"))]
                        except ET.ParseError:identity=[{"invalid_xml_prefix":raw[:100].decode(errors="replace")}];financial=[]
                        report={"symbol":symbol,"isin":isin,"missing":missing,"metadata":item,"bse_listing":listing,
                            "bse_header":{k:v for k,v in header.items() if any(t in k.lower() for t in ("name","isin","code"))},
                            "original_sha256":cached["sha256"],"original_r2_key":cached["original_r2_key"],
                            "xml_identity":identity,"financial":financial}
                        reports.append(report);print("R4_REMAINING_DIAGNOSTIC",json.dumps(report),flush=True)
            except Exception as error:print("R4_DIAGNOSTIC_ERROR",symbol,type(error).__name__,str(error)[:160],flush=True)
        Path("tmp/results-r4").mkdir(parents=True,exist_ok=True)
        Path("tmp/results-r4/remaining-source-diagnostics.json").write_text(json.dumps(reports,sort_keys=True))

if __name__=="__main__":main()
