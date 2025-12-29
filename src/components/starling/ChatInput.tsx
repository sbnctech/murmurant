// Copyright (c) Murmurant, Inc.
// Chat input component with voice support

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useVoice } from "@/lib/starling/useVoice";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Chat input with send button and voice support
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask Starling anything...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [voiceState, voiceControls] = useVoice({
    onTranscript: (transcript) => {
      // When voice recognition completes, send the message
      if (transcript.trim()) {
        onSend(transcript.trim());
      }
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Use interim transcript directly for display (no effect needed)
  // The final transcript is handled by onTranscript callback above
  const displayMessage = voiceState.isListening && voiceState.interimTranscript
    ? voiceState.interimTranscript
    : message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    setMessage("");
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceClick = () => {
    if (voiceState.isListening) {
      voiceControls.stopListening();
    } else {
      voiceControls.startListening();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-3 flex items-end gap-2"
    >
      <textarea
        ref={textareaRef}
        value={displayMessage}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          voiceState.isListening ? "Listening..." : placeholder
        }
        disabled={disabled || voiceState.isListening}
        rows={1}
        className={`
          flex-1 resize-none rounded-xl border
          px-4 py-2.5 text-sm
          focus:outline-none focus:border-[#1a365d] focus:ring-1 focus:ring-[#1a365d]/20
          disabled:opacity-50 disabled:cursor-not-allowed
          placeholder:text-gray-400
          ${voiceState.isListening ? "border-red-400 bg-red-50" : "border-gray-200"}
        `}
        style={{ maxHeight: "120px" }}
      />

      {/* Voice button */}
      {voiceState.recognitionSupported && (
        <button
          type="button"
          disabled={disabled}
          onClick={handleVoiceClick}
          className={`
            p-2.5 rounded-xl transition-colors
            ${
              voiceState.isListening
                ? "bg-red-500 text-white animate-pulse"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }
            disabled:opacity-50
          `}
          title={voiceState.isListening ? "Stop listening" : "Voice input"}
          aria-label={voiceState.isListening ? "Stop listening" : "Start voice input"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {voiceState.isListening ? (
              // Stop icon
              <rect x="4" y="4" width="12" height="12" rx="1" fill="currentColor" />
            ) : (
              // Microphone icon
              <>
                <path d="M10 2v12M10 2a3 3 0 013 3v4a3 3 0 01-6 0V5a3 3 0 013-3z" />
                <path d="M5 9v1a5 5 0 0010 0V9" />
                <path d="M10 18v-4" />
              </>
            )}
          </svg>
        </button>
      )}

      {/* Send button */}
      <button
        type="submit"
        disabled={disabled || !message.trim() || voiceState.isListening}
        className={`
          p-2.5 rounded-xl transition-colors
          ${
            message.trim() && !disabled && !voiceState.isListening
              ? "bg-[#1a365d] hover:bg-[#1e40af] text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
        title="Send message"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M18 2L9 11M18 2l-7 18-3-7-7-3 17-8z"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Voice error display */}
      {voiceState.error && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-3">
          <div className="bg-red-100 border border-red-300 text-red-700 text-xs p-2 rounded-lg">
            {voiceState.error}
            <button
              type="button"
              onClick={voiceControls.clearError}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export default ChatInput;
