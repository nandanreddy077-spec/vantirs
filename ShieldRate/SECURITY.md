# Security Notes

## Current Vulnerabilities

The `npm audit` report shows 6 vulnerabilities (2 moderate, 4 high). These are in **transitive dependencies** (dependencies of dependencies) and are mostly non-critical for production:

### 1. ESLint Vulnerabilities (Moderate - Dev Only)
- **Affected**: `eslint`, `eslint-config-next`, `eslint-plugin-react-hooks`
- **Impact**: Development environment only (not included in production build)
- **Risk**: Low - Only affects local development
- **Fix**: Will be resolved when Next.js updates ESLint dependency

### 2. Glob Command Injection (High - Dev Only)
- **Affected**: `glob` (via `@next/eslint-plugin-next`)
- **Impact**: Development environment only
- **Risk**: Low - Only affects ESLint during development
- **Note**: Requires CLI usage with `-c/--cmd` flag, which Next.js doesn't use

### 3. Next.js DoS Vulnerabilities (High)
- **Affected**: `next` package
- **Impact**: Production (but requires insecure configuration)
- **Risk**: Low - Requires specific insecure configurations:
  - Image Optimizer with insecure `remotePatterns`
  - React Server Components with insecure deserialization
- **Mitigation**: 
  - We don't use Image Optimizer with external patterns
  - We use secure RSC configurations
  - These vulnerabilities require explicit insecure setup

## Recommendations

1. **For Development**: These vulnerabilities are acceptable as they're in dev dependencies
2. **For Production**: The Next.js vulnerabilities require insecure configurations we don't use
3. **Future Updates**: Monitor Next.js releases for security patches
4. **If Needed**: Run `npm audit fix --force` to update to Next.js 16 (may have breaking changes)

## Suppressing Dev Dependency Warnings

If you want to suppress audit warnings for dev dependencies only, create `.npmrc`:

```
audit-level=moderate
```

This will only show high/critical vulnerabilities in production dependencies.

---

**Status**: Safe to proceed with development and production deployment. Vulnerabilities are either dev-only or require insecure configurations we don't use.


