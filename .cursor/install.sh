#!/usr/bin/env bash
# Cloud Agent install for the creezio multi-repo workspace.
#
# The workspace checks out three sibling repos under one root:
#   <repos_root>/creezio     -> kit monorepo (@creezio/* workspaces, SoT)
#   <repos_root>/foove2       -> brand monorepo (server workspace + server/ui + client)
#   <repos_root>/tempoflow3   -> brand monorepo (server workspace + server/ui + client)
#
# A single environment `install` command runs from the primary repo (creezio),
# so the previous `npm install` only provisioned creezio and left the brand
# repos with no dependencies. This script provisions all three.
#
# Paths are derived from this script's own location so it is independent of the
# working directory. It is idempotent: re-running only refreshes what changed.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
creezio_root="$(cd "$script_dir/.." && pwd)"
repos_root="$(cd "$creezio_root/.." && pwd)"

npm_install() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then
    echo "== npm install: $dir =="
    (cd "$dir" && npm install --no-audit --no-fund)
  else
    echo "== skip (no package.json): $dir =="
  fi
}

# 1) Kit monorepo: install workspaces, then build so the local @creezio/* dist
#    (and the `creezio` CLI used by the factory / brand workflows) exists.
npm_install "$creezio_root"
echo "== build:packages (kit dist for the creezio CLI, factory and gates) =="
(cd "$creezio_root" && NODE_OPTIONS="--max-old-space-size=4096" npm run build:packages)

# 2) Brand monorepos: install the root workspace (covers server/) plus the two
#    independent projects (server/ui and client) that carry their own lockfiles
#    and pull @creezio/* from GitHub Packages via CREEZIO_NPM_TOKEN.
for brand in foove2 tempoflow3; do
  npm_install "$repos_root/$brand"
  npm_install "$repos_root/$brand/server/ui"
  npm_install "$repos_root/$brand/client"
done

echo "== install complete =="
