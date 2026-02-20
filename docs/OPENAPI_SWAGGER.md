# OpenAPI + Swagger ドキュメント

LinguisticNode API は、OpenAPI 3.0 仕様に対応しており、自動生成される Swagger UI と ReDoc で対話的に API を探索・テストできます。

## アクセス方法

運用環境でサーバーが起動している場合、以下のエンドポイントでドキュメントにアクセスできます：

- **Swagger UI（対話型）**: `http://localhost:8000/docs`
- **ReDoc（読取専用）**: `http://localhost:8000/redoc`
- **OpenAPI スキーマ（JSON）**: `http://localhost:8000/openapi.json`
- **OpenAPI スキーマ（YAML）**: `http://localhost:8000/openapi.yaml`（設定により有効化可能）

## API スキーマ概要

### 基本情報

- **Title**: LinguisticNode API
- **Version**: 0.1.0
- **Description**: 間隔反復法（FSRS アルゴリズム）を使用した語彙学習アプリケーション

### セキュリティスキーム

#### HTTPBearer（JWT Bearer Token）
- **タイプ**: HTTP Bearer
- **用途**: リクエストヘッダー `Authorization: Bearer <access_token>` で認証
- **取得方法**: `/api/auth/login` エンドポイントでログイン時に取得

#### RefreshCookie（リフレッシュトークン）
- **タイプ**: HttpOnly Cookie
- **名前**: `refresh_token`
- **用途**: `/api/auth/refresh` エンドポイントでアクセストークンをリフレッシュ
- **特性**: JavaScript からアクセス不可（XSS 保護）、HTTPS のみ送信（本番環境）

## タグ別 API ドキュメント

### 1. 認証 (auth)

ユーザー認証とトークン管理に関するエンドポイント。

**エンドポイント:**
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/refresh` - アクセストークンリフレッシュ
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得
- `DELETE /api/auth/me` - アカウント削除

**認証フロー:**
```
1. サインアップ: POST /api/auth/register
2. ログイン: POST /api/auth/login → access_token (body) + refresh_token (cookie)
3. リクエスト: Authorization Header に access_token を使用
4. リフレッシュ: POST /api/auth/refresh → 新しい access_token を取得
5. ログアウト: POST /api/auth/logout → トークン無効化
```

### 2. 単語管理 (words)

語彙データの CRUD 操作。

**エンドポイント:**
- `GET /api/words` - 単語一覧（フィルター機能あり）
- `POST /api/words` - 新規単語追加
- `PUT /api/words/{wordId}` - 単語更新
- `DELETE /api/words/{wordId}` - 単語削除

**フィルターパラメータ:**
- `q`: キーワード検索（英単語or日本語意味）
- `pos`: 品詞フィルター（noun/verb/adj/adv/prep/conj/pron/det/interj/other）

### 3. スタディセッション (study)

間隔反復学習セッション管理。FSRS（Free Spaced Repetition Scheduler）アルゴリズムを使用。

**エンドポイント:**
- `GET /api/study/next` - 次の学習カードを取得
- `POST /api/study/grade` - 復習結果を記録
- `POST /api/study/reset/{wordId}` - 単語の学習状態をリセット

**レーティングオプション:**
- `again` - 忘れた
- `hard` - 難しい
- `good` - 正解
- `easy` - 簡単

### 4. インポート/エクスポート (io)

データのバックアップと復元、マイグレーションなど。

**エンドポイント:**
- `GET /api/io/export` - 全データをエクスポート
- `POST /api/io/import` - データをインポート

**インポートモード:**
- `merge` - 既存データに新規データを追加（デフォルト）
- `overwrite` - 既存データを上書き置換

### 5. クライアントログ (logs)

フロントエンドからサーバーへのログ送信。

**エンドポイント:**
- `POST /api/logs/client` - クライアントログを送信（認証不要）

## エラーレスポンス形式

すべてのエラーレスポンスは統一フォーマットで返されます：

```json
{
  "error": {
    "error_code": "ERROR_CODE",
    "message": "Human readable message",
    "message_key": "i18n.message.key",
    "request_id": "req-unique-id",
    "details": null
  }
}
```

### エラーコード一覧

| ステータス | エラーコード | 説明 |
|-----------|------------|------|
| 400 | BAD_REQUEST | 不正なリクエスト |
| 401 | UNAUTHORIZED | 認証失敗 |
| 401 | AUTH_INVALID | 認証情報が無効 |
| 401 | REFRESH_INVALID | リフレッシュトークンが無効 |
| 401 | REFRESH_REUSED | リフレッシュトークンの再利用（セキュリティ検出） |
| 401 | REFRESH_MISSING | リフレッシュトークンが見つかりません |
| 403 | FORBIDDEN | アクセス禁止 |
| 404 | NOT_FOUND | リソースが見つかりません |
| 409 | CONFLICT | リソース競合（例：ユーザー重複） |
| 422 | VALIDATION_ERROR | バリデーションエラー |
| 500 | INTERNAL_ERROR | サーバーエラー |

## データモデル

詳細なデータモデルの定義は Swagger UI で確認できます。主要なモデル：

### WordEntry

```json
{
  "id": "uuid",
  "headword": "単語",
  "pronunciation": "パ|記号（オプション）",
  "pos": "品詞",
  "meaningJa": "日本語意味",
  "examples": [
    {
      "id": "uuid",
      "en": "English sentence",
      "ja": "日本語文（オプション）",
      "source": "出典（オプション）"
    }
  ],
  "tags": ["タグ1", "タグ2"],
  "memo": "メモ（オプション）",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### MemoryState

```json
{
  "wordId": "単語ID",
  "dueAt": "次回復習予定時刻",
  "lastRating": "again/hard/good/easy",
  "lastReviewedAt": "最終復習日時",
  "memoryLevel": 0,
  "ease": 2.5,
  "intervalDays": 1,
  "reviewCount": 0,
  "lapseCount": 0
}
```

## 開発環境での使用

### サーバー起動

```bash
cd /work/project/03.LexiMemory
export VOCAB_APP_VERSION=0.1.0
export VOCAB_WEB_ORIGIN=http://localhost:8080
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Swagger UI でのテスト

1. `http://localhost:8000/docs` にアクセス
2. Authorize（鍵アイコン）をクリック
3. JWT トークンを入力（登録・ログイン後に取得）
4. エンドポイントの「Try it out」ボタンでリクエストを送信

### cURL でのテスト

```bash
# 登録
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123"}'

# ログイン
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123"}' \
  -c cookies.txt

# 認証付きリクエスト
curl -X GET "http://localhost:8000/api/words" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# リフレッシュ
curl -X POST "http://localhost:8000/api/auth/refresh" \
  -b cookies.txt
```

## クライアント統合

### JavaScript（fetch API）

```javascript
// ログイン
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // Cookies を含める
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { access_token } = await loginRes.json();
localStorage.setItem('accessToken', access_token);

// 以降のリクエスト
const wordsRes = await fetch('/api/words', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
});
```

### TypeScript（生成コード）

OpenAPI スキーマから TypeScript クライアントを生成できます：

```bash
# openapi-generator を使用
openapi-generator generate -i http://localhost:8000/openapi.json \
  -g typescript-fetch -o ./generated-client

# または swagger-codegen
swagger-codegen generate -i http://localhost:8000/openapi.json \
  -l typescript-fetch -o ./generated-client
```

## セキュリティに関する注意

1. **本番環境での HTTPS 使用**: `VOCAB_COOKIE_SECURE=true` に設定
2. **CSRF 保護**: `SameSite=Lax` で設定
3. **XSS 保護**: リフレッシュトークンは HttpOnly Cookie で保存
4. **トークン期限**: アクセストークン（短期）+ リフレッシュトークン（長期）の組み合わせ
5. **リプレイ攻撃対策**: リフレッシュトークン使用時に新規トークンを発行（回転）

## トラブルシューティング

### Token 検証エラー

```
error_code: "UNAUTHORIZED"
```

- JWT トークンの有効期限を確認
- `/api/auth/refresh` でトークンをリフレッシュ

### CORS エラー

- `VOCAB_WEB_ORIGIN` 環境変数を確認
- `http://localhost:8000` では `http://localhost:8080` からのリクエストを許可

### Cookie が設定されていない

- ブラウザの開発者ツールでクッキーを確認
- `credentials: 'include'` をfetch リクエストに設定

## 参考資料

- [OpenAPI 3.0 仕様](https://spec.openapis.org/oas/v3.0.3)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [Pydantic ドキュメント](https://docs.pydantic.dev/)
- [FSRS アルゴリズム](https://github.com/open-spaced-repetition/fsrs.js)
