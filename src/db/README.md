# src/db

The two SQLite databases (`corpus.sqlite`, read-only, and `app.sqlite`, users' saved work), their schemas, clients and queries. See `openspec/changes/app-server-and-sqlite/design.md`.

## Modules shared with scripts

`scripts/seed-corpus.ts` and `scripts/migrate-app.ts` run directly on Node with its built-in type stripping, not through Next or a bundler. Every module they import, here and in `src/lib/corpus/` and `src/lib/books.ts`, must follow these rules:

- Relative imports with an explicit `.ts` extension (`./paths.ts`), never the `@/` alias.
- No `import "server-only"`. It throws outside Next's server build. Next-facing code imports `src/db/server.ts` instead, which carries the guard. Client components never import anything under `src/db/`; a test enforces this.
- Erasable TypeScript only: no `enum`, `namespace` or constructor parameter properties.
- Type-only imports written as `import type`, so stripping removes them.

`tsconfig.json` sets `allowImportingTsExtensions`, `verbatimModuleSyntax` and `erasableSyntaxOnly`, so `tsc` reports non-erasable syntax and type imports written as value imports. `tsc` cannot see the other rules (the `@/` alias resolves, extensionless imports resolve under `bundler`, and `server-only` type-checks), so `script-imports.test.ts` checks every script-shared module for them.

## Errors

`DatabaseMissingError` and `DatabaseDamagedError` have path-free messages that are safe to show. The file path and SQLite detail are on `.file` and `.detail` for logs and the CLI only: never serialise these errors whole (`JSON.stringify`, spreading, returning them from an action) to a client.
