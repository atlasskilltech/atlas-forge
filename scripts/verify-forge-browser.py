"""Browser pass over the Forge Manager module.

This is the module whose decisions other roles depend on, so each flow is
checked all the way to MySQL rather than at the confirmation dialog.

    npm run test:forge:browser        (expects a server on BASE_URL)
"""
import os
import subprocess
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3100")
APP_ID = "ATL-2020-0001"
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
hw_session = sql("SELECT COALESCE(MAX(id), 0) FROM mentorship_sessions")
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
    page.get_by_role("link", name="Forge Manager").click()
    page.wait_for_url("**/forge/dashboard**", timeout=15000)
    page.get_by_text("Total Students").first.wait_for(timeout=15000)
    console_errors.clear()

    body = page.inner_text("body")
    check("the dashboard shows real platform counters", "Total Students" in body)
    check("the approval preview lists real work",
          "Job Listing" in body or "Mentorship" in body)
    check("the navbar shows the signed-in manager",
          page.locator("header").first.get_by_label("Mihir Pawar avatar").count() == 1)

    # ---- approving a listing ---------------------------------------------
    approvals_before = sql("SELECT COUNT(*) FROM approvals")
    page.goto(f"{BASE}/forge/approval-queue", wait_until="networkidle")
    page.wait_for_timeout(600)

    first_tab = page.get_by_role("tab").first.inner_text().strip()
    check("the queue tab carries a live count", "(" in first_tab, first_tab)

    target = page.locator("#main-content ul li").filter(
        has=page.get_by_role("button", name="Approve", exact=True)
    ).first
    title = target.locator("p").first.inner_text().strip()

    target.get_by_role("button", name="Approve", exact=True).click()
    page.wait_for_timeout(400)
    check("approving opens the reference confirmation",
          "Approve This Listing?" in page.inner_text("body"))

    page.get_by_role("button", name="Yes, Approve", exact=True).click()
    page.wait_for_timeout(2500)

    approvals_after = sql("SELECT COUNT(*) FROM approvals")
    check("the decision reached MySQL", int(approvals_after) == int(approvals_before) + 1,
          f"{approvals_before} -> {approvals_after}")

    recorded = sql(
        "SELECT CONCAT(a.decision, '|', r.slug, '|', l.status) FROM approvals a "
        "JOIN roles r ON r.id = a.decided_as_role_id JOIN listings l ON l.id = a.listing_id "
        "ORDER BY a.id DESC LIMIT 1"
    )
    check("recorded as the Forge Manager, and the listing is live",
          recorded == "approved|forge-manager|live", recorded)

    notified = sql(
        "SELECT COUNT(*) FROM notifications WHERE entity_type = 'listing' "
        f"AND id > {hw_notification}"
    )
    check("the founder is notified", int(notified) >= 1)

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(600)
    new_tab = page.get_by_role("tab").first.inner_text().strip()
    check("the queue count drops after the decision", new_tab != first_tab,
          f"{first_tab} -> {new_tab}")

    # ---- cancelling a decision must change nothing ------------------------
    before_cancel = sql("SELECT COUNT(*) FROM approvals")
    reject_target = page.locator("#main-content ul li").filter(
        has=page.get_by_role("button", name="Reject", exact=True)
    ).first
    reject_target.get_by_role("button", name="Reject", exact=True).click()
    page.wait_for_timeout(400)
    check("rejecting opens its own confirmation",
          "Reject This Listing?" in page.inner_text("body"))
    page.get_by_role("button", name="Cancel", exact=True).click()
    page.wait_for_timeout(1200)
    check("cancelling writes nothing",
          sql("SELECT COUNT(*) FROM approvals") == before_cancel, before_cancel)

    # ---- assigning a mentor ----------------------------------------------
    sessions_before = sql("SELECT COUNT(*) FROM mentorship_sessions")
    page.goto(f"{BASE}/forge/assign-mentors", wait_until="networkidle")
    page.wait_for_timeout(600)

    check("pending requests are listed with a live count",
          "PENDING REQUESTS (" in page.inner_text("#main-content").upper())

    page.get_by_role("button", name="Assign Mentor", exact=True).first.click()
    page.wait_for_timeout(500)
    check("the mentor picker opens", "Select a Mentor" in page.inner_text("body"))

    mentor_button = page.get_by_role("button", name="Select ", exact=False).first
    mentor_label = mentor_button.inner_text().strip()
    mentor_button.click()
    page.wait_for_timeout(2500)

    check("assigning confirms", "Mentor Assigned!" in page.inner_text("body"))
    sessions_after = sql("SELECT COUNT(*) FROM mentorship_sessions")
    check("the session reached MySQL", int(sessions_after) == int(sessions_before) + 1,
          f"{sessions_before} -> {sessions_after} via {mentor_label}")
    check("the request is closed",
          sql("SELECT COUNT(*) FROM mentorship_requests WHERE status = 'assigned'") == "2")

    # ---- granting founder access -----------------------------------------
    grants_before = sql("SELECT COUNT(*) FROM founder_access_grants")
    page.goto(f"{BASE}/forge/applications", wait_until="networkidle")
    page.wait_for_timeout(600)

    grant_button = page.get_by_role("button", name="Grant Founder Access", exact=True).first
    grant_card = page.locator("#main-content div").filter(has=grant_button).last
    applicant = grant_card.inner_text()

    grant_button.click()
    page.wait_for_timeout(400)
    check("granting opens the reference confirmation",
          "Grant Founder Access?" in page.inner_text("body"))
    page.get_by_role("button", name="Yes, Grant Access", exact=True).click()
    page.wait_for_timeout(2500)

    check("granting confirms", "Founder Access Granted" in page.inner_text("body"))
    grants_after = sql("SELECT COUNT(*) FROM founder_access_grants")
    check("the grant reached MySQL", int(grants_after) == int(grants_before) + 1,
          f"{grants_before} -> {grants_after}")

    roles_added = sql(
        "SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
        "WHERE r.slug = 'founder' AND ur.revoked_at IS NULL"
    )
    check("and the founder role was added", int(roles_added) == 3, roles_added)

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(600)
    check("the card now reads as granted",
          "Access Granted" in page.inner_text("#main-content"))

    # ---- the student pool offers no outreach this role may perform -------
    contacts_before = sql("SELECT COUNT(*) FROM concierge_contacts")
    page.goto(f"{BASE}/forge/student-pool", wait_until="networkidle")
    page.wait_for_timeout(600)
    contact_button = page.get_by_role("button", name="Contact Student", exact=True).first
    check("Contact Student is disabled for this role", contact_button.is_disabled())
    check("and no outreach was recorded",
          sql("SELECT COUNT(*) FROM concierge_contacts") == contacts_before, contacts_before)

    # ---- featuring a startup ---------------------------------------------
    featured_before = sql("SELECT COUNT(*) FROM startups WHERE is_featured = 1")
    page.goto(f"{BASE}/forge/projects", wait_until="networkidle")
    page.wait_for_timeout(600)
    page.get_by_role("button", name="Feature", exact=True).first.click()
    page.wait_for_timeout(2500)
    featured_after = sql("SELECT COUNT(*) FROM startups WHERE is_featured = 1")
    check("featuring reached MySQL", int(featured_after) == int(featured_before) + 1,
          f"{featured_before} -> {featured_after}")

    # ---- the tables are real ----------------------------------------------
    page.goto(f"{BASE}/forge/user-accounts", wait_until="networkidle")
    page.wait_for_timeout(600)
    directory = page.inner_text("#main-content")
    check("the directory lists real accounts", "ATL-2024-0871" in directory)
    check("and marks founders as unlocked", "Founder Unlocked" in directory)

    page.fill("#user-search", "Kavya")
    page.wait_for_timeout(500)
    filtered = page.inner_text("#main-content")
    check("search filters the directory",
          "Kavya Reddy" in filtered and "Riya Kapoor" not in filtered)

    # ---- sign out ---------------------------------------------------------
    page.goto(f"{BASE}/forge/dashboard", wait_until="networkidle")
    page.get_by_role("button", name="Log out").first.click()
    page.wait_for_url("**/login**", timeout=15000)
    check("logging out returns to the login screen", "/login" in page.url)

    page.goto(f"{BASE}/forge/dashboard", wait_until="networkidle")
    check("and the forge area is closed again", "/login" in page.url, page.url)

    real_errors = [e for e in console_errors if "favicon" not in e.lower()]
    check("no console or page errors during the whole flow", len(real_errors) == 0,
          "; ".join(real_errors[:2]))

    browser.close()

# ---- restore the seeded demo data ---------------------------------------
sql(f"DELETE FROM approvals WHERE id > {hw_approval}")
sql("UPDATE listings SET status = 'pending' WHERE id IN "
    "(SELECT * FROM (SELECT l.id FROM listings l LEFT JOIN approvals a ON a.listing_id = l.id "
    " WHERE a.id IS NULL AND l.status = 'live' AND l.title IN "
    " ('Frontend Developer','Data Analyst','Looking for a UI Designer for my food-tech app')) t)")
sql(f"DELETE FROM mentorship_sessions WHERE id > {hw_session}")
sql("UPDATE mentorship_requests SET status = 'requested' WHERE id IN "
    "(SELECT * FROM (SELECT mr.id FROM mentorship_requests mr LEFT JOIN mentorship_sessions ms "
    " ON ms.request_id = mr.id AND ms.mentor_id IS NOT NULL "
    " WHERE ms.id IS NULL AND mr.status = 'assigned') t)")
sql(f"DELETE ur FROM user_roles ur JOIN founder_access_grants g ON g.user_id = ur.user_id "
    f"JOIN roles r ON r.id = ur.role_id WHERE g.id > {hw_grant} AND r.slug = 'founder'")
sql("UPDATE incubation_applications SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL "
    f"WHERE id IN (SELECT * FROM (SELECT incubation_application_id FROM founder_access_grants "
    f"WHERE id > {hw_grant}) t)")
sql(f"DELETE FROM founder_access_grants WHERE id > {hw_grant}")
sql("UPDATE startups SET is_featured = 0 WHERE slug <> 'novamed'")
sql(f"DELETE FROM activity_logs WHERE id > {hw_activity}")
sql(f"DELETE FROM notifications WHERE id > {hw_notification}")

restored = sql(
    "SELECT CONCAT("
    "(SELECT COUNT(*) FROM listings WHERE status = 'pending'), '/',"
    "(SELECT COUNT(*) FROM mentorship_sessions), '/',"
    "(SELECT COUNT(*) FROM founder_access_grants), '/',"
    "(SELECT COUNT(*) FROM activity_logs), '/',"
    "(SELECT COUNT(*) FROM startups WHERE is_featured = 1))"
)
check("teardown — seeded data restored", restored == "3/6/2/10/1", restored)

for ok, name, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{f' — {detail}' if detail else ''}")

failed = sum(1 for ok, _, _ in results if not ok)
print(f"\n{len(results) - failed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
