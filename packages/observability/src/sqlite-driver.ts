/**
 * Driver SQLite minimal — dual-build CJS Electron (pas d'import.meta).
 */

import { createRequire } from "node:module";
import path from "node:path";

export type SqliteStatement = {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
};

export type SqliteDatabase = {
  exec(sql: string): unknown;
  prepare(sql: string): SqliteStatement;
  close?: () => void;
};

export type OpenSqliteDatabase = (path: string) => SqliteDatabase;

export function openNodeSqliteDatabase(dbPath: string): SqliteDatabase {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const mod = require("node:sqlite") as {
    DatabaseSync: new (path: string) => {
      exec(sql: string): void;
      prepare(sql: string): {
        run(...params: unknown[]): unknown;
        get(...params: unknown[]): unknown;
        all(...params: unknown[]): unknown[];
      };
      close(): void;
    };
  };
  const db = new mod.DatabaseSync(dbPath);
  return {
    exec: (sql) => db.exec(sql),
    prepare: (sql) => db.prepare(sql),
    close: () => db.close(),
  };
}
