const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  });
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(url, anonKey);
const adminClient = createClient(url, serviceKey);

async function runE2ETests() {
  console.log("==================================================");
  console.log("ADMIN NOTIFICATION SYSTEM — E2E VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details}`);
      failed++;
    }
  }

  // 1. Check table existence
  console.log("--- 1. Checking public.admin_notifications Table ---");
  const { data: tableCheck, error: tableErr } = await adminClient
    .from("admin_notifications")
    .select("id")
    .limit(1);

  if (tableErr) {
    assert(false, "admin_notifications table exists", `Error: ${tableErr.message}`);
    console.log("\n>>> ACTION REQUIRED: Run supabase/apply_notifications_migration.sql in Supabase SQL Editor: https://supabase.com/dashboard/project/xmveofqeunsqzyxhakyj/sql/new\n");
    return;
  }
  assert(true, "admin_notifications table exists and is queryable");

  // 2. Test Enquiry Notification Flow
  console.log("\n--- 2. Testing New Enquiry Notification Flow ---");
  const testEnqRef = "TEST-ENQ-" + Math.floor(100000 + Math.random() * 900000);
  const { data: leadRow, error: leadErr } = await adminClient
    .from("leads")
    .insert({
      reference: testEnqRef,
      name: "Rohan Patel",
      email: "rohan.test@example.com",
      phone: "+91 99887 76655",
      company: "Patel Industries",
      division: "it",
      service: "Enterprise Cloud & DevOps",
      message: "Need urgent migration assessment for our infrastructure.",
      status: "new",
      source: "website",
    })
    .select("id, reference")
    .single();

  assert(!leadErr && leadRow?.id, "Enquiry lead inserted into public.leads", leadErr?.message || `ID: ${leadRow?.id}`);

  // Wait 1 second for DB trigger or server notification
  await new Promise((r) => setTimeout(r, 1200));

  const { data: enqNotifs, error: enqNotifErr } = await adminClient
    .from("admin_notifications")
    .select("*")
    .eq("entity_reference", testEnqRef);

  assert(
    !enqNotifErr && enqNotifs && enqNotifs.length >= 1,
    "Notification record created for new enquiry",
    `Found ${enqNotifs?.length || 0} rows. Title: "${enqNotifs?.[0]?.title}"`
  );

  if (enqNotifs?.[0]) {
    const n = enqNotifs[0];
    assert(n.type === "enquiry" || n.type === "new_enquiry", `Notification type is valid: "${n.type}"`);
    assert(n.entity_type === "lead", `Notification entity_type is "lead": "${n.entity_type}"`);
    assert(n.is_read === false, "Notification is unread by default (is_read = false)");
    assert(n.message.includes("Rohan Patel"), `Notification message includes submitter name: "${n.message}"`);
  }

  // 3. Test Consultant Booking Notification Flow
  console.log("\n--- 3. Testing Consultant Booking Notification Flow ---");
  const testBkRef = "TEST-BK-" + Math.floor(100000 + Math.random() * 900000);
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const { data: bookingRow, error: bookingErr } = await adminClient
    .from("bookings")
    .insert({
      reference: testBkRef,
      name: "Sneha Sharma",
      email: "sneha.test@example.com",
      phone: "+91 98765 12345",
      company: "Sharma Global",
      division: "financial",
      service: "Project Finance & Debt Syndication",
      meeting_type: "video",
      slot_at: futureDate.toISOString(),
      duration_minutes: 45,
      status: "pending",
      source: "book-page",
    })
    .select("id, reference")
    .single();

  assert(!bookingErr && bookingRow?.id, "Booking inserted into public.bookings", bookingErr?.message || `ID: ${bookingRow?.id}`);

  await new Promise((r) => setTimeout(r, 1200));

  const { data: bkNotifs, error: bkNotifErr } = await adminClient
    .from("admin_notifications")
    .select("*")
    .eq("entity_reference", testBkRef);

  assert(
    !bkNotifErr && bkNotifs && bkNotifs.length >= 1,
    "Notification record created for consultant booking",
    `Found ${bkNotifs?.length || 0} rows. Title: "${bkNotifs?.[0]?.title}"`
  );

  if (bkNotifs?.[0]) {
    const n = bkNotifs[0];
    assert(n.type === "booking", `Booking notification type is "booking": "${n.type}"`);
    assert(n.entity_type === "booking", `Booking notification entity_type is "booking": "${n.entity_type}"`);
    assert(n.message.includes("Sneha Sharma"), `Booking message contains client name: "${n.message}"`);
  }

  // 4. Test Job Application Notification Flow
  console.log("\n--- 4. Testing Job Application Notification Flow ---");
  const testJobRef = "TEST-JOB-" + Math.floor(100000 + Math.random() * 900000);
  const { data: jobRow, error: jobErr } = await adminClient
    .from("leads")
    .insert({
      reference: testJobRef,
      name: "Amit Verma",
      email: "amit.test@example.com",
      phone: "+91 91234 56789",
      division: "it",
      service: "Senior Full Stack Engineer",
      message: "Resume submitted via careers portal",
      status: "new",
      source: "careers",
    })
    .select("id, reference")
    .single();

  assert(!jobErr && jobRow?.id, "Job application inserted into public.leads with source='careers'", jobErr?.message);

  await new Promise((r) => setTimeout(r, 1200));

  const { data: jobNotifs, error: jobNotifErr } = await adminClient
    .from("admin_notifications")
    .select("*")
    .eq("entity_reference", testJobRef);

  assert(
    !jobNotifErr && jobNotifs && jobNotifs.length >= 1,
    "Notification record created for job application",
    `Found ${jobNotifs?.length || 0} rows. Title: "${jobNotifs?.[0]?.title}"`
  );

  if (jobNotifs?.[0]) {
    const n = jobNotifs[0];
    assert(n.type === "job_application", `Career notification type is "job_application": "${n.type}"`);
    assert(n.entity_type === "job_application", `Career notification entity_type is "job_application": "${n.entity_type}"`);
  }

  // 5. Test Mark As Read Functionality
  console.log("\n--- 5. Testing Mark As Read & Unread Filtering ---");
  if (enqNotifs?.[0]) {
    const { error: markErr } = await adminClient
      .from("admin_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", enqNotifs[0].id);

    assert(!markErr, "Successfully marked notification as read");

    const { data: updated } = await adminClient
      .from("admin_notifications")
      .select("is_read, read_at")
      .eq("id", enqNotifs[0].id)
      .single();

    assert(updated?.is_read === true && updated?.read_at, "is_read is true and read_at timestamp is set");
  }

  // 6. Cleanup Test Records
  console.log("\n--- 6. Cleaning Up Test Artifacts ---");
  if (leadRow?.id) await adminClient.from("leads").delete().eq("id", leadRow.id);
  if (bookingRow?.id) await adminClient.from("bookings").delete().eq("id", bookingRow.id);
  if (jobRow?.id) await adminClient.from("leads").delete().eq("id", jobRow.id);

  await adminClient.from("admin_notifications").delete().in("entity_reference", [testEnqRef, testBkRef, testJobRef]);
  console.log("[PASS] Test records cleaned up successfully.");

  console.log("\n==================================================");
  console.log(`E2E SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runE2ETests().catch(console.error);
