import os
import asyncio
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

CHROME_PATH = os.getenv("CHROME_PROFILE_PATH")
PROFILE_NAME = os.getenv("CHROME_PROFILE_NAME")

async def check_auth():
    if not CHROME_PATH or not PROFILE_NAME:
        print("ERROR: CHROME_PROFILE_PATH and CHROME_PROFILE_NAME must be set in .env")
        return

    full_profile_path = os.path.join(CHROME_PATH, PROFILE_NAME)
    print(f"Checking Chrome Profile: {full_profile_path}")
    print("!!! WARNING: PLEASE ENSURE CHROME IS CLOSED BEFORE PROCEEDING !!!")

    async with async_playwright() as p:
        try:
            context = await p.chromium.launch_persistent_context(
                user_data_dir=full_profile_path,
                headless=False,
            )
            page = await context.new_page()
            await page.goto("https://www.linkedin.com/feed/")
            
            # Simple check if "Sign in" button exists
            is_logged_in = True
            try:
                await page.wait_for_selector(".feed-identity-module", timeout=5000)
                print("SUCCESS: You are logged into LinkedIn!")
            except:
                print("FAILURE: Could not detect LinkedIn feed. You may need to log in manually in the browser window that just opened.")
                is_logged_in = False

            input("Press Enter to close the browser...")
            await context.close()
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_auth())
