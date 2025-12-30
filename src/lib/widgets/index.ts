/**
 * Widget System
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Provides extensible widget storage with schema validation
 * and an approval workflow for new widget types.
 */

// Validation
export {
  validateWidgetType,
  type ValidationResult,
  type ValidationIssue,
  type ValidationSeverity,
  type WidgetTypeInput,
} from "./validation";

// Schema CRUD
export {
  // Widget Type CRUD
  createWidgetType,
  getWidgetTypeById,
  getWidgetTypeBySlug,
  listWidgetTypes,
  updateWidgetType,
  deleteWidgetType,
  // Widget Type Workflow
  submitForValidation,
  resetToDraft,
  approveWidgetType,
  rejectWidgetType,
  deprecateWidgetType,
  // Widget Data CRUD
  setWidgetData,
  getWidgetData,
  listWidgetData,
  deleteWidgetData,
  validateWidgetData,
  // Stats
  getWidgetTypeStats,
  // Types
  type CreateWidgetTypeInput,
  type UpdateWidgetTypeInput,
  type WidgetDataInput,
  type WidgetTypeStats,
} from "./schema";
