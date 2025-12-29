// Copyright (c) Murmurant, Inc.
// Starling chat drawer component

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStarling } from "@/lib/starling";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position: "bottom-right" | "bottom-left";
}

/**
 * Slide-out chat drawer
 */
export function ChatDrawer({ isOpen, onClose, position }: ChatDrawerProps) {
  const { conversation, sendMessage, isLoading, clearConversation } =
    useStarling();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, conversation?.messages.length]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSend = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const positionClasses =
    position === "bottom-right"
      ? "right-4 bottom-20"
      : "left-4 bottom-20";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed ${positionClasses} z-50
          w-[380px] max-w-[calc(100vw-2rem)]
          h-[500px] max-h-[calc(100vh-8rem)]
          bg-white rounded-xl shadow-2xl
          flex flex-col
          transform transition-all duration-300 ease-out
          ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
        `}
        role="dialog"
        aria-label="Starling assistant"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1a365d] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="6" r="1.5" fill="white" opacity="0.8" />
                <circle cx="8" cy="5" r="2" fill="white" />
                <circle cx="12" cy="7" r="1.5" fill="white" opacity="0.7" />
                <circle cx="6" cy="10" r="1.5" fill="white" opacity="0.9" />
                <circle cx="10" cy="11" r="1" fill="white" opacity="0.6" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Starling</h2>
              <p className="text-xs text-gray-500">Murmurant Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {conversation && conversation.messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Clear conversation"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 4L4 12M4 4l8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!conversation || conversation.messages.length === 0 ? (
            <WelcomeMessage />
          ) : (
            conversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <LoadingDots />
              <span>Starling is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </>
  );
}

/**
 * Welcome message for new conversations
 */
function WelcomeMessage() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a365d]/10 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="8" cy="12" r="3" fill="#1a365d" opacity="0.8" />
          <circle cx="16" cy="10" r="4" fill="#1a365d" />
          <circle cx="24" cy="14" r="3" fill="#1a365d" opacity="0.7" />
          <circle cx="12" cy="20" r="3" fill="#1a365d" opacity="0.9" />
          <circle cx="20" cy="22" r="2" fill="#1a365d" opacity="0.6" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">
        Hi! I&apos;m Starling
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        I can help you find events, register for activities, and answer
        questions.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <SuggestionChip text="What events are coming up?" />
        <SuggestionChip text="How do I update my profile?" />
      </div>
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  const { sendMessage } = useStarling();

  return (
    <button
      onClick={() => sendMessage(text)}
      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
    >
      {text}
    </button>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-[#1a365d] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-[#1a365d] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-[#1a365d] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default ChatDrawer;
