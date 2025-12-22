# Tabletop: Audience Enforcement Leak

Failure domain: AuthZ / Publishing / Security

Trigger:
- Member reports seeing content for another audience.

Key decisions:
- Freeze publishing?
- Reduce public access?
- SEV level?

Expected behavior:
- Publish freeze
- Containment
- Audit review

Runbooks:
- runbooks/PUBLISH_FREEZE.md
- runbooks/SECURITY_CONTAINMENT.md

Failure if:
- Content remains accessible
- Leak is minimized without evidence

