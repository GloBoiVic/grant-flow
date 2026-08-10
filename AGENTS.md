# Grant Flow

Design a modern SaaS web application called **GrantFlow** — a grant portfolio management platform for nonprofit organizations. The interface should be **professional, minimal, and dense**, inspired by **Linear**. Light mode only.

### Design Direction

- **Linear-inspired** — clean, fast, keyboard-first, info-dense
- **Professional** — appropriate for nonprofit grant professionals who use this all day
- **Dense** — lots of information on screen without feeling cramped
- **Light mode only** — no dark mode

### Color Palette

**Primary:**

- Primary: Indigo #4F46E5
- Primary Hover: #4338CA
- Primary Light: #EEF2FF (selected rows, light backgrounds)

**Background:**

- Background: Soft Gray #F4F6F6
- Surface: White #FFFFFF (cards, panels, tables)
- Border: #E5E7EB

**Text:**

- Text: Deep Charcoal #1F2937 (headings, primary)
- Text Secondary: #6B7280 (labels, descriptions)
- Text Muted: #9CA3AF (placeholders, timestamps)

**Status Colors:**
| Status | Background | Text |
|--------|------------|------|
| To Apply | #F3F4F6 | #6B7280 |
| In Progress | #EEF2FF | #4F46E5 |
| Submitted | #FEF3C7 | #D97706 |
| Approved Award | #D1FAE5 | #059669 |
| Declined Award | #FEE2E2 | #DC2626 |
| Declined LOI | #FEE2E2 | #DC2626 |

**Urgency Colors:**
| Urgency | Background | Text | Badge |
|---------|------------|------|-------|
| Due < 7 days | #FEE2E2 | #DC2626 | DUE |
| Due < 30 days | #FEF3C7 | #D97706 | SOON |

### Typography

- Font: Inter
- Body: 14px / 400
- Headings: 24px (h1), 18px (h2), 14px (h3)
- Caption/Labels: 12px
- Dense type scale — not too much whitespace

### Layout

- **Fixed sidebar** on left (220px, collapsible to 60px)
- **Top navigation** with global search (⌘K), notifications bell, user avatar
- **Main content area** on right
- **Density:** Dense — Linear-style, compact, info-rich

---

## Screens to Design

### 1. Dashboard (Health at a Glance)

**Sidebar items:**

- WORKSPACE section: Dashboard, Grants (42), Funders (18), Deadlines (7)
- User menu at bottom: avatar, name, org name

**Main content:**

- Page title: "Dashboard"
- **4 metric cards in a row:**
  - IN PURSUIT: $3.2M (trend: ^ +12% vs last quarter, green)
  - AWARDED YTD: $1.4M (trend: ^ +8% vs last quarter, green)
  - WIN RATE: 31% (trend: v -3 pts vs last quarter, red)
  - ACTIVE GRANTS: 42 (trend: ^ +5 this month, green)
- Metric card style: Label in uppercase caption, value large/bold, trend small below

- **Recent Grants section:**
  - Header: "Recent Grants" with badge "42 total" and "View all →" link
  - Table: Title, Funder, Status (badge), Amount, Due
  - 5-6 rows with status badges
  - Dense table style (44px rows)

- **Bottom row (2 columns):**
  - Left: **Upcoming Deadlines** with badge "7" and "Calendar →" link
    - List: Date badge (day + month), Grant title, Funder, Status badge, Urgency badge (DUE/SOON)
    - 5 items
  - Right: **Recent Activity**
    - Timeline: User avatar (initials), Description, Timestamp
    - 5 items (marked as awarded, created grant, uploaded doc, moved status, etc.)

---

### 2. Grants List Page

**Sidebar:** Same as dashboard, Grants item highlighted

**Main content:**

- Page title: "Grants" with "+ Add Grant" button (indigo, top right)
- **Filter chips row:** "Add Filter ▾" button + active filter chips (Status: Submitted ×, Funder: Bader ×)
- **Data table:**
  - Columns: Checkbox, Title, Funder, Status (badge), Priority (badge), Amount, Due, Owner (avatar initials)
  - Row height: 44px (dense)
  - Header: Uppercase, caption size, sticky
  - Hover: Light indigo highlight (#EEF2FF)
  - 6-8 rows of data
  - Some rows have urgency badges (DUE in red, SOON in amber)
- **Pagination** at bottom: "Showing 1-20 of 42" with ← Prev Next → buttons

---

### 3. Grant Sidebar (Slide-Over Panel — FROM RIGHT)

**Triggered by:** Clicking a grant row

**Panel content (480px wide, slides from RIGHT):**

- **Header:** Grant title "Housing Stability Pilot" + Close (✕) button
- **Status badge:** ● Draft
- **Funder chip:** 🏛 Hilton Foundation · Program officer: Ana Reyes
- **Quick action buttons:** Upload, Edit, Change Status ▾, Delete
- **Summary cards row (3 cards):**
  - AMOUNT REQUESTED: $120,000 / over 2 years
  - DEADLINE: Apr 18, 2026 / draft due
  - STATUS: ● Draft / draft ready to review

- **Milestones section:**
  - Vertical timeline with colored dots
  - Completed (green dot): Grant created · Mar 02, 2026
  - Completed (green dot): Internal review · Mar 28, 2026
  - Completed (green dot): Budget finalized · Apr 08, 2026
  - In progress (blue dot): Final review · Apr 19, 2026
  - Pending (gray dot): Submitted to funder
  - Pending (gray dot): Funder decision

- **Documents section:** Documents (3)
- **Recent Activity section:** Last 3 items
- **"View Full Details →"** link at bottom

**Background:** Semi-transparent overlay on main content (which stays visible on right)

---

### 4. Grant Detail Page (Full Page)

**Header:**

- Back arrow + "Back to Grants"
- Breadcrumb: Grants / Housing Stability Pilot · DRAFT badge

**Grant title:** Housing Stability Pilot
**Funder:** 🏛 Hilton Foundation · Program officer: Ana Reyes

**Quick action buttons:** Upload, Edit, Change Status ▾, Delete

**Summary cards row (4 cards):**

- AMOUNT REQUESTED: $120,000 / over 2 years
- DEADLINE: Apr 18, 2026 / draft due
- STATUS: ● Draft / draft ready to review
- OWNER: Mira Hassan / Director of Grants

**4 tabs:** Overview | Documents (3) | Milestones | Activity

**Overview Tab (default):**

- **Funder Relationship section:**
  - Relationship since: 2019
  - Prior awards: 3
  - Lifetime funded: $1.2M
  - Win rate: 50%
  - Preferred format: Online portal
- Notes section

**Documents Tab:**

- Upload button
- Document list with: Name, Type badge, Size, Date, Download, Delete

**Milestones Tab:**

- Full milestone timeline with all 6 milestones
- Status dots, titles, descriptions, dates

**Activity Tab:**

- Full activity timeline with user avatars, descriptions, timestamps

---

### 5. Global Search (⌘K)

**Location:** Top navigation bar

**State when clicked:**

- Search input with magnifying glass icon
- Placeholder: "Search grants, funders..."
- Keyboard shortcut hint: ⌘K

**Dropdown results:**

- "Grants" section with 2-3 results (title, funder, status badge)
- "Funders" section with 1-2 results (name, type badge)
- Each result shows right arrow →

---

### 6. Filter Chips

**Location:** Above the grants table

**State:**

- "Add Filter ▾" button with dropdown arrow
- Active chips: "Status: Submitted ×", "Funder: Bader ×"
- "Clear All" link when filters active

---

### 7. Funder List Page

**Similar to Grants List but simpler:**

- Page title: "Funders" with "+ Add Funder" button
- Data table columns: Name, Type (badge), Contact, Grants count, Total Awarded
- No filter chips needed (simpler)
- Click row opens funder detail

---

### 8. Deadlines Page

**Sidebar:** Deadlines item highlighted

**Main content:**

- Page title: "Upcoming Deadlines" with badge "[7 total]"
- List view sorted by date (soonest first)
- Each item:
  - Date badge (day + month) on left
  - Grant title + funder name in middle
  - Status badge on right
  - Urgency badge (DUE/SOON) if applicable
- 7 items showing various statuses and urgency levels

---

### 9. Login Page

**Centered card design:**

- GrantFlow logo (indigo)
- "Sign in to GrantFlow"
- Email input
- Password input
- "Sign In" button (indigo)
- "Or continue with Microsoft" button (with Microsoft icon, gray/outline)
- "Don't have an account? Sign up" link

---

### 10. Empty State (No grants yet)

**Centered layout:**

- Folder icon (muted, 40px)
- "No grants yet"
- "Create your first grant to get started."
- "Create Grant" button (indigo)

---

## Design Style Notes

- **Linear-inspired** — professional, fast, keyboard-first
- **Dense** — 44px table rows, compact spacing, 14px body text
- **Minimal decorations** — let the data speak
- **Subtle shadows** — cards and panels have light shadows
- **Rounded corners** — 6px for buttons, 8px for cards
- **Uppercase labels** — for metric cards, table headers, section titles
- **Status badges** — small, colored, consistent throughout
- **Urgency badges** — red "DUE" and amber "SOON" for upcoming deadlines

---

## Color Reference for Status Badges

| Status         | Background | Text    |
| -------------- | ---------- | ------- |
| To Apply       | #F3F4F6    | #6B7280 |
| In Progress    | #EEF2FF    | #4F46E5 |
| Submitted      | #FEF3C7    | #D97706 |
| Approved Award | #D1FAE5    | #059669 |
| Declined Award | #FEE2E2    | #DC2626 |
| Declined LOI   | #FEE2E2    | #DC2626 |

## Color Reference for Urgency Badges

| Urgency       | Background | Text    | Label |
| ------------- | ---------- | ------- | ----- |
| Due < 7 days  | #FEE2E2    | #DC2626 | DUE   |
| Due < 30 days | #FEF3C7    | #D97706 | SOON  |
