# Storage Migration Policy (Web ↔ Mobile)

## Goal

このドキュメントは、Storage adapter 切替時（Web localStorage / Native AsyncStorage / Native SQLite）に
データ互換性を維持するための versioning + fallback ポリシーを定義します。

## Versioning strategy

- メタデータキー: `storage.schema.version`
- フォーマット:

```json
{
  "version": 2,
  "updatedAt": "2026-02-25T00:00:00.000Z"
}
```

- `updatedAt` は UTC ISO8601 で保存する。
- `version` が `targetVersion` 未満の場合のみ migration を実行する。

## Fallback strategy

1. primary adapter から metadata を読む。
2. primary metadata が無く fallback metadata がある場合は、定義済み `dataKeys` のみ fallback → primary に復元する。
3. primary adapter が障害（例: native module unavailable）で失敗した場合は、fallback adapter へ切り替える。
4. fallback でも `version < targetVersion` の場合は migration を実行する。

## Scope of data transfer

- 安全な key のみを `dataKeys` で明示して復元する。
- センシティブ情報やプラットフォーム固有キャッシュは対象外にする。

## Current implementation points

- Policy implementation: `src/core/storage/storageMigrationPolicy.ts`
- Tests: `src/__tests__/core/storageMigrationPolicy.test.ts`
- Mobile AsyncStorage adapter: `apps/mobile/src/storage/mobileAsyncStorageAdapter.ts`
- Mobile SQLite adapter: `apps/mobile/src/storage/mobileSqliteStorageAdapter.ts`

## Operational notes

- migration 処理は idempotent（複数回実行しても結果が壊れない）に実装する。
- fallback 発生時は telemetry/log に `usedFallback=true` を記録する。
- 破壊的 migration は feature flag で段階適用する。
