# Wild Apricot WebDAV Investigation

**Status:** CONFIRMED WORKING
**Date:** December 2025
**Investigator:** Murmurant Tech Lead
**Tested:** 2025-12-20

---

## Summary

| Item | Value |
|------|-------|
| WebDAV Supported | **Yes** - Confirmed via HTTP OPTIONS |
| Correct URL | `https://sbnewcomers.org/resources` |
| Auth Type | **Digest** (not Basic) |
| Auth Realm | "Site resources" |
| Server Engine | IT Hit WebDAV Server .Net v2.1.3.239 |
| DAV Level | 1, 2 |

---

## Test Results (2025-12-20)

### URL Discovery

| URL | Result |
|-----|--------|
| `https://sbnewcomers.org/resources` | **200 OK** - WebDAV headers present |
| `https://sbnewcomers.wildapricot.org/resources` | **404 Not Found** - Does NOT work |

**Important:** Use the **custom domain**, not the wildapricot.org subdomain.

### HTTP OPTIONS Response

```
HTTP/1.1 200 OK
Allow: OPTIONS, PROPFIND, PROPPATCH, COPY, MOVE, DELETE, MKCOL, LOCK, UNLOCK
DAV: 1, 2
Engine: IT Hit WebDAV Server .Net v2.1.3.239
MS-Author-Via: DAV
```

### Authentication Required

```
HTTP/1.1 401 Access denied.
WWW-Authenticate: Digest realm="Site resources", nonce="...", algorithm="MD5", qop="auth"
```

- Uses **Digest authentication** (not Basic)
- Username: Admin email (e.g., `technology@sbnewcomers.org`)
- Password: WA admin password

---

## Working curl Command

To list files with authentication:

```bash
USER="technology@sbnewcomers.org"
URL="https://sbnewcomers.org/resources"

curl --digest -u "$USER" \
  -X PROPFIND \
  -H "Depth: 1" \
  -H "Content-Type: text/xml; charset=utf-8" \
  --data-binary '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:allprop/></d:propfind>' \
  "$URL"
```

Note the `--digest` flag is required (not `--basic`).

---

## Download Script

To recursively download all files:

```bash
#!/bin/bash
# webdav-harvest.sh - Download all files from WA Resources

USER="technology@sbnewcomers.org"
BASE_URL="https://sbnewcomers.org/resources"
OUTPUT_DIR="$HOME/SBNC_WA_Files"

mkdir -p "$OUTPUT_DIR"

# Using wget with digest auth
wget --recursive \
     --no-parent \
     --http-user="$USER" \
     --ask-password \
     --auth-no-challenge \
     --directory-prefix="$OUTPUT_DIR" \
     "$BASE_URL/"
```

Or use a WebDAV client like:
- **CyberDuck** (Mac/Windows) - Recommended
- **Transmit** (Mac)
- **WinSCP** (Windows)
- **cadaver** (Linux CLI)

---

## Cyberduck Connection Settings

1. Open Cyberduck
2. Click "Open Connection"
3. Select **WebDAV (HTTPS)** from dropdown
4. Server: `sbnewcomers.org`
5. Port: `443`
6. Path: `/resources`
7. Username: `technology@sbnewcomers.org`
8. Password: (WA admin password)
9. Click "Connect"

---

## Known Limitations

### From Wild Apricot Forums

- Large transfers may stall or timeout
- Files uploaded via WebDAV may not refresh on website immediately
- Some users report inconsistent behavior

### Platform Notes

| Platform | Status |
|----------|--------|
| macOS (curl/Cyberduck) | Works |
| Windows (Explorer) | Works |
| Linux (cadaver/curl) | Works with --digest |

---

## Next Steps

1. **Connect with Cyberduck** or curl using admin credentials
2. **Download all files** recursively to `~/SBNC_WA_Files`
3. **Inventory the files** and determine what to migrate
4. **Document file structure** for Murmurant import planning

---

## Technical Details

### Supported WebDAV Methods

```
OPTIONS, PROPFIND, PROPPATCH, COPY, MOVE, DELETE, MKCOL, LOCK, UNLOCK
```

### CORS Headers

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: PROPFIND, PROPPATCH, COPY, MOVE, DELETE, MKCOL, LOCK, UNLOCK, PUT, GET, POST, HEAD, OPTIONS
```

---

*Last updated: 2025-12-20 (confirmed working)*
