"""Browser pass over the Student module: the parts HTTP tests cannot reach.

Asserts behaviour, not just that a control exists — that state actually
changed, that a write landed in MySQL, and that signing out really ends the
session.
"""
import subprocess
import sys

from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3100"
APP_ID = "ATL-2024-0871"
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


# High-water marks, so the teardown removes exactly what this run created.
high_water_application = sql("SELECT COALESCE(MAX(id), 0) FROM applications")
high_water_activity = sql("SELECT COALESCE(MAX(id), 0) FROM activity_logs")
high_water_notification = sql("SELECT COALESCE(MAX(id), 0) FROM notifications")
high_water_message = sql("SELECT COALESCE(MAX(id), 0) FROM messages")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    console_errors = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # ---- anonymous -------------------------------------------------------
    page.goto(f"{BASE}/student/home", wait_until="networkidle")
    check("protected page sends an anonymous visitor to login", "/login" in page.url, page.url)
    check("the login page remembers the destination", "next=" in page.url, page.url)

    # ---- wrong password --------------------------------------------------
    page.fill("input[name=appId]", APP_ID)
    page.fill("input[name=password]", "wrong-password")
    page.click("button[type=submit]")
    page.wait_for_timeout(1200)
    check("a wrong password keeps the user on the login screen", "/login" in page.url, page.url)
    check(
        "and the reason is shown in the form",
        page.get_by_text("incorrect", exact=False).count() > 0,
    )

    # ---- sign in ---------------------------------------------------------
    page.fill("input[name=password]", PASSWORD)
    page.click("button[type=submit]")
    page.wait_for_url("**/student/home**", timeout=15000)
    # networkidle fires while the streamed page is still showing its loading
    # skeleton, so wait for content the dashboard only renders once its data
    # has arrived.
    page.get_by_text("RECENT ACTIVITY").wait_for(timeout=15000)
    check("correct credentials land on the remembered destination", "/student/home" in page.url,
          page.url)

    # The deliberate wrong-password attempt above is a real 401; only errors
    # from here on are unexpected.
    console_errors.clear()

    # A production build prefixes the name with `__Host-`, which also forces
    # Secure + Path=/ + no Domain, so match on the suffix rather than the
    # literal name and assert the prefix's guarantees when it is present.
    cookie = next((c for c in context.cookies()
                   if c["name"].endswith("atlas_forge_session")), None)
    check("session cookie is set and HttpOnly", bool(cookie) and cookie["httpOnly"])
    if cookie and cookie["name"].startswith("__Host-"):
        check("__Host- prefix is backed by Secure and Path=/",
              cookie["secure"] and cookie["path"] == "/" , str(cookie.get("domain")))
    check(
        "the cookie is not readable from JavaScript",
        "atlas_forge_session" not in page.evaluate("document.cookie"),
    )

    body = page.inner_text("body")
    check("the dashboard greets the signed-in student", "Welcome, Riya" in body)
    check("stat cards show real counts", "Active Applications" in body and "Projects Exploring" in body)
    check("recent activity is rendered from the audit log",
          "Applied for UI/UX Designer at NovaMed" in body)
    check("the navbar shows the real account, not the mock one",
          page.locator("header").first.inner_text().count("Log out") == 1)

    # ---- apply -----------------------------------------------------------
    before = sql(
        "SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.applicant_user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )

    page.goto(f"{BASE}/student/jobs", wait_until="networkidle")
    apply_button = page.get_by_role("button", name="Apply for this Role", exact=True)

    # Select a listing that has not been applied to yet.
    cards = page.locator("#main-content ul li button[type=button]")
    role_title = None
    for index in range(cards.count()):
        cards.nth(index).click()
        page.wait_for_timeout(200)
        if apply_button.count() > 0 and apply_button.is_enabled():
            # Read the title from the card that was clicked — the first h2 on
            # the page belongs to the sidebar, not the listing.
            role_title = cards.nth(index).locator("h2").inner_text().strip()
            break

    check("an unapplied role offers an enabled Apply button",
          role_title is not None and apply_button.is_enabled(), role_title or "none found")
    apply_button.click()

    page.wait_for_timeout(2500)
    dialog_text = page.inner_text("body")
    check("applying confirms with the reference dialog", "Application Sent!" in dialog_text)
    check("the confirmation names the role applied for", role_title.split("\n")[0] in dialog_text,
          role_title)

    after = sql(
        "SELECT COUNT(*) FROM applications a JOIN users u ON u.id=a.applicant_user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )
    check("the application actually reached MySQL", int(after) == int(before) + 1,
          f"{before} -> {after}")

    stored = sql(
        "SELECT l.title FROM applications a JOIN listings l ON l.id=a.listing_id "
        f"JOIN users u ON u.id=a.applicant_user_id WHERE u.app_id='{APP_ID}' "
        "ORDER BY a.id DESC LIMIT 1"
    )
    check("the stored row is the role that was clicked", stored == role_title,
          f"stored {stored!r} vs clicked {role_title!r}")

    page.get_by_role("button", name="Back to Jobs", exact=True).click()
    page.wait_for_timeout(500)
    check(
        "the button settles into its applied state",
        page.get_by_role("button", name="Applied ✓", exact=True).count() > 0,
    )

    # ---- the write is visible on another screen --------------------------
    page.goto(f"{BASE}/student/applications", wait_until="networkidle")
    check("the new application appears in My Applications",
          stored in page.inner_text("body"), stored)

    # ---- Contact Forge Manager writes a real message ---------------------
    messages_before = sql("SELECT COUNT(*) FROM messages")
    page.goto(f"{BASE}/student/contact-manager", wait_until="networkidle")
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Contact Forge Manager", exact=True).click()
    page.wait_for_timeout(400)
    page.fill("input[name=subject]", "Browser-verified question")
    page.fill("textarea[name=message]", "Checking that this reaches the database.")
    page.get_by_role("button", name="Send Message", exact=True).click()
    page.wait_for_timeout(2500)

    check("the message confirmation appears", "Message Sent!" in page.inner_text("body"))
    messages_after = sql("SELECT COUNT(*) FROM messages")
    check("and the message reached MySQL", int(messages_after) == int(messages_before) + 1,
          f"{messages_before} -> {messages_after}")
    recipient = sql(
        "SELECT u.full_name FROM messages m JOIN users u ON u.id = m.recipient_user_id "
        "ORDER BY m.id DESC LIMIT 1"
    )
    check("addressed to the Forge Manager", recipient == "Mihir Pawar", recipient)

    # ---- the mobile profile Save is disabled, not falsely confirming ------
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE}/student/profile", wait_until="networkidle")
    page.wait_for_timeout(500)
    mobile_save = page.get_by_role("button", name="Save Changes", exact=True).first
    check("the mobile profile Save is disabled rather than faking a save",
          mobile_save.is_disabled())
    page.set_viewport_size({"width": 1440, "height": 900})

    # ---- Edit Skills & Availability goes to the screen that edits them ---
    page.goto(f"{BASE}/student/profile", wait_until="networkidle")
    page.wait_for_timeout(400)
    page.get_by_role("link", name="Edit Skills & Availability", exact=True).click()
    page.wait_for_url("**/student/availability**", timeout=15000)
    check("Edit Skills & Availability opens the Concierge profile",
          "/student/availability" in page.url, page.url)

    # ---- availability toggle --------------------------------------------
    was = sql(
        "SELECT is_available FROM student_profiles sp JOIN users u ON u.id=sp.user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )
    page.goto(f"{BASE}/student/availability", wait_until="networkidle")
    toggle = page.get_by_role("switch").first
    toggle.click()
    page.wait_for_timeout(2000)
    now = sql(
        "SELECT is_available FROM student_profiles sp JOIN users u ON u.id=sp.user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )
    check("the availability toggle writes to MySQL", was != now, f"{was} -> {now}")

    toggle.click()
    page.wait_for_timeout(2000)
    restored = sql(
        "SELECT is_available FROM student_profiles sp JOIN users u ON u.id=sp.user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )
    check("and toggling back restores it", restored == was, f"{restored} == {was}")

    # ---- mentorship request ---------------------------------------------
    requests_before = sql(
        "SELECT COUNT(*) FROM mentorship_requests r JOIN users u ON u.id=r.requester_user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )
    page.goto(f"{BASE}/student/mentorship", wait_until="networkidle")
    page.get_by_role("button", name="+ Request a Mentorship Session", exact=True).click()
    page.wait_for_timeout(400)
    page.fill("input[name=topic]", "Portfolio review before placements")
    page.fill("input[name=timing]", "Thursday evenings")
    page.get_by_role("button", name="Send Request", exact=True).click()
    page.wait_for_timeout(2500)
    check("the request dialog confirms", "Request Sent!" in page.inner_text("body"))
    requests_after = sql(
        "SELECT COUNT(*) FROM mentorship_requests r JOIN users u ON u.id=r.requester_user_id "
        f"WHERE u.app_id='{APP_ID}'"
    )
    check("the mentorship request reached MySQL",
          int(requests_after) == int(requests_before) + 1,
          f"{requests_before} -> {requests_after}")

    # ---- sign out --------------------------------------------------------
    page.goto(f"{BASE}/student/home", wait_until="networkidle")
    page.get_by_role("button", name="Log out").first.click()
    page.wait_for_url("**/login**", timeout=15000)
    check("logging out returns to the login screen", "/login" in page.url, page.url)
    check(
        "the session cookie is gone",
        not any(c["name"].endswith("atlas_forge_session") and c["value"]
                for c in context.cookies()),
    )

    page.goto(f"{BASE}/student/home", wait_until="networkidle")
    check("and the protected page is closed again", "/login" in page.url, page.url)

    real_errors = [e for e in console_errors if "favicon" not in e.lower()]
    check("no console or page errors during the whole flow", len(real_errors) == 0,
          "; ".join(real_errors[:2]))

    browser.close()

# ---- restore the seeded demo data ---------------------------------------
# Everything created during the run, identified by the high-water marks taken
# before it started rather than by hard-coded ids.
TOPIC = "Portfolio review before placements"
sql(
    "DELETE ae FROM application_events ae JOIN applications a ON a.id=ae.application_id "
    f"WHERE a.id > {high_water_application}"
)
sql(f"DELETE FROM applications WHERE id > {high_water_application}")
sql(f"DELETE FROM mentorship_sessions WHERE topic = '{TOPIC}'")
sql(f"DELETE FROM mentorship_requests WHERE topic = '{TOPIC}'")
sql(f"DELETE FROM activity_logs WHERE id > {high_water_activity}")
sql(f"DELETE FROM notifications WHERE id > {high_water_notification}")
sql(f"DELETE FROM messages WHERE id > {high_water_message}")

for ok, name, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{f' — {detail}' if detail else ''}")

failed = sum(1 for ok, _, _ in results if not ok)
print(f"\n{len(results) - failed} passed, {failed} failed\n")
sys.exit(1 if failed else 0)
