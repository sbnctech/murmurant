/**
 * Event Service Interface Types
 */

export type EventStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "published"
  | "closed"
  | "cancelled"
  | "archived";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  location: string | null;
  status: EventStatus;
  capacity: number | null;
  registrationCount: number;
  waitlistCount: number;
  committeeId: string | null;
  committeeName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventSummary {
  id: string;
  title: string;
  startAt: Date;
  location: string | null;
  status: EventStatus;
  spotsAvailable: number | null;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  capacity?: number;
  committeeId?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startAt?: Date;
  endAt?: Date;
  location?: string;
  capacity?: number;
}

export type RegistrationStatus =
  | "registered"
  | "waitlisted"
  | "cancelled"
  | "attended"
  | "no_show";

export interface EventRegistration {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  status: RegistrationStatus;
  guestCount: number;
  registeredAt: Date;
  cancelledAt: Date | null;
  cancelReason: string | null;
}

export interface RegisterInput {
  eventId: string;
  memberId: string;
  guestCount?: number;
}

export interface CancelRegistrationInput {
  registrationId: string;
  reason?: string;
}

export interface EventService {
  getById(eventId: string): Promise<Event | null>;
  listUpcoming(limit?: number): Promise<EventSummary[]>;
  listByStatus(status: EventStatus, limit?: number): Promise<EventSummary[]>;
  create(data: CreateEventInput, createdById: string): Promise<Event>;
  update(eventId: string, data: UpdateEventInput): Promise<Event>;
  transitionStatus(eventId: string, newStatus: EventStatus): Promise<Event>;
  register(input: RegisterInput): Promise<EventRegistration>;
  cancelRegistration(input: CancelRegistrationInput): Promise<EventRegistration>;
  getRegistrations(eventId: string): Promise<EventRegistration[]>;
  getMemberRegistrations(memberId: string): Promise<EventRegistration[]>;
}
