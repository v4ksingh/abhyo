const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const { User, GovernmentJob } = require('../src/models');

const BASE_URL = 'http://localhost:5000/api';
const API_KEY = process.env.N8N_API_KEY || 'abhyo_n8n_sec_7f9b2d8e4c1a5390e6b812f';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('===============================================================');
  console.log('ABHYO AI GOVERNMENT JOBS AUTOMATION SYSTEM - COMPREHENSIVE TESTS');
  console.log('===============================================================\n');

  // Find or create admin user for testing admin endpoints
  let admin = await User.findOne({ where: { role: 'superadmin' } });
  if (!admin) {
    admin = await User.findOne({ where: { role: 'admin' } });
  }
  if (!admin) {
    console.log('Creating temporary test admin user...');
    admin = await User.create({
      name: 'System Test Admin',
      email: 'testadmin_temp@abhyo.com',
      password: 'HashPassword123!',
      role: 'superadmin',
      isActive: true,
    });
  }

  const adminToken = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const adminHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };

  const results = [];
  function record(testNumber, description, passed, details = '') {
    results.push({ testNumber, description, passed, details });
    const statusText = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Test ${testNumber.toString().padStart(2, '0')}] ${statusText} - ${description}`);
    if (details) console.log(`       Details: ${details}`);
  }

  // Clean up any test records from prior test runs
  const { Op } = require('sequelize');
  await GovernmentJob.destroy({
    where: {
      [Op.or]: [
        { title: { [Op.like]: '%Automated Test%' } },
        { title: { [Op.like]: '%Minimal Job Posting%' } },
        { title: { [Op.like]: '%Protected Published%' } },
        { title: { [Op.like]: '%Invalid Fake%' } },
        { title: { [Op.like]: '%Still Pending%' } },
        { sourceUrl: { [Op.like]: '%freejobalert.com/%test%' } },
        { sourceUrl: { [Op.like]: '%freejobalert.com/upsc-cse-protected%' } },
      ]
    }
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Import one valid job
    // -------------------------------------------------------------
    const job1Payload = {
      title: 'Automated Test SSC CGL 2026 Recruitment',
      organization: 'Staff Selection Commission',
      category: 'SSC',
      totalVacancies: 12500,
      qualification: ['Bachelor Degree in Any Stream'],
      ageLimit: { minimum: 18, maximum: 32, calculationDate: '2026-08-01' },
      salary: 'Level-4 to Level-8 (₹25,500 - ₹1,51,100)',
      applicationMode: 'Online',
      applicationStartDate: '2026-06-24',
      applicationLastDate: '2026-07-24',
      officialNotificationUrl: 'https://ssc.gov.in/cgl2026.pdf',
      officialWebsite: 'https://ssc.gov.in',
      applyLink: 'https://ssc.gov.in/apply',
      source: 'FreeJobAlert',
      sourceUrl: 'https://freejobalert.com/ssc-cgl-recruitment-test-unique-1',
      dataWarnings: ['Check calculation date for Assistant Section Officer'],
      aiExtracted: true,
      extractedAt: new Date().toISOString(),
      validationStatus: 'passed',
    };

    const res1 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(job1Payload),
    });

    const job1 = res1.data?.data?.[0];
    let fullJob1 = null;
    if (job1?.id) {
      fullJob1 = await GovernmentJob.findByPk(job1.id);
    }
    const pass1 = res1.status === 201 &&
      job1 &&
      job1.status === 'pending_review' &&
      fullJob1 &&
      fullJob1.verificationStatus === 'pending' &&
      fullJob1.reviewRequired === true &&
      fullJob1.aiExtracted === true &&
      fullJob1.slug.includes('automated-test-ssc-cgl');

    record(1, 'Import one valid job with mandatory pending_review status', pass1,
      `HTTP ${res1.status}, id: ${job1?.id}, status: ${job1?.status}`);

    // -------------------------------------------------------------
    // Test 2: Import multiple jobs in a batch
    // -------------------------------------------------------------
    const batchPayload = {
      jobs: [
        {
          title: 'Automated Test RRB NTPC 2026',
          organization: 'Railway Recruitment Boards',
          category: 'Railway',
          totalVacancies: 11558,
          sourceUrl: 'https://freejobalert.com/rrb-ntpc-test-unique-2',
          officialNotificationUrl: 'https://indianrailways.gov.in/notif.pdf',
        },
        {
          title: 'Automated Test IBPS PO XIV 2026',
          organization: 'IBPS',
          category: 'Banking',
          totalVacancies: 3955,
          sourceUrl: 'https://freejobalert.com/ibps-po-test-unique-3',
          officialNotificationUrl: 'https://ibps.in/po.pdf',
        }
      ]
    };

    const res2 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(batchPayload),
    });

    const pass2 = res2.status === 201 && res2.data?.count === 2 && res2.data?.created === 2;
    record(2, 'Import multiple jobs in a batch format', pass2,
      `HTTP ${res2.status}, count: ${res2.data?.count}, created: ${res2.data?.created}`);

    // -------------------------------------------------------------
    // Test 3: Import a duplicate source URL
    // -------------------------------------------------------------
    const res3 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        title: 'Automated Test SSC CGL Duplicate',
        sourceUrl: 'https://freejobalert.com/ssc-cgl-recruitment-test-unique-1', // existing sourceUrl
      }),
    });

    const pass3 = res3.status === 200 && res3.data?.duplicates === 1 && res3.data?.created === 0;
    record(3, 'Import duplicate source URL safely without creating duplicate record', pass3,
      `HTTP ${res3.status}, duplicates: ${res3.data?.duplicates}`);

    // -------------------------------------------------------------
    // Test 4: Import a job with missing optional fields
    // -------------------------------------------------------------
    const res4 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        title: 'Minimal Job Posting Without Optional Fields',
        organization: 'DRDO',
      }),
    });

    const pass4 = res4.status === 201 && res4.data?.created === 1;
    record(4, 'Import job with missing optional fields gracefully', pass4,
      `HTTP ${res4.status}, created: ${res4.data?.created}`);

    // -------------------------------------------------------------
    // Test 5: Import a job with missing title
    // -------------------------------------------------------------
    const res5 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        organization: 'UPSC',
        totalVacancies: 100,
      }),
    });

    const pass5 = res5.status === 400 && res5.data?.success === false;
    record(5, 'Reject job with missing title with HTTP 400', pass5,
      `HTTP ${res5.status}, message: ${res5.data?.message}`);

    // -------------------------------------------------------------
    // Test 6: Import a job with invalid vacancy count
    // -------------------------------------------------------------
    const res6 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        title: 'Invalid Vacancy Job',
        totalVacancies: -50,
      }),
    });

    const pass6 = res6.status === 400 && res6.data?.success === false;
    record(6, 'Reject job with invalid vacancy count with HTTP 400', pass6,
      `HTTP ${res6.status}, message: ${res6.data?.message}`);

    // -------------------------------------------------------------
    // Test 7: Import with invalid API key
    // -------------------------------------------------------------
    const res7 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'wrong_invalid_key_xyz' },
      body: JSON.stringify({ title: 'Unauthorized Test Job' }),
    });

    const pass7 = res7.status === 401;
    record(7, 'Reject import with invalid API key with HTTP 401', pass7,
      `HTTP ${res7.status}, message: ${res7.data?.message}`);

    // -------------------------------------------------------------
    // Test 8: Import with missing API key
    // -------------------------------------------------------------
    const res8 = await request(`${BASE_URL}/government-jobs/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Missing Key Job' }),
    });

    const pass8 = res8.status === 401;
    record(8, 'Reject import with missing API key with HTTP 401', pass8,
      `HTTP ${res8.status}, message: ${res8.data?.message}`);

    // -------------------------------------------------------------
    // Test 9: Update an existing pending job with upsert=true
    // -------------------------------------------------------------
    const res9 = await request(`${BASE_URL}/government-jobs/webhook?upsert=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        title: 'Automated Test SSC CGL 2026 Recruitment Updated',
        organization: 'Staff Selection Commission India',
        totalVacancies: 14500,
        sourceUrl: 'https://freejobalert.com/ssc-cgl-recruitment-test-unique-1',
      }),
    });

    const pass9 = (res9.status === 200 || res9.status === 201) && res9.data?.updated === 1;
    record(9, 'Update existing pending job via upsert flag', pass9,
      `HTTP ${res9.status}, updated: ${res9.data?.updated}`);

    // -------------------------------------------------------------
    // Test 10: Attempt to overwrite a published job through AI upsert
    // -------------------------------------------------------------
    const test10SourceUrl = `https://freejobalert.com/upsc-cse-protected-${Date.now()}`;
    const publishedJob = await GovernmentJob.create({
      title: 'Protected Published UPSC Civil Services 2026',
      slug: `protected-published-upsc-civil-services-${Date.now()}`,
      organization: 'Union Public Service Commission',
      category: 'UPSC',
      totalVacancies: 1056,
      sourceUrl: test10SourceUrl,
      officialNotificationUrl: 'https://upsc.gov.in/cse2026.pdf',
      status: 'published',
      publishedAt: new Date(),
      publishedBy: admin.id,
      reviewRequired: false,
      verificationStatus: 'verified',
    });

    // Attempt to overwrite via webhook upsert
    const res10 = await request(`${BASE_URL}/government-jobs/webhook?upsert=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        title: 'Unverified AI Overwrite Attempt',
        totalVacancies: 50,
        sourceUrl: test10SourceUrl,
      }),
    });

    const reloadedProtected = await GovernmentJob.findByPk(publishedJob.id);
    const pass10 = reloadedProtected.status === 'published' &&
                   reloadedProtected.title === 'Protected Published UPSC Civil Services 2026' &&
                   res10.data?.duplicates === 1;

    record(10, 'Strict safeguard: Never overwrite published job with AI data', pass10,
      `Status remained: ${reloadedProtected.status}, title: "${reloadedProtected.title}"`);

    // -------------------------------------------------------------
    // Test 11: Approve a pending job
    // -------------------------------------------------------------
    const pendingJob = await GovernmentJob.findOne({ where: { status: 'pending_review' } });
    let pass11 = false;
    let approveId = null;

    if (pendingJob) {
      approveId = pendingJob.id;
      const res11 = await request(`${BASE_URL}/government-jobs/admin/${approveId}/approve`, {
        method: 'PATCH',
        headers: adminHeaders,
      });

      const updatedApproved = await GovernmentJob.findByPk(approveId);
      pass11 = res11.status === 200 && updatedApproved.status === 'approved' && updatedApproved.reviewedBy === admin.id;
    }
    record(11, 'Admin approves a pending job', pass11,
      `Job ID: ${approveId}, status: approved, audit reviewedBy recorded`);

    // -------------------------------------------------------------
    // Test 12: Reject a pending job
    // -------------------------------------------------------------
    const pendingJobForReject = await GovernmentJob.create({
      title: 'Invalid Fake Recruitment Notice 2026',
      slug: 'invalid-fake-recruitment-notice-2026',
      organization: 'Fake Department',
      status: 'pending_review',
    });

    const res12 = await request(`${BASE_URL}/government-jobs/admin/${pendingJobForReject.id}/reject`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ rejectionReason: 'Scam notification detected by admin' }),
    });

    const updatedRejected = await GovernmentJob.findByPk(pendingJobForReject.id);
    const pass12 = res12.status === 200 &&
                   updatedRejected.status === 'rejected' &&
                   updatedRejected.rejectionReason === 'Scam notification detected by admin';

    record(12, 'Admin rejects a job and records rejection reason', pass12,
      `Status: ${updatedRejected.status}, reason: "${updatedRejected.rejectionReason}"`);

    // -------------------------------------------------------------
    // Test 13: Publish an approved job
    // -------------------------------------------------------------
    // Ensure approved job has official notification URL
    await GovernmentJob.update(
      { officialNotificationUrl: 'https://ssc.gov.in/notif.pdf' },
      { where: { id: approveId } }
    );

    const res13 = await request(`${BASE_URL}/government-jobs/admin/${approveId}/publish`, {
      method: 'PATCH',
      headers: adminHeaders,
    });

    const reloadedPublished = await GovernmentJob.findByPk(approveId);
    const pass13 = res13.status === 200 &&
                   reloadedPublished.status === 'published' &&
                   reloadedPublished.publishedBy === admin.id;

    record(13, 'Admin publishes an approved job with official notification URL', pass13,
      `Status: ${reloadedPublished.status}, publishedBy: ${reloadedPublished.publishedBy}`);

    // -------------------------------------------------------------
    // Test 14: Attempt to publish a pending job
    // -------------------------------------------------------------
    const anotherPending = await GovernmentJob.create({
      title: 'Still Pending Job Not Yet Approved',
      slug: 'still-pending-job-not-yet-approved',
      organization: 'Testing Dept',
      status: 'pending_review',
      officialNotificationUrl: 'https://test.gov.in/doc.pdf',
    });

    const res14 = await request(`${BASE_URL}/government-jobs/admin/${anotherPending.id}/publish`, {
      method: 'PATCH',
      headers: adminHeaders,
    });

    const pass14 = res14.status === 400 && res14.data?.success === false;
    record(14, 'Safeguard: Block direct publishing of non-approved job with HTTP 400', pass14,
      `HTTP ${res14.status}, message: ${res14.data?.message}`);

    // -------------------------------------------------------------
    // Test 15: Confirm pending jobs do not appear publicly
    // -------------------------------------------------------------
    const res15 = await request(`${BASE_URL}/government-jobs`);
    const publicList = res15.data?.data || [];
    const hasPendingInPublic = publicList.some(j => j.id === anotherPending.id || j.status !== 'published');
    const pass15 = res15.status === 200 && !hasPendingInPublic;

    record(15, 'Confirm pending and rejected jobs NEVER appear on public API', pass15,
      `Public count: ${publicList.length}, all items status === "published": ${!hasPendingInPublic}`);

    // -------------------------------------------------------------
    // Test 16: Confirm published jobs appear publicly
    // -------------------------------------------------------------
    const res16 = await request(`${BASE_URL}/government-jobs/${reloadedPublished.slug}`);
    const pass16 = res16.status === 200 &&
                   res16.data?.data?.slug === reloadedPublished.slug &&
                   res16.data?.data?.title === reloadedPublished.title;

    record(16, 'Confirm published job is accessible on public slug route', pass16,
      `HTTP ${res16.status}, found slug: ${res16.data?.data?.slug}`);

    // -------------------------------------------------------------
    // Test 17: Confirm internal AI warnings & notes are NOT exposed publicly
    // -------------------------------------------------------------
    const publicJobData = res16.data?.data || {};
    const pass17 = publicJobData.dataWarnings === undefined &&
                   publicJobData.validationWarnings === undefined &&
                   publicJobData.adminNotes === undefined &&
                   publicJobData.rejectionReason === undefined;

    record(17, 'Confirm internal AI warnings and admin notes are stripped from public API', pass17,
      `dataWarnings exposed: ${!!publicJobData.dataWarnings}, adminNotes exposed: ${!!publicJobData.adminNotes}`);

    console.log('\n===============================================================');
    const totalPassed = results.filter(r => r.passed).length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${totalPassed} | FAILED: ${results.length - totalPassed}`);
    console.log('===============================================================\n');

    process.exit(totalPassed === results.length ? 0 : 1);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
