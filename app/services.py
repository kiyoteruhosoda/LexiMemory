# app/services.py
from __future__ import annotations
from typing import Optional, List, Dict, Any
from uuid import uuid4
from datetime import datetime, timedelta, timezone
import shutil
from . import storage
from .models import WordEntry, WordsFile, MemoryState, MemoryFile, Rating, AppData, AppDataForImport, ExampleSentence
from .security import hash_password, verify_password

UTC = timezone.utc

# ---------- Users ----------
def _init_users_if_missing() -> None:
    p = storage.users_file_path()
    if p.exists():
        return
    storage.atomic_write_json(p, {"schemaVersion": 1, "users": []})

def find_user_by_username(username: str) -> Optional[dict]:
    _init_users_if_missing()
    data = storage.read_json(storage.users_file_path())
    for u in data.get("users", []):
        if u.get("username") == username:
            return u
    return None

def find_user_by_id(userId: str) -> Optional[dict]:
    _init_users_if_missing()
    data = storage.read_json(storage.users_file_path())
    for u in data.get("users", []):
        if u.get("userId") == userId:
            return u
    return None

def register_user(username: str, password: str) -> dict:
    _init_users_if_missing()
    if find_user_by_username(username):
        raise ValueError("username already exists")

    userId = str(uuid4())
    u = {
        "userId": userId,
        "username": username,
        "passwordHash": hash_password(password),
        "roles": ["user"],
        "createdAt": storage.now_iso(),
        "disabled": False,
    }
    p = storage.users_file_path()
    data = storage.read_json(p)
    data["users"].append(u)
    storage.atomic_write_json(p, data)

    # user vault init
    _ensure_user_files(userId)
    return u

def authenticate(username: str, password: str) -> Optional[dict]:
    u = find_user_by_username(username)
    if not u or u.get("disabled"):
        return None
    if verify_password(password, u["passwordHash"]):
        return u
    return None

def delete_user(userId: str) -> None:
    """Delete user from users.json and remove user vault directory."""
    _init_users_if_missing()
    p = storage.users_file_path()
    data = storage.read_json(p)
    users = data.get("users", [])
    data["users"] = [u for u in users if u.get("userId") != userId]
    storage.atomic_write_json(p, data)
    
    # Remove user vault directory
    ud = storage.user_dir(userId)
    if ud.exists():
        shutil.rmtree(ud)

# ---------- Vault files ----------
def _ensure_user_files(userId: str) -> None:
    ud = storage.user_dir(userId)
    ud.mkdir(parents=True, exist_ok=True)

    words_path = ud / "words.json"
    if not words_path.exists():
        storage.atomic_write_json(words_path, {"schemaVersion": 1, "updatedAt": storage.now_iso(), "words": []})

    mem_path = ud / "memory.json"
    if not mem_path.exists():
        storage.atomic_write_json(mem_path, {"schemaVersion": 1, "updatedAt": storage.now_iso(), "memory": []})

    settings_path = ud / "settings.json"
    if not settings_path.exists():
        storage.atomic_write_json(settings_path, {"schemaVersion": 1, "updatedAt": storage.now_iso(), "settings": {}})

def load_words(userId: str) -> WordsFile:
    _ensure_user_files(userId)
    ud = storage.user_dir(userId)
    data = storage.read_json(ud / "words.json")
    return WordsFile(**data)

def save_words(userId: str, wf: WordsFile) -> None:
    wf.updatedAt = storage.now_iso()
    storage.atomic_write_json(storage.user_dir(userId) / "words.json", wf.model_dump())

def load_memory(userId: str) -> MemoryFile:
    _ensure_user_files(userId)
    ud = storage.user_dir(userId)
    data = storage.read_json(ud / "memory.json")
    return MemoryFile(**data)

def save_memory(userId: str, mf: MemoryFile) -> None:
    mf.updatedAt = storage.now_iso()
    storage.atomic_write_json(storage.user_dir(userId) / "memory.json", mf.model_dump())

# ---------- Words CRUD ----------
def list_words(userId: str) -> List[WordEntry]:
    return load_words(userId).words

def upsert_word(userId: str, word: WordEntry) -> None:
    wf = load_words(userId)
    existing = {w.id: w for w in wf.words}
    existing[word.id] = word
    wf.words = list(existing.values())
    save_words(userId, wf)

def delete_word(userId: str, wordId: str) -> None:
    wf = load_words(userId)
    wf.words = [w for w in wf.words if w.id != wordId]
    save_words(userId, wf)

    mf = load_memory(userId)
    mf.memory = [m for m in mf.memory if m.wordId != wordId]
    save_memory(userId, mf)

def create_word(
    userId: str,
    headword: str,
    pos: str,
    meaningJa: str,
    pronunciation: Optional[str] = None,
    tags: Optional[list[str]] = None,
    examples: Optional[List[ExampleSentence]] = None,
    memo: Optional[str] = None,
) -> WordEntry:
    now = storage.now_iso()
    wid = str(uuid4())
    # Normalize examples to ensure all have IDs
    ex_list: List[ExampleSentence] = []
    if examples:
        for ex in examples:
            ex_list.append(ExampleSentence(
                id=ex.id or str(uuid4()),
                en=ex.en,
                ja=ex.ja,
                source=ex.source
            ))
    word = WordEntry(
        id=wid,
        headword=headword.strip(),
        pos=pos,  # type: ignore[arg-type] # pos is expected to be Pos type from router validation
        meaningJa=meaningJa.strip(),
        pronunciation=(pronunciation.strip() if pronunciation else None),
        tags=tags or [],
        examples=ex_list,
        memo=memo,
        createdAt=now,
        updatedAt=now,
    )
    upsert_word(userId, word)

    # memory初期化（必要に応じて）
    mf = load_memory(userId)
    if not any(m.wordId == wid for m in mf.memory):
        mf.memory.append(MemoryState(
            wordId=wid,
            dueAt=now,
            lastRating=None,
            lastReviewedAt=None
        ))
        save_memory(userId, mf)
    return word

# ---------- Study (SRS) ----------
def _parse_iso(s: str) -> datetime:
    # ISO with timezone assumed; storage.now_iso() uses UTC offset
    return datetime.fromisoformat(s)

def _next_interval_days(prev_interval: int, ease: float, review_count: int) -> int:
    if review_count <= 0:
        return 1
    if review_count == 1:
        return 3
    if review_count == 2:
        return 7
    return max(1, round(prev_interval * ease))

def get_next_card(userId: str) -> Optional[dict]:
    wf = load_words(userId)
    mf = load_memory(userId)

    now = datetime.now(UTC)

    mem_by_id = {m.wordId: m for m in mf.memory}
    # wordsに存在するものだけ対象
    candidates = []
    for w in wf.words:
        m = mem_by_id.get(w.id) or MemoryState(
            wordId=w.id,
            dueAt=storage.now_iso(),
            lastRating=None,
            lastReviewedAt=None
        )
        due = _parse_iso(m.dueAt)
        candidates.append((w, m, due))

    if not candidates:
        return None

    due_list = [x for x in candidates if x[2] <= now]
    if due_list:
        # 期限切れを最優先：dueが古い順、memoryLevel低い順
        due_list.sort(key=lambda t: (t[2], t[1].memoryLevel))
        w, m, _ = due_list[0]
        return {"word": w, "memory": m}

    # 期限切れが無い場合、全ての単語が定着レベル(memoryLevel >= 4)なら学習完了
    all_mastered = all(t[1].memoryLevel >= 4 for t in candidates)
    if all_mastered:
        return None

    # 期限切れが無ければ memoryLevel低い順、dueが近い順
    candidates.sort(key=lambda t: (t[1].memoryLevel, t[2]))
    w, m, _ = candidates[0]
    return {"word": w, "memory": m}

def grade_card(userId: str, wordId: str, rating: Rating) -> MemoryState:
    mf = load_memory(userId)
    now = datetime.now(UTC)

    idx = next((i for i, m in enumerate(mf.memory) if m.wordId == wordId), None)
    if idx is None:
        m = MemoryState(
            wordId=wordId,
            dueAt=storage.now_iso(),
            lastRating=None,
            lastReviewedAt=None
        )
        mf.memory.append(m)
        idx = len(mf.memory) - 1

    m = mf.memory[idx]

    # update by rating
    if rating == "again":
        m.memoryLevel = max(0, m.memoryLevel - 1)
        m.ease = max(1.3, m.ease - 0.2)
        m.intervalDays = 0
        m.lapseCount += 1
        due = now + timedelta(minutes=10)  # 当日中再出題の例
    elif rating == "hard":
        m.ease = max(1.3, m.ease - 0.05)
        m.intervalDays = max(1, round(m.intervalDays * 0.8)) if m.intervalDays > 0 else 1
        due = now + timedelta(days=m.intervalDays)
    elif rating == "good":
        m.memoryLevel = min(5, m.memoryLevel + 1)
        m.intervalDays = _next_interval_days(m.intervalDays, m.ease, m.reviewCount)
        due = now + timedelta(days=m.intervalDays)
    else:  # easy
        m.memoryLevel = min(5, m.memoryLevel + 1)
        m.ease = min(2.5, m.ease + 0.1)
        base = _next_interval_days(m.intervalDays, m.ease, m.reviewCount)
        m.intervalDays = max(1, round(base * 1.3))
        due = now + timedelta(days=m.intervalDays)

    m.reviewCount += 1
    m.lastRating = rating
    m.lastReviewedAt = now.isoformat()
    m.dueAt = due.isoformat()

    mf.memory[idx] = m
    save_memory(userId, mf)
    return m

# ---------- Import / Export ----------
def _normalize_app_data_for_import(app_data: AppDataForImport) -> AppData:
    """Convert AppDataForImport to AppData, generating missing IDs and timestamps"""
    now = storage.now_iso()

    # Normalize words
    normalized_words: List[WordEntry] = []
    for w in app_data.words:
        # Generate ID if missing
        word_id = w.id or str(uuid4())

        # Generate timestamps if missing
        created_at = w.createdAt or now
        updated_at = w.updatedAt or now

        # Normalize examples
        normalized_examples: List[ExampleSentence] = []
        for ex in w.examples:
            example_id = ex.id or str(uuid4())
            normalized_examples.append(ExampleSentence(
                id=example_id,
                en=ex.en,
                ja=ex.ja,
                source=ex.source
            ))

        normalized_words.append(WordEntry(
            id=word_id,
            headword=w.headword,
            pronunciation=w.pronunciation,
            pos=w.pos,
            meaningJa=w.meaningJa,
            examples=normalized_examples,
            tags=w.tags,
            memo=w.memo,
            createdAt=created_at,
            updatedAt=updated_at
        ))

    # Convert memory states (MemoryStateForImport -> MemoryState)
    normalized_memory: List[MemoryState] = []
    for m in app_data.memory:
        normalized_memory.append(MemoryState(
            wordId=m.wordId,
            dueAt=m.dueAt,
            lastRating=m.lastRating,
            lastReviewedAt=m.lastReviewedAt,
            memoryLevel=m.memoryLevel,
            ease=m.ease,
            intervalDays=m.intervalDays,
            reviewCount=m.reviewCount,
            lapseCount=m.lapseCount
        ))

    return AppData(
        schemaVersion=app_data.schemaVersion,
        exportedAt=app_data.exportedAt or now,
        words=normalized_words,
        memory=normalized_memory
    )


def export_appdata(userId: str) -> AppData:
    wf = load_words(userId)
    mf = load_memory(userId)
    return AppData(exportedAt=storage.now_iso(), words=wf.words, memory=mf.memory)

def import_appdata(userId: str, app: AppData | AppDataForImport, mode: str) -> None:
    """Import application data, supporting both full export format and manually-created files"""
    # Normalize AppDataForImport to AppData
    if isinstance(app, AppDataForImport):
        app = _normalize_app_data_for_import(app)

    # mode: overwrite | merge
    if mode == "overwrite":
        save_words(userId, WordsFile(updatedAt=storage.now_iso(), words=app.words))
        save_memory(userId, MemoryFile(updatedAt=storage.now_iso(), memory=app.memory))
        return

    # merge: idベースで更新（updatedAtが新しい方を採用）
    wf = load_words(userId)
    mf = load_memory(userId)

    existing_words = {w.id: w for w in wf.words}
    for w in app.words:
        cur = existing_words.get(w.id)
        if not cur:
            existing_words[w.id] = w
        else:
            # updatedAt 比較（無い場合は上書き）
            try:
                if _parse_iso(w.updatedAt) >= _parse_iso(cur.updatedAt):
                    existing_words[w.id] = w
            except Exception:
                existing_words[w.id] = w

    existing_mem = {m.wordId: m for m in mf.memory}
    for m in app.memory:
        cur = existing_mem.get(m.wordId)
        if not cur:
            existing_mem[m.wordId] = m
        else:
            # dueAtが新しい方を採用（簡易）
            try:
                if _parse_iso(m.dueAt) >= _parse_iso(cur.dueAt):
                    existing_mem[m.wordId] = m
            except Exception:
                existing_mem[m.wordId] = m

    wf.words = list(existing_words.values())
    mf.memory = list(existing_mem.values())
    save_words(userId, wf)
    save_memory(userId, mf)


def reset_memory(userId: str, wordId: str) -> None:
    """Reset memory state for a specific word"""
    mf = load_memory(userId)
    mf.memory = [m for m in mf.memory if m.wordId != wordId]
    save_memory(userId, mf)
