# Manual production release checklist

- [ ] CI passes from clean lockfile installs and a clean PostgreSQL database.
- [ ] Database backup and restore rehearsal completed.
- [ ] Production origins, proxy count, TLS, secrets and SMTP verified.
- [ ] `/api/health` and `/api/ready` pass through the load balancer.
- [ ] Registration, login, reset, account export and deletion verified with controlled accounts.
- [ ] Free learning, quiz, evidence review, readiness, portfolio and certificate journeys verified.
- [ ] Payment webhook signatures, retries, refunds and disputes verified with the approved provider.
- [ ] Referral hold, reversal, currency isolation and withdrawal review verified.
- [ ] Administrator role matrix and final-administrator protection verified concurrently.
- [ ] Keyboard, mobile, reduced-motion and WCAG contrast review completed.
- [ ] Logs contain request IDs and no credentials, tokens, evidence URLs or payout destinations.
- [ ] Privacy, terms and refund text approved by the owner/legal reviewer.
- [ ] Monitoring alerts, incident contacts and rollback owner recorded.
