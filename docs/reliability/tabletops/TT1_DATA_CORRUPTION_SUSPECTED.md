# Tabletop: Suspected Data Corruption

Failure domain: Data / Writes / Recovery

Trigger:
- Operator reports inconsistent member state after deploy.

Key decisions:
- Enter read-only?
- Block admin actions?
- Initiate restore drill?

Expected behavior:
- Writes halted
- No repair attempts without verification
- Decision Log opened

Runbooks:
- runbooks/READ_ONLY_MODE.md
- runbooks/RESTORE_DRILL.md

Failure if:
- Writes continue while corruption is unverified
- Silent correction attempted

