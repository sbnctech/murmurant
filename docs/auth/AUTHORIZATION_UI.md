# Authorization UI Components

Murmurant provides client-side components that reflect server-side authorization state. These components make authorization visible in the UI while never replacing server-side enforcement.

## Charter Compliance

- **P2**: UI reflects actual authorization (server still enforces)
- **P7**: Navigation shows only what user can access
- **N3**: No UI-only gating - server always validates

## useCurrentUser Hook

Central hook for accessing authenticated user information client-side.

### Usage

```tsx
import { useCurrentUser } from "@/hooks/useCurrentUser";

function MyComponent() {
  const {
    user,
    loading,
    error,
    isAuthenticated,
    hasCapability,
    hasAnyCapability,
    hasAllCapabilities,
    displayName,
    refetch,
    clear,
  } = useCurrentUser();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <p>Hello, {displayName}</p>
      {hasCapability("events:view") && <EventsList />}
    </div>
  );
}
```

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `user` | `CurrentUser \| null` | Current user data or null |
| `loading` | `boolean` | True while fetching user data |
| `error` | `string \| null` | Error message if fetch failed |
| `isAuthenticated` | `boolean` | True if user is logged in |
| `hasCapability(cap)` | `(Capability) => boolean` | Check single capability |
| `hasAnyCapability(caps)` | `(Capability[]) => boolean` | Check if user has any listed capability |
| `hasAllCapabilities(caps)` | `(Capability[]) => boolean` | Check if user has all listed capabilities |
| `displayName` | `string \| null` | User's display name |
| `refetch()` | `() => Promise<void>` | Refresh user data |
| `clear()` | `() => void` | Clear cached user data |

### CurrentUser Object

```typescript
interface CurrentUser {
  userAccountId: string;
  memberId: string | null;
  email: string;
  name?: string;
  globalRole: GlobalRole;
  capabilities: Capability[];
}
```

### Role Display Names

```typescript
import { getRoleDisplayName } from "@/hooks/useCurrentUser";

getRoleDisplayName("admin"); // "Administrator"
getRoleDisplayName("officer"); // "Officer"
getRoleDisplayName("member"); // "Member"
```

## AccountIndicator Component

Displays current user info with a dropdown menu for account actions.

### Usage

```tsx
import { AccountIndicator } from "@/components/auth";

function Header() {
  return (
    <header>
      <nav>...</nav>
      <AccountIndicator />
    </header>
  );
}
```

### Behavior

- **Authenticated**: Shows user avatar, name, email, role badge, and logout option
- **Unauthenticated**: Shows "Sign In" link
- **Loading**: Shows skeleton placeholder

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loginHref` | `string` | `"/login"` | URL for login link when unauthenticated |

## AuthorizedNav Component

Navigation that shows/hides items based on user capabilities.

### Usage

```tsx
import { AuthorizedNav, ADMIN_NAV_ITEMS } from "@/components/layout";

function AdminSidebar() {
  return (
    <AuthorizedNav
      items={ADMIN_NAV_ITEMS}
      vertical
    />
  );
}
```

### Custom Items

```tsx
const myNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Members",
    href: "/members",
    requiredCapability: "members:view",
  },
  {
    label: "Admin",
    href: "/admin",
    requiredCapability: ["admin:full", "admin:read"],
  },
];

<AuthorizedNav items={myNavItems} />
```

### NavItem Interface

```typescript
interface NavItem {
  label: string;
  href: string;
  testId?: string;
  requiredCapability?: Capability | Capability[];
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavItem[]` | required | Navigation items to render |
| `vertical` | `boolean` | `false` | Stack items vertically |
| `hideUnauthorized` | `boolean` | `true` | Hide items user cannot access |
| `showLoading` | `boolean` | `false` | Show loading placeholders |
| `style` | `CSSProperties` | - | Container styles |
| `linkStyle` | `CSSProperties` | - | Link styles |
| `className` | `string` | - | Container class |

### Pre-built Item Lists

```tsx
import { ADMIN_NAV_ITEMS, OFFICER_NAV_ITEMS } from "@/components/layout";

// ADMIN_NAV_ITEMS includes:
// - Dashboard, Members, Events, Registrations, Service History,
// - Transitions, Content, Communications

// OFFICER_NAV_ITEMS includes:
// - Secretary Dashboard, Parliamentarian Dashboard, Board Records
```

## AuthorizedButton Component

Button that disables based on user capabilities.

### Usage

```tsx
import { AuthorizedButton } from "@/components/auth";

function DeleteMemberButton({ memberId }: { memberId: string }) {
  return (
    <AuthorizedButton
      requiredCapability="members:delete"
      onClick={() => deleteMember(memberId)}
      unauthorizedMessage="Only admins can delete members"
    >
      Delete Member
    </AuthorizedButton>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `requiredCapability` | `Capability \| Capability[]` | - | Capability(ies) required |
| `requireAll` | `boolean` | `false` | Require all capabilities (vs any) |
| `unauthorizedMessage` | `string` | "You don't have permission..." | Tooltip when disabled |
| `disabled` | `boolean` | `false` | Force disabled state |
| `children` | `ReactNode` | required | Button content |
| `...buttonProps` | `ButtonHTMLAttributes` | - | Standard button props |

### useIsAuthorized Hook

For checking authorization without rendering a button:

```tsx
import { useIsAuthorized } from "@/components/auth";

function MyComponent() {
  const { isAuthorized, loading } = useIsAuthorized("events:create");

  if (!isAuthorized) {
    return <p>You cannot create events</p>;
  }

  return <CreateEventForm />;
}
```

## AccessDenied Component

User-friendly 403 error display.

### Usage

```tsx
import { AccessDenied } from "@/components/auth";

// Inline usage
function ProtectedContent() {
  const { isAuthorized } = useIsAuthorized("admin:full");

  if (!isAuthorized) {
    return (
      <AccessDenied
        message="This area is for administrators only."
        requiredAccess="Administrator role"
      />
    );
  }

  return <AdminPanel />;
}

// Full page usage (see /access-denied route)
<AccessDenied fullPage />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fullPage` | `boolean` | `false` | Render as full page layout |
| `message` | `string` | Default message | Explanation text |
| `requiredAccess` | `string` | - | What access is needed |
| `showHomeLink` | `boolean` | `true` | Show link to home |
| `showBackButton` | `boolean` | `true` | Show back button |
| `showLoginLink` | `boolean` | `true` | Show login link |

### Access Denied Page

The `/access-denied` route provides a full-page 403 experience:

```
/access-denied?reason=Only%20officers%20can%20access%20this&required=Officer%20role
```

Query parameters:

- `reason`: Explanation of why access was denied
- `required`: What access level is needed

## Error Handling

User-friendly error messages are provided by the auth error handling system:

```typescript
import { getFriendlyAuthError } from "@/lib/auth";

try {
  await loginWithPasskey();
} catch (error) {
  const friendly = getFriendlyAuthError(error);
  showToast({
    title: friendly.title,
    message: friendly.message,
    action: friendly.action,
  });
}
```

### Error Code Mapping

| Error Code | User-Friendly Message |
|------------|----------------------|
| `PASSKEY_NOT_SUPPORTED` | "Your browser doesn't support passkeys" |
| `PASSKEY_CANCELLED` | "You cancelled the passkey prompt" |
| `PASSKEY_TIMEOUT` | "The passkey prompt timed out" |
| `CHALLENGE_EXPIRED` | "Your session expired. Please try again." |
| `SESSION_EXPIRED` | "Your session has expired. Please sign in again." |
| `MAGIC_LINK_EXPIRED` | "This sign-in link has expired" |
| `RATE_LIMITED` | "Too many attempts. Please wait a moment." |

## Testing

### Unit Tests

```bash
npm run test:unit -- tests/unit/hooks/useCurrentUser.test.ts
```

### E2E Tests

```bash
npx playwright test tests/e2e/auth-capability-access.spec.ts
```

Test scenarios:

- Navigation hides items user cannot access
- Buttons disable when user lacks capability
- Access denied page displays correctly
- Role badge displays correct role name
