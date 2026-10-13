"""Preserve the three investigated originals; no historical publication/admission inference."""
import hashlib,json,urllib.request
from pathlib import Path
manifest=Path('docs/private/v1-4-industry-batches/KVB_PIT_Three_Source_Samples_2026-10-11.json')
proof=json.loads(manifest.read_text())
root=Path('kvb-pit-source-originals');root.mkdir(exist_ok=True)
for sample in proof['samples']:
 p=sample['issuer_original']
 assert p['url'].startswith('https://www.kvb.bank.in/docs/investor-presentation-') and p['url'].endswith('.pdf')
 with urllib.request.urlopen(p['url'],timeout=30) as response: data=response.read()
 assert data.startswith(b'%PDF-') and len(data)==p['bytes'] and hashlib.sha256(data).hexdigest()==p['sha256'], 'ORIGINAL_CHANGED_DO_NOT_ADMIT'
 (root/Path(p['url']).name).write_bytes(data)
(root/'qualification-samples.json').write_text(manifest.read_text())
print(json.dumps({'originals_verified':3,'pe_admitted':0,'pb_admitted':0,'canonical_writes':0}))
