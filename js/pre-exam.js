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
// own branch list), academic years, semesters and exam types,
// so the form has real variety to demo instead of one fixed combination.
const examCreationCatalog = {
  academicYears: ['2024-25', '2025-26', '2026-27'],
  programs: [
    { name: 'B.E. Computer Engineering', code: 'COMP', branches: ['Computer Engineering', 'Information Technology', 'Computer Science & Engineering', 'Artificial Intelligence & Data Science', 'Artificial Intelligence & Machine Learning'] },
    { name: 'B.E. Mechanical Engineering', code: 'MECH', branches: ['Mechanical Engineering', 'Automobile Engineering', 'Production Engineering', 'Mechatronics Engineering'] },
    { name: 'B.E. Electronics & Telecommunication', code: 'EXTC', branches: ['Electronics & Telecommunication', 'Electronics & Computer Science', 'Electronics & Instrumentation', 'VLSI Design & Technology'] },
    { name: 'B.E. Civil Engineering', code: 'CIVIL', branches: ['Civil Engineering', 'Structural Engineering', 'Environmental Engineering'] },
    { name: 'B.E. Electrical Engineering', code: 'ELEC', branches: ['Electrical Engineering', 'Electrical & Electronics Engineering', 'Instrumentation & Control Engineering'] },
  ],
  semesters: ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'],
  examTypes: ['Regular Exam', 'Mid-Term Exam', 'Internal Exam', 'External Exam', 'Practical Exam', 'Supplementary Exam', 'Re-Exam', 'Backlog Exam'],
};

// Looks up a program's catalog code (e.g. 'B.E. Computer' -> 'COMP') from the
// same catalog backing the Exam Creation Program dropdown, so every table
// that shows a student/exam's short program name can show its code too
// without keeping a second hardcoded list in sync.
function getProgramCode(programShort) {
  const program = examCreationCatalog.programs.find(p => 'B.E. ' + p.name.replace('B.E. ', '').split(' ')[0] === programShort);
  return program ? program.code : '';
}

// Full Program/Sem choice lists for filter dropdowns — drawn from the whole
// catalog (not just whichever program/sem happens to be in the currently
// selected exam's roster), so the filter always offers every program and
// semester the college runs, even on an exam whose roster is all one cohort.
function getAllProgramShortNames() {
  return examCreationCatalog.programs.map(p => 'B.E. ' + p.name.replace('B.E. ', '').split(' ')[0]);
}
function getAllSemesterCodes() {
  return examCreationCatalog.semesters.map(s => s.replace('Semester ', ''));
}

// Mutable — "Create & Activate Exam" unshifts new records here so the Recent
// Exams table actually grows as exams are created, instead of staying static.
let recentExams = [
  { label: 'Sem IV Regular Apr 2026', program: 'B.E. Computer', programCode: 'COMP', sem: 'IV', type: 'Regular', mode: 'autonomous', status: 'Active', startDate: '10 Apr 2026', endDate: '20 Apr 2026', fee: 500 },
  { label: 'Sem VI Regular Apr 2026', program: 'B.E. Computer', programCode: 'COMP', sem: 'VI', type: 'Regular', mode: 'autonomous', status: 'Pre-Exam', startDate: '08 Apr 2026', endDate: '22 Apr 2026', fee: 500 },
  { label: 'Sem II Supplementary Jan 2026', program: 'B.E. Computer', programCode: 'COMP', sem: 'II', type: 'Supplementary', mode: 'affiliated', status: 'Closed', startDate: '12 Jan 2026', endDate: '20 Jan 2026', fee: 300 },
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
  document.getElementById('examCreateProgramCode').textContent = program.code;
}

function createExam() {
  const year = document.getElementById('examCreateYear').value;
  const programName = document.getElementById('examCreateProgram').value;
  const programCode = document.getElementById('examCreateProgramCode').textContent;
  const semester = document.getElementById('examCreateSemester').value;
  const branch = document.getElementById('examCreateBranch').value;
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
  recentExams.unshift({ label, program: programShort, programCode, sem: semShort, type: examType, mode: currentMode, status: 'Pre-Exam', startDate, endDate, fee });
  openExam(label);
  const m = modeInfo[currentMode];
  openModal('Exam Created Successfully', `
    <div class="text-center" style="padding:20px">
      <i class="fas fa-check-circle" style="font-size:48px;color:#059669"></i>
      <h3 style="margin-top:12px">Exam Created Successfully</h3>
      <p class="text-muted">${label} has been created for ${programName} [${programCode}] (${branch}), under ${m.label} mode, scheduled from ${startDate} to ${endDate} with a registration fee of ₹${fee}, and is ready for activation.</p>
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
      <tr><td style="font-weight:600;padding:6px 0">Program Code</td><td>${e.programCode || '—'}</td></tr>
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
      <tr><td style="font-weight:600;padding:6px 0">Program Code</td><td>${e.programCode || '—'}</td></tr>
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
  const examTypeOptions = examCreationCatalog.examTypes.map(t => `<option>${t}</option>`).join('');
  const statusBadgeClass = { Active: 'badge-success', 'Pre-Exam': 'badge-warning', Closed: 'badge-danger' };
  const examRows = recentExams.map(e => {
    const m = modeInfo[e.mode];
    const modeBadgeClass = e.mode === 'affiliated' ? 'badge-neutral' : 'badge-info';
    const actionLabel = e.status === 'Closed' ? 'View' : 'Open';
    const action = `<button class="btn btn-sm" onclick="openExamModal('${e.label}')">${actionLabel}</button>`;
    return `<tr><td>${e.label}</td><td>${e.program}</td><td>${e.programCode || '—'}</td><td>${e.sem}</td><td>${e.type}</td><td><span class="badge ${modeBadgeClass}">${m.label}</span></td><td>${e.startDate}</td><td>${e.endDate}</td><td><span class="badge ${statusBadgeClass[e.status]}">${e.status}</span></td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Create a new examination instance. Select academic details, exam type, and control mode.</div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-plus-circle"></i> Create New Exam</h3><button class="btn btn-primary btn-sm" onclick="return goToPage('dashboard','../index.html')"><i class="fas fa-arrow-left"></i> Back</button></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Academic Year</label><select class="form-control" id="examCreateYear">${yearOptions}</select></div>
            <div class="form-group"><label>Program</label><select class="form-control" id="examCreateProgram" onchange="updateExamCreateBranches()">${programOptions}</select><div class="hint">Program Code: <span id="examCreateProgramCode">${examCreationCatalog.programs[0].code}</span></div></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Semester / Year</label><select class="form-control" id="examCreateSemester">${semesterOptions}</select></div>
            <div class="form-group"><label>Branch</label><select class="form-control" id="examCreateBranch">${branchOptions}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Exam Type</label><select class="form-control" id="examCreateType">${examTypeOptions}</select></div>
            <div class="form-group"><label>Start Date</label><input type="date" class="form-control" id="examCreateStartDate"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>End Date</label><input type="date" class="form-control" id="examCreateEndDate"></div>
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
        <div class="card-header"><h3><i class="fas fa-history"></i> Recent Exams</h3><input type="text" class="form-control" style="max-width:200px" placeholder="Search exams..." oninput="liveSearchTable(this)"></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Exam</th><th>Program</th><th>Program Code</th><th>Sem</th><th>Type</th><th>Mode</th><th>Start Date</th><th>End Date</th><th>Status</th><th></th></tr>
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
  'Sem IV Regular Apr 2026': {
    // data.students (the 12 Post-Exam-tracked B.E. Computer students) plus
    // other-program students, so this exam's Program filter has real variety
    // too — each program below has both an eligible and a not-eligible
    // example. Post-Exam (Marks Entry, D-Form, Result Processing, Analytics,
    // Marks Memo) reads from the separate, independently fixed
    // data.examResults['Sem IV Regular Apr 2026'] rather than this roster, so
    // these extra students showing up as newly registered (with no marks yet
    // entered — same as any real student mid-cycle) doesn't touch it.
    students: [
      ...data.students,
      { id: 'S031', name: 'Devika Rane', program: 'B.E. Mechanical', sem: 'IV', status: 'Detained', attendance: 55, feeStatus: 'Paid' },
      { id: 'S032', name: 'Yusuf Khan', program: 'B.E. Electronics', sem: 'IV', status: 'Active', attendance: 68, feeStatus: 'Paid' },
      { id: 'S033', name: 'Priyansh Joshi', program: 'B.E. Civil', sem: 'IV', status: 'Inactive', attendance: 80, feeStatus: 'Paid' },
      { id: 'S034', name: 'Alia Fernandes', program: 'B.E. Electrical', sem: 'IV', status: 'Active', attendance: 60, feeStatus: 'Pending' },
      { id: 'S043', name: 'Naveen Kumar', program: 'B.E. Mechanical', sem: 'IV', status: 'Active', attendance: 85, feeStatus: 'Paid' },
      { id: 'S044', name: 'Ishita Chawla', program: 'B.E. Electronics', sem: 'IV', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S045', name: 'Vivek Nambiar', program: 'B.E. Civil', sem: 'IV', status: 'Active', attendance: 78, feeStatus: 'Paid' },
      { id: 'S046', name: 'Pallavi Saxena', program: 'B.E. Electrical', sem: 'IV', status: 'Active', attendance: 82, feeStatus: 'Paid' },
      // Four more eligible students per non-Computer program, so every
      // program has at least 5 registered students to show on Registration/
      // Hall Ticket once filtered — not just the one eligible example above.
      { id: 'S047', name: 'Kunal Bhosale', program: 'B.E. Mechanical', sem: 'IV', status: 'Active', attendance: 85, feeStatus: 'Paid' },
      { id: 'S048', name: 'Trisha Kulkarni', program: 'B.E. Mechanical', sem: 'IV', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S049', name: 'Rohan Ghosh', program: 'B.E. Mechanical', sem: 'IV', status: 'Active', attendance: 78, feeStatus: 'Paid' },
      { id: 'S050', name: 'Meera Desai', program: 'B.E. Mechanical', sem: 'IV', status: 'Active', attendance: 88, feeStatus: 'Paid' },
      { id: 'S051', name: 'Aarti Iyer', program: 'B.E. Electronics', sem: 'IV', status: 'Active', attendance: 82, feeStatus: 'Paid' },
      { id: 'S052', name: 'Siddharth Rao', program: 'B.E. Electronics', sem: 'IV', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S053', name: 'Neha Joshi', program: 'B.E. Electronics', sem: 'IV', status: 'Active', attendance: 76, feeStatus: 'Paid' },
      { id: 'S054', name: 'Vivaan Shah', program: 'B.E. Electronics', sem: 'IV', status: 'Active', attendance: 89, feeStatus: 'Paid' },
      { id: 'S055', name: 'Ananya Bhatt', program: 'B.E. Civil', sem: 'IV', status: 'Active', attendance: 84, feeStatus: 'Paid' },
      { id: 'S056', name: 'Rajesh Kumar', program: 'B.E. Civil', sem: 'IV', status: 'Active', attendance: 93, feeStatus: 'Paid' },
      { id: 'S057', name: 'Sneha Patil', program: 'B.E. Civil', sem: 'IV', status: 'Active', attendance: 80, feeStatus: 'Paid' },
      { id: 'S058', name: 'Arjun Menon', program: 'B.E. Civil', sem: 'IV', status: 'Active', attendance: 87, feeStatus: 'Paid' },
      { id: 'S059', name: 'Priya Nair', program: 'B.E. Electrical', sem: 'IV', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S060', name: 'Karthik Reddy', program: 'B.E. Electrical', sem: 'IV', status: 'Active', attendance: 79, feeStatus: 'Paid' },
      { id: 'S061', name: 'Divya Sharma', program: 'B.E. Electrical', sem: 'IV', status: 'Active', attendance: 86, feeStatus: 'Paid' },
      { id: 'S062', name: 'Manish Gupta', program: 'B.E. Electrical', sem: 'IV', status: 'Active', attendance: 92, feeStatus: 'Paid' },
      // A couple of students per other semester (I, II, III, V-VIII), spread
      // across programs, so the Sem filter also has real matches beyond IV —
      // same reasoning as the Program filter additions above.
      { id: 'S063', name: 'Yash Kulkarni', program: 'B.E. Computer', sem: 'I', status: 'Active', attendance: 88, feeStatus: 'Paid' },
      { id: 'S064', name: 'Rutuja More', program: 'B.E. Mechanical', sem: 'I', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S065', name: 'Aditi Verma', program: 'B.E. Electronics', sem: 'II', status: 'Active', attendance: 84, feeStatus: 'Paid' },
      { id: 'S066', name: 'Harshad Pawar', program: 'B.E. Civil', sem: 'II', status: 'Active', attendance: 79, feeStatus: 'Paid' },
      { id: 'S067', name: 'Sanika Joshi', program: 'B.E. Electrical', sem: 'III', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S068', name: 'Tanmay Deshpande', program: 'B.E. Computer', sem: 'III', status: 'Active', attendance: 85, feeStatus: 'Paid' },
      { id: 'S069', name: 'Radhika Shetty', program: 'B.E. Mechanical', sem: 'V', status: 'Active', attendance: 92, feeStatus: 'Paid' },
      { id: 'S070', name: 'Omkar Naik', program: 'B.E. Electronics', sem: 'V', status: 'Active', attendance: 77, feeStatus: 'Paid' },
      { id: 'S071', name: 'Pooja Kadam', program: 'B.E. Civil', sem: 'VI', status: 'Active', attendance: 89, feeStatus: 'Paid' },
      { id: 'S072', name: 'Abhishek Rane', program: 'B.E. Electrical', sem: 'VI', status: 'Active', attendance: 83, feeStatus: 'Paid' },
      { id: 'S073', name: 'Nikita Salvi', program: 'B.E. Computer', sem: 'VII', status: 'Active', attendance: 95, feeStatus: 'Paid' },
      { id: 'S074', name: 'Girish Thakur', program: 'B.E. Mechanical', sem: 'VII', status: 'Active', attendance: 81, feeStatus: 'Paid' },
      { id: 'S075', name: 'Shruti Kamble', program: 'B.E. Electronics', sem: 'VIII', status: 'Active', attendance: 87, feeStatus: 'Paid' },
      { id: 'S076', name: 'Devendra Pillai', program: 'B.E. Civil', sem: 'VIII', status: 'Active', attendance: 93, feeStatus: 'Paid' },
      // Fills every remaining gap in the Program x Semester grid (5 programs
      // x 8 semesters) so no combination on the filter returns zero results.
      { id: 'S077', name: 'Kiran Bedi', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 86, feeStatus: 'Paid' },
      { id: 'S078', name: 'Rachit Malhotra', program: 'B.E. Computer', sem: 'V', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S079', name: 'Sonal Agarwal', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 82, feeStatus: 'Paid' },
      { id: 'S080', name: 'Vikas Chandra', program: 'B.E. Computer', sem: 'VIII', status: 'Active', attendance: 94, feeStatus: 'Paid' },
      { id: 'S081', name: 'Anjali Deshmukh', program: 'B.E. Mechanical', sem: 'II', status: 'Active', attendance: 88, feeStatus: 'Paid' },
      { id: 'S082', name: 'Suresh Pillai', program: 'B.E. Mechanical', sem: 'III', status: 'Active', attendance: 80, feeStatus: 'Paid' },
      { id: 'S083', name: 'Kavya Reddy', program: 'B.E. Mechanical', sem: 'VI', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S084', name: 'Rohit Bhatia', program: 'B.E. Mechanical', sem: 'VIII', status: 'Active', attendance: 78, feeStatus: 'Paid' },
      { id: 'S085', name: 'Neelam Choudhary', program: 'B.E. Electronics', sem: 'I', status: 'Active', attendance: 85, feeStatus: 'Paid' },
      { id: 'S086', name: 'Aakash Trivedi', program: 'B.E. Electronics', sem: 'III', status: 'Active', attendance: 92, feeStatus: 'Paid' },
      { id: 'S087', name: 'Bhavna Iyer', program: 'B.E. Electronics', sem: 'VI', status: 'Active', attendance: 79, feeStatus: 'Paid' },
      { id: 'S088', name: 'Yogesh Kulkarni', program: 'B.E. Electronics', sem: 'VII', status: 'Active', attendance: 87, feeStatus: 'Paid' },
      { id: 'S089', name: 'Meenal Sawant', program: 'B.E. Civil', sem: 'I', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S090', name: 'Prakash Yadav', program: 'B.E. Civil', sem: 'III', status: 'Active', attendance: 83, feeStatus: 'Paid' },
      { id: 'S091', name: 'Ishaan Kapoor', program: 'B.E. Civil', sem: 'V', status: 'Active', attendance: 88, feeStatus: 'Paid' },
      { id: 'S092', name: 'Ritu Malviya', program: 'B.E. Civil', sem: 'VII', status: 'Active', attendance: 95, feeStatus: 'Paid' },
      { id: 'S093', name: 'Sameer Qureshi', program: 'B.E. Electrical', sem: 'I', status: 'Active', attendance: 84, feeStatus: 'Paid' },
      { id: 'S094', name: 'Deepika Chauhan', program: 'B.E. Electrical', sem: 'II', status: 'Active', attendance: 89, feeStatus: 'Paid' },
      { id: 'S095', name: 'Nakul Bansal', program: 'B.E. Electrical', sem: 'V', status: 'Active', attendance: 81, feeStatus: 'Paid' },
      { id: 'S096', name: 'Tanya Sood', program: 'B.E. Electrical', sem: 'VII', status: 'Active', attendance: 93, feeStatus: 'Paid' },
      { id: 'S097', name: 'Vikram Solanki', program: 'B.E. Electrical', sem: 'VIII', status: 'Active', attendance: 77, feeStatus: 'Paid' },
    ],
  },
  'Sem VI Regular Apr 2026': {
    students: [
      { id: 'S011', name: 'Neha Sharma', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 89, feeStatus: 'Paid' },
      { id: 'S012', name: 'Aditya Verma', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S013', name: 'Isha Patel', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 72, feeStatus: 'Paid' },
      { id: 'S014', name: 'Karan Singh', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 85, feeStatus: 'Pending' },
      { id: 'S015', name: 'Meera Iyer', program: 'B.E. Computer', sem: 'VI', status: 'Detained', attendance: 60, feeStatus: 'Paid' },
      { id: 'S016', name: 'Rohit Deshmukh', program: 'B.E. Computer', sem: 'VI', status: 'Active', attendance: 88, feeStatus: 'Paid' },
      { id: 'S027', name: 'Farhan Sheikh', program: 'B.E. Mechanical', sem: 'VI', status: 'Active', attendance: 90, feeStatus: 'Paid' },
      { id: 'S028', name: 'Ritika Bansal', program: 'B.E. Electronics', sem: 'VI', status: 'Active', attendance: 70, feeStatus: 'Paid' },
      { id: 'S029', name: 'Manoj Pillai', program: 'B.E. Civil', sem: 'VI', status: 'Active', attendance: 84, feeStatus: 'Pending' },
      { id: 'S030', name: 'Sneha Kulkarni', program: 'B.E. Electrical', sem: 'VI', status: 'Detained', attendance: 66, feeStatus: 'Paid' },
      { id: 'S035', name: 'Ananya Rao', program: 'B.E. Mechanical', sem: 'VI', status: 'Active', attendance: 65, feeStatus: 'Paid' },
      { id: 'S036', name: 'Rahul Kapoor', program: 'B.E. Electronics', sem: 'VI', status: 'Active', attendance: 82, feeStatus: 'Paid' },
      { id: 'S037', name: 'Divya Shah', program: 'B.E. Civil', sem: 'VI', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S038', name: 'Aman Trivedi', program: 'B.E. Electrical', sem: 'VI', status: 'Active', attendance: 77, feeStatus: 'Paid' },
    ],
  },
  'Sem II Supplementary Jan 2026': {
    // These four extra students are deliberately Not Eligible (Detained /
    // attendance / Inactive) for the same reason as Sem IV's: this exam is
    // Closed with real Post-Exam results already tied to S017-S020, so any
    // new student that reached Registration would show up in Post-Exam with
    // no result data. Keeping them ineligible confines them to this
    // Eligibility list, where they still exercise the Program filter.
    students: [
      { id: 'S017', name: 'Akash Tiwari', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 68, feeStatus: 'Pending' },
      { id: 'S018', name: 'Pooja Reddy', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 82, feeStatus: 'Paid' },
      { id: 'S019', name: 'Siddharth Nair', program: 'B.E. Computer', sem: 'II', status: 'Active', attendance: 91, feeStatus: 'Paid' },
      { id: 'S020', name: 'Tanvi Kulkarni', program: 'B.E. Computer', sem: 'II', status: 'Inactive', attendance: 84, feeStatus: 'Paid' },
      { id: 'S039', name: 'Karthik Menon', program: 'B.E. Mechanical', sem: 'II', status: 'Active', attendance: 65, feeStatus: 'Paid' },
      { id: 'S040', name: 'Neha Bhatt', program: 'B.E. Electronics', sem: 'II', status: 'Detained', attendance: 70, feeStatus: 'Paid' },
      { id: 'S041', name: 'Om Prakash', program: 'B.E. Civil', sem: 'II', status: 'Inactive', attendance: 85, feeStatus: 'Paid' },
      { id: 'S042', name: 'Zara Sheikh', program: 'B.E. Electrical', sem: 'II', status: 'Active', attendance: 55, feeStatus: 'Pending' },
    ],
  },
};

function getEligibilityExamConfig() {
  return eligibilityExams[currentExamLabel] || eligibilityExams['Sem IV Regular Apr 2026'];
}

// Which Program/Sem the Eligible Student List table is currently narrowed to
// ('' = all) — separate from the exam selector so the same exam's roster can
// still be sliced by program/sem once it ever spans more than one of each.
let eligibilityProgramFilter = '';
let eligibilitySemFilter = '';

function changeEligibilityExam(value) {
  currentExamLabel = value;
  eligibilityOverrides = {};
  eligibilityApproved = false;
  eligibilityProgramFilter = '';
  eligibilitySemFilter = '';
  showPage('eligibility');
}

function filterEligibilityProgram(value) {
  eligibilityProgramFilter = value;
  showPage('eligibility');
}

function filterEligibilitySem(value) {
  eligibilitySemFilter = value;
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
    return `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.program}</td><td>${getProgramCode(s.program) || '—'}</td><td>${s.sem}</td><td>${s.status}</td><td>${eligible ? 'Eligible' : 'Not Eligible'}${overridden ? ' (manual override)' : ''}</td><td>${reasons.length ? reasons.join(', ') : '—'}</td></tr>`;
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
<tr><th>Student ID</th><th>Name</th><th>Program</th><th>Program Code</th><th>Sem</th><th>Status</th><th>Eligibility</th><th>Reason(s)</th></tr>
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
  const programChoices = getAllProgramShortNames();
  const semChoices = getAllSemesterCodes();
  const programFilterSelect = `<select class="form-control" onchange="filterEligibilityProgram(this.value)">
    <option value="">All Programs</option>
    ${programChoices.map(p => `<option value="${p}" ${eligibilityProgramFilter === p ? 'selected' : ''}>${p}${getProgramCode(p) ? ` (${getProgramCode(p)})` : ''}</option>`).join('')}
  </select>`;
  const semFilterSelect = `<select class="form-control" onchange="filterEligibilitySem(this.value)">
    <option value="">All Semesters</option>
    ${semChoices.map(sem => `<option value="${sem}" ${eligibilitySemFilter === sem ? 'selected' : ''}>Sem ${sem}</option>`).join('')}
  </select>`;
  const displayStudents = students.filter(s =>
    (!eligibilityProgramFilter || s.program === eligibilityProgramFilter) &&
    (!eligibilitySemFilter || s.sem === eligibilitySemFilter)
  );
  const rows = displayStudents.map(s => {
    const { eligible, reasons, overridden } = effectiveEligibility(s);
    const reasonNote = reasons.length ? `<div class="text-muted" style="font-size:11px">${reasons.join(', ')}</div>` : '';
    const overrideNote = overridden ? `<div class="text-muted" style="font-size:10px;font-style:italic">Manually overridden</div>` : '';
    const statusBadge = s.status === 'Active' ? 'badge-success' : s.status === 'Inactive' ? 'badge-neutral' : 'badge-danger';
    return `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.program}</td><td>${getProgramCode(s.program) || '—'}</td><td>${s.sem}</td><td><span class="badge ${statusBadge}">${s.status}</span></td><td><span class="badge ${eligible ? 'badge-success' : 'badge-danger'}">${eligible ? 'Eligible' : 'Not Eligible'}</span>${reasonNote}${overrideNote}</td><td><input type="checkbox" ${eligible ? 'checked' : ''} ${eligibilityApproved ? 'disabled' : ''} onchange="toggleEligibilityOverride('${s.id}', this.checked)"></td></tr>`;
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
        ${programFilterSelect}
        ${semFilterSelect}
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${eligibleCount} Eligible</span>
        <span class="chip"><i class="fas fa-times-circle" style="color:#dc2626"></i> ${notEligibleCount} Not Eligible</span>
        <span class="chip"><i class="fas fa-clock"></i> Attendance ≥ 75%</span>
        ${universityExportBtn}
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="regenerateEligibleList()" ${eligibilityApproved ? 'disabled title="List is approved and locked — regenerate is unavailable until re-opened"' : ''}><i class="fas fa-sync"></i> Regenerate</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-users"></i> Eligible Student List</h3><div class="flex gap-2"><input type="text" class="form-control" style="max-width:200px" placeholder="Search students..." oninput="liveSearchTable(this)"><button class="btn btn-sm" onclick="downloadEligibilityReport('standard')"><i class="fas fa-download"></i> Export</button>${approveControl}</div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student ID</th><th>Name</th><th>Program</th><th>Program Code</th><th>Sem</th><th>Status</th><th>Eligibility</th><th>Select</th></tr>
              ${rows || `<tr><td colspan="8" class="text-center text-muted" style="padding:20px">No students match this Program/Semester filter.</td></tr>`}
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
  // Each program registers its own 6 papers for this exam (a real exam day
  // runs many programs side by side) — keyed by program so the same short
  // name like "Maths IV" can mean a different real subject/code depending on
  // which program's student it is. `codes` mirrors that per-program nesting;
  // resolveSubjectCode() and getRegistrationRoster() both read it that way.
  'Sem IV Regular Apr 2026': {
    defaultByProgram: {
      'B.E. Computer': ['DS', 'DBMS', 'OS', 'CN', 'SE', 'Maths IV'],
      'B.E. Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Processes', 'Strength of Materials', 'Maths IV'],
      'B.E. Civil': ['Structural Analysis', 'Hydraulics', 'Geotechnical Engineering', 'Surveying', 'Concrete Technology', 'Maths IV'],
      'B.E. Electrical': ['Electrical Machines', 'Power Systems', 'Control Systems', 'Electrical Measurements', 'Power Electronics', 'Maths IV'],
      'B.E. Electronics': ['Analog Electronics', 'Digital Signal Processing', 'Communication Systems', 'Microprocessors', 'VLSI Design', 'Maths IV'],
    },
    // One backlog example per program — missing just that program's Maths IV
    // paper, so each shows up seated alongside its regular cohort for every
    // other subject (same room, same session) but is correctly absent from
    // the one paper they're not sitting this exam.
    overrides: {
      S005: { subjects: ['DS', 'DBMS', 'CN', 'SE'], backlog: true },
      S043: { subjects: ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Processes', 'Strength of Materials'], backlog: true },
      S045: { subjects: ['Structural Analysis', 'Hydraulics', 'Geotechnical Engineering', 'Surveying', 'Concrete Technology'], backlog: true },
      S046: { subjects: ['Electrical Machines', 'Power Systems', 'Control Systems', 'Electrical Measurements', 'Power Electronics'], backlog: true },
      S044: { subjects: ['Analog Electronics', 'Digital Signal Processing', 'Communication Systems', 'Microprocessors', 'VLSI Design'], backlog: true },
    },
    codes: {
      'B.E. Computer': { DS: 'CS401', DBMS: 'CS402', OS: 'CS403', CN: 'CS404', SE: 'CS405', 'Maths IV': 'CS406' },
      'B.E. Mechanical': { Thermodynamics: 'ME401', 'Fluid Mechanics': 'ME402', 'Machine Design': 'ME403', 'Manufacturing Processes': 'ME404', 'Strength of Materials': 'ME405', 'Maths IV': 'ME406' },
      'B.E. Civil': { 'Structural Analysis': 'CE401', Hydraulics: 'CE402', 'Geotechnical Engineering': 'CE403', Surveying: 'CE404', 'Concrete Technology': 'CE405', 'Maths IV': 'CE406' },
      'B.E. Electrical': { 'Electrical Machines': 'EE401', 'Power Systems': 'EE402', 'Control Systems': 'EE403', 'Electrical Measurements': 'EE404', 'Power Electronics': 'EE405', 'Maths IV': 'EE406' },
      'B.E. Electronics': { 'Analog Electronics': 'EC401', 'Digital Signal Processing': 'EC402', 'Communication Systems': 'EC403', Microprocessors: 'EC404', 'VLSI Design': 'EC405', 'Maths IV': 'EC406' },
    },
  },
  'Sem VI Regular Apr 2026': {
    default: ['ML', 'Cloud Computing', 'Big Data Analytics', 'IoT', 'Deep Learning', 'Blockchain'],
    overrides: {},
    codes: { ML: 'CS601', 'Cloud Computing': 'CS602', 'Big Data Analytics': 'CS603', IoT: 'CS604', 'Deep Learning': 'CS605', Blockchain: 'CS606' },
  },
  'Sem II Supplementary Jan 2026': {
    perStudentBacklog: { S017: ['Maths I'], S018: ['Physics'], S019: ['Chemistry'], S020: ['English'] },
    codes: { 'Maths I': 'SUP101', Physics: 'SUP102', Chemistry: 'SUP103', English: 'SUP104' },
  },
};

// Subject options for the Registration page's subject filter dropdown —
// the exam's full subject list (or, for backlog-only exams, the distinct
// set of subjects actually assigned across students) paired with its code.
// Looks up a subject's code, whether cfg.codes is a flat { name: code } map
// (Sem VI, Sem II Supplementary — one program, one shared list) or a
// per-program nested map (Sem IV — 5 programs, so the same short name like
// "Maths IV" can legitimately mean a different code per program).
function resolveSubjectCode(cfg, program, name) {
  if (!cfg.codes) return '';
  const perProgram = cfg.codes[program];
  if (perProgram && typeof perProgram === 'object') return perProgram[name] || '';
  return cfg.codes[name] || '';
}

function getExamSubjectOptions(examLabel) {
  const cfg = registrationSubjects[examLabel] || registrationSubjects['Sem IV Regular Apr 2026'];
  if (cfg.perStudentBacklog) {
    const names = [...new Set(Object.values(cfg.perStudentBacklog).flat())];
    return names.map(name => ({ name, code: resolveSubjectCode(cfg, null, name) }));
  }
  if (cfg.defaultByProgram) {
    // Flattened across every program, deduped by name — a name like "Maths
    // IV" only needs to appear once in the filter dropdown even though each
    // program's own code for it differs underneath.
    const seen = new Map();
    Object.keys(cfg.defaultByProgram).forEach(program => {
      cfg.defaultByProgram[program].forEach(name => {
        if (!seen.has(name)) seen.set(name, resolveSubjectCode(cfg, program, name));
      });
    });
    return [...seen.entries()].map(([name, code]) => ({ name, code }));
  }
  return cfg.default.map(name => ({ name, code: resolveSubjectCode(cfg, null, name) }));
}

// Which subject the Registration table is currently filtered to ('' = all).
let registrationSubjectFilter = '';

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
      const defaultSubjects = cfg.defaultByProgram ? (cfg.defaultByProgram[s.program] || cfg.default || ['General']) : cfg.default;
      subjects = override ? override.subjects : defaultSubjects;
      backlog = !!(override && override.backlog);
    }
    const key = registrationKey(s.id, examLabel);
    const feeStatus = Object.prototype.hasOwnProperty.call(registrationFeePayments, key)
      ? registrationFeePayments[key]
      : s.feeStatus;
    const approval = Object.prototype.hasOwnProperty.call(registrationApprovals, key)
      ? registrationApprovals[key]
      : (feeStatus === 'Paid' ? 'Approved' : 'Pending');
    const subjectCodes = subjects.map(name => resolveSubjectCode(cfg, s.program, name));
    return { id: s.id, name: s.name, program: s.program, sem: s.sem, subjects, subjectCodes, backlog, feeStatus, approval };
  });
}

// "DS (CS401), DBMS (CS402)" — subject name paired with its code, falling
// back to the bare name when an exam has no code on file for it.
function formatRegisteredSubjects(r) {
  return r.subjects.map((name, i) => r.subjectCodes[i] ? `${name} (${r.subjectCodes[i]})` : name).join(', ');
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
  registrationSubjectFilter = '';
  showPage('registration');
}

function filterRegistrationSubject(value) {
  registrationSubjectFilter = value;
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
      <tr><td style="font-weight:600;padding:6px 0">Program Code</td><td>${getProgramCode(r.program) || '—'}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Semester</td><td>${r.sem}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam</td><td>${currentExamLabel}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subjects Registered</td><td>${formatRegisteredSubjects(r)}${r.backlog ? ' (Backlog)' : ''}</td></tr>
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
    `<tr><td>${r.id}</td><td>${r.name}</td><td>${formatRegisteredSubjects(r)}${r.backlog ? ' (Backlog)' : ''}</td><td>${r.feeStatus}</td><td>${r.approval}</td></tr>`
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
  const subjectOptions = getExamSubjectOptions(currentExamLabel);
  const subjectFilterSelect = `<select class="form-control" onchange="filterRegistrationSubject(this.value)">
    <option value="">All Subjects</option>
    ${subjectOptions.map(o => `<option value="${o.name}" ${registrationSubjectFilter === o.name ? 'selected' : ''}>${o.name}${o.code ? ` (${o.code})` : ''}</option>`).join('')}
  </select>`;
  const displayRoster = registrationSubjectFilter ? roster.filter(r => r.subjects.includes(registrationSubjectFilter)) : roster;
  const filterActions = !isAutonomous
    ? `<button class="btn btn-sm" onclick="downloadRegistrationReport()"><i class="fas fa-file-export"></i> Export to University</button>`
    : '';
  const headerButton = isAffiliated
    ? `<button class="btn btn-success btn-sm" onclick="importUniversityRegistrationList()"><i class="fas fa-file-import"></i> Import University List</button>`
    : `<button class="btn btn-success btn-sm" onclick="finalApproveAllRegistrations()"><i class="fas fa-check"></i> Final Approve All</button>`;
  const approvalBadge = { Approved: 'badge-success', Pending: 'badge-warning', Rejected: 'badge-danger' };
  const rows = displayRoster.map(r => {
    const subjectText = `${formatRegisteredSubjects(r)}${r.backlog ? ' (Backlog)' : ''}`;
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
        ${subjectFilterSelect}
        <span class="chip"><i class="fas fa-users"></i> ${roster.length} Registered</span>
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${approvedCount} Approved</span>
        <span class="chip"><i class="fas fa-rupee-sign"></i> Fee: ₹${examFee}</span>
        <div class="flex gap-2" style="margin-left:auto">${filterActions}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-file-signature"></i> Exam Registration / Exam Form</h3><div class="flex gap-2"><input type="text" class="form-control" style="max-width:200px" placeholder="Search students..." oninput="liveSearchTable(this)">${headerButton}</div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student</th><th>Subjects Registered</th><th>Fee Status</th><th>Approval</th><th></th></tr>
              ${rows || `<tr><td colspan="5" class="text-center text-muted" style="padding:20px">${registrationSubjectFilter ? 'No students registered for this subject.' : 'No eligible students to register for this exam.'}</td></tr>`}
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
    { date: '08 Apr 2026', session: 'Morning', subject: 'Machine Learning', code: 'CS601', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
    { date: '10 Apr 2026', session: 'Morning', subject: 'Cloud Computing', code: 'CS602', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Big Data Analytics', code: 'CS603', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Internet of Things', code: 'CS604', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Deep Learning', code: 'CS605', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Blockchain Technology', code: 'CS606', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
  ],
  'Sem II Supplementary Jan 2026': [
    { date: '12 Jan 2026', session: 'Morning', subject: 'Mathematics I', code: 'SUP101', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
    { date: '14 Jan 2026', session: 'Morning', subject: 'Physics', code: 'SUP102', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '16 Jan 2026', session: 'Morning', subject: 'Chemistry', code: 'SUP103', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '18 Jan 2026', session: 'Afternoon', subject: 'English', code: 'SUP104', time: '14:00 - 16:00', duration: '2 hrs', program: 'B.E. Computer' },
  ],
};

// Subjects offered when adding a slot, matched to the exam being scheduled —
// falls back to the Sem IV master subject catalog (data.subjects) for any
// exam without its own list. Sem IV's list spans all 5 programs (not just
// Computer) since a real exam day runs many programs' papers side by side —
// each entry is tagged with `program` so Add Slot can offer a Program
// selector and only block a genuine same-students overlap (see
// openAddSlotModal), not just any two exams sharing a date/time.
const examSubjectCatalog = {
  'Sem IV Regular Apr 2026': [
    { code: 'CS401', name: 'Data Structures & Algorithms', program: 'B.E. Computer' },
    { code: 'CS402', name: 'Database Management Systems', program: 'B.E. Computer' },
    { code: 'CS403', name: 'Operating Systems', program: 'B.E. Computer' },
    { code: 'CS404', name: 'Computer Networks', program: 'B.E. Computer' },
    { code: 'CS405', name: 'Software Engineering', program: 'B.E. Computer' },
    { code: 'CS406', name: 'Mathematics IV', program: 'B.E. Computer' },
    { code: 'ME401', name: 'Thermodynamics', program: 'B.E. Mechanical' },
    { code: 'ME402', name: 'Fluid Mechanics', program: 'B.E. Mechanical' },
    { code: 'ME403', name: 'Machine Design', program: 'B.E. Mechanical' },
    { code: 'ME404', name: 'Manufacturing Processes', program: 'B.E. Mechanical' },
    { code: 'ME405', name: 'Strength of Materials', program: 'B.E. Mechanical' },
    { code: 'ME406', name: 'Engineering Mathematics IV', program: 'B.E. Mechanical' },
    { code: 'CE401', name: 'Structural Analysis', program: 'B.E. Civil' },
    { code: 'CE402', name: 'Hydraulics', program: 'B.E. Civil' },
    { code: 'CE403', name: 'Geotechnical Engineering', program: 'B.E. Civil' },
    { code: 'CE404', name: 'Surveying', program: 'B.E. Civil' },
    { code: 'CE405', name: 'Concrete Technology', program: 'B.E. Civil' },
    { code: 'CE406', name: 'Engineering Mathematics IV', program: 'B.E. Civil' },
    { code: 'EE401', name: 'Electrical Machines', program: 'B.E. Electrical' },
    { code: 'EE402', name: 'Power Systems', program: 'B.E. Electrical' },
    { code: 'EE403', name: 'Control Systems', program: 'B.E. Electrical' },
    { code: 'EE404', name: 'Electrical Measurements', program: 'B.E. Electrical' },
    { code: 'EE405', name: 'Power Electronics', program: 'B.E. Electrical' },
    { code: 'EE406', name: 'Engineering Mathematics IV', program: 'B.E. Electrical' },
    { code: 'EC401', name: 'Analog Electronics', program: 'B.E. Electronics' },
    { code: 'EC402', name: 'Digital Signal Processing', program: 'B.E. Electronics' },
    { code: 'EC403', name: 'Communication Systems', program: 'B.E. Electronics' },
    { code: 'EC404', name: 'Microprocessors', program: 'B.E. Electronics' },
    { code: 'EC405', name: 'VLSI Design', program: 'B.E. Electronics' },
    { code: 'EC406', name: 'Engineering Mathematics IV', program: 'B.E. Electronics' },
  ],
  'Sem VI Regular Apr 2026': [
    { code: 'CS601', name: 'Machine Learning', program: 'B.E. Computer' },
    { code: 'CS602', name: 'Cloud Computing', program: 'B.E. Computer' },
    { code: 'CS603', name: 'Big Data Analytics', program: 'B.E. Computer' },
    { code: 'CS604', name: 'Internet of Things', program: 'B.E. Computer' },
    { code: 'CS605', name: 'Deep Learning', program: 'B.E. Computer' },
    { code: 'CS606', name: 'Blockchain Technology', program: 'B.E. Computer' },
  ],
  'Sem II Supplementary Jan 2026': [
    { code: 'SUP101', name: 'Mathematics I', program: 'B.E. Computer' },
    { code: 'SUP102', name: 'Physics', program: 'B.E. Computer' },
    { code: 'SUP103', name: 'Chemistry', program: 'B.E. Computer' },
    { code: 'SUP104', name: 'English', program: 'B.E. Computer' },
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

function renderTimetable() {
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAffiliated
    ? 'Affiliated: Import or manually enter the university-released timetable.'
    : currentMode === 'hybrid'
      ? 'Hybrid: Create internal/practical timetable in ERP; import the university timetable for external subjects.'
      : 'Autonomous: Create the timetable directly in ERP.';
  const slots = getExamTimetableSlots(currentExamLabel);
  const publishedCount = slots.filter(s => s.published !== false).length;
  const examWindow = formatExamWindow(slots);
  const uniqueSessions = [...new Set(slots.map(s => s.session))];
  const sessionsSummary = slots.length
    ? `${uniqueSessions.join('/') || 'No'} session(s) for ${slots.length} theory paper${slots.length === 1 ? '' : 's'}`
    : 'No sessions scheduled yet';
  const examOptions = Object.keys(eligibilityExams).map(key =>
    `<option value="${key}" ${key === currentExamLabel ? 'selected' : ''}>${key}</option>`
  ).join('');
  const createActions = !isAffiliated
    ? `<button class="btn btn-primary btn-sm" onclick="openAddSlotModal()"><i class="fas fa-plus"></i> Add Slot</button>`
    : '';
  const importAction = currentMode !== 'autonomous'
    ? `<button class="btn ${isAffiliated?'btn-primary':''} btn-sm" onclick="showActionModal('Import University Timetable','Select the university-released timetable file to import exam dates and sessions.', {icon:'fa-file-import', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-file-import"></i> Import University Timetable</button>`
    : '';
  const rows = slots.map((s, i) => {
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
      <td>${isPublished ? '' : `<button class="btn btn-sm btn-danger" onclick="removeTimetableSlot(${i})"><i class="fas fa-trash"></i> Remove</button>`}</td>
    </tr>`;
  }).join('');
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
      </div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeTimetableExam(this.value)">${examOptions}</select>
        ${createActions}
        ${importAction}
        <button class="btn btn-success btn-sm" style="margin-left:auto" onclick="publishTimetable()"><i class="fas fa-check"></i> Publish Timetable</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-calendar-alt"></i> Exam Timetable</h3><div class="flex gap-2" style="align-items:center"><input type="text" class="form-control" style="max-width:200px" placeholder="Search subjects..." oninput="liveSearchTable(this)"><span class="text-muted">${slots.length} subject(s) scheduled</span></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Date</th><th>Session</th><th>Subject</th><th>Time</th><th>Duration</th><th>Status</th><th></th></tr>
              ${rows || '<tr><td colspan="7" class="text-center text-muted" style="padding:20px">No slots scheduled yet for this exam.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Only an unpublished ("Scheduled") slot can be removed outright — once a
// slot is Published, Hall Ticket and Seating Plan may already depend on it,
// so pulling it here would silently break those pages.
function removeTimetableSlot(index) {
  const slots = getExamTimetableSlots(currentExamLabel);
  const slot = slots[index];
  if (!slot || slot.published !== false) return;
  showActionModal('Remove Slot', `Remove ${slot.subject} (${slot.code}) scheduled ${slot.date} (${slot.session}) from the timetable? This cannot be undone.`, {
    icon: 'fa-trash', iconColor: 'var(--danger)', confirmLabel: 'Remove', confirmClass: 'btn-danger', confirmIcon: 'fa-trash',
    onConfirm: function () {
      slots.splice(index, 1);
      showPage('timetable');
      showToast(slot.subject + ' removed from the timetable');
    }
  });
}

// ============================================================
// HALL TICKET
// ============================================================
// Semester -> which year of a 4-year B.E. program a student is in (I/II =
// Year 1, III/IV = Year 2, V/VI = Year 3, VII/VIII = Year 4), used to derive
// a plausible admission year for the Seat Number.
const SEM_TO_YEAR_OF_STUDY = { I: 1, II: 1, III: 2, IV: 2, V: 3, VI: 3, VII: 4, VIII: 4 };

function getExamYear(examLabel) {
  const m = /\d{4}/.exec(examLabel || '');
  return m ? Number(m[0]) : new Date().getFullYear();
}

// "COMP/25/001" — program code / 2-digit admission year (derived from the
// exam's year minus how many years into the program this semester is) /
// 3-digit serial within that program+admission-year batch. Serials are
// assigned in stable student-ID order so the same student always gets the
// same seat number on every render.
function computeSeatNumbers(students, examLabel) {
  const examYear = getExamYear(examLabel);
  const sorted = [...students].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const counters = {};
  const map = {};
  sorted.forEach(s => {
    const code = getProgramCode(s.program) || 'GEN';
    const yearOfStudy = SEM_TO_YEAR_OF_STUDY[s.sem] || 1;
    const admissionYearShort = String(examYear - (yearOfStudy - 1)).slice(-2);
    const key = `${code}/${admissionYearShort}`;
    counters[key] = (counters[key] || 0) + 1;
    map[s.id] = `${key}/${String(counters[key]).padStart(3, '0')}`;
  });
  return map;
}

function downloadHallTicket(studentId, examLabel) {
  examLabel = examLabel || currentExamLabel;
  const s = getRegistrationRoster(examLabel).find(st => st.id === studentId);
  if (!s) return;
  const hallTicketNo = 'HT-' + studentId;
  const seatNumber = computeSeatNumbers(getRegistrationRoster(examLabel), examLabel)[studentId];
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
    <tr><td style="font-weight:600">Seat Number</td><td>${seatNumber}</td></tr>
    <tr><td style="font-weight:600">Student Name</td><td>${s.name}</td></tr>
    <tr><td style="font-weight:600">Student ID</td><td>${s.id}</td></tr>
    <tr><td style="font-weight:600">Program</td><td>${s.program}</td></tr>
    <tr><td style="font-weight:600">Program Code</td><td>${getProgramCode(s.program) || '—'}</td></tr>
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

// Which Program/Sem the (Exam Branch) Hall Tickets table is narrowed to
// ('' = all); irrelevant to a logged-in student, whose table always shows
// their own tickets only.
let hallTicketProgramFilter = '';
let hallTicketSemFilter = '';

function changeHallTicketExam(value) {
  openExam(value);
  hallTicketProgramFilter = '';
  hallTicketSemFilter = '';
  showPage('hallticket');
}

function filterHallTicketProgram(value) {
  hallTicketProgramFilter = value;
  showPage('hallticket');
}

function filterHallTicketSem(value) {
  hallTicketSemFilter = value;
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
  const programChoices = getAllProgramShortNames();
  const semChoices = getAllSemesterCodes();
  const displayRoster = roster.filter(s =>
    (!hallTicketProgramFilter || s.program === hallTicketProgramFilter) &&
    (!hallTicketSemFilter || s.sem === hallTicketSemFilter)
  );
  // Computed against the full unfiltered roster, not displayRoster — seat
  // numbers group students by program+admission-year and assign serials
  // within each group, so computing them off whatever subset the Program/Sem
  // filter currently shows would reset every group's counter to 1 each time
  // (most rows collapsing to ".../001"), and a student's own seat number
  // would shift depending on which filter happened to be applied.
  const seatNumbers = computeSeatNumbers(roster, currentExamLabel);
  const liveRows = isStudent
    ? myTickets.map(({ examLabel, s }) => {
        const seatNo = computeSeatNumbers(getRegistrationRoster(examLabel), examLabel)[s.id];
        return `<tr><td>${s.id}</td><td>${s.name}</td><td>HT-${s.id}</td><td>${seatNo}</td><td>${s.program}</td><td>${getProgramCode(s.program) || '—'}</td><td>${s.sem}</td><td>${examLabel}</td><td><span class="badge badge-success">Generated</span></td><td><button class="btn btn-sm" onclick="downloadHallTicket('${s.id}','${examLabel}')"><i class="fas fa-download"></i> PDF</button></td></tr>`;
      }).join('')
    : displayRoster.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>HT-${s.id}</td><td>${seatNumbers[s.id]}</td><td>${s.program}</td><td>${getProgramCode(s.program) || '—'}</td><td>${s.sem}</td><td><span class="badge badge-success">Generated</span></td><td><button class="btn btn-sm" onclick="downloadHallTicket('${s.id}')"><i class="fas fa-download"></i> PDF</button></td></tr>`).join('');
  const pastRows = pastTickets.map(t => {
    const semMatch = t.examLabel.match(/^Sem (\S+)/);
    return `<tr><td>${CURRENT_STUDENT_ID}</td><td>Aarav Sharma</td><td>${t.hallTicketNo}</td><td class="text-muted">—</td><td>B.E. Computer</td><td>${getProgramCode('B.E. Computer') || '—'}</td><td>${semMatch ? semMatch[1] : '—'}</td><td>${t.examLabel}</td><td><span class="badge badge-neutral">Closed</span></td><td><button class="btn btn-sm" onclick="downloadPastHallTicket('${t.examLabel}')"><i class="fas fa-download"></i> PDF</button></td></tr>`;
  }).join('');
  const rows = liveRows + pastRows;
  const visibleCount = isStudent ? myTickets.length + pastTickets.length : displayRoster.length;
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
  const programFilterSelect = !isStudent
    ? `<select class="form-control" onchange="filterHallTicketProgram(this.value)">
        <option value="">All Programs</option>
        ${programChoices.map(p => `<option value="${p}" ${hallTicketProgramFilter === p ? 'selected' : ''}>${p}${getProgramCode(p) ? ` (${getProgramCode(p)})` : ''}</option>`).join('')}
      </select>`
    : '';
  const semFilterSelect = !isStudent
    ? `<select class="form-control" onchange="filterHallTicketSem(this.value)">
        <option value="">All Semesters</option>
        ${semChoices.map(sem => `<option value="${sem}" ${hallTicketSemFilter === sem ? 'selected' : ''}>Sem ${sem}</option>`).join('')}
      </select>`
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
        ${programFilterSelect}
        ${semFilterSelect}
        ${generateBtn}
        ${importBtn}
        ${publishBtn}
      </div>`}
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-ticket-alt"></i> ${isStudent ? 'My Hall Tickets' : 'Hall Tickets'}</h3><div class="flex gap-2" style="align-items:center"><input type="text" class="form-control" style="max-width:200px" placeholder="Search students..." oninput="liveSearchTable(this)"><span class="text-muted">Total: ${visibleCount}</span></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student ID</th><th>Name</th><th>Hall Ticket No.</th><th>Seat No.</th><th>Program</th><th>Program Code</th><th>Sem</th>${isStudent ? '<th>Exam</th>' : ''}<th>Status</th><th></th></tr>
              ${rows || `<tr><td colspan="${isStudent ? 10 : 9}" class="text-center text-muted" style="padding:20px">${isStudent ? 'No hall tickets found for your account yet.' : (roster.length ? 'No students match this Program/Semester filter.' : 'No registered students for this exam yet.')}</td></tr>`}
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
// Manual Assignment view toggle + the set of currently checked (unassigned
// or assigned) student IDs used by both drag-and-drop and the "Move
// Selected" bulk-checkbox action.
let seatingManualMode = false;
let seatingSelectedIds = new Set();
// Per exam+slot room assignment, keyed by seatingKey(). Populated lazily
// (auto-filled by capacity order) the first time a slot is opened, then
// mutated in place by manual drag/drop, checkbox bulk-move, and bulk upload
// — so switching slots or exams never bleeds one session's seating into
// another's.
const seatingAssignments = {};

function changeSeatingSlot(value) {
  selectedSeatingSlotIndex = Number(value);
  seatingManualMode = false;
  seatingSelectedIds.clear();
  showPage('seating');
}

function seatingKey(examLabel, slotIndex) {
  return (examLabel || currentExamLabel) + '|' + slotIndex;
}

// Rooms already hosting at least one student from a DIFFERENT slot running
// at the same actual date+time (a simultaneous, different-program exam) —
// a real exam day splits its rooms across those exams, so a room one of them
// has already claimed isn't available to the others. Returns a Map of
// roomName -> the sibling slot's subject name, for messaging. Only counts
// slots that have actually been opened/allocated at least once (lazily —
// whichever slot claims a room first, in visit order, keeps it).
function getRoomsBusyElsewhere(slotIndex, examLabel) {
  const busy = new Map();
  getSimultaneousSlotIndices(slotIndex).filter(i => i !== slotIndex).forEach(i => {
    const map = seatingAssignments[seatingKey(examLabel, i)];
    if (!map) return;
    const subject = data.timetableSlots[i].subject;
    Object.values(map).forEach(roomName => { if (!busy.has(roomName)) busy.set(roomName, subject); });
  });
  return busy;
}

// The real students registered for this slot's subject — same roster
// Hall Ticket draws on, filtered to whoever is actually appearing for this
// exam code, so Manual Assignment has real names/IDs to drag and check
// instead of a flat headcount.
function getSeatingRoster(slot, examLabel) {
  // registrationSubjects assigns each program its own subject list, but
  // still by exam (not per-semester) — so a seating list built only off
  // subjectCodes would also pull in the same program's students from other
  // semesters (e.g. a Sem I Computer student registered for a different
  // exam's Computer papers). Restrict to the slot's own program + semester
  // so the room only fills with students who'd plausibly sit that exact
  // paper. Falls back to a 'CS'-prefix guess for any slot seeded before
  // `program` was tracked directly on the slot.
  const subjectProgram = slot.program || (slot.code.startsWith('CS') ? 'B.E. Computer' : null);
  const subjectSem = subjectProgram ? /Sem\s+(\S+)/.exec(examLabel || currentExamLabel)?.[1] : null;
  return getRegistrationRoster(examLabel).filter(r =>
    r.subjectCodes.includes(slot.code) &&
    (!subjectProgram || r.program === subjectProgram) &&
    (!subjectSem || r.sem === subjectSem));
}

// Fills every room in capacity order (lowest seat number first), leaving
// whoever doesn't fit as unassigned — the same "Auto Allocate" behavior as
// before, just against the real roster instead of a placeholder count. Rooms
// a simultaneous, different-program exam has already claimed are skipped
// entirely, so two exams running at the same time never get auto-allocated
// into the same physical room.
function autoAllocateSeating(slot, examLabel, slotIndex) {
  const roster = getSeatingRoster(slot, examLabel);
  const seatNumbers = computeSeatNumbers(roster, examLabel);
  const sorted = [...roster].sort((a, b) => (seatNumbers[a.id] || '').localeCompare(seatNumbers[b.id] || '', undefined, { numeric: true }));
  const busyRooms = slotIndex == null ? new Map() : getRoomsBusyElsewhere(slotIndex, examLabel);
  const availableRooms = data.rooms.filter(r => !busyRooms.has(r.name));
  const map = {};
  let roomIdx = 0;
  let used = 0;
  for (const s of sorted) {
    while (roomIdx < availableRooms.length && used >= availableRooms[roomIdx].capacity) { roomIdx++; used = 0; }
    if (roomIdx >= availableRooms.length) break;
    map[s.id] = availableRooms[roomIdx].name;
    used++;
  }
  return map;
}

function ensureSeatingAssignment(slot, slotIndex, examLabel) {
  const key = seatingKey(examLabel, slotIndex);
  if (!seatingAssignments[key]) seatingAssignments[key] = autoAllocateSeating(slot, examLabel, slotIndex);
  return seatingAssignments[key];
}

// Places as many of the given student IDs into roomName as its remaining
// capacity allows (already-seated IDs are left alone); anyone who doesn't
// fit is reported back as skipped rather than silently dropped. A room a
// simultaneous, different-program exam already occupies is refused outright
// (busyWith names that exam), the same "one room, one exam at a time" rule
// autoAllocateSeating already enforces.
function assignStudentsToRoom(slot, slotIndex, examLabel, studentIds, roomName) {
  const room = data.rooms.find(r => r.name === roomName);
  if (!room) return { placed: 0, skipped: studentIds.length };
  const busyRooms = getRoomsBusyElsewhere(slotIndex, examLabel);
  if (busyRooms.has(roomName)) return { placed: 0, skipped: studentIds.length, busyWith: busyRooms.get(roomName) };
  const assignMap = ensureSeatingAssignment(slot, slotIndex, examLabel);
  let freeSeats = room.capacity - Object.values(assignMap).filter(r => r === roomName).length;
  let placed = 0, skipped = 0;
  studentIds.forEach(id => {
    if (assignMap[id] === roomName) return;
    if (freeSeats <= 0) { skipped++; return; }
    assignMap[id] = roomName;
    freeSeats--;
    placed++;
  });
  return { placed, skipped };
}

function unassignSeat(slot, slotIndex, examLabel, studentId) {
  const assignMap = ensureSeatingAssignment(slot, slotIndex, examLabel);
  delete assignMap[studentId];
}

function currentSeatingSlot() {
  const slots = data.timetableSlots;
  const idx = Math.min(selectedSeatingSlotIndex, slots.length - 1);
  return { slots, idx, slot: slots[idx] };
}

// Every room's occupants (with stable, Hall-Ticket-matching seat numbers)
// plus whoever from the roster isn't seated anywhere yet. Rooms already
// claimed by a simultaneous, different-program exam are flagged via
// busyWith so the UI can show them as unavailable instead of "Unused".
function computeSeatingAllocation(slot, slotIndex, examLabel) {
  examLabel = examLabel || currentExamLabel;
  const roster = getSeatingRoster(slot, examLabel);
  const seatNumbers = computeSeatNumbers(roster, examLabel);
  const assignMap = ensureSeatingAssignment(slot, slotIndex, examLabel);
  const busyRooms = getRoomsBusyElsewhere(slotIndex, examLabel);
  const withSeatNo = s => ({ id: s.id, name: s.name, program: s.program, seatNo: seatNumbers[s.id] });
  const byId = new Map(roster.map(s => [s.id, s]));
  const rows = data.rooms.map(r => {
    const occupants = Object.keys(assignMap)
      .filter(id => assignMap[id] === r.name && byId.has(id))
      .map(id => withSeatNo(byId.get(id)))
      .sort((a, b) => (a.seatNo || '').localeCompare(b.seatNo || '', undefined, { numeric: true }));
    const allocated = occupants.length;
    const available = r.capacity - allocated;
    const status = allocated === 0 ? 'Unused' : available <= 0 ? 'Full' : 'Partial';
    return { room: r.name, capacity: r.capacity, allocated, available, occupants, status, busyWith: allocated === 0 ? (busyRooms.get(r.name) || null) : null };
  });
  const unassigned = roster.filter(s => !assignMap[s.id]).map(withSeatNo)
    .sort((a, b) => (a.seatNo || '').localeCompare(b.seatNo || '', undefined, { numeric: true }));
  const totalCapacity = data.rooms.reduce((sum, r) => sum + r.capacity, 0);
  return { roster, rows, unassigned, totalCapacity, totalAllocated: roster.length - unassigned.length };
}

function toggleSeatingManualMode() {
  seatingManualMode = !seatingManualMode;
  seatingSelectedIds.clear();
  showPage('seating');
}

function toggleSeatSelect(id) {
  if (seatingSelectedIds.has(id)) seatingSelectedIds.delete(id); else seatingSelectedIds.add(id);
  showPage('seating');
}

function toggleSeatSelectAll(ids, checked) {
  ids.forEach(id => checked ? seatingSelectedIds.add(id) : seatingSelectedIds.delete(id));
  showPage('seating');
}

// Which student ID(s) a drag gesture is carrying — the whole checked set if
// the dragged row is part of it, otherwise just that one row.
let seatDragIds = [];

function handleSeatDragStart(e, id) {
  seatDragIds = seatingSelectedIds.has(id) ? [...seatingSelectedIds] : [id];
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', id);
}

function seatingAssignToast(roomName, result) {
  if (result.busyWith) return `${roomName} is already in use by ${result.busyWith} at this date/time — choose a different room.`;
  if (result.skipped) return `${roomName} only had space for ${result.placed} — ${result.skipped} student(s) could not be seated (room full)`;
  return `${result.placed} student(s) seated in ${roomName}`;
}

function handleSeatDrop(e, roomName) {
  e.preventDefault();
  if (!seatDragIds.length) return;
  const { idx, slot } = currentSeatingSlot();
  const result = assignStudentsToRoom(slot, idx, currentExamLabel, seatDragIds, roomName);
  seatDragIds = [];
  seatingSelectedIds.clear();
  showPage('seating');
  showToast(seatingAssignToast(roomName, result));
}

function handleSeatUnassignDrop(e) {
  e.preventDefault();
  if (!seatDragIds.length) return;
  const { idx, slot } = currentSeatingSlot();
  seatDragIds.forEach(id => unassignSeat(slot, idx, currentExamLabel, id));
  const count = seatDragIds.length;
  seatDragIds = [];
  seatingSelectedIds.clear();
  showPage('seating');
  showToast(`${count} student(s) moved back to Unassigned`);
}

function bulkAssignSelectedToRoom(roomName) {
  if (!roomName || seatingSelectedIds.size === 0) return;
  const { idx, slot } = currentSeatingSlot();
  const result = assignStudentsToRoom(slot, idx, currentExamLabel, [...seatingSelectedIds], roomName);
  seatingSelectedIds.clear();
  showPage('seating');
  showToast(seatingAssignToast(roomName, result));
}

function removeSeatAssignment(studentId) {
  const { idx, slot } = currentSeatingSlot();
  unassignSeat(slot, idx, currentExamLabel, studentId);
  showPage('seating');
  showToast('Student moved back to Unassigned');
}

function viewSeatingRoomOccupants(roomName) {
  const { idx, slot } = currentSeatingSlot();
  const alloc = computeSeatingAllocation(slot, idx, currentExamLabel);
  const row = alloc.rows.find(r => r.room === roomName);
  const rows = (row ? row.occupants : []).map(o => `<tr><td>${o.seatNo}</td><td>${o.id}</td><td>${o.name}</td><td>${o.program}</td></tr>`).join('');
  const body = `
    <div class="table-wrap">
      <table>
        <tr><th>Seat No.</th><th>Student ID</th><th>Name</th><th>Program</th></tr>
        ${rows || '<tr><td colspan="4" class="text-center text-muted" style="padding:16px">No students seated here yet.</td></tr>'}
      </table>
    </div>
  `;
  openModal(`${roomName} — Occupants`, body, `<button class="btn" onclick="closeModal()">Close</button>`);
}

function openSeatingBulkUploadModal() {
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-file-upload" style="font-size:40px;color:var(--primary)"></i>
    </div>
    <p class="text-muted" style="margin-bottom:12px">Upload a CSV mapping Student ID to Room (e.g. <code>S001,Lab 101</code>) to seat every currently unassigned student for this session in one go. Rooms without enough remaining capacity will skip the extra rows.</p>
    <input type="file" id="seatingUploadFile" class="form-control" accept=".csv">
  `;
  const footer = `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="processSeatingBulkUpload()"><i class="fas fa-file-upload"></i> Upload &amp; Allocate</button>`;
  openModal('Bulk Upload Seating', body, footer);
}

function processSeatingBulkUpload() {
  const { idx, slot } = currentSeatingSlot();
  const alloc = computeSeatingAllocation(slot, idx, currentExamLabel);
  let remainingIds = alloc.unassigned.map(s => s.id);
  let seated = 0;
  data.rooms.forEach(r => {
    if (!remainingIds.length) return;
    const row = alloc.rows.find(x => x.room === r.name);
    if (row.busyWith) return; // already claimed by a simultaneous exam
    const free = r.capacity - row.allocated;
    if (free <= 0) return;
    const chunk = remainingIds.splice(0, free);
    seated += assignStudentsToRoom(slot, idx, currentExamLabel, chunk, r.name).placed;
  });
  closeModal();
  showPage('seating');
  showToast(`Bulk upload processed — ${seated} student(s) seated from seating_upload.csv${remainingIds.length ? `, ${remainingIds.length} could not be seated (no capacity remaining)` : ''}`);
}

function renderSeating() {
  const { slots, idx, slot } = currentSeatingSlot();
  const alloc = computeSeatingAllocation(slot, idx, currentExamLabel);
  const slotOptions = slots.map((s, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${s.date} - ${s.session} — ${s.subject} (${s.code})</option>`).join('');
  const statusClass = { Full: 'badge-success', Partial: 'badge-warning', Unused: 'badge-neutral' };

  const toolbar = `
    <div class="filter-bar">
      <select class="form-control" onchange="changeSeatingSlot(this.value)">${slotOptions}</select>
      <select class="form-control" disabled><option>${slot.subject} (${slot.code})</option></select>
      <span class="chip"><i class="fas fa-user-graduate"></i> ${alloc.roster.length} Appearing</span>
      <button class="btn btn-sm ${seatingManualMode ? 'btn-primary' : ''}" onclick="toggleSeatingManualMode()"><i class="fas fa-hand-pointer"></i> ${seatingManualMode ? 'Exit Manual Mode' : 'Manual Assignment'}</button>
      <button class="btn btn-sm" onclick="openSeatingBulkUploadModal()"><i class="fas fa-file-upload"></i> Bulk Upload</button>
      <button class="btn btn-primary btn-sm" onclick="showActionModal('Auto Allocate Seats','Re-run automatic seat allocation for ${alloc.roster.length} appearing students (${slot.date} - ${slot.session}, ${slot.subject}) across available rooms by capacity. Any manual changes made for this session will be overwritten. Rooms already claimed by another exam running at the same date/time are skipped.', {icon:'fa-magic', confirmLabel:'Allocate', confirmIcon:'fa-magic', onConfirm:()=>{ seatingAssignments[seatingKey(currentExamLabel, ${idx})] = autoAllocateSeating(data.timetableSlots[${idx}], currentExamLabel, ${idx}); showPage('seating'); }})"><i class="fas fa-magic"></i> Auto Allocate</button>
      <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Export Seating Chart','The room-wise seating chart and student-wise seat numbers for ${slot.date} - ${slot.session} (${slot.subject}) have been exported.', {icon:'fa-file-pdf', confirmLabel:'Download PDF', confirmIcon:'fa-download'})"><i class="fas fa-file-pdf"></i> Export Seating Chart</button>
    </div>
  `;

  const overflowAlert = alloc.unassigned.length > 0
    ? `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> ${alloc.unassigned.length} student(s) are currently unassigned. ${seatingManualMode ? 'Drag them onto a room below, or check them and use Move Selected.' : 'Switch to Manual Assignment to seat them, or use Auto Allocate.'}</div>`
    : '';

  if (!seatingManualMode) {
    const rows = alloc.rows.map(r => `<tr>
        <td>${r.room}</td><td>${r.capacity}</td><td>${r.allocated}</td><td>${r.available}</td>
        <td>${r.occupants.length ? `<button class="btn btn-sm" onclick="viewSeatingRoomOccupants('${r.room.replace(/'/g, "\\'")}')"><i class="fas fa-list"></i> View ${r.occupants.length}</button>` : '<span class="text-muted">—</span>'}</td>
        <td>${r.busyWith ? `<span class="badge badge-neutral" title="Claimed by another exam at this date/time"><i class="fas fa-lock"></i> In Use — ${r.busyWith}</span>` : `<span class="badge ${statusClass[r.status]}">${r.status}</span>`}</td>
      </tr>`).join('');
    return `
      <div class="page-content">
        <div class="alert alert-info"><i class="fas fa-info-circle"></i> Allocate rooms and seats for each exam date and session.</div>
        ${toolbar}
        ${overflowAlert}
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-chair"></i> Room Allocation — ${slot.subject} (${slot.date} - ${slot.session})</h3><div class="flex gap-2" style="align-items:center"><input type="text" class="form-control" style="max-width:200px" placeholder="Search rooms..." oninput="liveSearchTable(this)"><span class="text-muted">${alloc.totalAllocated} / ${alloc.totalCapacity} seats used</span></div></div>
          <div class="card-body">
            <div class="table-wrap">
              <table>
                <tr><th>Room</th><th>Capacity</th><th>Allocated</th><th>Available Seats</th><th>Seat Numbers</th><th>Status</th></tr>
                ${rows}
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const initials = name => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const seatCard = (s, { checkbox, removeBtn } = {}) => `
      <div class="seat-card${seatingSelectedIds.has(s.id) ? ' selected' : ''}" draggable="true" ondragstart="handleSeatDragStart(event,'${s.id}')">
        <i class="fas fa-grip-vertical seat-drag-handle"></i>
        ${checkbox ? `<input type="checkbox" onclick="event.stopPropagation();toggleSeatSelect('${s.id}')" ${seatingSelectedIds.has(s.id) ? 'checked' : ''}>` : ''}
        <div class="seat-avatar">${initials(s.name)}</div>
        <div class="seat-info">
          <div class="seat-name">${s.name}</div>
          <div class="seat-meta">${s.id} · ${s.seatNo}</div>
        </div>
        ${removeBtn ? `<button class="seat-remove" title="Unassign" onclick="removeSeatAssignment('${s.id}')"><i class="fas fa-times"></i></button>` : ''}
      </div>
    `;

  const allChecked = alloc.unassigned.length > 0 && alloc.unassigned.every(s => seatingSelectedIds.has(s.id));
  const unassignedRows = alloc.unassigned.map(s => seatCard(s, { checkbox: true })).join('')
    || `<div class="seat-room-empty"><i class="fas fa-check-circle"></i>Everyone is seated</div>`;

  const roomCards = data.rooms.map(r => {
    const row = alloc.rows.find(x => x.room === r.name);
    const isBusyElsewhere = !!row.busyWith;
    const pct = Math.round((row.allocated / row.capacity) * 100);
    const occupantRows = row.occupants.map(o => seatCard(o, { removeBtn: true })).join('')
      || (isBusyElsewhere
        ? `<div class="seat-room-empty"><i class="fas fa-lock"></i>In use by ${row.busyWith}</div>`
        : `<div class="seat-room-empty"><i class="fas fa-arrow-down"></i>Drop students here</div>`);
    const dropAttrs = isBusyElsewhere ? '' : `ondragover="event.preventDefault()" ondragenter="this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="this.classList.remove('drag-over');handleSeatDrop(event,'${r.name.replace(/'/g, "\\'")}')"`;
    return `
      <div class="seat-room${isBusyElsewhere ? ' seat-room-busy' : ''}" data-status="${row.status}" ${dropAttrs}>
        <div class="seat-room-header">
          <div class="seat-room-name"><i class="fas fa-door-open"></i> ${r.name}</div>
          <span class="seat-room-count">${isBusyElsewhere ? 'In Use' : `${row.allocated}/${row.capacity}`}</span>
        </div>
        <div class="seat-room-bar"><div class="seat-room-bar-fill" style="width:${isBusyElsewhere ? 100 : pct}%"></div></div>
        <div class="seat-room-body">${occupantRows}</div>
      </div>
    `;
  }).join('');

  const selectableRooms = data.rooms.filter(r => !alloc.rows.find(x => x.room === r.name).busyWith);

  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Manual mode: drag a student onto a room, or check several and use Move Selected. Drag out of a room and onto Unassigned to undo.</div>
      ${toolbar}
      ${overflowAlert}
      <div class="seating-toolbar-row">
        <div class="seating-selected-chip${seatingSelectedIds.size ? ' active' : ''}"><i class="fas fa-check-square"></i> ${seatingSelectedIds.size} selected</div>
        <select class="form-control" id="bulkAssignRoomSelect"><option value="">Move selected to room...</option>${selectableRooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('')}</select>
        <button class="btn btn-sm btn-primary" onclick="bulkAssignSelectedToRoom(document.getElementById('bulkAssignRoomSelect').value)"><i class="fas fa-arrow-right"></i> Move Selected</button>
      </div>
      <div class="seating-manual-grid">
        <div class="card seat-unassigned-panel" ondragover="event.preventDefault()" ondragenter="this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="this.classList.remove('drag-over');handleSeatUnassignDrop(event)">
          <div class="card-header"><h3><i class="fas fa-user-graduate"></i> Unassigned (${alloc.unassigned.length})</h3>
            <label class="seat-select-all"><input type="checkbox" ${allChecked ? 'checked' : ''} onclick="toggleSeatSelectAll(${JSON.stringify(alloc.unassigned.map(s => s.id))}, this.checked)"> Select all</label>
          </div>
          <div class="card-body">
            <div class="seat-unassigned-body">
              ${unassignedRows}
            </div>
          </div>
        </div>
        <div class="seating-room-grid">
          ${roomCards}
        </div>
      </div>
    </div>
  `;
}

// Every timetable slot index that runs at the same actual date+time as the
// given one — since a real exam day schedules many programs' papers side by
// side, several slot indices can share a date/session while genuinely
// overlapping in time. Seating and Invigilator both use this so "one room,
// one exam at a time" and "one invigilator, one room at a time" hold across
// those simultaneous slots, not just within a single slot index.
function getSimultaneousSlotIndices(slotIndex) {
  const slots = data.timetableSlots;
  const target = slots[slotIndex];
  if (!target) return [slotIndex];
  const targetRange = parseSlotTimeRange(target.time);
  return slots.reduce((acc, s, i) => {
    if (s.date !== target.date) return acc;
    if (i === slotIndex) { acc.push(i); return acc; }
    const range = parseSlotTimeRange(s.time);
    if ([targetRange.start, targetRange.end, range.start, range.end].some(Number.isNaN)) return acc;
    if (targetRange.start < range.end && range.start < targetRange.end) acc.push(i);
    return acc;
  }, []);
}

// ============================================================
// INVIGILATOR
// ============================================================
let selectedInvigilatorSlotIndex = 0;
// Which room Status the duty chart table is narrowed to ('' = all).
let invigilatorStatusFilter = '';
// Keyed by exam-slot index, so each date/session keeps its own independent
// set of room assignments instead of one shared static table.
const invigilatorDuty = {};

function getInvigilatorAssignments(slotIndex) {
  if (!invigilatorDuty[slotIndex]) {
    const unassignedRoomIdx = data.rooms.length - 1;
    const pendingRoomIdx = data.rooms.length - 2;
    // Each room holds a *list* of faculty (facultyIds) rather than one, so a
    // large hall can get a primary invigilator plus a backup/second.
    invigilatorDuty[slotIndex] = data.rooms.map((r, i) => {
      if (i === unassignedRoomIdx) {
        return { room: r.name, facultyIds: [], status: 'Not Assigned' };
      }
      const faculty = data.faculty[(i + slotIndex) % data.faculty.length];
      return { room: r.name, facultyIds: [faculty.id], status: i === pendingRoomIdx ? 'Pending' : 'Confirmed' };
    });
  }
  return invigilatorDuty[slotIndex];
}

function findFaculty(facultyId) {
  return data.faculty.find(f => f.id === facultyId);
}

function changeInvigilatorSlot(value) {
  selectedInvigilatorSlotIndex = Number(value);
  invigilatorStatusFilter = '';
  showPage('invigilator');
}

function filterInvigilatorStatus(value) {
  invigilatorStatusFilter = value;
  showPage('invigilator');
}

function unassignInvigilator(slotIndex, room, facultyId) {
  const assignments = getInvigilatorAssignments(slotIndex);
  const a = assignments.find(x => x.room === room);
  if (!a) return;
  const faculty = findFaculty(facultyId);
  showActionModal('Unassign Invigilator', `Remove ${faculty ? faculty.name : 'this invigilator'} from ${room} duty for this session?`, {
    icon: 'fa-user-minus', iconColor: 'var(--danger)', confirmLabel: 'Unassign', confirmClass: 'btn-danger', confirmIcon: 'fa-user-minus',
    onConfirm: function () {
      a.facultyIds = a.facultyIds.filter(id => id !== facultyId);
      if (a.facultyIds.length === 0) a.status = 'Not Assigned';
      showPage('invigilator');
      showToast((faculty ? faculty.name : 'Invigilator') + ' removed from ' + room);
    }
  });
}

// Stashed so the Room dropdown's onchange (a global handler, since it's
// wired up via an inline HTML attribute) can look up who's currently in
// whichever room was just selected.
let assignInvigilatorModalAssignments = null;

function updateAssignInvigilatorRoomInfo() {
  const room = document.getElementById('assignInvigilatorRoom').value;
  const infoEl = document.getElementById('assignInvigilatorRoomInfo');
  if (!infoEl || !assignInvigilatorModalAssignments) return;
  const a = assignInvigilatorModalAssignments.find(x => x.room === room);
  const names = a && a.facultyIds.length ? a.facultyIds.map(fid => findFaculty(fid).name).join(', ') : 'No one yet';
  infoEl.textContent = `Currently in ${room}: ${names}`;
}

// Every room assignment across every timetable slot that runs at the same
// actual date+time as slotIndex — a real exam day schedules several
// programs' papers side by side, each tracked as its own slot index, but a
// faculty member obviously can't invigilate two of them simultaneously just
// because they're different subjects. Each entry is tagged with which slot/
// subject it belongs to, so a room name alone doesn't have to carry that
// context.
function getSimultaneousInvigilatorAssignments(slotIndex) {
  return getSimultaneousSlotIndices(slotIndex).flatMap(i =>
    getInvigilatorAssignments(i).map(a => ({ ...a, slotIndex: i, subject: data.timetableSlots[i].subject }))
  );
}

function openAssignInvigilatorModal(slotIndex, prefilledRoom) {
  const assignments = getInvigilatorAssignments(slotIndex);
  assignInvigilatorModalAssignments = assignments;
  const allAssignments = getSimultaneousInvigilatorAssignments(slotIndex);
  // A room can hold several invigilators (primary + backup for a large
  // hall), but one invigilator can only ever be in one room per session —
  // so the Room dropdown lists every room, while the Faculty list below
  // shows (and disables) anyone already committed elsewhere this session,
  // whether that's another room in this same exam or a different program's
  // exam running at the same time.
  const summaryLines = assignments.filter(a => a.facultyIds.length).map(a => `<strong>${a.room}:</strong> ${a.facultyIds.map(fid => findFaculty(fid).name).join(', ')}`);
  const summaryBox = summaryLines.length
    ? `<div class="alert alert-info" style="margin-bottom:12px">Currently assigned this session:<br>${summaryLines.join('<br>')}</div>`
    : '';
  const initialRoom = (prefilledRoom && assignments.some(a => a.room === prefilledRoom)) ? prefilledRoom : assignments[0].room;
  const initialRoomAssignment = assignments.find(a => a.room === initialRoom);
  const initialRoomNames = initialRoomAssignment && initialRoomAssignment.facultyIds.length
    ? initialRoomAssignment.facultyIds.map(fid => findFaculty(fid).name).join(', ')
    : 'No one yet';
  openFormModal('Assign Invigilator', `
    ${summaryBox}
    <div class="form-group"><label>Room</label>
      <select class="form-control" id="assignInvigilatorRoom" onchange="updateAssignInvigilatorRoomInfo()">
        ${assignments.map(a => `<option value="${a.room}" ${a.room === prefilledRoom ? 'selected' : ''}>${a.room}${a.facultyIds.length ? ` (${a.facultyIds.length} assigned)` : ''}</option>`).join('')}
      </select>
      <div id="assignInvigilatorRoomInfo" class="text-muted" style="font-size:12px;margin-top:4px">Currently in ${initialRoom}: ${initialRoomNames}</div>
    </div>
    <div class="form-group"><label>Faculty <span class="text-muted" style="font-weight:400">(check as many as needed — greyed out means already assigned elsewhere at this date/time)</span></label>
      <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;padding:8px 12px">
        ${data.faculty.map(f => {
          const busyElsewhere = allAssignments.filter(a => a.facultyIds.includes(f.id));
          const isBusy = busyElsewhere.length > 0;
          const busyLabel = busyElsewhere.map(a => a.slotIndex === slotIndex ? a.room : `${a.room} — ${a.subject}`).join(', ');
          return `
          <label style="display:flex;align-items:center;gap:8px;padding:6px 0;${isBusy ? 'cursor:not-allowed;opacity:.55' : 'cursor:pointer'}">
            <input type="checkbox" class="assign-invigilator-faculty-cb" value="${f.id}" ${isBusy ? 'disabled' : ''}>
            <span>${f.name} (${f.id})${isBusy ? ` <span class="text-muted">— already in ${busyLabel}</span>` : ''}</span>
          </label>`;
        }).join('')}
      </div>
    </div>
  `, 'Assign', function () {
    const room = document.getElementById('assignInvigilatorRoom').value;
    const facultyIds = Array.from(document.querySelectorAll('.assign-invigilator-faculty-cb:checked')).map(cb => cb.value);
    if (facultyIds.length === 0) {
      showToast('Select at least one faculty member');
      return;
    }
    const a = assignments.find(x => x.room === room);
    const added = [];
    const skipped = [];
    facultyIds.forEach(facultyId => {
      if (a && a.facultyIds.includes(facultyId)) {
        skipped.push(`${findFaculty(facultyId).name} (already in ${room})`);
        return;
      }
      // One invigilator can only be in one room at a time — checkboxes for
      // anyone already elsewhere (this exam or a simultaneous one) are
      // disabled, but re-check here too in case assignments changed since
      // the modal opened.
      const clash = allAssignments.find(x => !(x.slotIndex === slotIndex && x.room === room) && x.facultyIds.includes(facultyId));
      if (clash) {
        skipped.push(`${findFaculty(facultyId).name} (already in ${clash.room}${clash.slotIndex !== slotIndex ? ` — ${clash.subject}` : ''})`);
        return;
      }
      if (a) {
        a.facultyIds.push(facultyId);
        added.push(findFaculty(facultyId).name);
      }
    });
    if (a && added.length && a.status === 'Not Assigned') a.status = 'Confirmed';
    closeModal();
    showPage('invigilator');
    if (added.length) {
      showToast(`${added.join(', ')} assigned to ${room}` + (skipped.length ? ` — skipped: ${skipped.join(', ')}` : ''));
    } else {
      showToast(`No one assigned — skipped: ${skipped.join(', ')}`);
    }
  });
}

function validateInvigilatorConflicts(slotIndex) {
  const allAssignments = getSimultaneousInvigilatorAssignments(slotIndex);
  const byFaculty = {};
  allAssignments.forEach(a => {
    a.facultyIds.forEach(fid => {
      (byFaculty[fid] = byFaculty[fid] || []).push(a.slotIndex === slotIndex ? a.room : `${a.room} (${a.subject})`);
    });
  });
  const conflicts = Object.entries(byFaculty).filter(([, rooms]) => rooms.length > 1);
  if (conflicts.length === 0) {
    showActionModal('Validate Conflicts', 'Checked all invigilator assignments across every exam running at this date/time — no faculty member is assigned to more than one room at once.', {
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
  // Each slot in this fixed timetable is exactly one subject, so a Subject
  // dropdown is just another way to jump to the same slot index — handy
  // once you know the paper but not the date offhand.
  const subjectOptions = slots.map((s, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${s.subject} (${s.code})</option>`).join('');
  const statusClass = { Confirmed: 'badge-success', Pending: 'badge-warning', 'Not Assigned': 'badge-danger' };

  // The Invigilator login is one shared generic account, not tied to a
  // specific faculty record, so F01 stands in as "you" here — enough to
  // demonstrate the view-only restriction without inventing a real identity
  // system. Exam Branch / Admin still get the full management view.
  const isInvigilatorRole = typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.role === 'invigilator';
  const myFacultyId = 'F01';

  const statusAccent = { Confirmed: 'var(--success)', Pending: 'var(--warning)', 'Not Assigned': 'var(--danger)' };
  const displayAssignments = invigilatorStatusFilter ? assignments.filter(a => a.status === invigilatorStatusFilter) : assignments;
  const rows = displayAssignments.map(a => {
    const isMine = isInvigilatorRole && a.facultyIds.includes(myFacultyId);
    const invigilatorCell = a.facultyIds.length
      ? a.facultyIds.map(fid => {
          const faculty = findFaculty(fid);
          if (!faculty) return '';
          const initials = faculty.name.replace(/^(Dr\.|Prof\.)\s*/, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const removeBtn = isInvigilatorRole ? '' : `<button class="btn btn-sm btn-danger" onclick="unassignInvigilator(${idx}, '${a.room}', '${fid}')" title="Unassign"><i class="fas fa-times"></i></button>`;
          return `<div class="flex-center" style="margin-bottom:4px;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initials}</div><span>${faculty.name}</span>${removeBtn}</div>`;
        }).join('')
      : `<span class="text-muted">— Unassigned —</span>`;
    const contactCell = a.facultyIds.length
      ? a.facultyIds.map(fid => `<span class="badge badge-neutral" style="margin-bottom:4px"><i class="fas fa-id-badge"></i> ${fid}</span>`).join('<br>')
      : `<span class="text-muted">—</span>`;
    const action = isInvigilatorRole
      ? (isMine ? `<span class="badge badge-info">You</span>` : '')
      : `<button class="btn btn-sm btn-primary" onclick="openAssignInvigilatorModal(${idx}, '${a.room}')"><i class="fas fa-plus"></i> Add</button>`;
    return `<tr${isMine ? ' style="background:var(--primary-light)"' : ''}>
      <td style="border-left:3px solid ${statusAccent[a.status]};font-weight:600">${a.room}</td>
      <td>${slot.subject}</td>
      <td>${invigilatorCell}</td>
      <td>${contactCell}</td>
      <td><span class="badge ${statusClass[a.status]}">${a.status}</span></td>
      <td>${action}</td>
    </tr>`;
  }).join('');
  const unassignedCount = assignments.filter(a => a.facultyIds.length === 0).length;
  const pendingCount = assignments.filter(a => a.status === 'Pending').length;
  const confirmedCount = assignments.filter(a => a.status === 'Confirmed').length;
  const modeAlert = isInvigilatorRole
    ? 'View-only: this is the published duty chart for your session. Contact the Exam Branch for any reassignment.'
    : 'Assign faculty members to examination rooms. System checks for conflicts.';
  const actionButtons = isInvigilatorRole
    ? ''
    : `<button class="btn btn-primary btn-sm" onclick="openAssignInvigilatorModal(${idx})"><i class="fas fa-plus"></i> Assign</button>
        <button class="btn btn-sm" style="margin-left:auto" onclick="validateInvigilatorConflicts(${idx})"><i class="fas fa-check"></i> Validate Conflicts</button>
        <button class="btn btn-sm" onclick="publishInvigilatorDutyChart(${idx}, '${slotLabel}')"><i class="fas fa-file-pdf"></i> Publish Duty Chart</button>`;
  const statusFilterSelect = `<select class="form-control" onchange="filterInvigilatorStatus(this.value)">
    <option value="">All Statuses</option>
    <option value="Confirmed" ${invigilatorStatusFilter === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
    <option value="Pending" ${invigilatorStatusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
    <option value="Not Assigned" ${invigilatorStatusFilter === 'Not Assigned' ? 'selected' : ''}>Not Assigned</option>
  </select>`;
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeInvigilatorSlot(this.value)">${slotOptions}</select>
        <select class="form-control" onchange="changeInvigilatorSlot(this.value)">${subjectOptions}</select>
        ${statusFilterSelect}
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${confirmedCount} Confirmed</span>
        ${pendingCount ? `<span class="chip"><i class="fas fa-clock" style="color:#d97706"></i> ${pendingCount} Pending</span>` : ''}
        ${unassignedCount ? `<span class="chip"><i class="fas fa-exclamation-circle" style="color:#dc2626"></i> ${unassignedCount} Unassigned</span>` : ''}
        ${actionButtons}
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-chalkboard-teacher"></i> Invigilator Duty Chart — ${slotLabel}</h3><div class="flex gap-2" style="align-items:center"><input type="text" class="form-control" style="max-width:200px" placeholder="Search rooms/faculty..." oninput="liveSearchTable(this)"><span class="text-muted">${assignments.length - unassignedCount} / ${assignments.length} rooms assigned</span></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Room</th><th>Subject</th><th>Invigilator</th><th>Contact</th><th>Status</th><th></th></tr>
              ${rows || '<tr><td colspan="6" class="text-center text-muted" style="padding:20px">No rooms match this Status filter.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
