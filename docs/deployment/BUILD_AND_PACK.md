# Build and Pack

Documentation for building distributable packages from ClubOS.

---

## Evaluation Packet ZIP

The evaluation packet is a curated collection of documentation for board review.

### Building the Packet

```bash
./scripts/pkg/build-eval-zip.zsh
```

### Output

The script creates a ZIP file in `~/Downloads/`:

```
ClubOS_Evaluation_Packet_<SHA>_<YYYYMMDD>.zip
```

Example: `ClubOS_Evaluation_Packet_abc1234_20251226.zip`

### Contents

The packet includes a curated set of documents:

| Category | Purpose |
|----------|---------|
| Board Evaluation | Documents prepared for board review |
| Business Model | Core business model and governance |
| Architecture | High-level trust surface contracts |
| Operator Trust | Documentation for operators |

Plus two generated index files:

- `README.md` - How to use the packet
- `INCLUDED_FILES.txt` - Complete file manifest

### Curated File List

The script uses a hardcoded file list for reliability. To modify which files are included, edit the arrays in `scripts/pkg/build-eval-zip.zsh`:

```zsh
# Board evaluation documents
EVAL_DOCS=(
  "docs/BIZ/BOARD_EMAIL_EVALUATION_REQUEST.md"
  "docs/BIZ/BOARD_NARRATIVE_VARIANT.md"
  # ... etc
)
```

### Why Hardcoded Lists?

Pattern-based file selection (e.g., `docs/BIZ/*.md`) is fragile:

- May include draft or WIP documents
- Breaks when files are moved or renamed
- Risk of missing important files that don't match patterns
- Difficult to audit what's included

Hardcoded lists provide:

- Explicit control over packet contents
- Clear audit trail (list is in source control)
- Failures are visible (missing files are reported)
- Intentional updates when docs change

---

## macOS Compatibility

The build script uses only macOS-native commands:

| Command | Purpose |
|---------|---------|
| `date` | Timestamps (BSD date syntax) |
| `stat` | File size (BSD stat syntax) |
| `mktemp` | Temporary directory |
| `ditto` | ZIP creation (macOS native) |

No GNU coreutils required.

---

## Verifying the Package

List contents without extracting:

```bash
unzip -l ~/Downloads/ClubOS_Evaluation_Packet_*.zip
```

Extract to verify:

```bash
unzip ~/Downloads/ClubOS_Evaluation_Packet_*.zip -d /tmp/eval-verify
```

---

## Troubleshooting

### Script fails with "Not inside a git repository"

Run from within the ClubOS repository:

```bash
cd /path/to/clubos
./scripts/pkg/build-eval-zip.zsh
```

### Missing files reported

If files are listed as missing, either:

1. The file was removed from the repo (update the script)
2. The file was renamed (update the script)
3. You're on a branch without that file (switch to main)

### ZIP already exists

The script automatically removes existing ZIPs with the same name before creating a new one.

---

## Related

- [Evaluation Charter](../BIZ/EVALUATION_CHARTER.md)
- [Board Email](../BIZ/BOARD_EMAIL_EVALUATION_REQUEST.md)
