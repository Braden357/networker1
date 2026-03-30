# Product Requirements Document (PRD) - LinkedIn Networking Tool

## Project Goal
To build a software tool that automates and streamlines the process of networking with finance and business analytics professionals in San Diego via LinkedIn, culminating in coffee chats for career learning.

## Target Audience & Niche
- **Location**: San Diego, CA
- **Specialization**: Corporate FP&A (Financial Planning & Analysis)
- **Strategy**: Connection (no note) -> Acceptance Detection -> Personalized Outreach Message.

## Functional Requirements
1.  **Lead Discovery (Search)**:
    - Search specifically for "Corporate FP&A" titles in San Diego.
    - Chrome **must be closed** during the 60-second discovery run for safety.
2.  **Connection Automation**:
    - Send connection requests **without** a note to bypass LinkedIn's monthly personalization limits.
3.  **Acceptance Monitoring**:
    - Automatically check for accepted invitations daily.
4.  **AI Outreach Crafting**:
    - Once connected, use Gemini to draft a professional but authentic message.
    - Tone: "Eager learner" / "Professional peer."
5.  **Human-in-the-Loop (HITL) Send**:
    - Review drafts in a Streamlit dashboard.
    - Click "Prepare" to open the profile and paste the message into the active chat.
4.  **Tracking & CRM**:
    - Log every person contacted.
    - Limit to **15 requests per day** for safety.
5.  **Scheduling Integration**:
    - Include a Calendly link in the crafted messages.

## Technical Considerations (Refined)
1.  **Account Safety**: Zero-risk approach by keeping the final "Send" button manual.
2.  **Chrome Profile**: Uses Playwright to connect to your existing `--user-data-dir` so you stay logged in.
3.  **Persistence**: SQLite database (`networking.db`) to store leads and message history.

## Questions for the User
1.  **Scope**: How many connections are you looking to make per week? (Start small to avoid flags).
2.  **Personalization**: Do you want the messages to be generic or AI-generated based on their specific profile bio/experience?
3.  **Interface**: Would you prefer a command-line tool (CLI) or a simple web dashboard to see your networking progress?
4.  **Budget**: Are you open to using paid APIs (like for proxies or LLMs) to make the tool more robust?
5.  **Tracking**: Do you already use any tool (like an Excel sheet) that we should integrate with?
