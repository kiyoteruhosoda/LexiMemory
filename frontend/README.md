# Frontend (React + TypeScript + Vite)

## 現状のCI相当コマンド

- `npm run dev`: 開発サーバー
- `npm run build`: TypeScriptビルド + Vite build
- `npm run preview`: build成果物のプレビュー
- `npm run lint`: ESLint
- `npm run test`: Vitest
- `npm run test:coverage`: Vitest coverage
- `npm run typecheck`: 型チェック（`tsc -b`）
- `npm run test:e2e`: Playwright E2E（smoke + visual）
- `npm run test:e2e:smoke`: Playwright smoke（ログイン前導線 + RNW PoC導線）
- `npm run test:e2e:visual`: Visual regressionのみ実行（`RUN_VISUAL_REGRESSION=1`）
- `npm run test:e2e:update`: Playwrightスクリーンショットのベースライン更新
- `npm run test:e2e:firefox`: Firefoxプロジェクトのみ実行

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

- `e2e/specs/smoke.spec.ts`
  - ログイン前の主要導線（`/login`→`/words`）の導通を確認
- `e2e/specs/ui-regression.spec.ts`
  - `toHaveScreenshot` を使用した visual regression
  - まずは `/login` と `/words` の2画面を固定
  - `RUN_VISUAL_REGRESSION=1` のときのみ実行（バイナリ非コミット運用）
- 実行先URLは `PLAYWRIGHT_BASE_URL` で上書き可能（デフォルト: `http://localhost:${PLAYWRIGHT_WEB_PORT:-4173}`）
- 安定化施策
  - viewport固定
  - タイムゾーン/ロケール固定
  - アニメーション無効化
  - 時刻/乱数固定（init script）

## RNW段階移行に向けた現状

- Storage直叩きを抽象化（`src/core/storage` + `packages/core`）
- タグフィルタ永続化をドメインサービス化（`src/core/tagFilter`）
- WordユースケースをApplication Service化（`src/core/word/wordApplicationService.ts`）
  - Port: `src/core/word/wordGateway.ts`
  - Adapter: `src/word/wordGatewayAdapter.ts`
  - `WordListPage` / `WordCreatePage` / `WordDetailPage` が service 経由でユースケースを実行
- Study/ExamplesユースケースをApplication Service化
  - Study: `src/core/study/*` + `src/study/studyGatewayAdapter.ts`
  - Examples: `src/core/examples/*` + `src/examples/examplesGatewayAdapter.ts`
  - `StudyPage` / `ExamplesTestPage` が service 経由でユースケースを実行
- RNW移行PoC
  - `react-native` + `react-native-web` を導入
  - `packages/ui` にRNコンポーネントの共通部品を新設（`RnwSurfaceCard`）
  - `LoginPage` のカードを `@leximemory/ui` から参照して描画
  - 既存UIは当面 `src/rnw/react-native.tsx` の互換レイヤーを併用して段階置換

## ディレクトリ方針（段階的ワークスペース）

- `src/`: 既存Web UI（当面維持）
- `packages/core`: UI非依存のPort/ドメイン共有コード
- `packages/ui`: RN/RNWで再利用するUIコンポーネント
- 将来: `apps/web`, `apps/mobile` へ再配置予定

## RNW移行の進捗管理

- 詳細な完了までのチェックリストは `plan.md` を参照してください。
