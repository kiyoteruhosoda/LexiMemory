
```
backend/
  app/
    __init__.py
    main.py
    settings.py
    models.py
    security.py
    sessions.py
    storage.py
    services.py
    deps.py
    routers/
      __init__.py
      auth.py
      words.py
      study.py
      io.py
  data/                 # 実データ（git管理しない）
    users/
      users.json
    vault/
      (u_<userId>/...)  # 自動生成
  requirements.txt
frontend/src/
  api/
    client.ts
    auth.ts
    words.ts
    study.ts
    types.ts
  auth/
    AuthContext.tsx
    RequireAuth.tsx
  pages/
    LoginPage.tsx
    WordsPage.tsx
    StudyPage.tsx
  components/
    Layout.tsx
    WordForm.tsx
    WordList.tsx
    FlashCard.tsx
  App.tsx
  main.tsx

```

```
cd /work/project/03.LexiMemory
docker compose up -d --build
```


```
curl http://localhost:8000/healthz
```

Build
```
./scripts/bump_version.sh && sudo docker compose up -d --build
```