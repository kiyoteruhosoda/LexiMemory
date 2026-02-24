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
- M3: `packages/core` 相当へのドメインロジック再配置
- M4: `apps/mobile`(Expo) 追加と共通UI再利用
