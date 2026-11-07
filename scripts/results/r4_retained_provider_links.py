"""Review-only original links from private captures; never financial authority."""
import json,re,html
from urllib.parse import urlparse
from r4_official_issuer import ISSUERS

def original_links(value,symbol):
    if symbol not in ISSUERS:raise ValueError('UNCONFIGURED_SOURCE_ISSUER')
    hosts=set(ISSUERS[symbol]['hosts'])|{'www.bseindia.com','nsearchives.nseindia.com'};found=set()
    def walk(item,depth=0):
        if depth>20:raise ValueError('PROVIDER_LINK_REVIEW_DEPTH_BOUND')
        if isinstance(item,dict):
            for value in item.values():walk(value,depth+1)
        elif isinstance(item,list):
            for value in item:walk(value,depth+1)
        elif isinstance(item,str):
            if len(item)>5_000_000:raise ValueError('PROVIDER_LINK_REVIEW_SIZE_BOUND')
            text=html.unescape(item)
            if text.lstrip().startswith(('{','[')):
                try:decoded=json.loads(text)
                except (ValueError,RecursionError):pass
                else:walk(decoded,depth+1);return
            for url in re.findall(r'https://[^\s<>"\x27]+',text):
                url=url.rstrip(').,;]');u=urlparse(url)
                try:port=u.port
                except ValueError:continue
                if (u.scheme=='https' and u.hostname in hosts and not u.username and not u.password
                    and port in (None,443) and not u.query and not u.fragment and u.path.lower().endswith('.pdf')):found.add(url)
    walk(value);return sorted(found)
