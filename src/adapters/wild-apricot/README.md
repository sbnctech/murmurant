# Wild Apricot Adapter

This directory contains Wild Apricot adapter services that wrap the core importer.

When running in standalone mode, this adapter is not loaded.

## Architecture

The WA integration follows a layered architecture:

```
src/adapters/wild-apricot/     <-- Adapter Layer (this directory)
├── WAAuthService.ts           - OAuth token management
├── WAMemberService.ts         - Member sync operations
├── WASyncService.ts           - Full sync orchestration
├── types.ts                   - Re-exports + adapter-specific types
├── config.ts                  - Adapter configuration
└── index.ts                   - Public API

src/lib/importing/wildapricot/ <-- Core Importer Layer
├── client.ts                  - WA API client
├── importer.ts                - Import/sync logic
├── transformers.ts            - WA → Murmurant transformers
├── types.ts                   - WA API types
├── config.ts                  - Import configuration
└── index.ts                   - Core exports
```

**Why this structure?**

- **Separation of concerns**: Core importer handles raw WA API interaction; adapter provides Murmurant-specific services
- **Import direction**: Adapter imports from lib (never the reverse) to avoid circular dependencies
- **Standalone mode**: Adapter is conditionally loaded; lib code remains available for scripts

## Structure

- `types.ts` - WA API response types and data structures
- `config.ts` - WA-specific configuration and environment variables
- `WAAuthService.ts` - OAuth authentication with Wild Apricot
- `WAMemberService.ts` - Member sync operations
- `WASyncService.ts` - Full data synchronization between Murmurant and WA
- `index.ts` - Public exports

## Usage

```typescript
import { WAAuthService, WAMemberService, WASyncService } from '@/adapters/wild-apricot';
```

For core importer functions:

```typescript
import { WildApricotClient, fullSync } from '@/lib/importing/wildapricot';
```

## Environment Variables

Required for WA integration:

- `WA_API_KEY` - Wild Apricot API key
- `WA_ACCOUNT_ID` - Wild Apricot account ID
- `WA_CLIENT_ID` - OAuth client ID (optional)
- `WA_CLIENT_SECRET` - OAuth client secret (optional)
