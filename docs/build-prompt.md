# Role
You are a senior creative front-end developer and motion designer who builds award-level, scroll-driven storytelling websites, with a strong security and privacy mindset. You work in Claude Code.

# Task
Build a single-page, scroll-driven landing page in English and German. It is the first piece of my personal portfolio website. Scrolling should feel like a journey through my experience: a hotel guest's stay, travelled along a route across a map.

# Read first
- `CLAUDE.md` in the project root is the rulebook. Follow it, especially §2 (non-negotiables) and §7 (security & privacy). Keep it updated as we go: decision log, lessons learned, open questions.
- `docs/content-source.md` holds my questionnaire answers. It is the ONLY source of facts about me. Turn it into typed content collections in `src/content/` (EN + DE).
- The project is already set up per my Setup Guide:
  - Astro 7, Tailwind 4, GSAP, Lenis
  - Prettier with the Astro plugin
  - Playwright, axe-core and Lighthouse CI
  - Playwright MCP, Context7 and frontend-design available
  - `.claude/settings.json` with deny rules for `.env`
  - GitHub repo (public) connected to Vercel

# About me (summary; details in docs/content-source.md)
- Mika Trolp, from St. Gallen. Studying for a Bachelor in Hospitality Management at SHL Schweizerische Hotelfachschule Luzern (2025–2029).
- Intern Bar & Lounges at Appenzeller Huus (Feb–Jul 2026), a 5-star Leading Hotels of the World property. Part-time bartender there since.
- Next: Guest Relations intern at Rosewood Hong Kong, 15 Feb – 6 Aug 2027. Present this as upcoming, NOT as completed.
- Former lieutenant in the Swiss Infantry: led and trained 60 people.
- I build with Claude and Claude Code; this website is the first project.

# Audience & purpose
1. Primary: future employers in high-end luxury hospitality, on an international scale. After scrolling, they should understand my guest focus, ambition, problem solving and openness.
2. Secondary: AI/tech people, innovators, investors and fellow students. They should see that I connect hospitality with AI, and want to get in touch.
Main action at the end: send me a message through the contact form, or visit my LinkedIn or GitHub.

# Concept: guest journey × route on a map
One continuous, thin, hand-drawn-style SVG line runs down the whole page and draws itself as you scroll, like a route on a map. Each stop on the route is a chapter named after a stage of a hotel stay:
1. Arrival: hero with my name and one positioning line (propose 3 options, EN + DE). The route starts at St. Gallen.
2. Check-in: who I am, how my interest in hospitality began, what good hospitality means to me, St. Gallen → Lucerne, languages.
3. Foundations: a short stop of 2–3 sentences about leading 60 people as a lieutenant, focused on leadership.
4. Behind the bar: Appenzeller Huus, my growth in guest contact, the tools I work with. Playful touch: cocktail glasses.
5. The academy: SHL Luzern, the programme and my favourite subjects only. No projects, grades or roles.
6. Next destination: Rosewood Hong Kong. The route stretches across a stylised map from Switzerland to Hong Kong and ends in a line-drawn skyline.
7. Concierge of the future: hospitality meets AI; the route line turns into a circuit-like line.
8. Check-out / guestbook: the contact form, designed and animated as part of this chapter, plus LinkedIn and GitHub links.
A small hidden detail somewhere: "the local hospitality of small joints all over the world".

# Mood & visual direction
Calm, warm and editorial overall, with exactly 3 cinematic peaks: the Arrival hero, the flight to Hong Kong, and the transition to AI. Everything else uses quiet motion: slow fades, line drawing, text reveals. Warm-professional tone with small playful elements that match each chapter.
Take these principles from my references, but do NOT copy their layouts, illustrations, fonts or text:
- thewayapp.com: the concept of guiding you through a journey (but at a faster pace)
- davidwhyte.com/experience: how the site takes you through a journey; warm paper tones
- dieselfarm.com/en: the moving elements
- deathbyscroll.com: my favourite animation style, because it flows as one whole; plus the visible motion on/off toggle
Visuals: code-drawn SVG line illustrations only. No photos, no portrait, no AI images. No dark mode, no sound.
Logos: build one reusable logo slot per organisation that shows the name as text. A logo appears only once its content entry records written permission; currently none do.
Palette: warm, comfortable, welcoming; no neon colours. Propose exact values. Fonts: one serif display + one sans, free licences, self-hosted.

# Tech & format
- Astro 7, pages prerendered. Use the `@astrojs/vercel` adapter only for the contact form endpoint.
- Tailwind CSS v4. Built-in i18n routing (`/en/`, `/de/`) with a language switch.
- Quiet motion: native CSS scroll-driven animations. Peaks: GSAP 3 + ScrollTrigger (DrawSVG, MotionPath, SplitText as needed). Lenis synced to GSAP's ticker.
- TypeScript strict; typed content collections.
- Mobile is first-class: simplify the route and the peaks on small screens.
- Reduced motion: `prefers-reduced-motion` and the visible toggle share one `gsap.matchMedia()` switch.
- Accessibility: semantic HTML, correct heading order, WCAG AA contrast, keyboard navigation, decorative SVGs hidden from screen readers.
- Performance: Lighthouse ≥ 90 for performance and accessibility on mobile, no layout shift.
- Analytics: Vercel Web Analytics (cookieless). Nothing else that tracks.
- German copy follows Swiss conventions ("ss", never "ß").

# Security & privacy (details in CLAUDE.md §7)
- Contact form:
  - Fields: name, email, message, plus a honeypot.
  - Validate on the server with length limits; no user input in email headers; send as plain text.
  - Rate-limit per IP address; show generic errors only.
  - Store nothing; never log message contents.
  - The email service's API key lives only in environment variables.
- Security headers:
  - CSP via Astro `security.csp`
  - HSTS without preload
  - nosniff
  - Referrer-Policy
  - Permissions-Policy
  - frame-ancestors 'none'
- No third-party embeds, CDNs or Google Fonts. LinkedIn and GitHub are plain links.
- A privacy notice page in EN + DE, linked in the footer and next to the send button, must exist before the form goes live. Draft it from what the site actually does: hosting (Vercel, USA, Data Privacy Framework), email service, analytics, motion toggle storage, 12-month message retention, visitors' rights, my contact mailbox. I'll review it.
- Never read or edit `.env`. Ask before any new dependency and verify it on npmjs.com first.

# Rules
- Never invent facts about me: no made-up dates, achievements, numbers, quotes or testimonials. Where content is missing, insert a visible [TODO: …] placeholder and list all placeholders when you hand back work.
- Nothing that identifies other people (bosses, colleagues, lecturers), anywhere.
- Copy: first person, warm, confident, concise; no buzzwords; max ~60 words per chapter.
- Don't add sections I didn't ask for.
- One branch per chapter, a pull request with the Vercel preview link, never commit to main.

# Process (wait for my approval at each ⏸)
0. Confirm that Playwright MCP, Context7 and frontend-design are available, and that the deny rules are active. If anything is missing, tell me and stop. ⏸
1. Use the frontend-design skill. In plan mode, propose:
   - the chapter structure with scroll beats, and how the route behaves in each chapter
   - palette + font pairing
   - 3 headline options (EN + DE)
   - an email delivery service with an EU or Swiss region for the form ⏸
2. Configure the project:
   - content collections from `docs/content-source.md`
   - i18n routing
   - the Prettier hook (as a cross-platform Node script; I'm on Windows)
   - Playwright + axe tests, Lighthouse CI config
   - security headers and CSP
   - GitHub Actions pinned to commit SHAs
   - the commands section in CLAUDE.md
   Report the TODO list. ⏸
3. Build the Arrival hero only. Take Playwright screenshots at desktop (1440px) and mobile (390px). ⏸
4. Build one chapter at a time on its own branch, with screenshots, `/security-review` and a pull request each time. ⏸
5. Build the contact form, its server endpoint and the privacy notice (EN + DE). Test abuse cases: very long input, HTML in fields, rapid repeats. ⏸
6. Build the 3 cinematic peaks, the reduced-motion version and the toggle, then polish. ⏸
After every step, update CLAUDE.md (decision log, lessons learned, open questions).

# Quality check before every handoff
- CLAUDE.md §9 "definition of done" is met
- You reviewed desktop and mobile screenshots yourself
- No invented facts, no identifiable third parties; the TODO list is complete
- `/security-review` run, `npm audit` result reported, Lighthouse scores reported
- CLAUDE.md is updated
