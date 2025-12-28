/**
 * Service Registry Interface
 */

import type { AuthService } from "./auth";
import type { MemberService } from "./member";
import type { EventService } from "./event";
import type { PaymentService } from "./payment";
import type { EmailService } from "./email";
import type { RBACService } from "./rbac";

export interface ServiceRegistry {
  auth: AuthService;
  member: MemberService;
  event: EventService;
  payment: PaymentService;
  email: EmailService;
  rbac: RBACService;
}

export interface ServiceConfig {
  environment: "development" | "test" | "production";
  databaseUrl?: string;
  debug?: boolean;
}

export type ServiceFactory<T> = (config: ServiceConfig) => T;

export interface ServiceFactoryRegistry {
  auth: ServiceFactory<AuthService>;
  member: ServiceFactory<MemberService>;
  event: ServiceFactory<EventService>;
  payment: ServiceFactory<PaymentService>;
  email: ServiceFactory<EmailService>;
  rbac: ServiceFactory<RBACService>;
}
