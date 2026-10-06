# 📖 Production Release & Operations Runbook

**Service Name:** [e.g., `ordem-servico-api`]  
**Release Version:** [e.g., `v1.2.0`]  
**Target Environment:** [Production / Staging]  
**Lead SRE / On-Call:** [DevOps Engineer / SRE Agent]  
**Date & Time:** [YYYY-MM-DD HH:mm UTC]  

---

## 🎯 1. Release Objective & Scope
- **Linear Milestone / Epic:** [ENG-XX: Brief title]
- **Key Features Included:**
  - Feature A: Description
  - Feature B: Description
- **Database Migrations Required:** [Yes / No]
- **Estimated Maintenance Window:** [Zero Downtime / N minutes]

---

## 🛡️ 2. Pre-Deployment Verification Checklist
Ensure all prerequisite quality gates are satisfied before touching production:

- [ ] **Architecture Drift Audit:** `make check-arch` passed with 0 violations.
- [ ] **Test Coverage:** All unit, integration, and E2E tests passing.
- [ ] **Security SAST Audit:** OWASP Top 10 scanned, 0 High/Critical vulnerabilities.
- [ ] **Container Image Built:** Verified on GHCR / Registry with SHA hash.
- [ ] **Database Backup:** Cold or point-in-time recovery (PITR) snapshot verified.
- [ ] **Secrets & Config:** All new environment variables loaded into vault/secrets manager.

---

## 🚀 3. Step-by-Step Deployment Procedure

### Step 3.1: Database Migrations (Expand Phase)
> Execute non-breaking database schema changes (add columns, create new tables, non-blocking indices).
```bash
# Example migration command
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy
# or: go run ./cmd/migrate up
```

### Step 3.2: Canary / Rolling Container Update
> Deploy updated container instances in rolling batches.
```bash
# Verify new image pull and start
docker pull ghcr.io/org/repo:v1.2.0
# Kubernetes / ECS rolling rollout
kubectl set image deployment/app-service app=ghcr.io/org/repo:v1.2.0 -n production
kubectl rollout status deployment/app-service -n production --timeout=300s
```

### Step 3.3: Post-Deployment Smoke Tests
> Validate service responsiveness immediately after deployment.
```bash
# 1. Liveness Probe
curl -fsS https://api.domain.com/health/liveness || exit 1

# 2. Readiness Probe (DB & Cache)
curl -fsS https://api.domain.com/health/readiness | jq .

# 3. Critical Flow Smoke Test
curl -fsS -X POST https://api.domain.com/api/v1/auth/ping -H "Authorization: Bearer $TEST_TOKEN"
```

---

## 🚨 4. Incident Response & Rollback Playbook

### Rollback Triggers (Any of the following):
1. Error rate exceeds **1.0%** over a 5-minute rolling window.
2. Latency p95 exceeds **500ms** (exceeding baseline by 2x).
3. Critical business flow failure (e.g., checkout/order creation errors).
4. Unhandled database deadlocks or connection saturation.

### Rollback Procedure:
```bash
# Step 1: Revert application container to previous known-good tag
kubectl rollout undo deployment/app-service -n production
# or: docker compose -f docker-compose.prod.yml up -d --no-deps app:v1.1.0

# Step 2: Verify health of reverted pods
kubectl rollout status deployment/app-service -n production

# Step 3: Revert database migrations (if breaking changes were executed)
# Note: Always prefer expand/contract pattern so database rollback is NOT needed.
# If necessary:
# npx prisma migrate resolve --rolled-back <migration_name>

# Step 4: Notify squad & update incident war room
# Log incident in thoughts/shared/incidents/YYYY-MM-DD-incident.md
```

---

## 📊 5. Post-Deployment Monitoring & Sign-Off
- **Metrics Dashboard:** [Grafana / Datadog Link]
- **Log Streaming:** [CloudWatch / Papertrail Link]
- **Status:** [SUCCESS / ROLLED_BACK]
- **Completed By:** [SRE / Squad Lead Signature]
