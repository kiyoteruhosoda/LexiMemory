# 記憶レベル仕様

LexiMemoryの記憶レベルシステムは、**SM-2（SuperMemo-2）アルゴリズムの改良版**に基づいて設計されています。

---

## 目次

1. [概要](#概要)
2. [MemoryState データモデル](#memorystate-データモデル)
3. [記憶レベル（0-5）](#記憶レベル0-5)
4. [評価システム](#評価システム)
5. [復習スケジュール計算](#復習スケジュール計算)
6. [フロントエンド表示](#フロントエンド表示)
7. [StudyFlow](#studyflow)
8. [定着判定](#定着判定)
9. [リセット機能](#リセット機能)

---

## 概要

記憶レベルは、ユーザーがどのくらい単語を習得しているかを **0〜5** の6段階で管理します。

- **Lv 0**: 未学習 / リセット状態
- **Lv 1-3**: 学習中
- **Lv 4-5**: 定着状態

各単語につき、`MemoryState` というオブジェクトで以下を追跡します：
- 現在のレベル
- イージネス係数（復習難度）
- 復習間隔（日数）
- 次の復習時刻

---

## MemoryState データモデル

### Python モデル（`app/models.py`）

```python
class MemoryState(BaseModel):
    wordId: str
    dueAt: str                                    # ISO形式の次復習時刻
    lastRating: Optional[Rating] = None           # 最後の評価
    lastReviewedAt: Optional[str] = None          # 最後の復習時刻
    memoryLevel: int = 0                          # 0-5
    ease: float = 2.5                             # イージネス係数（初期値2.5）
    intervalDays: int = 0                         # 復習間隔（日数）
    reviewCount: int = 0                          # 総復習回数
    lapseCount: int = 0                           # 失敗（"again"評価）回数
```

### TypeScript インターフェース（`frontend/src/api/types.ts`）

```typescript
export interface MemoryState {
  wordId: string;
  memoryLevel: number;                           // 0-5
  ease: number;
  intervalDays: number;
  dueAt: string;
  lastRating?: Rating | null;                    // "again" | "hard" | "good" | "easy"
  lastReviewedAt?: string | null;
  lapseCount: number;
  reviewCount: number;
}
```

---

## 記憶レベル（0-5）

| Lv | 状態 | 含義 | 表示色 | 進行 |
|---|---|---|---|---|
| **0** | 未学習 | 復習未実施またはリセット | `secondary` | 新規登録時の初期状態 |
| **1** | 初期学習 | 1回以上復習、定着途上 | `warning` | 学習開始（any評価で+1可）|
| **2** | 学習中 | 基本的な習得 | `primary` | 順調に進行 |
| **3** | 学習中 | 強化段階 | `primary` | 定着が近い |
| **4** | **定着** ✓ | ほぼ覚えた | `success` | 定着レベル |
| **5** | **定着** ✓ | 完全習得 | `success` | 最高レベル |

### レベル遷移ルール

**各評価による `memoryLevel` の変化：**

| 評価 | 処理 | レベル変化 |
|---|---|---|
| **again** | 忘れた | `max(0, Lv - 1)` ：1段階低下 |
| **hard** | 難しい | 変わらず（ease係数のみ低下） |
| **good** | 良好 | `min(5, Lv + 1)` ：1段階上昇 |
| **easy** | 簡単 | `min(5, Lv + 1)` ：1段階上昇 + ease上昇後interval延長 |

---

## 評価システム

### Rating 型定義

```typescript
type Rating = "again" | "hard" | "good" | "easy";
```

### 各評価の詳細

#### 1. **again** - 忘れた

```
memoryLevel: max(0, current - 1)  # 1段階ダウン
ease: max(1.3, ease - 0.2)        # 大幅低下
intervalDays: 0                    # リセット
lapseCount += 1                    # 失敗カウント増
dueAt: now + 10分                  # すぐに再出題（当日中）
```

**用途**: ユーザーが単語を完全に忘れた場合。レベルを0に戻す可能性あり。

#### 2. **hard** - 難しい

```
memoryLevel: 変わらず              # レベル維持
ease: max(1.3, ease - 0.05)        # 小幅低下
intervalDays: 減少（0.8倍程度）    # 復習間隔を短縮
dueAt: now + shortened interval
```

**用途**: ユーザーが難しいと感じたが、忘れてはいない場合。

#### 3. **good** - 良好

```
memoryLevel: min(5, current + 1)   # 1段階アップ
ease: 変わらず                      # 係数維持
intervalDays: _next_interval_days()  # 計算式に従う
dueAt: now + intervalDays
```

**用途**: ユーザーが適切に答えた通常の場合。

#### 4. **easy** - 簡単

```
memoryLevel: min(5, current + 1)   # 1段階アップ
ease: min(2.5, ease + 0.1)         # 上昇（最大2.5）
intervalDays: _next_interval_days() * 1.3  # 1.3倍延長
dueAt: now + extended interval
```

**用途**: ユーザーが非常に簡単に答えた場合。すぐに復習する必要がない。

---

## 復習スケジュール計算

### イージネス係数（Ease）

- **初期値**: 2.5
- **範囲**: 1.3 〜 2.5
- **更新**: 各評価で上下
  - `"again"` で `-0.2` → 最小1.3に制限
  - `"hard"` で `-0.05`
  - `"good"` で そのまま
  - `"easy"` で `+0.1` → 最大2.5に制限

**意味**: イージネス係数が高い → 復習間隔が長い（覚えやすい単語）

### 復習間隔計算（`_next_interval_days()`）

```python
def _next_interval_days(intervalDays: int, ease: float, reviewCount: int) -> int:
    if reviewCount == 0:
        return 1  # 1回目
    elif reviewCount == 1:
        return 3  # 2回目は3日後
    else:
        # 3回目以降
        base = intervalDays * ease
        return max(1, round(base))
```

**例**:
- 1回目復習: 1日後
- 2回目復習: 3日後（固定）
- 3回目復習以降: `前カ × ease係数`
  - ease=2.5（高） → 急速に間隔拡大
  - ease=1.3（低） → ゆっくり間隔拡大

---

## フロントエンド表示

### WordListPage での表示

```tsx
// memoryMap から current Lv を取得
const level = memoryMap[wordId]?.memoryLevel ?? 0;

// バッジで表示
<span className={`badge ${
  level >= 4 ? "text-bg-success" :      // 緑：定着
  level >= 2 ? "text-bg-primary" :      // 青：学習中
  level >= 1 ? "text-bg-warning" :      // 黄：初期学習
  "text-bg-secondary"                   // 灰：未学習
}`}>
  <i className="fa-solid fa-layer-group me-1" />
  Lv {level}
</span>
```

**表示例**:
- `Lv 0` → 灰色バッジ（未学習）
- `Lv 1` → 黄色バッジ（初期学習）
- `Lv 2-3` → 青色バッジ（学習中）
- `Lv 4-5` → 緑色バッジ（定着）

### StudyPage (FlashCard) での表示

```tsx
// FlashCard ヘッダーにレベル表示
<span className="badge text-bg-light ms-2">
  Lv {memory.memoryLevel}
</span>
```

---

## StudyFlow

### 1. 次の単語を取得（`GET /api/study/next`）

```python
# サーバー側: services.py の get_next_card()

# 優先度1: 期限切れの単語（dueAt <= now）
#   → さらに dueAt古い順, memoryLevel低い順
due_list = [x for x in candidates if x[2] <= now]
if due_list:
    due_list.sort(key=lambda t: (t[2], t[1].memoryLevel))
    return due_list[0]

# 優先度2: 全て定着済みなら None（Study Complete）
all_mastered = all(t[1].memoryLevel >= 4 for t in candidates)
if all_mastered:
    return None

# 優先度3: memoryLevel低い順，dueが近い順
candidates.sort(key=lambda t: (t[1].memoryLevel, t[2]))
return candidates[0]
```

**ロジック**:
1. 期限切れ → 古い順（最も遅れた学習を優先）
2. 全て定着 → 学習完了
3. 未定着 → memoryLevel低い順（基礎固め優先）

### 2. 評価を送信（`POST /api/study/grade`）

```
リクエスト:
{
  "wordId": "w123",
  "rating": "good"
}

レスポンス:
{
  "ok": true,
  "memory": {
    "wordId": "w123",
    "memoryLevel": 2,
    "ease": 2.5,
    "intervalDays": 3,
    "dueAt": "2026-02-21T10:30:00Z",
    ...
  }
}
```

### 3. フロントエンド流れ

```tsx
// 1. 単語を読み込み  
const res = await studyApi.next();
setWord(res.card.word);
setMemory(res.card.memory);

// 2. ユーザーが評価を選択
async function rate(rating: Rating) {
  await studyApi.grade(word.id, rating);
  // 3. 次の単語を読み込み（ループ）
  await loadNext();
}
```

---

## 定着判定

### 定着とは

**定着** = `memoryLevel >= 4` の単語

### 完了判定

```python
# すべての単語が定着したか判定
all_mastered = all(m.memoryLevel >= 4 for m in memory_states)

if all_mastered:
    # → Study Complete（カードなし）
    return {"ok": true, "card": None}
else:
    # → 次の未定着単語を返す
    return {"ok": true, "card": {...}}
```

**表示**: フロントエンドで `card === null` なら "Study Complete" アラート

```tsx
{!word || !memory ? (
  <div className="alert alert-success">
    Study Complete
  </div>
) : (
  <FlashCard word={word} memory={memory} onRate={rate} />
)}
```

---

## リセット機能

### エンドポイント

```
POST /api/study/reset/{word_id}
```

### 動作

```python
def reset_memory(userId: str, wordId: str) -> None:
    """指定単語のメモリ状態をリセット"""
    mf = load_memory(userId)
    # memory配列から該当単語を削除
    mf.memory = [m for m in mf.memory if m.wordId != wordId]
    save_memory(userId, mf)
```

### 結果

- **Lv が 0 に戻る**（初期状態と同じ）
- **dueAt が現在時刻になる**（すぐに復習対象）
- **reviewCount, lapseCount がリセット**
- **ease が 2.5 に戻る**

### 用途

- 間違った評価を修正したい
- 復習をやり直したい
- 定着済みの単語を再学習したい

### フロントエンド実装

```tsx
// WordDetailPage で実装
async function handleResetMemory() {
  if (!confirm(`Reset memory level for "${word.headword}"?`)) return;
  await studyApi.resetMemory(word.id);
  // 次の単語へ遷移など
}
```

---

## 実装の流れ図

```
[新規単語登録]
        ↓
[Lv 0: 未学習]
        ↓
[StudyPage で学習開始]
        ↓
[復習スケジュール（dueAt）に基づいて出題]
        ↓
[ユーザー評価: again/hard/good/easy]
        ↓
┌─────────────────────────────┐
│ memoryLevel 遷移            │
│ again → Lv - 1             │
│ hard  → Lv そのまま        │
│ good  → Lv + 1             │
│ easy  → Lv + 1             │
└─────────────────────────────┘
        ↓
[ease/intervalDays 更新]
        ↓
[dueAt を計算]
        ↓
[memoryLevel >= 4 ?]
  yes → [Lv 4-5: 定着] → [時々出題]
  no  → [Lv 0-3: 学習中] → [定期的に出題]
        ↓
[全単語が Lv >= 4 ?]
  yes → [Study Complete ✓]
  no  → [次の単語へ]
```

---

## 補足

### エクスポート/インポート時

記憶状態は `AppData.memory` に含まれ、Export/Import 時に自動的に保存・復元されます。

```typescript
interface AppData {
  words: WordEntry[];
  memory: MemoryState[];  // ← 記憶レベルなどを含む
}
```

### データ永続化

- バックエンド: `app/data/users/{userId}/memory.json`
- フロントエンド: API経由で取得（ローカル保存なし）

