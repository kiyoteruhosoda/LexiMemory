# RNW完全移行ロードマップ（Progress Tracker）

この計画は「既存Webを壊さず段階移行する」ことを最優先に、DDD + ポリモーフィズム（Port/Adapter）で
Web / RN / RNW の実装差分を吸収するための実行管理表です。

## 0. ガードレール（常時維持）
- [x] 既存Web互換を維持する方針を文書化
- [x] Vitest + Playwright の回帰検知基盤を導入
- [x] Visual regression の安定化（時刻/乱数/アニメーション制御）
- [~] CI で Chromium / Firefox 両プロジェクトの screenshot テストを必須化（ローカル実行済み・CI固定は次PR）

## 1. モジュール境界の確立（DDD）
- [x] `src/core/storage` に Storage Port (`StorageAdapter`) を定義
- [x] `TagFilterStorageService` を Port DI に変更（インフラ依存を注入）
- [~] 認証・同期・学習状態のユースケースを `src/core` に再配置（Auth + Word + Study/Examples usecase を移行、Syncは継続）
- [~] UI 層から API クライアント直参照を排除し、Application Service 経由に統一（Auth/Word/Study/Examples は Service 経由化済み）

## 2. UIポリモーフィズム（RNW境界）
- [x] `src/rnw` に RN風コンポーネント境界を作成
- [x] 小粒度コンポーネント（Button系）のRNW境界採用
- [~] Form / Modal / Card / List を RNWコンポーネントに置換（Form/Listは着手済み）
- [x] `*.web.tsx` / `*.native.tsx` 分岐ルールのテンプレート実装（RnwInlineNoticeで実装）

## 3. アプリ構成の段階的再編（モノレポ相当）
- [~] `packages/core`（domain/application/shared types）を新設（Storage Portを先行配置）
- [~] `packages/ui`（RNコンポーネント群）を新設（SurfaceCardを先行追加）
- [ ] `apps/web`（既存Web）から `packages/*` を参照する形へ移行
- [ ] `apps/mobile`（Expo想定）雛形を追加

## 4. 永続化戦略（Web/Mobile差し替え）
- [x] Web localStorage adapter を抽象化層へ集約
- [x] Mobile向け AsyncStorage adapter のスタブを追加
- [ ] AsyncStorage 実装（RN）を追加
- [ ] SQLite adapter（オフライン強化）を追加
- [ ] Repository単位でストレージ実装を切り替えるファクトリを導入

## 5. 画面移行（Screen-by-screen）
- [x] `/words` の一部UIをRNW境界化（PoC）
- [ ] `/words` 全UIを RNW component に統一
- [~] `/study` を RNW component に統一（CTA/Tag filter toolbarは置換済み）
- [ ] `/examples` を RNW component に統一
- [ ] `/words/create` と `/words/:id` を RNW component に統一
- [x] `/login` 画面を RNW component に統一（入力/通知/CTAをRNW primitive化）

## 6. 完全RNW化の完了条件（Definition of Done）
- [ ] 主要画面の UI 実装が `src/rnw` or `packages/ui` 経由のみ
- [ ] ドメインロジックが `core` へ集約され UI 層はユースケース呼び出しのみ
- [ ] 永続化が Port/Adapter 経由で Web/Mobile の差し替え可能
- [ ] Playwright visual regression が CI 上で安定運用
- [ ] Expo モバイルで主要ユースケース（閲覧・作成・学習・同期）が動作

## 直近の実行順（次スプリント）
1. [~] `WordListPage` の残り Bootstrap依存UIを RNW List/Filter primitives に置換
   - [x] 上部アクション（Study/Examples/Search/Export/Import）をRNW Button primitivesへ移行
   - [x] 検索フォームと一覧テーブルをRNW Form/List primitiveへ移行
   - [x] 空状態/エラー表示をRNW Notice primitiveへ移行
2. [~] 同ページの visual snapshot を Chromium/Firefox で固定
   - [x] RNW Pressable shim の pressed/disabled 挙動を unit test で固定
   - [x] `/login` + `/words` のvisual snapshotを最小セットとして固定
3. [~] `StudyPage` の CTA と filter toolbar を RNW primitives に揃える
   - [x] `StudyPage` のデータアクセスを `core/study` service 経由へ移行
4. [~] `Auth` / `Sync` のユースケースを `core/application` 層へ移動（Auth/Word/Study/Examples は完了、Sync は Application Service + Adapter まで完了）
5. [x] `ExamplesTestPage` のデータアクセスを `core/examples` service 経由へ移行

---

最終更新: 2026-02-25 (update-13)
