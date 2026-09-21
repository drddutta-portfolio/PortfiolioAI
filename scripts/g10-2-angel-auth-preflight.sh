#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${G10_2_LOCAL_ENV_FILE:-supabase/.env.local}"
[[ -f "$ENV_FILE" ]] || { echo "ERROR: missing $ENV_FILE" >&2; exit 1; }

python3 - "$ENV_FILE" <<'PY'
import base64
import hashlib
import hmac
import json
import struct
import sys
import time
import urllib.error
import urllib.request

path = sys.argv[1]
required = [
    "ANGEL_ONE_API_KEY",
    "ANGEL_ONE_CLIENT_CODE",
    "ANGEL_ONE_PIN",
    "ANGEL_ONE_TOTP_SECRET",
    "ANGEL_ONE_CLIENT_LOCAL_IP",
    "ANGEL_ONE_CLIENT_PUBLIC_IP",
    "ANGEL_ONE_MAC_ADDRESS",
]

env = {}
with open(path, "r", encoding="utf-8") as handle:
    for raw in handle:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")

missing = [key for key in required if not env.get(key)]
if missing:
    print("MISSING:", ", ".join(missing))
    raise SystemExit(2)

def totp(secret: str) -> str:
    normalized = "".join(secret.upper().split()).rstrip("=")
    padding = "=" * ((8 - len(normalized) % 8) % 8)
    key = base64.b32decode(normalized + padding)
    counter = int(time.time() // 30)
    message = struct.pack(">Q", counter)
    digest = hmac.new(key, message, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = (
        ((digest[offset] & 0x7F) << 24)
        | (digest[offset + 1] << 16)
        | (digest[offset + 2] << 8)
        | digest[offset + 3]
    ) % 1_000_000
    return f"{code:06d}"

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": env["ANGEL_ONE_CLIENT_LOCAL_IP"],
    "X-ClientPublicIP": env["ANGEL_ONE_CLIENT_PUBLIC_IP"],
    "X-MACAddress": env["ANGEL_ONE_MAC_ADDRESS"],
    "X-PrivateKey": env["ANGEL_ONE_API_KEY"],
}
payload = json.dumps({
    "clientcode": env["ANGEL_ONE_CLIENT_CODE"],
    "password": env["ANGEL_ONE_PIN"],
    "totp": totp(env["ANGEL_ONE_TOTP_SECRET"]),
}).encode("utf-8")

request = urllib.request.Request(
    "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword",
    data=payload,
    headers=headers,
    method="POST",
)

try:
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read().decode("utf-8", errors="replace")
        status = response.status
except urllib.error.HTTPError as exc:
    status = exc.code
    body = exc.read().decode("utf-8", errors="replace")
except Exception as exc:
    print("ANGEL AUTH PREFLIGHT NETWORK ERROR:", type(exc).__name__)
    raise SystemExit(3)

try:
    parsed = json.loads(body)
except Exception:
    parsed = {}

print("ANGEL AUTH PREFLIGHT")
print("HTTP_STATUS:", status)
print("STATUS:", parsed.get("status"))
print("ERROR_CODE:", parsed.get("errorcode"))
print("MESSAGE:", parsed.get("message"))

token = None
if isinstance(parsed.get("data"), dict):
    token = parsed["data"].get("jwtToken")
print("JWT_RETURNED:", bool(token))

if status == 200 and parsed.get("status") is True and token:
    print("RESULT: PASS")
    raise SystemExit(0)

print("RESULT: FAIL")
raise SystemExit(4)
PY
