# RNW完全移行ロードマップ（Progress Tracker）

この計画は「既存Webを壊さず段階移行する」ことを最優先に、DDD + ポリモーフィズム（Port/Adapter）で
Web / RN / RNW の実装差分を吸収するための実行管理表です。

## 0. ガードレール（常時維持）
- [x] 既存Web互換を維持する方針を文書化
- [x] Vitest + Playwright の回帰検知基盤を導入
- [x] Visual regression の安定化（時刻/乱数/アニメーション制御）
- [x] CI で Chromium / Firefox 両プロジェクトの screenshot テストを必須化

## 1. モジュール境界の確立（DDD）
- [x] `src/core/storage` に Storage Port (`StorageAdapter`) を定義
- [x] `TagFilterStorageService` を Port DI に変更（インフラ依存を注入）
- [~] 認証・同期・学習状態のユースケースを `src/core` に再配置（Auth + Word + Study/Examples usecase は移行済み、Sync usecase は継続）
- [x] UI 層から API クライアント直参照を排除し、Application Service 経由に統一（Auth/Word/Study/Examples/Backup）

## 2. UIポリモーフィズム（RNW境界）
- [x] `src/rnw` に RN風コンポーネント境界を作成
- [x] 小粒度コンポーネント（Button系）のRNW境界採用
- [x] Form / Modal / Card / List を RNWコンポーネントに置換
- [x] `*.web.tsx` / `*.native.tsx` 分岐ルールのテンプレート実装（`RnwInlineNotice`）

## 3. アプリ構成の段階的再編（モノレポ相当）
- [x] `packages/core`（domain/application/shared types）を新設
- [x] `packages/ui`（RNコンポーネント群）を新設
- [~] `apps/web`（既存Web）から `packages/*` を参照する形へ移行（scaffold追加済み、本体移送が継続）
- [~] `apps/mobile`（Expo想定）雛形を追加（scaffold追加済み、Expo依存導入と画面接続が継続）

## 4. 永続化戦略（Web/Mobile差し替え）
- [x] Web localStorage adapter を抽象化層へ集約
- [~] Mobile向け AsyncStorage adapter を追加（driver注入型adapterは完了、RN実体注入と実機検証が継続）
- [~] SQLite adapter を追加（driver注入型adapterは完了、DB実体注入と移行戦略定義が継続）
- [x] Repository単位でストレージ実装を切り替えるファクトリを導入（runtime selector対応）

## 5. 画面移行（Screen-by-screen）
- [x] `/words` 全UIを RNW component に統一（action row/search/list/import）
- [x] `/study` を RNW component に統一（toolbar/filter/notice/flash-card）
- [x] `/examples` を RNW component に統一（toolbar/filter/quiz-card/notice）
- [x] `/words/create` を RNW component に統一（RNW form + panel）
- [x] `/words/:id` を RNW component に統一（RNW form + action group + confirm dialog）
- [x] `/login` 画面を RNW component に統一（入力/通知/CTAをRNW primitive化）

## 6. 完全RNW化の完了条件（Definition of Done）
- [x] 主要画面の UI 実装が `src/rnw` or `packages/ui` 経由のみ
- [~] ドメインロジックが `core` へ集約され UI 層はユースケース呼び出しのみ（Sync横断処理の最終移送が継続）
- [~] 永続化が Port/Adapter 経由で Web/Mobile の差し替え可能（adapter骨格は完了、実体注入が継続）
- [x] Playwright visual regression が CI 上で安定運用（workflow + local/CI command を固定）
- [ ] Expo モバイルで主要ユースケース（閲覧・作成・学習・同期）が動作

---

## 残タスク（未実施のみ・実施順）

### Phase A: DDD境界の仕上げ
1. [ ] Sync 関連ユースケースを `src/core` へ完全移送し、UI からの直接分岐ロジックを排除する。
2. [ ] `apps/web` 側の composition root を整理し、Application Service / Port 依存の注入責務を1箇所に集約する。

### Phase B: Mobile adapter 実体化
3. [ ] `native-async` に実際の AsyncStorage ドライバを注入する mobile adapter 実装を追加する。
4. [ ] `native-sqlite` に SQLite ドライバを注入する mobile adapter 実装を追加する。
5. [ ] adapter 切替時のデータ移行ポリシー（versioning / fallback）を仕様化し、テストを追加する。

### Phase C: モノレポ移送完了
6. [ ] `apps/web` へ画面エントリを移し、現行 frontend からの依存を段階削除する。
7. [ ] `apps/mobile` (Expo) を起動可能な最小構成まで拡張し、`packages/core` + `packages/ui` を接続する。

### Phase D: Expo実行可能状態の達成
8. [ ] Expo 上で `/words` 相当（閲覧・検索）を動作させる。
9. [ ] Expo 上で作成/編集ユースケースを動作させる。
10. [ ] Expo 上で学習/同期ユースケースを動作させ、E2E相当の検証手順を整備する。

最終更新: 2026-02-25 (update-27)
