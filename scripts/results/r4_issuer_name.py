"""Exact legal-name fallback for issuers with one distinctive company word."""
import re

def words(value):
    return ["LIMITED" if x=="LTD" else x for x in re.findall(r"[A-Z0-9]+",value.upper())]

def explicit_legal_name(value):
    if not isinstance(value,str):return False
    tokens=words(value)
    return bool(len(tokens)>=2 and tokens[-1]=="LIMITED" and
        any(len(t)>=3 and t not in {"LIMITED","PRIVATE","PVT","THE","INDIA","COMPANY"} for t in tokens[:-1]))

def exact_legal_identity(name,text):
    if not explicit_legal_name(name):return False
    needle=words(name);haystack=words(text)
    if any(haystack[i:i+len(needle)]==needle for i in range(len(haystack)-len(needle)+1)):return True
    # A PDF may split initials or join company-name words. Preserve every
    # alphanumeric character, its order, and the complete legal suffix.
    compact="".join(needle)
    for start in range(len(haystack)):
        for end in range(start+1,min(len(haystack),start+len(needle)+4)+1):
            candidate="".join(haystack[start:end])
            if candidate.endswith("LTD"):candidate=candidate[:-3]+"LIMITED"
            if candidate==compact:return True
    return False



# Exact public exchange display spelling, bound to one canonical security.
BSE_DISPLAY_ALIASES={'IGL':{'isin':'INE203G01027','scrip_code':'532514',
    'name':'Indraprashtha Gas Ltd.','legal':'INDRAPRASTHA GAS LIMITED'}}

def bse_display_alias_matches(symbol,isin,code,name,legal_name=None):
    alias=BSE_DISPLAY_ALIASES.get(symbol)
    return bool(alias and alias['isin']==isin and alias['scrip_code']==code
        and words(alias['name'])==words(name)
        and (legal_name is None or words(alias['legal'])==words(legal_name)))
