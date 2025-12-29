"use client";

// Copyright (c) Murmurant, Inc.
// React hook for voice input/output in Starling

import { useState, useCallback, useRef, useEffect } from "react";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognition,
  speak,
  stopSpeaking,
  findBestVoice,
  type VoiceConfig,
  type SpeechResult,
  DEFAULT_VOICE_CONFIG,
} from "./voice";

/**
 * Voice state
 */
export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  speechSupported: boolean;
  recognitionSupported: boolean;
}

/**
 * Voice controls
 */
export interface VoiceControls {
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  clearTranscript: () => void;
  clearError: () => void;
}

/**
 * useVoice hook options
 */
export interface UseVoiceOptions {
  onTranscript?: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  voiceConfig?: VoiceConfig;
  autoSubmit?: boolean;
}

/**
 * Hook for voice input/output
 */
export function useVoice(options: UseVoiceOptions = {}): [VoiceState, VoiceControls] {
  const { onTranscript, onInterimTranscript, onError, voiceConfig, autoSubmit = true } =
    options;

  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: "",
    interimTranscript: "",
    error: null,
    speechSupported: false,
    recognitionSupported: false,
  });

  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const speechSupported = isSpeechSynthesisSupported();
    const recognitionSupported = isSpeechRecognitionSupported();

    setState((prev) => ({
      ...prev,
      speechSupported,
      recognitionSupported,
    }));

    // Pre-load best voice
    if (speechSupported) {
      findBestVoice(voiceConfig?.language ?? "en-US").then((voice) => {
        voiceRef.current = voice;
      });
    }
  }, [voiceConfig?.language]);

  // Create recognition instance
  useEffect(() => {
    if (!state.recognitionSupported) return;

    try {
      const recognition = createSpeechRecognition(voiceConfig ?? DEFAULT_VOICE_CONFIG);

      recognition.onResult((result: SpeechResult) => {
        if (result.isFinal) {
          setState((prev) => ({
            ...prev,
            transcript: result.transcript,
            interimTranscript: "",
          }));
          onTranscript?.(result.transcript);
        } else {
          setState((prev) => ({
            ...prev,
            interimTranscript: result.transcript,
          }));
          onInterimTranscript?.(result.transcript);
        }
      });

      recognition.onError((error: string) => {
        setState((prev) => ({
          ...prev,
          error,
          isListening: false,
        }));
        onError?.(error);
      });

      recognition.onEnd(() => {
        setState((prev) => ({
          ...prev,
          isListening: false,
        }));
      });

      recognitionRef.current = recognition;
    } catch {
      // Recognition not supported
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, [state.recognitionSupported, voiceConfig, onTranscript, onInterimTranscript, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setState((prev) => ({
      ...prev,
      isListening: true,
      transcript: "",
      interimTranscript: "",
      error: null,
    }));

    recognitionRef.current.start();
  }, []);

  const stopListeningFn = useCallback(() => {
    recognitionRef.current?.stop();
    setState((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, []);

  const speakFn = useCallback(
    async (text: string) => {
      if (!state.speechSupported) return;

      setState((prev) => ({ ...prev, isSpeaking: true }));

      try {
        const config: VoiceConfig = {
          ...DEFAULT_VOICE_CONFIG,
          ...voiceConfig,
        };

        if (voiceRef.current) {
          config.voiceName = voiceRef.current.name;
        }

        await speak(text, config);
      } finally {
        setState((prev) => ({ ...prev, isSpeaking: false }));
      }
    },
    [state.speechSupported, voiceConfig]
  );

  const stopSpeakingFn = useCallback(() => {
    stopSpeaking();
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: "",
      interimTranscript: "",
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return [
    state,
    {
      startListening,
      stopListening: stopListeningFn,
      speak: speakFn,
      stopSpeaking: stopSpeakingFn,
      clearTranscript,
      clearError,
    },
  ];
}
