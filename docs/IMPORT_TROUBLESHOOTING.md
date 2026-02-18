# インポートのトラブルシューティング

インポート後にリストに単語が増えないという問題が発生した場合、以下の手順で診断してください。

## 確認ステップ

### 1. ブラウザのネットワークタブで確認

1. **F12** キーを押して開発者ツールを開く
2. **Network** タブをクリック
3. UIからインポートを実行
4. リストに `POST /api/io/import` というリクエストが表示されることを確認

### 2. 詳細を確認

**Request (リクエスト):**
- **Status**: 200 であることを確認 ✅
- **Headers**: `Authorization: Bearer ...` が設定されていることを確認
- **Request Body**: JSON ボディが送信されていることを確認
  ```json
  {
    "schemaVersion": 1,
    "words": [
      {
        "headword": "...",
        "pos": "...",
        "meaningJa": "..."
      }
    ]
  }
  ```

**Response (レスポンス):**
- `{"ok": true}` が返されていることを確認 ✅

### 3. インポート後のリスト更新を確認

1. インポート後に `GET /api/words` リクエストが送信されることを確認
2. レスポンスボディでインポートした単語が含まれているか確認

## よくある問題

### 問題1: ファイルが読み込まれていない
**症状**: インポートボタンをクリックしても何も起こらない  
**原因**: ブラウザがファイルダイアログを表示していない可能性  
**解決**: ブラウザのコンソール (F12 → Console) を見てエラーメッセージを確認

### 問題2: status 401 エラー
**症状**: `POST /api/io/import` が 401 Unauthorized を返す  
**原因**: セッションが有効期限切れの可能性  
**解決**: ページを再読み込み (Ctrl+R) して再度ログイン

### 問題3: status 422 エラー
**症状**: `POST /api/io/import` が 422 Unprocessable Entity を返す  
**原因**: インポートファイルのフォーマットが不正  
**解決**: 以下を確認してください：
- ファイルは有効な JSON 形式ですか？
- `schemaVersion: 1` が含まれていますか？
- 単語に `headword`, `pos`, `meaningJa` が含まれていますか？

**正しいフォーマット例:**
```json
{
  "schemaVersion": 1,
  "words": [
    {
      "headword": "example",
      "pos": "noun",
      "meaningJa": "例"
    }
  ]
}
```

### 問題4: インポート成功（status 200）だが単語が増えていない

#### 原因1: IDが既存の単語と重複している
インポートしたファイルに `"id"` フィールドがあり、既存の単語と同じIDの場合、**マージ**されます。
- **同じIDで古いタイムスタンプ** → 既存データが保持される（インポートされない）
- **同じIDで新しいタイムスタンプ** → 既存データが上書きされる

**解決**: IDを省略するか、新しいファイルから生成される自動IDを使用

```json
{
  "schemaVersion": 1,
  "words": [
    {
      "headword": "unique",
      "pos": "verb",
      "meaningJa": "独特の"
      // "id" を含めないと自動生成される
    }
  ]
}
```

#### 原因2: ブラウザキャッシュ
UIが古いデータをキャッシュしている可能性  
**解決**: 
- キャッシュをクリア: Ctrl+Shift+Delete
- または別のブラウザタブで確認
- または `Ctrl+R` で強制再読み込み

#### 原因3: メモリーステートのみをインポート
`words` 配列が空で、`memory` 配列にメモリーステートをインポートした場合、新しい単語は追加されません。既存の単語のメモリーステートのみが更新されます。

**確認方法**:
- インポートファイルの `"words"` 配列に要素があるか確認

### 問題5: ブラウザのコンソールにエラーがある
**確認方法**:
1. F12 を押して開発者ツールを開く
2. **Console** タブをクリック
3. 赤いエラーメッセージがあれば スクリーンショットを取る

## 高度なトラブルシューティング

### サーバーログを確認
アプリケーションログで詳細なデバッグ情報を確認できます：

```bash
# インポート処理のログ（最新：data/logs/下にある）
tail -f data/logs/*.log | grep -i import
```

期待される成功ログ:
```json
{
  "level": "INFO",
  "logger": "app.service.import",
  "msg": "Merge results: added 1 words, updated 0 words, ..."
}
```

### 手動テスト
curl コマンドで API を直接テストできます：

```bash
# ログインしてトークンを取得
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' \
  | jq -r '.access_token')

# インポートを実行
curl -X POST http://localhost:8000/api/io/import?mode=merge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schemaVersion": 1,
    "words": [{"headword": "test", "pos": "noun", "meaningJa": "テスト"}]
  }'

# 単語一覧を確認
curl http://localhost:8000/api/words \
  -H "Authorization: Bearer $TOKEN" | jq '.words | length'
```

## 問い合わせ前に確認

下記の情報があると問題解決がスムーズです：
1. ブラウザ開発者ツール (Network タブ) のスクリーンショット
2. インポートしたファイル内容（個人情報は削除）
3. エラーメッセージの全文
4. ブラウザの種類バージョン (Chrome, Firefox など)
5. アプリケーションLOG ファイル（最終部分） 

## 参考資料

- [Import/Export ドキュメント](../readme.md#importexport)
- [API ドキュメント](./OPENAPI_SWAGGER.md)
