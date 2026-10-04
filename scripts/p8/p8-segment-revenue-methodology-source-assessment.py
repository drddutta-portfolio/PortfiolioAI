#!/usr/bin/env python3
import hashlib, json, re
from datetime import datetime, timezone
from pathlib import Path
import requests, io, pdfplumber
from bs4 import BeautifulSoup

URL="https://www.nseindia.com/static/products-services/industry-classification"
TAX=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
OUT=Path("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_METHODOLOGY_SOURCE_ASSESSMENT_2026-10-04.json")

def sha256(b): return hashlib.sha256(b).hexdigest()
def clean(x): return " ".join(str(x or "").split())

def main():
    tax=json.loads(TAX.read_text())
    r=requests.get(URL,timeout=60,headers={
      "User-Agent":"Mozilla/5.0 PortfolioAI methodology-reference audit",
      "Accept":"text/html,application/xhtml+xml"
    })
    r.raise_for_status()
    html=r.content
    soup=BeautifulSoup(html,"html.parser")
    text=clean(soup.get_text(" ",strip=True))
    required={
      "four_tier": "4 tier structure" in text.lower(),
      "single_business": "only 1 line of business" in text.lower(),
      "multi_business_gt50": "more than 50%" in text.lower(),
      "audited_consolidated_prime_source": "Audited consolidated annual financials report" in text,
      "diversified": "Diversified" in text,
      "annual_review": "reviewed on annual basis" in text.lower(),
    }
    updated=re.search(r"Updated on:\s*([0-9/]+)",text,re.I)
    snippets={}
    for key,needle in {
      "dominance":"more than 50%",
      "prime_source":"Audited consolidated annual financials report",
      "diversified":"classified as ‘Diversified’",
      "revenue_basis":"revenues are more stable than the profits",
    }.items():
      idx=text.lower().find(needle.lower())
      snippets[key]=text[max(0,idx-180):idx+420] if idx>=0 else None
    # Re-read the same frozen official Nov-2022 PDF to preserve definition-level historical evidence.
    pdf_url=tax["source"]["url"]
    pr=requests.get(pdf_url,timeout=60,headers={"User-Agent":"Mozilla/5.0 PortfolioAI methodology-reference audit"})
    pr.raise_for_status()
    if sha256(pr.content)!=tax["source"]["content_sha256"]:
      raise SystemExit("Nov-2022 taxonomy PDF hash drift")
    with pdfplumber.open(io.BytesIO(pr.content)) as pdf:
      pdf_text=clean(" ".join((p.extract_text() or "") for p in pdf.pages))
    historical_definition_support=[]
    for phrase in ("more than 50%","at least 20%","less than 20%"):
      idx=pdf_text.lower().find(phrase.lower())
      if idx>=0:
        historical_definition_support.append({"phrase":phrase,"snippet":pdf_text[max(0,idx-220):idx+520]})
    assessment={
      "version":"P8_SEGMENT_REVENUE_METHODOLOGY_SOURCE_ASSESSMENT_V1",
      "retrieved_at":datetime.now(timezone.utc).isoformat(),
      "current_methodology_page":{
        "authority":"NSE Indices Limited",
        "url":URL,
        "content_sha256":sha256(html),
        "content_length":len(html),
        "updated_on":updated.group(1) if updated else None,
        "required_rule_presence":required,
        "snippets":snippets
      },
      "frozen_taxonomy_reference":{
        "version_label":tax["source"]["version_label"],
        "official_source_sha256":tax["source"]["content_sha256"],
        "taxonomy_payload_sha256":sha256(TAX.read_bytes()),
        "historical_definition_support":historical_definition_support,
        "taxonomy_pdf_reverified_sha256":sha256(pr.content)
      },
      "version_assessment":{
        "exact_november_2022_methodology_text_preserved":False,
        "current_methodology_postdates_taxonomy_reference":True,
        "safe_conclusion":"Current official NSE methodology documents audited consolidated annual financials as prime source and >50% segment-revenue dominance, while the November-2022 taxonomy definitions provide historical evidence that >50%/20% diversified concepts existed in that structure. This does not prove the entire current methodology text was identical in November 2022.",
        "portfolioai_policy_effect":"Treat the >50% rule as an evidence-backed candidate, not adopted historical replay policy, until explicit owner approval."
      }
    }
    OUT.write_text(json.dumps(assessment,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"html_sha256":sha256(html),"updated_on":assessment["current_methodology_page"]["updated_on"],"rules":required,"historical_definition_rows":len(historical_definition_support)},indent=2))
    if not all(required.values()):
      raise SystemExit("required current methodology statements were not all found")

if __name__=="__main__": main()
