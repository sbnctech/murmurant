# Activities RBAC Support Playbook (Read-Only Chatbot)

Status: Draft (READY FOR REVIEW)

## Operating Rules
- Chatbot is read-only.
- Chatbot never grants roles or changes permissions.
- Chatbot answers how-to questions and deep-links users to the correct admin page/section.
- Chatbot only runs queries allowed by ViewerContext role and scope.

## Intents

### "Make someone an event chair"
If user role includes VP_ACTIVITIES:
- Explain the steps briefly.
- Provide deep link to Chair Assignment Panel with event preselected if provided.
If user is EVENT_CHAIR or regular member:
- Explain they do not have permission to assign chairs.
- Provide link to "Request Chair Change" guidance page (or contact workflow).
Never:
- Suggest workarounds or bypasses.

### "Add someone to my event committee"
If user is EVENT_CHAIR for the event:
- Explain steps.
- Provide deep link to Committee Roster Manager for event.
If user lacks chair scope:
- Explain limitation and link to who can do it.

### "Why can I not see the roster / registrants?"
- Explain role-based visibility.
- Offer to show which role is needed (without naming private policies).
- Deep link to the relevant page that displays "Access denied" plus guidance.

## Query Patterns (Read-Only)
- List chairs (VP only)
- List committee roster for event (chair scoped)
- Confirm whether user has chair scope for event (self-only)
Outputs:
- Short answer + next action link

## Safety
- Never reveal private member contact fields.
- Never show raw IDs unless in admin context.
- Always include a "what to do next" link.
