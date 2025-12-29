# Murmurant Environment Configuration

This document describes environment variables for configuring Murmurant in native mode vs Wild Apricot integration mode.

## Feature Flags

Control which features use native implementations vs Wild Apricot:

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_NATIVE_AUTH` | `false` | Use native passkey auth instead of WA OAuth |
| `FEATURE_NATIVE_PAYMENTS` | `false` | Use Stripe instead of WA payments |
| `FEATURE_NATIVE_EMAIL` | `false` | Use Resend instead of WA email |
| `FEATURE_WA_SYNC` | `true` | Enable WA data sync (member/event polling) |
| `FEATURE_WA_IMPORT` | `true` | Enable WA data import tools |

## Native Service Configuration

### Authentication

Required when `FEATURE_NATIVE_AUTH=true`:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `SESSION_DURATION` | No | Session duration in seconds (default: 86400) |
| `PASSKEY_RP_ID` | No | WebAuthn relying party ID (default: hostname) |
| `PASSKEY_RP_NAME` | No | WebAuthn relying party name (default: "Murmurant") |

### Email (Resend)

Required when `FEATURE_NATIVE_EMAIL=true`:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key from dashboard |
| `EMAIL_FROM_ADDRESS` | Yes | Default from address (must be verified domain) |
| `EMAIL_FROM_NAME` | No | Default from name (default: "Murmurant") |
| `EMAIL_REPLY_TO` | No | Default reply-to address |

### Payments (Stripe)

Required when `FEATURE_NATIVE_PAYMENTS=true`:

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (sk_live_* or sk_test_*) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (pk_live_* or pk_test_*) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret (whsec_*) |
| `STRIPE_ACCOUNT_ID` | No | Connected account ID (for platforms) |

## Wild Apricot Configuration

Required when any WA feature is enabled:

| Variable | Required | Description |
|----------|----------|-------------|
| `WA_API_KEY` | Yes* | Wild Apricot API key |
| `WA_ACCOUNT_ID` | Yes* | Wild Apricot account ID |
| `WA_CLIENT_ID` | No | OAuth client ID (for SSO) |
| `WA_CLIENT_SECRET` | No | OAuth client secret (for SSO) |
| `WA_SYNC_INTERVAL` | No | Sync interval in minutes (default: 15) |

*Required only if `FEATURE_WA_SYNC=true` or `FEATURE_WA_IMPORT=true`

## Database Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_POOL_SIZE` | No | Connection pool size (default: 10) |

## Application Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Environment: development, test, production |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the application |
| `LOG_LEVEL` | No | Log level: debug, info, warn, error (default: info) |

## Migration Path

### Phase 0: Preparation (Current)

All WA features enabled, native services implemented but disabled:

```bash
FEATURE_NATIVE_AUTH=false
FEATURE_NATIVE_PAYMENTS=false
FEATURE_NATIVE_EMAIL=false
FEATURE_WA_SYNC=true
FEATURE_WA_IMPORT=true
```

### Phase 1: Native Auth

Enable native authentication while keeping WA sync:

```bash
FEATURE_NATIVE_AUTH=true
FEATURE_NATIVE_PAYMENTS=false
FEATURE_NATIVE_EMAIL=false
FEATURE_WA_SYNC=true
FEATURE_WA_IMPORT=true
```

### Phase 2: Native Email

Add native email (for notifications, not WA system emails):

```bash
FEATURE_NATIVE_AUTH=true
FEATURE_NATIVE_PAYMENTS=false
FEATURE_NATIVE_EMAIL=true
FEATURE_WA_SYNC=true
FEATURE_WA_IMPORT=true
```

### Phase 3: Native Payments

Add native payments for new transactions:

```bash
FEATURE_NATIVE_AUTH=true
FEATURE_NATIVE_PAYMENTS=true
FEATURE_NATIVE_EMAIL=true
FEATURE_WA_SYNC=true
FEATURE_WA_IMPORT=false  # Import complete
```

### Phase 4: Full Native

Disable WA integration entirely:

```bash
FEATURE_NATIVE_AUTH=true
FEATURE_NATIVE_PAYMENTS=true
FEATURE_NATIVE_EMAIL=true
FEATURE_WA_SYNC=false
FEATURE_WA_IMPORT=false
```

## Environment File Template

Create `.env.local` from this template:

```bash
# =============================================================================
# Murmurant Environment Configuration
# =============================================================================

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/murmurant"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# -----------------------------------------------------------------------------
# Feature Flags
# -----------------------------------------------------------------------------
FEATURE_NATIVE_AUTH=false
FEATURE_NATIVE_PAYMENTS=false
FEATURE_NATIVE_EMAIL=false
FEATURE_WA_SYNC=true
FEATURE_WA_IMPORT=true

# -----------------------------------------------------------------------------
# Wild Apricot (required if WA features enabled)
# -----------------------------------------------------------------------------
WA_API_KEY="your-wa-api-key"
WA_ACCOUNT_ID="your-wa-account-id"
# WA_CLIENT_ID=""
# WA_CLIENT_SECRET=""

# -----------------------------------------------------------------------------
# Native Auth (required if FEATURE_NATIVE_AUTH=true)
# -----------------------------------------------------------------------------
# JWT_SECRET="your-32-char-minimum-secret-here"
# SESSION_DURATION=86400

# -----------------------------------------------------------------------------
# Native Email (required if FEATURE_NATIVE_EMAIL=true)
# -----------------------------------------------------------------------------
# RESEND_API_KEY="re_xxxx"
# EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
# EMAIL_FROM_NAME="Your Club Name"

# -----------------------------------------------------------------------------
# Native Payments (required if FEATURE_NATIVE_PAYMENTS=true)
# -----------------------------------------------------------------------------
# STRIPE_SECRET_KEY="sk_test_xxxx"
# STRIPE_PUBLISHABLE_KEY="pk_test_xxxx"
# STRIPE_WEBHOOK_SECRET="whsec_xxxx"
```

## Validation

The application validates environment configuration at startup. Missing required variables will cause a startup error with a clear message indicating which variables are missing.

Run validation manually:

```bash
npm run env:validate
```
