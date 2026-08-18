# @creezio/brand-config

## 0.10.7

## 0.10.6

## 0.10.5

## 0.10.4

## 0.10.3

## 0.10.2

## 0.10.1

## 0.10.0

## 0.9.4

## 0.9.3

## 0.9.2

## 0.9.1

## 0.9.0

## 0.8.1

## 0.8.0

## 0.7.1

## 0.7.0

## 0.6.0

## 0.5.0

### Patch Changes

- e23b259: feat(npm-deploy-tooling) : tooling de déploiement Docker en mode npm — le Dockerfile SoT (docker/server) installe les @creezio/\* depuis GitHub Packages via secret BuildKit CREEZIO_NPM_TOKEN (plus de COPY vendor ni symlinks, npm ci strict sur le lock racine workspace), dockerignore v4 sans exceptions vendor. Factory : les apps générées naissent npm (deps ^lockstep, .npmrc, workspaces racine, workflows ci+deploy seuls — kit-compat/vendor-update supprimés), ensure-server-lock.mjs valide les locks workspace, prepareBrandDistribution = locks npm. CLI server-docker : build/publish passent le secret BuildKit (CREEZIO_NPM_TOKEN requis) et ensureBrandStandalone ne matérialise plus de vendor. brand-config : FileSets asar résolus depuis node_modules (walk-up workspaces) au lieu de vendor/creezio.
