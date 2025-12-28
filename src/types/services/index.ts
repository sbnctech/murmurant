/**
 * Service Types - Barrel Export
 */

export type {
  AuthService,
  AuthSession,
  AuthUser,
  AuthContext,
  ImpersonationContext,
  CreateSessionInput,
} from "./auth";

export type {
  MemberService,
  MemberProfile,
  MemberSummary,
  UpdateMemberInput,
  LifecycleState,
  LifecycleExplanation,
} from "./member";

export type {
  EventService,
  Event,
  EventSummary,
  EventStatus,
  CreateEventInput,
  UpdateEventInput,
  EventRegistration,
  RegistrationStatus,
  RegisterInput,
  CancelRegistrationInput,
} from "./event";

export type {
  PaymentService,
  Payment,
  PaymentIntent,
  PaymentStatus,
  PaymentType,
  CreatePaymentInput,
  DuesBalance,
  DuesPaymentInput,
} from "./payment";

export type {
  EmailService,
  EmailMessage,
  EmailRecipient,
  EmailStatus,
  EmailTemplate,
  SendEmailInput,
  SendTemplateInput,
  CreateTemplateInput,
} from "./email";

export type {
  RBACService,
  Permission,
  PermissionCheck,
  PermissionResult,
  RoleDefinition,
  RoleAssignment,
  AssignRoleInput,
  RBACContext,
} from "./rbac";

export type {
  ServiceRegistry,
  ServiceConfig,
  ServiceFactory,
  ServiceFactoryRegistry,
} from "./ServiceRegistry";
