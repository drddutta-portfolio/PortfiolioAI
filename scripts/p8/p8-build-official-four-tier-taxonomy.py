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

def extract_rows():
    raw=[]
    with pdfplumber.open(TMP) as pdf:
        for pageno,page in enumerate(pdf.pages[1:21],start=2):
            tables=page.extract_tables({
              "vertical_strategy":"text",
              "horizontal_strategy":"text",
              "snap_tolerance":3,
              "join_tolerance":3,
              "intersection_tolerance":5,
              "text_tolerance":3,
              "min_words_vertical":1,
              "min_words_horizontal":1,
            })
            for table in tables:
                for row in table or []:
                    cells=[clean(c) for c in (row or [])]
                    if not any(cells): continue
                    raw.append({"page":pageno,"cells":cells})
    return raw

def parse(raw_rows):
    nodes={}
    diagnostics=[]
    # Table extraction usually places code and name in adjacent cells. Search each row for code cells,
    # then take text until next code as that node's displayed label.
    for row in raw_rows:
        cells=row["cells"]
        code_positions=[]
        for i,c in enumerate(cells):
            cc=clean(c)
            if ANY_CODE.match(cc) and level_for(cc):
                code_positions.append((i,cc,level_for(cc)))
        for idx,(pos,code,level) in enumerate(code_positions):
            next_pos=code_positions[idx+1][0] if idx+1<len(code_positions) else len(cells)
            pieces=[clean(x) for x in cells[pos+1:next_pos] if clean(x)]
            # Remove obvious header/definition noise from label candidate.
            pieces=[x for x in pieces if x not in ("MES_Code","Macro Economic Sector","Sect_Code","Sector","Ind_Code","Industry","Basic_Ind_Code","Basic Industry","Definition")]
            name=pieces[0] if pieces else ""
            # Some extractors place code+name in one cell; fallback to matching same row text.
            if not name:
                diagnostics.append({"page":row["page"],"code":code,"reason":"NAME_EMPTY","cells":cells})
            if code in nodes:
                # Repeated code on same/next page should be identical; keep first nonempty and record mismatch.
                if name and nodes[code]["name"] and name!=nodes[code]["name"]:
                    diagnostics.append({"page":row["page"],"code":code,"reason":"DUPLICATE_NAME_VARIANT","existing":nodes[code]["name"],"new":name})
                elif name and not nodes[code]["name"]:
                    nodes[code]["name"]=name
                continue
            nodes[code]={"code":code,"level":level,"name":name,"source_page":row["page"]}
    return nodes,diagnostics

def fallback_parse_text(nodes):
    # Use per-page word coordinates if table extraction missed codes/names.
    with pdfplumber.open(TMP) as pdf:
        for pageno,page in enumerate(pdf.pages[1:21],start=2):
            words=page.extract_words(x_tolerance=2,y_tolerance=2,keep_blank_chars=False)
            # Group by approximate top coordinate.
            lines={}
            for w in words:
                lines.setdefault(round(float(w["top"]),1),[]).append(w)
            for _,ws in sorted(lines.items()):
                ws=sorted(ws,key=lambda w:float(w["x0"]))
                texts=[clean(w["text"]) for w in ws]
                for i,t in enumerate(texts):
                    if not (ANY_CODE.match(t) and level_for(t)): continue
                    if t in nodes and nodes[t].get("name"): continue
                    level=level_for(t)
                    # Collect words after code until next recognized code, stopping before long definition region
                    parts=[]
                    for u in texts[i+1:]:
                        if ANY_CODE.match(u) and level_for(u): break
                        if u in ("MES_Code","Sect_Code","Ind_Code","Basic_Ind_Code","Definition"): break
                        parts.append(u)
                    name=clean(" ".join(parts))
                    if t not in nodes: nodes[t]={"code":t,"level":level,"name":name,"source_page":pageno}
                    elif name and not nodes[t].get("name"): nodes[t]["name"]=name
    return nodes

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
    return counts,errors

def main():
    pdf,headers=download()
    rows=extract_rows()
    nodes,diagnostics=parse(rows)
    nodes=fallback_parse_text(nodes)
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
