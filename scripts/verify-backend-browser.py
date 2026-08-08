"""Browser pass over the Backend Manager module.

The two powers unique to this role — overriding a Forge Manager decision and
moving Founder access directly — are checked all the way to MySQL. The Danger
Zone is exercised only as far as its confirmation dialog: the reset itself is
verified in the module test against a transaction that is rolled back, so the
demo data is never cleared here.

    npm run test:backend:browser        (expects a server on BASE_URL)
"""
import os
import subprocess
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3100")
APP_ID = "ATL-2022-0012"
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


hw_approval = sql("SELECT COALESCE(MAX(id), 0) FROM approvals")
hw_grant = sql("SELECT COALESCE(MAX(id), 0) FROM founder_access_grants")
hw_activity = sql("SELECT COALESCE(MAX(id), 0) FROM activity_logs")
hw_notification = sql("SELECT COALESCE(MAX(id), 0) FROM notifications")

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
    page.get_by_role("link", name="Backend Manager").click()
    page.wait_for_url("**/backend/dashboard**", timeout=15000)
    page.get_by_text("Total Users").first.wait_for(timeout=15000)
    console_errors.clear()

    body = page.inner_text("body")
    check("the dashboard shows real platform counters", "Total Users" in body)
    check("recent activity is rendered from the audit log",
          "Granted Founder access" in body or "Contacted" in body)
    check("the navbar shows the signed-in manager",
          page.locator("header").first.get_by_label("Shantanu Ghuriani avatar").count() == 1)

    # ---- overriding a Forge Manager decision -----------------------------
    approvals_before = sql("SELECT COUNT(*) FROM approvals")
    page.goto(f"{BASE}/backend/job-queue", wait_until="networkidle")
    page.wait_for_timeout(600)

    table = page.inner_text("#main-content")
    check("the queue shows the FM Decision column", "FM Decision" in table)
    check("including a listing the Forge Manager already rejected", "Rejected" in table)

    # The rejected row still offers Approve — that is the override.
    rejected_row = page.locator("table tbody tr").filter(has_text="Rejected").first
    listing_title = rejected_row.locator("td").nth(1).inner_text().strip()
    rejected_row.get_by_role("button", name="Approve", exact=True).click()
    page.wait_for_timeout(400)

    dialog = page.inner_text("body")
    check("the confirmation says it overrides the Forge Manager",
          "overrides the Forge Manager" in dialog)

    page.get_by_role("button", name="Yes, Approve", exact=True).click()
    page.wait_for_timeout(2500)

    approvals_after = sql("SELECT COUNT(*) FROM approvals")
    check("the override reached MySQL", int(approvals_after) == int(approvals_before) + 1,
          f"{approvals_before} -> {approvals_after}")

    both = sql(
        "SELECT GROUP_CONCAT(CONCAT(r.slug, '=', a.decision) ORDER BY r.slug) "
        "FROM approvals a JOIN roles r ON r.id = a.decided_as_role_id "
        "JOIN listings l ON l.id = a.listing_id "
        f"WHERE l.title = '{listing_title}'"
    )
    check("both decisions survive on the same listing",
          both == "backend-manager=approved,forge-manager=rejected", both)

    flagged = sql(
        "SELECT a.is_override FROM approvals a JOIN roles r ON r.id = a.decided_as_role_id "
        "JOIN listings l ON l.id = a.listing_id "
        f"WHERE l.title = '{listing_title}' AND r.slug = 'backend-manager'"
    )
    check("and the later one is flagged as an override", flagged == "1", flagged)

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(600)
    after = page.inner_text("#main-content")
    check("the FM Decision column still shows the original verdict", "Rejected" in after)

    # ---- granting and revoking access ------------------------------------
    grants_before = sql("SELECT COUNT(*) FROM founder_access_grants WHERE revoked_at IS NULL")
    page.goto(f"{BASE}/backend/role-assignments", wait_until="networkidle")
    page.wait_for_timeout(600)

    # SectionLabel uppercases through CSS and inner_text returns the rendered
    # text, so section headings arrive shouting.
    check("the current founders are listed",
          "current founders with access" in page.inner_text("#main-content").lower())

    page.fill("#role-search", "ATL-2024-0871")
    page.get_by_role("button", name="Search", exact=True).click()
    page.wait_for_timeout(1800)

    matched = page.inner_text("#main-content")
    check("searching finds the account", "Riya Kapoor" in matched)
    check("and states their current role", "Current role: Standard Student" in matched)

    page.get_by_role("button", name="Grant Founder Access", exact=True).click()
    page.wait_for_timeout(400)
    check("granting opens the reference confirmation",
          "Grant Founder Access?" in page.inner_text("body"))
    page.get_by_role("button", name="Yes, Grant Access", exact=True).click()
    page.wait_for_timeout(2500)

    check("granting confirms", "Founder Access Granted" in page.inner_text("body"))
    grants_after = sql("SELECT COUNT(*) FROM founder_access_grants WHERE revoked_at IS NULL")
    check("the grant reached MySQL", int(grants_after) == int(grants_before) + 1,
          f"{grants_before} -> {grants_after}")

    role_added = sql(
        "SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
        "JOIN users u ON u.id = ur.user_id "
        "WHERE u.app_id = 'ATL-2024-0871' AND r.slug = 'founder' AND ur.revoked_at IS NULL"
    )
    check("and the founder role was added", role_added == "1", role_added)

    # Revoke it again from the same screen.
    page.goto(f"{BASE}/backend/role-assignments?q=ATL-2024-0871", wait_until="networkidle")
    page.wait_for_timeout(800)
    check("the search result now reads as having access",
          "Access Granted" in page.inner_text("#main-content"))

    page.get_by_role("button", name="Revoke Access", exact=True).click()
    page.wait_for_timeout(400)
    check("revoking opens its own confirmation",
          "Revoke Founder Access?" in page.inner_text("body"))
    page.get_by_role("button", name="Yes, Revoke Access", exact=True).click()
    page.wait_for_timeout(2500)

    check("revoking confirms", "Founder Access Revoked" in page.inner_text("body"))
    role_gone = sql(
        "SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
        "JOIN users u ON u.id = ur.user_id "
        "WHERE u.app_id = 'ATL-2024-0871' AND r.slug = 'founder' AND ur.revoked_at IS NULL"
    )
    check("and the role was removed", role_gone == "0", role_gone)
    check("while the grant record is closed rather than deleted",
          sql("SELECT COUNT(*) FROM founder_access_grants WHERE revoked_at IS NOT NULL") == "1")

    # ---- platform settings ------------------------------------------------
    page.goto(f"{BASE}/backend/settings", wait_until="networkidle")
    page.wait_for_timeout(600)

    settings_text = page.inner_text("#main-content")
    grouped = settings_text.lower()
    check("settings are grouped as the reference draws them",
          "general" in grouped and "access & roles" in grouped
          and "content moderation" in grouped)
    check("the platform name comes from the database", "ATLAS Forge" in settings_text)

    before_toggle = sql(
        "SELECT setting_value FROM platform_settings WHERE setting_key = 'external_access_v2'"
    )
    external = page.locator("#main-content li").filter(has_text="External Access (V2)").first
    external.get_by_role("switch").click()
    page.wait_for_timeout(2000)
    after_toggle = sql(
        "SELECT setting_value FROM platform_settings WHERE setting_key = 'external_access_v2'"
    )
    check("a switch writes straight to MySQL", before_toggle != after_toggle,
          f"{before_toggle} -> {after_toggle}")

    external.get_by_role("switch").click()
    page.wait_for_timeout(2000)
    check("and toggling back restores it",
          sql("SELECT setting_value FROM platform_settings WHERE setting_key = 'external_access_v2'")
          == before_toggle)

    # Edit the platform name through its overlay.
    page.get_by_role("button", name="Edit", exact=True).first.click()
    page.wait_for_timeout(400)
    check("the platform name overlay opens", "Edit Platform Name" in page.inner_text("body"))
    page.fill("input[name=platformName]", "ATLAS Forge (verified)")
    page.get_by_role("button", name="Save", exact=True).click()
    page.wait_for_timeout(2000)
    check("the new name reached MySQL",
          sql("SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_name'")
          == "ATLAS Forge (verified)")

    page.get_by_role("button", name="Edit", exact=True).first.click()
    page.wait_for_timeout(400)
    page.fill("input[name=platformName]", "ATLAS Forge")
    page.get_by_role("button", name="Save", exact=True).click()
    page.wait_for_timeout(2000)
    check("and can be set back",
          sql("SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_name'")
          == "ATLAS Forge")

    # ---- the Danger Zone opens, and Cancel changes nothing ----------------
    listings_before = sql("SELECT COUNT(*) FROM listings")
    page.get_by_role("button", name="Reset Platform", exact=True).click()
    page.wait_for_timeout(400)
    check("the Danger Zone confirmation states what it clears",
          "User accounts and roles are not affected" in page.inner_text("body"))
    page.get_by_role("button", name="Cancel", exact=True).click()
    page.wait_for_timeout(1500)
    check("cancelling the reset clears nothing",
          sql("SELECT COUNT(*) FROM listings") == listings_before, listings_before)

    # ---- the directory is real -------------------------------------------
    page.goto(f"{BASE}/backend/users", wait_until="networkidle")
    page.wait_for_timeout(600)
    directory = page.inner_text("#main-content")
    check("the directory lists real accounts", "ATL-2024-0871" in directory)
    check("and shows a founder's startup", "NovaMed" in directory)
    check("and the account counts", "Students" in directory and "Managers" in directory)

    page.fill("#bm-user-search", "Kavya")
    page.wait_for_timeout(500)
    filtered = page.inner_text("#main-content")
    check("search filters the directory",
          "Kavya Reddy" in filtered and "Riya Kapoor" not in filtered)

    # Manage opens Role Management already looking at that account.
    # Scoped to the table — the navbar carries a "Manage" link of its own.
    page.locator("table").get_by_role("link", name="Manage", exact=True).first.click()
    page.wait_for_url("**/backend/role-assignments**", timeout=15000)
    page.wait_for_timeout(800)
    check("Manage opens Role Management for that account",
          "q=ATL-2023-0541" in page.url, page.url)
    check("and the account is already matched",
          "Kavya Reddy" in page.inner_text("#main-content"))

    # ---- sign out ---------------------------------------------------------
    page.goto(f"{BASE}/backend/dashboard", wait_until="networkidle")
    page.get_by_role("button", name="Log out").first.click()
    page.wait_for_url("**/login**", timeout=15000)
    check("logging out returns to the login screen", "/login" in page.url)

    page.goto(f"{BASE}/backend/dashboard", wait_until="networkidle")
    check("and the backend area is closed again", "/login" in page.url, page.url)

    real_errors = [e for e in console_errors if "favicon" not in e.lower()]
    check("no console or page errors during the whole flow", len(real_errors) == 0,
          "; ".join(real_errors[:2]))

    browser.close()

# ---- restore the seeded demo data ---------------------------------------
sql(f"DELETE FROM approvals WHERE id > {hw_approval}")
sql("UPDATE listings SET status = 'rejected' WHERE title = 'Backend Developer'")
sql("DELETE ur FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
    "JOIN users u ON u.id = ur.user_id "
    "WHERE u.app_id = 'ATL-2024-0871' AND r.slug = 'founder'")
sql(f"DELETE FROM founder_access_grants WHERE id > {hw_grant}")
sql(f"DELETE FROM activity_logs WHERE id > {hw_activity}")
sql(f"DELETE FROM notifications WHERE id > {hw_notification}")
sql("UPDATE platform_settings SET setting_value = 'ATLAS Forge' WHERE setting_key = 'platform_name'")
sql("UPDATE platform_settings SET setting_value = 'false' WHERE setting_key = 'external_access_v2'")

restored = sql(
    "SELECT CONCAT("
    "(SELECT COUNT(*) FROM listings), '/',"
    "(SELECT COUNT(*) FROM approvals), '/',"
    "(SELECT COUNT(*) FROM founder_access_grants), '/',"
    "(SELECT COUNT(*) FROM activity_logs), '/',"
    "(SELECT COUNT(*) FROM users))"
)
check("teardown — seeded data restored", restored == "7/4/2/10/15", restored)

for ok, name, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{f' — {detail}' if detail else ''}")

failed = sum(1 for ok, _, _ in results if not ok)
print(f"\n{len(results) - failed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
