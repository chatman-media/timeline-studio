#!/usr/bin/env bash
# Генерирует TS-контракт ProjectSchema из JSON Schema (ts-schema, Rust serde). M1 #120/#104.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/types/contracts/project-schema.ts
TMP="$(mktemp)"
cargo run -q --manifest-path crates/Cargo.toml --bin timeline-render -- --emit-schema > "$TMP"
{
  echo "// АВТОГЕНЕРАЦИЯ — НЕ РЕДАКТИРОВАТЬ ВРУЧНУЮ."
  echo "// Контракт ProjectSchema для агента / фронта / внешних продуктов (M1 #120 / #104)."
  echo "// Источник: timeline-render --emit-schema. Регенерация: bun run gen:schema-types."
  npx -y json-schema-to-typescript@15 "$TMP" --no-additionalProperties
} > "$OUT"
rm -f "$TMP"
echo "✓ $OUT ($(wc -l <"$OUT") строк)"
