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
- M3: `packages/core` 相当へのドメインロジック再配置
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
