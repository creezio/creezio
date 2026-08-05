#!/usr/bin/env bash
# Expose l'admin flotte Creezio (127.0.0.1:18800) sur https://admin.{zone} :
#   1. DNS Cloudflare : A record proxifié admin.{zone} → IP publique du VPS
#   2. nginx-proxy-manager : proxy host → 127.0.0.1:$PORT (websockets ON)
#   3. TLS : certificat Cloudflare Origin (15 ans) uploadé dans NPM + SSL forcé
#
# L'auth reste celle de l'admin (Basic auth server-admin) — pas de double
# access-list NPM.
#
# Env :
#   DOMAIN       (défaut admin.tempoflow.fr)
#   PORT         (défaut 18800)
#   CF_ENV       creds zone (défaut /opt/docker/wp-provisioner/.cloudflare-tempoflow.env)
#   NPM_ENV      creds NPM   (défaut /opt/docker/wp-provisioner/.env → NPM_EMAIL/NPM_PASSWORD)
#   PUBLIC_IP    (défaut : IP détectée via api.ipify.org)
set -euo pipefail

NPM_CONTAINER="${NPM_CONTAINER:-nginx-proxy-manager}"
NPM_API="http://127.0.0.1:81/api"
CF_API="https://api.cloudflare.com/client/v4"
DOMAIN="${DOMAIN:-admin.tempoflow.fr}"
PORT="${PORT:-18800}"
CF_ENV="${CF_ENV:-/opt/docker/wp-provisioner/.cloudflare-tempoflow.env}"
NPM_ENV="${NPM_ENV:-/opt/docker/wp-provisioner/.env}"

set -a; . "$CF_ENV"; . "$NPM_ENV"; set +a
: "${CF_API_TOKEN:?}"; : "${CF_ZONE_ID:?}"; : "${NPM_EMAIL:?}"; : "${NPM_PASSWORD:?}"

PUBLIC_IP="${PUBLIC_IP:-$(curl -sS --max-time 10 https://api.ipify.org)}"
[ -n "$PUBLIC_IP" ] || { echo "ERREUR: IP publique introuvable"; exit 1; }

echo "==> DNS $DOMAIN → $PUBLIC_IP (proxifié Cloudflare)"
EXISTING=$(curl -sS -H "Authorization: Bearer $CF_API_TOKEN" \
  "$CF_API/zones/$CF_ZONE_ID/dns_records?name=$DOMAIN" | jq -r '.result[0].id // empty')
DNS_BODY=$(jq -nc --arg n "$DOMAIN" --arg ip "$PUBLIC_IP" \
  '{type:"A",name:$n,content:$ip,ttl:1,proxied:true,comment:"Creezio admin flotte"}')
if [ -n "$EXISTING" ]; then
  curl -sS -X PUT -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    "$CF_API/zones/$CF_ZONE_ID/dns_records/$EXISTING" -d "$DNS_BODY" | jq -e '.success' >/dev/null
  echo "   A record mis à jour"
else
  curl -sS -X POST -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    "$CF_API/zones/$CF_ZONE_ID/dns_records" -d "$DNS_BODY" | jq -e '.success' >/dev/null
  echo "   A record créé"
fi

echo "==> Authentification NPM"
TOKEN=$(docker exec "$NPM_CONTAINER" curl -sS -X POST "$NPM_API/tokens" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg i "$NPM_EMAIL" --arg s "$NPM_PASSWORD" '{identity:$i,secret:$s}')" \
  | jq -r '.token // empty')
[ -n "$TOKEN" ] || { echo "ERREUR: token NPM vide"; exit 1; }

echo "==> Certificat Cloudflare Origin $DOMAIN"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
cat > "$TMP/openssl.cnf" <<EOF
[ req ]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req
[ dn ]
CN = $DOMAIN
[ v3_req ]
subjectAltName = @alt_names
[ alt_names ]
DNS.1 = $DOMAIN
EOF
openssl req -new -newkey rsa:2048 -nodes -keyout "$TMP/origin.key" \
  -out "$TMP/origin.csr" -config "$TMP/openssl.cnf" >/dev/null 2>&1
CF_BODY=$(jq -n --rawfile csr "$TMP/origin.csr" --arg d "$DOMAIN" \
  '{hostnames:[$d],requested_validity:5475,request_type:"origin-rsa",csr:$csr,requested_bundle:"false"}')
CF_RESP=$(curl -sS -X POST "$CF_API/certificates" \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" -d "$CF_BODY")
if ! echo "$CF_RESP" | jq -e '.success==true' >/dev/null 2>&1; then
  echo "ERREUR Cloudflare Origin CA: $(echo "$CF_RESP" | jq -c '.errors // .' | head -c 400)"
  echo "   (le token CF doit avoir la permission « SSL and Certificates »/Origin CA)"
  exit 1
fi
echo "$CF_RESP" | jq -r '.result.certificate' > "$TMP/origin.pem"

CERT_NAME="creezio-admin-$DOMAIN"
CERT_ID=$(docker exec "$NPM_CONTAINER" curl -sS -H "Authorization: Bearer $TOKEN" \
  "$NPM_API/nginx/certificates" \
  | jq -r --arg n "$CERT_NAME" '(if type=="array" then . else [] end)[]|select(.nice_name==$n)|.id' | head -1)
if [ -z "$CERT_ID" ]; then
  CERT_ID=$(docker exec "$NPM_CONTAINER" curl -sS -X POST "$NPM_API/nginx/certificates" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "$(jq -nc --arg n "$CERT_NAME" '{provider:"other",nice_name:$n}')" | jq -r '.id // empty')
  [ -n "$CERT_ID" ] || { echo "ERREUR: création certificat NPM"; exit 1; }
fi
docker cp "$TMP/origin.pem" "$NPM_CONTAINER:/tmp/creezio-admin-cert.pem"
docker cp "$TMP/origin.key" "$NPM_CONTAINER:/tmp/creezio-admin-key.pem"
UPLOAD=$(docker exec "$NPM_CONTAINER" curl -sS -X POST \
  "$NPM_API/nginx/certificates/$CERT_ID/upload" -H "Authorization: Bearer $TOKEN" \
  -F "certificate=@/tmp/creezio-admin-cert.pem" -F "certificate_key=@/tmp/creezio-admin-key.pem")
docker exec "$NPM_CONTAINER" rm -f /tmp/creezio-admin-cert.pem /tmp/creezio-admin-key.pem
echo "$UPLOAD" | jq -e '.certificate' >/dev/null 2>&1 || { echo "ERREUR upload cert: $UPLOAD"; exit 1; }
echo "   certificat NPM id=$CERT_ID"

echo "==> Proxy host $DOMAIN → 127.0.0.1:$PORT"
ADV='proxy_buffering off;
proxy_cache off;
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;'
PAYLOAD=$(jq -nc --arg d "$DOMAIN" --argjson p "$PORT" --argjson c "$CERT_ID" --arg adv "$ADV" \
  '{domain_names:[$d],forward_scheme:"http",forward_host:"127.0.0.1",forward_port:$p,
    access_list_id:0,certificate_id:$c,ssl_forced:true,hsts_enabled:false,
    hsts_subdomains:false,http2_support:true,block_exploits:true,caching_enabled:false,
    allow_websocket_upgrade:true,advanced_config:$adv,enabled:true,
    meta:{letsencrypt_agree:false,dns_challenge:false},locations:[]}')
HOST_ID=$(docker exec "$NPM_CONTAINER" curl -sS -H "Authorization: Bearer $TOKEN" \
  "$NPM_API/nginx/proxy-hosts" \
  | jq -r --arg d "$DOMAIN" '(if type=="array" then . else [] end)[]|select((.domain_names//[])|index($d)!=null)|.id' | head -1)
if [ -n "$HOST_ID" ]; then
  docker exec "$NPM_CONTAINER" curl -sS -X PUT "$NPM_API/nginx/proxy-hosts/$HOST_ID" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$PAYLOAD" \
    | jq -e '.id' >/dev/null || { echo "ERREUR update proxy host"; exit 1; }
  echo "   proxy host mis à jour (id=$HOST_ID)"
else
  HOST_ID=$(docker exec "$NPM_CONTAINER" curl -sS -X POST "$NPM_API/nginx/proxy-hosts" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$PAYLOAD" \
    | jq -r '.id // empty')
  [ -n "$HOST_ID" ] || { echo "ERREUR création proxy host"; exit 1; }
  echo "   proxy host créé (id=$HOST_ID)"
fi

echo "=================================================="
echo " OK → https://$DOMAIN/admin (Basic auth server-admin)"
echo "=================================================="
