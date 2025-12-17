import { ReactNode } from "react";

/**
 * FormRow - Token-based form row component
 *
 * Provides consistent styling for form field rows with:
 * - Label
 * - Input/control slot
 * - Optional help text
 * - Optional error message
 *
 * Props:
 * - label: Field label text
 * - htmlFor: ID of the associated input
 * - children: Form control (input, select, etc.)
 * - helpText: Optional help text below the control
 * - error: Optional error message
 * - required: Shows required indicator
 */

type FormRowProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  helpText?: string;
  error?: string;
  required?: boolean;
  testId?: string;
};

export default function FormRow({
  label,
  htmlFor,
  children,
  helpText,
  error,
  required = false,
  testId = "form-row",
}: FormRowProps) {
  return (
    <div
      data-test-id={testId}
      style={{
        marginBottom: "var(--token-space-lg)",
      }}
    >
      {/* Label */}
      <label
        htmlFor={htmlFor}
        data-test-id={`${testId}-label`}
        style={{
          display: "block",
          fontSize: "var(--token-text-sm)",
          fontWeight: "var(--token-weight-medium)",
          color: "var(--token-color-text)",
          marginBottom: "var(--token-space-xs)",
        }}
      >
        {label}
        {required && (
          <span
            style={{
              color: "var(--token-color-danger)",
              marginLeft: "var(--token-space-xs)",
            }}
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      {/* Control */}
      <div data-test-id={`${testId}-control`}>{children}</div>

      {/* Help text */}
      {helpText && !error && (
        <p
          data-test-id={`${testId}-help`}
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-text-muted)",
            marginTop: "var(--token-space-xs)",
            marginBottom: 0,
          }}
        >
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          data-test-id={`${testId}-error`}
          role="alert"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-danger)",
            marginTop: "var(--token-space-xs)",
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
