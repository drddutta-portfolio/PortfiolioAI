#!/usr/bin/env python3
import importlib.util, pathlib
P=pathlib.Path("scripts/p8/p8-step2-historical-feasibility-census.py")
s=importlib.util.spec_from_file_location("p8s2",P);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
assert m.strict_gt_half("0.5000000001") is True
assert m.strict_gt_half("0.5") is False
assert m.strict_gt_half("0.4999999999") is False
assert m.strict_gt_half(None) is False
assert m.map_description("Manufacturing- Steel Pipes")=="IN070205015"
assert m.map_description("Edible Oil")=="IN040101001"
assert m.map_description("Steel Pipes") is None
assert m.map_description("DIVERSIFIED") is None
assert m.pick_primary({"access":True})=="NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION"
assert m.pick_primary({"no_pre":True})=="NO_PRE_DECISION_EVIDENCE"
assert m.pick_primary({"classification":False})=="CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE"
assert m.pick_primary({"classification":True,"market":False})=="MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY"
assert m.pick_primary({"classification":True,"market":True,"route":False})=="ROUTE_UNSUPPORTED_OR_AMBIGUOUS"
assert m.pick_primary({"classification":True,"market":True,"route":True,"inputs":False})=="REQUIRED_INPUTS_INCOMPLETE"
assert m.pick_primary({"classification":True,"market":True,"route":True,"inputs":True})=="COMPLETE_INPUTS"
rows=[("a","2024-01-01"),("a","2024-02-01"),("b","2024-01-01")]
m.assert_unique_pairs(rows,3)
try:
    m.assert_unique_pairs(rows+[("a","2024-01-01")],4); raise AssertionError("duplicate was not rejected")
except RuntimeError: pass
assert m.fingerprint({"x":1,"y":[2,3]})==m.fingerprint({"y":[2,3],"x":1})
print("P8 Step 2 semantic/reconciliation tests PASS")
