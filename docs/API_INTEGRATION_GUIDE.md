# API 統合ガイド

LexiMemory API との統合方法を詳説します。

## クイックスタート

### 1. 認証フロー

```typescript
// ユーザー登録
async function register(username: string, password: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

// ログイン
async function login(username: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include', // Cookie を送受信
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  localStorage.setItem('accessToken', data.access_token);
  return data;
}

// トークンリフレッシュ
async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  const data = await response.json();
  localStorage.setItem('accessToken', data.access_token);
  return data.access_token;
}
```

### 2. API リクエストユーティリティ

```typescript
// Bearer トークン付きリクエスト送信
async function apiRequest(
  endpoint: string,
  method: string = 'GET',
  body: any = null
) {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(endpoint, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : null
  });
  
  // 401 Unauthorized の場合、トークンをリフレッシュして再試行
  if (response.status === 401) {
    try {
      const newToken = await refreshToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      
      return fetch(endpoint, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : null
      });
    } catch (e) {
      // リフレッシュ失敗 → ログイン画面へ
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  return response.json();
}
```

### 3. 単語管理

```typescript
// 単語を追加
async function addWord(word: {
  headword: string;
  pos: string;
  meaningJa: string;
  pronunciation?: string;
  examples?: Array<{ en: string; ja?: string; source?: string }>;
  tags?: string[];
  memo?: string;
}) {
  return apiRequest('/api/words', 'POST', word);
}

// 単語を検索
async function searchWords(query?: string, pos?: string) {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (pos) params.append('pos', pos);
  
  return apiRequest(`/api/words?${params.toString()}`);
}

// 単語を更新
async function updateWord(wordId: string, updates: Partial<WordEntry>) {
  return apiRequest(`/api/words/${wordId}`, 'PUT', updates);
}

// 単語を削除
async function deleteWord(wordId: string) {
  return apiRequest(`/api/words/${wordId}`, 'DELETE');
}
```

### 4. スタディセッション

```typescript
// 次の学習カードを取得
async function getNextCard() {
  const response = await apiRequest('/api/study/next');
  // response.card = null または { word, memory }
  return response.card;
}

// 復習結果を記録
async function submitGrade(wordId: string, rating: 'again' | 'hard' | 'good' | 'easy') {
  return apiRequest('/api/study/grade', 'POST', {
    wordId,
    rating
  });
}

// 学習状態をリセット
async function resetWordMemory(wordId: string) {
  return apiRequest(`/api/study/reset/${wordId}`, 'POST');
}
```

### 5. データ управImpExport

```typescript
// データをエクスポート
async function exportData() {
  return apiRequest('/api/io/export');
}

// データをインポート
async function importData(
  appData: AppData,
  mode: 'merge' | 'overwrite' = 'merge'
) {
  const params = new URLSearchParams({ mode });
  return apiRequest(`/api/io/import?${params.toString()}`, 'POST', appData);
}
```

### 6. クライアントログ送信

```typescript
interface ClientLogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  userId?: string;
  extra?: Record<string, any>;
}

async function sendLogs(logs: ClientLogEntry[]) {
  // ログ送信は認証不要
  const response = await fetch('/api/logs/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs })
  });
  return response.json();
}
```

## エラーハンドリング

```typescript
interface ApiError {
  error: {
    error_code: string;
    message: string;
    message_key?: string;
    request_id?: string;
    details?: any;
  };
}

async function handleApiError(response: Response) {
  if (response.status === 401) {
    // 認証失敗 → ログイン画面へ
    window.location.href = '/login';
  } else if (response.status === 422) {
    // バリデーションエラー → フォーム表示
    const error: ApiError = await response.json();
    console.error('Validation error:', error.error.details);
  } else if (response.status >= 500) {
    // サーバーエラー → 再試行可能
    throw new Error('Server error, please try again later');
  }
  
  const error: ApiError = await response.json();
  throw new Error(error.error.message);
}
```

## React コンポーネント例

```typescript
import { useState, useEffect } from 'react';

export function StudyComponent() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNextCard();
  }, []);

  async function loadNextCard() {
    setLoading(true);
    try {
      const result = await getNextCard();
      setCard(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitGrade(rating: string) {
    try {
      await submitGrade(card.word.id, rating);
      await loadNextCard(); // 次のカードを読み込む
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!card) return <div>No words to study</div>;

  return (
    <div className="card">
      <h2>{card.word.headword}</h2>
      <p>{card.word.meaningJa}</p>
      <div className="buttons">
        <button onClick={() => handleSubmitGrade('again')}>Again</button>
        <button onClick={() => handleSubmitGrade('hard')}>Hard</button>
        <button onClick={() => handleSubmitGrade('good')}>Good</button>
        <button onClick={() => handleSubmitGrade('easy')}>Easy</button>
      </div>
    </div>
  );
}
```

## Vue.js 3 コンポーネント例

```vue
<template>
  <div class="study-container">
    <div v-if="loading" class="spinner">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="currentCard" class="card">
      <h2>{{ currentCard.word.headword }}</h2>
      <p>{{ currentCard.word.meaningJa }}</p>
      <div class="buttons">
        <button 
          v-for="grade in ['again', 'hard', 'good', 'easy']"
          :key="grade"
          @click="submitGrade(grade)"
        >
          {{ grade }}
        </button>
      </div>
    </div>
    <div v-else class="no-cards">No words to study</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const currentCard = ref(null);
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  await loadNextCard();
});

async function loadNextCard() {
  loading.value = true;
  try {
    currentCard.value = await getNextCard();
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
}

async function submitGrade(rating: string) {
  try {
    await submitGrade(currentCard.value.word.id, rating);
    await loadNextCard();
  } catch (err) {
    error.value = (err as Error).message;
  }
}
</script>
```

## バッチリクエスト（複数単語追加）

```typescript
async function addMultipleWords(words: WordEntry[]) {
  const results = await Promise.allSettled(
    words.map(word => addWord(word))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`Added ${succeeded.length} words, ${failed.length} failed`);
  return { succeeded, failed };
}
```

## レート制限対応

```typescript
class RateLimitedClient {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval = 100; // 100ms

  async request<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(() => fn().then(resolve).catch(reject));
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.minInterval - timeSinceLastRequest);

    setTimeout(() => {
      const fn = this.requestQueue.shift();
      if (fn) fn();
      this.lastRequestTime = Date.now();
      this.isProcessing = false;
      this.processQueue();
    }, delay);
  }
}

const client = new RateLimitedClient();

// 使用例
for (const word of wordsToAdd) {
  await client.request(() => addWord(word));
}
```

## オフライン対応時のキャッシング

```typescript
class CachedApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheValidityMs = 5 * 60 * 1000; // 5分

  async getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheValidityMs) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      // キャッシュが存在すればそれを使用
      if (cached) return cached.data;
      throw err;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

const client = new CachedApiClient();

// 使用例
const words = await client.getCachedOrFetch('words', () =>
  apiRequest('/api/words')
);
```

## 型定義（TypeScript）

Swagger UI または OpenAPI スキーマから自動生成可能。以下は手動定義の例：

```typescript
export interface WordEntry {
  id: string;
  headword: string;
  pronunciation?: string;
  pos: 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'conj' | 'pron' | 'det' | 'interj' | 'other';
  meaningJa: string;
  examples: ExampleSentence[];
  tags: string[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExampleSentence {
  id: string;
  en: string;
  ja?: string;
  source?: string;
}

export interface MemoryState {
  wordId: string;
  dueAt: string;
  lastRating?: 'again' | 'hard' | 'good' | 'easy';
  lastReviewedAt?: string;
  memoryLevel: number;
  ease: number;
  intervalDays: number;
  reviewCount: number;
  lapseCount: number;
}

export interface AppData {
  schemaVersion: number;
  exportedAt: string;
  words: WordEntry[];
  memory: MemoryState[];
}

export interface ApiError {
  error: {
    error_code: string;
    message: string;
    message_key?: string;
    request_id?: string;
    details?: Record<string, any>;
  };
}
```

## テスト例（Jest）

```typescript
jest.mock('fetch');

describe('API Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should login and store access token', async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/login')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: 'test-token',
              token_type: 'Bearer',
              expires_in: 3600
            })
          )
        );
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    await login('user', 'pass');

    expect(localStorage.getItem('accessToken')).toBe('test-token');
  });

  test('should handle 401 and retry with refreshed token', async () => {
    let requestCount = 0;
    global.fetch = jest.fn((url) => {
      if (url.includes('/words')) {
        requestCount++;
        if (requestCount === 1) {
          return Promise.resolve(new Response('', { status: 401 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true, words: [] }))
        );
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    localStorage.setItem('accessToken', 'old-token');

    // 実装により検証
  });
});
```
