# Tests Organization

## Backend Tests (Python/pytest)

テストは `/tests/` ディレクトリに配置されています。

### テスト実行

```bash
# すべてのテストを実行
pytest

# 特定のテストファイルを実行
pytest tests/test_auth_api.py

# テストカバレッジを確認
pytest --cov=app
```

### テストデータの分離

- 全てのテストは一時ディレクトリを使用し、本番データを汚染しません
- `temp_data_dir` フィクスチャが自動的に一時ディレクトリをセットアップします
- テスト終了後、データは自動的にクリーンアップされます

### テストユーザーのクリーンアップ

万が一テストユーザーが残ってしまった場合:

```bash
python3 scripts/cleanup_test_users.py
```

このスクリプトは:
- `testuser_` で始まるユーザーを検出
- ユーザーデータと vault ディレクトリを削除
- 実ユーザーは保護されます

## Frontend Tests (TypeScript/Vitest)

テストは `/frontend/src/__tests__/` ディレクトリに整理されています。

```
frontend/src/__tests__/
├── api/           # API client tests
├── auth/          # Authentication tests
├── components/    # React component tests
└── utils/         # Utility function tests
```

### テスト実行

```bash
cd frontend

# 全テストを実行
npm test

# ウォッチモード
npm test

# カバレッジ付き
npm run test:coverage

# UI モード
npm run test:ui
```

### テストファイル命名規則

- テストファイル: `*.test.ts` または `*.test.tsx`
- setupファイル: `src/test/setup.ts`

## テストのベストプラクティス

### Backend

1. **フィクスチャの使用**
   - `client`: HTTPクライアント (一時データディレクトリ付き)
   - `authenticated_client`: 認証済みクライアント (自動クリーンアップ)
   - `unique_username`: 一意なテストユーザー名生成

2. **データ分離**
   - 全テストが独立した一時ディレクトリを使用
   - テスト間でデータが共有されない

3. **クリーンアップ**
   - `authenticated_client` は自動的にユーザーを削除
   - 一時ディレクトリは自動的に削除

### Frontend

1. **モックの使用**
   - API呼び出しはモック化
   - `vi.mock()` でモジュールをモック

2. **コンポーネントテスト**
   - `render()` でコンポーネントをレンダリング
   - `screen` でDOM要素を検索
   - `fireEvent` でユーザーインタラクションをシミュレート

3. **非同期テスト**
   - `waitFor()` で非同期処理を待機
   - `async/await` を使用

## トラブルシューティング

### テストユーザーが残っている

```bash
python3 scripts/cleanup_test_users.py
```

### フロントエンドテストが失敗する

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm test
```

### バックエンドテストが実データを使用している

- `temp_data_dir` フィクスチャを使用しているか確認
- 環境変数 `VOCAB_DATA_DIR` が設定されていないか確認

## CI/CD

テストはGitHub Actionsで自動実行されます:

- プッシュ時: 全テスト実行
- プルリクエスト時: 変更箇所のテスト実行
- カバレッジレポートを自動生成
