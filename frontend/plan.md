# RNW完全移行ロードマップ（Progress Tracker）

この計画は「既存Webを壊さず段階移行する」ことを最優先に、DDD + ポリモーフィズム（Port/Adapter）で
Web / RN / RNW の実装差分を吸収するための実行管理表です。

## 0. ガードレール（常時維持）
- [x] 既存Web互換を維持する方針を文書化
- [x] Vitest + Playwright の回帰検知基盤を導入
- [x] Visual regression の安定化（時刻/乱数/アニメーション制御）
- [~] CI で Chromium / Firefox 両プロジェクトの screenshot テストを必須化（ローカル実行済み・workflow固定は継続）

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
- [x] `packages/core`（domain/application/shared types）を新設
- [x] `packages/ui`（RNコンポーネント群）を新設
- [~] `apps/web`（既存Web）から `packages/*` を参照する形へ移行（scaffold追加済み、本体移動は継続）
- [~] `apps/mobile`（Expo想定）雛形を追加（scaffold追加済み、Expo依存導入は継続）

## 4. 永続化戦略（Web/Mobile差し替え）
- [x] Web localStorage adapter を抽象化層へ集約
- [~] Mobile向け AsyncStorage adapter を追加（driver注入型adapterを実装、RN実体注入は継続）
- [~] SQLite adapter を追加（driver注入型adapterを実装、DB実体注入は継続）
- [x] Repository単位でストレージ実装を切り替えるファクトリを導入（runtime selector対応）

## 5. 画面移行（Screen-by-screen）
- [x] `/words` の一部UIをRNW境界化（PoC）
- [ ] `/words` 全UIを RNW component に統一
- [~] `/study` を RNW component に統一（CTA/Tag filter toolbar/notice は置換済み）
- [~] `/examples` を RNW component に統一（action bar/tag panel/notice は置換済み）
- [~] `/words/create` と `/words/:id` を RNW component に統一（detail actions はRNW group化済み）
- [x] `/login` 画面を RNW component に統一（入力/通知/CTAをRNW primitive化）

## 6. 完全RNW化の完了条件（Definition of Done）
- [ ] 主要画面の UI 実装が `src/rnw` or `packages/ui` 経由のみ
- [ ] ドメインロジックが `core` へ集約され UI 層はユースケース呼び出しのみ
- [~] 永続化が Port/Adapter 経由で Web/Mobile の差し替え可能（adapterの骨格は完了、実体注入が継続）
- [~] Playwright visual regression が CI 上で安定運用（ローカル安定、CI運用固定化が継続）
- [ ] Expo モバイルで主要ユースケース（閲覧・作成・学習・同期）が動作

---

最終更新: 2026-02-25 (update-26)
