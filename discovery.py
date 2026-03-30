import os
import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from database import Lead, LeadStatus, get_engine
import sys

# Load environment variables
load_dotenv()

CHROME_PATH = os.getenv("CHROME_PROFILE_PATH")
PROFILE_NAME = os.getenv("CHROME_PROFILE_NAME")
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./networking.db")

async def run_discovery():
    if not CHROME_PATH or not PROFILE_NAME:
        print("ERROR: CHROME_PROFILE_PATH and CHROME_PROFILE_NAME must be set in .env")
        return

    full_profile_path = os.path.join(CHROME_PATH, PROFILE_NAME)
    
    print(f"Using Chrome Profile: {full_profile_path}")
    print("!!! WARNING: PLEASE ENSURE CHROME IS CLOSED BEFORE PROCEEDING !!!")

    async with async_playwright() as p:
        # Launch browser with existing profile
        try:
            context = await p.chromium.launch_persistent_context(
                user_data_dir=full_profile_path,
                headless=False,
                args=["--disable-blink-features=AutomationControlled"]
            )
        except Exception as e:
            print(f"Error launching browser: {e}")
            print("Is Chrome still open? If so, please close it and try again.")
            return

        page = await context.new_page()
        await stealth_async(page)

        # 1. Navigate to LinkedIn Search for Corporate FP&A in San Diego
        search_url = "https://www.linkedin.com/search/results/people/?keywords=Corporate%20FP%26A&origin=FACETED_SEARCH&location=San%20Diego%2C%20California"
        print(f"Navigating to: {search_url}")
        await page.goto(search_url)

        # Wait for results to load
        try:
            await page.wait_for_selector(".reusable-search__result-container", timeout=10000)
        except Exception:
            print("No results found or timed out. Are you logged in?")
            await context.close()
            return

        # 2. Extract Leads
        results = await page.query_selector_all(".reusable-search__result-container")
        print(f"Found {len(results)} leads on the first page.")

        engine = get_engine(DB_URL)
        Session = sessionmaker(bind=engine)
        session = Session()

        new_leads_count = 0
        for res in results:
            try:
                # Extract Name and Profile URL
                name_elem = await res.query_selector(".entity-result__title-text a")
                name_text = (await name_elem.inner_text()).split("\n")[0].strip()
                profile_url = (await name_elem.get_attribute("href")).split("?")[0]
                
                # Extract Headline
                headline_elem = await res.query_selector(".entity-result__primary-subtitle")
                headline_text = await headline_elem.inner_text() if headline_elem else ""

                # Save to DB if not exists
                existing = session.query(Lead).filter(Lead.profile_url == profile_url).first()
                if not existing:
                    new_lead = Lead(
                        full_name=name_text,
                        profile_url=profile_url,
                        headline=headline_text.strip(),
                        status=LeadStatus.FOUND
                    )
                    session.add(new_lead)
                    new_leads_count += 1
                    print(f"Adding Lead: {name_text}")
            except Exception as e:
                print(f"Error parsing result: {e}")

        session.commit()
        session.close()
        print(f"Phase 2 Complete: {new_leads_count} new leads added to CRM.")
        
        await context.close()

if __name__ == "__main__":
    asyncio.run(run_discovery())
