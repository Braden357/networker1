# Project Gemini - LinkedIn Networking Manifest

## Technical Vision
To create a "human-in-the-loop" automation tool that leverages AI to build meaningful professional connections in the finance sector of San Diego.

## Core Tech Stack (Proposed)
1. **Language**: Python (high ecosystem support for automation).
2. **Scraping/Automation**: Playwright (more stealthy than Selenium) + `stealth` plugins.
3. **AI Integration**: Google Gemini API (for personalizing connection notes and follow-up messages).
4. **Data Management**: SQLite (local, lightweight, easy for the user to manage).
5. **Dashboard**: Streamlit (fast to build, visually premium for a local tool).

## Project Constitution
- **Ethical Automation**: No mass-spamming. The goal is *quality* over *quantity*.
- **Account First**: Safety is the top priority. If a task risks an account ban, it must be throttled or done manually.
- **Privacy**: No external sharing of scraped LinkedIn data. Everything stays local.
- **Analytical Rigor (The "Disagreeable" Agent)**: 
    - The AI partner (Antigravity/Gemini) is explicitly instructed to be analytical and skeptical. 
    - If a request is technically unfeasible, risky, or poorly defined, the agent **must** push back and say "this won't work" or "this is a bad idea."
    - No blind agreement. Every feature must be justified against the "Account First" principle.

## The Master Plan
### Phase 1: Lead Discovery (Scouting)
- Input keywords: "Corporate FP&A".
- Scope: San Diego area.
- User **must close Chrome** for 60s during this phase.
- Output: List of potential leads in a local SQLite DB (via SQLAlchemy).

### Phase 2: Connection & Acceptance
- Send connection requests (no note) to save personalization quotas.
- Verify acceptance daily.

### Phase 3: AI Message Crafting
- Use Gemini to analyze the "About" section of *connected* leads.
- Generate a professional but authentic outreach message.

### Phase 3: Automated Prep & Review
- Populate a local **Streamlit Dashboard** with leads and their AI-crafted messages.
- User reviews, edits, and "approves" the outreach.

### Phase 4: Sem-Manual Connection
- For approved leads, Playwright opens a browser window using your **existing Chrome profile**.
- It navigates to the lead's profile and opens the "Connect" dialog.
- It pastes the personalized message.
- **You (the human)** perform the final "Send" click for maximum safety.
- Limit to **15 requests per day**.

### Phase 5: Dashboard Analytics & SQLite
- Track responses and coffee chat conversions in a local SQLite database.
