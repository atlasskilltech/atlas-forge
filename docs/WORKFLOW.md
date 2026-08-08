# ATLAS Forge — Complete Platform Guide

**Who this guide is for:** anyone new to ATLAS Forge — a tester, a QA person, a new
team member, or someone who has just logged in for the first time.

**What this guide is not:** it does not talk about code, servers, or databases.
Everything here is written from the point of view of a person using the screens.

**How to read it:** start at the top and go down. By the end you will understand
what the platform does, who uses it, what every screen is for, and how to test
the whole thing from beginning to end.

> **Please note:** some parts of the platform are still being built. Wherever
> that is true, this guide says so clearly instead of pretending the feature
> works. Look for the ⚠️ symbol.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [User roles](#2-user-roles)
3. [The complete user journey](#3-the-complete-user-journey)
4. [Screen-by-screen guide](#4-screen-by-screen-guide)
5. [Role-by-role walkthrough](#5-role-by-role-walkthrough)
6. [How data flows](#6-how-data-flows)
7. [Approval workflow](#7-approval-workflow)
8. [Permissions table](#8-permissions-table)
9. [Testing guide](#9-testing-guide)
10. [Seed accounts](#10-seed-accounts)
11. [Complete platform flow](#11-complete-platform-flow)
12. [Current limitations](#12-current-limitations)

---

# 1. Project overview

## What is ATLAS Forge?

ATLAS Forge is the **product development centre** for ATLAS SkillTech University.

Think of it as a private website, just for the university, where:

- **students** find real work on real startups,
- **student founders** find people to help build their startups,
- and **the university staff** keep an eye on everything.

It is not open to the public. You cannot sign up. You are given an **App ID** by
the university, and that is how you log in.

## What problem does it solve?

Before a platform like this, a university has the same three problems again and
again:

| The problem | How ATLAS Forge solves it |
|---|---|
| A founder needs a designer but doesn't know which student can design | The founder searches the **Student Pool** and contacts them |
| A student wants real project experience but doesn't know who is hiring | The student browses **Jobs** and **Projects** and applies |
| Staff have no idea what is happening across all the startups | Every action is recorded and shown in **logs and reports** |

In one sentence: **ATLAS Forge connects students who want work with founders who
need help, while the university keeps control of quality and access.**

## Who uses it?

Five kinds of people. Each one is called a **role**.

```
   STUDENTS                FOUNDERS               UNIVERSITY STAFF
   ────────                ────────               ────────────────
   Look for work    →      Post work        →     Approve and monitor
   Offer skills            Build a team           Assign mentors
   Apply to jobs           Review applicants      Grant access
```

---

# 2. User roles

There are exactly **five roles**. One person can have more than one role.

## 2.1 Student

**Who they are:** any enrolled student of the university.

**What they CAN do:**

- Turn their availability **on or off**, so founders know they are free to work
- Show their skills, course, year, and how many hours a week they can give
- Browse all startups on the platform
- Browse all approved job listings
- Apply to a job with one click
- See the status of every job they applied to
- Post a "Collab" — a request for another student to help them
- Ask for a mentorship session
- Apply for incubation (get their own idea accepted into the Forge)
- Send a message to the Forge Manager for help

**What they CANNOT do:**

- See other students' applications
- Approve anything
- Post a paid job (only founders do that)
- Change anyone else's information

**Why this role exists:** it is the largest group of users. The whole platform
exists so that a student's skills can be found by someone who needs them.

---

## 2.2 Founder

**Who they are:** a student (or alumnus) who is running a startup inside the Forge.

You do not become a founder by signing up. **A Backend Manager gives you founder
access.** This is on purpose — the university decides who runs a startup.

**What they CAN do:**

- Everything about their own startup page: name, description, industry, stage
- Post job listings for their startup
- Search the Student Pool and filter by skill
- Contact a student directly through the Concierge
- See everyone who applied to their listings
- Ask for a mentorship session
- Apply for incubation

**What they CANNOT do:**

- Approve their own job listing — a manager must approve it
- Contact a student who has not made themselves available
- See another founder's applicants
- Change any student's account

**Why this role exists:** a founder is the "employer" side of the platform.
Without founders there is no work for students to apply to.

---

## 2.3 Forge Manager

**Who they are:** the staff member who runs the incubator day to day. In the demo
data this is **Mihir Pawar**.

**What they CAN do:**

- Approve or reject every job listing and collab post before students see it
- Review incubation applications and accept startups into the Forge
- Assign a mentor to a student or founder who asked for one
- Mark a project as **Featured** so it appears at the top
- See every student, every founder, and every startup
- See the full contact log — every time a founder contacted a student
- See the platform activity log

**What they CANNOT do:**

- Change platform settings
- Grant or revoke founder access (that is the Backend Manager)
- Delete user accounts

**Why this role exists:** somebody has to check quality. Without this role any
founder could post anything and students would see it immediately.

---

## 2.4 Backend Manager

**Who they are:** the platform administrator. In the demo data this is
**Shantanu Ghuriani** — who is also a Founder, so this account has two roles.

**What they CAN do:**

- **Everything the Forge Manager can do, plus:**
- Grant founder access to a student
- Revoke founder access from someone
- **Override a Forge Manager's decision** — if the Forge Manager rejected a
  listing, the Backend Manager can still approve it
- Change platform settings (platform name, approval rules, access rules)
- View error logs
- Reset the platform demo data

**What they CANNOT do:**

- Nothing is blocked. This is the most powerful role on the platform.

**Why this role exists:** somebody must be able to fix things and make the final
call. The override system means the Forge Manager's decision is never lost — both
decisions are kept side by side, and the later one is marked as an override.

---

## 2.5 Super Admin

**Who they are:** senior university leadership. In the demo data this is
**Dr. Meera Joshi**.

**What they CAN do:**

- **Look at everything.** Users, startups, listings, contracts, contact logs,
  incubation status, and reports.

**What they CANNOT do:**

- **Change anything at all.** There is not a single save, approve, edit, or delete
  button in this role. It is completely read-only.

**Why this role exists:** leadership needs to see how the platform is performing
without any risk of accidentally changing live data.

---

## Role summary in one picture

```
                        POWER LEVEL
                        
  Super Admin      👁️  sees everything, changes nothing
       │
  Backend Manager  ⚙️  can do everything, including overrides
       │
  Forge Manager    🛠️  approves content, assigns mentors
       │
  Founder          🚀  runs one startup, posts jobs
       │
  Student          🎓  applies for work, offers skills
```

---

# 3. The complete user journey

This section shows the real end-to-end story of the platform, exactly as it works
today.

## 3.1 Getting in (everybody)

```
Open the website
        ↓
You land on the Login screen
        ↓
Type your App ID  (example: ATL-2024-0871)
Type your password
        ↓
Click "Sign In"
        ↓
You land on the "Select your role" screen
        ↓
Click the role card you want
        ↓
You land on that role's Home screen
```

**Important things to know about the role screen:**

- It always shows **all five role cards** to everybody.
- If you click a role you do not have, the platform simply sends you **back to the
  role screen**. Nothing bad happens — you just cannot get in.
- So: a student clicking "Backend Manager" will bounce straight back. This is
  expected behaviour, not a bug.

---

## 3.2 The student's work journey

```
Student logs in
        ↓
Opens "Flag My Availability"
        ↓
Turns availability ON
        ↓
(Founders can now find this student)
        ↓
Opens "Browse Jobs"
        ↓
Sees only APPROVED listings
        ↓
Clicks "Apply"
        ↓
A confirmation box appears: "Application Submitted!"
        ↓
Opens "My Applications"
        ↓
Sees the job with a status chip (Applied / Under Review / …)
```

---

## 3.3 The founder's hiring journey

```
Founder logs in
        ↓
Opens "Post a Job"
        ↓
Fills the form and submits
        ↓
Confirmation: "Listing Submitted!"
        ↓
The listing is now PENDING — students CANNOT see it yet
        ↓
Forge Manager opens "Approval Queue"
        ↓
Clicks Approve → confirms
        ↓
The listing becomes LIVE
        ↓
Students can now see and apply to it
        ↓
Founder opens "Applicants" and sees who applied
```

⚠️ **The journey stops here in the interface.** The founder can **see** applicants
but **cannot change their status from any screen**. Moving someone from "Applied"
to "Shortlisted" is fully built underneath, and the rules are enforced, but no
button exists yet. See [Current limitations](#12-current-limitations).

---

## 3.4 The Concierge journey (founder finds a student directly)

This is the reverse of applying. Instead of the student coming to the job, the
founder goes to the student.

```
Student turns availability ON
        ↓
Founder opens "Search Student Pool"
        ↓
Filters by skill
        ↓
Sees only students who are AVAILABLE
        ↓
Clicks "Contact"
        ↓
Confirmation: "Contact Sent!"
        ↓
The contact is recorded in the Contact Log
        ↓
Forge Manager can see this contact in their own Contact Log
```

---

## 3.5 The mentorship journey

```
Student or Founder opens "Mentorship"
        ↓
Clicks "Request a Session"
        ↓
Fills in the topic
        ↓
Confirmation: "Request Sent!"
        ↓
The request status is now "Requested"
        ↓
Forge Manager opens "Assign Mentors"
        ↓
Picks a mentor and assigns them
        ↓
Confirmation: "Mentor Assigned!"
        ↓
A session appears in the Session Log
```

⚠️ The journey stops here. Nothing can mark a session as **completed** or
**cancelled** yet.

⚠️ On a **desktop screen**, a founder cannot see the "Request a Session" button at
all. It only appears on mobile-sized screens. Students are not affected.

---

## 3.6 The incubation journey (getting a startup into the Forge)

```
Student or Founder opens "Apply for Incubation"
        ↓
Fills in the idea name, problem, stage, and team
        ↓
Ticks the readiness checklist
   • Pitch Deck or Concept Note
   • Product Demo / Link
   • Product Assets
   • Key Personnel
        ↓
Submits
        ↓
Status becomes "Pending"
        ↓
Forge Manager opens "Incubation Applications"
        ↓
Reviews and approves
        ↓
The startup becomes ACTIVE and appears in "Active Startups"
```

---

## 3.7 The access journey (becoming a founder)

```
A student wants to run a startup
        ↓
Backend Manager opens "Role Assignments"
        ↓
Searches for the student's App ID
        ↓
Clicks "Grant Founder Access"
        ↓
Confirms
        ↓
Confirmation: "Founder Access Granted"
        ↓
The student now sees the Founder role and can use it
        ↓
(Access can be taken back the same way with "Revoke Access")
```

---

# 4. Screen-by-screen guide

Below is every screen in the platform, grouped by role.

## 4.1 Screens everyone sees

| Screen | Purpose | What you do there | What happens next |
|---|---|---|---|
| **Login** | The way in | Type App ID and password, click Sign In | Goes to Select Role. A wrong password shows a message under the password box |
| **Select Role** | Choose how to continue | Click a role card | Goes to that role's home. If you don't have that role you come back here |
| **Styleguide** | An internal page showing buttons, colours and chips | Nothing — it is for the design team | Not part of any user journey |

> **Note on the top bar:** the search box and the notification bell are both
> switched off on purpose. They are drawn in the design but not built yet.

---

## 4.2 Student screens (13)

| Screen | Purpose | What you do there | What happens next |
|---|---|---|---|
| **Home** | Your starting point | Read your summary and shortcuts | Click any shortcut |
| **Flag My Availability** | Tell founders you are free | Switch availability on or off | On desktop it saves instantly. On mobile press "Update Availability" → "Availability Updated" |
| **My Skills Profile** | Show what you are good at | Look at your skill tags | ⚠️ You cannot edit skills — there is no picker yet |
| **Browse Projects** | See all the startups | Filter by "Actively Hiring", "New This Month" or industry | ⚠️ "View Startup" and "See Roles" are switched off — no startup detail screen exists |
| **Browse Jobs** | See approved work | Pick a job, click **Apply** | "Application Submitted!" appears, and the job shows as applied |
| **Post a Collab** | Ask another student for help | Fill the form and submit | "Collab Post Submitted!" — it then waits for manager approval |
| **My Applications** | Track what you applied to | Read the status chip on each row | ⚠️ The small arrow to expand a row is switched off |
| **Mentorship** | Ask for a mentor | Click "Request a Session", fill the topic | "Request Sent!" — the Forge Manager will assign someone |
| **Apply for Incubation** | Get your own idea into the Forge | Fill the form and tick the readiness list | Application goes to the Forge Manager |
| **My Profile** | Your personal details | View your information; click "Edit Skills & Availability" | Takes you to the availability screen |
| **Contact Forge Manager** | Ask staff for help | Type a subject and message, send | "Message Sent!" — the Forge Manager receives it |
| **Help** | Guidance and FAQs | Read | — |
| **More** | Mobile-only menu | Tap any item | Opens that screen |

---

## 4.3 Founder screens (19)

| Screen | Purpose | What you do there | What happens next |
|---|---|---|---|
| **Home** | Startup summary | Read your counters and recent activity | — |
| **Concierge** | Find students | Browse available students | Click Contact to reach one |
| **Search Student Pool** | Find students by skill | Filter, then click **Contact** | "Contact Sent!" and it is logged |
| **My Posted Needs** | Things you said you need | Read the list | ⚠️ Posting a new need has no screen yet |
| **Contact Log** | Everyone you contacted | Read the history | ⚠️ Changing a contact's status has no button yet |
| **Projects Under Forge** | All startups in the Forge | Browse | ⚠️ Detail buttons are switched off |
| **My Startup Page** | How your startup looks | Review the page | Click through to Edit Listing |
| **Edit Listing** | Edit your **startup's** details | Change name, description, industry, stage → Save | "Profile Updated". *(Despite the name, this edits your startup, not a job listing)* |
| **Hiring** | Overview of your listings and applicants | See listings and who applied | ⚠️ "View Profile" is switched off |
| **My Listings** | Every job you posted | Read status: Pending, Live, or Rejected | ⚠️ You cannot edit or close a listing yet |
| **Post a Job** | Create a job listing | Fill the form and submit | "Listing Submitted!" → goes to the approval queue |
| **Applicants** | Everyone who applied to you | Read the list | ⚠️ **You cannot change an applicant's status from here** |
| **Mentorship** | Get a mentor | Request a session | "Request Sent!" ⚠️ Button is mobile-only |
| **Apply for Incubation** | Submit your startup | Fill and submit | Goes to the Forge Manager |
| **My Application** | Your incubation status | Read the progress ring and checklist | — |
| **My Profile** | Your personal details | Edit and save | "Profile Updated" |
| **Contact Forge Manager** | Ask staff for help | Send a message | "Message Sent!" |
| **Help** | Guidance | Read | — |
| **More** | Mobile-only menu | Tap an item | Opens that screen |

---

## 4.4 Forge Manager screens (19)

| Screen | Purpose | What you do there | What happens next |
|---|---|---|---|
| **Dashboard** | The control room | Read counters and recent activity | — |
| **All Students** | Every student | Browse and search | — |
| **All Founders** | Every founder | Browse | — |
| **Student Pool** | Available students | Browse | ⚠️ Contact is switched off for this role — founders send outreach |
| **Contact Log** | Every founder→student contact | Review | — |
| **Posted Needs** | What founders are asking for | Review | — |
| **All Projects** | Every startup | Browse | Use Featured toggle on a card |
| **Featured** | Highlighted projects | Turn "Featured" on or off for a project | The change saves immediately |
| **Approval Queue** | **The most important screen for this role** | Click **Approve** or **Reject** on a listing → confirm | Approved listings go live for students. Rejected ones do not |
| **All Listings** | Every listing, any status | Review | ⚠️ Row menu is switched off |
| **Contract Log** | Agreements between founders and students | Review | — |
| **Assign Mentors** | Handle mentorship requests | Pick a mentor, assign | "Mentor Assigned!" |
| **Session Log** | All mentorship sessions | Review | ⚠️ You cannot complete or cancel a session |
| **Applications** (incubation) | Startups asking to join | Review and approve | The startup becomes active |
| **Active Startups** | Startups already in the Forge | Review | — |
| **User Accounts** | Every account | Browse | ⚠️ "Manage" is switched off — account changes belong to the Backend Manager |
| **Role Assignments** | Who has which role | Review | — |
| **Platform Logs** | Everything that happened | Read the audit trail | ⚠️ Row menu switched off |
| **More** | Mobile-only menu | Tap an item | Opens that screen |

---

## 4.5 Backend Manager screens (15)

| Screen | Purpose | What you do there | What happens next |
|---|---|---|---|
| **Platform Dashboard** | Whole-platform numbers | Read counters | — |
| **All Users** | Every account on the platform | Search, then click **Manage** on a row | Opens Role Assignments with that person already found |
| **Activity Log** | Everything that happened | Read | — |
| **Role Assignments** | Give and take away access | Search an App ID → **Grant Founder Access** or **Revoke Access** → confirm | "Founder Access Granted" / "Founder Access Revoked" |
| **Grant Founder Access** | Same job, direct link | Search and grant | Same as above |
| **Revoke Access** | Same job, direct link | Search and revoke | Same as above |
| **Job Approval Queue** | Approve listings **and override** | Approve or reject — even something already decided | The confirmation warns you when you are overriding the Forge Manager |
| **All Listings** | Every listing | Review | — |
| **Contract Log** | All agreements | Review | — |
| **Contact Log** | All founder→student contacts | Review | — |
| **Platform Settings** | Change how the platform behaves | Flip a switch, or edit the platform name | Saves straight away |
| **Platform Logs** | Full audit trail | Read | — |
| **Error Logs** | Technical problems | Read | ⚠️ You cannot mark an error as resolved yet |
| **My Profile** | Your details | Edit and save | "Profile Updated" |
| **Help** | Guidance | Read | — |

### About Platform Settings

These switches genuinely change behaviour. The important ones:

| Setting | Default | What it does |
|---|---|---|
| Job Listings require approval | ON | New jobs wait for a manager. Turn OFF and they go live instantly |
| Collab Posts require approval | ON | Same, for student collab posts |
| Student Self-Registration | OFF | Students cannot sign themselves up |
| Founder Access Auto-Approval | OFF | Founder access must be given by hand |
| V1 Mode (Internal Only) | ON | Platform is limited to university users |
| Contact Log auto-CC | ON | The Forge Manager is copied on every outreach |

### About the Danger Zone

At the bottom of Platform Settings there is a **Reset Platform Data** action. It
asks you to confirm and it tells you exactly what will be cleared. Do not press it
on a real system.

---

## 4.6 Super Admin screens (11)

Every screen here is **read-only**. There are no buttons that change anything.

| Screen | Purpose |
|---|---|
| **Platform Overview** | The headline numbers for the whole platform |
| **All Users** | Every account and their role |
| **All Startups** | Every startup and its status |
| **Contact Log** | Every founder→student contact |
| **Job Listings** | Every listing and its approval state |
| **Incubation Status** | Where each startup is in the incubation process |
| **Contract Log** | Every agreement |
| **Platform Summary** | A rolled-up report |
| **Activity Report** | The last 30 days of activity |
| **My Profile** | Your own details |
| **More** | Mobile-only menu |

---

# 5. Role-by-role walkthrough

## 5.1 Student journey

```
Login
  ↓
Select "Standard Student"
  ↓
Home
  ↓
Flag My Availability  →  turn ON
  ↓
Browse Projects       →  see the startups
  ↓
Browse Jobs           →  find a role
  ↓
Apply                 →  "Application Submitted!"
  ↓
My Applications       →  status shows "Applied"
  ↓
Mentorship            →  request a session
  ↓
Apply for Incubation  →  (optional) submit your own idea
  ↓
Contact Forge Manager →  (optional) ask for help
  ↓
Log out
```

## 5.2 Founder journey

```
Login
  ↓
Select "Founder (Startup)"
  ↓
Home
  ↓
My Startup Page       →  check how it looks
  ↓
Edit Listing          →  update startup details  →  "Profile Updated"
  ↓
Post a Job            →  submit  →  "Listing Submitted!"
  ↓
My Listings           →  status shows "Pending"
  ↓
   ⏸  WAIT — a manager must approve it
  ↓
Search Student Pool   →  filter by skill
  ↓
Contact a student     →  "Contact Sent!"
  ↓
Contact Log           →  see the record
  ↓
Applicants            →  see who applied
  ↓
   ⚠️  STOP — no button exists to change their status
  ↓
Log out
```

## 5.3 Forge Manager journey

```
Login
  ↓
Select "Forge Manager"
  ↓
Dashboard             →  see what needs attention
  ↓
Approval Queue        →  Approve or Reject each listing
  ↓
                         Approved  →  students can now see it
                         Rejected  →  it stays hidden
  ↓
Incubation Applications → review and approve a startup
  ↓
Assign Mentors        →  give a mentor to a request  →  "Mentor Assigned!"
  ↓
Featured              →  highlight a strong project
  ↓
Contact Log           →  check founders are behaving properly
  ↓
Platform Logs         →  read the full history
  ↓
Log out
```

## 5.4 Backend Manager journey

```
Login
  ↓
Select "Backend Manager"
  ↓
Platform Dashboard    →  whole-platform numbers
  ↓
All Users             →  find an account  →  click "Manage"
  ↓
Role Assignments      →  Grant Founder Access  →  "Founder Access Granted"
  ↓
Job Approval Queue    →  approve something the Forge Manager rejected
  ↓
                         (the confirmation warns you it is an override)
  ↓
                         BOTH decisions are kept — nothing is erased
  ↓
Platform Settings     →  change a rule or the platform name
  ↓
Error Logs            →  check for technical problems
  ↓
Log out
```

## 5.5 Super Admin journey

```
Login
  ↓
Select "Super Admin"
  ↓
Platform Overview     →  headline numbers
  ↓
All Users             →  who is on the platform
  ↓
All Startups          →  what is being built
  ↓
Job Listings          →  what work is available
  ↓
Incubation Status     →  how startups are progressing
  ↓
Contact Log           →  outreach activity
  ↓
Activity Report       →  last 30 days
  ↓
Platform Summary      →  the rolled-up report
  ↓
Log out

(No save buttons anywhere. This role only looks.)
```

---

# 6. How data flows

## 6.1 A student applies for a job

```
Student clicks "Apply"
        ↓
The platform saves the application
        ↓
The student sees it in "My Applications" with status "Applied"
        ↓
The founder sees the student in "Applicants"
        ↓
The Forge Manager and Backend Manager can see it too
        ↓
The action is written to the activity log
```

## 6.2 A founder posts a job

```
Founder submits the job form
        ↓
The platform saves it as PENDING
        ↓
Students CANNOT see it
        ↓
It appears in the Forge Manager's Approval Queue
        ↓
Manager clicks Approve
        ↓
Status becomes LIVE
        ↓
Students can now see it in "Browse Jobs"
```

## 6.3 A founder contacts a student

```
Student turns availability ON
        ↓
Student appears in the Student Pool
        ↓
Founder clicks "Contact"
        ↓
The contact is saved
        ↓
It appears in the founder's Contact Log
        ↓
It also appears in the Forge Manager's Contact Log
        ↓
And in the Super Admin's Contact Log
```

## 6.4 Access is granted

```
Backend Manager searches for a student
        ↓
Clicks "Grant Founder Access" and confirms
        ↓
The student's account gains the Founder role
        ↓
Next time they log in, "Founder" works for them
        ↓
The action is recorded in the activity log
```

## 6.5 The golden rule of this platform

```
   Every action you take  →  is saved  →  and appears in a log
                                              ↓
                          Managers and Super Admin can see it
```

Nothing is thrown away. This is why the platform can be trusted for university
decisions.

---

# 7. Approval workflow

## 7.1 Who approves whom

```
                    ┌─────────────────────┐
                    │   BACKEND MANAGER   │  ← can override anyone
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    FORGE MANAGER    │  ← first line of approval
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        Job listings     Collab posts     Incubation
        from founders    from students    applications
```

## 7.2 Listing approval

```
Founder posts a job
        ↓
Status: PENDING  (hidden from students)
        ↓
Forge Manager decides
        ↓
   ┌────────────┴────────────┐
   ▼                         ▼
APPROVED                  REJECTED
Status: LIVE              Status: REJECTED
Students see it           Students never see it
```

**Note:** whether approval is required at all is controlled by the setting
**"Job Listings require approval"**. If a Backend Manager turns it off, new
listings go live immediately with no review.

## 7.3 Collab post approval

Exactly the same as above, but the post comes from a **student** instead of a
founder, and it is controlled by the setting **"Collab Posts require approval"**.

## 7.4 Startup / incubation approval

```
Student or Founder applies for incubation
        ↓
Status: PENDING
        ↓
Forge Manager reviews
        ↓
Approved  →  the startup becomes ACTIVE and joins the Forge
```

In the demo data you can see all the stages at once:

| Startup | Status | Meaning |
|---|---|---|
| NovaMed | Active | Accepted into the Forge |
| EduTrack | Active | Accepted into the Forge |
| GreenGrid | Pending | Waiting for review |
| FinFlow | Under review | Being looked at now |

## 7.5 Founder access approval

```
Someone should become a founder
        ↓
ONLY the Backend Manager can decide
        ↓
Grant Founder Access  →  they gain the role
Revoke Access         →  they lose the role
```

The Forge Manager **cannot** do this. It is deliberately kept to one role.

## 7.6 The override system (important)

This is the most unusual part of the platform, and it is worth understanding.

```
Forge Manager REJECTS a listing
        ↓
Backend Manager opens the Job Approval Queue
        ↓
The listing still shows an "Approve" button
        ↓
Backend Manager clicks Approve
        ↓
A warning appears: this overrides the Forge Manager
        ↓
Backend Manager confirms
        ↓
RESULT:
   • The listing is now approved and live
   • The Forge Manager's rejection is STILL RECORDED
   • The new decision is marked as an override
```

**Why it works this way:** the platform never erases a decision. Both are kept, so
later you can always see that two people disagreed and who had the final say.

## 7.7 Application status pipeline

An application moves forward through these stages:

```
Applied → Under Review → Shortlisted → Interview → Selected
                                                 ↘
                                                  Not Selected
```

Rules the platform enforces:

- An application can only move **forward**, never backward
- It can be marked **Not Selected** at any point
- Once it reaches **Selected**, **Not Selected**, or **Withdrawn**, it is final
  and cannot change again
- Only the **student** can withdraw their own application — a founder cannot do it
  for them

⚠️ These rules are fully built and enforced, but **there is currently no screen
where a founder can move an application along**. See
[Current limitations](#12-current-limitations).

---

# 8. Permissions table

## 8.1 Simple view

| Role | Can view | Can create | Can edit | Can delete | Can approve |
|---|---|---|---|---|---|
| **Student** | Jobs, projects, own applications | Applications, collab posts, incubation & mentorship requests | Own availability | ❌ | ❌ |
| **Founder** | Jobs, all applicants to own listings, student pool | Job listings, contacts, incubation & mentorship requests | Own startup, own profile | ❌ | ❌ |
| **Forge Manager** | Everything except settings | Mentor assignments | All startups, featured flags | ❌ | ✅ Listings, incubation |
| **Backend Manager** | Everything | Everything | Everything, incl. settings | ✅ (reset only) | ✅ Everything, incl. overrides |
| **Super Admin** | Everything | ❌ | ❌ | ❌ | ❌ |

## 8.2 Feature-by-role view

| Feature | Student | Founder | Forge Mgr | Backend Mgr | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Browse jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply to a job | ✅ | ❌ | ❌ | ❌ | ❌ |
| Post a job listing | ✅ collab only | ✅ | ❌ | ✅ | ❌ |
| Approve a listing | ❌ | ❌ | ✅ | ✅ | ❌ |
| Override a decision | ❌ | ❌ | ❌ | ✅ | ❌ |
| Search the student pool | ❌ | ✅ | ✅ | ✅ | ❌ |
| Contact a student | ❌ | ✅ | ❌ | ✅ | ❌ |
| Set own availability | ✅ | ❌ | ❌ | ❌ | ❌ |
| Request mentorship | ✅ | ✅ | ❌ | ✅ | ❌ |
| Assign a mentor | ❌ | ❌ | ✅ | ✅ | ❌ |
| Apply for incubation | ✅ | ✅ | ❌ | ✅ | ❌ |
| Review incubation | ❌ | ❌ | ✅ | ✅ | ❌ |
| Grant / revoke founder access | ❌ | ❌ | ❌ | ✅ | ❌ |
| Feature a project | ❌ | ❌ | ✅ | ✅ | ❌ |
| Change platform settings | ❌ | ❌ | ❌ | ✅ | ❌ |
| View platform logs | ❌ | ❌ | ✅ | ✅ | ✅ |
| View error logs | ❌ | ❌ | ❌ | ✅ | ❌ |

---

# 9. Testing guide

This section takes you through the **entire platform** from beginning to end.
Follow it in order. It takes about 30–40 minutes.

**Before you start:**

- Make sure the platform is running and the demo data is loaded.
- The password for **every** demo account is: `Atlas@2026`
- After each step, check the result before moving on.

---

### Part A — Student: apply for work

**Step 1.** Go to the login page. Enter App ID `ATL-2024-0871` and the password.
Click **Sign In**.
✅ *Expect:* the Select Role screen.

**Step 2.** Click **Standard Student**.
✅ *Expect:* the Student Home screen, and your name (Riya Kapoor) in the top bar.

**Step 3.** Open **Flag My Availability**. Turn the switch ON.
✅ *Expect:* it saves by itself on desktop. On a narrow screen, press
**Update Availability** and look for "Availability Updated".

**Step 4.** Open **Browse Jobs**.
✅ *Expect:* you only see approved jobs. "Frontend Developer" and "Data Analyst"
should **not** appear — they are still pending.

**Step 5.** Choose a job you have not applied to and click **Apply**.
✅ *Expect:* a box saying "Application Submitted!".

**Step 6.** Open **My Applications**.
✅ *Expect:* your new application appears, plus the existing ones with different
status chips (Under Review, Not Selected, Shortlisted).

**Step 7.** Open **Post a Collab**. Fill it in and submit.
✅ *Expect:* "Collab Post Submitted!". This post is now waiting for approval.

**Step 8.** Open **Contact Forge Manager**. Send a short message.
✅ *Expect:* "Message Sent!".

**Step 9.** Click **Log out**.
✅ *Expect:* back to the login screen.

---

### Part B — Founder: post work and find people

**Step 10.** Log in as `ATL-2022-0012` (Shantanu Ghuriani). Choose
**Founder (Startup)**.
✅ *Expect:* the Founder Home screen for NovaMed.

**Step 11.** Open **Post a Job**. Fill in the form and submit.
✅ *Expect:* "Listing Submitted!".

**Step 12.** Open **My Listings**.
✅ *Expect:* your new job shows as **Pending** — not live.

**Step 13.** Open **Search Student Pool**.
✅ *Expect:* you see available students. Kavya Reddy should **not** appear — her
account is inactive.

**Step 14.** Click **Contact** on a student.
✅ *Expect:* "Contact Sent!".

**Step 15.** Open **Contact Log**.
✅ *Expect:* your new contact is listed.

**Step 16.** Open **Applicants**.
✅ *Expect:* you can see who applied.
⚠️ *Also expect:* no way to change their status. "View Profile" is greyed out.
**This is a known gap, not a bug to report.**

**Step 17.** Log out.

---

### Part C — Forge Manager: approve and assign

**Step 18.** Log in as `ATL-2020-0001` (Mihir Pawar). Choose **Forge Manager**.
✅ *Expect:* the Forge Dashboard with live counters.

**Step 19.** Open **Approval Queue**.
✅ *Expect:* the job you posted in Step 11 is waiting there.

**Step 20.** Click **Approve** on it, then confirm.
✅ *Expect:* the listing becomes approved.

**Step 21.** Open **Assign Mentors**. Assign a mentor to a waiting request.
✅ *Expect:* "Mentor Assigned!".

**Step 22.** Open **Session Log**.
✅ *Expect:* the new session appears.

**Step 23.** Open **Featured**. Turn the featured switch on for a project.
✅ *Expect:* it saves right away.

**Step 24.** Open **Platform Logs**.
✅ *Expect:* your approval from Step 20 appears in the list.

**Step 25.** Log out.

---

### Part D — Check the student sees the change

**Step 26.** Log in again as `ATL-2024-0871` and choose **Standard Student**.

**Step 27.** Open **Browse Jobs**.
✅ *Expect:* the job approved in Step 20 is now visible and you can apply to it.

**Step 28.** Log out.

---

### Part E — Backend Manager: override and administer

**Step 29.** Log in as `ATL-2022-0012` again — but this time choose
**Backend Manager**.
✅ *Expect:* the Platform Dashboard. *(This account has two roles, which is why
you can pick either.)*

**Step 30.** Open **Job Approval Queue**. Find the "Backend Developer" listing —
the Forge Manager rejected it.
✅ *Expect:* it still offers an **Approve** button.

**Step 31.** Click **Approve**.
✅ *Expect:* the confirmation warns you that this overrides the Forge Manager.

**Step 32.** Confirm it.
✅ *Expect:* it is approved, **and the original rejection is still shown**. Both
decisions are kept.

**Step 33.** Open **All Users**. Search for `ATL-2023-0541`.
✅ *Expect:* Kavya Reddy is found and other users are filtered out.

**Step 34.** Click **Manage** on her row.
✅ *Expect:* Role Assignments opens with her account already found.

**Step 35.** Search for `ATL-2024-0871` and click **Grant Founder Access**, then
confirm.
✅ *Expect:* "Founder Access Granted".

**Step 36.** Now click **Revoke Access** and confirm.
✅ *Expect:* "Founder Access Revoked". *(This puts the demo data back as it was.)*

**Step 37.** Open **Platform Settings**. Turn any switch off and on again.
✅ *Expect:* each change saves immediately.

**Step 38.** Open the **Danger Zone** and click **Reset Platform Data**, then
click **Cancel**.
✅ *Expect:* the warning explains what would be cleared, and cancelling changes
nothing.

**Step 39.** Log out.

---

### Part F — Super Admin: look but don't touch

**Step 40.** Log in as `ATL-2019-0004` (Dr. Meera Joshi). Choose **Super Admin**.

**Step 41.** Visit each screen in the sidebar one by one.
✅ *Expect:* real data everywhere, and **no save, edit, approve or delete buttons
anywhere at all**.

**Step 42.** Open **Activity Report**.
✅ *Expect:* the last 30 days of platform activity, including everything you did
in this test.

**Step 43.** Log out. **Testing complete.**

---

### Part G — Security checks (quick)

**Step 44.** While logged out, type a manager address directly in the browser,
for example `/backend/dashboard`.
✅ *Expect:* you are sent to the login page.

**Step 45.** Log in as a **student**, then on the role screen click
**Backend Manager**.
✅ *Expect:* you are sent straight back to the role screen. You cannot get in.

**Step 46.** Type a wrong password 8 times for the same App ID.
✅ *Expect:* after 8 failures you are told to wait a few minutes. Signing in
correctly clears the count.

---

# 10. Seed accounts

All demo accounts use the same password: **`Atlas@2026`**

## 10.1 Accounts you will actually test with

| Role to pick | App ID | Name | Why this account exists |
|---|---|---|---|
| Standard Student | `ATL-2024-0871` | Riya Kapoor | The main student. Already has applications in several states |
| Founder | `ATL-2022-0012` | Shantanu Ghuriani | Owns **NovaMed**. **Also a Backend Manager** — use this to test two roles on one account |
| Backend Manager | `ATL-2022-0012` | Shantanu Ghuriani | Same account, different role |
| Forge Manager | `ATL-2020-0001` | Mihir Pawar | Approves everything and assigns mentors |
| Super Admin | `ATL-2019-0004` | Dr. Meera Joshi | Read-only leadership view |
| Founder | `ATL-2023-0342` | Arjun Mehta | A second founder (**EduTrack**). Also a student — good for testing two roles |

## 10.2 Other student accounts

| App ID | Name | Purpose |
|---|---|---|
| `ATL-2021-0119` | Priya Shah | Student who owns the **GreenGrid** idea (pending incubation) |
| `ATL-2025-0988` | Vivaan Nair | Student who owns **FinFlow** (under review) |
| `ATL-2024-0902` | Anjali Rao | Student with an application at "Interview" stage |
| `ATL-2023-0777` | Dev Malhotra | Student with a fresh "Applied" application |
| `ATL-2023-0541` | Kavya Reddy | **Inactive account.** Use this to check that inactive people are hidden from the student pool |

## 10.3 Mentor accounts

These five people exist so mentors can be assigned. **They have no platform role**,
so if they log in they cannot enter any area.

| App ID | Name | Mentor type |
|---|---|---|
| `ATL-2018-0007` | Rahul Nair | Alumni mentor |
| `ATL-2019-0011` | Ananya Iyer | Industry mentor |
| `ATL-2019-0012` | Karan Malhotra | Industry mentor |
| `ATL-2019-0013` | Priya Deshmukh | Faculty mentor |
| `ATL-2018-0014` | Sanjay Verma | Alumni mentor |

## 10.4 Demo data you will see

**Startups**

| Name | Owner | Status |
|---|---|---|
| NovaMed | Shantanu Ghuriani | Active |
| EduTrack | Arjun Mehta | Active |
| GreenGrid | Priya Shah | Pending |
| FinFlow | Vivaan Nair | Under review |

**Listings**

| Title | Type | Status |
|---|---|---|
| UI/UX Designer | Job | Live |
| Frontend Developer | Job | Pending |
| Marketing Lead | Job | Live |
| Data Analyst | Job | Pending |
| Backend Developer | Job | **Rejected** — use this to test the override |
| Brand Collab | Collab | Live |
| Looking for a UI Designer… | Collab | Pending |

**Applications**

| Student | Applied for | Status |
|---|---|---|
| Riya Kapoor | UI/UX Designer | Under Review |
| Anjali Rao | UI/UX Designer | Interview |
| Dev Malhotra | UI/UX Designer | Applied |
| Riya Kapoor | Frontend Developer | Not Selected |
| Priya Shah | Marketing Lead | Applied |
| Riya Kapoor | Brand Collab | Shortlisted |

---

# 11. Complete platform flow

This is the whole business story in one picture, from an empty platform to a
working one.

```
                    UNIVERSITY SETS UP THE PLATFORM
                                 │
                                 ▼
        Backend Manager configures settings and rules
                                 │
                                 ▼
        Backend Manager grants FOUNDER ACCESS to a student
                                 │
                                 ▼
        That person becomes a FOUNDER
                                 │
                                 ▼
        Founder creates and edits their STARTUP PAGE
                                 │
                                 ▼
        Founder applies for INCUBATION
                                 │
                                 ▼
        Forge Manager reviews  →  startup becomes ACTIVE
                                 │
                                 ▼
        Founder POSTS A JOB                    Student FLAGS AVAILABILITY
                    │                                       │
                    ▼                                       │
        Listing is PENDING                                  │
                    │                                       │
                    ▼                                       │
        Forge Manager APPROVES it                           │
        (Backend Manager can override)                      │
                    │                                       │
                    ▼                                       ▼
        Listing goes LIVE  ─────────────────►  Student BROWSES JOBS
                                                            │
                    ┌───────────────────────────────────────┤
                    │                                       ▼
                    │                          Student APPLIES
                    │                                       │
                    ▼                                       ▼
        Founder SEARCHES STUDENT POOL          Founder SEES THE APPLICANT
                    │                                       │
                    ▼                                       ▼
        Founder CONTACTS the student           Founder REVIEWS them
                    │                                       │
                    ▼                                       ▼
        Contact is LOGGED                      ⚠️ Status change has no
                    │                             screen yet
                    │                                       │
                    └───────────────┬───────────────────────┘
                                    ▼
                    Student and Founder REQUEST MENTORSHIP
                                    │
                                    ▼
                    Forge Manager ASSIGNS A MENTOR
                                    │
                                    ▼
                    Session appears in the SESSION LOG
                                    │
                                    ▼
        EVERY SINGLE ACTION ABOVE IS WRITTEN TO THE ACTIVITY LOG
                                    │
                                    ▼
        Forge Manager and Backend Manager MONITOR the platform
                                    │
                                    ▼
        Super Admin READS THE REPORTS  (and changes nothing)
```

---

# 12. Current limitations

These are features that are **not finished yet**. They are listed so that testers
do not waste time reporting them as faults.

## 12.1 Things you can see but cannot use

These buttons appear on screen but are switched off. Hover over any of them and
the platform tells you why.

| What you see | Why it is switched off |
|---|---|
| Search box in the top bar | Search has not been built at all |
| Notification bell | Notifications are saved, but there is no screen to read them |
| "View Startup" / "View Profile" / "View Full Profile" | No startup or person detail screen has been designed yet |
| "See Roles" on a startup card | Browse Jobs cannot yet filter by one startup |
| "Edit Skills Profile" | Choosing skills needs a picker that is not designed yet |
| "Save as Draft" on the job and collab forms | Listings have no draft state |
| "Assign to Project" | Not built |
| "Add team member" | Needs a form that is not designed yet |
| Row menus (⋯) and expand arrows (⌄) | The menus and expanded views are not designed yet |
| "Manage" on the Forge Manager's User Accounts | Managing accounts belongs to the Backend Manager |

## 12.2 Workflows that stop early

| Workflow | Where it stops | What is missing |
|---|---|---|
| **Hiring** | The founder can see applicants but cannot move them through Applied → Shortlisted → Selected | The rules are built and enforced, but **no screen exists** to use them. This is the biggest gap in the platform today |
| **Job listings** | A founder can post a listing but can never edit or close it | Once posted, a listing stays open forever |
| **Mentorship** | A mentor can be assigned, but the session can never be marked complete or cancelled | The end of the mentorship cycle |
| **Mentorship (desktop)** | On a desktop screen, a founder has no button to request a session | It only appears on mobile-sized screens. Students are not affected |
| **Error logs** | Errors can be viewed but never marked as resolved | The error counter only ever goes up |
| **Concierge follow-up** | A contact is recorded but its status cannot be updated afterwards | No button exists |
| **Posted needs** | Existing needs can be read, but a founder cannot post a new one from the screen | No form exists |

## 12.3 Features planned but not started

| Feature | What it means for you |
|---|---|
| **Forgotten password** | If you forget your password there is no way to reset it yourself. Someone must reset it for you |
| **Change password** | There is no screen to change your own password |
| **Email and notifications** | The platform never sends an email or a message to anyone. If a student is rejected, nobody tells them. All updates must be checked by opening the platform |
| **Message inbox** | You can send a message to the Forge Manager, but neither of you has a screen to read the conversation |
| **Application history** | The full history of an application is recorded but has no screen |
| **Long lists** | Very long lists show only the first part. There are no "next page" buttons yet |
| **Empty screens** | If a list has nothing in it, most screens show a blank area with no helpful message |

## 12.4 Known issues you will notice while testing

These are **real faults that are not fixed yet**. Please do not raise duplicate
reports for them.

| What you will see | Explanation |
|---|---|
| **"Last active" always says "Just now"** for every user | The platform is reading times incorrectly. Every user looks like they were just online, even if they have not logged in for a month. Affects the All Users screens and some date labels elsewhere |

## 12.5 What works well today

So the picture is balanced — these journeys are complete and can be tested fully:

- ✅ Logging in, choosing a role, and logging out
- ✅ Blocking people from areas they should not reach
- ✅ Locking an account after too many wrong passwords
- ✅ A student flagging availability
- ✅ A student applying for a job
- ✅ A student posting a collab
- ✅ A student and founder applying for incubation
- ✅ A student and founder requesting mentorship
- ✅ A founder posting a job
- ✅ A founder editing their startup
- ✅ A founder searching the student pool and contacting a student
- ✅ A Forge Manager approving or rejecting listings
- ✅ A Forge Manager reviewing incubation applications
- ✅ A Forge Manager assigning mentors
- ✅ A Forge Manager featuring a project
- ✅ A Backend Manager overriding a decision
- ✅ A Backend Manager granting and revoking founder access
- ✅ A Backend Manager changing platform settings
- ✅ Every action being recorded in the logs
- ✅ The Super Admin's complete read-only view

---

## Quick reference card

**Login password for all demo accounts:** `Atlas@2026`

| I want to test… | Log in as | Then pick |
|---|---|---|
| Applying for a job | `ATL-2024-0871` | Standard Student |
| Posting a job | `ATL-2022-0012` | Founder (Startup) |
| Approving a job | `ATL-2020-0001` | Forge Manager |
| Overriding a decision | `ATL-2022-0012` | Backend Manager |
| Read-only reports | `ATL-2019-0004` | Super Admin |

---

*This guide describes the platform as it actually behaves today. Where something
is unfinished, it says so. If you find a difference between this document and the
platform, the platform is right — please report the difference so this guide can
be corrected.*
