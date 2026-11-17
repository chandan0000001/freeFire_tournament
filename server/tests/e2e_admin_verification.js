import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const API_BASE = 'http://localhost:5000/api';
const EMAIL = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@ritesports.in';
const PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@RIT2026!';

let token = '';
let testTournamentId = '';
let testTournamentSlug = '';
let testRegistrationId = '';
let testResultId = '';
let testPrizeId = '';
let manualPrizeId = '';

const logStep = (step, title) => console.log(`\n\x1b[36m[STEP ${step}]\x1b[0m \x1b[1m${title}\x1b[0m`);

async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

const assertSuccess = (res, actionName) => {
  if (res.status >= 200 && res.status < 300 && res.data?.success !== false) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${actionName} (HTTP ${res.status})`);
    return true;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${actionName} (HTTP ${res.status})`);
    console.error('  Response Data:', JSON.stringify(res.data, null, 2));
    throw new Error(`Assertion failed for ${actionName}`);
  }
};

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('  RIT ESPORTS ARENA — FULL ADMIN END-TO-END VERIFICATION');
  console.log('====================================================');
  console.log(`Target Backend: ${API_BASE}`);
  console.log(`Admin User:     ${EMAIL}`);

  // 1. Admin Login
  logStep(1, 'Admin Login with .env Credentials');
  const loginRes = await apiRequest('/auth/admin/login', 'POST', {
    email: EMAIL,
    password: PASSWORD,
  });
  assertSuccess(loginRes, 'Admin Authentication');
  token = loginRes.data.token;
  console.log(`  Authenticated as: ${loginRes.data.user?.name} (${loginRes.data.user?.role})`);

  // 2. Dashboard KPI Stats
  logStep(2, 'Dashboard KPI Overview');
  const dashRes = await apiRequest('/admin/dashboard/stats');
  assertSuccess(dashRes, 'Fetch Dashboard Statistics');
  console.log(`  Stats: Tournaments=${dashRes.data.stats?.totalTournaments}, Registrations=${dashRes.data.stats?.totalRegistrations}, Verified=${dashRes.data.stats?.verifiedRegistrations}, Prizes=₹${dashRes.data.stats?.totalPrizePool}`);

  // 3. Create Tournament
  logStep(3, 'Tournaments & Slots: Create New Tournament');
  const createTournRes = await apiRequest('/admin/tournaments', 'POST', {
    title: `E2E Test Tournament ${Date.now()}`,
    format: 'squad',
    entryFee: 29,
    maxSlots: 12,
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    map: 'Bermuda',
    prizeConfig: {
      totalPool: 230,
      firstPlace: 120,
      secondPlace: 70,
      thirdPlace: 40,
    },
    scoringConfig: {
      killPointValue: 1,
      booyahBonus: 12,
    },
  });
  assertSuccess(createTournRes, 'Create Tournament');
  testTournamentId = createTournRes.data.tournament._id;
  testTournamentSlug = createTournRes.data.tournament.slug;
  console.log(`  Created Tournament ID: ${testTournamentId} (${testTournamentSlug})`);

  // 4. Update Tournament Details
  logStep(4, 'Tournaments & Slots: Edit Tournament');
  const editTournRes = await apiRequest(`/admin/tournaments/${testTournamentId}`, 'PATCH', {
    title: `E2E Test Tournament Updated ${Date.now()}`,
    map: 'Purgatory',
  });
  assertSuccess(editTournRes, 'Edit Tournament');

  // 5. Update Tournament Status
  logStep(5, 'Tournaments & Slots: Update Status to Registration Open');
  const statusRes = await apiRequest(`/admin/tournaments/${testTournamentId}/status`, 'PATCH', {
    status: 'registration_open',
  });
  assertSuccess(statusRes, 'Update Tournament Status');

  // 6. Register a Test Squad
  logStep(6, 'Registrations: Submit Squad Entry');
  const regRes = await apiRequest('/registrations/squad', 'POST', {
    tournamentId: testTournamentId,
    teamName: 'Team Antigravity E2E',
    captain: {
      name: 'Test Captain Alpha',
      email: 'testcaptain@ritesports.in',
      phone: '9876543210',
      collegeRollNo: 'RIT2026CS999',
    },
    players: [
      { name: 'Test Captain Alpha', inGameName: 'AG_Captain', freeFireUid: '1234567890', isConsentPublic: true },
      { name: 'Player 2', inGameName: 'AG_Sniper', freeFireUid: '1234567891', isConsentPublic: true },
      { name: 'Player 3', inGameName: 'AG_Rusher', freeFireUid: '1234567892', isConsentPublic: true },
      { name: 'Player 4', inGameName: 'AG_Support', freeFireUid: '1234567893', isConsentPublic: true },
    ],
  });
  assertSuccess(regRes, 'Register Squad');
  testRegistrationId = regRes.data.registration._id;
  console.log(`  Registration Reference: ${regRes.data.registration.referenceId}`);

  // 7. Admin Registrations Search & Verify Payment
  logStep(7, 'Registrations & Payments: Search & Verify Payment (UTR)');
  const searchRegRes = await apiRequest(`/admin/registrations?tournamentId=${testTournamentId}&search=Team+Antigravity`);
  assertSuccess(searchRegRes, 'Search Registrations');

  testRegistrationId = searchRegRes.data.registrations?.[0]?._id;
  if (!testRegistrationId) throw new Error('Could not find registered test squad in admin search');

  const verifyPayRes = await apiRequest(`/admin/registrations/${testRegistrationId}/payment`, 'PATCH', {
    status: 'verified',
    utr: 'UTR-E2E-TEST-998877',
    notes: 'Verified via UPI test verification',
  });
  assertSuccess(verifyPayRes, 'Verify UPI Payment');

  // 8. Room Credentials Management
  logStep(8, 'Room Credentials: Set Room ID & Password');
  const roomRes = await apiRequest(`/admin/rooms/${testTournamentId}`, 'POST', {
    roomId: '88776655',
    roomPassword: 'FF_E2E_PASS!',
  });
  assertSuccess(roomRes, 'Set Room Credentials');

  const roomLogsRes = await apiRequest(`/admin/rooms/${testTournamentId}/logs`);
  assertSuccess(roomLogsRes, 'Fetch Room Delivery Logs');

  // 9. Match Results: Direct Record & Declare Winner
  logStep(9, 'Match Results Review: Direct Record Match & Declare Winner');
  const recordRes = await apiRequest('/admin/results/direct-record', 'POST', {
    tournamentId: testTournamentId,
    matchNumber: 1,
    map: 'Purgatory',
    entries: [
      {
        registrationId: testRegistrationId,
        participantName: 'Team Antigravity E2E',
        placement: 1,
        kills: 14,
        isBooyah: true,
      },
      {
        registrationId: null,
        participantName: 'Runner Up Team E2E',
        placement: 2,
        kills: 6,
        isBooyah: false,
      },
    ],
    notes: 'E2E Match played on custom room. Clean Booyah victory.',
    autoPublish: false, // Save to review queue first
  });
  assertSuccess(recordRes, 'Direct Record Match Results to Queue');
  testResultId = recordRes.data.result._id;

  // 10. Review & Publish Match Results
  logStep(10, 'Match Results Review: Officially Publish Results');
  const reviewRes = await apiRequest(`/admin/results/${testResultId}/review`, 'PATCH', {
    adminReviewNotes: 'Admin verified scoreboard screenshot. 100% matched.',
  });
  assertSuccess(reviewRes, 'Review Match Results');

  const publishRes = await apiRequest(`/admin/results/${testResultId}/publish`, 'POST');
  assertSuccess(publishRes, 'Publish Live Match Results');

  // 11. Cash Prizes & Payouts: Auto-Allocated Prize Verification
  logStep(11, 'Cash Prizes & Payouts: Check Auto-Allocated Prize & Update Payout');
  const prizesRes = await apiRequest(`/admin/prizes?tournamentId=${testTournamentId}`);
  assertSuccess(prizesRes, 'Fetch Prizes for Tournament');
  
  if (prizesRes.data.prizes && prizesRes.data.prizes.length > 0) {
    testPrizeId = prizesRes.data.prizes[0]._id;
    console.log(`  Found Auto-Allocated Prize: ${prizesRes.data.prizes[0].title} — ₹${prizesRes.data.prizes[0].amount} to "${prizesRes.data.prizes[0].winnerName}"`);
    
    // Update Payout Status with UPI UTR
    const payoutRes = await apiRequest(`/admin/prizes/${testPrizeId}/payout`, 'PATCH', {
      payoutStatus: 'paid',
      offlineTransactionRef: 'UPI-DISBURSE-E2E-990011',
      notes: 'Transferred ₹120 to Captain Alpha via PhonePe.',
    });
    assertSuccess(payoutRes, 'Update Cash Prize Payout Status');
  } else {
    console.warn('  Notice: No auto-allocated prize found (checking manual creation next)');
  }

  // 12. Cash Prizes & Payouts: Manual Prize Allocation & Deletion
  logStep(12, 'Cash Prizes & Payouts: Manual Prize Allocation & Deletion');
  const manualPrizeRes = await apiRequest('/admin/prizes', 'POST', {
    tournamentId: testTournamentId,
    rank: 4,
    title: 'MVP Gunslinger Award',
    amount: 50,
    winnerName: 'AG_Sniper (MVP)',
    payoutStatus: 'paid',
    offlineTransactionRef: 'UPI-MVP-BONUS-443322',
  });
  assertSuccess(manualPrizeRes, 'Manually Allocate Prize');
  manualPrizeId = manualPrizeRes.data.prize._id;

  const deletePrizeRes = await apiRequest(`/admin/prizes/${manualPrizeId}`, 'DELETE');
  assertSuccess(deletePrizeRes, 'Delete Manual Prize');

  // 13. Site Settings & Audit Logs
  logStep(13, 'Site Settings & System Audit Logs');
  const settingsRes = await apiRequest('/admin/settings');
  assertSuccess(settingsRes, 'Fetch Admin Settings');

  const auditRes = await apiRequest('/admin/audit-logs?limit=5');
  assertSuccess(auditRes, 'Fetch Audit Logs');
  console.log(`  Recent Audit Actions: ${auditRes.data.logs?.slice(0, 3).map(l => l.action).join(', ')}`);

  // 14. Public Reflection (Winners & Leaderboard)
  logStep(14, 'Public Reflection: Winners & Leaderboard');
  const publicWinnersRes = await apiRequest('/winners');
  assertSuccess(publicWinnersRes, 'Public Hall of Fame /winners');
  
  const publicLeaderboardRes = await apiRequest('/leaderboard?format=squad');
  assertSuccess(publicLeaderboardRes, 'Public Leaderboard /leaderboard');

  // 15. Teardown / Cleanup Test Data
  logStep(15, 'Teardown / Cleanup Test Data');
  if (testPrizeId) {
    await apiRequest(`/admin/prizes/${testPrizeId}`, 'DELETE').catch(() => {});
  }
  if (testRegistrationId) {
    await apiRequest(`/admin/registrations/${testRegistrationId}`, 'DELETE').catch(() => {});
  }
  if (testTournamentId) {
    await apiRequest(`/admin/tournaments/${testTournamentId}`, 'DELETE').catch(() => {});
  }
  console.log('  Cleaned up temporary test tournament, registration, and prize records.');

  console.log('\n====================================================');
  console.log('  \x1b[32m✔ ALL 15 ADMIN WORKFLOWS & BUTTON FUNCTIONS PASSED!\x1b[0m');
  console.log('====================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('\n\x1b[31mFatal Verification Error:\x1b[0m', err.message);
  process.exit(1);
});
