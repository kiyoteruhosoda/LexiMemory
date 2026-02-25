# RNW Migration Plan

## Rules

1. 新規UIは原則 `src/rnw` 配下のコンポーネント経由で実装する。
2. 既存UIは、機能改修タイミングで段階的にRN化する。
3. Web固有最適化が必要なUIは `.web.tsx` / `.native.tsx` の分離を許容する。
4. ビジネスロジックは `src/core` に寄せ、UI層から分離する。
5. 永続化は `src/core/storage` 経由でアクセスし、UIから実装詳細を隠蔽する。

## Prioritized screens

1. **WordList (`/words`)**
   - 理由: 主要導線で利用頻度が高く、ボタンやリストなど共通UIへ分解しやすい。
   - 工数: 1.5〜2.5日
2. **Study (`/study`)**
   - 理由: カードUI/CTAが中心でモバイル価値が高い。
   - 工数: 2〜3日
3. **Examples (`/examples`)**
   - 理由: 入力/フィルタ/音声操作の組み合わせ検証に有効。
   - 工数: 2〜3日
4. **Word detail/create**
   - 理由: フォームやバリデーション共通化の効果が大きい。
   - 工数: 3〜4日

## Incremental milestones

- M1: Storage abstraction + visual regression guard（完了）
- M2: RN component boundary + first component adoption（完了）
- M2.1: `/words` 検索フォームを RNW Form primitive (`RnwSearchPanel`) へ置換（完了）
- M2.2: RNW shim (`Pressable`) の押下状態/disabled挙動をテストで固定（完了）
- M2.3: `/words` 一覧テーブルを RNW List primitive (`RnwWordListTable`) へ置換（完了）
- M2.4: `react-native` + `react-native-web` 導入と `react-native` alias 解決（完了）
- M2.5: `/study` の tag filter toolbar を RNW primitives (`RnwTagFilterPanel`) へ置換（完了）
- M2.6: RNW PoCのcomponent-level visual regressionを追加（`/words` action row screenshot 固定）（完了）
- M2.7: visual assertionを `visualAssertion` に共通化し、page/locator screenshot をポリモーフィック実行（完了）
- M2.8: smoke test にRNW action row遷移シナリオを追加（完了）
- M3: `packages/core` 相当へのドメインロジック再配置（Storage Portを先行導入済み）
- M3.1: `packages/ui` へRNW共通部品を抽出（`RnwSurfaceCard` を Loginへ適用）
- M3.2: Word系ページを `core/word` application service + gateway adapter 経由へ整理
- M3.3: Study/Examples ページを `core/study`, `core/examples` usecase + adapter 経由へ整理
- M3.4: Word create/detail のページヘッダー/CTA を `packages/ui` primitive へ置換
- M3.5: Storage runtime selector (`createStorageAdapter`) を導入し、Web/Native差し替えポイントを明示（完了）
- M3.6: Syncバックアップの保持ポリシーを `core/sync/VocabBackupService` へ抽出し、Storage/Clock Portでテスト可能化（完了）
- M3.7: `RnwActionBar` を `packages/ui` に追加し、Study/Examples のヘッダー導線を共通化（完了）
- M3.8: `ExamplesTestPage` の tag filter panel / notice を RNW primitives へ置換（完了）
- M3.9: visual regression 対象へ `/examples` を追加（完了）
- M3.12: visual regression 対象へ `/study` を追加（完了）
- M3.14: tag filter hydration時の保存制御を追加し、初期化時の誤上書きを防止（完了）
- M3.16: `WordDetailPage` のreset完了通知を RNW notice 化しWeb依存 alert を排除（完了）
- M3.17: `wordDraftPolicy` を導入し、WordFormの保存データ整形ロジックをUIから分離（完了）
- M3.18: `ExampleIdGenerator` ポートを導入し、example id採番の実装差し替えポイントを明示（完了）
- M3.19: `speechApplicationService` + `speechGateway` を導入し、音声読み上げロジックをUIから分離（完了）
- M3.20: `webSpeechGateway` / `noopSpeechGateway` を追加し、実行環境ごとの音声実装をポリモーフィックに切替（完了）
- M3.21: `backupExportService` + `fileDownloadGateway` を導入し、WordList exportロジックをUIから分離（完了）
- M3.22: `browserFileDownloadGateway` と `systemUtcClock` を追加し、I/Oと時刻依存をポート注入化（完了）
- M3.23: `apps/web` / `apps/mobile` のscaffoldを追加し、モノレポ移行シームを作成（完了）
- M3.24: Storage Portに `native-async` / `native-sqlite` adapter factory を追加（完了）
- M3.15: `exampleSentencePolicy` を導入し、Examplesの文処理ロジックをUIから分離（完了）
- M3.13: `useTagFilterState` hook を導入し、Study/Examples のタグ状態管理を再利用化（完了）
- M3.11: `WordDetailPage` の destructive actions を `RnwActionGroup` へ統合（完了）
- M3.10: `tagFilterSelectionPolicy` を導入し、Study/Examples の選択ロジックをUIから分離（完了）
- M4: `apps/mobile`(Expo) 追加と共通UI再利用


## Suggested PR split

1. **PR-1: Baseline & quality gates**
   - READMEにCI相当コマンド/ルーティング/主要画面を明文化
   - Playwright smoke + screenshot regressionを固定化
2. **PR-2: Storage abstraction**
   - `StorageAdapter`境界を統一
   - `localStorage`依存箇所をアダプタ経由に寄せる
3. **PR-3: Core domain extraction**
   - タグフィルタ等のユースケースを`src/core`へ集約
   - UIはポート(interface)のみ依存
4. **PR-4: RNW component PoC**
   - ボタン/Cardなど小さいUIのみRNW境界へ置換
   - 見た目同等性をvisual regressionで担保
5. **PR-5: Screen-by-screen migration**
   - `/words`→`/study`→`/examples`の順で段階移行
