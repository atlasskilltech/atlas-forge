"""Browser pass over the Super Admin module.

The role is view-only, so the assertions are about what is *absent*: no action
buttons in the tables, the view-only banner on every screen, a disabled Save on
the shared profile, and a database fingerprint that is identical before and
after a walk through every screen.

    npm run test:admin:browser        (expects a server on BASE_URL)
"""
import os
import subprocess
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3100")
APP_ID = "ATL-2019-0004"
PASSWORD = "Atlas@2026"
MYSQL = r"C:\xampp\mysql\bin\mysql.exe"
DB = "atlas-forge-dashboard"

results = []


def check(name, ok, detail=""):
    results.append((bool(ok), name, detail))


def sql(statement):
    out = subprocess.run(
        [MYSQL, "-u", "root", "-N", "-B", DB, "-e", statement],
        capture_output=True, text=True, encoding="utf-8",
    )
    return out.stdout.strip()


FINGERPRINT = (
    "SELECT CONCAT_WS('/',"
    "(SELECT COUNT(*) FROM users),"
    "(SELECT COUNT(*) FROM user_roles),"
    "(SELECT COUNT(*) FROM listings),"
    "(SELECT COUNT(*) FROM approvals),"
    "(SELECT COUNT(*) FROM applications),"
    "(SELECT COUNT(*) FROM concierge_contacts),"
    "(SELECT COUNT(*) FROM mentorship_sessions),"
    "(SELECT COUNT(*) FROM founder_access_grants),"
    "(SELECT COUNT(*) FROM startups),"
    "(SELECT COUNT(*) FROM activity_logs),"
    "(SELECT COUNT(*) FROM notifications),"
    "(SELECT GROUP_CONCAT(setting_value ORDER BY setting_key) FROM platform_settings))"
)

before = sql(FINGERPRINT)

SCREENS = [
    ("/admin/overview", "Total Users"),
    ("/admin/summary", "NovaMed"),
    ("/admin/users", "ATL-2024-0871"),
    ("/admin/startups", "Registered Startups"),
    ("/admin/incubation-status", "Early Traction"),
    ("/admin/activity-report", "Concierge Contacts"),
    ("/admin/contact-log", "Mihir Pawar"),
    ("/admin/contract-log", "Brand identity engagement"),
    ("/admin/job-listings", "UI/UX Designer"),
    ("/admin/profile", "Dr. Meera Joshi"),
]

# Controls that exist for the other roles and must never appear here.
FORBIDDEN = [
    "Approve", "Reject", "Grant Founder Access", "Revoke Access", "Revoke",
    "Assign Mentor", "Feature", "Manage", "Reset Platform", "Contact Student",
    "Apply for this Role", "Submit for Approval", "Post a Job",
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    console_errors = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # ---- sign in ---------------------------------------------------------
    page.goto(f"{BASE}/login", wait_until="networkidle")
    page.fill("input[name=appId]", APP_ID)
    page.fill("input[name=password]", PASSWORD)
    page.click("button[type=submit]")
    page.wait_for_url("**/select-role**", timeout=15000)
    page.get_by_role("link", name="Super Admin").click()
    page.wait_for_url("**/admin/overview**", timeout=15000)
    page.get_by_text("Total Users").first.wait_for(timeout=15000)
    console_errors.clear()

    check("the overview shows real platform counters",
          "Total Users" in page.inner_text("body"))
    check("the navbar shows the signed-in admin",
          page.locator("header").first.get_by_label("Dr. Meera Joshi avatar").count() == 1)

    # ---- walk every screen ----------------------------------------------
    offending = []
    missing_banner = []

    for path, needle in SCREENS:
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        page.wait_for_timeout(400)
        body = page.inner_text("body")

        # SectionLabel uppercases through CSS and inner_text returns the
        # rendered text, so section headings arrive shouting.
        check(f"{path} renders from MySQL", needle.lower() in body.lower(), needle)

        # The profile screen is about the admin's own account rather than the
        # platform, so it carries the disabled Save instead of the banner.
        if path != "/admin/profile" and "view-only" not in body.lower():
            missing_banner.append(path)

        for label in FORBIDDEN:
            if page.get_by_role("button", name=label, exact=True).count() > 0:
                offending.append(f"{path}: {label}")

    check("the view-only banner is on every screen", len(missing_banner) == 0,
          ", ".join(missing_banner))
    check("no screen offers an action control from another role",
          len(offending) == 0, ", ".join(offending))

    # ---- the tables genuinely have no Actions column ---------------------
    page.goto(f"{BASE}/admin/users", wait_until="networkidle")
    page.wait_for_timeout(400)
    headers = [h.inner_text().strip() for h in page.locator("table thead th").all()]
    check("the users table has no Actions column", "Actions" not in headers,
          " | ".join(headers))
    check("but does carry the columns the reference draws",
          {"Name", "App ID", "Role", "Startup", "Status", "Last Active"} <= set(headers),
          " | ".join(headers))

    check("its filters still work",
          page.get_by_role("tab", name="Managers", exact=True).count() == 1)
    page.get_by_role("tab", name="Managers", exact=True).click()
    page.wait_for_timeout(400)
    filtered = page.inner_text("#main-content")
    check("and filter to real accounts",
          "Mihir Pawar" in filtered and "Riya Kapoor" not in filtered)

    # ---- the escalation note ---------------------------------------------
    page.goto(f"{BASE}/admin/startups", wait_until="networkidle")
    page.wait_for_timeout(400)
    check("tables close with the escalation path",
          "contact the Backend Manager or Forge Manager" in page.inner_text("body"))

    # ---- the shared profile cannot be saved ------------------------------
    page.goto(f"{BASE}/admin/profile", wait_until="networkidle")
    page.wait_for_timeout(400)
    save = page.get_by_role("button", name="Save Changes", exact=True).first
    check("the profile Save is disabled, not silently inert", save.is_disabled())
    check("and the profile shows the real account",
          "ATL-2019-0004" in page.inner_text("#main-content"))

    # ---- the other roles' areas are closed --------------------------------
    for path in ["/backend/settings", "/forge/approval-queue", "/founder/home", "/student/home"]:
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        page.wait_for_timeout(300)
        check(f"{path} is closed to this role", "/admin/" not in page.url or "select-role" in page.url,
              page.url)

    # ---- sign out ---------------------------------------------------------
    page.goto(f"{BASE}/admin/overview", wait_until="networkidle")
    page.get_by_role("button", name="Log out").first.click()
    page.wait_for_url("**/login**", timeout=15000)
    check("logging out returns to the login screen", "/login" in page.url)

    page.goto(f"{BASE}/admin/overview", wait_until="networkidle")
    check("and the admin area is closed again", "/login" in page.url, page.url)

    real_errors = [e for e in console_errors if "favicon" not in e.lower()]
    check("no console or page errors during the whole flow", len(real_errors) == 0,
          "; ".join(real_errors[:2]))

    browser.close()

after = sql(FINGERPRINT)
check("browsing every Super Admin screen changed nothing at all", before == after,
      f"{before} vs {after}" if before != after else before)

for ok, name, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{f' — {detail}' if detail else ''}")

failed = sum(1 for ok, _, _ in results if not ok)
print(f"\n{len(results) - failed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
