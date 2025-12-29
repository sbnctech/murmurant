// Copyright (c) Murmurant, Inc.
// Starling chatbot - public API

// Types
export type {
  PageContext,
  EntityContext,
  SelectionContext,
  AvailableAction,
  FormFieldSpec,
  StagingPayload,
  StagingMetadata,
  ChatMessage,
  Conversation,
  Intent,
  EntitySlot,
  DetectedIntent,
  ActionPlan,
  ActionType,
  WizardStep,
  ChatRequest,
  ChatResponse,
  StarlingAuditEntry,
} from "./types";

// Provider and hooks
export {
  StarlingProvider,
  useStarling,
  useStarlingAvailable,
} from "./StarlingProvider";

export { useStarlingContext, ActionTriggers } from "./useStarlingContext";

export { useStagedForm, StarlingStyles } from "./useStagedForm";

// LLM integration
export { callLLM, buildSystemPrompt, parseResponse } from "./llm";
export type { LLMConfig, ParsedResponse } from "./llm";

// RAG pipeline
export { searchKnowledge, getRAGContext, formatRetrievedDocs } from "./rag";
export type { RetrievedDocument } from "./rag";

// Embeddings
export { generateEmbedding, generateEmbeddings, chunkText } from "./embeddings";
export type { EmbeddingConfig, DocumentChunk } from "./embeddings";

// Knowledge indexer (server-side only)
export {
  indexFile,
  indexDirectory,
  indexMurmurantDocs,
  indexOperatorDocs,
  clearOperatorKnowledge,
  reindexSource,
  formatIndexReport,
} from "./indexer";
export type { IndexConfig, IndexResult } from "./indexer";

// Intent detection and handling
export {
  detectIntent,
  generateActionPlan,
  formatEventsForChat,
} from "./intents";

// Voice support (client-side only)
export {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speak,
  stopSpeaking,
  getAvailableVoices,
  waitForVoices,
  findBestVoice,
  DEFAULT_VOICE_CONFIG,
} from "./voice";
export type { VoiceConfig, SpeechResult } from "./voice";

export { useVoice } from "./useVoice";
export type { VoiceState, VoiceControls, UseVoiceOptions } from "./useVoice";
