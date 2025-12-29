# Murmurant Data Model Overview

## Purpose

This document explains the core data structures used by Murmurant in plain language. It is written for club leaders, Tech Chairs, committee members, and future contractors who need to understand what information the system stores and how different pieces connect together. You do not need to read code or understand databases to use this guide. The goal is to give you a mental map of how Murmurant organizes data about members, committees, events, photos, and communications.

---

## Core Entities

### Member

A Member is a person who has joined the club. This is the central record for tracking someone throughout their membership. Each Member has basic contact information such as name, email, and phone number, plus a join date and current membership status. Members can register for events, serve on committees, upload photos, and receive email communications from the club.

### MembershipStatus

MembershipStatus defines the possible states a member can be in, such as Active, Lapsed, or Alumni. Rather than hard-coding these values, the system stores them in a table so the club can adjust definitions over time. Each status includes flags indicating whether members in that status can renew their membership or serve on the board. Every Member has exactly one MembershipStatus at any given time.

### Committee

A Committee represents a working group within the club that handles specific responsibilities. Examples might include Activities, Membership, Communications, or the Board of Directors. Each Committee has a name, a short description, and can be marked active or inactive. Committees define the roles that members can hold when serving on them.

### CommitteeRole

A CommitteeRole defines a specific position within a Committee, such as Chair, Vice Chair, Secretary, or general Member. Roles have names and can be ordered for display purposes. The same role name (like "Chair") can exist in multiple committees, but each role belongs to exactly one committee. When someone serves on a committee, they are assigned to a specific role.

### Term

A Term represents a defined time period for committee service, typically matching the club's fiscal or program year. For example, "2024-2025 Club Year" running from July 2024 through June 2025. Terms have start and end dates, and one term can be marked as the current term. This allows the system to track who served in what capacity during each year of the club's history.

### RoleAssignment

A RoleAssignment is the record that connects a Member to a Committee, CommitteeRole, and Term. It answers questions like "Who is the current Activities Chair?" or "What committees has Jane served on?" One Member can have many RoleAssignments over time, serving on different committees or holding different roles across multiple terms. This is the key table for tracking leadership history.

### UserAccount

A UserAccount stores login credentials for members who need to sign into the administrative system. Not every Member has a UserAccount - only those who require access to manage the website, events, or other club functions. Each UserAccount is linked to exactly one Member and stores their email, encrypted password, and last login time. Accounts can be deactivated without deleting the member record.

### Event

An Event is a club activity that members can attend, such as a hike, dinner, workshop, or social gathering. Events have a title, description, category (like "Outdoor" or "Social"), location, start time, and optional end time. Events can also have a capacity limit and can be marked as published (visible to members) or unpublished (still in draft). Members sign up for events through registrations.

### EventRegistration

An EventRegistration records that a Member has signed up for an Event. Each registration has a status: Pending (awaiting confirmation), Confirmed (spot secured), Waitlisted (event is full), Cancelled (member withdrew), or No-Show (did not attend). If the event is full, waitlisted registrations include a position number so the club knows who should be promoted first if a spot opens. One Member can register for many Events, and one Event can have many registrations, but a member cannot register twice for the same event.

### Photo

A Photo is an image uploaded to the system, typically from a club event. Each Photo belongs to a PhotoAlbum and tracks who uploaded it, the file location, an optional caption, and when the photo was taken. Members can upload photos to share memories and document club activities. Photos help preserve the club's history and give prospective members a sense of what the club does.

### PhotoAlbum

A PhotoAlbum is a collection of Photos, usually created for a specific Event. Albums have a title, description, and can designate one photo as the cover image for display purposes. Each Event can have at most one PhotoAlbum associated with it. Albums can also exist independently for photos not tied to a specific event, such as general club photos or historical archives.

### EmailLog

An EmailLog records each email sent through the system. This includes the recipient's address, subject line, a preview of the message body, when it was sent, and the delivery status (Queued, Sent, Delivered, Bounced, or Failed). Emails can be linked to a Member record for tracking communication history. This log helps the club understand what messages have been sent and troubleshoot delivery issues.

---

## Key Relationships

- Each Member belongs to exactly one MembershipStatus.
- Each Member can have zero or one UserAccount (only if they need login access).
- Each Member can have many RoleAssignments across different committees and terms.
- Each RoleAssignment links one Member to one Committee, one CommitteeRole, and one Term.
- Each CommitteeRole belongs to exactly one Committee.
- Each Committee can have many CommitteeRoles defined (Chair, Vice Chair, Member, etc.).
- Each Event can have many EventRegistrations from different members.
- Each EventRegistration links one Member to one Event.
- A Member cannot register twice for the same Event (enforced by the system).
- Each Photo belongs to exactly one PhotoAlbum and was uploaded by one Member.
- Each PhotoAlbum can be linked to at most one Event.
- Each Event can have at most one PhotoAlbum.
- Each EmailLog can optionally be linked to one Member.

---

## Typical Questions

These are common questions that club leaders and administrators ask. The data model is designed to answer them:

1. **What events is this member registered for?**
   Look up all EventRegistrations for the member and see which Events they link to.

2. **Who is registered for a specific event?**
   Look up all EventRegistrations for the event and see which Members they link to.

3. **Who is on the waitlist for an event, and in what order?**
   Find EventRegistrations for the event where status is Waitlisted, sorted by position.

4. **Who is on the Board (or any committee) for the current term?**
   Find RoleAssignments where the Term is marked as current and the Committee matches.

5. **What committees has this member served on over the years?**
   Look up all RoleAssignments for the member across all Terms.

6. **Who was the Activities Chair two years ago?**
   Find the RoleAssignment matching the Activities Committee, Chair role, and the relevant past Term.

7. **How many active members do we have?**
   Count Members whose MembershipStatus is marked as active.

8. **Which members are eligible to serve on the board?**
   Find Members whose MembershipStatus has the board-eligible flag set.

9. **What photos do we have from a specific event?**
   Find the PhotoAlbum linked to the Event, then retrieve all Photos in that album.

10. **What emails have we sent to this member recently?**
    Look up EmailLog records linked to the member, sorted by send date.

---

## Notes for Future Reference

- All records include timestamps showing when they were created and last updated.
- The system uses unique identifiers (UUIDs) for all records to support future integrations.
- History tracking and audit logging are planned for a future phase to capture changes over time.
- Guest attendance and payment processing are not yet modeled but may be added later.
