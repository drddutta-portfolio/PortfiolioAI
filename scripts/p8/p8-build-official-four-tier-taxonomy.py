#!/usr/bin/env python3
import hashlib, json, os, re, sys
from pathlib import Path
from datetime import datetime, timezone
import requests, pdfplumber

URL="https://nsearchives.nseindia.com/s3fs-public/inline-files/nse-indices_industry-classification-structure-2022-11.pdf"
SOURCE_VERSION="NSE_INDICES_INDUSTRY_CLASSIFICATION_NOVEMBER_2022"
OUT=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
MANIFEST=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022_ADOPTION_MANIFEST.json")
TMP=Path("/tmp/nse-indices-industry-classification-structure-2022-11.pdf")
EXPECTED={"MACRO_ECONOMIC_SECTOR":12,"SECTOR":22,"INDUSTRY":59,"BASIC_INDUSTRY":197}

CODE_RX={
 "MACRO_ECONOMIC_SECTOR":re.compile(r"^IN\d{2}$"),
 "SECTOR":re.compile(r"^IN\d{4}$"),
 "INDUSTRY":re.compile(r"^IN\d{6}$"),
 "BASIC_INDUSTRY":re.compile(r"^IN\d{9}$"),
}
ANY_CODE=re.compile(r"^IN\d{2}(?:\d{2})?(?:\d{2})?(?:\d{3})?$")

def clean(x):
    if x is None: return ""
    return " ".join(str(x).replace("\u00ad","").replace("\x00","").split())

def sha256(b): return hashlib.sha256(b).hexdigest()

def download():
    r=requests.get(URL,timeout=60,headers={"User-Agent":"Mozilla/5.0 PortfolioAI taxonomy-reference audit"})
    r.raise_for_status()
    if not r.content.startswith(b"%PDF"): raise RuntimeError("official taxonomy reference is not a PDF")
    TMP.write_bytes(r.content)
    return r.content,dict(r.headers)

def level_for(code):
    for level,rx in CODE_RX.items():
        if rx.match(code): return level
    return None

def parse_layout_pdf():
    nodes={}
    diagnostics=[]
    order=["MACRO_ECONOMIC_SECTOR","SECTOR","INDUSTRY","BASIC_INDUSTRY"]
    bands={
      "MACRO_ECONOMIC_SECTOR":(60.0,195.0),
      "SECTOR":(195.0,324.0),
      "INDUSTRY":(324.0,465.0),
      "BASIC_INDUSTRY":(465.0,635.0),
    }
    current={k:None for k in order}
    with pdfplumber.open(TMP) as pdf:
        for pageno,page in enumerate(pdf.pages[1:21],start=2):
            words=page.extract_words(x_tolerance=2,y_tolerance=2,keep_blank_chars=False)
            lines={}
            for w in words:
                top=round(float(w["top"]),1)
                if top < 95:  # table headers
                    continue
                lines.setdefault(top,[]).append(w)
            for top,ws in sorted(lines.items()):
                ws=sorted(ws,key=lambda z:float(z["x0"]))
                # Ignore page footer/disclaimer material.
                line_text=" ".join(str(x["text"]) for x in ws)
                if "NSE Indices Industry Classification Structure" in line_text or line_text.startswith("Disclaimer"):
                    continue
                for li,lvl in enumerate(order):
                    left,right=bands[lvl]
                    toks=[clean(w["text"]) for w in ws if left <= float(w["x0"]) < right]
                    toks=[t for t in toks if t]
                    if not toks: continue
                    code_idx=next((i for i,t in enumerate(toks) if level_for(t)==lvl),None)
                    if code_idx is not None:
                        code=toks[code_idx]
                        name=clean(" ".join(toks[code_idx+1:]))
                        current[lvl]=code
                        for lower in order[li+1:]:
                            current[lower]=None
                        if code not in nodes:
                            nodes[code]={"code":code,"level":lvl,"name":name,"source_page":pageno}
                        elif name and not nodes[code]["name"]:
                            nodes[code]["name"]=name
                        elif name and nodes[code]["name"]!=name:
                            diagnostics.append({"page":pageno,"code":code,"reason":"DUPLICATE_NAME_VARIANT","existing":nodes[code]["name"],"new":name})
                    elif current[lvl]:
                        # Continuation of a wrapped display name within the fixed column.
                        # Reject obvious non-name header/footer fragments.
                        frag=clean(" ".join(toks))
                        if frag and frag not in ("Economic Sector","Sector","Industry","Basic Industry","Definition"):
                            nodes[current[lvl]]["name"]=clean(nodes[current[lvl]]["name"]+" "+frag)
    return nodes,diagnostics

def build_hierarchy(nodes):
    # Codes encode parentage.
    for n in nodes.values():
        c=n["code"]
        if n["level"]=="MACRO_ECONOMIC_SECTOR": n["parent_code"]=None
        elif n["level"]=="SECTOR": n["parent_code"]=c[:4]   # INxx
        elif n["level"]=="INDUSTRY": n["parent_code"]=c[:6] # INxxxx
        else: n["parent_code"]=c[:8]                        # INxxxxxx
    return nodes

def validate(nodes):
    counts={k:0 for k in EXPECTED}
    dup_names={}
    for n in nodes.values():
        counts[n["level"]]+=1
        dup_names.setdefault((n["level"],n["name"]),[]).append(n["code"])
    errors=[]
    for k,v in EXPECTED.items():
        if counts[k]!=v: errors.append(f"COUNT_{k}:{counts[k]}!={v}")
    for n in nodes.values():
        if not n["name"]: errors.append(f"EMPTY_NAME:{n['code']}")
        if n["parent_code"] and n["parent_code"] not in nodes: errors.append(f"ORPHAN:{n['code']}->{n['parent_code']}")
    for (lvl,name),codes in dup_names.items():
        if name and len(codes)>1:
            # duplicate names may be legitimate but must be disclosed
            pass
    expected_names={
          "IN02":"Consumer Discretionary",
          "IN04":"Fast Moving Consumer Goods",
          "IN08":"Information Technology",
          "IN10":"Telecommunication",
          "IN060101001":"Pharmaceuticals",
          "IN060103001":"Hospital",
          "IN070202002":"Commercial Vehicles",
          "IN040101001":"Edible Oil",
          "IN020602001":"Education",
          "IN110101004":"Power Generation",
        }
    for code,name in expected_names.items():
        if code not in nodes: errors.append(f"SPOTCHECK_MISSING:{code}")
        elif norm_name(nodes[code]["name"])!=norm_name(name):
            errors.append(f"SPOTCHECK_NAME:{code}:{nodes[code]['name']}!={name}")

    return counts,errors

def norm_name(x):
    return re.sub(r"[^A-Z0-9]+","_",clean(x).upper()).strip("_")

def main():
    pdf,headers=download()
    nodes,diagnostics=parse_layout_pdf()
    nodes=build_hierarchy(nodes)
    counts,errors=validate(nodes)

    package={
      "contract":"PORTFOLIOAI_NSE_FOUR_TIER_TAXONOMY_REFERENCE_V1",
      "status":"REFERENCE_CANDIDATE_PENDING_PORTFOLIOAI_OWNER_ADOPTION",
      "source":{
        "authority":"NSE Indices Limited",
        "title":"Industry Classification Structure",
        "version_label":"November 2022",
        "url":URL,
        "retrieved_at":datetime.now(timezone.utc).isoformat(),
        "content_sha256":sha256(pdf),
        "content_length":len(pdf),
        "http_last_modified":headers.get("Last-Modified"),
        "http_etag":headers.get("ETag"),
      },
      "declared_scope":{
        "hierarchy":["MACRO_ECONOMIC_SECTOR","SECTOR","INDUSTRY","BASIC_INDUSTRY"],
        "expected_counts":EXPECTED,
        "source_methodology_page":"https://www.nseindia.com/static/products-services/industry-classification"
      },
      "counts":counts,
      "validation":{
        "complete_for_declared_source":not errors,
        "errors":errors,
        "diagnostic_count":len(diagnostics),
        "orphan_count":sum(1 for e in errors if e.startswith("ORPHAN:")),
        "empty_name_count":sum(1 for e in errors if e.startswith("EMPTY_NAME:")),
      },
      "nodes":sorted(nodes.values(),key=lambda x:(len(x["code"]),x["code"])),
      "extraction_diagnostics":diagnostics[:200]
    }
    OUT.write_text(json.dumps(package,indent=2,sort_keys=True)+"\n")

    manifest={
      "version":"P8_NSE_FOUR_TIER_TAXONOMY_ADOPTION_MANIFEST_V1",
      "taxonomy_contract":package["contract"],
      "taxonomy_file":str(OUT),
      "taxonomy_payload_sha256":sha256(OUT.read_bytes()),
      "official_source_sha256":sha256(pdf),
      "authority_candidate_complete":not errors,
      "adopted_as_portfolioai_historical_authority":False,
      "owner_policy_status":{
        "OD1":"PENDING_OWNER_DECISION",
        "OD2":"PENDING_OWNER_DECISION",
        "OD3":"PENDING_OWNER_DECISION",
        "OD4":"PENDING_OWNER_DECISION"
      },
      "adoption_blockers":[
        "Owner approval of OD1 retrospective vocabulary policy is not recorded.",
        "Owner approval of OD2 evidence-backed synonym policy is not recorded.",
        "Owner approval of OD3 no-dominance-inference policy is not recorded.",
        "Owner approval of OD4 diversified-specialised-routing-blocked policy is not recorded.",
        "This repository candidate must not overwrite live Development taxonomy without separately authorized migration/write scope."
      ],
      "safe_for_canary_candidate_evaluation":not errors
    }
    MANIFEST.write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"counts":counts,"errors":errors,"source_sha256":sha256(pdf),"taxonomy_sha256":manifest["taxonomy_payload_sha256"],"diagnostics":len(diagnostics)},indent=2))
    if errors: sys.exit(2)

if __name__=="__main__": main()
