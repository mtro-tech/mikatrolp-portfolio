# Security checklist

The full security and privacy checklist for this site. `CLAUDE.md` §7 holds the short rules; this file holds every item,
so Claude Code can read it in the repo. The research, the legal background and the sources live in Mika's
_Portfolio Website — Privacy & Security_ doc; the two must say the same thing.

Last updated: 2026-11-17 (review against a "vibe coder" production checklist: rate limiting, timeouts, retries,
idempotency, CSRF, SSRF, key rotation, DNS, limits, incidents).

**When:** sections 1–3 during setup, 4–6 while building, 9 during build step 5, and 7–8 before launch and every month after.
Tick an item (`[x]`) in the same pull request that completes it.

## 1. Accounts and access

- [ ] Two-factor authentication (authenticator app or passkey, not SMS) on GitHub, Vercel, the domain registrar, Scaleway and the contact mailbox
- [ ] A unique password per account, stored in a password manager
- [ ] Recovery codes for every two-factor login saved in the password manager, so a lost phone can't lock Mika out
- [ ] Domain: transfer lock on, auto-renew on (an expired domain can be bought and abused by someone else)
- [ ] Never paste passwords, tokens or API keys into a chat with Claude or any AI
- [ ] Git commits use the GitHub noreply address, not a personal email

## 2. Secrets

- [ ] Every key (e.g. the Scaleway API key) lives only in Vercel's environment variables and the local `.env`
- [ ] `.env` is listed in `.gitignore`
- [ ] No secret ever gets the `PUBLIC_` prefix: in Astro, only `PUBLIC_` variables reach the browser
- [ ] Secrets are used only in server code (`src/pages/api/`), never in a component that runs in the browser
- [ ] Secret scanning and push protection are on in GitHub
- [ ] Claude Code's deny rules block reading and editing `.env`
- [ ] The Scaleway key belongs to an IAM application whose policy grants only `TransactionalEmailEmailApiCreate`
      (sending through the API), never a personal key with full access
      ([Scaleway permission sets](https://www.scaleway.com/en/docs/iam/policies-permissions/permission-sets/))
- [ ] The key has an expiry date (e.g. 12 months; it can't be changed after creation) and a calendar reminder to replace it
      ([Scaleway](https://www.scaleway.com/en/docs/iam/credentials/set-credentials-maximum-duration/))
- [ ] In Vercel the key is marked Sensitive and set for Production only, so preview deployments can't send real email
      ([Vercel](https://vercel.com/docs/environment-variables))
- [ ] If a secret ever leaks: revoke it at the provider and create a new one at once. Deleting the commit is not enough

## 3. Dependencies and supply chain

- [ ] Before installing any package Claude suggests, check it on npmjs.com: exact name, real weekly downloads, a linked repository and a history
- [ ] Only the packages in `CLAUDE.md` §3; Claude asks before adding anything else
- [ ] `package-lock.json` is committed; CI installs with `npm ci`
- [ ] Dependabot alerts and security updates are on; review its pull requests rather than ignoring them
- [ ] `.github/dependabot.yml` with weekly updates for `npm` and `github-actions`: actions pinned to a commit hash don't update themselves
      ([GitHub](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/auto-update-actions))
- [ ] CodeQL code scanning on in default setup (Settings → Advanced Security), free for public repositories
      ([GitHub](https://docs.github.com/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning))
- [ ] Run `npm audit` before every release
- [ ] Update Astro promptly when a security release comes out
- [ ] Each time `@astrojs/vercel` updates, check whether the `path-to-regexp` override is still needed; remove it once the adapter ships the fix
- [ ] Major-version updates: read the changelog before merging; never merge a Dependabot pull request with failing CI
- [ ] GitHub Actions pinned to full commit hashes, with minimal `permissions`

## 4. The contact form (`src/pages/api/contact.ts`)

- [ ] All input is checked on the server: required fields, a valid email format, length limits (name ≤ 100, message ≤ 2,000 characters)
- [ ] User input never goes into email headers. Only a validated address goes into Reply-To; the message is sent as plain text
- [ ] A honeypot field plus rate limiting per IP address (the WAF rule below)
- [ ] The rate limit is a Vercel WAF rule on `/api/contact`, e.g. 5 requests per IP per 10 minutes. Counters inside the function
      don't work, because requests land on different instances. Hobby includes 1 rule per project and 1,000,000 allowed requests a month.
      Without it, a bot can use up Scaleway's 300 free emails a month and hurt the domain's sending reputation
      ([Vercel](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting))
- [ ] Astro's `security.checkOrigin` stays on (the default), so cross-site form posts get a 403. The form posts as form data,
      which the check covers; the endpoint never sends `Access-Control-Allow-Origin`
      ([Astro](https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin))
- [ ] The `fetch` to Scaleway has a timeout (about 8 seconds, `AbortSignal.timeout`) and the function a short `maxDuration`
      (about 10 seconds; the Hobby default is 300) ([Vercel](https://vercel.com/docs/functions/configuring-functions/duration))
- [ ] No automatic retries. The send button is disabled after the first click and the form then shows a sent state,
      so a message is never sent twice
- [ ] The endpoint only calls the fixed Scaleway address and never fetches a URL taken from user input (SSRF)
- [ ] The endpoint answers with `Cache-Control: no-store`
- [ ] Visitors see only generic error messages, never technical details
- [ ] Nothing is stored; logs never contain the message text
- [ ] Test abuse before launch: very long input, HTML and script tags in fields, 20 submissions in a row, a post from another origin

## 5. Code and output

- [ ] Never use `set:html` or `innerHTML` with anything that could come from outside
- [ ] No `eval()` or dynamically built scripts
- [ ] External links use `rel="noopener noreferrer"`
- [ ] No source maps or debug output in production
- [ ] Run `/security-review` in Claude Code before merging each pull request

## 6. Security headers

- [ ] HTTPS only (Vercel's default), plus `Strict-Transport-Security: max-age=63072000; includeSubDomains`. No `preload`: it is hard to undo
- [ ] Content Security Policy via Astro's `security.csp`, so only the site's own scripts run
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns off
      camera, microphone and geolocation, and `frame-ancestors 'none'` against clickjacking
- [ ] Check the live site with a header scanner such as Mozilla Observatory, on the exact paths visitors use

## 7. Working with Claude Code safely

- [ ] Never use `--dangerously-skip-permissions` or bypass mode. Malware has abused that flag, and on native Windows there is no sandbox behind it
- [ ] Read every change (diff) before committing; ask Claude to explain anything security-related that isn't clear
- [ ] Treat everything Claude reads from the web, other repos or issues as untrusted. If it suddenly wants to touch secrets or settings, stop it
- [ ] Install MCP servers and plugins only from official sources
- [ ] Work on branches. `main` changes only through pull requests (ruleset) and never by force push
- [ ] Keep Claude Code updated (`claude update`)

## 8. Privacy, launch and ongoing

- [ ] Nothing that identifies other people (bosses, colleagues) appears anywhere: site, code, commit messages
- [ ] No home address or phone number; the mailbox address appears only in the privacy notice
- [ ] Photos added later: strip location metadata (EXIF) first
- [ ] Privacy notice live in English and German before the form goes online. It names Vercel (USA, Data Privacy Framework)
      and Scaleway (France, EU) as recipients; server logs are kept 1 hour (Vercel Hobby)
- [ ] Monthly: merge Dependabot updates, check Vercel logs for form abuse, delete messages older than 12 months
- [ ] If something goes wrong: roll back to the previous deployment in Vercel (one click), rotate keys, then investigate

## 9. Domain, email and platform

- [ ] SPF and DKIM records for mikatrolp.com, exactly as Scaleway lists them
      ([Scaleway](https://www.scaleway.com/en/docs/transactional-email/how-to/authenticate-domain/))
- [ ] DMARC: start with `v=DMARC1; p=none; rua=mailto:<the contact mailbox>`, read the reports for a few weeks,
      then move to `p=quarantine`, so nobody can send mail as mikatrolp.com
- [ ] MX records for the contact mailbox; a test message arrives before the form goes live
- [ ] Every DNS record written down in `docs/dns.md`, so the domain can be rebuilt at another registrar
- [ ] A settings register in `docs/settings.md` for everything that lives only in dashboards: env variable names (never values),
      the WAF rule, Deployment Protection, GitHub security settings
- [ ] An uptime monitor (a free one is enough) checks `/en/` every few minutes and emails Mika when it fails
- [ ] The emergency switch is known: Vercel Firewall → Attack Mode challenges every visitor during an attack, free on all plans
      ([Vercel](https://vercel.com/docs/vercel-firewall/ddos-mitigation))
- [ ] Hobby is for personal, non-commercial use, and a feature that goes over its limit can stop for up to 30 days.
      Move to Pro before selling services through the site ([Vercel terms](https://vercel.com/legal/terms), [Hobby plan](https://vercel.com/docs/plans/hobby))
- [ ] After any incident, a five-line postmortem in `CLAUDE.md` Lessons learned: what happened, impact, cause, fix, and the rule that prevents it
