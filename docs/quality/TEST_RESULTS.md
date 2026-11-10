# Test Results Log

## 2026-11-10 (Phase 00 baseline)

| Suite | Command | Result |
|---|---|---|
| API | `AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development pytest -q` in `apps/api` | **16 passed** |
| Tower types | `npm run typecheck` in `apps/control-tower` | **clean** |
| Browser classic Chat | Computer-use retest after CORS fix | **success** (blueprint returned) |
| Browser Copilot | Agent bind error then PR #5 fix | **fix pending accept / retest** |

No Playwright suite yet.
