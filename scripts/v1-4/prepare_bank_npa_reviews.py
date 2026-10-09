"""Prepare, never submit, exact official filing facts and delegated review candidates.

Usage: python prepare_bank_npa_reviews.py MANIFEST IDENTITY_JSON OUTPUT_JSON
Inputs are retained acquisition manifests/original HTML and verified portfolio ISINs.
No provider calls, database access, calculations, unit conversions or owner signing.
"""
import datetime
import decimal
import hashlib
import json
from pathlib import Path
import re
import sys
import uuid
from html.parser import HTMLParser


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows, self.row, self.cell = [], [], None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        if tag in ("td", "th"):
            self.cell = []

    def handle_data(self, value):
        if self.cell is not None:
            self.cell.append(value)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = None
        if tag == "tr" and self.row:
            self.rows.append(self.row)


def stable(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(value):
    return hashlib.sha256(stable(value).encode()).hexdigest()


def instant(value):
    # Match PostgreSQL/PostgREST's fractional-second representation for ledger hashes.
    return re.sub(r"(\.\d*?[1-9])0+(?=\+)", r"\1", value.isoformat()).replace(".000000+", "+")


def only(rows, label, column=1):
    found = list(dict.fromkeys(r[column] for r in rows if r and r[0] == label and len(r) > column))
    if len(found) != 1:
        raise ValueError(f"Ambiguous/missing {label}")
    return found[0]


def reporting_date(rows, label):
    found = [r[2] for r in rows if len(r) > 2 and r[1] == label]
    if len(found) != 1:
        raise ValueError(f"Ambiguous/missing {label}")
    literal = found[0]
    return literal, datetime.datetime.strptime(literal, "%d-%m-%Y").date().isoformat()


def prepare(manifest, identities, policy, now):
    sources, reviews, audit = [], [], []
    for bank in manifest:
        symbol = bank["symbol"]
        security = next(k for k, v in policy["securities"].items() if v == symbol)
        eligible = [f for f in bank["filings"] if f["metadata"]["type"] == "Integrated Filing- Financials"
                    and f["metadata"]["qe_Date"] == "30-JUN-2026"
                    and f["metadata"]["consolidated"] == "Standalone"]
        if len(eligible) != 1:
            audit.append({"symbol": symbol, "status": "BLOCKED_FILING_SELECTION", "count": len(eligible)})
            continue
        filing = eligible[0]
        original = Path(filing["path"]).read_bytes()
        if hashlib.sha256(original).hexdigest() != filing["sha256"]:
            raise ValueError("Original hash mismatch")
        parser = Tables()
        parser.feed(original.decode())
        rows = parser.rows
        isin = only(rows, "ISIN")
        if only(rows, "NSE Symbol") != symbol or isin != identities[symbol] or only(rows, "Class of security") != "Equity":
            audit.append({"symbol": symbol, "status": "BLOCKED_IDENTITY"})
            continue
        if only(rows, "Nature of report standalone or consolidated") != "Standalone" or only(rows, "Reporting Type") != "Quarterly":
            raise ValueError("Wrong reporting scope/type")
        start_literal, start = reporting_date(rows, "Date of start of reporting period")
        end_literal, end = reporting_date(rows, "Date of end of reporting period")
        if start != "2026-04-01" or end != "2026-06-30":
            raise ValueError("Reporting column is not selected June quarter")
        published = datetime.datetime.strptime(filing["metadata"]["broadcast_Date"], "%d-%b-%Y %H:%M:%S").replace(
            tzinfo=datetime.timezone(datetime.timedelta(hours=5, minutes=30))).astimezone(datetime.timezone.utc).isoformat()
        source_id = str(uuid.uuid4())
        facts = []
        for requirement, metric, label in [("GROSS_NPA", "GROSS_NPA_PERCENT", "% of gross NPAs"),
                                            ("NET_NPA", "NET_NPA_PERCENT", "% of net NPAs")]:
            matches = [r for r in rows if len(r) > 2 and r[1] == label]
            if len(matches) != 1:
                raise ValueError("Ambiguous/missing NPA percentage row")
            value = matches[0][2]  # first period column, never the YTD or amount row
            if not re.fullmatch(r"\d+(?:\.\d+)?", value) or not 0 <= decimal.Decimal(value) <= 100:
                raise ValueError("NPA percentage invalid; no conversion permitted")
            quote = f"NSE Symbol: {symbol}\nISIN: {isin}\nReporting Type: Quarterly\nNature of report standalone or consolidated: Standalone\nDate of start of reporting period: {start_literal}\nDate of end of reporting period: {end_literal}\n{label}: {value}"
            facts.append({"requirement_code": requirement, "metric_code": metric, "value": value, "excerpt": quote,
                          "literal_row": matches[0], "selected_column_index": 2})
        payload = {"security_id": security, "symbol": symbol, "isin": isin, "policy_id": policy["id"],
                   "original_url": filing["url"], "original_sha256": filing["sha256"],
                   "filing_id": filing["metadata"]["seq_Id"], "filing_metadata": filing["metadata"],
                   "period_start": start, "period_end": end, "consolidation_scope": "STANDALONE",
                   "extraction": "LITERAL_NORMALIZED_HTML_TABLE_CONTEXT_V1; NO_CALCULATION_OR_CONVERSION", "facts": facts}
        source_hash = digest(payload)
        sources.append({"id": source_id, "source_code": "COMPANY_EXCHANGE_FILING", "record_kind": "V1_4_BANK_DELEGATED_PRIMARY_FACTS",
                        "external_record_id": f"{policy['id']}:{symbol}:{filing['metadata']['seq_Id']}:NPA",
                        "source_url": filing["url"], "published_at": published, "retrieved_at": now, "payload_hash": source_hash,
                        "raw_payload": payload, "terms_snapshot": {"retention": "STRUCTURED_FACTS_AND_PROVENANCE; ORIGINAL_OUTSIDE_DB"}})
        for fact in facts:
            review = {"portfolio_id": policy["portfolioId"], "security_id": security, "requirement_code": fact["requirement_code"],
                      "review_kind": "DELEGATED_NUMERIC_REVIEW", "decision": "ACCEPTED", "source_record_id": source_id,
                      "research_document_id": None, "provider_document_id": None, "source_payload_hash": source_hash,
                      "supporting_quote": fact["excerpt"], "period_start": start, "period_end": end, "period_type": "QUARTER",
                      "unit": "PERCENT", "currency": None, "consolidation_scope": "STANDALONE", "published_at": published,
                      "retrieved_at": now, "fresh_through": instant(datetime.datetime.fromisoformat(now) + datetime.timedelta(days=90)),
                      "review_version": "V1_4_REQUIREMENT_REVIEW_V2", "reviewed_by": None, "reviewed_at": now,
                      "supersedes_review_id": None, "metadata": {"metric_code": fact["metric_code"], "numeric_value": fact["value"],
                      "review_authorization": {"policy_id": policy["id"], "authorizing_owner_id": policy["ownerId"], "executor": policy["executor"],
                                               "authorization": policy["authorization"], "recorded_at": policy["recordedAt"]},
                      "source_binding": {"kind": "TABLE_CELL", "fragment": fact["excerpt"], "metric_label": "% of gross NPAs" if fact["requirement_code"] == "GROSS_NPA" else "% of net NPAs",
                                         "period_label": end_literal, "exact_value": fact["value"], "entity_id": symbol,
                                         "period_start": start, "period_end": end, "period_type": "QUARTER", "period_start_anchor": start_literal,
                                         "period_end_anchor": end_literal, "scale": "1", "conversion": "IDENTITY"}}}
            reviews.append({"id": str(uuid.uuid4()), **review, "review_hash": digest(review)})
        audit.append({"symbol": symbol, "status": "PREPARED_SOURCE_BOUND_FACTS", "identity": "EXACT_SYMBOL_ISIN_EQUITY",
                      "sourceRecordId": source_id, "originalUrl": filing["url"], "originalSha256": filing["sha256"]})
    return {"version": "BANK_NPA_DELEGATED_CANDIDATES_V1", "policyId": policy["id"], "preparedAt": now, "sources": sources, "reviews": reviews, "audit": audit}


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    policy = json.loads((root / "supabase/functions/_shared/v14-bank-approved-delegation.json").read_text())
    result = prepare(json.loads(Path(sys.argv[1]).read_text()), json.loads(Path(sys.argv[2]).read_text()), policy,
                     instant(datetime.datetime.now(datetime.timezone.utc)))
    Path(sys.argv[3]).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print({"sources": len(result["sources"]), "reviews": len(result["reviews"]), "blocked": [x for x in result["audit"] if x["status"].startswith("BLOCKED")]})
