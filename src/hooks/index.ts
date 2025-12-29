/**
 * Hooks Module
 *
 * Reusable React hooks for Murmurant.
 */

export {
  useCurrentUser,
  useCurrentUserContext,
  CurrentUserProvider,
  getRoleDisplayName,
  type CurrentUser,
  type UseCurrentUserResult,
} from "./useCurrentUser";

export {
  useTheme,
  usePublicTheme,
  useMemberTheme,
  useThemeToken,
  ThemeProvider,
  PublicLayoutProvider,
  MemberLayoutProvider,
} from "./useTheme";

export {
  useNewsPreferences,
  buildNewsQueryString,
  type NewsPreferences,
  type NewsSource,
  type UseNewsPreferencesReturn,
} from "./useNewsPreferences";
