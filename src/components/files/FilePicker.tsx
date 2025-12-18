"use client";

/**
 * FilePicker Component
 *
 * A reusable file picker widget for selecting files from the file storage system.
 * Can be embedded in admin or officer pages.
 *
 * Features:
 * - Lists files user is authorized to see
 * - Search by filename
 * - Filter by tag
 * - Single or multi-select modes
 * - File upload support
 *
 * Usage:
 * ```tsx
 * <FilePicker
 *   onSelect={(files) => console.log(files)}
 *   multiple={true}
 *   allowedMimeTypes={["image/*", "application/pdf"]}
 * />
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";

// Types
interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  uploadedBy: { id: string; name: string } | null;
  createdAt: string;
}

interface FilePickerProps {
  /** Called when files are selected */
  onSelect?: (files: FileItem[]) => void;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Pre-selected file IDs */
  selectedIds?: string[];
  /** Filter by MIME type patterns (e.g., "image/*", "application/pdf") */
  allowedMimeTypes?: string[];
  /** Filter by tags */
  filterTags?: string[];
  /** Show upload button */
  allowUpload?: boolean;
  /** Max height for the file list (CSS value) */
  maxHeight?: string;
  /** Placeholder text when no files */
  emptyMessage?: string;
  /** Test ID for E2E testing */
  testId?: string;
}

// Styles
const styles = {
  container: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    overflow: "hidden",
  } as React.CSSProperties,
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    backgroundColor: "#f9fafb",
  } as React.CSSProperties,
  searchRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  } as React.CSSProperties,
  searchInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  } as React.CSSProperties,
  tagSelect: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    minWidth: "120px",
  } as React.CSSProperties,
  uploadButton: {
    padding: "8px 16px",
    backgroundColor: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  } as React.CSSProperties,
  fileList: {
    overflowY: "auto",
  } as React.CSSProperties,
  fileItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    transition: "background-color 0.1s",
  } as React.CSSProperties,
  fileItemSelected: {
    backgroundColor: "#e8f4fd",
  } as React.CSSProperties,
  fileItemHover: {
    backgroundColor: "#f5f5f5",
  } as React.CSSProperties,
  checkbox: {
    marginRight: "12px",
    width: "18px",
    height: "18px",
  } as React.CSSProperties,
  fileInfo: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  fileName: {
    fontWeight: 500,
    fontSize: "14px",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,
  fileMeta: {
    fontSize: "12px",
    color: "#666",
    marginTop: "2px",
  } as React.CSSProperties,
  fileIcon: {
    width: "32px",
    height: "32px",
    marginRight: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#666",
  } as React.CSSProperties,
  tagBadge: {
    display: "inline-block",
    padding: "2px 6px",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    borderRadius: "4px",
    fontSize: "11px",
    marginRight: "4px",
  } as React.CSSProperties,
  emptyState: {
    padding: "40px 16px",
    textAlign: "center",
    color: "#666",
  } as React.CSSProperties,
  loading: {
    padding: "40px 16px",
    textAlign: "center",
    color: "#999",
  } as React.CSSProperties,
  footer: {
    padding: "12px 16px",
    borderTop: "1px solid #eee",
    backgroundColor: "#f9fafb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,
  pagination: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  } as React.CSSProperties,
  paginationButton: {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  } as React.CSSProperties,
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,
  selectionInfo: {
    fontSize: "13px",
    color: "#666",
  } as React.CSSProperties,
};

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽️";
  return "📁";
}

function matchesMimeType(fileMime: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;

  return patterns.some((pattern) => {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1);
      return fileMime.startsWith(prefix);
    }
    return fileMime === pattern;
  });
}

export default function FilePicker({
  onSelect,
  multiple = false,
  selectedIds = [],
  allowedMimeTypes = [],
  filterTags = [],
  allowUpload = true,
  maxHeight = "400px",
  emptyMessage = "No files found",
  testId = "file-picker",
}: FilePickerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
      });

      if (search) params.set("search", search);
      if (tagFilter) params.set("tag", tagFilter);

      // Apply MIME type filter if single type
      if (allowedMimeTypes.length === 1 && !allowedMimeTypes[0].includes("*")) {
        params.set("mimeType", allowedMimeTypes[0]);
      }

      const response = await fetch(`/api/v1/files?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();

      // Client-side MIME type filtering for patterns
      let filteredFiles = data.files;
      if (allowedMimeTypes.length > 0) {
        filteredFiles = filteredFiles.filter((f: FileItem) =>
          matchesMimeType(f.mimeType, allowedMimeTypes)
        );
      }

      // Apply tag filters
      if (filterTags.length > 0) {
        filteredFiles = filteredFiles.filter((f: FileItem) =>
          filterTags.some((tag) => f.tags.includes(tag))
        );
      }

      setFiles(filteredFiles);
      setTotalPages(data.pagination.totalPages);

      // Collect unique tags
      const tags = new Set<string>();
      filteredFiles.forEach((f: FileItem) => f.tags.forEach((t) => tags.add(t)));
      setAvailableTags(Array.from(tags).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, tagFilter, allowedMimeTypes, filterTags]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchFiles();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, tagFilter, fetchFiles]);

  // Initial load
  useEffect(() => {
    fetchFiles();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle selection
  const handleSelect = (file: FileItem) => {
    const newSelected = new Set(selected);

    if (multiple) {
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
    } else {
      newSelected.clear();
      newSelected.add(file.id);
    }

    setSelected(newSelected);

    if (onSelect) {
      const selectedFiles = files.filter((f) => newSelected.has(f.id));
      onSelect(selectedFiles);
    }
  };

  // Handle upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/v1/files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Upload failed");
      }

      // Refresh file list
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div style={styles.container} data-testid={testId}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.searchRow}>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
            data-testid={`${testId}-search`}
          />
          {availableTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              style={styles.tagSelect}
              data-testid={`${testId}-tag-filter`}
            >
              <option value="">All tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
          {allowUpload && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={styles.uploadButton}
                disabled={uploading}
                data-testid={`${testId}-upload-btn`}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                style={{ display: "none" }}
                accept={allowedMimeTypes.join(",")}
              />
            </>
          )}
        </div>
      </div>

      {/* File List */}
      <div style={{ ...styles.fileList, maxHeight }} data-testid={`${testId}-list`}>
        {loading && (
          <div style={styles.loading as React.CSSProperties}>Loading files...</div>
        )}

        {error && (
          <div style={{ ...styles.emptyState as React.CSSProperties, color: "#c53030" }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div style={styles.emptyState as React.CSSProperties}>{emptyMessage}</div>
        )}

        {!loading &&
          !error &&
          files.map((file) => {
            const isSelected = selected.has(file.id);
            const isHovered = hoveredId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => handleSelect(file)}
                onMouseEnter={() => setHoveredId(file.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...styles.fileItem,
                  ...(isSelected ? styles.fileItemSelected : {}),
                  ...(isHovered && !isSelected ? styles.fileItemHover : {}),
                }}
                data-testid={`${testId}-item-${file.id}`}
              >
                {multiple && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={styles.checkbox}
                  />
                )}
                <div style={styles.fileIcon}>{getFileIcon(file.mimeType)}</div>
                <div style={styles.fileInfo}>
                  <div style={styles.fileName as React.CSSProperties}>{file.name}</div>
                  <div style={styles.fileMeta}>
                    {formatFileSize(file.size)} • {file.mimeType}
                    {file.tags.length > 0 && (
                      <span style={{ marginLeft: "8px" }}>
                        {file.tags.slice(0, 3).map((tag) => (
                          <span key={tag} style={styles.tagBadge}>
                            {tag}
                          </span>
                        ))}
                        {file.tags.length > 3 && (
                          <span style={{ color: "#999" }}>+{file.tags.length - 3}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.selectionInfo}>
          {selected.size > 0
            ? `${selected.size} file${selected.size > 1 ? "s" : ""} selected`
            : "No files selected"}
        </div>
        <div style={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...styles.paginationButton,
              ...(page === 1 ? styles.paginationButtonDisabled : {}),
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: "13px", color: "#666" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              ...styles.paginationButton,
              ...(page === totalPages ? styles.paginationButtonDisabled : {}),
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
