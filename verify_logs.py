import sys
from playwright.sync_api import sync_playwright

def verify_console_logs():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        logs = []
        page.on("console", lambda msg: logs.append((msg.type, msg.text)))

        # Navigate to the main page
        page.goto("http://localhost:8000/")

        # Wait for potential initial logs
        page.wait_for_timeout(2000)

        # Click a work card to trigger the work.js logic
        work_buttons = page.locator(".nl-case-overlay-btn, .nl-mobile-case-btn")
        if work_buttons.count() > 0:
            work_buttons.first.click()
            page.wait_for_timeout(1000)

        browser.close()

        # Filter for unexpected console.logs
        # (Clarity might log some things, so we check for our removed specific logs)
        unexpected_logs = [log[1] for log in logs if log[0] == "log" and (
            "New Leaf digital experience initialized" in log[1] or
            "Theme links component initialized" in log[1] or
            "Work interactions initializing" in log[1] or
            "Case Study Triggered" in log[1] or
            "Project:" in log[1]
        )]

        if unexpected_logs:
            print(f"FAILED: Found unexpected logs: {unexpected_logs}")
            sys.exit(1)

        print("SUCCESS: No unexpected console.logs found.")

if __name__ == "__main__":
    verify_console_logs()
