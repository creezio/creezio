#!/usr/bin/env bash
# Ouvre une URL HTTP dans un navigateur — sans dépendre uniquement de xdg-open.
# Utilisé par les raccourcis Docker server-N ({Product}-Server-{N}.desktop).
set -euo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo "usage: creezio-open-url <url>" >&2
  exit 2
fi

# Session XFCE / xrdp : hériter d'un DISPLAY si lancé hors bureau.
if [[ -z "${DISPLAY:-}" ]]; then
  for sock in /tmp/.X11-unix/X10 /tmp/.X11-unix/X*; do
    [[ -S "$sock" ]] || continue
    n="${sock##*/X}"
    [[ "$n" =~ ^[0-9]+$ ]] || continue
    export DISPLAY=":$n"
    break
  done
fi
export XAUTHORITY="${XAUTHORITY:-${HOME:-/home/deploy}/.Xauthority}"

try() {
  local bin="$1"
  shift
  if ! command -v "$bin" >/dev/null 2>&1; then
    return 1
  fi
  # Détacher du process parent (double-clic .desktop)
  nohup "$bin" "$@" >/dev/null 2>&1 &
  echo "opened with $bin → $URL (pid $!)"
  return 0
}

# Ordre : navigateurs réels d'abord, puis helpers desktop.
try firefox --new-window "$URL" && exit 0
try firefox "$URL" && exit 0
try chromium --new-window "$URL" && exit 0
try chromium-browser --new-window "$URL" && exit 0
try google-chrome --new-window "$URL" && exit 0
try google-chrome-stable --new-window "$URL" && exit 0
try brave-browser --new-window "$URL" && exit 0
try microsoft-edge --new-window "$URL" && exit 0

if command -v gio >/dev/null 2>&1; then
  nohup gio open "$URL" >/dev/null 2>&1 &
  echo "opened with gio open → $URL (pid $!)"
  exit 0
fi

if command -v exo-open >/dev/null 2>&1; then
  nohup exo-open --launch WebBrowser "$URL" >/dev/null 2>&1 &
  echo "opened with exo-open → $URL (pid $!)"
  exit 0
fi

try xdg-open "$URL" && exit 0
try x-www-browser "$URL" && exit 0
try sensible-browser "$URL" && exit 0

echo "creezio-open-url: aucun navigateur trouvé pour $URL" >&2
echo "Installer p.ex. : sudo apt-get install -y xdg-utils && sudo snap install firefox" >&2
exit 1
