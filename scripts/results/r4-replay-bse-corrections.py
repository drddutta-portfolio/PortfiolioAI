"""Replay this recovery's new BSE sources; audit corrections without rewriting evidence."""
import importlib.util,json,os
from pathlib import Path
from decimal import Decimal
import psycopg
from psycopg.rows import dict_row

def module(name,file):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(file))
    out=importlib.util.module_from_spec(spec);spec.loader.exec_module(out);return out

batch=module("batch","r4-bse-historical-batch.py")
verifier=module("verifier","r4-verify-quarterly.py")

def main():
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    s3=batch.r2_client()
    with psycopg.connect(url,row_factory=dict_row) as db:
        with db.cursor() as cur:
            cur.execute("""SELECT r.*,s.id security_id,s.symbol,s.isin,s.name
              FROM data_source_records r
              JOIN securities s ON s.symbol=r.raw_payload->>'symbol' AND s.isin=r.raw_payload->>'isin'
              WHERE r.record_kind=%s AND r.retrieved_at>='2026-10-16 18:00:00+00'
                AND coalesce(r.raw_payload->>'parser_revision','LEGACY_SAME_ROW_V2')='LEGACY_SAME_ROW_V2'
              ORDER BY s.symbol,r.retrieved_at""",(batch.KIND,))
            records=cur.fetchall()
        db.rollback()
        for record in records:
            raw=record["raw_payload"];period=raw["period_end"]
            original=s3.get_object(Bucket=batch.BUCKET,Key=raw["original_r2_key"])["Body"].read()
            if batch.sha(original)!=raw["original_sha256_retained"]:raise RuntimeError("ORIGINAL_HASH_MISMATCH")
            parsed=batch.extract(original,record["symbol"],raw["issuer_name"],period)
            if parsed["scope"]!=raw["consolidation_scope"]:raise RuntimeError("REPLAY_SCOPE_CHANGE_REQUIRES_REVIEW")
            changes={k:{"old":f["value"],"new":parsed["facts"][k]["value"]}
                     for k,f in raw["facts"].items() if Decimal(f["value"])!=Decimal(parsed["facts"][k]["value"])}
            if not changes:
                print("R4_BSE_ORIGINAL_REPLAY_UNCHANGED",record["symbol"],period,flush=True);continue
            # Only the demonstrated OCR-corrupt row-reference defect is authorized.
            if (set(changes)!={"NET_PROFIT_QUARTER"}
                or "(5•6)" not in raw["facts"]["NET_PROFIT_QUARTER"]["evidence_line"]
                or Decimal(changes["NET_PROFIT_QUARTER"]["old"])!=Decimal("-0.5")
                or parsed.get("parser_revision")!="PDF_WORD_COORDINATES_V3"):
                raise RuntimeError("UNEXPECTED_ORIGINAL_REPLAY_DIFFERENCE:"+json.dumps(changes))
            parsed.update(original_r2_key=raw["original_r2_key"],
                supersedes_parser_source_id=str(record["id"]),
                parser_correction_reason="OCR_ROW_REFERENCE_5_BULLET_6_NOT_A_FINANCIAL_CELL")
            # persist() uses tuple-return cursors, so keep the existing shared path.
            with psycopg.connect(url) as writer:
                inserted=batch.persist(writer,s3,(record["symbol"],record["isin"],record["security_id"],
                    raw["issuer_name"],raw["bse_scrip_code"]),period,{"source_url":record["source_url"]},
                    original,parsed,raw.get("publication_time_bse"))
            with db.cursor() as cur:
                cur.execute("""SELECT r.* FROM data_source_records r WHERE r.record_kind=%s
                  AND r.raw_payload->>'supersedes_parser_source_id'=%s ORDER BY retrieved_at DESC LIMIT 1""",
                  (batch.KIND,str(record["id"])))
                new=cur.fetchone()
                manifest={k:v for k,v in new["raw_payload"].items() if k not in ("r2_key","r2_manifest_sha256")}
                checked={**new,"source_retrieved":new["retrieved_at"]}
                reason=verifier.check_manifest(checked,manifest)
                if reason:raise RuntimeError("CORRECTION_MANIFEST_REJECTED:"+reason)
                retained=s3.get_object(Bucket=batch.BUCKET,Key=new["raw_payload"]["r2_key"])["Body"].read()
                if batch.sha(retained)!=new["raw_payload"]["r2_manifest_sha256"]:raise RuntimeError("CORRECTION_R2_MISMATCH")
                cur.execute("""SELECT o.*,s.symbol,s.isin FROM fundamental_observations o
                  JOIN securities s ON s.id=o.security_id WHERE source_record_id=%s""",(new["id"],))
                observations=cur.fetchall()
                if len(observations)!=3:raise RuntimeError("CORRECTION_TRIO_MISSING")
                for fact in observations:
                    reason=verifier.check_fact(fact,manifest)
                    if reason:raise RuntimeError("CORRECTION_FACT_REJECTED:"+reason)
                cur.execute("""SELECT selected_observation_id FROM fundamental_observation_decisions
                  WHERE security_id=%s AND period_end=%s AND period_type='QUARTER'
                  AND consolidation_scope=%s FOR UPDATE""",(record["security_id"],period,parsed["scope"]))
                decisions=cur.fetchall()
                cur.execute("SELECT id FROM fundamental_observations WHERE source_record_id IN (%s,%s)",(record["id"],new["id"]))
                allowed={r["id"] for r in cur.fetchall()}
                if any(d["selected_observation_id"] not in allowed for d in decisions):
                    raise RuntimeError("PROTECTED_SELECTION_CHANGED_DURING_REPLAY")
                for fact in observations:
                    cur.execute("""INSERT INTO fundamental_observation_decisions
                     (security_id,metric_code,period_end,period_type,consolidation_scope,
                      selected_observation_id,decision_basis,decided_at,notes)
                     VALUES(%s,%s,%s,'QUARTER',%s,%s,'CORRECTION',now(),%s)
                     ON CONFLICT(security_id,metric_code,period_end,period_type,consolidation_scope)
                     DO UPDATE SET selected_observation_id=excluded.selected_observation_id,
                       decision_basis='CORRECTION',decided_at=excluded.decided_at,notes=excluded.notes""",
                     (fact["security_id"],fact["metric_code"],period,parsed["scope"],fact["id"],
                      "R4_PDF_COORDINATE_REPLAY_CORRECTION; SUPERSEDES_SOURCE="+str(record["id"])+
                      "; OLD_OBSERVATIONS_RETAINED; OCR_ROW_REFERENCE_5_BULLET_6; ORIGINAL_R2_HASH_VERIFIED; "+
                      "HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN; NO_V1_4_AUTHORITY"))
            db.commit()
            print("R4_BSE_CORRECTION",json.dumps({"symbol":record["symbol"],"period":period,
                "superseded_source":str(record["id"]),"source_id":str(new["id"]),
                "inserted":inserted,"changes":changes}),flush=True)

if __name__=="__main__":main()
