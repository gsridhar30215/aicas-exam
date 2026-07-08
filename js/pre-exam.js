// ============================================================
// PRE-EXAM MODULE — render functions
// ------------------------------------------------------------
// Planning and preparation activities before the exam starts:
// Exam Creation, Eligibility, Registration, Timetable, Hall Ticket,
// Seating Plan and Invigilator Duty. Driven by the Exam Branch.
//
// These mirror the inline functions in demo/index.html so the standalone
// Pre-Exam pages and the main SPA stay in sync. They depend on `data`
// (data.js), the modal/toast helpers (core.js) and openAddSlotModal /
// publishTimetable (create-flows.js).
// ============================================================

// ============================================================
// EXAM CREATION
// ============================================================
// Catalog backing the form's dropdowns — several programs (each with their
// own branch list), academic years, semesters, regulations and exam types,
// so the form has real variety to demo instead of one fixed combination.
const examCreationCatalog = {
  academicYears: ['2024-25', '2025-26', '2026-27'],
  programs: [
    { name: 'B.E. Computer Engineering', branches: ['Computer Engineering', 'Information Technology'] },
    { name: 'B.E. Mechanical Engineering', branches: ['Mechanical Engineering', 'Automobile Engineering'] },
    { name: 'B.E. Electronics & Telecommunication', branches: ['Electronics & Telecommunication', 'Electronics & Computer Science'] },
    { name: 'B.E. Civil Engineering', branches: ['Civil Engineering'] },
  ],
  semesters: ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'],
  regulations: ['R-2020', 'R-2022', 'R-2024'],
  examTypes: ['Regular', 'Supplementary', 'Re-Exam', 'Backlog'],
};

// Mutable — "Create & Activate Exam" unshifts new records here so the Recent
// Exams table actually grows as exams are created, instead of staying static.
let recentExams = [
  { label: 'Sem IV Regular Apr 2026', program: 'B.E. Computer', sem: 'IV', type: 'Regular', mode: 'autonomous', status: 'Active', startDate: '10 Apr 2026', endDate: '20 Apr 2026', fee: 500 },
  { label: 'Sem VI Regular Apr 2026', program: 'B.E. Computer', sem: 'VI', type: 'Regular', mode: 'autonomous', status: 'Pre-Exam', startDate: '08 Apr 2026', endDate: '22 Apr 2026', fee: 500 },
  { label: 'Sem II Supplementary Jan 2026', program: 'B.E. Computer', sem: 'II', type: 'Supplementary', mode: 'affiliated', status: 'Closed', startDate: '12 Jan 2026', endDate: '20 Jan 2026', fee: 300 },
];

function getCurrentExamFee() {
  const exam = recentExams.find(e => e.label === currentExamLabel);
  return exam && exam.fee ? exam.fee : 0;
}

// Converts a native <input type="date"> value (YYYY-MM-DD) to the
// "DD Mon YYYY" display format already used across the timetable/exam data.
function formatExamDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function updateExamCreateBranches() {
  const programName = document.getElementById('examCreateProgram').value;
  const program = examCreationCatalog.programs.find(p => p.name === programName) || examCreationCatalog.programs[0];
  document.getElementById('examCreateBranch').innerHTML = program.branches.map(b => `<option>${b}</option>`).join('');
}

function createExam() {
  const year = document.getElementById('examCreateYear').value;
  const programName = document.getElementById('examCreateProgram').value;
  const semester = document.getElementById('examCreateSemester').value;
  const branch = document.getElementById('examCreateBranch').value;
  const regulation = document.getElementById('examCreateRegulation').value;
  const examType = document.getElementById('examCreateType').value;
  const startDateRaw = document.getElementById('examCreateStartDate').value;
  const endDateRaw = document.getElementById('examCreateEndDate').value;
  const feeRaw = document.getElementById('examCreateFee').value;
  if (!startDateRaw || !endDateRaw) {
    showToast('Please select both a start date and an end date');
    return;
  }
  if (endDateRaw < startDateRaw) {
    showToast('End date cannot be before the start date');
    return;
  }
  const fee = Number(feeRaw) || 0;
  const startDate = formatExamDate(startDateRaw);
  const endDate = formatExamDate(endDateRaw);
  const semShort = semester.replace('Semester ', '');
  const programShort = 'B.E. ' + programName.replace('B.E. ', '').split(' ')[0];
  const label = `Sem ${semShort} ${examType} ${year}`;
  recentExams.unshift({ label, program: programShort, sem: semShort, type: examType, mode: currentMode, status: 'Pre-Exam', startDate, endDate, fee });
  openExam(label);
  const m = modeInfo[currentMode];
  openModal('Exam Created Successfully', `
    <div class="text-center" style="padding:20px">
      <i class="fas fa-check-circle" style="font-size:48px;color:#059669"></i>
      <h3 style="margin-top:12px">Exam Created Successfully</h3>
      <p class="text-muted">${label} has been created for ${programName} (${branch}), ${regulation}, under ${m.label} mode, scheduled from ${startDate} to ${endDate} with a registration fee of ₹${fee}, and is ready for activation.</p>
    </div>
  `, `<button class="btn btn-primary" onclick="closeModal();showPage('eligibility')"><i class="fas fa-arrow-right"></i> Proceed to Eligibility</button>`);
  showPage('exam-creation');
  showToast('Exam created: ' + label);
}

// Clicking "Open"/"View" on any Recent Exams row shows a real info popup for
// that specific exam (program, semester, mode, status) with a CTA into the
// right next step, instead of silently jumping to another page with no
// feedback (Active/Pre-Exam) or only Closed rows getting a popup.
const examStatusInfo = {
  Active: { icon: 'fa-play-circle', color: 'var(--success)', text: 'This exam is currently active — the in-exam phase (attendance, answer sheet tracking) is underway.', cta: 'Go to Attendance', ctaIcon: 'fa-clipboard-check' },
  'Pre-Exam': { icon: 'fa-hourglass-half', color: 'var(--warning)', text: 'This exam has been created and is ready for the next Pre-Exam step: generating the eligible student list.', cta: 'Go to Eligibility', ctaIcon: 'fa-users' },
  Closed: { icon: 'fa-lock', color: 'var(--text-muted)', text: 'This exam cycle is closed. Result was declared and marks memos were issued to all students.', cta: 'View Result Summary', ctaIcon: 'fa-chart-bar' },
};

function openExamModal(examLabel) {
  const e = recentExams.find(x => x.label === examLabel);
  if (!e) return;
  const m = modeInfo[e.mode];
  const info = examStatusInfo[e.status] || examStatusInfo['Pre-Exam'];
  let action;
  if (e.status === 'Active') {
    action = `openExam('${e.label}'); goToPage('attendance','../in-exam/attendance.html')`;
  } else if (e.status === 'Closed') {
    action = `openExam('${e.label}'); goToPage('result-declaration','../post-exam/result-declaration.html')`;
  } else {
    action = `openExam('${e.label}'); showPage('eligibility')`;
  }
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas ${info.icon}" style="font-size:40px;color:${info.color}"></i>
      <p class="text-muted" style="margin-top:12px;line-height:1.5">${info.text}</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Program</td><td>${e.program}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Semester</td><td>${e.sem}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam Type</td><td>${e.type}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Control Mode</td><td>${m.label} — ${m.desc}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam Dates</td><td>${e.startDate} – ${e.endDate}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Registration Fee</td><td>₹${e.fee || 0}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Status</td><td>${e.status}</td></tr>
    </table>
  `;
  // Only a Pre-Exam-stage exam is safe to delete outright — nothing has
  // happened against it yet (no attendance, results, fees collected). Once
  // it's Active or Closed, real downstream data exists elsewhere in the app,
  // so deleting it here would leave that data orphaned.
  const deleteBtn = e.status === 'Pre-Exam'
    ? `<button class="btn btn-danger" style="margin-right:auto" onclick="closeModal();confirmDeleteExam('${e.label}')"><i class="fas fa-trash"></i> Delete Exam</button>`
    : '';
  const footer = `${deleteBtn}<button class="btn" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();${action}"><i class="fas ${info.ctaIcon}"></i> ${info.cta}</button>`;
  openModal(e.label, body, footer);
}

function confirmDeleteExam(examLabel) {
  const e = recentExams.find(x => x.label === examLabel);
  if (!e) return;
  const m = modeInfo[e.mode];
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-triangle-exclamation" style="font-size:40px;color:var(--danger)"></i>
      <p class="text-muted" style="margin-top:12px;line-height:1.5">This will permanently remove <strong>${examLabel}</strong> from Recent Exams. It's still in Pre-Exam stage — no attendance, results or fees have been recorded against it — but this action cannot be undone.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Program</td><td>${e.program}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Semester</td><td>${e.sem}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam Type</td><td>${e.type}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Control Mode</td><td>${m.label}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam Dates</td><td>${e.startDate} – ${e.endDate}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Registration Fee</td><td>₹${e.fee || 0}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Status</td><td><span class="badge badge-warning">${e.status}</span></td></tr>
    </table>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="closeModal();deleteExam('${examLabel}')"><i class="fas fa-trash"></i> Delete Permanently</button>`;
  openModal('Delete Exam', body, footer);
}

function deleteExam(examLabel) {
  recentExams = recentExams.filter(x => x.label !== examLabel);
  const fallbackLabel = recentExams[0] ? recentExams[0].label : null;
  if (currentExamLabel === examLabel) currentExamLabel = fallbackLabel;
  // Reports & Analytics keeps its own selected-exam state and cache —
  // only touch them if that module is actually loaded on this page.
  if (typeof selectedReportsExam !== 'undefined' && selectedReportsExam === examLabel) {
    selectedReportsExam = fallbackLabel;
  }
  if (typeof reportsExamsCache !== 'undefined') delete reportsExamsCache[examLabel];
  showPage('exam-creation');
  showToast(examLabel + ' deleted');
}

function renderExamCreation() {
  const yearOptions = examCreationCatalog.academicYears.map(y => `<option ${y === '2025-26' ? 'selected' : ''}>${y}</option>`).join('');
  const programOptions = examCreationCatalog.programs.map(p => `<option>${p.name}</option>`).join('');
  const semesterOptions = examCreationCatalog.semesters.map(s => `<option ${s === 'Semester IV' ? 'selected' : ''}>${s}</option>`).join('');
  const branchOptions = examCreationCatalog.programs[0].branches.map(b => `<option>${b}</option>`).join('');
  const regulationOptions = examCreationCatalog.regulations.map(r => `<option ${r === 'R-2022' ? 'selected' : ''}>${r}</option>`).join('');
  const examTypeOptions = examCreationCatalog.examTypes.map(t => `<option>${t}</option>`).join('');
  const statusBadgeClass = { Active: 'badge-success', 'Pre-Exam': 'badge-warning', Closed: 'badge-danger' };
  const examRows = recentExams.map(e => {
    const m = modeInfo[e.mode];
    const modeBadgeClass = e.mode === 'affiliated' ? 'badge-neutral' : 'badge-info';
    const actionLabel = e.status === 'Closed' ? 'View' : 'Open';
    const action = `<button class="btn btn-sm" onclick="openExamModal('${e.label}')">${actionLabel}</button>`;
    return `<tr><td>${e.label}</td><td>${e.program}</td><td>${e.sem}</td><td>${e.type}</td><td><span class="badge ${modeBadgeClass}">${m.label}</span></td><td>${e.startDate}</td><td>${e.endDate}</td><td><span class="badge ${statusBadgeClass[e.status]}">${e.status}</span></td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Create a new examination instance. Select academic details, exam type, and control mode.</div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-plus-circle"></i> Create New Exam</h3><button class="btn btn-primary btn-sm" onclick="return goToPage('dashboard','../index.html')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Academic Year</label><select class="form-control" id="examCreateYear">${yearOptions}</select></div>
            <div class="form-group"><label>Program</label><select class="form-control" id="examCreateProgram" onchange="updateExamCreateBranches()">${programOptions}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Semester / Year</label><select class="form-control" id="examCreateSemester">${semesterOptions}</select></div>
            <div class="form-group"><label>Branch</label><select class="form-control" id="examCreateBranch">${branchOptions}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Regulation</label><select class="form-control" id="examCreateRegulation">${regulationOptions}</select></div>
            <div class="form-group"><label>Exam Type</label><select class="form-control" id="examCreateType">${examTypeOptions}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Start Date</label><input type="date" class="form-control" id="examCreateStartDate"></div>
            <div class="form-group"><label>End Date</label><input type="date" class="form-control" id="examCreateEndDate"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Registration Fee (₹)</label><input type="number" class="form-control" id="examCreateFee" min="0" step="50" placeholder="e.g. 500" value="500"></div>
          </div>
          <div class="form-group"><label>Exam Control Mode</label></div>
          <div class="mode-selector">
            <div class="mode-card ${currentMode==='autonomous'?'selected':''}" onclick="selectMode(this,'autonomous')"><i class="fas fa-university"></i><h4>Autonomous</h4><p>Full exam cycle managed by college</p></div>
            <div class="mode-card ${currentMode==='affiliated'?'selected':''}" onclick="selectMode(this,'affiliated')"><i class="fas fa-building"></i><h4>Affiliated</h4><p>University-controlled exam process</p></div>
            <div class="mode-card ${currentMode==='hybrid'?'selected':''}" onclick="selectMode(this,'hybrid')"><i class="fas fa-handshake"></i><h4>Hybrid</h4><p>College + University combined</p></div>
          </div>
          <div class="flex-between mt-2">
            <span class="text-muted" style="font-size:13px">Selected: <strong id="modeDisplay">${modeInfo[currentMode].label}</strong> — ${modeInfo[currentMode].desc}</span>
            <button class="btn btn-primary btn-lg" onclick="createExam()"><i class="fas fa-check"></i> Create & Activate Exam</button>
          </div>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header"><h3><i class="fas fa-history"></i> Recent Exams</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Exam</th><th>Program</th><th>Sem</th><th>Type</th><th>Mode</th><th>Start Date</th><th>End Date</th><th>Status</th><th></th></tr>
              ${examRows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
function selectMode(el, mode) {
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  currentMode = mode;
  const m = modeInfo[mode];
  document.getElementById('modeDisplay').textContent = `${m.label} — ${m.desc}`;
  updateModeBadge();
}

// ============================================================
// ELIGIBILITY
// ============================================================
// Manual overrides keyed by student id (true = force eligible, false = force
// not eligible) — lets the Exam Branch correct a borderline case instead of
// eligibility being a frozen, uneditable computed value.
let eligibilityOverrides = {};
let eligibilityApproved = false;

// Per-exam student rosters, so switching the exam selector shows a genuinely
// different cohort instead of the same Sem IV list under a different label.
// The Sem VI / Sem II Supplementary cohorts reuse the same student
// identities already used on the Marks Memo page for those exams, so names
// stay consistent across the demo.
const eligibilityExams = {
  'Sem IV Regular Apr 2026': { get students() { return data.students; } },
  'Sem VI Regular Apr 2026': {
    students: [
      { id: 'S011', name: 'Neha Sharma', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 89, feeStatus: 'Paid' },
      { id: 'S012', name: 'Aditya Verma', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S013', name: 'Isha Patel', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 72, feeStatus: 'Paid' },
      { id: 'S014', name: 'Karan Singh', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 85, feeStatus: 'Pending' },
      { id: 'S015', name: 'Meera Iyer', program: 'B.E. Computer', sem: 'VI', status: 'Detained', attendance: 60, feeStatus: 'Paid' },
      { id: 'S016', name: 'Rohit Deshmukh', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 88, feeStatus: 'Paid' },
    ],
  },
  'Sem II Supplementary Jan 2026': {
    students: [
      { id: 'S017', name: 'Akash Tiwari', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 68, feeStatus: 'Pending' },
      { id: 'S018', name: 'Pooja Reddy', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 82, feeStatus: 'Paid' },
      { id: 'S019', name: 'Siddharth Nair', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S020', name: 'Tanvi Kulkarni', program: 'B.E. Computer', sem: 'II', status: 'Inactive', attendance: 84, feeStatus: 'Paid' },
    ],
  },
};

function getEligibilityExamConfig() {
  return eligibilityExams[currentExamLabel] || eligibilityExams['Sem IV Regular Apr 2026'];
}

function changeEligibilityExam(value) {
  currentExamLabel = value;
  eligibilityOverrides = {};
  eligibilityApproved = false;
  showPage('eligibility');
}

// Mirrors spec 3.2's four eligibility conditions: attendance shortage, fee
// pending, detained status, inactive student status.
function computeEligibility(s) {
  const reasons = [];
  if (s.status === 'Detained') reasons.push('Detained');
  if (s.attendance < 75) reasons.push(`Attendance ${s.attendance}% (below 75%)`);
  if (s.feeStatus === 'Pending') reasons.push('Fee pending');
  if (s.status === 'Inactive') reasons.push('Inactive student');
  return { eligible: reasons.length === 0, reasons };
}

function effectiveEligibility(s) {
  const computed = computeEligibility(s);
  const overridden = Object.prototype.hasOwnProperty.call(eligibilityOverrides, s.id);
  return { eligible: overridden ? eligibilityOverrides[s.id] : computed.eligible, reasons: computed.reasons, overridden };
}

function toggleEligibilityOverride(studentId, checked) {
  const s = getEligibilityExamConfig().students.find(st => st.id === studentId);
  if (!s) return;
  const computed = computeEligibility(s);
  if (checked === computed.eligible) {
    delete eligibilityOverrides[studentId];
  } else {
    eligibilityOverrides[studentId] = checked;
  }
  showPage('eligibility');
  showToast((checked ? s.name + ' marked Eligible' : s.name + ' marked Not Eligible') + ' (manual override)');
}

function regenerateEligibleList() {
  showActionModal('Regenerate Eligible List', 'This will re-check attendance, fee status, detained and inactive status for all students, and clear any manual overrides.', {
    icon: 'fa-sync', confirmLabel: 'Regenerate', confirmIcon: 'fa-sync',
    onConfirm: function () {
      eligibilityOverrides = {};
      eligibilityApproved = false;
      showPage('eligibility');
      showToast('Eligible list regenerated');
    }
  });
}

function approveEligibilityList() {
  const students = getEligibilityExamConfig().students;
  const eligibleCount = students.filter(s => effectiveEligibility(s).eligible).length;
  openModal('Approve Eligible List', `<p>${eligibleCount} of ${students.length} students are currently eligible for ${currentExamLabel}. Approve and lock this list? This will proceed to registration.</p>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="eligibilityApproved=true;closeModal();showPage('registration');"><i class="fas fa-check"></i> Approve & Proceed</button>`);
}

function downloadEligibilityReport(kind) {
  const students = getEligibilityExamConfig().students;
  const rows = students.map(s => {
    const { eligible, reasons, overridden } = effectiveEligibility(s);
    return `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.program}</td><td>${s.sem}</td><td>${s.status}</td><td>${eligible ? 'Eligible' : 'Not Eligible'}${overridden ? ' (manual override)' : ''}</td><td>${reasons.length ? reasons.join(', ') : '—'}</td></tr>`;
  }).join('');
  const eligibleCount = students.filter(s => effectiveEligibility(s).eligible).length;
  const title = kind === 'university' ? 'University Exam Form — Eligible Student List' : 'Eligible Student List';
  const content = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title} - ${currentExamLabel}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left;font-size:13px}th{background:#f1f5f9;font-weight:600}</style>
</head><body>
<h1>${title}</h1>
<p><strong>Exam:</strong> ${currentExamLabel}</p>
<p><strong>Total Students:</strong> ${students.length} &nbsp; <strong>Eligible:</strong> ${eligibleCount} &nbsp; <strong>Not Eligible:</strong> ${students.length - eligibleCount}</p>
<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
<table>
<tr><th>Student ID</th><th>Name</th><th>Program</th><th>Sem</th><th>Status</th><th>Eligibility</th><th>Reason(s)</th></tr>
${rows}
</table>
</body></html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Eligible_Student_List_${currentExamLabel.replace(/\s+/g, '_')}${kind === 'university' ? '_University' : ''}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast((kind === 'university' ? 'University exam form export' : 'Eligible list export') + ' downloaded');
}

function renderEligibility() {
  const students = getEligibilityExamConfig().students;
  const examOptions = Object.keys(eligibilityExams).map(key =>
    `<option value="${key}" ${key === currentExamLabel ? 'selected' : ''}>${key}</option>`
  ).join('');
  const rows = students.map(s => {
    const { eligible, reasons, overridden } = effectiveEligibility(s);
    const reasonNote = reasons.length ? `<div class="text-muted" style="font-size:11px">${reasons.join(', ')}</div>` : '';
    const overrideNote = overridden ? `<div class="text-muted" style="font-size:10px;font-style:italic">Manually overridden</div>` : '';
    const statusBadge = s.status === 'Active' ? 'badge-success' : s.status === 'Inactive' ? 'badge-neutral' : 'badge-danger';
    return `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.program}</td><td>${s.sem}</td><td><span class="badge ${statusBadge}">${s.status}</span></td><td><span class="badge ${eligible ? 'badge-success' : 'badge-danger'}">${eligible ? 'Eligible' : 'Not Eligible'}</span>${reasonNote}${overrideNote}</td><td><input type="checkbox" ${eligible ? 'checked' : ''} ${eligibilityApproved ? 'disabled' : ''} onchange="toggleEligibilityOverride('${s.id}', this.checked)"></td></tr>`;
  }).join('');
  const eligibleCount = students.filter(s => effectiveEligibility(s).eligible).length;
  const notEligibleCount = students.length - eligibleCount;
  const universityExportBtn = currentMode !== 'autonomous'
    ? `<button class="btn btn-sm" onclick="downloadEligibilityReport('university')"><i class="fas fa-file-export"></i> Export for University Exam Form</button>`
    : '';
  const approveControl = eligibilityApproved
    ? `<span class="badge badge-success" style="font-size:13px;padding:6px 12px"><i class="fas fa-check-circle"></i> Approved & Locked</span>`
    : `<button class="btn btn-primary btn-sm" onclick="approveEligibilityList()"><i class="fas fa-check"></i> Approve List</button>`;
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Generate list of eligible students for the selected examination. Eligibility is checked against attendance ≥ 75%, fee status, detained and inactive status.${currentMode !== 'autonomous' ? ' This list can also be exported for university exam form submission.' : ''}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeEligibilityExam(this.value)">${examOptions}</select>
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${eligibleCount} Eligible</span>
        <span class="chip"><i class="fas fa-times-circle" style="color:#dc2626"></i> ${notEligibleCount} Not Eligible</span>
        <span class="chip"><i class="fas fa-clock"></i> Attendance ≥ 75%</span>
        ${universityExportBtn}
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="regenerateEligibleList()" ${eligibilityApproved ? 'disabled title="List is approved and locked — regenerate is unavailable until re-opened"' : ''}><i class="fas fa-sync"></i> Regenerate</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-users"></i> Eligible Student List</h3><div class="flex gap-2"><button class="btn btn-sm" onclick="downloadEligibilityReport('standard')"><i class="fas fa-download"></i> Export</button>${approveControl}</div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student ID</th><th>Name</th><th>Program</th><th>Sem</th><th>Status</th><th>Eligibility</th><th>Select</th></tr>
              ${rows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// REGISTRATION
// ============================================================
// Which subjects each exam's students register for. Regular exams get the
// full subject list; the one Sem II Supplementary exam is backlog-only, so
// every student registers for just their failed subject(s) (spec 3.3:
// "backlog or supplementary exams ... select only the applicable failed
// subjects"). Vikram Singh (Sem IV) is kept as a backlog example within an
// otherwise-regular exam, matching the original demo's flavor.
const registrationSubjects = {
  'Sem IV Regular Apr 2026': {
    default: ['DS', 'DBMS', 'OS', 'CN', 'SE', 'Maths IV'],
    overrides: { S005: { subjects: ['DS', 'DBMS', 'CN', 'SE'], backlog: true } },
  },
  'Sem VI Regular Apr 2026': {
    default: ['ML', 'Cloud Computing', 'Big Data Analytics', 'IoT', 'Deep Learning', 'Blockchain'],
    overrides: {},
  },
  'Sem II Supplementary Jan 2026': {
    perStudentBacklog: { S017: ['Maths I'], S018: ['Physics'], S019: ['Chemistry'], S020: ['English'] },
  },
};

// Registration approval is tracked per exam+student so switching exams (or
// re-approving later) doesn't bleed state across exams. Defaults to Approved
// when fee is already paid, Pending when fee is outstanding — mirrors spec
// 3.3's "Check Fee Status" gate before approval.
let registrationApprovals = {};

// Per-exam fee payment status, keyed the same way as registrationApprovals.
// Defaults to the student's base feeStatus (from data.js) until they pay the
// registration fee for *this* exam, so paying is an explicit action tied to
// the exam's own fee (set on Exam Creation) rather than a global flag.
let registrationFeePayments = {};

function registrationKey(studentId, examLabel) {
  return (examLabel || currentExamLabel) + '|' + studentId;
}

// Registration eligibility is narrower than Eligibility-page eligibility: a
// student who is Detained, below the attendance threshold, or Inactive can't
// register at all, but "Fee pending" alone shouldn't block registration —
// per spec 3.3, fee is checked as its own separate gate on the *approval*,
// after the student has already registered. A manual override on the
// Eligibility page (either direction) is still honored outright.
function isRegistrationEligible(s) {
  const overridden = Object.prototype.hasOwnProperty.call(eligibilityOverrides, s.id);
  if (overridden) return eligibilityOverrides[s.id];
  const blockingReasons = computeEligibility(s).reasons.filter(r => r !== 'Fee pending');
  return blockingReasons.length === 0;
}

// Optional examLabel lets callers build another exam's roster without
// disturbing the globally "open" exam (e.g. a student's Hall Ticket history
// across every exam they've ever registered for, regardless of which exam
// is currently selected elsewhere in the app).
function getRegistrationRoster(examLabel) {
  examLabel = examLabel || currentExamLabel;
  const examConfig = eligibilityExams[examLabel] || eligibilityExams['Sem IV Regular Apr 2026'];
  const eligible = examConfig.students.filter(isRegistrationEligible);
  const cfg = registrationSubjects[examLabel] || registrationSubjects['Sem IV Regular Apr 2026'];
  return eligible.map(s => {
    let subjects, backlog;
    if (cfg.perStudentBacklog) {
      subjects = cfg.perStudentBacklog[s.id] || ['General'];
      backlog = true;
    } else {
      const override = cfg.overrides && cfg.overrides[s.id];
      subjects = override ? override.subjects : cfg.default;
      backlog = !!(override && override.backlog);
    }
    const key = registrationKey(s.id, examLabel);
    const feeStatus = Object.prototype.hasOwnProperty.call(registrationFeePayments, key)
      ? registrationFeePayments[key]
      : s.feeStatus;
    const approval = Object.prototype.hasOwnProperty.call(registrationApprovals, key)
      ? registrationApprovals[key]
      : (feeStatus === 'Paid' ? 'Approved' : 'Pending');
    return { id: s.id, name: s.name, program: s.program, sem: s.sem, subjects, backlog, feeStatus, approval };
  });
}

function payRegistrationFee(studentId) {
  const r = getRegistrationRoster().find(x => x.id === studentId);
  if (!r) return;
  registrationFeePayments[registrationKey(studentId)] = 'Paid';
  showPage('registration');
  showToast(`${r.name} paid the registration fee (₹${getCurrentExamFee()}) for ${currentExamLabel}`);
}

function changeRegistrationExam(value) {
  openExam(value);
  showPage('registration');
}

function approveOneRegistration(studentId) {
  const r = getRegistrationRoster().find(x => x.id === studentId);
  if (!r) return;
  registrationApprovals[registrationKey(studentId)] = 'Approved';
  showPage('registration');
  showToast('Registration approved for ' + r.name);
}

function rejectRegistration(studentId) {
  const r = getRegistrationRoster().find(x => x.id === studentId);
  if (!r) return;
  showActionModal('Reject Registration', `Reject ${r.name}'s registration for ${currentExamLabel}? They will not be issued a hall ticket unless this is reversed.`, {
    icon: 'fa-user-times', iconColor: 'var(--danger)', confirmLabel: 'Reject', confirmClass: 'btn-danger', confirmIcon: 'fa-user-times',
    onConfirm: function () {
      registrationApprovals[registrationKey(studentId)] = 'Rejected';
      showPage('registration');
      showToast('Registration rejected for ' + r.name);
    }
  });
}

function viewRegistrationStudent(studentId) {
  const r = getRegistrationRoster().find(x => x.id === studentId);
  if (!r) return;
  const canApprove = r.approval !== 'Approved';
  const canReject = r.approval !== 'Rejected';
  const feeBadge = r.feeStatus === 'Paid' ? 'badge-success' : 'badge-warning';
  const approvalBadgeClass = { Approved: 'badge-success', Pending: 'badge-warning', Rejected: 'badge-danger' }[r.approval];
  const icon = r.approval === 'Approved' ? 'fa-user-check' : r.approval === 'Rejected' ? 'fa-user-times' : 'fa-user-clock';
  const iconColor = r.approval === 'Approved' ? 'var(--success)' : r.approval === 'Rejected' ? 'var(--danger)' : 'var(--warning)';
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas ${icon}" style="font-size:40px;color:${iconColor}"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:160px">Student ID</td><td>${r.id}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Name</td><td>${r.name}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Program</td><td>${r.program}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Semester</td><td>${r.sem}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam</td><td>${currentExamLabel}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subjects Registered</td><td>${r.subjects.join(', ')}${r.backlog ? ' (Backlog)' : ''}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Registration Fee</td><td>₹${getCurrentExamFee()}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Fee Status</td><td><span class="badge ${feeBadge}">${r.feeStatus}</span></td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Approval</td><td><span class="badge ${approvalBadgeClass}">${r.approval}</span></td></tr>
    </table>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Close</button>${canReject ? `<button class="btn btn-danger" onclick="closeModal();rejectRegistration('${r.id}')"><i class="fas fa-user-times"></i> Reject</button>` : ''}${canApprove ? `<button class="btn btn-primary" onclick="closeModal();approveOneRegistration('${r.id}')"><i class="fas fa-check"></i> ${r.approval === 'Rejected' ? 'Approve' : 'Approve Anyway'}</button>` : ''}`;
  openModal(`${r.name} (${r.id})`, body, footer);
}

function finalApproveAllRegistrations() {
  const roster = getRegistrationRoster();
  const blockedByFee = roster.filter(r => r.feeStatus !== 'Paid' && r.approval !== 'Approved');
  const toApprove = roster.filter(r => r.feeStatus === 'Paid' && r.approval !== 'Approved');
  const message = toApprove.length
    ? `Approve registration for ${toApprove.length} student(s) with fees paid?${blockedByFee.length ? ` ${blockedByFee.length} student(s) with pending fees will remain on hold.` : ''}`
    : blockedByFee.length
      ? `All remaining student(s) (${blockedByFee.length}) have fee payments pending and cannot be approved yet.`
      : 'All students are already approved.';
  openModal('Final Approve All', `<p>${message}</p>`,
    toApprove.length
      ? `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();applyFinalApproveAll();"><i class="fas fa-check"></i> Approve ${toApprove.length}</button>`
      : `<button class="btn btn-primary" onclick="closeModal()">OK</button>`);
}

function applyFinalApproveAll() {
  const roster = getRegistrationRoster();
  let count = 0;
  roster.forEach(r => {
    if (r.feeStatus === 'Paid' && r.approval !== 'Approved') {
      registrationApprovals[registrationKey(r.id)] = 'Approved';
      count++;
    }
  });
  showPage('registration');
  showToast(count + ' student(s) approved for ' + currentExamLabel);
}

function importUniversityRegistrationList() {
  showActionModal('Import University List', 'Select the university-approved student list file to import — this maps every registered student to the university-confirmed approval status.', {
    icon: 'fa-file-import', confirmLabel: 'Choose File', confirmIcon: 'fa-upload',
    onConfirm: function () {
      const roster = getRegistrationRoster();
      roster.forEach(r => { registrationApprovals[registrationKey(r.id)] = 'Approved'; });
      showPage('registration');
      showToast('University-approved list imported — ' + roster.length + ' student(s) mapped and approved');
    }
  });
}

function downloadRegistrationReport() {
  const roster = getRegistrationRoster();
  const rows = roster.map(r =>
    `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.subjects.join(', ')}${r.backlog ? ' (Backlog)' : ''}</td><td>${r.feeStatus}</td><td>${r.approval}</td></tr>`
  ).join('');
  const approvedCount = roster.filter(r => r.approval === 'Approved').length;
  const content = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Exam Registration - ${currentExamLabel}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left;font-size:13px}th{background:#f1f5f9;font-weight:600}</style>
</head><body>
<h1>Exam Registration / Exam Form</h1>
<p><strong>Exam:</strong> ${currentExamLabel}</p>
<p><strong>Registered:</strong> ${roster.length} &nbsp; <strong>Approved:</strong> ${approvedCount} &nbsp; <strong>Pending:</strong> ${roster.length - approvedCount}</p>
<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
<table>
<tr><th>Student ID</th><th>Name</th><th>Subjects Registered</th><th>Fee Status</th><th>Approval</th></tr>
${rows}
</table>
</body></html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Exam_Registration_${currentExamLabel.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Exam registration export downloaded');
}

function renderRegistration() {
  const isAutonomous = currentMode === 'autonomous';
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAutonomous
    ? 'Autonomous mode: Confirm student subjects and approve registration directly in ERP.'
    : isAffiliated
      ? 'Affiliated mode: Export exam form data to the university and import the university-approved student list.'
      : 'Hybrid mode: Approve internal/practical subjects in ERP; export external subjects to the university.';
  const roster = getRegistrationRoster();
  const approvedCount = roster.filter(r => r.approval === 'Approved').length;
  const examFee = getCurrentExamFee();
  const examOptions = Object.keys(eligibilityExams).map(key =>
    `<option value="${key}" ${key === currentExamLabel ? 'selected' : ''}>${key}</option>`
  ).join('');
  const filterActions = !isAutonomous
    ? `<button class="btn btn-sm" onclick="downloadRegistrationReport()"><i class="fas fa-file-export"></i> Export to University</button>`
    : '';
  const headerButton = isAffiliated
    ? `<button class="btn btn-success btn-sm" onclick="importUniversityRegistrationList()"><i class="fas fa-file-import"></i> Import University List</button>`
    : `<button class="btn btn-success btn-sm" onclick="finalApproveAllRegistrations()"><i class="fas fa-check"></i> Final Approve All</button>`;
  const approvalBadge = { Approved: 'badge-success', Pending: 'badge-warning', Rejected: 'badge-danger' };
  const rows = roster.map(r => {
    const subjectText = `${r.subjects.join(', ')}${r.backlog ? ' (Backlog)' : ''}`;
    const payFeeBtn = r.feeStatus !== 'Paid'
      ? `<button class="btn btn-sm btn-success" onclick="payRegistrationFee('${r.id}')"><i class="fas fa-rupee-sign"></i> Pay Fee</button>`
      : '';
    return `<tr><td>${r.name} (${r.id})</td><td>${subjectText}</td><td><span class="badge ${r.feeStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${r.feeStatus}</span></td><td><span class="badge ${approvalBadge[r.approval]}">${r.approval}</span></td><td><div class="flex gap-2">${payFeeBtn}<button class="btn btn-sm btn-primary" onclick="viewRegistrationStudent('${r.id}')">View</button></div></td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeRegistrationExam(this.value)">${examOptions}</select>
        <span class="chip"><i class="fas fa-users"></i> ${roster.length} Registered</span>
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${approvedCount} Approved</span>
        <span class="chip"><i class="fas fa-rupee-sign"></i> Fee: ₹${examFee}</span>
        <div class="flex gap-2" style="margin-left:auto">${filterActions}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-file-signature"></i> Exam Registration / Exam Form</h3>${headerButton}</div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student</th><th>Subjects Registered</th><th>Fee Status</th><th>Approval</th><th></th></tr>
              ${rows || '<tr><td colspan="5" class="text-center text-muted" style="padding:20px">No eligible students to register for this exam.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// TIMETABLE
// ============================================================
// Each exam gets its own timetable and subject list, so switching the exam
// selector shows genuinely different scheduled subjects instead of Sem IV's
// CS401-CS406 slots regardless of which exam is selected. Sem IV keeps using
// the original `data.timetableSlots` array (same reference) since Seating,
// Invigilator and Hall Ticket already read from it directly.
const examTimetables = {
  'Sem IV Regular Apr 2026': data.timetableSlots,
  'Sem VI Regular Apr 2026': [
    { date: '08 Apr 2026', session: 'Morning', subject: 'Machine Learning', code: 'CS601', time: '10:00 - 13:00', duration: '3 hrs' },
    { date: '10 Apr 2026', session: 'Morning', subject: 'Cloud Computing', code: 'CS602', time: '10:00 - 13:00', duration: '3 hrs' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Big Data Analytics', code: 'CS603', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Internet of Things', code: 'CS604', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Deep Learning', code: 'CS605', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Blockchain Technology', code: 'CS606', time: '10:00 - 13:00', duration: '3 hrs' },
  ],
  'Sem II Supplementary Jan 2026': [
    { date: '12 Jan 2026', session: 'Morning', subject: 'Mathematics I', code: 'SUP101', time: '10:00 - 13:00', duration: '3 hrs' },
    { date: '14 Jan 2026', session: 'Morning', subject: 'Physics', code: 'SUP102', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '16 Jan 2026', session: 'Morning', subject: 'Chemistry', code: 'SUP103', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '18 Jan 2026', session: 'Afternoon', subject: 'English', code: 'SUP104', time: '14:00 - 16:00', duration: '2 hrs' },
  ],
};

// Subjects offered when adding a slot, matched to the exam being scheduled —
// falls back to the Sem IV master subject catalog (data.subjects) for any
// exam without its own list.
const examSubjectCatalog = {
  'Sem VI Regular Apr 2026': [
    { code: 'CS601', name: 'Machine Learning' },
    { code: 'CS602', name: 'Cloud Computing' },
    { code: 'CS603', name: 'Big Data Analytics' },
    { code: 'CS604', name: 'Internet of Things' },
    { code: 'CS605', name: 'Deep Learning' },
    { code: 'CS606', name: 'Blockchain Technology' },
  ],
  'Sem II Supplementary Jan 2026': [
    { code: 'SUP101', name: 'Mathematics I' },
    { code: 'SUP102', name: 'Physics' },
    { code: 'SUP103', name: 'Chemistry' },
    { code: 'SUP104', name: 'English' },
  ],
};

function getExamTimetableSlots(examLabel) {
  if (!examTimetables[examLabel]) examTimetables[examLabel] = [];
  return examTimetables[examLabel];
}

function getExamSubjects(examLabel) {
  return examSubjectCatalog[examLabel] || data.subjects;
}

function changeTimetableExam(value) {
  openExam(value);
  showPage('timetable');
}

const TIMETABLE_MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
// Slot dates are stored as "DD Mon YYYY" strings (not ISO), so this parses
// them directly rather than relying on the browser's lenient Date parsing.
function weekdayOf(displayDate) {
  const [day, mon, year] = displayDate.split(' ');
  if (!(mon in TIMETABLE_MONTHS)) return '';
  return new Date(Number(year), TIMETABLE_MONTHS[mon], Number(day)).toLocaleDateString('en-US', { weekday: 'short' });
}

const TIMETABLE_SESSION_STYLE = {
  Morning: { cls: 'badge-warning', icon: 'fa-sun' },
  Afternoon: { cls: 'badge-info', icon: 'fa-cloud-sun' },
};

function parseTimetableDate(displayDate) {
  const [day, mon, year] = displayDate.split(' ');
  if (!(mon in TIMETABLE_MONTHS)) return null;
  return new Date(Number(year), TIMETABLE_MONTHS[mon], Number(day));
}

// "09-20 Nov" (same month) or "28 Mar - 02 Apr" (spanning months) — computed
// from the actual min/max slot dates rather than assuming array order.
function formatExamWindow(slots) {
  const dates = slots.map(s => parseTimetableDate(s.date)).filter(Boolean);
  if (!dates.length) return '—';
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  const d1 = String(min.getDate()).padStart(2, '0');
  const d2 = String(max.getDate()).padStart(2, '0');
  const mon1 = min.toLocaleDateString('en-US', { month: 'short' });
  const mon2 = max.toLocaleDateString('en-US', { month: 'short' });
  return mon1 === mon2 ? `${d1}-${d2} ${mon2}` : `${d1} ${mon1} - ${d2} ${mon2}`;
}

// Real, data-driven checks (not canned copy): flags an actual double-booked
// session, a day that needs more rooms than the ERP has on file, and any
// slot whose duration falls outside the two credit-based durations this app
// ever schedules (2 hrs / 3 hrs).
function getTimetableValidation(slots) {
  const seenSlot = new Map();
  let overlap = null;
  slots.forEach(s => {
    const key = s.date + '|' + s.session;
    if (seenSlot.has(key)) overlap = { a: seenSlot.get(key), b: s };
    else seenSlot.set(key, s);
  });

  const roomCount = (typeof data !== 'undefined' && data.rooms) ? data.rooms.length : 0;
  const perDay = {};
  slots.forEach(s => { perDay[s.date] = (perDay[s.date] || 0) + 1; });
  const maxPerDay = Math.max(0, ...Object.values(perDay));
  const roomsOk = roomCount === 0 || maxPerDay <= roomCount;

  const allowedDurations = ['2 hrs', '3 hrs'];
  const badDuration = slots.find(s => !allowedDurations.includes(s.duration));

  return [
    {
      name: 'Subject overlap',
      detail: overlap
        ? `${overlap.a.subject} and ${overlap.b.subject} both scheduled ${overlap.a.date} (${overlap.a.session})`
        : 'No student has two papers in the same session',
      status: overlap ? 'Review' : 'Clear',
    },
    {
      name: 'Room availability',
      detail: roomCount
        ? `${roomCount} room(s) on file; up to ${maxPerDay} session(s) scheduled on the busiest day`
        : 'No room data available to check against',
      status: roomsOk ? 'Clear' : 'Review',
    },
    {
      name: 'Duration rules',
      detail: badDuration
        ? `${badDuration.subject} duration (${badDuration.duration}) is outside the credit-based 2-3 hr range`
        : 'Credit-based duration matches regulation (2-3 hrs)',
      status: badDuration ? 'Review' : 'Clear',
    },
  ];
}

function renderTimetable() {
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAffiliated
    ? 'Affiliated: Import or manually enter the university-released timetable.'
    : currentMode === 'hybrid'
      ? 'Hybrid: Create internal/practical timetable in ERP; import the university timetable for external subjects.'
      : 'Autonomous: Create the timetable directly in ERP and validate conflicts before publishing.';
  const slots = getExamTimetableSlots(currentExamLabel);
  const publishedCount = slots.filter(s => s.published !== false).length;
  const checks = getTimetableValidation(slots);
  const reviewChecks = checks.filter(c => c.status === 'Review');
  const examWindow = formatExamWindow(slots);
  const uniqueSessions = [...new Set(slots.map(s => s.session))];
  const sessionsSummary = slots.length
    ? `${uniqueSessions.join('/') || 'No'} session(s) for ${slots.length} theory paper${slots.length === 1 ? '' : 's'}`
    : 'No sessions scheduled yet';
  const flagsSummary = reviewChecks.length
    ? `${reviewChecks.map(c => c.name).join(', ')} — review before final publish`
    : 'All checks clear — ready to publish';
  const examOptions = Object.keys(eligibilityExams).map(key =>
    `<option value="${key}" ${key === currentExamLabel ? 'selected' : ''}>${key}</option>`
  ).join('');
  const createActions = !isAffiliated
    ? `<button class="btn btn-primary btn-sm" onclick="openAddSlotModal()"><i class="fas fa-plus"></i> Add Slot</button><button class="btn btn-sm" onclick="validateTimetableConflicts()"><i class="fas fa-check"></i> Validate Conflicts</button>`
    : '';
  const importAction = currentMode !== 'autonomous'
    ? `<button class="btn ${isAffiliated?'btn-primary':''} btn-sm" onclick="showActionModal('Import University Timetable','Select the university-released timetable file to import exam dates and sessions.', {icon:'fa-file-import', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-file-import"></i> Import University Timetable</button>`
    : '';
  const rows = slots.map(s => {
    const isPublished = s.published !== false;
    const session = TIMETABLE_SESSION_STYLE[s.session] || { cls: 'badge-neutral', icon: 'fa-clock' };
    return `<tr>
      <td style="border-left:3px solid ${isPublished ? 'var(--success)' : 'var(--warning)'};white-space:nowrap">
        <div style="font-weight:600">${s.date}</div>
        <div class="text-muted" style="font-size:11px">${weekdayOf(s.date)}</div>
      </td>
      <td><span class="badge ${session.cls}"><i class="fas ${session.icon}"></i> ${s.session}</span></td>
      <td>
        <div style="font-weight:600">${s.subject}</div>
        <div class="text-muted" style="font-size:11px;font-family:monospace">${s.code}</div>
      </td>
      <td><span class="badge badge-neutral"><i class="fas fa-clock"></i> ${s.time}</span></td>
      <td><span class="text-muted"><i class="fas fa-stopwatch"></i> ${s.duration}</span></td>
      <td><span class="badge ${isPublished ? 'badge-success' : 'badge-warning'}"><i class="fas ${isPublished ? 'fa-check-circle' : 'fa-hourglass-half'}"></i> ${isPublished ? 'Published' : 'Scheduled'}</span></td>
    </tr>`;
  }).join('');
  const checkRows = checks.map(c => `
    <div class="check-row">
      <div>
        <div class="check-name">${c.name}</div>
        <div class="check-detail">${c.detail}</div>
      </div>
      <span class="badge ${c.status === 'Clear' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
    </div>
  `).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fas fa-calendar-check icon"></i>
          <div class="label">Published Slots</div>
          <div class="value">${publishedCount}/${slots.length}</div>
          <div class="sub">Published slots drive hall ticket and seating outputs</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-clock icon"></i>
          <div class="label">Exam Window</div>
          <div class="value" style="font-size:22px">${examWindow}</div>
          <div class="sub">${sessionsSummary}</div>
        </div>
        <div class="stat-card ${reviewChecks.length ? 'stat-warning' : ''}">
          <i class="fas fa-triangle-exclamation icon"></i>
          <div class="label">Review Flags</div>
          <div class="value">${reviewChecks.length}</div>
          <div class="sub">${flagsSummary}</div>
        </div>
      </div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeTimetableExam(this.value)">${examOptions}</select>
        ${createActions}
        ${importAction}
        <button class="btn btn-success btn-sm" style="margin-left:auto" onclick="publishTimetable()"><i class="fas fa-check"></i> Publish Timetable</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-calendar-alt"></i> Exam Timetable</h3><span class="text-muted">${slots.length} subject(s) scheduled</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Date</th><th>Session</th><th>Subject</th><th>Time</th><th>Duration</th><th>Status</th></tr>
              ${rows || '<tr><td colspan="6" class="text-center text-muted" style="padding:20px">No slots scheduled yet for this exam.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
      <div class="card mt-4">
        <div class="card-header"><h3><i class="fas fa-shield-halved"></i> Validation Checks</h3></div>
        <div class="card-body">${checkRows}</div>
      </div>
    </div>
  `;
}

function validateTimetableConflicts() {
  const slots = getExamTimetableSlots(currentExamLabel);
  const checks = getTimetableValidation(slots);
  const failed = checks.filter(c => c.status === 'Review');
  if (failed.length === 0) {
    showActionModal('Validate Conflicts', `Checked all ${slots.length} scheduled subjects for date, room and duration conflicts — no conflicts found.`, {
      icon: 'fa-check-circle', iconColor: 'var(--success)', showCancel: false, confirmLabel: 'OK',
    });
  } else {
    showActionModal('Conflicts Found', failed.map(c => `${c.name}: ${c.detail}`).join(' '), {
      icon: 'fa-triangle-exclamation', iconColor: 'var(--warning)', showCancel: false, confirmLabel: 'OK',
    });
  }
}

// ============================================================
// HALL TICKET
// ============================================================
function downloadHallTicket(studentId, examLabel) {
  examLabel = examLabel || currentExamLabel;
  const s = getRegistrationRoster(examLabel).find(st => st.id === studentId);
  if (!s) return;
  const hallTicketNo = 'HT-' + studentId;
  const m = modeInfo[currentMode];
  const subjectRows = getExamTimetableSlots(examLabel).map(slot =>
    `<tr><td>${slot.code}</td><td>${slot.subject}</td><td>${slot.date}</td><td>${slot.session}</td><td>${slot.time}</td></tr>`
  ).join('');
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Hall Ticket - ${hallTicketNo}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 40px; color: #1e293b; }
  .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 22px; color: #2563eb; }
  .header h2 { margin: 4px 0; font-size: 16px; font-weight: 400; }
  .header p { margin: 2px 0; font-size: 13px; color: #64748b; }
  .title { text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
  .top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f1f5f9; font-weight: 600; }
  .photo-box { width: 100px; height: 120px; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; flex-shrink: 0; }
  .qr-placeholder { width: 90px; height: 90px; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; flex-shrink: 0; }
  .instructions { font-size: 12px; margin: 16px 0; padding-left: 18px; }
  .instructions li { margin-bottom: 4px; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
  .signature { display: flex; justify-content: space-between; margin-top: 32px; }
  .signature div { text-align: center; }
  .signature .line { width: 180px; border-top: 1px solid #1e293b; margin-top: 36px; padding-top: 6px; font-size: 12px; }
</style>
</head>
<body>
<div class="header">
  <h1>EXAMINATION ERP</h1>
  <h2>College of Engineering</h2>
  <p>${m.label} Mode — ${m.desc}</p>
</div>
<div class="title">Hall Ticket / Admit Card</div>
<div class="top-row">
  <table style="margin-bottom:0">
    <tr><td style="font-weight:600;width:160px">Hall Ticket No.</td><td>${hallTicketNo}</td></tr>
    <tr><td style="font-weight:600">Student Name</td><td>${s.name}</td></tr>
    <tr><td style="font-weight:600">Student ID</td><td>${s.id}</td></tr>
    <tr><td style="font-weight:600">Program</td><td>${s.program}</td></tr>
    <tr><td style="font-weight:600">Semester</td><td>${s.sem}</td></tr>
    <tr><td style="font-weight:600">Exam</td><td>${examLabel}</td></tr>
  </table>
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="photo-box">Photo</div>
    <div class="qr-placeholder">QR Code</div>
  </div>
</div>
<table>
  <tr><th>Code</th><th>Subject</th><th>Date</th><th>Session</th><th>Time</th></tr>
  ${subjectRows}
</table>
<div>
  <strong>Instructions to Candidates</strong>
  <ul class="instructions">
    <li>Candidates must carry this hall ticket and a valid photo ID to every exam session.</li>
    <li>Report to the allotted room at least 30 minutes before the exam start time.</li>
    <li>Electronic devices, including mobile phones, are strictly prohibited in the exam hall.</li>
    <li>Candidates without a valid hall ticket will not be permitted to appear for the exam.</li>
  </ul>
</div>
<div class="signature">
  <div><div class="line">Student Signature</div></div>
  <div><div class="line">Exam Branch</div></div>
  <div><div class="line">Principal</div></div>
</div>
<div class="footer">This is a computer-generated document. Generated on ${new Date().toLocaleDateString()} · ${hallTicketNo}</div>
</body>
</html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${hallTicketNo}_${s.name.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Hall ticket downloaded for ' + s.name);
}

function changeHallTicketExam(value) {
  openExam(value);
  showPage('hallticket');
}

function renderHallTicket() {
  const roster = getRegistrationRoster();
  // A logged-in student must only ever see their own hall ticket, never the
  // whole class roster — this page is shared with the Exam Branch view. The
  // student's table also isn't limited to whichever exam happens to be
  // selected in the dropdown: it lists every exam they've ever registered
  // for (their hall ticket history), so switching the selector to an exam
  // they're not part of doesn't hide tickets they already have elsewhere.
  const isStudent = typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.role === 'student';
  const myTickets = isStudent
    ? Object.keys(eligibilityExams)
        .map(examLabel => ({ examLabel, s: getRegistrationRoster(examLabel).find(x => x.id === CURRENT_STUDENT_ID) }))
        .filter(x => x.s)
    : [];
  // Past, already-completed semesters (defined in post-exam.js alongside
  // studentSemData) round out the history with earlier exams, since this
  // student is only ever "live-registered" for the one current exam above.
  const pastTickets = isStudent && typeof studentPastHallTickets !== 'undefined' ? studentPastHallTickets : [];
  const liveRows = isStudent
    ? myTickets.map(({ examLabel, s }) => `<tr><td>${s.id}</td><td>${s.name}</td><td>HT-${s.id}</td><td>${s.program}</td><td>${examLabel}</td><td><span class="badge badge-success">Generated</span></td><td><button class="btn btn-sm" onclick="downloadHallTicket('${s.id}','${examLabel}')"><i class="fas fa-download"></i> PDF</button></td></tr>`).join('')
    : roster.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>HT-${s.id}</td><td>${s.program}</td><td><span class="badge badge-success">Generated</span></td><td><button class="btn btn-sm" onclick="downloadHallTicket('${s.id}')"><i class="fas fa-download"></i> PDF</button></td></tr>`).join('');
  const pastRows = pastTickets.map(t => `<tr><td>${CURRENT_STUDENT_ID}</td><td>Aarav Sharma</td><td>${t.hallTicketNo}</td><td>B.E. Computer</td><td>${t.examLabel}</td><td><span class="badge badge-neutral">Closed</span></td><td><button class="btn btn-sm" onclick="downloadPastHallTicket('${t.examLabel}')"><i class="fas fa-download"></i> PDF</button></td></tr>`).join('');
  const rows = liveRows + pastRows;
  const visibleCount = isStudent ? myTickets.length + pastTickets.length : roster.length;
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAffiliated
    ? 'Affiliated: Import university hall ticket numbers or PDFs and map them to students.'
    : currentMode === 'hybrid'
      ? 'Hybrid: Generate hall tickets in ERP for internal subjects; import university hall ticket data for external subjects.'
      : 'Autonomous: Generate hall ticket numbers and PDFs directly in ERP. Supports QR/barcode.';
  // The exam selector doesn't affect the student's table at all (it always
  // lists every exam they've registered for, live or past), so it's only
  // shown for the Exam Branch view, where it still filters the roster.
  const examSelector = !isStudent
    ? `<select class="form-control" onchange="changeHallTicketExam(this.value)">${Object.keys(eligibilityExams).map(key =>
        `<option value="${key}" ${key === currentExamLabel ? 'selected' : ''}>${key}</option>`
      ).join('')}</select>`
    : '';
  const generateBtn = !isAffiliated && !isStudent
    ? `<button class="btn btn-primary btn-sm" onclick="showActionModal('Generate All Hall Tickets','Generate hall tickets for all ${roster.length} registered students of ${currentExamLabel}? This will create hall ticket numbers and PDFs.', {icon:'fa-magic', confirmLabel:'Generate All', confirmIcon:'fa-check'})"><i class="fas fa-magic"></i> Generate All</button>`
    : '';
  const importBtn = currentMode !== 'autonomous' && !isStudent
    ? `<button class="btn ${isAffiliated?'btn-primary':''} btn-sm" onclick="showActionModal('Import University Hall Tickets','Select the university-provided hall ticket file (PDFs or numbers) to import and map to students.', {icon:'fa-upload', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-upload"></i> Import University Hall Tickets</button>`
    : '';
  const publishBtn = !isStudent
    ? `<button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Publish to Portal','Hall tickets for all ${roster.length} students of ${currentExamLabel} are now published and downloadable from the student portal.', {icon:'fa-check-circle', iconColor:'var(--success)', showCancel:false, confirmLabel:'OK'})"><i class="fas fa-check"></i> Publish to Portal</button>`
    : '';
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${isStudent ? 'Download your hall ticket(s) below — every exam you have registered for, past and present. Carry it along with a valid photo ID to every exam session.' : modeAlert}</div>
      ${isStudent ? '' : `
      <div class="filter-bar">
        ${examSelector}
        ${generateBtn}
        ${importBtn}
        ${publishBtn}
      </div>`}
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-ticket-alt"></i> ${isStudent ? 'My Hall Tickets' : 'Hall Tickets'}</h3><span class="text-muted">Total: ${visibleCount}</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student ID</th><th>Name</th><th>Hall Ticket No.</th><th>Program</th>${isStudent ? '<th>Exam</th>' : ''}<th>Status</th><th></th></tr>
              ${rows || `<tr><td colspan="${isStudent ? 7 : 6}" class="text-center text-muted" style="padding:20px">${isStudent ? 'No hall tickets found for your account yet.' : 'No registered students for this exam yet.'}</td></tr>`}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// SEATING
// ============================================================
let selectedSeatingSlotIndex = 0;

function changeSeatingSlot(value) {
  selectedSeatingSlotIndex = Number(value);
  showPage('seating');
}

// Allocates a subject's appearing students (verifiedSheets, as a stand-in for
// registered/appearing count) across the ERP's room list in capacity order,
// so every exam date/session shows its own room-wise seating breakdown
// instead of one hardcoded table for every session.
function computeSeatingAllocation(subjectCode) {
  const subject = data.subjects.find(s => s.code === subjectCode) || data.subjects[0];
  let remaining = subject.verifiedSheets;
  let seatCursor = 1;
  const rows = data.rooms.map(r => {
    const allocated = Math.max(0, Math.min(r.capacity, remaining));
    remaining -= allocated;
    const start = seatCursor;
    const end = seatCursor + allocated - 1;
    if (allocated > 0) seatCursor += allocated;
    const available = r.capacity - allocated;
    const status = allocated === 0 ? 'Unused' : available === 0 ? 'Full' : 'Partial';
    const range = allocated > 0 ? `S${String(start).padStart(3, '0')} - S${String(end).padStart(3, '0')}` : '—';
    return { room: r.name, capacity: r.capacity, allocated, available, range, status };
  });
  const totalCapacity = data.rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalAllocated = rows.reduce((sum, r) => sum + r.allocated, 0);
  return { subject, rows, totalCapacity, totalAllocated, overflow: Math.max(0, remaining) };
}

function renderSeating() {
  const slots = data.timetableSlots;
  const idx = Math.min(selectedSeatingSlotIndex, slots.length - 1);
  const slot = slots[idx];
  const alloc = computeSeatingAllocation(slot.code);
  const slotOptions = slots.map((s, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${s.date} - ${s.session}</option>`).join('');
  const statusClass = { Full: 'badge-success', Partial: 'badge-warning', Unused: 'badge-neutral' };
  const rows = alloc.rows.map(r =>
    `<tr><td>${r.room}</td><td>${r.capacity}</td><td>${r.allocated}</td><td>${r.available}</td><td>${r.range}</td><td><span class="badge ${statusClass[r.status]}">${r.status}</span></td></tr>`
  ).join('');
  const overflowAlert = alloc.overflow > 0
    ? `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> ${alloc.overflow} student(s) could not be seated in the available rooms — allocate an additional room for this session.</div>`
    : '';
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Allocate rooms and seats for each exam date and session.</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeSeatingSlot(this.value)">${slotOptions}</select>
        <select class="form-control" disabled><option>${alloc.subject.name} (${alloc.subject.code})</option></select>
        <span class="chip"><i class="fas fa-user-graduate"></i> ${alloc.subject.verifiedSheets} Appearing</span>
        <button class="btn btn-primary btn-sm" onclick="showActionModal('Auto Allocate Seats','Automatically allocate seats for ${alloc.subject.verifiedSheets} appearing students (${slot.date} - ${slot.session}, ${alloc.subject.name}) across available rooms based on capacity.', {icon:'fa-magic', confirmLabel:'Allocate', confirmIcon:'fa-magic', onConfirm:()=>showPage('seating')})"><i class="fas fa-magic"></i> Auto Allocate</button>
        <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Export Seating Chart','The room-wise seating chart and student-wise seat numbers for ${slot.date} - ${slot.session} (${alloc.subject.name}) have been exported.', {icon:'fa-file-pdf', confirmLabel:'Download PDF', confirmIcon:'fa-download'})"><i class="fas fa-file-pdf"></i> Export Seating Chart</button>
      </div>
      ${overflowAlert}
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-chair"></i> Room Allocation — ${alloc.subject.name} (${slot.date} - ${slot.session})</h3><span class="text-muted">${alloc.totalAllocated} / ${alloc.totalCapacity} seats used</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Room</th><th>Capacity</th><th>Allocated</th><th>Available Seats</th><th>Students</th><th></th></tr>
              ${rows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// INVIGILATOR
// ============================================================
let selectedInvigilatorSlotIndex = 0;
// Keyed by exam-slot index, so each date/session keeps its own independent
// set of room assignments instead of one shared static table.
const invigilatorDuty = {};

function getInvigilatorAssignments(slotIndex) {
  if (!invigilatorDuty[slotIndex]) {
    const unassignedRoomIdx = data.rooms.length - 1;
    const pendingRoomIdx = data.rooms.length - 2;
    invigilatorDuty[slotIndex] = data.rooms.map((r, i) => {
      if (i === unassignedRoomIdx) {
        return { room: r.name, facultyId: null, status: 'Not Assigned' };
      }
      const faculty = data.faculty[(i + slotIndex) % data.faculty.length];
      return { room: r.name, facultyId: faculty.id, status: i === pendingRoomIdx ? 'Pending' : 'Confirmed' };
    });
  }
  return invigilatorDuty[slotIndex];
}

function findFaculty(facultyId) {
  return data.faculty.find(f => f.id === facultyId);
}

function changeInvigilatorSlot(value) {
  selectedInvigilatorSlotIndex = Number(value);
  showPage('invigilator');
}

function unassignInvigilator(slotIndex, room) {
  const assignments = getInvigilatorAssignments(slotIndex);
  const a = assignments.find(x => x.room === room);
  if (!a) return;
  const faculty = findFaculty(a.facultyId);
  showActionModal('Unassign Invigilator', `Remove ${faculty ? faculty.name : 'this invigilator'} from ${room} duty for this session?`, {
    icon: 'fa-user-minus', iconColor: 'var(--danger)', confirmLabel: 'Unassign', confirmClass: 'btn-danger', confirmIcon: 'fa-user-minus',
    onConfirm: function () {
      a.facultyId = null;
      a.status = 'Not Assigned';
      showPage('invigilator');
      showToast(room + ' is now unassigned');
    }
  });
}

function openAssignInvigilatorModal(slotIndex, prefilledRoom) {
  const assignments = getInvigilatorAssignments(slotIndex);
  const openRooms = assignments.filter(a => !a.facultyId);
  if (openRooms.length === 0) {
    showToast('All rooms for this session already have an invigilator assigned');
    return;
  }
  openFormModal('Assign Invigilator', `
    <div class="form-group"><label>Room</label>
      <select class="form-control" id="assignInvigilatorRoom">
        ${openRooms.map(a => `<option value="${a.room}" ${a.room === prefilledRoom ? 'selected' : ''}>${a.room}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Faculty</label>
      <select class="form-control" id="assignInvigilatorFaculty">
        ${data.faculty.map(f => `<option value="${f.id}">${f.name} (${f.id})</option>`).join('')}
      </select>
    </div>
  `, 'Assign', function () {
    const room = document.getElementById('assignInvigilatorRoom').value;
    const facultyId = document.getElementById('assignInvigilatorFaculty').value;
    const clash = assignments.find(a => a.facultyId === facultyId);
    if (clash) {
      closeModal();
      showToast(findFaculty(facultyId).name + ' is already assigned to ' + clash.room + ' for this session — choose a different faculty member');
      return;
    }
    const a = assignments.find(x => x.room === room);
    if (a) { a.facultyId = facultyId; a.status = 'Confirmed'; }
    closeModal();
    showPage('invigilator');
    showToast(findFaculty(facultyId).name + ' assigned to ' + room);
  });
}

function validateInvigilatorConflicts(slotIndex) {
  const assignments = getInvigilatorAssignments(slotIndex);
  const byFaculty = {};
  assignments.forEach(a => {
    if (!a.facultyId) return;
    (byFaculty[a.facultyId] = byFaculty[a.facultyId] || []).push(a.room);
  });
  const conflicts = Object.entries(byFaculty).filter(([, rooms]) => rooms.length > 1);
  if (conflicts.length === 0) {
    showActionModal('Validate Conflicts', 'Checked all invigilator assignments for this session — no faculty member is assigned to more than one room at the same time.', {
      icon: 'fa-check-circle', iconColor: 'var(--success)', showCancel: false, confirmLabel: 'OK'
    });
  } else {
    const msg = conflicts.map(([fid, rooms]) => `${findFaculty(fid).name} is assigned to ${rooms.join(' and ')}`).join('; ');
    showActionModal('Conflicts Found', msg + '. Reassign one of these rooms to a different faculty member.', {
      icon: 'fa-exclamation-triangle', iconColor: 'var(--danger)', showCancel: false, confirmLabel: 'OK'
    });
  }
}

function publishInvigilatorDutyChart(slotIndex, slotLabel) {
  const assignments = getInvigilatorAssignments(slotIndex);
  const pending = assignments.filter(a => a.status === 'Pending');
  const unassigned = assignments.filter(a => a.status === 'Not Assigned');
  if (unassigned.length > 0) {
    showActionModal('Cannot Publish', `${unassigned.length} room(s) still have no invigilator assigned. Assign all rooms before publishing the duty chart.`, {
      icon: 'fa-exclamation-triangle', iconColor: 'var(--warning)', showCancel: false, confirmLabel: 'OK'
    });
    return;
  }
  showActionModal('Publish Duty Chart', `The invigilator duty chart for ${slotLabel} has been published to all assigned faculty.`, {
    icon: 'fa-file-pdf', confirmLabel: 'Download PDF', confirmIcon: 'fa-download',
    onConfirm: function () {
      pending.forEach(a => { a.status = 'Confirmed'; });
      showPage('invigilator');
      showToast('Duty chart published for ' + slotLabel);
    }
  });
}

function renderInvigilator() {
  const slots = data.timetableSlots;
  const idx = Math.min(selectedInvigilatorSlotIndex, slots.length - 1);
  const slot = slots[idx];
  const slotLabel = `${slot.date} - ${slot.session}`;
  const assignments = getInvigilatorAssignments(idx);
  const slotOptions = slots.map((s, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${s.date} - ${s.session}</option>`).join('');
  const statusClass = { Confirmed: 'badge-success', Pending: 'badge-warning', 'Not Assigned': 'badge-danger' };

  // The Invigilator login is one shared generic account, not tied to a
  // specific faculty record, so F01 stands in as "you" here — enough to
  // demonstrate the view-only restriction without inventing a real identity
  // system. Exam Branch / Admin still get the full management view.
  const isInvigilatorRole = typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.role === 'invigilator';
  const myFacultyId = 'F01';

  const statusAccent = { Confirmed: 'var(--success)', Pending: 'var(--warning)', 'Not Assigned': 'var(--danger)' };
  const rows = assignments.map(a => {
    const faculty = findFaculty(a.facultyId);
    const isMine = isInvigilatorRole && a.facultyId === myFacultyId;
    const action = isInvigilatorRole
      ? (isMine ? `<span class="badge badge-info">You</span>` : '')
      : (a.facultyId
        ? `<button class="btn btn-sm btn-danger" onclick="unassignInvigilator(${idx}, '${a.room}')">Unassign</button>`
        : `<button class="btn btn-sm btn-primary" onclick="openAssignInvigilatorModal(${idx}, '${a.room}')">Assign</button>`);
    const initials = faculty ? faculty.name.replace(/^(Dr\.|Prof\.)\s*/, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';
    const invigilatorCell = faculty
      ? `<div class="flex-center"><div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initials}</div><span>${faculty.name}</span></div>`
      : `<span class="text-muted">— Unassigned —</span>`;
    const contactCell = faculty
      ? `<span class="badge badge-neutral"><i class="fas fa-id-badge"></i> ${faculty.id}</span>`
      : `<span class="text-muted">—</span>`;
    return `<tr${isMine ? ' style="background:var(--primary-light)"' : ''}>
      <td style="border-left:3px solid ${statusAccent[a.status]};font-weight:600">${a.room}</td>
      <td>${slot.subject}</td>
      <td>${invigilatorCell}</td>
      <td>${contactCell}</td>
      <td><span class="badge ${statusClass[a.status]}">${a.status}</span></td>
      <td>${action}</td>
    </tr>`;
  }).join('');
  const unassignedCount = assignments.filter(a => !a.facultyId).length;
  const pendingCount = assignments.filter(a => a.status === 'Pending').length;
  const confirmedCount = assignments.filter(a => a.status === 'Confirmed').length;
  const modeAlert = isInvigilatorRole
    ? 'View-only: this is the published duty chart for your session. Contact the Exam Branch for any reassignment.'
    : 'Assign faculty members to examination rooms. System checks for conflicts.';
  const actionButtons = isInvigilatorRole
    ? ''
    : `<button class="btn btn-primary btn-sm" onclick="openAssignInvigilatorModal(${idx})" ${unassignedCount ? '' : 'disabled title="All rooms already have an invigilator assigned"'}><i class="fas fa-plus"></i> Assign</button>
        <button class="btn btn-sm" style="margin-left:auto" onclick="validateInvigilatorConflicts(${idx})"><i class="fas fa-check"></i> Validate Conflicts</button>
        <button class="btn btn-sm" onclick="publishInvigilatorDutyChart(${idx}, '${slotLabel}')"><i class="fas fa-file-pdf"></i> Publish Duty Chart</button>`;
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeInvigilatorSlot(this.value)">${slotOptions}</select>
        <span class="chip"><i class="fas fa-book"></i> ${slot.subject}</span>
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${confirmedCount} Confirmed</span>
        ${pendingCount ? `<span class="chip"><i class="fas fa-clock" style="color:#d97706"></i> ${pendingCount} Pending</span>` : ''}
        ${unassignedCount ? `<span class="chip"><i class="fas fa-exclamation-circle" style="color:#dc2626"></i> ${unassignedCount} Unassigned</span>` : ''}
        ${actionButtons}
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-chalkboard-teacher"></i> Invigilator Duty Chart — ${slotLabel}</h3><span class="text-muted">${assignments.length - unassignedCount} / ${assignments.length} rooms assigned</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Room</th><th>Subject</th><th>Invigilator</th><th>Contact</th><th>Status</th><th></th></tr>
              ${rows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
