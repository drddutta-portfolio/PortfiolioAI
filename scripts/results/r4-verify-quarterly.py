#!/usr/bin/env python3
"""Development-only R4. Verify R2 manifest bytes and select current-display
facts that agree with the immutable filing. Does not establish issuer publication
time, adjust historical share basis or change any investment research score."""
import argparse, hashlib, json, os, re
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from threading import BoundedSemaphore
SOURCE_REPLAY_SLOTS=BoundedSemaphore(2)
from datetime import date,datetime
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse
from r4_issuer_name import explicit_legal_name
import boto3, psycopg
from botocore.config import Config
from psycopg.rows import dict_row

REF="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
PREFIX="portfolioai-results/development/v1/quarterly/"
# The base R4 gate retains its original four-quarter authority. R5 may
# additionally select separately validated historical comparison facts only.
R4_EIGHT_QUARTER_MODE=os.getenv("RESULTS_R4_EIGHT_QUARTER_SELECTION","0")=="1"
R5_COMPARISON_MODE=os.getenv("RESULTS_R5_COMPARISON_SELECTION","0")=="1"
R5_LEGACY_MODE=os.getenv("RESULTS_R5_LEGACY_SELECTION","0")=="1"
QUARTERS=(("2024-09-30","2024-12-31","2025-03-31","2025-06-30",
            "2025-09-30","2025-12-31","2026-03-31","2026-06-30")
          if R4_EIGHT_QUARTER_MODE else
          ("2024-09-30","2024-12-31") if R5_LEGACY_MODE else
          ("2025-03-31","2025-06-30") if R5_COMPARISON_MODE
          else ("2025-09-30","2025-12-31","2026-03-31","2026-06-30"))
BANKS=set("AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK".split())
BANK_REQUIRED={"NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
OTHER_REQUIRED={"OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
INSURERS={"STARHEALTH"}
INSURANCE_REQUIRED={"NET_PREMIUM_EARNED_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
UNITS={"NET_PREMIUM_EARNED_QUARTER":"INR_CRORE","OPERATING_REVENUE_QUARTER":"INR_CRORE","NET_PROFIT_QUARTER":"INR_CRORE",
       "NET_INTEREST_INCOME_QUARTER":"INR_CRORE","OPERATING_PROFIT_QUARTER":"INR_CRORE",
       "EPS_DILUTED":"INR_PER_SHARE","GROSS_NPA_PERCENT":"PERCENT","NET_NPA_PERCENT":"PERCENT"}
def canonical_bytes(x):
    return json.dumps(x,sort_keys=True,separators=(",",":")).encode()
def sha(x):return hashlib.sha256(x).hexdigest()

# Only specific original reported share bases documented by original NSE
# iXBRL identity and the official exchange split/ISIN circulars qualify.
# No EPS adjustment; cross-split comparisons remain prohibited.
APPROVED_SPLIT_ISINS={
"E2E":("INE255Z01019","INE255Z01027","2026-06-05","10","MSE/LIST/19135/2026"),
"POCL":("INE063E01053","INE063E01061","2026-07-21","2.5","NSE change in ISIN notice 2026-07-17"),
"BECTORFOOD":("INE495P01012","INE495P01020","2025-12-12","5","MSE/LIST/18238/2025"),
"V2RETAIL":("INE945H01013","INE945H01021","2026-03-25","10","BSE DR-847/2025-2026"),
"KOTAKBANK":("INE237A01028","INE237A01036","2026-01-14","5","Kotak Mahindra Bank issuer split disclosure 2026-01-16"),
"ANGELONE":("INE732I01013","INE732I01021","2026-02-26","10","BSE DR-829/2025-2026"),
"CAMS":("INE596I01012","INE596I01020","2025-12-05","5","NCL/CMPT/71607"),
"TDPOWERSYS":("INE419M01027","INE419M01035","2026-08-24","2","NSE/CML/75855")}
def historical_original_eps_proof(m):
    link=m.get("historical_identity_link")
    if not link:return None
    if not isinstance(link,dict):return "HISTORICAL_IDENTITY_MALFORMED"
    known=APPROVED_SPLIT_ISINS.get(m.get("symbol"))
    if not known:return "HISTORICAL_IDENTITY_NOT_APPROVED"
    old,new,exdate,factor,circular=known
    if (m.get("source_isin")!=old or m.get("isin")!=new
        or link.get("source_isin")!=old or link.get("current_isin")!=new
        or link.get("ex_date")!=exdate or str(link.get("split_new_per_old"))!=factor):
        return "HISTORICAL_IDENTITY_MISMATCH"
    if circular not in link.get("evidence",""):return "HISTORICAL_SPLIT_CIRCULAR_MISSING"
    if (m.get("period_end") is None or m["period_end"]>=exdate
        or m.get("eps_as_originally_reported_before_split") is not True):
        return "HISTORICAL_ORIGINAL_EPS_UNPROVEN"
    return None

def check_manifest(record,manifest):
    raw=record["raw_payload"]
    if not isinstance(raw,dict) or not isinstance(manifest,dict):return "MALFORMED_MANIFEST"
    if sha(canonical_bytes(raw))!=record["payload_hash"]:return "SOURCE_HASH_MISMATCH"
    if {k:v for k,v in raw.items() if k not in ("r2_key","r2_manifest_sha256")}!=manifest:return "SOURCE_MANIFEST_MISMATCH"
    contract=manifest.get("contract")
    if contract not in ("PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1",
                         "PORTFOLIOAI_RESULTS_BSE_2024_ORIGINAL_PDF_COMPACT_V1",
                         "PORTFOLIOAI_RESULTS_BSE_ASTRAL_2024_PDF_COMPACT_V1",
                         "PORTFOLIOAI_RESULTS_BSE_ASHOKA_2024_PDF_COMPACT_V1",
                         "PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1",
                         "PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1"):
        return "UNAPPROVED_CONTRACT"
    if manifest.get("period_end") not in QUARTERS:return "OUTSIDE_QUARTERS"
    # Narrow 2024 catalog ISIN omission; source NSE symbol is independently
    # tied to exactly this issued security in official NSE circular CML/61473.
    if manifest.get("independent_isin_evidence"):
        exact_axis=(manifest.get("contract")=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1"
            and manifest.get("symbol")=="AXISBANK"
            and manifest.get("isin")=="INE238A01034"
            and manifest.get("original_filing_isin")=="INE238A01034"
            and manifest.get("period_end") in ("2024-09-30","2024-12-31")
            and manifest.get("independent_isin_evidence")=="NSE_CML61473_2024_AXISBANK_INE238A01034")
        exact_cams=(manifest.get("contract")=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1"
            and manifest.get("symbol")=="CAMS"
            and manifest.get("isin")=="INE596I01020"
            and manifest.get("original_filing_isin")=="INE596I01012"
            and manifest.get("period_end") in ("2024-09-30","2024-12-31")
            and manifest.get("independent_isin_evidence")=="NCL_CMPT71607_CAMS_2024_PRE_SPLIT_ISIN"
            and manifest.get("eps_as_originally_reported_before_split") is True)
        exact_td=(manifest.get("contract")=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1"
            and manifest.get("symbol")=="TDPOWERSYS"
            and manifest.get("isin")=="INE419M01035"
            and manifest.get("original_filing_isin")=="INE419M01027"
            and manifest.get("period_end") in ("2024-09-30","2024-12-31")
            and manifest.get("independent_isin_evidence")=="NSE_CML75855_TDPOWERSYS_2024_PRE_SPLIT_ISIN"
            and manifest.get("eps_as_originally_reported_before_split") is True)
        exact_kotak=(manifest.get("contract")=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1"
            and manifest.get("symbol")=="KOTAKBANK"
            and manifest.get("isin")=="INE237A01036"
            and manifest.get("original_filing_isin")=="INE237A01028"
            and manifest.get("period_end") in ("2024-09-30","2024-12-31")
            and manifest.get("independent_isin_evidence")=="MSE_LIST18443_KOTAKBANK_2024_PRE_SPLIT_ISIN"
            and manifest.get("eps_as_originally_reported_before_split") is True)
        if not (exact_axis or exact_cams or exact_td or exact_kotak):
            return "LEGACY_HISTORICAL_ISIN_CIRCULAR_UNPROVEN"
    try:
        days=(date.fromisoformat(manifest["period_end"])-date.fromisoformat(manifest["period_start"])).days
        if not 75<=days<=100:return "NOT_SINGLE_QUARTER"
    except (KeyError,ValueError,TypeError):return "INVALID_QUARTER_DATES"
    if manifest.get("consolidation_scope") not in ("STANDALONE","CONSOLIDATED"):return "SCOPE_NOT_PROVEN"
    u=urlparse(manifest.get("issuer_filing_url",""))
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1":
        approved={"COFORGE":("www.coforge.com","/hubfs/Outcome-of-Board-Meeting-Q3-FY2026.pdf"),
                  "SHAILY":("static.shaily.com","/y7GuSh95RsG5gOUUnd6i-covering-letter-reg-33-30092025-signed-pdf"),
                  "HBLENGINE":("www.hbl.in","/reports/results_sep2025.pdf")}
        expected=approved.get(manifest.get("symbol"))
        if not expected or u.scheme!="https" or (u.hostname,u.path)!=expected or u.query or u.fragment:
            return "UNAPPROVED_ORIGINAL_ISSUER_PDF"
        original=manifest.get("original_sha256_retained")
        original_key=manifest.get("original_r2_key")
        if (not isinstance(original,str) or len(original)!=64
            or not isinstance(original_key,str) or not original_key.startswith(PREFIX)
            or not original_key.endswith("/issuer-original.pdf")
            or "/original_version="+original+"/" not in original_key):
            return "INVALID_RETAINED_ORIGINAL_REFERENCE"
        if manifest.get("original_pdf_retained") is not True:return "ORIGINAL_PDF_NOT_RETAINED"
    elif contract=="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1" and (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com" or not u.path.startswith("/corporate/ixbrl/")):
        return "UNQUALIFIED_ORIGIN"
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1":
        if (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/[A-Za-z0-9_.-]+\.xml",u.path)
            or u.query or u.fragment):
            return "UNQUALIFIED_LEGACY_ORIGINAL_XBRL"
        original=manifest.get("original_sha256_retained")
        original_key=manifest.get("original_r2_key")
        if (not isinstance(original,str) or not re.fullmatch(r"[a-f0-9]{64}",original)
            or not isinstance(original_key,str) or not original_key.startswith(PREFIX)
            or not original_key.endswith("/original-xbrl.xml")
            or "/original_version="+original+"/" not in original_key
            or manifest.get("original_xbrl_retained") is not True
            or manifest.get("reporting_currency")!="INR"):
            return "INVALID_RETAINED_LEGACY_XBRL_REFERENCE"
    if contract=="PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1":
        original=manifest.get("original_sha256_retained")
        original_key=manifest.get("original_r2_key")
        proof=manifest.get("issuer_bridge")
        identity_key=manifest.get("issuer_identity_evidence_r2_key")
        identity_sha=manifest.get("issuer_identity_evidence_sha256")
        if (manifest.get("period_end") not in ("2024-09-30","2024-12-31","2025-03-31","2025-06-30")
            or u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/[A-Za-z0-9_.-]+\.xml",u.path)
            or u.query or u.fragment or not re.fullmatch(r"[a-f0-9]{64}",str(original or ""))
            or not isinstance(original_key,str) or not original_key.startswith(PREFIX)
            or "/original_version="+original+"/original-xbrl.xml" not in original_key
            or manifest.get("original_xbrl_retained") is not True
            or manifest.get("raw_nse_bytes_retained") is not True
            or not isinstance(proof,dict) or proof.get("contract")!="RESULTS_R4_NSE_XML_EXCHANGE_CODE_ISSUER_LINEAGE_V1"
            or proof.get("symbol")!=manifest.get("symbol") or proof.get("canonical_isin")!=manifest.get("isin")
            or proof.get("share_basis")!="AS_FILED_EPS_ONLY_CORPORATE_ACTION_COMPARABILITY_UNPROVEN"
            or not re.fullmatch(r"[0-9]{6}",str(proof.get("bse_scrip_code","")))
            or not re.fullmatch(r"[a-f0-9]{64}",str(identity_sha or ""))
            or not isinstance(identity_key,str) or not identity_key.startswith(PREFIX)
            or "/source_version="+identity_sha+"/exchange-issuer-identity.json" not in identity_key
            or manifest.get("historical_eps_reporting_basis")!="AS_FILED_NOT_RETROSPECTIVELY_ADJUSTED"
            or manifest.get("historical_share_adjustment_authorized") is not False):
            return "NSE_EXCHANGE_ISSUER_LINEAGE_UNPROVEN"
    if contract in ("PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1"):
        if (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/INTEGRATED_FILING_(?:INDAS|BANKING)_[A-Za-z0-9_]+\.xml",u.path,re.I)
            or u.query or u.fragment
            or not re.fullmatch(r"[a-f0-9]{64}",str(manifest.get("original_sha256_unretained","")))
            or manifest.get("original_xbrl_retained") is not False
            or manifest.get("raw_nse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"):
            return "UNQUALIFIED_2025_ORIGINAL_XBRL"
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1":
        if (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/[A-Za-z0-9_.-]+\.xml",u.path)
            or u.query or u.fragment
            or not re.fullmatch(r"[a-f0-9]{64}",str(manifest.get("original_sha256_unretained","")))
            or manifest.get("original_xbrl_retained") is not False
            or manifest.get("raw_nse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"):
            return "UNQUALIFIED_2024_COMPACT_ORIGINAL"
    if contract=="PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1":
        if manifest.get("scope_evidence_basis") is not None and (manifest.get("scope_evidence_basis")!="NSE_ORIGINAL_SAME_STATEMENT_SCOPE_V1" or manifest.get("parser_revision")!="PDF_WORD_COORDINATES_DATED_COLUMN_V1"):
            return "DATED_PDF_SCOPE_EVIDENCE_BASIS_UNPROVEN"
        # Generalized original-source contract: never trust a ticker lookup alone,
        # a metric snapshot, or a Trendlyne search snippet as a BSE issuer filing.
        url_path=r"/xml-data/corpfiling/(?:AttachHis|AttachLive)/[0-9a-f-]{36}\.pdf"
        original=manifest.get("original_sha256_retained")
        original_key=manifest.get("original_r2_key")
        period=manifest.get("period_end")
        if manifest.get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1"):
            proofhash=manifest.get("issuer_identity_evidence_sha256")
            if (manifest.get("selected_column_period")!=period
                or type(manifest.get("selected_column_index")) is not int
                or not 0<=manifest["selected_column_index"]<=2
                or not re.fullmatch(r"[a-f0-9]{64}",str(proofhash or ""))
                or manifest.get("issuer_identity_evidence_r2_key")!=PREFIX+"bse-dated-identity/sha256="+str(proofhash)+"/proof.json"
                or manifest.get("source_reporting_basis") not in ("AS_FILED_OWN_QUARTER","LATER_FILING_REPORTED_COMPARATIVE")):
                return "DATED_PDF_COLUMN_OR_IDENTITY_PROOF_UNPROVEN"
        if manifest.get("parser_revision")=="PDF_OCR_EXPLICIT_DATED_COLUMN_V1":
            if (manifest.get("ocr_segmentation_mode",3) not in (3,6,11)
                or manifest.get("ocr_render_dpi",[300,450]) not in ([300,450],[200,400],[350,500])
                or manifest.get("ocr_header_basis","RENDERED_HEADERS_ONLY") not in ("RENDERED_HEADERS_ONLY","ORIGINAL_NATIVE_GROUP_LABELS_WHEN_AVAILABLE_WITH_RENDERED_FACT_CELLS","ORIGINAL_NATIVE_GROUP_AND_UNIT_LABELS_WITH_RENDERED_FACT_CELLS")
                or not re.fullmatch(r"[a-f0-9]{64}",str(manifest.get("ocr_document_text_sha256","")))
                or manifest.get("ocr_document_audit_r2_key")!=PREFIX+"ocr-dated-document-v1/original_version="+str(original)+"/audit.json"):
                return "DATED_OCR_DOCUMENT_AUDIT_UNPROVEN"
        if manifest.get("parser_revision")=="PDF_OCR_DOUBLE_RENDER_V1":
            proof=manifest.get("ocr_independent_checks")
            try:
                fields=("value","unit","original_unit","original_value","column_period","page","column_index")
                values={k:{field:f[field] for field in fields} for k,f in manifest["facts"].items()}
                valid=(isinstance(proof,dict) and proof.get("contract")=="DOUBLE_RENDER_AND_PBT_MINUS_TAX_OCR_V1"
                    and proof.get("render_dpi")==[300,450] and proof.get("original_sha256")==original
                    and proof.get("facts_sha256")==sha(canonical_bytes(values))
                    and proof.get("page")==manifest.get("financial_page")
                    and proof.get("arithmetic_validation",{}).get("contract")=="PBT_MINUS_TAX_EQUALS_PAT"
                    and isinstance(manifest.get("ocr_proof_r2_key"),str)
                    and manifest["ocr_proof_r2_key"].startswith(PREFIX+"ocr-replay-v1/original_version="+original+"/"))
            except (KeyError,TypeError):valid=False
            if not valid:return "DOUBLE_OCR_SOURCE_PROOF_UNPROVEN"
        if (period not in ("2024-09-30","2024-12-31","2025-03-31","2025-06-30")
            or u.scheme!="https" or u.hostname!="www.bseindia.com"
            or not re.fullmatch(url_path,u.path,re.I) or u.query or u.fragment
            or not re.fullmatch(r"[0-9]{6}",str(manifest.get("bse_scrip_code","")))
            or not isinstance(manifest.get("issuer_name"),str)
            or (len([x for x in re.findall(r"[A-Z]{3,}",manifest["issuer_name"].upper())
                    if x not in {"LTD","LIMITED","INDIA","THE","COMPANY","PRIVATE"}])<2
                and not explicit_legal_name(manifest["issuer_name"]))
            or manifest.get("source_identity_proof")!="CANONICAL_BSE_SCRIP_ISIN_AND_CONTIGUOUS_ISSUER_NAME"
            or not re.fullmatch(r"[0-9a-f]{64}",str(original or ""))
            or not isinstance(original_key,str) or not original_key.startswith(PREFIX)
            or "/original_version="+original+"/issuer-original.pdf" not in original_key
            or manifest.get("original_pdf_retained") is not True
            or manifest.get("reporting_currency")!="INR"
            or (manifest.get("first_column_period")!=period and manifest.get("parser_revision") not in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1"))
            or manifest.get("original_unit") not in ("INR_LAKH","INR_CRORE","INR_MILLION")
            or manifest.get("historical_eps_reporting_basis")!=("AS_REPORTED_IN_SELECTED_FILING_COMPARABILITY_UNPROVEN" if manifest.get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1") else "AS_FILED_NOT_RETROSPECTIVELY_ADJUSTED")
            or manifest.get("historical_share_adjustment_authorized") is not False
            or not isinstance(manifest.get("financial_page"),int)
            or not 1<=manifest["financial_page"]<=40):
            return "BSE_BATCH_SOURCE_OR_ISSUER_CONTRACT_UNPROVEN"
    if contract=="PORTFOLIOAI_RESULTS_BSE_2024_ORIGINAL_PDF_COMPACT_V1":
        approved={
          "2024-09-30":("c9b4cb4c-088b-4a88-a6b7-91087ba90d95.pdf",
             "ac876a6846f0866f5951ade7ebd323c4a6752e6dc9c4089d985185633b6023fc","2024-10-23","2024-07-01","30.09.2024"),
          "2024-12-31":("8e326f69-8061-4281-bc39-d8ac639479bd.pdf",
             "cc5517b18572a7094b553d73d25245b91f56109d687985bbf6c959364789bc3e","2025-01-28","2024-10-01","31.12.2024")
        }
        expected=approved.get(manifest.get("period_end"))
        if not expected:return "BSE_2024_QUARTER_NOT_APPROVED"
        pdf,original,date_published,period_start,period_dot=expected
        if (manifest.get("symbol")!="HDFCBANK"
            or manifest.get("issuer_cin")!="L65920MH1994PLC080618"
            or manifest.get("bse_scrip_code")!="500180"
            or manifest.get("period_start")!=period_start
            or manifest.get("consolidation_scope")!="CONSOLIDATED"
            or u.scheme!="https" or u.hostname!="www.bseindia.com"
            or u.path!="/xml-data/corpfiling/AttachHis/"+pdf
            or u.query or u.fragment
            or manifest.get("original_sha256_unretained")!=original
            or manifest.get("original_pdf_retained") is not False
            or manifest.get("raw_bse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"
            or not str(manifest.get("publication_time_bse","")).startswith(date_published)
            or manifest.get("publication_precision")!="DATE_TIME_FROM_BSE_ANNOUNCEMENT"
            or manifest.get("issuer_original_reporting_scope_proven") is not True
            or not re.fullmatch(r"(?i)UNAUDITED CONSOLIDATED FINANCIAL RESULTS FOR THE QUARTER.+",
                                str(manifest.get("quarter_header","")))
            or period_dot not in str(manifest.get("column_header",""))
            or "CRORE" not in str(manifest.get("currency_header","")).upper()
            or not isinstance(manifest.get("financial_page"),int)
            or not 1<=manifest["financial_page"]<=24):
            return "BSE_2024_ORIGINAL_SOURCE_CONTRACT_UNPROVEN"
    if contract=="PORTFOLIOAI_RESULTS_BSE_ASTRAL_2024_PDF_COMPACT_V1":
        approved={
          "2024-09-30":("47d353d6-47d8-4cf9-a8b3-d5a034f1d511.pdf",
            "6548984534d912f3146120ecaa9135eefc5fd74705829c285931838f755f7d40","2024-11-07","2024-07-01","SEPTEMBER 30, 2024"),
          "2024-12-31":("59b5a333-4018-4040-be97-536c9a7c028c.pdf",
            "d83fac906899303f6b96a365563b41344fb29c15776c42f9e502628f61f0ede2","2025-01-30","2024-10-01","DECEMBER 31, 2024")
        }
        expected=approved.get(manifest.get("period_end"))
        if not expected:return "BSE_ASTRAL_PERIOD_NOT_APPROVED"
        pdf,digest_expected,pub_date,pstart,title_quarter=expected
        if (manifest.get("symbol")!="ASTRAL"
            or manifest.get("bse_scrip_code")!="532830"
            or manifest.get("isin")!="INE006I01046"
            or manifest.get("period_start")!=pstart
            or manifest.get("consolidation_scope")!="CONSOLIDATED"
            or u.scheme!="https" or u.hostname!="www.bseindia.com"
            or u.path!="/xml-data/corpfiling/AttachHis/"+pdf
            or u.query or u.fragment
            or manifest.get("original_sha256_unretained")!=digest_expected
            or manifest.get("original_pdf_retained") is not False
            or manifest.get("raw_bse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"
            or not str(manifest.get("publication_time_bse","")).startswith(pub_date)
            or manifest.get("publication_precision")!="DATE_TIME_FROM_BSE_ANNOUNCEMENT"
            or manifest.get("original_first_quarter_column")!=0
            or not isinstance(manifest.get("original_quarter_financial_page"),int)
            or not 1<=manifest["original_quarter_financial_page"]<=40
            or title_quarter not in str(manifest.get("quarter_header","")).upper()
            or "STATEMENT OF CONSOLIDATED UNAUDITED FINANCIAL RESULTS FOR THE QUARTER" not in str(manifest.get("quarter_header","")).upper()
            or "MILLION" not in str(manifest.get("unit_header","")).upper()):
            return "BSE_ASTRAL_2024_ORIGINAL_CONTRACT_UNPROVEN"
    if contract=="PORTFOLIOAI_RESULTS_BSE_ASHOKA_2024_PDF_COMPACT_V1":
        approved={
          "2024-09-30":("21f1f436-84a4-47a5-a999-9fe821844d19.pdf",
            "e7635fd45c6cfe97020f09f3af616026b3321556646760b9d664a5d22c43f4f0","2024-11-12","2024-07-01","SEPTEMBER 30, 2024","30-SEP-24"),
          "2024-12-31":("200ba514-3197-42f6-a99f-86416b93f2ca.pdf",
            "428a23cd14a9c27574631c2d9a0384b69a353f0a10595d409a1df453dab8f615","2025-02-10","2024-10-01","DECEMBER 31, 2024","31-DEC-24")
        }
        expected=approved.get(manifest.get("period_end"))
        if not expected:return "BSE_ASHOKA_PERIOD_NOT_APPROVED"
        pdf,digest_expected,published,start,heading,col=expected
        if (manifest.get("symbol")!="ASHOKA" or manifest.get("isin")!="INE442H01029"
            or manifest.get("bse_scrip_code")!="533271" or manifest.get("period_start")!=start
            or manifest.get("consolidation_scope")!="CONSOLIDATED"
            or u.scheme!="https" or u.hostname!="www.bseindia.com"
            or u.path!="/xml-data/corpfiling/AttachHis/"+pdf
            or u.query or u.fragment
            or manifest.get("original_sha256_unretained")!=digest_expected
            or manifest.get("original_pdf_retained") is not False
            or manifest.get("raw_bse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"
            or not str(manifest.get("publication_time_bse","")).startswith(published)
            or manifest.get("publication_precision")!="DATE_TIME_FROM_BSE_ANNOUNCEMENT"
            or manifest.get("original_first_quarter_column")!=0
            or manifest.get("parser_revision")!="INDIAN_GROUPING_V2"
            or manifest.get("supersedes_invalid_revision")!="INDIAN_GROUPING_V1_FIRST_COMMA_GROUP_DROPPED"
            or manifest.get("issuer_header")!="ASHOKA BUILDCON LIMITED"
            or "L45200MH1993PLC071970" not in str(manifest.get("cin_header",""))
            or heading not in str(manifest.get("quarter_header","")).upper()
            or "UNAUDITED CONSOLIDATED FINANCIAL RESULTS FOR THE QUARTER" not in str(manifest.get("quarter_header","")).upper()
            or col not in str(manifest.get("column_header","")).upper()
            or "LAKHS" not in str(manifest.get("unit_header","")).upper()
            or not isinstance(manifest.get("original_quarter_financial_page"),int)
            or not 1<=manifest["original_quarter_financial_page"]<=35):
            return "BSE_ASHOKA_2024_ISSUER_OR_QUARTER_NOT_PROVEN"
    if record["source_url"]!=manifest["issuer_filing_url"]:return "ORIGIN_MISMATCH"
    if contract=="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1":
        if not isinstance(manifest.get("original_sha256_unretained"),str) or len(manifest["original_sha256_unretained"])!=64:return "ORIGINAL_HASH_MISSING"
        if manifest.get("raw_nse_bytes_retained") is not False:return "RAW_RETENTION_UNPROVEN"
    elif contract in ("PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1"):
        pass
    elif manifest.get("reporting_currency")!="INR":
        return "PDF_CURRENCY_UNKNOWN"
    if not record["source_retrieved"]:return "SOURCE_RETRIEVAL_UNKNOWN"
    if not isinstance(manifest.get("facts"),dict):return "FACTS_NOT_OBJECT"
    historical_error=historical_original_eps_proof(manifest)
    if historical_error:return historical_error
    return None

def check_fact(r,m):
    if m.get("contract")=="RESULTS_R4_SHARED_ISSUER_ORIGINAL_REPLAY_V1":
        return None if str(r["id"]) in m["eligible_observation_ids"] else "SHARED_ORIGINAL_COMPLETE_TRIO_UNPROVEN"
    if r["symbol"]!=m.get("symbol") or r["isin"]!=m.get("isin"):return "SECURITY_IDENTITY_MISMATCH"
    if str(r["period_end"])!=m.get("period_end") or str(r["period_start"])!=m.get("period_start"):return "OBS_PERIOD_MISMATCH"
    if r["consolidation_scope"]!=m.get("consolidation_scope"):return "OBS_SCOPE_MISMATCH"
    if r["evidence_status"]!="AVAILABLE" or r["source_code"]!="COMPANY_EXCHANGE_FILING":return "UNAVAILABLE_EVIDENCE"
    key=r["metric_code"]; fact=m["facts"].get(key)
    if not isinstance(fact,dict):return "MISSING_MANIFEST_METRIC"
    if r["unit"]!=UNITS.get(key) or fact.get("unit")!=r["unit"]:return "UNIT_MISMATCH"
    if r["currency"]!="INR" or not r["retrieved_at"]:return "VALUE_OR_RETRIEVAL_UNPROVEN"
    try:
        if Decimal(str(r["numeric_value"]))!=Decimal(str(fact["value"])):return "NUMERIC_MISMATCH"
    except (ValueError,InvalidOperation,KeyError,TypeError):return "INVALID_DECIMAL"
    if m.get("contract") in ("PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1"):
        original_fact=m["facts"][key]
        if not isinstance(original_fact,dict):return "LEGACY_FACT_MALFORMED"
        contexts=original_fact.get("context_ids",original_fact.get("component_context_ids"))
        if (not isinstance(contexts,list) or not contexts
            or not all(isinstance(x,str) and len(x)<100 for x in contexts)):
            return "LEGACY_FINANCIAL_CONTEXT_NOT_PROVEN"
    if m.get("contract")=="PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1":
        f=m["facts"][key]
        if (m.get("parser_revision","LEGACY_SAME_ROW_V2")=="LEGACY_SAME_ROW_V2"
            and not f.get("manual_source_page_fingerprint") and key!="NET_INTEREST_INCOME_QUARTER"):
            # Replay the original row's numeric prefix independently. Numeric
            # formula references are labels, including OCR's bullet for minus.
            line=re.sub(r"\([^)]*[+−•-][^)]*\)","",f.get("evidence_line",""))
            line=re.sub(r"^\s*\d{1,2}[.)]?\s+","",line)
            nums=re.findall(r"(?<![A-Za-z0-9,])\(?-?(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d+)?\)?(?![A-Za-z0-9,])",line)
            if not nums:return "BSE_BATCH_ORIGINAL_ROW_VALUE_UNPROVEN"
            original=Decimal(nums[0].replace(",","").replace("(","-").replace(")",""))
            divisor={"INR_LAKH":Decimal(100),"INR_MILLION":Decimal(10),"INR_CRORE":Decimal(1),"INR_PER_SHARE":Decimal(1)}.get(f.get("original_unit"))
            if divisor is None or original/divisor!=Decimal(str(f["value"])):
                return "BSE_BATCH_ORIGINAL_ROW_VALUE_MISMATCH"
        if (f.get("page")!=m.get("financial_page")
            or f.get("column_index")!=(m.get("selected_column_index") if m.get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1") else 0)
            or (m.get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1") and f.get("column_period")!=m.get("period_end"))
            or f.get("original_unit") not in ("INR_LAKH","INR_CRORE","INR_MILLION","INR_PER_SHARE")
            or not isinstance(f.get("evidence_line"),str)
            or not 5<len(f["evidence_line"])<=800):
            return "BSE_BATCH_FACT_CONTEXT_UNKNOWN"
        if key=="EPS_DILUTED":
            if f.get("original_unit")!="INR_PER_SHARE":return "BSE_BATCH_EPS_UNIT_UNPROVEN"
        elif f.get("original_unit")!=m.get("original_unit"):
            return "BSE_BATCH_MONETARY_UNIT_MISMATCH"
        if key not in ("OPERATING_REVENUE_QUARTER","NET_INTEREST_INCOME_QUARTER",
                       "NET_PREMIUM_EARNED_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"):
            return "BSE_BATCH_METRIC_UNAUTHORIZED"
        # Independent exact unit consistency; no arbitrary 100x correction.
        # The R2-pinned source original is checked independently below.
        try:
            val=Decimal(str(f["value"]))
            if not val.is_finite():return "BSE_BATCH_VALUE_NONFINITE"
        except (KeyError,InvalidOperation,ValueError,TypeError):
            return "BSE_BATCH_VALUE_NOT_DECIMAL"
    if m.get("contract")=="PORTFOLIOAI_RESULTS_BSE_2024_ORIGINAL_PDF_COMPACT_V1":
        f=m["facts"][key]
        if (f.get("page")!=m.get("financial_page") or f.get("column_index")!=0
            or f.get("original_unit")!=f.get("unit")):
            return "BSE_2024_FACT_SOURCE_COLUMN_UNPROVEN"
        def first_number(row):
            if not isinstance(row,str) or len(row)>500:
                raise ValueError("BSE_2024_ROW_INVALID")
            nums=re.findall(r"(?<![0-9A-Za-z])(-?(?:\d{1,3}(?:,\d{2,3})+|\d+)\.\d{2})(?![0-9])",row)
            if len(nums)<3:raise ValueError("BSE_2024_ROW_NOT_QUARTERLY")
            return Decimal(nums[0].replace(",",""))
        try:
            if key=="NET_INTEREST_INCOME_QUARTER":
                parts=f.get("component_lines")
                if (f.get("formula")!="INTEREST_EARNED_MINUS_INTEREST_EXPENDED"
                    or not isinstance(parts,list) or len(parts)!=2
                    or parts[0].get("page")!=m.get("financial_page")
                    or parts[1].get("page")!=m.get("financial_page")
                    or not re.match(r"^1 Interest earned\b",parts[0].get("line",""),re.I)
                    or not re.match(r"^4 Interest expended\b",parts[1].get("line",""),re.I)):
                    return "BSE_2024_NII_COMPONENTS_INVALID"
                actual=first_number(parts[0]["line"])-first_number(parts[1]["line"])
                if str(first_number(parts[0]["line"]))!=parts[0].get("first_quarter_value"):
                    return "BSE_2024_INTEREST_EARNED_ROW_MISMATCH"
                if str(first_number(parts[1]["line"]))!=parts[1].get("first_quarter_value"):
                    return "BSE_2024_INTEREST_EXPENDED_ROW_MISMATCH"
            elif key=="NET_PROFIT_QUARTER":
                if not re.match(r"^16 Net profit for the period\b",f.get("evidence_line",""),re.I):
                    return "BSE_2024_PROFIT_ROW_INVALID"
                actual=first_number(f["evidence_line"])
            elif key=="EPS_DILUTED":
                if not re.match(r"^[\(\{][bB][\)\}] Diluted EPS before",f.get("evidence_line",""),re.I):
                    return "BSE_2024_DILUTED_EPS_ROW_INVALID"
                if f.get("share_basis")!="AS_ORIGINALLY_PUBLISHED_NO_RETROSPECTIVE_ADJUSTMENT":
                    return "BSE_2024_EPS_SHARE_BASIS_UNPROVEN"
                actual=first_number(f["evidence_line"])
            else:
                return "BSE_2024_METRIC_NOT_AUTHORIZED"
            if actual!=Decimal(str(f.get("value"))):
                return "BSE_2024_PDF_ROW_VALUE_MISMATCH"
        except (ValueError,TypeError,InvalidOperation,KeyError,AttributeError):
            return "BSE_2024_PDF_ROW_VALIDATION_FAILED"
    if m.get("contract")=="PORTFOLIOAI_RESULTS_BSE_ASTRAL_2024_PDF_COMPACT_V1":
        f=m["facts"][key]
        if (f.get("extraction_page")!=m.get("original_quarter_financial_page")
            or f.get("first_column_index")!=0
            or not isinstance(f.get("extraction_line"),str)
            or len(f["extraction_line"])>380):
            return "BSE_ASTRAL_2024_TABLE_ROW_UNPROVEN"
        original_unit="INR_PER_SHARE" if key=="EPS_DILUTED" else "INR_MILLION"
        expected_conversion=("ORIGINAL_RUPEES_PER_SHARE" if key=="EPS_DILUTED"
            else "DIVIDE_MILLION_BY_10")
        if f.get("original_unit")!=original_unit or f.get("conversion")!=expected_conversion:
            return "BSE_ASTRAL_2024_QUARTER_UNIT_MISMATCH"
        regex={
          "OPERATING_REVENUE_QUARTER":r"^1 Revenue from Operations\s+(.+)$",
          "NET_PROFIT_QUARTER":r"^9 Net Profit for the period/year\s+\(7-8\)\s+(.+)$",
          "EPS_DILUTED":r"^- Diluted \(In Rs\.\)\s+(.+)$"
        }.get(key)
        if not regex:return "BSE_ASTRAL_2024_METRIC_UNAUTHORIZED"
        try:
            mval=re.match(regex,f["extraction_line"],re.I)
            if not mval:return "BSE_ASTRAL_2024_FINANCIAL_LABEL_MISMATCH"
            nums=re.findall(r"(?<!\w)(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?(?!\w)",mval.group(1))
            if len(nums)<4:return "BSE_ASTRAL_2024_QUARTER_COLUMNS_UNPROVEN"
            original=Decimal(nums[0].replace(",",""))
            if original!=Decimal(str(f.get("original_value"))):
                return "BSE_ASTRAL_2024_ORIGINAL_VALUE_MISMATCH"
            computed=original if key=="EPS_DILUTED" else original/Decimal(10)
            if computed!=Decimal(str(f.get("value"))):
                return "BSE_ASTRAL_2024_CRORE_CONVERSION_MISMATCH"
            if (key=="EPS_DILUTED"
                and f.get("share_basis")!="ORIGINALLY_PUBLISHED_NO_RETROSPECTIVE_ADJUSTMENT"):
                return "BSE_ASTRAL_2024_EPS_BASIS_UNPROVEN"
        except (InvalidOperation,ValueError,TypeError,KeyError):
            return "BSE_ASTRAL_2024_ROW_PARSING_INVALID"
    if m.get("contract")=="PORTFOLIOAI_RESULTS_BSE_ASHOKA_2024_PDF_COMPACT_V1":
        f=m["facts"][key]
        if (f.get("extraction_page")!=m.get("original_quarter_financial_page")
            or f.get("first_column_index")!=0
            or not isinstance(f.get("extraction_line"),str)
            or len(f["extraction_line"])>500):
            return "BSE_ASHOKA_ORIGINAL_ROW_UNPROVEN"
        regex={
          "OPERATING_REVENUE_QUARTER":r"^I Revenue From Operations\s+(.+)$",
          "NET_PROFIT_QUARTER":r"^XI Profit after tax \(IX-X\)\s+(.+)$",
          "EPS_DILUTED":r"^Basic & Diluted\s+(.+)$"
        }.get(key)
        if not regex:return "BSE_ASHOKA_METRIC_UNAUTHORIZED"
        try:
            match=re.match(regex,f["extraction_line"],re.I)
            if not match:return "BSE_ASHOKA_LABEL_MISMATCH"
            parts=re.findall(r"(?<![\w,])(?:\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?![\d,])",match.group(1))
            if len(parts)<5:return "BSE_ASHOKA_QUARTER_COLUMNS_NOT_PROVEN"
            raw=Decimal(parts[0].replace(",",""))
            if raw!=Decimal(str(f.get("original_value"))):
                return "BSE_ASHOKA_ORIGINAL_VALUE_MISMATCH"
            if key=="EPS_DILUTED":
                second=f.get("eps_crosscheck_line")
                if not isinstance(second,str) or not re.match(regex,second,re.I):
                    return "BSE_ASHOKA_EPS_CONFIRMATION_MISSING"
                n2=re.findall(r"(?<![\w,])(?:\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?![\d,])",re.match(regex,second,re.I).group(1))
                if not n2 or Decimal(n2[0].replace(",",""))!=raw:
                    return "BSE_ASHOKA_EPS_ROWS_CONFLICT"
                if (f.get("original_unit")!="INR_PER_SHARE"
                    or f.get("conversion")!="ORIGINAL_RUPEES_PER_SHARE"
                    or f.get("share_basis")!="ORIGINALLY_PUBLISHED_NO_RETROSPECTIVE_ADJUSTMENT"):
                    return "BSE_ASHOKA_EPS_ORIGINAL_BASIS_UNKNOWN"
                converted=raw
            else:
                if (f.get("original_unit")!="INR_LAKH"
                    or f.get("conversion")!="DIVIDE_LAKHS_BY_100"):
                    return "BSE_ASHOKA_LAKHS_UNIT_INVALID"
                converted=raw/Decimal(100)
            if converted!=Decimal(str(f.get("value"))):
                return "BSE_ASHOKA_CRORE_CONVERSION_MISMATCH"
            oracle={"2024-09-30":{"OPERATING_REVENUE_QUARTER":"2488.931",
                                    "NET_PROFIT_QUARTER":"462.469","EPS_DILUTED":"16.28"},
                    "2024-12-31":{"OPERATING_REVENUE_QUARTER":"2387.888",
                                    "NET_PROFIT_QUARTER":"661.4923","EPS_DILUTED":"23.32"}}
            if converted!=Decimal(oracle[m["period_end"]][key]):
                return "BSE_ASHOKA_ORIGINAL_FIRST_QUARTER_ORACLE_MISMATCH"
        except (ValueError,TypeError,InvalidOperation,KeyError,AttributeError):
            return "BSE_ASHOKA_NUMERIC_ROW_FAILED"
    if key=="EPS_DILUTED" and m.get("historical_identity_link"):
        if (m.get("eps_as_originally_reported_before_split") is not True
            or fact.get("original_unit")!="INR_PER_SHARE"):
            return "HISTORICAL_EPS_ORIGINAL_VALUE_UNPROVEN"
    return None

# Corrected issuer-filed financial results are admitted ONLY with an
# immutable original NSE correction notice, source-version identity and
# exact revised metrics. Never resolve conflicts by "latest filing" alone.
EXIDE_CORRECTION_SHA="0f62c1e6611a4ff318e53c725c2e3e117283547b5ff6b5f0628cbf6eba10d435"
EXIDE_OLD_SOURCE="383002e5-7e7c-4782-9906-5493eeae0fb1"
EXIDE_REVISED_SOURCE="ace1b679-2cc7-46e9-854b-c117eb1ee37c"
EXIDE_CORRECTION_KEY=(PREFIX+"security_id=INE302A01020/period_end=2025-12-31/"
    "original_version="+EXIDE_CORRECTION_SHA+"/issuer-correction.pdf")
def qualify_exide_correction(facts,s3):
    relevant=[r for r in facts if r["symbol"]=="EXIDEIND"
        and str(r["period_end"])=="2025-12-31"
        and r["consolidation_scope"]=="CONSOLIDATED"
        and str(r["source_record_id"]) in(EXIDE_OLD_SOURCE,EXIDE_REVISED_SOURCE)]
    if len(relevant)!=6:
        return facts,False
    by_source=defaultdict(dict)
    for r in relevant:
        if r["isin"]!="INE302A01020":return facts,False
        by_source[str(r["source_record_id"])][r["metric_code"]]=Decimal(str(r["numeric_value"]))
    correct={"OPERATING_REVENUE_QUARTER":Decimal("4200.59"),
             "NET_PROFIT_QUARTER":Decimal("194.97"),
             "EPS_DILUTED":Decimal("2.29")}
    original=dict(correct);original["EPS_DILUTED"]=Decimal("0")
    if by_source.get(EXIDE_OLD_SOURCE)!=original or by_source.get(EXIDE_REVISED_SOURCE)!=correct:
        return facts,False
    try:
        notice=s3.get_object(Bucket=BUCKET,Key=EXIDE_CORRECTION_KEY)["Body"].read()
    except Exception:return facts,False
    if not notice.startswith(b"%PDF") or sha(notice)!=EXIDE_CORRECTION_SHA:
        return facts,False
    return [r for r in facts if not (
        r["symbol"]=="EXIDEIND" and str(r["period_end"])=="2025-12-31"
        and r["consolidation_scope"]=="CONSOLIDATED"
        and str(r["source_record_id"])==EXIDE_OLD_SOURCE)],True

def r5_verified_scope_continuity(facts):
    """R5 read-only evidence audit over R4 R2-validated original-source facts.

    A complete Revenue/NII, PAT and EPS trio must come from one original in
    each scope and reporting quarter. Conflicting numbers in the same scope
    poison that scope; never use a convenient alternative to evade conflicts.
    This is NOT selection admission and cannot be used as an R5 grade itself.
    """
    groups=defaultdict(set);versions=defaultdict(set);proof_rows=defaultdict(dict)
    for r in facts:
        symbol=r["symbol"]
        period=str(r["period_end"]);scope=r["consolidation_scope"]
        metric=r["metric_code"]
        rid=str(r["source_record_id"])
        groups[(symbol,period,scope,rid)].add(metric)
        versions[(symbol,period,scope,metric)].add(Decimal(str(r["numeric_value"])))
        # Every candidate observation here has just passed independent R2
        # retained-source SHA, issuer identity and fact/manifest replay.
        # Only row identifiers, not financial values, enter the R5 manifest.
        proof_rows[(symbol,period,scope,rid)][metric]=dict(
            id=str(r["id"]),securityId=str(r["security_id"]),
            sourceRecordId=rid)
    scopes=defaultdict(set)
    for (symbol,period,scope,rid),metric_codes in groups.items():
        required=(BANK_REQUIRED if symbol in BANKS else
                  INSURANCE_REQUIRED if symbol in INSURERS else OTHER_REQUIRED)
        if not required.issubset(metric_codes):continue
        if any(len(versions[(symbol,period,scope,m)])>1 for m in required):continue
        scopes[(symbol,period)].add(scope)
    targets=(
        ("BBOX","2025-09-30"),("CAMS","2025-09-30"),
        ("DEEPINDS","2025-03-31"),("DEEPINDS","2025-06-30"),("DEEPINDS","2025-09-30"),
        ("DHARMAJ","2025-03-31"),
        ("ICEMAKE","2025-06-30"),("ICEMAKE","2025-09-30"),
        ("IDFCFIRSTB","2025-09-30"),("IONEXCHANG","2025-03-31"),
        ("IPL","2025-03-31"),("IPL","2025-06-30"),
        ("ITCHOTELS","2025-03-31"),("JYOTHYLAB","2025-06-30"),
        ("KOTAKBANK","2025-09-30"),
        ("LT","2025-03-31"),("LT","2025-06-30"),("LT","2025-09-30"),
        ("MGL","2025-09-30"),("MOTHERSON","2025-09-30"),
        ("NCC","2025-09-30"),("PERSISTENT","2025-06-30"),
        ("SHARDACROP","2025-09-30"),("SYRMA","2025-09-30"),
        # Further live-R5 model-supported but source-incompatible issuers
        ("CGCL","2025-09-30"),("CHOLAFIN","2025-06-30"),
        ("HDFCAMC","2025-09-30"),("IREDA","2025-03-31"),
        ("NATIONALUM","2025-03-31"),
    )
    previous={"2025-03-31":"2024-12-31","2025-06-30":"2025-03-31",
              "2025-09-30":"2025-06-30"}
    candidates=[]
    for symbol,end in targets:
        earlier=previous[end]
        matched=sorted(scopes[(symbol,end)] & scopes[(symbol,earlier)])
        candidates.append(dict(symbol=symbol,quarter=end,previous=earlier,
          source_original_scope_evidence=matched,
          evidence="R2_REPLAYED_ORIGINALS_ONLY",
          decision="R5_REQUIRES_SEPARATE_CANONICAL_SELECTION_REVIEW" if matched else "NO_PROVEN_SAME_SCOPE_SOURCE_PAIR"))
    # Optional, separately scoped R5 *comparison-only* original-source
    # evidence. Canonical R4 selections remain exactly as they were.
    # Restrict to issuers actually having an independently verified
    # same-scope comparison pair; exclude failing candidate ICEMAKE Sep.
    # The live R5 failures additionally include issuers with all visible
    # quarters already selected but alternating accounting scopes. Build
    # both SAME-SCOPE verified alternatives; don't choose based on grades.
    # Every selected original has been individually replayed against R2.
    # Current R5 exception issuers (as of 17 October 2026), evidence-driven
    # expansion only. Each scope still requires independently R2 SHA-replayed
    # original filings; none is admitted to canonical R4 selections.
    scope_history_issuers={
        "360ONE","AVANTIFEED","AWHCL","BDL","BLUSPRING",
        "CGPOWER","CHOLAFIN","COFORGE","CPPLUS","DDEVPLSTIK",
        "EBGNG","FEDERALBNK","GMBREW","GROWW","HEXT",
        "ICEMAKE","IGL","IKS","ITCHOTELS","JASH",
        "JIOFIN","LENSKART","LGEINDIA","MANKIND","MFSL",
        "MOTHERSON","NATIONALUM","PINELABS","SANSERA","SHARDACROP",
        "SSWL","STARHEALTH","SYRMA","TATACAP","TATAPOWER",
        "TMCV","TMPV","UTLSOLAR","VENTIVE",
    }
    allowed_scopes={(c["symbol"],scope) for c in candidates
                    for scope in c["source_original_scope_evidence"]}
    allowed_scopes|={(symbol,scope) for (symbol,period,scope,rid) in groups
                     if symbol in scope_history_issuers and
                     scope in ("STANDALONE","CONSOLIDATED")}
    comparison_proofs=[]
    for (symbol,period,scope,rid),codes in sorted(groups.items()):
        if (symbol,scope) not in allowed_scopes:continue
        if not "2024-09-30"<=period<="2025-09-30":continue
        needed=(BANK_REQUIRED if symbol in BANKS else
                INSURANCE_REQUIRED if symbol in INSURERS else OTHER_REQUIRED)
        if not needed.issubset(codes):continue
        if any(len(versions[(symbol,period,scope,m)])>1 for m in needed):continue
        proof=proof_rows[(symbol,period,scope,rid)]
        if not needed.issubset(proof):continue
        security_ids={proof[m]["securityId"] for m in needed}
        if len(security_ids)!=1:continue
        comparison_proofs.append(dict(
            symbol=symbol,periodEnd=period,scope=scope,
            securityId=security_ids.pop(),sourceRecordId=rid,
            observations={metric:proof[metric]["id"] for metric in sorted(needed)},
            approval="R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION",
        ))
    # Allow independent eligible STANDALONE and CONSOLIDATED candidates.
    # Each (issuer, quarter, scope) must have ONE reproducible original.
    # R5 evaluates separately by scope, never selects the stronger grade.
    by_period_scope=defaultdict(list)
    for item in comparison_proofs:
        by_period_scope[(item["securityId"],item["periodEnd"],item["scope"])].append(item)
    comparison_proofs=[rows[0] for _,rows in sorted(by_period_scope.items())
                       if len(rows)==1]
    return {"contract":"R5_SOURCE_HASH_VERIFIED_HISTORICAL_SCOPE_AUDIT_V1",
            "comparison_only_original_proofs":comparison_proofs,
            "comparison_only_original_proof_count":len(comparison_proofs),
            "historical_pairs_checked":len(targets),
            "pairs_with_verified_same_scope_originals":sum(bool(x["source_original_scope_evidence"]) for x in candidates),
            "candidate_rows":candidates,
            "source_admission_performed":False,"repository_selection_overwrite":False}

def select_quarters(rows,existing_choices=None):
    existing_choices=existing_choices or {}
    groups=defaultdict(lambda:defaultdict(list))
    for r in rows: groups[(r["security_id"],str(r["period_end"]))][r["consolidation_scope"]].append(r)
    chosen=[]; blocked=Counter();selected_quarters=defaultdict(set)
    for (security,period),scopes in groups.items():
        # A quarter must use ONE independently reconciled filing and ONE scope.
        # Prefer a COMPLETE consolidated filing; where consolidated is only
        # partial, a complete and conflict-free standalone issuer filing is
        # eligible for current display, with its scope retained in each row.
        # Never evade a conflicting consolidated revision by falling back.
        admitted=False
        conflict=False
        for scope in ("CONSOLIDATED","STANDALONE"):
            if scope not in scopes:continue
            rs=scopes[scope]
            versions=defaultdict(set)
            for r in rs:versions[r["metric_code"]].add(Decimal(str(r["numeric_value"])))
            if any(len(values)>1 for values in versions.values()):
                blocked["CONFLICTING_SAME_SCOPE_FILING_VALUES"]+=1
                conflict=True
                break
            by_record=defaultdict(list)
            for r in rs:by_record[r["source_record_id"]].append(r)
            core=INSURANCE_REQUIRED if rs[0]["symbol"] in INSURERS else BANK_REQUIRED if rs[0]["symbol"] in BANKS else OTHER_REQUIRED
            complete=[v for v in by_record.values() if core.issubset({a["metric_code"] for a in v})]
            if not complete:
                continue
            def preference(version):
                matches=conflicts=0
                for fact in version:
                    key=(str(security),period,scope,fact["metric_code"])
                    previous=existing_choices.get(key)
                    if previous is None:continue
                    if str(fact.get("id"))==previous:matches+=1
                    else:conflicts+=1
                # Equal-valued validated originals must not churn accepted IDs.
                # Real value conflicts were quarantined above, before this rank.
                return (bool(conflicts),-matches,str(version[0]["source_record_id"]))
            source=min(complete,key=preference)
            chosen.extend(source)
            selected_quarters[security].add(period)
            if scope=="STANDALONE" and "CONSOLIDATED" in scopes:
                blocked["STANDALONE_COMPLETE_CONSOLIDATED_INCOMPLETE_ADMITTED"]+=1
            admitted=True
            break
        if not admitted and not conflict:
            blocked["NO_COMPLETE_SINGLE_SOURCE"]+=1
    return chosen,blocked,selected_quarters

SQL="""SELECT f.id,f.security_id,s.symbol,s.isin,f.metric_code,f.numeric_value,f.unit,
f.currency,f.period_start,f.period_end,f.consolidation_scope,f.source_record_id,
f.evidence_status,f.retrieved_at,f.source_code,d.raw_payload,d.source_url,
d.payload_hash,d.retrieved_at AS source_retrieved
FROM public.fundamental_observations f
JOIN public.securities s ON s.id=f.security_id AND s.asset_class='EQUITY'
JOIN public.data_source_records d ON d.id=f.source_record_id
WHERE f.period_type='QUARTER' AND f.period_end=ANY(%s::date[])
AND f.source_code='COMPANY_EXCHANGE_FILING' AND d.source_code=f.source_code
AND d.record_kind IN ('RESULTS_R5_SSWL_SIGNED_DEC2024_COMPARATIVE_V1','RESULTS_R5_FEDERAL_CONSOLIDATED_SOURCE_REPLAY_V1','RESULTS_R5_TATAPOWER_SOURCE_LOCKED_2024_V1','RESULTS_R4_NSE_EXCHANGE_LINEAGE_XBRL_V1','RESULTS_R4_BSE_ORIGINAL_PDF_GENERAL_V1','RESULTS_QUARTERLY_NSE_DISCOVERY_V1','RESULTS_QUARTERLY_ISSUER_PDF_V1','RESULTS_QUARTERLY_NSE_LEGACY_XBRL_V1','RESULTS_QUARTERLY_NSE_LEGACY_2025_XBRL_V1','RESULTS_QUARTERLY_NSE_LEGACY_2024_COMPACT_V1','RESULTS_QUARTERLY_NSE_INTEGRATED_CURRENT_COMPACT_V1','RESULTS_QUARTERLY_BSE_ORIGINAL_PDF_2024_V1','RESULTS_QUARTERLY_BSE_ASTRAL_ORIGINAL_PDF_2024_V1','RESULTS_QUARTERLY_BSE_ASHOKA_ORIGINAL_PDF_2024_V1')
AND f.metric_code=ANY(%s) AND f.numeric_value IS NOT NULL
ORDER BY f.source_record_id,f.metric_code"""
def verify(db,s3,apply):
    invalid=Counter();cache={};facts=[]
    with psycopg.connect(db,row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(SQL,(list(QUARTERS),list(UNITS)))
            observations=cur.fetchall()
        # Bound R2 reads without making any concurrent database writes. S3
        # clients support concurrent GET; each source is fetched at most once.
        by_id={str(r["source_record_id"]):r for r in observations}
        shared_groups=defaultdict(list)
        for row in observations:shared_groups[str(row["source_record_id"])].append(row)
        def check_one(pair):
            k,r=pair
            from r4_shared_original import PROFILES,context as shared_context,qualify as qualify_shared
            if r["raw_payload"].get("contract") in PROFILES:
                try:
                    _,_,original_key=shared_context(r)
                    original=s3.get_object(Bucket=BUCKET,Key=original_key)["Body"].read()
                    from r4_recovery_queue import run_with_timeout
                    with SOURCE_REPLAY_SLOTS:
                        document=run_with_timeout(qualify_shared,(original,r,shared_groups[k]),120)
                    return k,(document,None)
                except Exception as exc:
                    return k,(None,"SHARED_ORIGINAL_REPLAY_FAILED_"+type(exc).__name__)
            raw=r["raw_payload"];pointer=raw.get("r2_key") if isinstance(raw,dict) else None
            expected=raw.get("r2_manifest_sha256") if isinstance(raw,dict) else None
            document=None;error=None
            if not isinstance(pointer,str) or not pointer.startswith(PREFIX) or not isinstance(expected,str) or "/source_version="+expected+"/" not in pointer:
                error="INVALID_R2_POINTER"
            else:
                try:
                    b=s3.get_object(Bucket=BUCKET,Key=pointer)["Body"].read()
                    if sha(b)!=expected:error="R2_READBACK_HASH_MISMATCH"
                    else:document=json.loads(b)
                except Exception as exc:
                    response=getattr(exc,"response",{})
                    code=response.get("Error",{}).get("Code","") if isinstance(response,dict) else ""
                    error="R2_OBJECT_UNAVAILABLE_"+type(exc).__name__+("_"+str(code) if code else "")
            if not error:error=check_manifest(r,document)
            if not error and document.get("contract") in ("PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1","PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1"):
                try:
                    original_bytes=s3.get_object(
                        Bucket=BUCKET,Key=document["original_r2_key"])["Body"].read()
                    if (not original_bytes.startswith(b"%PDF")
                        or sha(original_bytes)!=document["original_sha256_retained"]):
                        error="R2_RETAINED_ORIGINAL_PDF_HASH_MISMATCH"
                except Exception:
                    error="R2_RETAINED_ORIGINAL_PDF_UNAVAILABLE"
            if not error and document.get("contract")=="PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1" and document.get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1"):
                try:
                    from r4_bse_dated_proof import validate_original
                    proof=s3.get_object(Bucket=BUCKET,Key=document["issuer_identity_evidence_r2_key"])["Body"].read()
                    if sha(proof)!=document["issuer_identity_evidence_sha256"]:raise ValueError("DATED_IDENTITY_HASH_MISMATCH")
                    from r4_recovery_queue import run_with_timeout
                    # Native PDF/OCR engines run in isolated processes, with
                    # bounded parallel memory use and a per-original deadline.
                    with SOURCE_REPLAY_SLOTS:
                        run_with_timeout(validate_original,(original_bytes,document,json.loads(proof)),480)
                except Exception as exc:
                    error="DATED_PDF_ORIGINAL_REPLAY_FAILED_"+type(exc).__name__
            if not error and document.get("contract") in ("PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1","PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1"):
                try:
                    original_bytes=s3.get_object(
                        Bucket=BUCKET,Key=document["original_r2_key"])["Body"].read()
                    if (sha(original_bytes)!=document["original_sha256_retained"]
                        or b"xbrl" not in original_bytes[:1000].lower()
                        or b"<!DOCTYPE" in original_bytes.upper()):
                        error="R2_RETAINED_ORIGINAL_XBRL_HASH_MISMATCH"
                except Exception:
                    error="R2_RETAINED_ORIGINAL_XBRL_UNAVAILABLE"
            if not error and document.get("contract")=="PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1":
                try:
                    from r4_nse_issuer_bridge import bridge_from_sources,verify_original_facts
                    proof_bytes=s3.get_object(Bucket=BUCKET,Key=document["issuer_identity_evidence_r2_key"])["Body"].read()
                    if sha(proof_bytes)!=document["issuer_identity_evidence_sha256"]:
                        raise ValueError("IDENTITY_EVIDENCE_HASH_MISMATCH")
                    proof=json.loads(proof_bytes);metadata=proof["nse_catalog_record"]
                    if metadata["xbrl"]!=document["issuer_filing_url"] or proof["nse_original_sha256"]!=sha(original_bytes):
                        raise ValueError("IDENTITY_ORIGINAL_LINK_MISMATCH")
                    catalog_scope={"Consolidated":"CONSOLIDATED","Non-Consolidated":"STANDALONE"}.get(metadata.get("consolidated"))
                    if (catalog_scope!=document["consolidation_scope"] or
                        datetime.strptime(metadata["toDate"],"%d-%b-%Y").date().isoformat()!=document["period_end"]):
                        raise ValueError("CATALOG_SCOPE_OR_PERIOD_MISMATCH")
                    rename=None
                    if proof.get("issuer_rename_authority"):
                        from r4_issuer_rename import verify_rename_pdf
                        authority=proof["issuer_rename_authority"]
                        authority_bytes=s3.get_object(Bucket=BUCKET,Key=authority["r2_key"])["Body"].read()
                        if sha(authority_bytes)!=authority["sha256"]:
                            raise ValueError("RENAME_AUTHORITY_HASH_MISMATCH")
                        rename=verify_rename_pdf(authority_bytes,document["symbol"],authority["source_url"])
                    bridge=bridge_from_sources(original_bytes,metadata,document["symbol"],document["isin"],
                                               proof["bse_header"],proof["bse_listing"],rename)
                    if bridge.payload()!=document["issuer_bridge"]:
                        raise ValueError("IDENTITY_REPLAY_MISMATCH")
                    verify_original_facts(original_bytes,document,bridge)
                except Exception as exc:
                    error="NSE_EXCHANGE_LINEAGE_REPLAY_FAILED_"+type(exc).__name__
            return k,(document,error)
        with ThreadPoolExecutor(max_workers=12) as pool:
            for k,validated in pool.map(check_one,by_id.items()):
                cache[k]=validated
        for r in observations:
            k=str(r["source_record_id"])
            doc,error=cache[k]
            if error:invalid[error]+=1;continue
            reason=check_fact(r,doc)
            if reason:invalid[reason]+=1;continue
            facts.append(r)
        facts,exide_corrected=qualify_exide_correction(facts,s3)
        from r4_krn_correction import qualify as qualify_krn_correction
        facts,krn_corrected=qualify_krn_correction(facts,s3)
        with conn.cursor() as cur:
            cur.execute("""SELECT security_id,metric_code,period_end,consolidation_scope,selected_observation_id
              FROM public.fundamental_observation_decisions WHERE period_type='QUARTER'
                AND period_end=ANY(%s::date[])""",(list(QUARTERS),))
            prior_rows=cur.fetchall()
        existing_choices={(str(r["security_id"]),str(r["period_end"]),r["consolidation_scope"],r["metric_code"]):str(r["selected_observation_id"]) for r in prior_rows}
        selections,blocked,quarters=select_quarters(facts,existing_choices);invalid.update(blocked)
        if exide_corrected:invalid["EXIDE_CORRECTED_EPS_SUPPORTED_BY_NSE_ORIGINAL"]+=1
        if krn_corrected:invalid["KRN_CORRECTED_XBRL_SUPPORTED_BY_ISSUER_AND_EXCHANGE_ACK"]+=1
        inserted=unchanged=protected=0
        if apply:
            proposals=[{"security_id":str(r["security_id"]),
                        "metric_code":r["metric_code"],
                        "period_end":str(r["period_end"]),
                        "consolidation_scope":r["consolidation_scope"],
                        "selected_observation_id":str(r["id"]),
                        "original_share_basis":bool(
                            r["metric_code"]=="EPS_DILUTED" and
                            (r["raw_payload"].get("historical_identity_link") or r["raw_payload"].get("contract")=="PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1")),
                        "dated_bse":bool(r["raw_payload"].get("parser_revision") in ("PDF_WORD_COORDINATES_DATED_COLUMN_V1","PDF_OCR_EXPLICIT_DATED_COLUMN_V1")),
                        "general_bse_eps":bool(r["metric_code"]=="EPS_DILUTED" and r["raw_payload"].get("contract")=="PORTFOLIOAI_RESULTS_BSE_ORIGINAL_PDF_REPLAY_V1"),
                        "nse_bridge_eps":bool(r["metric_code"]=="EPS_DILUTED" and r["raw_payload"].get("contract")=="PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1"),
                        "issuer_correction":bool(
                            exide_corrected and str(r["source_record_id"])==EXIDE_REVISED_SOURCE),
                        "krn_correction":bool(krn_corrected and r["symbol"]=="KRN"
                            and str(r["period_end"])=="2025-03-31" and r["consolidation_scope"]=="CONSOLIDATED")
                        } for r in selections]
            payload=json.dumps(proposals,separators=(",",":"))
            fields="""SELECT * FROM jsonb_to_recordset(%s::jsonb)
                AS x(security_id uuid,metric_code text,period_end date,
                     consolidation_scope text,selected_observation_id uuid,original_share_basis boolean,issuer_correction boolean,general_bse_eps boolean,nse_bridge_eps boolean,krn_correction boolean,dated_bse boolean)"""
            with conn.cursor() as cur:
                cur.execute("""WITH proposals AS ("""+fields+""")
                    SELECT count(*) FILTER (WHERE d.selected_observation_id<>p.selected_observation_id) AS conflicts,
                           count(*) FILTER (WHERE d.selected_observation_id=p.selected_observation_id) AS unchanged
                    FROM proposals p JOIN public.fundamental_observation_decisions d
                      ON d.security_id=p.security_id
                     AND d.metric_code=p.metric_code
                     AND d.period_end=p.period_end
                     AND d.period_type='QUARTER'
                     AND d.consolidation_scope=p.consolidation_scope
                    """,(payload,))
                outcome=cur.fetchone()
                protected=int(outcome["conflicts"] or 0)
                unchanged=int(outcome["unchanged"] or 0)
                if protected:
                    conn.rollback()
                else:
                    cur.execute("""WITH proposals AS ("""+fields+""")
                        INSERT INTO public.fundamental_observation_decisions
                        (security_id,metric_code,period_end,period_type,
                         consolidation_scope,selected_observation_id,decision_basis,
                         decided_at,decided_by,notes)
                        SELECT p.security_id,p.metric_code,p.period_end,'QUARTER',
                               p.consolidation_scope,p.selected_observation_id,
                               'EVIDENCE_PRIORITY',now(),NULL,
                               CASE WHEN p.issuer_correction THEN
                                 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; EXIDE_OFFICIAL_NSE_CORRECTION_2026_02_17; CORRECTED_QUARTER_EPS_2.29; ORIGINAL_CORRECTION_R2_HASH_CHECKED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                               WHEN p.krn_correction THEN
                                 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; KRN_ISSUER_CORRECTION_AND_NSE_ACK_2025_07_10; ORIGINAL_AND_REVISED_XBRL_HASH_PINNED; HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                               WHEN p.dated_bse THEN
                                 'RESULTS_R4_BSE_EXPLICIT_DATED_QUARTER_COLUMN_ORIGINAL_REPLAYED; REPORTED_IN_SELECTED_FILING; HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN; NO_PORTFOLIOAI_SHARE_OR_EPS_REBASING; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                               WHEN p.general_bse_eps THEN
                                 'RESULTS_R4_BSE_ORIGINAL_PDF_R2_SOURCE_RECONCILED; HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN; NO_RETROSPECTIVE_SPLIT_REBASING; ORIGINAL_PUBLICATION_PRECISION_CATALOG_ONLY; NO_V1_4_AUTHORITY'
                               WHEN p.nse_bridge_eps THEN
                                 'RESULTS_R4_NSE_ORIGINAL_XBRL_EXCHANGE_ISSUER_LINEAGE_RECONCILED; HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN; NO_CATALOG_ISIN_REWRITE_OR_SHARE_ADJUSTMENT; ORIGINAL_PUBLICATION_PRECISION_CATALOG_ONLY; NO_V1_4_AUTHORITY'
                               WHEN p.original_share_basis THEN
                                 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; REPORTED_PRE_SPLIT_EPS_NOT_ADJUSTED; DO_NOT_COMPARE_EPS_ACROSS_SPLIT; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                               ELSE 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY' END
                        FROM proposals p
                        WHERE TRUE
                        ON CONFLICT DO NOTHING RETURNING selected_observation_id""",(payload,))
                    inserted=len(cur.fetchall())
                    if inserted+unchanged!=len(proposals):
                        protected=len(proposals)-inserted-unchanged
                        conn.rollback()
                    else:
                        conn.commit()
        else:conn.rollback()
    r5_scope_proof=None
    if os.getenv("RESULTS_R5_SOURCE_PROOF_READBACK")=="1":
        if apply:raise RuntimeError("R5_R2_SOURCE_PROOF_MUST_BE_READ_ONLY")
        r5_scope_proof=r5_verified_scope_continuity(facts)
    report={"mode":"APPLY" if apply else "DRY_RUN",
            "source_observations":len(observations),"r2_sources_checked":len(cache),
            "qualified_fact_rows":len(facts),"selected_candidate_facts":len(selections),
            "selected_stock_quarters":sum(map(len,quarters.values())),
            "selected_equities":len(quarters),
            "four_quarters_selected_equities":sum(len(x)==4 for x in quarters.values()) if len(QUARTERS)==4 else None,
            "target_quarter_count":len(QUARTERS),
            "target_quarters_selected_equities":sum(len(x)==len(QUARTERS) for x in quarters.values()),
            "created_decisions":inserted if not protected else 0,
            "unchanged_decisions":unchanged,"conflicting_existing_decisions":protected,
            "exceptions":dict(sorted(invalid.items())),
            "publication_precision":"UNKNOWN; only current display, never historical point-in-time"}
    if r5_scope_proof is not None:
        report["r5_verified_scope_proof"]=r5_scope_proof
    if protected:raise RuntimeError("R4_PRIOR_SELECTION_CONFLICT_ROLLED_BACK:"+json.dumps(report))
    if observations and not facts:
        raise RuntimeError("R4_ZERO_VALID_SOURCES_FAIL_CLOSED:"+json.dumps(report["exceptions"]))
    return report
def main():
    parser=argparse.ArgumentParser();parser.add_argument("--apply",action="store_true")
    options=parser.parse_args()
    if R4_EIGHT_QUARTER_MODE and (R5_LEGACY_MODE or R5_COMPARISON_MODE):
        raise SystemExit("R4_EIGHT_QUARTER_SCOPE_CONFLICT")
    if R5_LEGACY_MODE and os.environ.get("RESULTS_R5_LEGACY_ACK")!="2024_SEP_DEC_ORIGINAL_XBRL":
        raise SystemExit("R5_LEGACY_SELECTION_SCOPE_NOT_APPROVED")
    if R5_LEGACY_MODE and R5_COMPARISON_MODE:
        raise SystemExit("R5_COMPARISON_SCOPE_CONFLICT")
    if R5_COMPARISON_MODE and os.environ.get("RESULTS_R5_HISTORICAL_ACK")!="2025_MAR_JUN_ONLY":
        raise SystemExit("R5_HISTORICAL_SELECTION_SCOPE_NOT_APPROVED")
    db=os.environ.get("SUPABASE_DB_URL","")
    if REF not in db:raise SystemExit("NOT_DEVELOPMENT_DATABASE")
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise SystemExit("NOT_DEVELOPMENT_BUCKET")
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    from urllib.parse import urlparse
    import re
    if re.fullmatch(r"[a-f0-9]{32}",account):
        endpoint="https://"+account+".r2.cloudflarestorage.com"
    elif account.startswith("https://"):
        u=urlparse(account)
        if not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",u.hostname or "") or u.port or u.path not in ("","/") or u.query or u.fragment:
            raise SystemExit("INVALID_R2_ENDPOINT")
        endpoint=account.rstrip("/")
    else:
        raise SystemExit("INVALID_R2_ACCOUNT_SETTING")
    s3=boto3.client("s3",endpoint_url=endpoint,
                    aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
                    aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
                    region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))
    result=verify(db,s3,options.apply)
    os.makedirs("tmp/results-r4",exist_ok=True)
    with open("tmp/results-r4/readback.json","w") as f:json.dump(result,f,indent=2,sort_keys=True)
    print(json.dumps(result,sort_keys=True))
if __name__=="__main__":main()
