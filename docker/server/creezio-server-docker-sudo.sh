#!/usr/bin/env bash
# Wrapper sudo scopé pour les ops flotte (Q3) — installé root:root 0755 dans
# /usr/local/sbin/creezio-server-docker, autorisé seul en NOPASSWD pour le
# user de deploy (remplace NOPASSWD:ALL).
#
#   deploy ALL=(root) NOPASSWD: /usr/local/sbin/creezio-server-docker
#
# N'autorise QUE `creezio server-docker <update|backup|migrate-stack|ls|start|
# stop|logs>` sur des brand roots en allowlist (/opt/docker/*), avec des
# arguments validés (pas d'injection : allowlist stricte + regex par flag).
# Le binaire node du kit est résolu ici — jamais via PATH de l'appelant.
set -euo pipefail

KIT_ROOT="${CREEZIO_KIT_ROOT:-/opt/docker/creezio}"
CLI="$KIT_ROOT/packages/factory/bin/creezio.js"
NODE="$(command -v node)"

die() { echo "creezio-server-docker(sudo): $*" >&2; exit 2; }

[ -x "$CLI" ] || die "CLI kit introuvable: $CLI"
[ -n "$NODE" ] || die "node introuvable"

SUB="${1:-}"
case "$SUB" in
  update|backup|migrate-stack|ls|start|stop|logs) ;;
  *) die "sous-commande refusée: ${SUB:-<vide>} (update|backup|migrate-stack|ls|start|stop|logs)" ;;
esac
shift || true
ORIG_ARGS=("$@")

# Validation des arguments : flags connus + valeurs saines, brand-root en
# allowlist /opt/docker/<repo> existant. Itère sur une copie — ORIG_ARGS est
# rejoué tel quel après validation.
BRAND_ROOT=""
set -- "${ORIG_ARGS[@]}"
HAS_BRAND_ROOT=0
while [ $# -gt 0 ]; do
  a="$1"
  case "$a" in
    --brand-root)
      BRAND_ROOT="${2:-}"; HAS_BRAND_ROOT=1; shift 2 ;;
    --brand-root=*)
      BRAND_ROOT="${a#--brand-root=}"; HAS_BRAND_ROOT=1; shift ;;
    --tag)
      # tags semver (0.7.0) ET auto (auto.202608101152.441a96c) — charset sûr.
      [[ "${2:-}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$ ]] || die "tag invalide: ${2:-}"
      shift 2 ;;
    --tag=*)
      [[ "${a#--tag=}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$ ]] || die "tag invalide: ${a#--tag=}"
      shift ;;
    --image)
      [[ "${2:-}" =~ ^[A-Za-z0-9./:@_-]+$ ]] || die "image invalide"
      shift 2 ;;
    --image=*)
      [[ "${a#--image=}" =~ ^[A-Za-z0-9./:@_-]+$ ]] || die "image invalide"
      shift ;;
    --registry)
      [[ "${2:-}" =~ ^[A-Za-z0-9.:-]+$ ]] || die "registry invalide"
      shift 2 ;;
    --registry=*)
      [[ "${a#--registry=}" =~ ^[A-Za-z0-9.:-]+$ ]] || die "registry invalide"
      shift ;;
    --host-port|--tail)
      [[ "${2:-}" =~ ^[0-9]+$ ]] || die "valeur numérique requise: $a"
      shift 2 ;;
    --host-port=*|--tail=*)
      [[ "${a#*=}" =~ ^[0-9]+$ ]] || die "valeur numérique requise: $a"
      shift ;;
    --backup|--follow|--no-stack|--stack)
      shift ;;
    --*)
      die "flag refusé: $a" ;;
    *)
      # nom d'instance : [a-z0-9][a-z0-9-]*
      [[ "$a" =~ ^[a-z0-9][a-z0-9-]{0,30}$ ]] || die "argument invalide: $a"
      shift ;;
  esac
done

[ "$HAS_BRAND_ROOT" = 1 ] || die "--brand-root requis"
case "$BRAND_ROOT" in
  /opt/docker/*) ;;
  *) die "brand-root hors allowlist: $BRAND_ROOT" ;;
esac
[ -d "$BRAND_ROOT" ] || die "brand-root inexistant: $BRAND_ROOT"

# Rejoue la commande validée telle quelle (arguments déjà filtrés).
exec "$NODE" "$CLI" server-docker "$SUB" "${ORIG_ARGS[@]}"
