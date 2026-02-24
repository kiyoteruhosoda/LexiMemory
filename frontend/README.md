# Frontend (React + TypeScript + Vite)

## 現状のCI相当コマンド

- `npm run dev`: 開発サーバー
- `npm run build`: TypeScriptビルド + Vite build
- `npm run preview`: build成果物のプレビュー
- `npm run lint`: ESLint
- `npm run test`: Vitest
- `npm run test:coverage`: Vitest coverage
- `npm run test:e2e`: Playwright E2E（visual regression含む）
- `npm run test:e2e:update`: Playwrightスクリーンショットのベースライン更新
- `npm run typecheck`: 型チェック（`tsc -b`）

## ルーティング方式

- Router: `react-router-dom` の `BrowserRouter`。
- エントリ: `src/App.tsx`。
- 初期遷移: `/` は `/words` へリダイレクト。

## 主要画面一覧

- `/login`: ログイン/ユーザー登録
- `/words`: 単語一覧（トップ相当）
- `/words/create`: 単語作成
- `/words/:id`: 単語詳細
- `/study`: 学習画面
- `/examples`: 例文テスト画面

## UIリグレッションテスト

- `e2e/specs/ui-regression.spec.ts`
  - `toHaveScreenshot` を使用し、`/words` と `/login` を desktop/mobile で比較
- `e2e/specs/smoke.spec.ts`
  - ログイン前の主要導線（`/login`→`/words`）の導通を確認
- 安定化施策
  - viewport固定
  - タイムゾーン/ロケール固定
  - アニメーション無効化
  - 時刻/乱数固定（init script）

## RNW段階移行に向けた現状

- Storage直叩きを抽象化（`src/core/storage`）
- タグフィルタ永続化をドメインサービス化（`src/core/tagFilter`）
- RNW移行PoCとして、RN風UIコンポーネント境界（`src/rnw`）を導入
  - 現在はWeb互換アダプタで稼働
  - 将来 `react-native`/`react-native-web` 実装に差し替え予定
