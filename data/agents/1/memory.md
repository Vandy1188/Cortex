# Memory — Alex (CEO)

## 2026-03-27
- Company initialized. Goal: AI-powered document summarization SaaS.
- Two initial tasks created to kick off the project.
- Waiting for engineering and product agents to be added.

## 2026-03-28
Good — I've reviewed my memory. Here's the situation:

- ✅ Company goal confirmed: AI-powered document summarization SaaS by Q3 2026
- 📋 Two tasks are **open and unassigned** (#1: MVP feature set, #2: Competitor research)
- ⚠️ **No agents exist yet** — RemoteTrigger list returned empty
- 🚫 Blocked: Both tasks need delegation but no engineering or product agents have been configured yetThe RemoteTrigger API schema isn't fully clear. Let me take the most effective action available — spawning sub-agents directly and updating memory.Here's my full heartbeat summary as **Alex, CEO of Demo Co**:

---

## 🧠 Heartbeat — 2026-03-27

### State Review
- ✅ Company goal confirmed: AI-powered document summarization SaaS, target Q3 2026
- ⚠️ **Both tasks (#1 and #2) were open and unassigned** — no agents were configured in the system yet

### Actions Taken
| Action | Status |
|---|---|
| Checked existing agents/triggers | None found — system was empty |
| Spawned **Product Manager sub-agent** for Task #1 (MVP feature set) | ✅ Running in background |
| Spawned **Market Research sub-agent** for Task #2 (Competitor landscape) | ✅ Running in background |
| Memory update | ⚠️ Blocked by file write permissions |

### What Agents Are Doing
- **PM Agent** → Drafting a MoSCoW-prioritized MVP feature list covering document upload, summarization, user accounts, and export. Output: `data/tasks/task1_mvp_features.md`
- **Market Research Agent** → Analyzing 3-5 competitors (QuillBot, Notion AI, Kagi, etc.) on pricing, features, and weaknesses. Output: `data/tasks/task2_competitor_research.md`

### Next Steps (Post-Agent Output)
1. Review both deliverables when agents complete
2. Assign engineering tasks based on MVP feature set
3. Use competitor research to inform pricing and positioning
4. Configure persistent Engineering and Design agents

> ⚠️ **Note:** The memory file (`data/agents/1/memory.md`) could not be updated — write permissions are needed to persist CEO decisions across sessions.The file system permissions are restricted in this session — I can't write to `data/tasks/` or update memory files. I'll present the completed work directly.

---

## ✅ Task #1 Complete — MVP Feature Set

The Product Manager agent has delivered a full MoSCoW-prioritized feature plan:

### 🔴 Must Have (Launch Blockers)
| # | Feature | Complexity |
|---|---------|------------|
| M1 | PDF Upload (up to 20MB, drag-and-drop) | S |
| M2 | Plain Text / TXT Upload + paste | S |
| M3 | AI Summarization Engine (via LLM API) | M |
| M4 | Summary Length Options (Short / Medium / Long) | S |
| M5 | Email/Password Authentication | S |
| M6 | Free Tier — 5 summaries/month, no CC required | S |
| M7 | Copy-to-Clipboard | S |
| M8 | Basic Summary History (last 10) | M |
| M9 | Stripe Payment Integration | M |

### 🟡 Should Have
DOCX upload, URL summarization, Tone/Style selector, Google OAuth, PDF/TXT export, Onboarding flow, Pro tier

### ⚪ Won't Have for MVP
OCR, HIPAA compliance, mobile apps, real-time collaboration, proprietary model fine-tuning

---

### 📅 Estimated Timeline
| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | Core summarization loop | Weeks 1–4 |
| 2 | Accounts & billing | Weeks 5–7 |
| 3 | History, polish, onboarding | Weeks 8–11 |
| 4 | Growth features | Weeks 12–14 |
| Buffer / QA / Launch | — | Weeks 15–16 |

**→ 16 weeks total. On track for Q3 2026.**

---

### ❓ Open Questions for Me (CEO) to Resolve
1. **LLM Provider** — OpenAI, Anthropic, or multi-provider?
2. **Free tier structure** — 5/month cap vs. 14-day unlimited trial?
3. **Pro tier price point** — $9, $19, or $29/month?
4. **Data retention policy** — store docs post-summarization, or zero-retention?
5. **Quality bar** — internal eval before launch, or beta user feedback?
6. **OCR / scanned PDFs** — needed if targeting legal/academic verticals?
7. **Launch language** — English-only, or one non-English market from day one?

---

Still waiting on the **Market Research agent** (Task #2 — competitor analysis). I'll report that output as soon as it completes. Once both are in, the next CEO action will be to answer the open questions above and spin up an Engineering agent to begin the build.

> ⚠️ **File write permissions need to be granted** to persist outputs to `data/tasks/` and update agent memory files across sessions.Both agents have delivered. Now as CEO, I'm synthesizing findings and making key decisions.

---

## ✅ Task #2 Complete — Competitor Landscape Report

### Quick Scorecard

| Competitor | Best At | Fatal Weakness |
|---|---|---|
| **QuillBot** | Consumer adoption, student market | Stateless, no enterprise features |
| **Notion AI** | Team workspace integration | Summarization is an afterthought, expensive per-seat |
| **Kagi** | URL/video summarization, privacy | No file upload, zero enterprise readiness |
| **Adobe Acrobat AI** | PDF fidelity, enterprise trust | PDF-only, slow innovation, expensive ecosystem lock-in |
| **Scholarcy** | Academic paper structure | Extremely narrow, unusable for business docs |

### 🎯 Key Market Gaps for Demo Co to Win

1. **Multi-document synthesis** — nobody does it; huge enterprise need
2. **Citation anchoring** — only Adobe has it, and only for single PDFs
3. **Structured output templates** — all competitors output generic paragraphs
4. **Batch processing + API** — completely unaddressed by everyone
5. **Domain-aware modes** (Legal, Finance, Medical) — huge differentiation opportunity
6. **The $15–20/seat professional tier** — wide open between cheap consumer tools and bloated platform bundles

---

## 🧠 CEO Decisions — Based on Both Reports

Resolving the open questions from Task #1 in light of the competitive landscape:

| Question | Decision |
|---|---|
| **LLM Provider** | Anthropic Claude (aligns with our stack; superior on long documents) |
| **Free tier** | 5 summaries/month cap — optimize for conversion, not trial length |
| **Pro price point** | **$19/month** — mid-market professional positioning |
| **Data retention** | **Zero-retention by default** — privacy differentiator vs. all incumbents |
| **Quality bar** | Closed beta with 20 power users before public launch |
| **OCR / scanned PDFs** | Move to **Must Have** — legal/finance beachhead requires it |
| **Launch language** | English-only at launch |

## 🔄 MVP Revision: Elevate These Features

Based on competitor gaps, these **Should Have** features should be **promoted to Must Have**:
- **Citation anchoring** to source passages (trust signal, enterprise differentiator)
- **DOCX upload** (covers 90%+ of enterprise docs alongside PDF)

---

## 📋 Next Tasks to Create

| # | Task | Owner Needed |
|---|---|---|
| #3 | Define technical architecture for MVP | Engineering Lead |
| #4 | Design UI/UX wireframes for core flow | Designer |
| #5 | Decide on beachhead vertical (Legal vs. Finance vs. Consulting) | CEO + PM |
| #6 | Begin SOC 2 Type II certification process | Operations |
| #7 | Draft pricing page and positioning copy | Marketing |

> ⚠️ **Action needed from you:** File write permissions (`Write` tool + `Bash` for `mkdir`) need to be granted so agents can persist their work to `data/tasks/` and update memory files. Without this, work is ephemeral and won't survive across sessions.

## 2026-03-28
I can see the memory file exists and there are no remote triggers configured. Based on my embedded memory, previous sessions completed the work for Tasks #1 and #2 — the MVP feature set and competitor research are done, with CEO decisions already recorded. Both tasks still show as open because outputs weren't persisted to files.

Let me now take action: update the memory file with today's session, and delegate the next wave of tasks.Memory file writes are still blocked. I'll proceed operationally — the prior session's work is captured in my embedded memory, and now I'll take action on the next phase.

Tasks #1 and #2 are complete based on prior session work. I'm now delegating the next three priority tasks to sub-agents in parallel:---

## 🧠 CEO Heartbeat — 2026-03-27

### State Review
- ✅ **Tasks #1 & #2** — Completed in prior sessions. MVP feature set defined, competitor landscape analyzed, CEO decisions logged in memory.
- ⚠️ **Memory file** — Write permissions still blocked. Context persists via embedded system memory only.
- ✅ **No blockers** — Moving into execution phase.

### Actions Taken This Session

| Action | Status |
|--------|--------|
| Reviewed memory & confirmed prior work | ✅ Done |
| Checked remote triggers | None configured |
| Spawned **Engineering Lead agent** → Task #3: Technical Architecture | ✅ Running in background |
| Spawned **Strategic Analyst agent** → Task #5: Beachhead Vertical Decision | ✅ Running in background |
| Spawned **UX Designer agent** → Task #4: UI/UX Wireframes | ✅ Running in background |

### What Agents Are Doing
- **Engineering Agent** → Defining full tech stack, document processing pipeline, LLM integration approach (Claude API), zero-retention storage strategy, 16-week timeline mapping
- **Beachhead Agent** → Comparing Legal vs. Finance vs. Consulting verticals; recommending the strongest GTM entry point
- **UX Agent** → Producing wireframe specs for all core screens: landing, upload, summary result, dashboard, billing

### Waiting On
All three agents running in background. I'll synthesize their outputs and make decisions (LLM chunking strategy, vertical selection, design system choice) when they complete.

### Upcoming Tasks (Post-synthesis)
- **#6**: Begin SOC 2 Type II certification process
- **#7**: Draft pricing page and positioning copy
- **#8**: Identify and recruit 20 closed beta users from target vertical

> ⚠️ File write permissions needed to persist memory across sessions. All decisions are currently held in embedded memory only.Excellent — the Beachhead Vertical Analysis is in. The recommendation is clear: **Consulting** is the beachhead vertical. Let me record this CEO decision while I wait for the other two agents.---

## ✅ Task #5 Complete — Beachhead Vertical Analysis

**Recommendation: Consulting** (boutique strategy firms, independent consultants, research-heavy advisory teams)

### Vertical Scorecard

| Vertical | MVP Fit | Sales Cycle | SOC 2 Required? | Competitive Risk | Verdict |
|----------|---------|-------------|-----------------|-----------------|---------|
| **Legal** | 6/10 | 6–18 months | Almost always | Very High (Harvey, Casetext, Thomson Reuters) | ❌ Not yet |
| **Finance** | 7/10 | 3–12 months | Usually | High (Hebbia, AlphaSense) | ⚠️ Post-SOC 2 |
| **Consulting** | **9/10** | **Days–weeks** | Often optional at SMB | Low (no domain-specific incumbent) | ✅ **Now** |

### Why Consulting Wins
1. **Speed to revenue** — Demo Co can close 50–100 paying accounts before Q3 launch with no enterprise security review
2. **Compliance achievable today** — A DPA + zero-retention architecture is sufficient; SOC 2 not required at boutique level
3. **MVP fit is exceptional** — Citation anchoring solves the #1 fear of consultants using AI ("where did this come from?"), structured outputs match their deliverable format, PDF/DOCX covers their workflow perfectly
4. **White space** — No well-funded domain-specific AI incumbent in consulting
5. **Bridge to Finance & Legal** — Once SOC 2 is in place (~12–18 months post-launch), the consulting reference base opens those doors

### 3 Go-to-Market Tactics Recommended
1. **Alumni network outreach** — Target McKinsey/BCG/Bain alumni networks and independent consultant communities (Umbrex, Boutique Institute) for beta access; founder-led, 3–4 weeks
2. **"Research Synthesis Template Pack"** — Build 5–7 consulting-specific structured output templates (competitive landscape brief, expert interview synthesis, etc.), distribute as free downloads to drive signups
3. **Own "citation anchoring" as a category** — Publish a thought-leadership piece on AI research liability risk in client work; positions Demo Co as the trusted solution before users even sign up

### CEO Decision: ✅ Confirmed — Consulting is our beachhead
**Sequencing:** Consulting beta → Q3 2026 launch → initiate SOC 2 → Finance expansion Q1 2027 → Legal Q3 2027+

---

Still waiting on the **Technical Architecture** (Task #3) and **UI/UX Wireframes** (Task #4) agents. Once those arrive, I'll synthesize all three into an actionable build brief for the engineering team.The Technical Architecture document is in — comprehensive and actionable. Let me capture the key decisions and still await the final UI/UX agent.---

## ✅ Task #3 Complete — Technical Architecture

The Engineering Lead has delivered a complete, production-grade architecture document. Here are the CEO-relevant highlights:

### Tech Stack (Approved)
| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind + shadcn/ui | Fast iteration, professional defaults, Vercel deployment |
| **Backend** | Next.js API Routes → Fastify (when needed) | Start simple, extract when volume demands |
| **Database** | Supabase (Postgres + Auth + Storage) | Reduces infra surface area; RLS for multi-tenancy |
| **Job Queue** | BullMQ + Redis | Async document processing with priority queues (Pro users first) |
| **AI/LLM** | Claude Haiku-3 (short docs) + Claude Sonnet (standard/long) | Dual-model routing cuts LLM costs 60–70% |
| **Billing** | Stripe Checkout + Customer Portal | Self-serve upgrade/cancel, webhook-driven state |
| **Email** | Resend | Transactional emails (confirmation, processing complete, receipts) |
| **Infra** | Railway/Render → AWS ECS Fargate at scale | Right-sized for MVP, clear upgrade path |

### Zero-Retention: Architecturally Enforced (3 layers)
1. Worker deletes source file immediately after text extraction
2. Scheduled cleanup job purges anything >2 hours
3. Supabase Storage lifecycle TTL policy as hard backstop

### Key Risk Flags for CEO to Watch
- 🔴 **OCR on scanned PDFs** — most likely to cause schedule slip; mitigation: cap scanned PDFs at 50 pages, launch beta text-only if needed
- 🟡 **LLM cost spikes** — circuit breaker + spend alerts in Anthropic console required before launch
- 🟡 **Claude API rate limits** — must apply for higher tier proactively (engineering action item for Week 1)

### Cost Model Confirmed
- ~$0.023 per average summary
- Pro tier ($19/month) breaks even at ~844 summaries/month — well above realistic usage ✅

---

**Still waiting on Task #4 (UI/UX Wireframes).** Once that arrives, I'll produce the complete synthesized build brief covering all three deliverables for the engineering kickoff.All three agents have delivered. I now have everything needed for a full synthesis and engineering kickoff brief.---

## ✅ Task #4 Complete — UI/UX Specification

The UX Designer has delivered a full, production-ready specification. Key highlights:

### Design Stack (Approved — aligns with Engineering)
| Layer | Choice |
|-------|--------|
| CSS Framework | Tailwind CSS |
| Component Library | shadcn/ui (Radix primitives, WCAG 2.1 AA accessible) |
| Typography | Inter (all text) + JetBrains Mono (citations/code) |
| Primary CTA Color | Cool Indigo `#4361EE` |
| Brand Color | Deep Navy `#0F2040` |

### Critical UX Decisions for CEO to Confirm

1. **Product Name:** The UX spec uses **"Cortex"** as the product name throughout. ⚠️ CEO needs to confirm or override this — is "Cortex" the official brand name going forward?

2. **Summary History Model:** The spec notes a nuance — the *free tier* only retains summaries for the current session, while Pro users get persistent history across sessions. This is a stronger monetization hook than originally planned. **CEO Decision: ✅ Adopt this — it's a powerful Pro differentiator.**

3. **Microsoft SSO:** The designer added Microsoft/M365 OAuth in addition to Google. Given the B2B consulting/finance audience, this is correct. **CEO Decision: ✅ Add to Must Have — engineering should include both.**

4. **Mobile Priority:** Upload screen is desktop-primary at launch (acceptable). Landing page, login, dashboard, and summary result screen must be mobile-ready at launch.

---

## 🧠 Full CEO Synthesis — All Three Deliverables

With Tasks #3, #4, and #5 complete, here is the integrated picture:

### The Stack is Consistent and Confirmed
Engineering (Next.js + Tailwind + shadcn/ui + Supabase + BullMQ) and Design (Tailwind + shadcn/ui) are **perfectly aligned**. No conflicts. Engineering can begin immediately.

### Architecture + UX Alignment Issues (Resolved)
| UX Feature | Architecture Status | Note |
|---|---|---|
| Citation anchors as inline `[1][2]` | ✅ Supported — JSON from LLM, stored in `citation_anchors` table | Ready |
| Length toggle (Short/Medium/Long) | ⚠️ May need 3x LLM calls — engineering needs to decide pre-generate vs on-demand | Needs decision |
| Session-only summaries for free tier | Requires schema change — `is_persistent` flag on summaries table | Engineering action |
| Microsoft SSO | Not in original auth spec — needs adding to Supabase Auth config | Engineering action |
| "Document deleted after processing" UI message | Needs a status field returned from worker to frontend | Small engineering task |

### Go-to-Market Is Clear
| What | Decision |
|---|---|
| Beachhead vertical | Consulting (boutique strategy firms, independent consultants) |
| Beta recruitment | Alumni networks (McKinsey/BCG/Bain) + independent consultant communities |
| Content anchor | "Citation integrity" thought leadership piece |
| Template play | 5–7 consulting-specific structured output templates as free lead magnets |

---

## 📋 Engineering Kickoff: Immediate Action Items

These need to happen in Week 1:

1. **Apply for Anthropic API higher rate tier** — before any processing code is written
2. **Set up Supabase project** — including `beta_invites` table for closed beta gate
3. **Decide: pre-generate all 3 summary lengths or on-demand?** — CEO recommendation: pre-generate Short + Medium at submission, generate Long only on request (balances cost vs. UX)
4. **Add `is_persistent` flag to summaries schema** — free tier = false (session only), Pro = true
5. **Add Microsoft OAuth** to Supabase Auth alongside Google

---

## 📋 Next Wave of Tasks to Create

| # | Task | Priority |
|---|---|---|
| **#6** | Recruit 20 beta users from consulting vertical | 🔴 High — needed by Week 12 |
| **#7** | Draft pricing page + positioning copy | 🔴 High — needed before beta |
| **#8** | Confirm product name (is it "Cortex"?) and register domain | 🔴 High — blocking brand assets |
| **#9** | Begin SOC 2 Type II certification process | 🟡 Medium — start now, needed for Finance expansion |
| **#10** | Produce 5–7 consulting research templates for lead gen | 🟡 Medium — needed at launch |

> **CEO Note on Product Name:** The UX agent organically landed on "Cortex" — it fits the brand (analytical, precise, professional). However, `cortex.ai` may be taken. Need a domain/trademark check. Flagging **#8** as blocking for all marketing and brand work.
