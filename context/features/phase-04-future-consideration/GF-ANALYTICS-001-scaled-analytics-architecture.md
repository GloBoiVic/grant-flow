# GF-ANALYTICS-001 — Scaled Analytics Architecture

---

## Metadata

| Field | Value |
|---|---|
| **ID** | GF-ANALYTICS-001 |
| **Phase** | Phase 4 — Future Consideration |
| **Status** | Future |
| **Product Goal** | Scale analytics infrastructure to support larger portfolios, faster queries, and richer insights |
| **MVP Classification** | Future |
| **Roadmap Link** | [Phase 4 — Future Consideration](../../roadmap.md#9-phase-4-future-consideration) |

---

## 1. Feature

Scaled analytics architecture that evolves beyond live Prisma aggregate queries. Introduces materialized views, query caching, and optimized reporting infrastructure to support growing portfolios and more complex analytics needs.

## 2. Purpose

As organizations grow their grant portfolios (10,000+ records) and reporting needs become more complex, live aggregate queries may become slow. GF-ANALYTICS-001 provides the infrastructure to scale reporting performance without degrading the user experience.

## 3. User Outcome

Grant professionals with large portfolios experience fast dashboard metrics, report generation, and portfolio views. Analytics are delivered at the same speed regardless of portfolio size.

## 4. Scope

- Materialized views for dashboard aggregate metrics
- Query result caching (Next.js data cache or lightweight Redis)
- Background job queue for expensive report generation
- Database index optimization for reporting queries
- Cached metric refresh strategy (stale-while-revalidate)

## 5. Out of Scope

- Data warehouse or ETL pipeline
- Event sourcing or change data capture
- Machine learning or predictive analytics
- Real-time analytics dashboards
- Custom analytics query builder for users
- External analytics service integration (e.g., Mixpanel, Amplitude)

## 6. User Stories

- As a **grant professional**, I want the dashboard to load quickly even with thousands of grants.
- As a **grant professional**, I want reports to generate without noticeable delay.

## 7. Functional Requirements

1. **Materialized views** defined for common aggregate queries:
   - Portfolio metrics (total requested/awarded, success rate, active counts)
   - Status distribution
   - Funder performance aggregates
2. **Refresh strategy** — materialized views are refreshed on a schedule (e.g., every 5 minutes) or on-demand when stale data is detected.
3. **Query caching** — Next.js data cache with tag-based invalidation for expensive query results.
4. **Background job queue** — in-process job queue for generating reports that take >2 seconds.
5. **Index optimization** — periodic review and addition of composite indexes for reporting query patterns.

## 8. Business Rules

1. Cached data is acceptable for reporting views. Dashboard metrics may be up to 5 minutes stale.
2. Materialized views are refreshed at lowest-traffic times or on a schedule.
3. Background jobs process one report at a time (serial queue) for MVP of this feature.
4. Cache is invalidated when the underlying data changes (grant created, updated, deleted).

## 9. User Experience

- No user-visible changes — performance improvements are invisible.
- Metrics and reports load as fast as cached data allows.
- If data is stale, a subtle indicator may show "Last updated: 2 minutes ago."

## 10. Data Requirements

- Materialized views defined in PostgreSQL via Prisma raw migration (requires raw SQL exception to the no-raw-SQL rule — per `context/database.md` §16 Rule 2). **Contradiction note:** `context/database.md` §16 Rule 2 states "No raw SQL — Prisma typed queries only." Materialized views inherently require raw SQL. This contradiction is acknowledged: materialized views and Prisma migrate's `--create-only` workflow are the accepted resolution path when this feature is implemented. No architectural change to the no-raw-SQL policy is made now.
- Cache keys and tags for Next.js data cache.

## 11. Permissions

- No change — same permission model as reporting (GF-REPORT-001).

## 12. States

| State | Behavior |
|---|---|
| **Cache hit** | Fast response from cached/materialized data |
| **Cache miss** | Live query executed; result cached for next request |
| **Refreshing** | Materialized view being refreshed; stale data served |
| **Background job pending** | Report queued; user notified when ready |

## 13. Acceptance Criteria

- [ ] Materialized views are defined for dashboard metrics
- [ ] Query caching reduces response time for repeated requests
- [ ] Cache invalidation works when data changes
- [ ] Background job queue processes reports without blocking UI
- [ ] Performance is measurably improved for large portfolios (>10,000 grants)

## 14. Dependencies

- GF-DATA-001 (PostgreSQL, Prisma)
- GF-DASH-001 (dashboard metrics)
- GF-REPORT-001 (report generation)

## 15. Completion Criteria

- All acceptance criteria pass
- Dashboard loads in <200ms for portfolios of 10,000+ grants
- Reports generate in <500ms for typical data volumes

---

*Spec references: `context/architecture.md` §15 (Scalability Philosophy)*
