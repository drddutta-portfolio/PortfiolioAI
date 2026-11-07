"""Read-only exchange result-link review; no financial figures are promoted."""
import re,json
from urllib.parse import urlparse

def review_shape(response):
    data=json.loads(response) if isinstance(response,str) else response
    if not isinstance(data,dict):raise ValueError('BSE_SNAPSHOT_OBJECT_REQUIRED')
    links=set()
    def walk(value):
        if isinstance(value,dict):
            for v in value.values():walk(v)
        elif isinstance(value,list):
            for v in value:walk(v)
        elif isinstance(value,str):
            for url in re.findall(r'https://[^\s<>"\x27]+',value):
                url=url.rstrip(').,;]');u=urlparse(url)
                try:port=u.port
                except ValueError:continue
                if u.hostname in ('www.bseindia.com','api.bseindia.com') and not u.username and not u.password and not u.fragment and not u.query and port in (None,443):links.add(url)
    period_links=data.get('resultinS',[]);walk(period_links)
    # Only field names, explicit period labels and public link strings leave
    # private R2. Revenue, PAT, EPS and other financial values are excluded.
    fields=sorted({k for row in period_links if isinstance(row,dict) for k in row}) if isinstance(period_links,list) else []
    periods=[str(data[k])[:80] for k in ('col2','col3','col4') if data.get(k)]
    return {'schema_keys':sorted(data),'periods':periods,'period_link_fields':fields,'period_link_count':len(period_links) if isinstance(period_links,list) else None,'public_exchange_links':sorted(links),'canonical_facts':0}
