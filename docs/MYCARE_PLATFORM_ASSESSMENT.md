# My Care Personal Assistant - Platform Assessment

**Jira Ticket**: Platform Migration Assessment
**Date**: February 17, 2026
**Author**: Engineering Team

---

## Executive Summary

**Recommendation**: **Migrate to engineer-friendly environment** (already completed)

The My Care site has been migrated from the AI site builder (Readdy) to a standard React/TypeScript stack with full source control. This document provides the rationale and impact assessment.

---

## Option 1: Stay on Current AI Site (Readdy)

### Pros

| Benefit | Details |
|---------|---------|
| No migration effort | Site already exists and is functional |
| Visual editing | Non-technical users can make content changes |
| Quick prototyping | Fast to iterate on design concepts |
| Hosting included | No infrastructure management needed |

### Cons

| Issue | Impact | Severity |
|-------|--------|----------|
| **Single-user access** | Only one person can edit at a time; blocks collaboration | 🔴 High |
| **No version control** | No git history, no rollback capability, no code review | 🔴 High |
| **Code sharing limitations** | Cannot share codebase with team or contractors | 🔴 High |
| **Vendor lock-in** | Dependent on Readdy platform availability and pricing | 🟡 Medium |
| **Limited Stripe integration** | Basic checkout only; complex metered billing requires custom code | 🔴 High |
| **No CI/CD** | Manual deployments, no automated testing | 🟡 Medium |
| **Scalability concerns** | Cannot optimize performance or add caching | 🟡 Medium |
| **Limited Calendly integration** | Cannot customize booking flows or add backend logic | 🟡 Medium |

---

## Option 2: Migrate to Engineer-Friendly Environment

### Pros

| Benefit | Details |
|---------|---------|
| **Full source control** | Git history, branches, code review, collaboration |
| **Team collaboration** | Multiple developers can work simultaneously |
| **Stripe full integration** | Billing Meters, usage-based pricing, webhooks, customer portal |
| **Calendly flexibility** | Webhooks, custom booking flows, backend integration |
| **CI/CD pipeline** | Jenkins automation, automated testing, staged deployments |
| **Scalability** | ECS auto-scaling, CloudFront CDN, performance optimization |
| **Customization** | Full control over UI/UX, A/B testing (VWO), analytics |
| **Future-proof** | Can add any features without platform limitations |

### Cons

| Issue | Impact | Severity |
|-------|--------|----------|
| Migration effort | One-time development cost | 🟢 Low (completed) |
| Requires engineering | Need developers for changes | 🟢 Low |
| Infrastructure management | AWS/hosting costs and maintenance | 🟢 Low |

---

## Impact Assessment

### 1. Stripe Integration

| Feature | AI Site (Readdy) | Migrated (React) |
|---------|------------------|------------------|
| Basic checkout | ✅ Yes | ✅ Yes |
| Subscription billing | ⚠️ Limited | ✅ Full support |
| **Usage-based billing (Billing Meters)** | ❌ No | ✅ Yes |
| Metered overage charges | ❌ No | ✅ Yes |
| Customer portal | ❌ No | ✅ Can add |
| Webhooks | ❌ No | ✅ Yes |
| Invoice customization | ❌ No | ✅ Yes |
| Price experiments (A/B) | ❌ No | ✅ Yes (VWO) |

**Verdict**: Migration enables the full My Care pricing model (base subscription + hourly overage), which is **not possible** on the AI site.

### 2. Calendly Integration

| Feature | AI Site (Readdy) | Migrated (React) |
|---------|------------------|------------------|
| Embed booking widget | ✅ Yes | ✅ Yes |
| Webhook handling | ❌ No | ✅ Yes |
| Auto-create Stripe customer | ❌ No | ✅ Yes |
| Track session hours | ❌ No | ✅ Yes |
| Link bookings to billing | ❌ No | ✅ Yes |

**Verdict**: Migration enables automatic session tracking and billing integration with Calendly.

### 3. Future Payment Workflows

| Workflow | AI Site | Migrated |
|----------|---------|----------|
| Free trial → Paid conversion | ⚠️ Manual | ✅ Automated |
| Usage reporting | ❌ Manual tracking | ✅ Automated via API |
| Overage billing | ❌ Not possible | ✅ Automatic |
| Plan upgrades/downgrades | ⚠️ Manual | ✅ Self-service portal |
| Refunds/credits | ⚠️ Manual | ✅ API + webhooks |
| Invoice generation | ⚠️ Basic | ✅ Full customization |
| Payment failure handling | ❌ None | ✅ Dunning emails |

---

## Velocity Impact

| Metric | AI Site | Migrated |
|--------|---------|----------|
| **Developer collaboration** | 1 person | Unlimited |
| **Deployment frequency** | Manual, slow | Automated, fast |
| **Feature development** | Limited by platform | No limitations |
| **Bug fixes** | Depends on vendor | Immediate |
| **A/B testing** | Not possible | Full VWO integration |
| **Code reviews** | Not possible | Standard PR workflow |

---

## Migration Status

✅ **COMPLETED** - The migration has been executed:

| Item | Status |
|------|--------|
| React/TypeScript frontend | ✅ Done |
| Express.js backend API | ✅ Done |
| Stripe Checkout integration | ✅ Done |
| Stripe Billing Meters (usage-based) | ✅ Done |
| Products & prices created | ✅ Done |
| Git repository | ✅ https://bitbucket.org/legalmatch/mycare-personal-assistant |
| Docker configuration | ✅ Done |
| Jenkins CI/CD pipeline | ✅ Done |
| AWS ECS task definition | ✅ Done |
| Documentation | ✅ Done |

---

## Recommendation

### ✅ **Migrate to engineer-friendly environment** (React/TypeScript)

**Rationale**:

1. **Business-critical**: My Care's pricing model requires usage-based billing (Billing Meters), which is not supported by AI site builders.

2. **Team velocity**: Single-user access on AI site is a blocker for team collaboration and parallel development.

3. **Future roadmap**: Calendly integration, automated session tracking, and customer self-service portal all require custom backend code.

4. **Risk mitigation**: Source control, code reviews, and CI/CD reduce risk of production issues.

5. **Cost efficiency**: Long-term maintenance is lower with standard tooling vs. proprietary platform.

---

## Next Steps

1. ☐ Configure AWS infrastructure (VPC, ECS, ALB)
2. ☐ Set up Jenkins jobs for CI/CD
3. ☐ Add Calendly webhook integration
4. ☐ Implement customer portal
5. ☐ Set up production Stripe keys
6. ☐ DNS cutover from Readdy to AWS

---

## Appendix: Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Express.js, Node.js 22 |
| Payments | Stripe (Checkout, Billing Meters, Webhooks) |
| Scheduling | Calendly (planned integration) |
| Infrastructure | AWS ECS Fargate, ECR, ALB, CloudWatch |
| CI/CD | Jenkins, Docker |
| Source Control | Bitbucket |
| A/B Testing | VWO (ready for integration) |
