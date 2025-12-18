"use client";

/**
 * FileUpload Component
 *
 * A standalone file upload widget.
 *
 * Usage:
 * ```tsx
 * <FileUpload
 *   onUpload={(file) => console.log("Uploaded:", file)}
 *   allowedMimeTypes={["application/pdf"]}
 *   tags={["governance", "minutes"]}
 * />
 * ```
 */

import { useState, useRef } from "react";

interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface FileUploadProps {
  /** Called when file is successfully uploaded */
  onUpload?: (file: UploadedFile) => void;
  /** Called on upload error */
  onError?: (error: string) => void;
  /** Allowed MIME types */
  allowedMimeTypes?: string[];
  /** Tags to apply to uploaded files */
  tags?: string[];
  /** Roles to grant READ access */
  grantRoles?: string[];
  /** File description */
  description?: string;
  /** Make file public (requires files:manage) */
  isPublic?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID */
  testId?: string;
}

const styles = {
  container: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
  } as React.CSSProperties,
  button: {
    padding: "10px 20px",
    backgroundColor: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background-color 0.2s",
  } as React.CSSProperties,
  buttonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  } as React.CSSProperties,
  status: {
    fontSize: "14px",
    color: "#666",
  } as React.CSSProperties,
  error: {
    fontSize: "14px",
    color: "#c53030",
  } as React.CSSProperties,
  success: {
    fontSize: "14px",
    color: "#059669",
  } as React.CSSProperties,
  dropZone: {
    border: "2px dashed #ddd",
    borderRadius: "8px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
  } as React.CSSProperties,
  dropZoneActive: {
    borderColor: "#0066cc",
    backgroundColor: "#f0f7ff",
  } as React.CSSProperties,
  dropZoneText: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "8px",
  } as React.CSSProperties,
  dropZoneHint: {
    fontSize: "12px",
    color: "#999",
  } as React.CSSProperties,
};

export default function FileUpload({
  onUpload,
  onError,
  allowedMimeTypes = [],
  tags = [],
  grantRoles = [],
  description = "",
  isPublic = false,
  disabled = false,
  testId = "file-upload",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (description) {
        formData.append("description", description);
      }

      if (tags.length > 0) {
        formData.append("tags", tags.join(","));
      }

      if (grantRoles.length > 0) {
        formData.append("grantRoles", grantRoles.join(","));
      }

      if (isPublic) {
        formData.append("isPublic", "true");
      }

      const response = await fetch("/api/v1/files", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(`Uploaded: ${data.file.name}`);

      if (onUpload) {
        onUpload(data.file);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);

      if (onError) {
        onError(message);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const acceptTypes = allowedMimeTypes.length > 0 ? allowedMimeTypes.join(",") : undefined;

  return (
    <div data-testid={testId}>
      {/* Drop Zone */}
      <div
        style={{
          ...styles.dropZone,
          ...(dragActive ? styles.dropZoneActive : {}),
        }}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        data-testid={`${testId}-dropzone`}
      >
        <div style={styles.dropZoneText}>
          {uploading ? "Uploading..." : "Drop a file here or click to select"}
        </div>
        <div style={styles.dropZoneHint}>
          {allowedMimeTypes.length > 0
            ? `Allowed: ${allowedMimeTypes.join(", ")}`
            : "PDF, Word, Excel, images supported"}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={acceptTypes}
        disabled={disabled || uploading}
        style={{ display: "none" }}
        data-testid={`${testId}-input`}
      />

      {/* Status */}
      {error && (
        <div style={styles.error} data-testid={`${testId}-error`}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={styles.success} data-testid={`${testId}-success`}>
          ✅ {success}
        </div>
      )}
    </div>
  );
}
