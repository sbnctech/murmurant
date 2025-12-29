// Copyright (c) Murmurant, Inc.
// Voice support for Starling using Web Speech API

// Web Speech API types (not all browsers include these)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/**
 * Voice configuration
 */
export interface VoiceConfig {
  language: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceName?: string;
}

/**
 * Default voice configuration
 */
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  language: "en-US",
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
};

/**
 * Speech recognition result
 */
export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Check if speech recognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Check if speech synthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Get the SpeechRecognition constructor
 */
type SpeechRecognitionConstructor = new () => SpeechRecognitionInterface;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ||
    (
      window as typeof window & {
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition ||
    null
  );
}

/**
 * Create a speech recognition instance
 */
export function createSpeechRecognition(config: VoiceConfig = DEFAULT_VOICE_CONFIG): {
  start: () => void;
  stop: () => void;
  abort: () => void;
  onResult: (callback: (result: SpeechResult) => void) => void;
  onError: (callback: (error: string) => void) => void;
  onEnd: (callback: () => void) => void;
  isListening: () => boolean;
} {
  const SpeechRecognitionClass = getSpeechRecognition();

  if (!SpeechRecognitionClass) {
    throw new Error("Speech recognition not supported in this browser");
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false; // Stop after first result
  recognition.interimResults = true; // Get results as user speaks
  recognition.lang = config.language;
  recognition.maxAlternatives = 1;

  let resultCallback: ((result: SpeechResult) => void) | null = null;
  let errorCallback: ((error: string) => void) | null = null;
  let endCallback: (() => void) | null = null;
  let listening = false;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const result = event.results[event.resultIndex];
    if (resultCallback && result) {
      resultCallback({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal,
      });
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    listening = false;
    if (errorCallback) {
      let message = "Speech recognition error";
      switch (event.error) {
        case "no-speech":
          message = "No speech detected. Please try again.";
          break;
        case "audio-capture":
          message = "No microphone detected. Please check your settings.";
          break;
        case "not-allowed":
          message = "Microphone access denied. Please allow microphone access.";
          break;
        case "network":
          message = "Network error. Please check your connection.";
          break;
        case "aborted":
          message = "Speech recognition aborted.";
          break;
        default:
          message = `Speech recognition error: ${event.error}`;
      }
      errorCallback(message);
    }
  };

  recognition.onend = () => {
    listening = false;
    if (endCallback) {
      endCallback();
    }
  };

  return {
    start: () => {
      if (!listening) {
        listening = true;
        recognition.start();
      }
    },
    stop: () => {
      if (listening) {
        recognition.stop();
        listening = false;
      }
    },
    abort: () => {
      recognition.abort();
      listening = false;
    },
    onResult: (callback) => {
      resultCallback = callback;
    },
    onError: (callback) => {
      errorCallback = callback;
    },
    onEnd: (callback) => {
      endCallback = callback;
    },
    isListening: () => listening,
  };
}

/**
 * Speak text using speech synthesis
 */
export function speak(
  text: string,
  config: VoiceConfig = DEFAULT_VOICE_CONFIG
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language;
    utterance.pitch = config.pitch ?? 1.0;
    utterance.rate = config.rate ?? 1.0;
    utterance.volume = config.volume ?? 1.0;

    // Try to find a matching voice
    if (config.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(
        (v) =>
          v.name === config.voiceName ||
          v.name.toLowerCase().includes(config.voiceName!.toLowerCase())
      );
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error));

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Get available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Wait for voices to be loaded (they load asynchronously)
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Voices load asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    // Fallback timeout
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

/**
 * Find a good default voice for English
 */
export async function findBestVoice(
  language = "en-US"
): Promise<SpeechSynthesisVoice | null> {
  const voices = await waitForVoices();

  // Prefer natural/enhanced voices
  const preferredPatterns = [
    /samantha/i, // macOS
    /google.*us.*english/i, // Chrome
    /microsoft.*aria/i, // Edge
    /natural/i,
    /enhanced/i,
  ];

  // First try to find a preferred voice
  for (const pattern of preferredPatterns) {
    const voice = voices.find(
      (v) => v.lang.startsWith(language.split("-")[0]) && pattern.test(v.name)
    );
    if (voice) {
      return voice;
    }
  }

  // Fall back to any voice for the language
  const voice = voices.find((v) => v.lang.startsWith(language.split("-")[0]));
  return voice ?? null;
}
