// Copyright (c) Murmurant, Inc.
// Chat message component

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage as ChatMessageType } from "@/lib/starling";

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Individual chat message bubble
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const router = useRouter();
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5
          ${
            isUser
              ? "bg-[#1a365d] text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }
        `}
      >
        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Staging action button */}
        {message.staging && (
          <button
            onClick={() => {
              router.push(
                `${message.staging!.targetRoute}?staging=${message.staging!.stagingId}`
              );
            }}
            className={`
              mt-2 w-full py-2 px-3 rounded-lg text-sm font-medium
              ${
                isUser
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-[#1a365d] hover:bg-[#1e40af] text-white"
              }
              transition-colors
            `}
          >
            {message.staging.buttonLabel}
          </button>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200/20">
            <p className="text-xs opacity-70">
              Sources: {message.sources.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
