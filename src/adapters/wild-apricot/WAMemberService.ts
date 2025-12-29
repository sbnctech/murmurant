/**
 * Wild Apricot Member Service
 *
 * Handles member data synchronization between Murmurant and Wild Apricot.
 */

import {
  loadWAConfig,
  WA_ENDPOINTS,
  WA_SYNC_DEFAULTS,
  type WAConfig,
} from "./config";
import { WAAuthService, getWAAuthService } from "./WAAuthService";
import { WAApiException } from "@/lib/importing/wildapricot/types";
import type { WAContact, WAMember, WAPaginatedResponse } from "./types";

/**
 * WA Member Service
 *
 * Provides member sync operations with Wild Apricot.
 */
export class WAMemberService {
  private config: WAConfig;
  private authService: WAAuthService;

  constructor(config?: WAConfig, authService?: WAAuthService) {
    this.config = config ?? loadWAConfig();
    this.authService = authService ?? getWAAuthService();
  }

  /**
   * Fetch all contacts from Wild Apricot
   */
  async fetchAllContacts(): Promise<WAContact[]> {
    const token = await this.authService.getToken();
    const contacts: WAContact[] = [];
    let skip = 0;
    const top = WA_SYNC_DEFAULTS.contactsPerPage;

    while (true) {
      const url = new URL(
        `${this.config.baseUrl}/${this.config.apiVersion}${WA_ENDPOINTS.contacts(token.accountId)}`
      );
      url.searchParams.set("$top", String(top));
      url.searchParams.set("$skip", String(skip));
      url.searchParams.set("$async", "false");

      const response = await this.makeRequest<WAPaginatedResponse<WAContact>>(
        url.toString()
      );

      const batch = response.Contacts ?? response.Items ?? [];
      contacts.push(...batch);

      if (batch.length < top) {
        break;
      }
      skip += top;
    }

    return contacts;
  }

  /**
   * Fetch a single contact by ID
   */
  async fetchContact(contactId: number): Promise<WAContact> {
    const token = await this.authService.getToken();
    const url = `${this.config.baseUrl}/${this.config.apiVersion}${WA_ENDPOINTS.contact(token.accountId, contactId)}`;
    return this.makeRequest<WAContact>(url);
  }

  /**
   * Transform WAContact to normalized WAMember
   */
  transformToMember(contact: WAContact): WAMember {
    const customFields: Record<string, unknown> = {};
    for (const field of contact.FieldValues ?? []) {
      customFields[field.SystemCode || field.FieldName] = field.Value;
    }

    return {
      waId: contact.Id,
      email: contact.Email,
      firstName: contact.FirstName,
      lastName: contact.LastName,
      displayName: contact.DisplayName,
      membershipLevel: contact.MembershipLevel?.Name ?? null,
      membershipLevelId: contact.MembershipLevel?.Id ?? null,
      status: contact.Status,
      memberSince: contact.MemberSince ? new Date(contact.MemberSince) : null,
      renewalDue: contact.RenewalDue ? new Date(contact.RenewalDue) : null,
      isSuspended: contact.IsSuspendedMember,
      isAdmin: contact.IsAccountAdministrator,
      balance: contact.Balance ?? 0,
      customFields,
    };
  }

  /**
   * Fetch all contacts and transform to WAMember format
   */
  async fetchAllMembers(): Promise<WAMember[]> {
    const contacts = await this.fetchAllContacts();
    return contacts.map((c) => this.transformToMember(c));
  }

  private async makeRequest<T>(url: string): Promise<T> {
    const accessToken = await this.authService.getAccessToken();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new WAApiException(
        `WA API error: ${response.status}`,
        response.status,
        "API_ERROR",
        errorText
      );
    }

    return response.json();
  }
}

// Singleton instance
let defaultInstance: WAMemberService | null = null;

/**
 * Get the default WAMemberService instance
 */
export function getWAMemberService(): WAMemberService {
  if (!defaultInstance) {
    defaultInstance = new WAMemberService();
  }
  return defaultInstance;
}

/**
 * Reset the default instance (for testing)
 */
export function resetWAMemberService(): void {
  defaultInstance = null;
}
