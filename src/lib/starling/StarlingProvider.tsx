// Copyright (c) Murmurant, Inc.
// Starling context provider

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type {
  PageContext,
  AvailableAction,
  ChatMessage,
  Conversation,
} from "./types";

interface StarlingContextValue {
  /** Whether Starling is available */
  isEnabled: boolean;

  /** Whether chat drawer is open */
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  /** Currently registered page context */
  currentContext: PageContext | null;

  /** Register a page context */
  registerContext: (context: PageContext) => void;

  /** Unregister when page unmounts */
  unregisterContext: (pageId: string) => void;

  /** Check if an action is available */
  isActionAvailable: (actionId: string) => boolean;

  /** Get action spec by ID */
  getAction: (actionId: string) => AvailableAction | undefined;

  /** Current conversation */
  conversation: Conversation | null;

  /** Send a message */
  sendMessage: (message: string) => Promise<ChatMessage>;

  /** Whether a message is being processed */
  isLoading: boolean;

  /** Clear conversation */
  clearConversation: () => void;
}

const StarlingContext = createContext<StarlingContextValue | null>(null);

interface StarlingProviderProps {
  children: React.ReactNode;
  /** User ID (required for conversation persistence) */
  userId?: string;
  /** Whether Starling is enabled for this user */
  enabled?: boolean;
}

export function StarlingProvider({
  children,
  userId,
  enabled = true,
}: StarlingProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<PageContext | null>(
    null
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track context registration to prevent stale updates
  const contextRef = useRef<string | null>(null);

  const registerContext = useCallback((context: PageContext) => {
    contextRef.current = context.page;
    setCurrentContext(context);
  }, []);

  const unregisterContext = useCallback((pageId: string) => {
    // Only unregister if this is the currently registered context
    if (contextRef.current === pageId) {
      contextRef.current = null;
      setCurrentContext(null);
    }
  }, []);

  const isActionAvailable = useCallback(
    (actionId: string) => {
      return (
        currentContext?.availableActions.some((a) => a.id === actionId) ?? false
      );
    },
    [currentContext]
  );

  const getAction = useCallback(
    (actionId: string) => {
      return currentContext?.availableActions.find((a) => a.id === actionId);
    },
    [currentContext]
  );

  const sendMessage = useCallback(
    async (message: string): Promise<ChatMessage> => {
      if (!userId) {
        throw new Error("User must be logged in to use Starling");
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/starling/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId: conversation?.id,
            pageContext: currentContext,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Update conversation with new messages
        setConversation((prev) => {
          const userMessage: ChatMessage = {
            id: `msg_${Date.now()}_user`,
            role: "user",
            content: message,
            timestamp: new Date(),
          };

          if (prev && prev.id === data.conversationId) {
            return {
              ...prev,
              messages: [...prev.messages, userMessage, data.message],
              updatedAt: new Date(),
            };
          }

          // New conversation
          return {
            id: data.conversationId,
            userId,
            messages: [userMessage, data.message],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        return data.message;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, conversation?.id, currentContext]
  );

  const clearConversation = useCallback(() => {
    setConversation(null);
  }, []);

  // Load existing conversation on mount (if user is logged in)
  useEffect(() => {
    if (!userId || !enabled) return;

    async function loadConversation() {
      try {
        const response = await fetch("/api/starling/conversation");
        if (response.ok) {
          const data = await response.json();
          if (data.conversation) {
            setConversation(data.conversation);
          }
        }
      } catch {
        // Ignore errors - conversation loading is optional
      }
    }

    loadConversation();
  }, [userId, enabled]);

  const value: StarlingContextValue = {
    isEnabled: enabled && !!userId,
    isOpen,
    setIsOpen,
    currentContext,
    registerContext,
    unregisterContext,
    isActionAvailable,
    getAction,
    conversation,
    sendMessage,
    isLoading,
    clearConversation,
  };

  return (
    <StarlingContext.Provider value={value}>
      {children}
    </StarlingContext.Provider>
  );
}

/**
 * Hook to access Starling context
 */
export function useStarling(): StarlingContextValue {
  const context = useContext(StarlingContext);
  if (!context) {
    throw new Error("useStarling must be used within a StarlingProvider");
  }
  return context;
}

/**
 * Hook to check if Starling is available (safe to use outside provider)
 */
export function useStarlingAvailable(): boolean {
  const context = useContext(StarlingContext);
  return context?.isEnabled ?? false;
}
