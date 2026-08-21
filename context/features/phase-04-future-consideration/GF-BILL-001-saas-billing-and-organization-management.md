# GF-BILL-001 — SaaS Billing and Organization Management

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-BILL-001 |
| **Phase** | Phase 4 — Future Consideration |
| **Status** | Future |
| **Product Goal** | Implement multi-tier SaaS billing, subscription management, and organization administration |
| **MVP Classification** | Future |
| **Roadmap Link** | [Phase 4 — Future Consideration](../../roadmap.md#9-phase-4-future-consideration) |

---

## 1. Feature

SaaS billing infrastructure with multi-tier subscription plans, payment processing, organization management, seat management, and subscription lifecycle handling.

## 2. Purpose

GrantFlow is a SaaS product. Before public launch or paid tiers, billing infrastructure must handle subscriptions, payments, plan management, and organization administration.

## 3. User Outcome

Organization administrators can select a subscription plan, manage billing, update payment methods, view invoices, and manage organization membership and seats.

## 4. Scope

- Subscription plans: free tier (limited grants), pro tier (unlimited), enterprise tier (custom)
- Payment processing via Stripe (or equivalent)
- Plan selection and upgrade/downgrade flow
- Invoice generation and payment history
- Seat management (user count limits per plan)
- Organization admin settings: name, slug, membership management
- Subscription status checks for feature gating

## 5. Out of Scope

- Usage-based billing (per-grant, per-document, per-storage)
- Annual vs. monthly billing toggle
- Trial period management
- Coupon and discount management
- Tax handling (VAT, sales tax)
- Multi-currency billing
- Automated dunning and failed payment recovery

## 6. User Stories

- As an **organization admin**, I want to select a subscription plan so that my team can use GrantFlow.
- As an **organization admin**, I want to manage billing so that I can control costs.
- As an **organization admin**, I want to view invoices so that I have records for accounting.
- As an **organization admin**, I want to manage team members so that access is controlled.

## 7. Functional Requirements

1. **Subscription plans** defined with feature limits (grant count, user count, storage).
2. **Stripe integration** for payment processing, subscription creation, and webhook handling.
3. **Plan selection UI** for organization admin to choose/change plans.
4. **Billing portal** or Stripe-hosted checkout for payment method management.
5. **Subscription webhooks** sync Stripe events to local subscription state.
6. **Feature gating** — enforce plan limits on grant count, user count, and storage.
7. **Invoice records** — store invoices or link to Stripe invoice portal.
8. **Organization settings** — name, slug, membership list with role management.

## 8. Business Rules

1. Subscription is per-organization, not per-user.
2. Plan limits are enforced at the application layer (Server Actions check limits before allowing creation).
3. When a subscription expires or is canceled, the organization enters a grace period before read-only mode.
4. Payment and billing data never touches the application database — Stripe handles all PCI-scoped data.

## 9. User Experience

- Billing and organization settings in a Settings area.
- Plan selection page with plan comparison.
- Upgrade/downgrade with confirmation of changes.
- Invoice history view.
- Organization settings: name, slug, member management with role assignment.
- Plan limit warnings: "You've reached the limit of 50 grants. Upgrade to add more."

## 10. Data Requirements

**Organization entity additions (local table):**
- `stripeCustomerId` (text?), `stripeSubscriptionId` (text?), `plan` (text, e.g., "free"/"pro"/"enterprise"), `planLimits` (jsonb), `subscriptionStatus` (text)

**Webhook event processing** for Stripe events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

## 11. Permissions

| Role | Billing/Org Access |
|---|---|
| **ADMIN** | Full billing and org management |
| **MEMBER** | View organization settings; no billing access |
| **VIEWER** | No billing or org settings access |

## 12. States

| State | Behavior |
|---|---|
| **Free tier** | Basic functionality with plan limit enforcement |
| **Pro tier** | Full functionality |
| **Enterprise tier** | Custom limits |
| **Trial** | Full functionality with trial end date indicator |
| **Expired** | Grace period countdown; then read-only mode |
| **Canceled** | Service ends at period end |
| **Payment failed** | Warning banner; grace period |

## 13. Acceptance Criteria

- [ ] Plan selection works (free → pro upgrade)
- [ ] Stripe checkout processes payment successfully
- [ ] Plan limits are enforced (grant count, user count, storage)
- [ ] Invoice records are accessible
- [ ] Organization settings reflect current plan
- [ ] Admin can manage membership and roles
- [ ] Subscription webhooks sync correctly

## 14. Dependencies

- GF-AUTH-001 (user session, org context, role enforcement)
- GF-SHELL-001 (application shell, settings navigation)
- GF-DATA-001 (Organization entity additions)

## 15. Completion Criteria

- All acceptance criteria pass
- End-to-end billing flow works (select plan → checkout → payment → plan active → limits enforced)
- Subscription lifecycle is managed correctly (upgrade, downgrade, cancel, expire)

---

*Spec references: `context/project-brief.md` §17 (Future Direction - Billing)*
