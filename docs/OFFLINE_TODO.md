# Offline-First Implementation TODO

## ✅ Completed

### Core Implementation
- [x] IndexedDB repository layer
  - [x] types.ts - Type definitions
  - [x] indexeddb.ts - Low-level IndexedDB API
  - [x] localRepository.ts - CRUD operations
  - [x] syncService.ts - Sync logic
  
- [x] Backend sync API
  - [x] GET /api/vocab - Fetch server version
  - [x] PUT /api/vocab - Normal sync with conflict detection
  - [x] PUT /api/vocab?force=true - Force overwrite (LWW)
  - [x] Backup mechanism
  - [x] Models (VocabFile, VocabSyncRequest, etc.)
  
- [x] Frontend offline APIs
  - [x] words.offline.ts - Offline words operations
  - [x] study.offline.ts - Offline study operations with FSRS
  - [x] io.offline.ts - Offline import/export
  
- [x] UI Components
  - [x] SyncButton - Sync status and controls
  - [x] Conflict resolution modal
  - [x] Login prompt for sync
  - [x] Integrated into Layout
  
- [x] Page Updates
  - [x] WordListPage - Use offline APIs
  - [x] WordCreatePage - Use offline APIs
  - [x] WordDetailPage - Use offline APIs
  - [x] StudyPage - Use offline APIs
  - [x] ImportModal - Use offline APIs
  
- [x] Authentication Flow
  - [x] Remove RequireAuth from pages
  - [x] Auth only required for sync
  - [x] Sync button handles auth errors

## 🚧 Remaining Tasks

### Testing
- [ ] Unit tests for localRepository
- [ ] Unit tests for syncService
- [ ] Integration tests for offline operations
- [ ] E2E tests for sync flow
- [ ] Conflict resolution tests

### Documentation
- [x] Migration guide (OFFLINE_FIRST_MIGRATION.md)
- [ ] API documentation updates
- [ ] User guide for offline usage
- [ ] Troubleshooting FAQ

### Polish
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Toast notifications for sync success/failure
- [ ] Retry logic for failed syncs
- [ ] Background sync (optional)

### Performance
- [ ] IndexedDB query optimization
- [ ] Lazy loading for large datasets
- [ ] Debounce sync operations
- [ ] Compression for large vocab files

### Future Enhancements
- [ ] Incremental sync (delta-based)
- [ ] CRDT for better conflict resolution
- [ ] ServiceWorker for true offline PWA
- [ ] End-to-end encryption
- [ ] Multi-device session management
- [ ] Automatic sync on online event

## Known Issues

1. **Tag filter removed from StudyPage**
   - Was dependent on server-side API
   - Need to implement local tag filtering

2. **FSRS calculation differs from server**
   - Client-side uses simplified version
   - Consider syncing algorithm parameters

3. **No encryption for IndexedDB**
   - Browser limitation
   - Consider warning for sensitive data

## Testing Checklist

### Manual Testing
- [ ] Create word offline → sync → verify on server
- [ ] Edit word offline → sync → verify on server
- [ ] Delete word offline → sync → verify on server
- [ ] Study offline → sync → verify memory states
- [ ] Sync without login → should prompt for login
- [ ] Conflict scenario (2 devices) → resolve → verify

### Automated Testing
- [ ] Run existing frontend tests
- [ ] Run existing backend tests
- [ ] Add new offline-specific tests
- [ ] Coverage report

## Resources

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Offline First](https://offlinefirst.org/)
- [CRDT](https://crdt.tech/)
- [PWA](https://web.dev/progressive-web-apps/)
