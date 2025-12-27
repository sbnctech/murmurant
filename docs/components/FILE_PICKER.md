# FilePicker Component

A reusable, permission-aware file picker widget for embedding in admin and officer pages.

## Overview

The FilePicker component provides:

- **Permission-aware listing**: Only shows files the user is authorized to view
- **Search and filter**: Filter by filename, tag, or MIME type
- **Single or multi-select**: Choose one or multiple files
- **Inline upload**: Optionally upload new files directly
- **Audit compliant**: All file operations are logged

## Quick Start

```tsx
import { FilePicker } from "@/components/files";

function MyPage() {
  const handleSelect = (files) => {
    console.log("Selected files:", files);
  };

  return (
    <FilePicker
      onSelect={handleSelect}
      multiple={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelect` | `(files: FileItem[]) => void` | - | Called when files are selected |
| `multiple` | `boolean` | `false` | Allow selecting multiple files |
| `selectedIds` | `string[]` | `[]` | Pre-selected file IDs |
| `allowedMimeTypes` | `string[]` | `[]` | Filter by MIME type (e.g., `["image/*", "application/pdf"]`) |
| `filterTags` | `string[]` | `[]` | Only show files with these tags |
| `allowUpload` | `boolean` | `true` | Show upload button |
| `maxHeight` | `string` | `"400px"` | Max height of file list |
| `emptyMessage` | `string` | `"No files found"` | Message when no files match |
| `testId` | `string` | `"file-picker"` | Data-testid for E2E testing |

## FileItem Type

```typescript
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
```

## Usage Examples

### Basic Selection

```tsx
<FilePicker
  onSelect={(files) => {
    const fileId = files[0]?.id;
    if (fileId) {
      setSelectedFileId(fileId);
    }
  }}
/>
```

### Images Only

```tsx
<FilePicker
  allowedMimeTypes={["image/*"]}
  onSelect={handleImageSelect}
/>
```

### Documents Only

```tsx
<FilePicker
  allowedMimeTypes={[
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]}
  onSelect={handleDocSelect}
/>
```

### Multi-Select with Tags

```tsx
<FilePicker
  multiple={true}
  filterTags={["governance"]}
  onSelect={(files) => {
    setAttachments(files.map(f => f.id));
  }}
/>
```

### No Upload (View Only)

```tsx
<FilePicker
  allowUpload={false}
  onSelect={handleSelect}
/>
```

### Pre-Selected Files

```tsx
<FilePicker
  selectedIds={existingFileIds}
  multiple={true}
  onSelect={handleSelect}
/>
```

## FileUpload Component

For standalone file uploads without selection, use `FileUpload`:

```tsx
import { FileUpload } from "@/components/files";

<FileUpload
  onUpload={(file) => console.log("Uploaded:", file.id)}
  allowedMimeTypes={["application/pdf"]}
  tags={["governance", "minutes"]}
  grantRoles={["secretary", "president"]}
/>
```

### FileUpload Props

| Prop | Type | Description |
|------|------|-------------|
| `onUpload` | `(file) => void` | Called on successful upload |
| `onError` | `(error: string) => void` | Called on upload error |
| `allowedMimeTypes` | `string[]` | Restrict file types |
| `tags` | `string[]` | Tags to apply to uploaded files |
| `grantRoles` | `string[]` | Roles to grant READ access |
| `description` | `string` | File description |
| `isPublic` | `boolean` | Make file public (requires `files:manage`) |
| `disabled` | `boolean` | Disable the upload control |
| `testId` | `string` | Data-testid for E2E testing |

## Permission Model

### Capabilities Required

| Action | Capability |
|--------|------------|
| Upload files | `files:upload` |
| View all files | `files:view_all` |
| Manage any file | `files:manage` |

### Who Has Upload Access

- `admin` - Full access
- `secretary` - Can upload governance documents
- `parliamentarian` - Can upload governance documents

### File Visibility

Files are visible to users who:

1. Have `files:view_all` capability (admin)
2. Uploaded the file (owner)
3. Have explicit USER access grant
4. Have ROLE access grant matching their role
5. File is marked public (`isPublic: true`)

## API Endpoints

The FilePicker uses these API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/files` | List accessible files |
| POST | `/api/v1/files` | Upload new file |
| GET | `/api/v1/files/[id]` | Get file details |
| PATCH | `/api/v1/files/[id]` | Update file metadata |
| DELETE | `/api/v1/files/[id]` | Delete file |
| GET | `/api/v1/files/[id]/url` | Download file content |

## Embedding in Admin Pages

### In a Form

```tsx
// src/app/admin/meetings/[id]/attachments/page.tsx

import { FilePicker } from "@/components/files";

export default function MeetingAttachments() {
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleSave = async () => {
    await fetch(`/api/admin/meetings/${meetingId}/attachments`, {
      method: "POST",
      body: JSON.stringify({ fileIds: attachments }),
    });
  };

  return (
    <div>
      <h2>Meeting Attachments</h2>
      <FilePicker
        multiple={true}
        filterTags={["governance", "minutes"]}
        allowedMimeTypes={["application/pdf"]}
        onSelect={(files) => setAttachments(files.map(f => f.id))}
      />
      <button onClick={handleSave}>Save Attachments</button>
    </div>
  );
}
```

### In a Modal

```tsx
import { useState } from "react";
import { FilePicker } from "@/components/files";

function FileSelectModal({ isOpen, onClose, onSelect }) {
  const [selected, setSelected] = useState([]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <h3>Select a File</h3>
      <FilePicker
        onSelect={setSelected}
        allowUpload={true}
      />
      <button onClick={() => {
        onSelect(selected);
        onClose();
      }}>
        Confirm
      </button>
    </div>
  );
}
```

## Styling

The component uses inline styles for consistency with the ClubOS admin interface. Key style properties:

- Container: White background, rounded border, shadow
- File items: Hover effect, selected state highlight
- Pagination: Standard button styling

To customize, wrap the component and apply your own container styles:

```tsx
<div style={{ maxWidth: "600px" }}>
  <FilePicker onSelect={handleSelect} />
</div>
```

## Testing

The component includes `data-testid` attributes for E2E testing:

- `file-picker` - Main container
- `file-picker-search` - Search input
- `file-picker-tag-filter` - Tag dropdown
- `file-picker-upload-btn` - Upload button
- `file-picker-list` - File list container
- `file-picker-item-{id}` - Individual file items

Example Playwright test:

```typescript
test("can select a file", async ({ page }) => {
  await page.goto("/admin/documents");
  await page.fill('[data-testid="file-picker-search"]', "policy");
  await page.click('[data-testid^="file-picker-item-"]');
  // Assert selection
});
```

## Related Documentation

- File Authorization (TODO: create architecture/file-authorization.md)
- Audit Logging (TODO: create architecture/audit-logging.md)
- [RBAC Capabilities](../rbac/AUTH_AND_RBAC.md)
