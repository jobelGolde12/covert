# Folio Enhancement Plan

## Overview
This plan addresses the critical bugs, security vulnerabilities, and performance improvements identified in the QA documentation, while also implementing UI/UX enhancements based on the design system.

## 1. Critical Bug Fixes

### BUG-01: Concurrent uploads fail with HTTP 500
- **Root cause**: Multiple uploads use the same `storageKey: "pending"` placeholder, causing unique constraint violation
- **Files affected**: `app/api/v1/files/upload/route.ts`, `prisma/schema.prisma`
- **Fix approach**: Generate UUID first and create row directly with final storage key
- **Implementation**: 
  - Modify upload flow to generate file UUID immediately
  - Create database record with actual storage key from the start
  - Remove placeholder approach that caused collisions

### BUG-02: Download Content-Disposition filename is storage UUID
- **Root cause**: Download route uses storage key name instead of original filename
- **Files affected**: `app/api/v1/files/download/route.ts`
- **Fix approach**: Resolve filename from File metadata
- **Implementation**:
  - Query File record to get original filename
  - Use that filename in Content-Disposition header
  - Handle cases where filename might be unavailable

### BUG-03: Cancelling in-flight jobs overwrites state to done
- **Root cause**: Worker doesn't re-check status after completion
- **Files affected**: `lib/jobs.ts`, `lib/jobs.ts`
- **Fix approach**: Re-check job status before marking as done
- **Implementation**:
  - Add status check after worker completion
  - Cancel job properly without leaving residual data
  - Ensure cancellation is honored immediately

### BUG-04: Failed requests consume daily quota
- **Root cause**: `incrementDaily()` runs before validation
- **Files affected**: `app/api/v1/jobs/route.ts`
- **Fix approach**: Validate job spec before incrementing quota
- **Implementation**:
  - Move quota increment after successful validation
  - Refund quota on failed attempts
  - Handle idempotent requests correctly

## 2. Security Fixes

### SEC-01: Rate-limit bypass via X-Forwarded-For
- **Root cause**: Direct use of client-supplied header
- **Files affected**: `lib/api.ts`, `lib/rate-limit.ts`, `app/api/v1/jobs/route.ts`
- **Fix approach**: Trust header only behind trusted proxy
- **Implementation**:
  - Add middleware to validate trusted proxy status
  - Fall back to socket address when not trusted
  - Update rate limiting to use secure identity

### SEC-02: Guest identity cookie never sent
- **Root cause**: Missing Set-Cookie in responses
- **Files affected**: `lib/api.ts`
- **Fix approach**: Add cookie to all identity responses
- **Implementation**:
  - Set `folio_guest` cookie in all responses
  - Use consistent cookie attributes (SameSite, Secure, etc.)

### SEC-03: Hard-coded default UPLOAD_SECRET
- **Root cause**: Default secret allows token forgery
- **Files affected**: `lib/env.ts`
- **Fix approach**: Fail fast on production with default secret
- **Implementation**:
  - Add validation at startup for production
  - Require proper secret configuration
  - Document default in .env.example with warning

## 3. Performance Improvements

### PERF-01: Buffer entire object for checksum
- **Root cause**: Memory spike during completion
- **Files affected**: `lib/storage/index.ts`
- **Fix approach**: Stream checksum calculation
- **Implementation**:
  - Use incremental hashing instead of loading entire file
  - Process file in chunks to reduce memory impact

### PERF-02: SSE polling regenerates URLs every 600ms
- **Root cause**: Unnecessary URL generation on each poll
- **Files affected**: `lib/sse.ts`, `lib/jobs.ts`
- **Fix approach**: Cache URLs until job completion
- **Implementation**:
  - Generate download URLs only when job completes
  - Cache previous URLs to avoid redundant computation

### PERF-03: Download route buffers full file
- **Root cause**: Memory doubling for concurrent downloads
- **Files affected**: `app/api/v1/files/download/route.ts`
- **Fix approach**: Stream file directly to response
- **Implementation**:
  - Use `fs.createReadStream` instead of `readFile`
  - Add proper Content-Length handling
  - Reduce memory footprint for large files

## 4. Security Hardening

- **Implement proper rate limiting**: Add trusted proxy validation
- **Fix identity management**: Ensure guest cookie is properly set
- **Add secret validation**: Enforce non-default secrets in production
- **Complete CSP headers**: Add Content-Security-Policy for enhanced security

## 5. UI/UX Enhancements

According to design.md and TODO.md requirements:
- Maintain existing color palette and theme
- Improve visual hierarchy and consistency
- Enhance accessibility features
- Optimize responsive behavior
- Add proper micro-interactions

## 6. Implementation Plan

### Phase 1: Core Bug Fixes (1-2 weeks)
1. Fix concurrent upload issue (BUG-01)
2. Fix download filename issue (BUG-02) 
3. Fix job cancellation issue (BUG-03)
4. Fix quota consumption issue (BUG-04)

### Phase 2: Security Hardening (1 week)
1. Fix rate-limit bypass (SEC-01)
2. Implement guest identity cookie (SEC-02)
3. Add secret validation (SEC-03)

### Phase 3: Performance Improvements (1 week)
1. Stream checksum calculation (PERF-01)
2. Optimize SSE URL generation (PERF-02)
3. Stream file downloads (PERF-03)

### Phase 4: UI/UX Enhancements (ongoing)
1. Implement design system improvements
2. Enhance accessibility features
3. Optimize responsive behavior
4. Add micro-interactions

## 7. Testing Strategy
- All changes must pass existing test suite
- Add regression tests for fixed issues
- Perform load testing on fixed endpoints
- Verify accessibility compliance
- Conduct security scanning post-fixes

## 8. Documentation Updates
- Update README.md with feature descriptions
- Update api-documentation.md with any endpoint changes
- Update design.md with any UI changes
- Update architecture.md with implementation details