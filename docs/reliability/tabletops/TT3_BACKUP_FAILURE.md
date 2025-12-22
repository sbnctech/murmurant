# Tabletop: Backup Failure Detected

Failure domain: Backups / Recovery

Trigger:
- Backup job missed two cycles.

Key decisions:
- Declare SEV-1?
- Block deploys?
- Assign recovery owner?

Expected behavior:
- Visibility of failure
- No assumption of recoverability
- No deploys while unresolved

Runbooks:
- runbooks/BACKUP_VERIFICATION.md

Failure if:
- Failure ignored
- Deploy proceeds

