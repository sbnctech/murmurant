// Copyright (c) Murmurant, Inc.
// Hook for pages to register context with Starling

"use client";

import { useEffect, useContext, useMemo } from "react";
import type { PageContext } from "./types";
import { useStarling } from "./StarlingProvider";

/**
 * Register page context with Starling
 *
 * @example
 * ```tsx
 * useStarlingContext({
 *   page: 'event-detail',
 *   pageTitle: event.title,
 *   entity: {
 *     type: 'event',
 *     id: event.id,
 *     name: event.title,
 *     data: { date: event.startDate, location: event.location }
 *   },
 *   availableActions: [
 *     {
 *       id: 'register',
 *       label: 'Register for event',
 *       triggers: ['sign me up', 'register', 'join'],
 *       targetRoute: `/events/${event.id}/register`
 *     }
 *   ],
 *   state: { isRegistered: !!registration }
 * });
 * ```
 */
export function useStarlingContext(context: PageContext): void {
  const starling = useStarling();

  // Memoize context to prevent unnecessary re-registrations
  const stableContext = useMemo(
    () => context,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      context.page,
      context.pageTitle,
      context.entity?.id,
      context.selection?.ids.join(","),
      JSON.stringify(context.state),
      JSON.stringify(context.availableActions.map((a) => a.id)),
    ]
  );

  useEffect(() => {
    starling.registerContext(stableContext);

    return () => {
      starling.unregisterContext(stableContext.page);
    };
  }, [starling, stableContext]);
}

/**
 * Helper to build common action triggers
 */
export const ActionTriggers = {
  register: [
    "sign me up",
    "register",
    "join",
    "attend",
    "rsvp yes",
    "add me",
    "i want to go",
  ],
  cancel: [
    "cancel",
    "unregister",
    "remove me",
    "can't make it",
    "rsvp no",
    "drop",
  ],
  edit: ["edit", "change", "update", "modify", "fix"],
  delete: ["delete", "remove", "get rid of"],
  view: ["show", "view", "see", "open", "look at"],
  calendar: ["add to calendar", "calendar", "remind me", "save the date"],
  share: ["share", "send to", "forward"],
} as const;
