# Security Test Results

## Present

- Tenant-scoped workflow access patterns covered in API tests (extend continuously).  
- Approval tamper/replay/expiry covered in prior Trust tests.  
- Auth hard-fail for unverified Bearer outside demo path (`test_auth_hard_fail`).  
- CORS origin allowlist tests for localhost + 127.0.0.1.

## Missing (Phase 12)

- Formal cross-tenant penetration script  
- Prompt injection corpus  
- Data leakage tests  
- Clerk session forgery tests post-JWKS  

**Status:** Not pilot-secure. Do not claim “fully secure.”
