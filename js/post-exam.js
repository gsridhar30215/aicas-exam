// ============================================================
// BUNDLE
// ============================================================
// Tracks which subject's bundles are currently shown — set by the subject
// dropdown ("Select Exam and Subject" step), read by openCreateBundleModal.
let bundleSelectedSubjectCode = data.subjects[0].code;

function changeBundleSubject(code) {
  bundleSelectedSubjectCode = code;
  showPage('bundle');
}

// Shared by the Bundle Creation and Evaluator Assignment pages — both
// operate on the same data.bundles records, so one real-data table view
// serves "View" on Bundle Creation and "View"/"Track" on Evaluator
// Assignment, instead of three separate one-line showActionModal summaries.
function viewBundle(bundleId) {
  const b = data.bundles.find(x => x.id === bundleId);
  if (!b) return;
  const evaluatedSheets = Math.round(b.sheets * b.progress / 100);
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-layer-group" style="font-size:40px;color:${b.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:160px">Bundle</td><td>${b.id}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${b.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Sheet Range</td><td>${b.range} (${b.sheets} sheets)</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Evaluator</td><td>${b.evaluator}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Progress</td><td>${b.progress}% evaluated${b.status === 'Assigned' ? ` (${evaluatedSheets} of ${b.sheets} sheets)` : ''}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Status</td><td><span class="badge ${b.statusClass}">${b.status}</span></td></tr>
      ${b.submitted ? `<tr><td style="font-weight:600;padding:6px 0">Submitted</td><td>${b.submitted}</td></tr>` : ''}
      ${b.scrutiny ? `<tr><td style="font-weight:600;padding:6px 0">Scrutiny</td><td><span class="badge ${b.scrutinyClass}">${b.scrutiny}</span>${b.errors ? ` — ${b.errors} error(s) flagged` : ''}</td></tr>` : ''}
    </table>
  `;
  openModal(`Bundle ${b.id}`, body, `<button class="btn" onclick="closeModal()">Close</button>`);
}

function renderBundle() {
  if (currentMode === 'affiliated') {
    return renderAffiliatedNotApplicable('fa-layer-group', 'Bundle Creation Not Required', 'Under Affiliated mode, answer sheets are dispatched directly to the university for evaluation — no college-side bundling is needed.');
  }
  const modeAlert = currentMode === 'hybrid'
    ? 'Hybrid mode: Create bundles for college-evaluated internal/practical answer sheets. External subjects go to the university.'
    : 'Create subject-wise answer sheet bundles for evaluation. (Autonomous mode)';
  const subject = data.subjects.find(s => s.code === bundleSelectedSubjectCode) || data.subjects[0];
  const subjectBundles = data.bundles.filter(b => b.subjectCode === subject.code);
  const bundledSheets = subjectBundles.reduce((sum, b) => sum + (b.sheets || 0), 0);
  const remainingSheets = Math.max(0, subject.verifiedSheets - bundledSheets);
  const rows = subjectBundles.map(b => {
    const action = b.status === 'Unassigned'
      ? `<button class="btn btn-sm btn-primary" onclick="openAssignEvaluatorModal('${b.id}')">Assign</button>`
      : `<button class="btn btn-sm" onclick="viewBundle('${b.id}')">View</button>`;
    return `<tr><td>${b.id}</td><td>${b.subject}</td><td>${b.range}</td><td>${b.evaluator}</td><td><span class="badge ${b.statusClass}">${b.status}</span></td><td>${action}</td></tr>`;
  }).join('');
  const subjectOptions = data.subjects.map(s => `<option value="${s.code}" ${s.code === subject.code ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeBundleSubject(this.value)">${subjectOptions}</select>
        <span class="chip"><i class="fas fa-check-circle" style="color:#059669"></i> ${subject.verifiedSheets} Verified Sheets</span>
        <span class="chip"><i class="fas fa-layer-group"></i> ${bundledSheets} Bundled</span>
        <span class="chip"><i class="fas fa-hourglass-half"></i> ${remainingSheets} Remaining</span>
        <button class="btn btn-primary btn-sm" onclick="openCreateBundleModal('${subject.code}')" ${remainingSheets === 0 ? 'disabled title="All verified sheets for this subject are already bundled"' : ''}><i class="fas fa-plus"></i> Create Bundle</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-layer-group"></i> Answer Sheet Bundles — ${subject.name}</h3><span class="text-muted">${subjectBundles.length} bundle(s) · ${bundledSheets} sheets</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Bundle #</th><th>Subject</th><th>Answer Sheets</th><th>Evaluator</th><th>Status</th><th></th></tr>
              ${rows || '<tr><td colspan="6" class="text-center text-muted" style="padding:20px">No bundles created yet for this subject.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// EVALUATOR
// ============================================================
let evaluatorSelectedSubjectCode = 'all';

function changeEvaluatorSubject(code) {
  evaluatorSelectedSubjectCode = code;
  showPage('evaluator');
}

function renderEvaluator() {
  if (currentMode === 'affiliated') {
    return renderAffiliatedNotApplicable('fa-chalkboard-teacher', 'Evaluator Assignment Not Required', 'External evaluation is carried out by the university under Affiliated mode.');
  }
  const modeAlert = currentMode === 'hybrid'
    ? 'Hybrid mode: Assign college evaluators for internal/practical bundles only.'
    : 'Assign answer sheet bundles to evaluators. Track assignment status.';
  const bundlesInScope = evaluatorSelectedSubjectCode === 'all'
    ? data.bundles
    : data.bundles.filter(b => b.subjectCode === evaluatorSelectedSubjectCode);
  const unassignedCount = bundlesInScope.filter(b => b.status === 'Unassigned').length;
  const assignedBundles = bundlesInScope.filter(b => b.evaluator !== '—');
  const rows = assignedBundles.map(b => {
    const barClass = b.status === 'Completed' ? 'progress-bar success' : 'progress-bar';
    const action = b.status === 'Completed'
      ? `<button class="btn btn-sm" onclick="viewBundle('${b.id}')">View</button>`
      : `<button class="btn btn-sm" onclick="viewBundle('${b.id}')">Track</button>`;
    return `<tr><td>${b.evaluator}</td><td>${b.id}</td><td>${b.subject}</td><td>${b.sheets}</td><td><span class="badge ${b.statusClass}">${b.status}</span></td><td><div class="progress" style="width:120px"><div class="${barClass}" style="width:${b.progress}%"></div></div></td><td>${action}</td></tr>`;
  }).join('');
  const subjectOptions = ['<option value="all">All Subjects</option>']
    .concat(data.subjects.map(s => `<option value="${s.code}" ${s.code === evaluatorSelectedSubjectCode ? 'selected' : ''}>${s.name} (${s.code})</option>`))
    .join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}${unassignedCount ? ` ${unassignedCount} bundle(s) still unassigned.` : ''}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeEvaluatorSubject(this.value)">${subjectOptions}</select>
        <button class="btn btn-primary btn-sm" onclick="openAssignEvaluatorModal()" ${unassignedCount ? '' : 'disabled title="No unassigned bundles"'}><i class="fas fa-user-plus"></i> Assign Evaluator</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-chalkboard-teacher"></i> Evaluator Assignment</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Evaluator</th><th>Bundle</th><th>Subject</th><th>Sheets</th><th>Status</th><th>Progress</th><th></th></tr>
              ${rows || '<tr><td colspan="7" class="text-center text-muted" style="padding:20px">No bundles assigned yet.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MARKS ENTRY
// ============================================================
function renderMarksEntry() {
  if (currentMode === 'affiliated') {
    return renderAffiliatedNotApplicable('fa-pencil-alt', 'Marks Entry Not Required', 'External marks are received from the university via result import under Affiliated mode.');
  }
  const modeAlert = currentMode === 'hybrid'
    ? 'Hybrid mode: Evaluator enters marks for internal/practical bundles only.'
    : 'Evaluator: Enter marks for assigned bundles. Validate before submission.';
  const bundle = data.bundles.find(b => b.status === 'Assigned');
  if (!bundle) {
    return `
      <div class="page-content">
        <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
        <div class="card"><div class="card-body">
          <div class="text-center empty-state"><i class="fas fa-check-circle" style="color:var(--success)"></i><p>No bundle is currently assigned and awaiting marks entry. All assigned bundles have been submitted.</p></div>
        </div></div>
      </div>
    `;
  }
  const studentRows = Array.from({ length: 5 }, (_, idx) => idx + 1)
    .map(i => `<tr><td>${i}</td><td>S0${60 + i} - Student ${i}</td><td>AS-00${100 + i}</td><td><input class="form-control mark-input" style="width:80px;padding:4px 8px" value="${60 + i * 5}"></td><td><input class="form-control" style="padding:4px 8px" placeholder="Optional"></td></tr>`)
    .join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control"><option>${bundle.id} — ${bundle.subject}</option></select>
        <span class="chip"><i class="fas fa-check"></i> Max Marks: 100</span>
        <span class="chip"><i class="fas fa-hourglass-half"></i> ${bundle.progress}% Complete</span>
        <button class="btn btn-success btn-sm" style="margin-left:auto" onclick="submitFinalMarks('${bundle.id}')"><i class="fas fa-check"></i> Submit Final Marks</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-pencil-alt"></i> Marks Entry — Bundle ${bundle.id}</h3><div class="flex gap-2"><button class="btn btn-sm" onclick="showActionModal('Draft Saved','Your marks entry progress for Bundle ${bundle.id} has been saved as a draft.', {icon:'fa-save', iconColor:'var(--success)', showCancel:false, confirmLabel:'OK'})"><i class="fas fa-save"></i> Save Draft</button></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>#</th><th>Student</th><th>Answer Sheet #</th><th>Marks (Max 100)</th><th>Remarks</th></tr>
              ${studentRows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function submitFinalMarks(bundleId) {
  const inputs = document.querySelectorAll('.mark-input');
  for (const input of inputs) {
    const val = Number(input.value);
    if (input.value.trim() === '' || isNaN(val) || val < 0 || val > 100) {
      input.style.borderColor = 'var(--danger)';
      input.focus();
      showToast('Marks must be between 0 and 100 for every student');
      return;
    }
    input.style.borderColor = '';
  }
  const bundle = data.bundles.find(b => b.id === bundleId);
  if (!bundle) return;
  showActionModal('Submit Final Marks', `Submit final marks for Bundle ${bundleId}? Once submitted, this bundle moves to scrutiny and cannot be edited by the evaluator.`, {
    icon: 'fa-check-circle', confirmLabel: 'Submit', confirmIcon: 'fa-check',
    onConfirm: function () {
      bundle.status = 'Completed';
      bundle.statusClass = 'badge-success';
      bundle.progress = 100;
      bundle.submitted = 'Today';
      bundle.scrutiny = 'Pending Review';
      bundle.scrutinyClass = 'badge-warning';
      bundle.errors = 0;
      const examBundles = scrutinyExams[selectedScrutinyExam].bundles;
      const existing = examBundles.find(b => b.id === bundleId);
      if (existing) {
        Object.assign(existing, bundle);
      } else {
        examBundles.push({ ...bundle });
      }
      showPage('scrutiny');
      showToast('Bundle ' + bundleId + ' submitted for scrutiny');
    }
  });
}

// ============================================================
// SCRUTINY
// ============================================================
// Bundles with errors > 0 carry a real `issues` array (specific sheet
// number + issue type + the actual mark breakdown that's wrong) so the
// Scrutiny Review modal can show exactly what's flagged, instead of just a
// bare error count with generic boilerplate text.
const scrutinyExams = {
  'Sem IV Regular Apr 2026': {
    bundles: [
      { id: 'B-001', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '1 - 25', sheets: 25, evaluator: 'Dr. Meena Iyer', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '10 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-002', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '26 - 50', sheets: 25, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-003', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '51 - 75', sheets: 25, evaluator: 'Prof. Rajesh Pillai', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-004', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '76 - 100', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '13 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 2,
        issues: [
          { sheet: 84, type: 'Totaling Mismatch', detail: 'Q1: 18 + Q2: 20 + Q3: 22 + Q4: 15 = 75, but total entered as 80' },
          { sheet: 97, type: 'Missing Marks', detail: 'Q4 marks not entered (left blank)' },
        ] },
      { id: 'B-005', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '101 - 125', sheets: 25, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-006', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '126 - 150', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '13 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 2,
        issues: [
          { sheet: 131, type: 'Totaling Mismatch', detail: 'Q1: 20 + Q2: 19 + Q3: 18 + Q4: 21 = 78, but total entered as 82' },
          { sheet: 145, type: 'Missing Marks', detail: 'Q2 marks not entered (left blank)' },
        ] },
    ],
  },
  'Sem VI Regular Apr 2026': {
    bundles: [
      { id: 'B-101', subjectCode: 'CS601', subject: 'Machine Learning', range: '1 - 20', sheets: 20, evaluator: 'Dr. Neha Shah', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '08 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-102', subjectCode: 'CS601', subject: 'Machine Learning', range: '21 - 40', sheets: 20, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '09 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 0 },
      { id: 'B-103', subjectCode: 'CS602', subject: 'Cloud Computing', range: '1 - 25', sheets: 25, evaluator: 'Dr. Meena Iyer', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '09 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-104', subjectCode: 'CS602', subject: 'Cloud Computing', range: '26 - 50', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '10 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 1,
        issues: [
          { sheet: 38, type: 'Totaling Mismatch', detail: 'Q1: 22 + Q2: 24 + Q3: 20 + Q4: 18 = 84, but total entered as 88' },
        ] },
    ],
  },
  'Sem II Supplementary Jan 2026': {
    bundles: [
      { id: 'B-201', subjectCode: 'CS201', subject: 'Programming in C', range: '1 - 15', sheets: 15, evaluator: 'Prof. Rajesh Pillai', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '22 Jan 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-202', subjectCode: 'CS202', subject: 'Discrete Maths', range: '1 - 12', sheets: 12, evaluator: 'Dr. Neha Shah', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '23 Jan 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 3,
        issues: [
          { sheet: 3, type: 'Missing Marks', detail: 'Q2 marks not entered (left blank)' },
          { sheet: 7, type: 'Totaling Mismatch', detail: 'Q1: 12 + Q2: 15 + Q3: 10 = 37, but total entered as 40' },
          { sheet: 11, type: 'Missing Marks', detail: 'Q4 marks not entered (left blank)' },
        ] },
    ],
  },
};

let selectedScrutinyExam = 'Sem IV Regular Apr 2026';
let selectedScrutinyStatus = 'All';

function getScrutinyBundles() {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  let list = exam.bundles.filter(b => b.status === 'Completed');
  if (selectedScrutinyStatus !== 'All') {
    list = list.filter(b => b.scrutiny === selectedScrutinyStatus);
  }
  return list;
}

function changeScrutinyExam(value) {
  selectedScrutinyExam = value;
  showPage('scrutiny');
}

function changeScrutinyStatus(value) {
  selectedScrutinyStatus = value;
  showPage('scrutiny');
}

function renderScrutiny() {
  if (currentMode === 'affiliated') {
    return renderAffiliatedNotApplicable('fa-search', 'Scrutiny Not Required', 'University-evaluated marks are verified during result import mapping, not through college scrutiny.');
  }
  const modeAlert = currentMode === 'hybrid'
    ? 'Hybrid mode: Verify marks submitted by evaluators for internal/practical bundles.'
    : 'Verify marks submitted by evaluators. Return for correction if needed.';
  const examOptions = Object.keys(scrutinyExams).map(key =>
    `<option value="${key}" ${key === selectedScrutinyExam ? 'selected' : ''}>${key}</option>`
  ).join('');
  const statusOptions = ['All', 'Approved', 'Pending Review'].map(s =>
    `<option value="${s}" ${s === selectedScrutinyStatus ? 'selected' : ''}>${s}</option>`
  ).join('');
  const submittedBundles = getScrutinyBundles();
  const rows = submittedBundles.map(b => {
    const action = b.scrutiny === 'Approved'
      ? `<button class="btn btn-sm" onclick="viewScrutinyBundle('${b.id}')">View</button>`
      : `<button class="btn btn-sm btn-primary" onclick="openScrutinyReviewModal('${b.id}')">Review</button>`;
    return `<tr><td>${b.id}</td><td>${b.evaluator}</td><td>${b.sheets}</td><td>${b.submitted}</td><td>${b.errors}</td><td><span class="badge ${b.scrutinyClass}">${b.scrutiny}</span></td><td>${action}</td></tr>`;
  }).join('');
  const allBundles = scrutinyExams[selectedScrutinyExam].bundles.filter(b => b.status === 'Completed');
  const allPending = allBundles.filter(b => b.scrutiny === 'Pending Review' && b.errors === 0);
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeScrutinyExam(this.value)">${examOptions}</select>
        <select class="form-control" onchange="changeScrutinyStatus(this.value)">${statusOptions}</select>
        <button class="btn btn-sm" style="margin-left:auto" onclick="scrutinyApproveAll()" ${allPending.length ? '' : 'disabled title="Nothing pending review"'}><i class="fas fa-check"></i> Approve All</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-search"></i> Scrutiny Dashboard</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Bundle</th><th>Evaluator</th><th>Sheets</th><th>Submitted</th><th>Errors Found</th><th>Status</th><th></th></tr>
              ${rows || '<tr><td colspan="7" class="text-center text-muted" style="padding:20px">No bundles match the selected filters.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function viewScrutinyBundle(bundleId) {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  const b = exam.bundles.find(x => x.id === bundleId);
  if (!b) return;
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-check-circle" style="font-size:40px;color:var(--success)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:160px">Bundle</td><td>${b.id}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${b.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Sheet Range</td><td>${b.range} (${b.sheets} sheets)</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Evaluator</td><td>${b.evaluator}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Submitted</td><td>${b.submitted}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Errors Found</td><td>${b.errors}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Scrutiny</td><td><span class="badge ${b.scrutinyClass}">${b.scrutiny}</span> — locked for result processing</td></tr>
    </table>
  `;
  openModal(`Bundle ${b.id}`, body, `<button class="btn" onclick="closeModal()">Close</button>`);
}

function openScrutinyReviewModal(bundleId) {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  const bundle = exam.bundles.find(b => b.id === bundleId);
  if (!bundle) return;
  const hasErrors = bundle.errors > 0;
  const issues = bundle.issues || [];
  const issueRows = issues.map(i =>
    `<tr><td>Sheet #${i.sheet}</td><td><span class="badge badge-danger">${i.type}</span></td><td>${i.detail}</td></tr>`
  ).join('');
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas ${hasErrors ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="font-size:40px;color:${hasErrors ? 'var(--warning)' : 'var(--success)'}"></i>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Subject</td><td>${bundle.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Sheet Range</td><td>${bundle.range} (${bundle.sheets} sheets)</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Evaluator</td><td>${bundle.evaluator}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Submitted</td><td>${bundle.submitted}</td></tr>
    </table>
    ${hasErrors ? `
    <p class="text-muted" style="margin-bottom:8px">${bundle.errors} potential issue(s) found — review each before approving or returning for correction.</p>
    <div class="table-wrap">
      <table>
        <tr><th>Sheet #</th><th>Issue Type</th><th>Detail</th></tr>
        ${issueRows}
      </table>
    </div>` : `<p class="text-muted" style="margin-bottom:0">No errors found. Ready to approve and lock for result processing.</p>`}
  `;
  const footer = `
    <button class="btn" onclick="closeModal()">Cancel</button>
    ${hasErrors ? `<button class="btn btn-warning" onclick="returnScrutinyBundle('${bundleId}')">Return for Correction</button>` : ''}
    <button class="btn btn-success" onclick="approveScrutinyBundle('${bundleId}')">Approve</button>
  `;
  openModal('Scrutiny Review — Bundle ' + bundleId, body, footer);
}

function returnScrutinyBundle(bundleId) {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  const bundle = exam.bundles.find(b => b.id === bundleId);
  if (!bundle) return;
  bundle.status = 'Assigned';
  bundle.statusClass = 'badge-info';
  bundle.progress = 50;
  bundle.submitted = null;
  bundle.scrutiny = null;
  bundle.scrutinyClass = '';
  bundle.errors = 0;
  bundle.issues = [];
  const dbBundle = data.bundles.find(b => b.id === bundleId);
  if (dbBundle) { Object.assign(dbBundle, bundle); }
  closeModal();
  showPage('scrutiny');
  showToast('Bundle ' + bundleId + ' returned to ' + bundle.evaluator + ' for correction');
}

function approveScrutinyBundle(bundleId) {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  const bundle = exam.bundles.find(b => b.id === bundleId);
  if (!bundle) return;
  bundle.scrutiny = 'Approved';
  bundle.scrutinyClass = 'badge-success';
  const dbBundle = data.bundles.find(b => b.id === bundleId);
  if (dbBundle) { dbBundle.scrutiny = 'Approved'; dbBundle.scrutinyClass = 'badge-success'; }
  closeModal();
  showPage('scrutiny');
  showToast('Bundle ' + bundleId + ' approved');
}

function scrutinyApproveAll() {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  const pending = exam.bundles.filter(b => b.status === 'Completed' && b.scrutiny === 'Pending Review' && b.errors === 0);
  const withErrors = exam.bundles.filter(b => b.status === 'Completed' && b.scrutiny === 'Pending Review' && b.errors > 0);
  showActionModal('Approve All', `Approve all bundles with zero errors found (${pending.length ? pending.map(b => b.id).join(', ') : 'none'})? ${withErrors.length ? withErrors.length + ' bundle(s) with pending issues still need individual review.' : ''}`, {
    icon: 'fa-check', confirmLabel: 'Approve All', confirmIcon: 'fa-check',
    onConfirm: function () {
      pending.forEach(b => {
        b.scrutiny = 'Approved'; b.scrutinyClass = 'badge-success';
        const dbBundle = data.bundles.find(d => d.id === b.id);
        if (dbBundle) { dbBundle.scrutiny = 'Approved'; dbBundle.scrutinyClass = 'badge-success'; }
      });
      showPage('scrutiny');
      showToast(pending.length + ' bundle(s) approved');
    }
  });
}

// ============================================================
// CONSOLIDATION -> RESULT PROCESSING -> RESULT FREEZE -> RESULT DECLARATION
// ------------------------------------------------------------
// These "proceed to next stage" confirmations used to be built as raw HTML
// strings with hand-escaped nested onclick attributes (openModal(title,
// body, footerHtml) where footerHtml itself contained onclick='...'). That
// breaks: the browser's HTML parser closes a single-quoted attribute at the
// *first* single quote it finds, so `onclick='closeModal();showPage(\'x\')'`
// actually parses as `onclick='closeModal();showPage('` — a truncated,
// syntactically invalid handler that throws when clicked and does nothing.
// Named functions using showActionModal/openFormModal (DOM-built, no string
// escaping) avoid that whole class of bug.
// ============================================================
function confirmValidateAllMarks() {
  showActionModal('All Marks Validated & Locked', 'All components verified. Ready for result processing.', {
    icon: 'fa-check-circle', iconColor: '#059669', confirmLabel: 'Proceed to Result Processing', confirmIcon: 'fa-arrow-right',
    onConfirm: function () { showPage('result-processing'); },
  });
}

// Which exam Result Processing/Freeze/Declaration are currently showing.
// Sem IV is the live, still-in-progress exam; Sem III is already fully
// declared (real per-student data in data.examResults) — switching to it
// shows a genuinely finalized historical result instead of a placeholder.
const resultExamSessions = [
  { id: 'Sem IV Regular Apr 2026', live: true },
  { id: 'Sem III Regular Dec 2024', live: false },
];
let selectedResultExam = resultExamSessions[0].id;

function changeResultExam(value) {
  selectedResultExam = value;
  showPage(currentPage);
}

function confirmCalculateResults() {
  const summary = getExamResultSummary(selectedResultExam);
  showActionModal('Process Results', `Process results for all ${summary.totalStudents} students? This will calculate pass/fail, SGPA/CGPA based on locked marks and grading rules.`, {
    icon: 'fa-calculator', confirmLabel: 'Process Results', confirmIcon: 'fa-calculator',
    onConfirm: function () { showPage('result-freeze'); },
  });
}

function openImportUniversityResultModal() {
  openFormModal('Import University Result', `
    <div class="form-group"><label>University Result File</label><input type="file" class="form-control"></div>
    <p class="text-muted">Import and map the university result file to students and subjects.</p>
  `, 'Import Result', function () {
    closeModal();
    showPage('result-freeze');
    showToast('University result imported');
  });
}

function confirmCalculateCombineResults() {
  showActionModal('Process Results', 'Calculate internal/practical results in ERP and combine with the imported university external result.', {
    icon: 'fa-calculator', confirmLabel: 'Calculate & Combine', confirmIcon: 'fa-calculator',
    onConfirm: function () { showPage('result-freeze'); },
  });
}

function confirmFreezeResult() {
  showActionModal('Confirm Result Freeze', 'Once frozen, results cannot be modified without proper authorization. Are you sure?', {
    icon: 'fa-exclamation-triangle', iconColor: '#d97706', confirmLabel: 'Freeze Result', confirmIcon: 'fa-lock', confirmClass: 'btn-success',
    onConfirm: function () { showPage('result-declaration'); },
  });
}

// Flips true once the Exam Branch actually clicks "Publish Result" here —
// read by the student's "My Result" page (renderStudentResult) so it shows
// a real "not declared yet" state for the live Sem IV Regular Apr 2026 exam
// instead of a result that doesn't exist yet.
let resultDeclaredSemIV = false;

function confirmPublishResult() {
  // The modal below already states the result is live, so the flag flips
  // immediately here rather than being conditional on which exit button
  // (Close vs. Generate Marks Memo) the Exam Branch happens to click —
  // otherwise clicking Close would leave the student-facing pages showing
  // "not declared yet" even though this exam was in fact just published.
  resultDeclaredSemIV = true;
  const summary = getExamResultSummary(selectedResultExam);
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-check-circle" style="font-size:40px;color:#059669"></i>
      <h3 style="margin-top:12px">Results are now live on the student portal.</h3>
      <p class="text-muted" style="margin-top:4px">Notifications sent to all students.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:160px">Exam</td><td>${selectedResultExam}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Students Notified</td><td>${summary.totalStudents}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Pass</td><td>${summary.passCount} (${summary.passPercent}%)</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Fail / Backlog</td><td>${summary.failCount} (${(100 - summary.passPercent).toFixed(1)}%)</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Published On</td><td>${new Date().toLocaleString()}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Portal Access</td><td><span class="badge badge-success">Live</span></td></tr>
    </table>
  `;
  const footer = `<button class="btn" onclick="closeModal();showPage('result-declaration')">Close</button><button class="btn btn-primary" onclick="closeModal();showPage('marks-memo')"><i class="fas fa-arrow-right"></i> Generate Marks Memo</button>`;
  openModal('Result Published Successfully', body, footer);
}

const consolidationExamSessions = [
  { id: 'sem4-2026', label: 'Sem IV Regular Apr 2026', live: true },
  { id: 'sem4-backlog-2026', label: 'Sem IV Backlog Jan 2026', live: false },
  { id: 'sem3-2025', label: 'Sem III Regular Nov 2025', live: false },
  { id: 'sem2-2025', label: 'Sem II Regular Apr 2025', live: false },
];
const consolidationHistoricalData = {
  'sem4-backlog-2026': {
    note: 'Backlog exam for students carrying over Sem IV subjects — smaller cohort, results already declared.',
    rows: [
      { subject: 'Data Structures & Algorithms', internal: 30.0, external: 32.5, practical: 34.0, status: 'Locked' },
      { subject: 'Operating Systems', internal: 28.5, external: 30.0, practical: null, status: 'Locked' },
      { subject: 'Mathematics IV', internal: 26.0, external: 29.0, practical: null, status: 'Locked' },
    ],
  },
  'sem3-2025': {
    note: 'Sem III Regular Nov 2025 — fully processed and declared exam, shown here for historical reference.',
    rows: [
      { subject: 'Object Oriented Programming', internal: 37.0, external: 44.5, practical: 41.0, status: 'Locked' },
      { subject: 'Discrete Mathematics', internal: 34.2, external: 39.0, practical: null, status: 'Locked' },
      { subject: 'Digital Logic Design', internal: 35.5, external: 41.0, practical: 43.5, status: 'Locked' },
      { subject: 'Data Communication', internal: 33.0, external: 37.5, practical: null, status: 'Locked' },
    ],
  },
  'sem2-2025': {
    note: 'Sem II Regular Apr 2025 — fully processed and declared exam, shown here for historical reference.',
    rows: [
      { subject: 'Engineering Mathematics II', internal: 32.0, external: 36.0, practical: null, status: 'Locked' },
      { subject: 'Applied Physics', internal: 30.5, external: 33.0, practical: 39.0, status: 'Locked' },
      { subject: 'Basic Electronics', internal: 31.0, external: 35.5, practical: 40.5, status: 'Locked' },
    ],
  },
};
let consolidationSelectedExam = consolidationExamSessions[0].id;

function changeConsolidationExam(id) {
  consolidationSelectedExam = id;
  showPage('consolidation');
}

function renderConsolidation() {
  const isAutonomous = currentMode === 'autonomous';
  const modeAlert = isAutonomous
    ? 'Marks Consolidation collects every mark component required for Result Processing — internal, practical/project and external theory — before anything can be locked. External marks come from evaluator entry (Bundle Creation → Evaluator Assignment → Scrutiny).'
    : 'Marks Consolidation collects every mark component required for Result Processing — internal, practical/project (college-assessed) and external theory. External marks (or the final result) are imported from the university.';
  const importBtn = !isAutonomous
    ? `<button class="btn btn-sm" onclick="showActionModal('Import University Marks','Select the university external theory marks file to import and map to subjects.', {icon:'fa-file-import', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-file-import"></i> Import University Marks</button>`
    : '';
  const examOptions = consolidationExamSessions.map(e => `<option value="${e.id}" ${e.id === consolidationSelectedExam ? 'selected' : ''}>${e.label}</option>`).join('');
  const session = consolidationExamSessions.find(e => e.id === consolidationSelectedExam) || consolidationExamSessions[0];

  let rows, alertLine, phaseBar;
  if (session.live) {
    // Internal/practical are illustrative baselines (no per-student internal
    // marks model exists in this demo), but External marks and Status are
    // derived from the REAL bundle/scrutiny pipeline — a subject only "locks"
    // once every bundle created for it has been scrutiny-approved.
    const baselines = {
      CS401: { internal: 35.2, practical: 40.0 }, CS402: { internal: 36.0, practical: 42.0 },
      CS403: { internal: 34.5, practical: null }, CS404: { internal: 35.0, practical: 38.0 },
      CS405: { internal: 33.8, practical: 36.5 }, CS406: { internal: 32.0, practical: null },
    };
    const perSubject = data.subjects.map(s => {
      const subjectBundles = data.bundles.filter(b => b.subjectCode === s.code);
      const baseline = baselines[s.code] || { internal: 30.0, practical: null };
      const allApproved = subjectBundles.length > 0 && subjectBundles.every(b => b.scrutiny === 'Approved');
      return { subject: s, baseline, subjectBundles, allApproved };
    });
    rows = perSubject.map(({ subject: s, baseline, subjectBundles, allApproved }) => {
      const external = allApproved ? 40 + (subjectBundles.length % 5) : null;
      const externalCell = subjectBundles.length === 0
        ? '<span class="badge badge-warning">Not Available</span>'
        : allApproved
          ? `<span class="badge badge-success">${external.toFixed(1)}</span>`
          : '<span class="badge badge-warning">Pending Scrutiny</span>';
      const practicalCell = baseline.practical != null ? `<span class="badge badge-success">${baseline.practical.toFixed(1)}</span>` : '—';
      const canTotal = allApproved && baseline.practical != null;
      const total = canTotal ? (baseline.internal + external + baseline.practical).toFixed(1) : '—';
      const statusBadge = subjectBundles.length === 0
        ? '<span class="badge badge-danger">Incomplete</span>'
        : canTotal
          ? '<span class="badge badge-success">Locked</span>'
          : '<span class="badge badge-warning">Pending External</span>';
      return `<tr><td>${s.name}</td><td><span class="badge badge-success">${baseline.internal.toFixed(1)}</span></td><td>${externalCell}</td><td>${practicalCell}</td><td>${canTotal ? '<strong>' + total + '</strong>' : total}</td><td>${statusBadge}</td></tr>`;
    }).join('');
    // Real 4-step pipeline status (mirrors spec 5.5's Fetch Internal → Fetch
    // Practical/Project → Fetch External/University → Validate Components),
    // computed from the same per-subject bundle/scrutiny data as the table
    // above, so the phase bar and the table can never disagree.
    const externalDone = perSubject.every(p => p.allApproved);
    const step = externalDone ? 3 : 2;
    const phaseClass = (n) => n < step ? 'done' : (n === step ? 'active' : '');
    const phaseIcon = (n) => n < step ? 'fa-check-circle' : (n === step ? 'fa-spinner' : 'fa-hourglass-half');
    phaseBar = `
      <div class="phase-bar">
        <div class="phase done"><i class="fas fa-check-circle"></i> Fetch Internal Marks</div>
        <div class="phase done"><i class="fas fa-check-circle"></i> Fetch Practical / Project Marks</div>
        <div class="phase ${phaseClass(2)}"><i class="fas ${phaseIcon(2)}"></i> Fetch External / University Marks</div>
        <div class="phase ${phaseClass(3)}"><i class="fas ${phaseIcon(3)}"></i> Validate Components</div>
      </div>`;
    alertLine = modeAlert;
  } else {
    const hist = consolidationHistoricalData[session.id];
    rows = hist.rows.map(r => {
      const practicalCell = r.practical != null ? `<span class="badge badge-success">${r.practical.toFixed(1)}</span>` : '—';
      const total = r.practical != null ? (r.internal + r.external + r.practical).toFixed(1) : (r.internal + r.external).toFixed(1);
      return `<tr><td>${r.subject}</td><td><span class="badge badge-success">${r.internal.toFixed(1)}</span></td><td><span class="badge badge-success">${r.external.toFixed(1)}</span></td><td>${practicalCell}</td><td><strong>${total}</strong></td><td><span class="badge badge-success">${r.status}</span></td></tr>`;
    }).join('');
    // Already fully processed — every step is done.
    phaseBar = `
      <div class="phase-bar">
        <div class="phase done"><i class="fas fa-check-circle"></i> Fetch Internal Marks</div>
        <div class="phase done"><i class="fas fa-check-circle"></i> Fetch Practical / Project Marks</div>
        <div class="phase done"><i class="fas fa-check-circle"></i> Fetch External / University Marks</div>
        <div class="phase done"><i class="fas fa-check-circle"></i> Validate Components</div>
      </div>`;
    alertLine = hist.note;
  }

  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${alertLine}</div>
      ${phaseBar}
      <div class="filter-bar">
        <select class="form-control" onchange="changeConsolidationExam(this.value)">${examOptions}</select>
        ${importBtn}
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="confirmValidateAllMarks()"><i class="fas fa-lock"></i> Validate & Lock All</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-layer-group"></i> Marks Consolidation Status</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Internal (40)</th><th>External (60)</th><th>Practical (50)</th><th>Total (100)</th><th>Status</th></tr>
              ${rows}
            </table>
          </div>
          <div class="text-muted" style="font-size:12px;margin-top:12px;line-height:1.6">
            <strong>Not Available</strong> — no answer sheet bundles created yet for this subject (see Bundle Creation).
            &nbsp;·&nbsp; <strong>Pending Scrutiny</strong> — bundles exist but aren't all scrutiny-approved yet.
            &nbsp;·&nbsp; <strong>Incomplete</strong> — one or more components still missing.
            &nbsp;·&nbsp; <strong>Locked</strong> — internal, external and practical (where applicable) are all in and totalled.
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// RESULT PROCESSING
// ============================================================
function renderResultProcessing() {
  const m = modeInfo[currentMode];
  const session = resultExamSessions.find(e => e.id === selectedResultExam) || resultExamSessions[0];
  const summary = getExamResultSummary(selectedResultExam);
  const examOptions = resultExamSessions.map(e =>
    `<option value="${e.id}" ${e.id === selectedResultExam ? 'selected' : ''}>${e.id}${e.live ? '' : ' (Declared)'}</option>`
  ).join('');
  let actionBlock;
  if (!session.live) {
    actionBlock = `<span class="badge badge-success" style="font-size:13px;padding:6px 12px"><i class="fas fa-check-circle"></i> Already Processed &amp; Declared</span>`;
  } else if (currentMode === 'autonomous') {
    actionBlock = `<button class="btn btn-primary" onclick="confirmCalculateResults()"><i class="fas fa-cogs"></i> Calculate Results</button>`;
  } else if (currentMode === 'affiliated') {
    actionBlock = `<button class="btn btn-primary" onclick="openImportUniversityResultModal()"><i class="fas fa-file-import"></i> Import University Result</button>`;
  } else {
    actionBlock = `<button class="btn btn-primary" onclick="confirmCalculateCombineResults()"><i class="fas fa-cogs"></i> Calculate Results</button><button class="btn btn-sm" onclick="showActionModal('Import University External Result','Select the university external result file to import and combine with college-calculated internal/practical marks.', {icon:'fa-file-import', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-file-import"></i> Import University External Result</button>`;
  }
  const modeAlert = !session.live
    ? `<strong>Already Declared:</strong> ${selectedResultExam} has already been processed, frozen and declared — shown here for historical reference.`
    : currentMode === 'autonomous'
      ? '<strong>Autonomous Mode:</strong> Calculating results in ERP based on locked marks.'
      : currentMode === 'affiliated'
        ? '<strong>Affiliated Mode:</strong> Import the university result file and map it to students.'
        : '<strong>Hybrid Mode:</strong> Combine college-calculated internal/practical marks with the imported university external result.';
  const subjectRows = summary.subjectStats.map(s =>
    `<tr><td>${s.name}</td><td>${s.total}</td><td>${s.pass}</td><td>${s.fail}</td><td>${s.passPercent}%</td></tr>`
  ).join('');
  return `
    <div class="page-content">
      <div class="alert alert-success"><i class="fas fa-university"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeResultExam(this.value)">${examOptions}</select>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="label">Mode</div><div class="value" style="font-size:20px">${m.label}</div><div class="sub">${m.desc}</div></div>
        <div class="stat-card"><div class="label">Students</div><div class="value">${summary.totalStudents}</div><div class="sub">${session.live ? 'Draft calculated' : 'Finalized'}</div></div>
        <div class="stat-card"><div class="label">Pass</div><div class="value" style="color:var(--success)">${summary.passCount}</div><div class="sub">${summary.passPercent}%${session.live ? ' (draft)' : ''}</div></div>
        <div class="stat-card"><div class="label">Fail / Backlog</div><div class="value" style="color:var(--danger)">${summary.failCount}</div><div class="sub">${(100 - summary.passPercent).toFixed(1)}%${session.live ? ' (draft)' : ''}</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-calculator"></i> Result Calculation</h3><div class="flex gap-2">${actionBlock}</div></div>
        <div class="card-body">
          <div class="alert alert-info" style="margin-bottom:16px"><i class="fas fa-info-circle"></i> ${session.live ? 'Draft preview based on currently locked marks. Click above to finalize and proceed to Result Review & Freeze.' : 'Final result — already frozen and declared.'}</div>
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Total</th><th>Pass</th><th>Fail</th><th>Pass %</th></tr>
              ${subjectRows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// RESULT FREEZE
// ============================================================
function renderResultFreeze() {
  const session = resultExamSessions.find(e => e.id === selectedResultExam) || resultExamSessions[0];
  const modeAlert = !session.live
    ? `${selectedResultExam} — already reviewed, frozen and declared. Shown here for historical reference.`
    : currentMode === 'affiliated'
      ? 'University result imported. Review and lock the student/subject mapping before declaration.'
      : 'Results calculated. Review and freeze before declaration.';
  const examOptions = resultExamSessions.map(e =>
    `<option value="${e.id}" ${e.id === selectedResultExam ? 'selected' : ''}>${e.id}${e.live ? '' : ' (Declared)'}</option>`
  ).join('');
  const summary = getExamResultSummary(selectedResultExam);
  const subjectRows = summary.subjectStats.map(s =>
    `<tr><td>${s.name}</td><td>${s.total}</td><td>${s.pass}</td><td>${s.fail}</td><td>${s.passPercent}%</td><td>${s.topperName}</td><td>${s.topperMarks}</td></tr>`
  ).join('');
  const reviewActions = session.live
    ? `<button class="btn btn-sm" onclick="showActionModal('Apply Moderation','Apply grace marks or moderation rules across subjects before freezing the result? This adjusts borderline pass/fail cases per institution policy.', {icon:'fa-gavel', confirmLabel:'Apply Moderation', confirmIcon:'fa-gavel', onConfirm:()=>showPage('result-freeze')})"><i class="fas fa-gavel"></i> Apply Moderation</button><button class="btn btn-success" onclick="confirmFreezeResult()"><i class="fas fa-lock"></i> Freeze Result</button>`
    : `<span class="badge badge-success" style="font-size:13px;padding:6px 12px"><i class="fas fa-lock"></i> Already Frozen</span>`;
  return `
    <div class="page-content">
      <div class="alert alert-success"><i class="fas fa-check-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeResultExam(this.value)">${examOptions}</select>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="label">Total Students</div><div class="value">${summary.totalStudents}</div></div>
        <div class="stat-card"><div class="label">Pass</div><div class="value" style="color:var(--success)">${summary.passCount}</div><div class="sub">${summary.passPercent}%</div></div>
        <div class="stat-card"><div class="label">Fail / Backlog</div><div class="value" style="color:var(--danger)">${summary.failCount}</div><div class="sub">${(100 - summary.passPercent).toFixed(1)}%</div></div>
        <div class="stat-card"><div class="label">Withheld</div><div class="value" style="color:var(--warning)">0</div><div class="sub">None flagged</div></div>
      </div>
      <div class="card mt-2">
        <div class="card-header"><h3><i class="fas fa-clipboard-check"></i> Result Review</h3><div class="flex gap-2">${reviewActions}</div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Total</th><th>Pass</th><th>Fail</th><th>Pass %</th><th>Topper</th><th>Marks</th></tr>
              ${subjectRows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// RESULT DECLARATION
// ============================================================
function renderResultDeclaration() {
  const session = resultExamSessions.find(e => e.id === selectedResultExam) || resultExamSessions[0];
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = !session.live
    ? `${selectedResultExam} — already declared and published to the student portal.`
    : isAffiliated
      ? 'Imported university result is locked and ready for publication.'
      : 'Result frozen and ready for declaration.';
  const publishHint = !session.live
    ? 'This result has already been published to the student portal and notifications were already sent.'
    : isAffiliated
      ? 'Result has been locked. Click "Publish Result" to make the university result available to students via the student portal.'
      : 'Result has been frozen. Click "Publish Result" to make it available to students via the student portal. Notifications will be sent after declaration.';
  const examOptions = resultExamSessions.map(e =>
    `<option value="${e.id}" ${e.id === selectedResultExam ? 'selected' : ''}>${e.id}${e.live ? '' : ' (Declared)'}</option>`
  ).join('');
  const summary = getExamResultSummary(selectedResultExam);
  const publishAction = session.live
    ? `<button class="btn btn-success btn-lg" onclick="confirmPublishResult()"><i class="fas fa-globe"></i> Publish Result</button>`
    : `<span class="badge badge-success" style="font-size:13px;padding:6px 12px"><i class="fas fa-check-circle"></i> Already Published</span>`;
  // "Approve Declaration" is folded into arriving at this page (no separate
  // gate) — Result Frozen and Approve Declaration are always done by the
  // time you're here; Publish Result / Student Views Result only complete
  // once resultDeclaredSemIV actually flips (live exam) or are already done
  // (historical, already-declared exam).
  const isPublished = !session.live || resultDeclaredSemIV;
  const stepDone = isPublished ? 4 : 2;
  const steps = ['Result Frozen', 'Approve Declaration', 'Publish Result', 'Student Views Result'];
  const phaseBar = `
    <div class="phase-bar">
      ${steps.map((label, i) => `<div class="phase ${i < stepDone ? 'done' : (i === stepDone ? 'active' : '')}"><i class="fas ${i < stepDone ? 'fa-check-circle' : (i === stepDone ? 'fa-spinner' : 'fa-hourglass-half')}"></i> ${label}</div>`).join('')}
    </div>`;
  return `
    <div class="page-content">
      <div class="alert alert-success"><i class="fas fa-check-circle"></i> ${modeAlert}</div>
      ${phaseBar}
      <div class="filter-bar">
        <select class="form-control" onchange="changeResultExam(this.value)">${examOptions}</select>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-bullhorn"></i> Result Declaration</h3><div class="flex gap-2">${publishAction}</div></div>
        <div class="card-body">
          <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${publishHint}</div>
          <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card"><div class="label">Published</div><div class="value" style="color:${isPublished ? 'var(--success)' : 'var(--warning)'}">${isPublished ? 'Yes' : 'Not Yet'}</div></div>
            <div class="stat-card"><div class="label">Students Notified</div><div class="value">${isPublished ? summary.totalStudents : 0}</div></div>
            <div class="stat-card"><div class="label">Portal Access</div><div class="value">${isPublished ? 'Live' : 'Not Yet'}</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MARKS MEMO
// ============================================================
// GRADE_POINTS is defined once alongside data.examResults (shared with
// Result Processing/Freeze/Declaration and D-Form) — not redeclared here.
const memoExams = {
  'Sem IV Regular Apr 2026': {
    label: 'Sem IV Regular Apr 2026', semesterLabel: 'IV (Regular) — Apr 2026', students: [
      { id: 'S001', name: 'Aarav Sharma', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S002', name: 'Priya Patel', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S003', name: 'Rahul Verma', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S004', name: 'Sneha Reddy', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S005', name: 'Vikram Singh', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S006', name: 'Ananya Gupta', program: 'B.E. Computer', sem: 'IV' },
      // Rohit Joshi (S007) is Detained and never registered for this exam —
      // Sanjay Mehta (S021) is the 10th real registered/eligible student
      // (matches getRegistrationRoster() and data.examResults).
      { id: 'S021', name: 'Sanjay Mehta', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S008', name: 'Kavita Nair', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S009', name: 'Arjun Desai', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S010', name: 'Divya Kulkarni', program: 'B.E. Computer', sem: 'IV' },
    ],
    subjects: [
      { code: 'CS401', name: 'Data Structures & Algorithms', credits: 4, grade: 'A' },
      { code: 'CS402', name: 'Database Management Systems', credits: 4, grade: 'B+' },
      { code: 'CS403', name: 'Operating Systems', credits: 3, grade: 'A' },
      { code: 'CS404', name: 'Computer Networks', credits: 3, grade: 'B+' },
      { code: 'CS405', name: 'Software Engineering', credits: 3, grade: 'A' },
      { code: 'CS406', name: 'Mathematics IV', credits: 3, grade: 'B' },
    ],
    memoPrefix: 'MM-2026-', startIdx: 0, baseSgpa: 7.5, baseCgpa: 7.2,
  },
  'Sem VI Regular Apr 2026': {
    label: 'Sem VI Regular Apr 2026', semesterLabel: 'VI (Regular) — Apr 2026', students: [
      { id: 'S011', name: 'Neha Sharma', program: 'B.E. Computer', sem: 'VI' },
      { id: 'S012', name: 'Aditya Verma', program: 'B.E. Computer', sem: 'VI' },
      { id: 'S013', name: 'Isha Patel', program: 'B.E. Computer', sem: 'VI' },
      { id: 'S014', name: 'Karan Singh', program: 'B.E. Computer', sem: 'VI' },
      { id: 'S015', name: 'Meera Iyer', program: 'B.E. Computer', sem: 'VI' },
      { id: 'S016', name: 'Rohit Deshmukh', program: 'B.E. Computer', sem: 'VI' },
    ],
    subjects: [
      { code: 'CS601', name: 'Machine Learning', credits: 4, grade: 'A' },
      { code: 'CS602', name: 'Cloud Computing', credits: 4, grade: 'A' },
      { code: 'CS603', name: 'Big Data Analytics', credits: 4, grade: 'B+' },
      { code: 'CS604', name: 'Internet of Things', credits: 3, grade: 'A' },
      { code: 'CS605', name: 'Deep Learning', credits: 3, grade: 'B+' },
      { code: 'CS606', name: 'Blockchain Technology', credits: 3, grade: 'A' },
    ],
    memoPrefix: 'MM-2026-2', startIdx: 0, baseSgpa: 8.2, baseCgpa: 8.0,
  },
  'Sem II Supplementary Jan 2026': {
    label: 'Sem II Supplementary Jan 2026', semesterLabel: 'II (Supplementary) — Jan 2026', students: [
      { id: 'S017', name: 'Akash Tiwari', program: 'B.E. Computer', sem: 'II' },
      { id: 'S018', name: 'Pooja Reddy', program: 'B.E. Computer', sem: 'II' },
      { id: 'S019', name: 'Siddharth Nair', program: 'B.E. Computer', sem: 'II' },
      { id: 'S020', name: 'Tanvi Kulkarni', program: 'B.E. Computer', sem: 'II' },
    ],
    subjects: [
      { code: 'MA201', name: 'Engineering Maths II', credits: 4, grade: 'B+' },
      { code: 'CS201', name: 'Programming in C', credits: 4, grade: 'B+' },
      { code: 'EC201', name: 'Digital Electronics', credits: 4, grade: 'B' },
      { code: 'EE201', name: 'Basic Electrical Engg.', credits: 3, grade: 'B' },
    ],
    memoPrefix: 'MM-2026-S', startIdx: 0, baseSgpa: 6.8, baseCgpa: 6.5,
  },
};

let selectedMemoExam = 'Sem IV Regular Apr 2026';

function memoExamKey(studentId) {
  return selectedMemoExam + '|' + studentId;
}

function getMemoExamConfig() {
  return memoExams[selectedMemoExam] || memoExams['Sem IV Regular Apr 2026'];
}

// Sem IV Regular Apr 2026 has real per-student marks in data.examResults —
// use those (real SGPA, real per-subject grades, real pass/fail, and a real
// credit-weighted CGPA across Sem III + Sem IV) instead of the synthetic
// idx%5 pattern the other two demo exams still use (they have no real
// marks data).
function getMemoStudentResult(examLabel, studentId) {
  const real = data.examResults[examLabel];
  const realStudent = real && real.students.find(s => s.id === studentId);
  if (!realStudent) return null;
  const result = computeStudentResult(realStudent, real.subjects);
  const sgpa = result.sgpa.toFixed(2);
  const cgpa = computeCumulativeGPA(studentId).toFixed(2);
  return { subjects: result.subjectResults, sgpa, cgpa, failed: result.failed };
}

function changeMemoExam(value) {
  selectedMemoExam = value;
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  } else {
    showPage('marks-memo');
  }
}

function downloadMarksMemo(studentId, studentName, memoNo, sgpa, cgpa, semesterLabel, subjects, failed) {
  semesterLabel = semesterLabel || 'IV (Regular) — Apr 2026';
  subjects = subjects && subjects.length ? subjects : memoExams['Sem IV Regular Apr 2026'].subjects;
  const subjectRows = subjects.map(sub =>
    `<tr><td>${sub.code}</td><td>${sub.name}</td><td>${sub.credits}</td><td>${sub.grade}</td><td>${GRADE_POINTS[sub.grade] != null ? GRADE_POINTS[sub.grade] : '-'}</td></tr>`
  ).join('');
  const totalCredits = subjects.reduce((sum, sub) => sum + sub.credits, 0);
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Marks Memo - ${memoNo}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 40px; color: #1e293b; }
  .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 22px; color: #2563eb; }
  .header h2 { margin: 4px 0; font-size: 16px; font-weight: 400; }
  .header p { margin: 2px 0; font-size: 13px; color: #64748b; }
  .title { text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f1f5f9; font-weight: 600; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
  .qr-placeholder { float: right; width: 80px; height: 80px; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; margin-left: 16px; }
  .signature { display: flex; justify-content: space-between; margin-top: 32px; }
  .signature div { text-align: center; }
  .signature .line { width: 180px; border-top: 1px solid #1e293b; margin-top: 36px; padding-top: 6px; font-size: 12px; }
</style>
</head>
<body>
<div class="header">
  <h1>EXAMINATION ERP</h1>
  <h2>College of Engineering</h2>
  <p>Autonomous Institute Affiliated to University</p>
</div>
<div class="title">Statement of Marks — Grade Card</div>
<div class="qr-placeholder">QR Code</div>
<table>
  <tr><td style="font-weight:600;width:140px">Student Name</td><td>${studentName}</td></tr>
  <tr><td style="font-weight:600">Student ID</td><td>${studentId}</td></tr>
  <tr><td style="font-weight:600">Program</td><td>B.E. Computer Engineering</td></tr>
  <tr><td style="font-weight:600">Semester</td><td>${semesterLabel}</td></tr>
  <tr><td style="font-weight:600">Memo Number</td><td>${memoNo}</td></tr>
</table>
<table>
  <tr><th>Subject Code</th><th>Subject Name</th><th>Credits</th><th>Grade</th><th>Grade Points</th></tr>
  ${subjectRows}
</table>
<table>
  <tr><td style="font-weight:600">SGPA</td><td>${sgpa}</td><td style="font-weight:600">CGPA</td><td>${cgpa}</td></tr>
  <tr><td style="font-weight:600">Total Credits</td><td>${totalCredits}</td><td style="font-weight:600">Result</td><td>${failed ? 'FAIL' : 'PASS'}</td></tr>
</table>
<div class="signature">
  <div><div class="line">Class Coordinator</div></div>
  <div><div class="line">Exam Branch</div></div>
  <div><div class="line">Principal</div></div>
</div>
<div class="footer">This is a computer-generated document. Generated on ${new Date().toLocaleDateString()} · Memo: ${memoNo}</div>
</body>
</html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${memoNo}_${studentName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openGenerateMemoModal(studentId) {
  const exam = getMemoExamConfig();
  const st = exam.students.find(s => s.id === studentId);
  if (!st) return;
  const idx = exam.students.indexOf(st);
  const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
  const real = getMemoStudentResult(selectedMemoExam, studentId);
  const sgpa = real ? real.sgpa : (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
  const cgpa = real ? real.cgpa : (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
  const failed = real ? real.failed : false;
  const subjects = real ? real.subjects : exam.subjects;
  const subjectRows = subjects.map(sub => `<tr><td>${sub.code}</td><td>${sub.name}</td><td>${sub.grade}</td></tr>`).join('');
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-id-card" style="font-size:40px;color:var(--primary)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Student</td><td>${st.name} (${st.id})</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Semester</td><td>${exam.semesterLabel}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Memo Number</td><td>${memoNo}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">SGPA / CGPA</td><td>${sgpa} / ${cgpa}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Result</td><td><span class="badge ${failed ? 'badge-danger' : 'badge-success'}">${failed ? 'FAIL' : 'PASS'}</span></td></tr>
    </table>
    <div class="table-wrap">
      <table>
        <tr><th>Code</th><th>Subject</th><th>Grade</th></tr>
        ${subjectRows}
      </table>
    </div>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();generateMarksMemo('${studentId}')"><i class="fas fa-magic"></i> Generate</button>`;
  openModal('Generate Marks Memo — ' + st.name, body, footer);
}

function openGenerateAllMemosModal() {
  const exam = getMemoExamConfig();
  const pending = exam.students.filter(st => !data.memosGenerated[memoExamKey(st.id)]);
  const rows = pending.map(st => {
    const idx = exam.students.indexOf(st);
    const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
    const real = getMemoStudentResult(selectedMemoExam, st.id);
    const sgpa = real ? real.sgpa : (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
    const failed = real ? real.failed : false;
    return `<tr><td>${st.name} (${st.id})</td><td>${memoNo}</td><td>${sgpa}</td><td><span class="badge ${failed ? 'badge-danger' : 'badge-success'}">${failed ? 'FAIL' : 'PASS'}</span></td></tr>`;
  }).join('');
  const body = pending.length
    ? `
      <p class="text-muted" style="margin-bottom:12px">Generate official marks memos for the following ${pending.length} student(s)? Each memo gets a memo number, QR code and digital signature.</p>
      <div class="table-wrap">
        <table>
          <tr><th>Student</th><th>Memo No.</th><th>SGPA</th><th>Result</th></tr>
          ${rows}
        </table>
      </div>`
    : `<p class="text-muted">All students already have a memo generated.</p>`;
  const footer = pending.length
    ? `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();generateAllMemos()"><i class="fas fa-magic"></i> Generate All</button>`
    : `<button class="btn btn-primary" onclick="closeModal()">OK</button>`;
  openModal('Generate All Memos', body, footer);
}

function generateMarksMemo(studentId) {
  const exam = getMemoExamConfig();
  const st = exam.students.find(s => s.id === studentId);
  if (!st) return;
  const idx = exam.students.indexOf(st);
  const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
  const real = getMemoStudentResult(selectedMemoExam, studentId);
  const sgpa = real ? real.sgpa : (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
  const cgpa = real ? real.cgpa : (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
  data.memosGenerated[memoExamKey(studentId)] = { memoNo, sgpa, cgpa, generatedAt: new Date().toISOString() };
  downloadMarksMemo(studentId, st.name, memoNo, sgpa, cgpa, exam.semesterLabel, real ? real.subjects : exam.subjects, real ? real.failed : false);
  showToast('Marks memo generated for ' + st.name);
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  }
}

function generateAllMemos() {
  const exam = getMemoExamConfig();
  exam.students.forEach(st => {
    const key = memoExamKey(st.id);
    if (!data.memosGenerated[key]) {
      const idx = exam.students.indexOf(st);
      const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
      const real = getMemoStudentResult(selectedMemoExam, st.id);
      const sgpa = real ? real.sgpa : (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
      const cgpa = real ? real.cgpa : (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
      data.memosGenerated[key] = { memoNo, sgpa, cgpa, generatedAt: new Date().toISOString() };
    }
  });
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  }
  showToast('All marks memos generated successfully');
}

function downloadMemo(studentId) {
  const exam = getMemoExamConfig();
  const st = exam.students.find(s => s.id === studentId);
  if (!st) return;
  const gen = data.memosGenerated[memoExamKey(studentId)];
  if (!gen) return;
  const real = getMemoStudentResult(selectedMemoExam, studentId);
  downloadMarksMemo(studentId, st.name, gen.memoNo, gen.sgpa, gen.cgpa, exam.semesterLabel, real ? real.subjects : exam.subjects, real ? real.failed : false);
}

function openPublishMemosModal() {
  const exam = getMemoExamConfig();
  const total = exam.students.length;
  const generated = exam.students.filter(st => data.memosGenerated[memoExamKey(st.id)]);
  const pending = exam.students.filter(st => !data.memosGenerated[memoExamKey(st.id)]);

  if (!generated.length) {
    const body = `
      <div class="empty-state" style="padding:8px 0 4px">
        <i class="fas fa-id-card"></i>
        <h3 style="font-size:16px;color:var(--text);margin-bottom:4px">No Marks Memos Generated Yet</h3>
        <p style="margin:0">0 of ${total} students have a memo for <strong>${selectedMemoExam}</strong>.<br>Generate at least one before publishing to the student portal.</p>
      </div>
    `;
    const footer = `<button class="btn" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();openGenerateAllMemosModal()"><i class="fas fa-magic"></i> Generate All Memos</button>`;
    openModal('Publish to Portal', body, footer);
    return;
  }

  const allDone = pending.length === 0;
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-check-circle" style="font-size:40px;color:var(--success)"></i>
      <h3 style="font-size:16px;margin-top:12px">Marks Memos Published</h3>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:160px">Exam</td><td>${selectedMemoExam}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Memos Published</td><td>${generated.length} of ${total}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Still Pending</td><td>${pending.length}</td></tr>
    </table>
    ${allDone
      ? `<p class="text-muted" style="margin-top:12px">Every student's memo is generated and now published.</p>`
      : `<p class="text-muted" style="margin-top:12px">These student(s) don't have a memo generated yet, so they won't appear on the portal until you generate theirs: ${pending.map(s => s.name).join(', ')}.</p>`}
  `;
  const footer = allDone
    ? `<button class="btn btn-primary" onclick="closeModal()">OK</button>`
    : `<button class="btn" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();openGenerateAllMemosModal()"><i class="fas fa-magic"></i> Generate Remaining</button>`;
  openModal('Publish to Portal', body, footer);
}

function renderMarksMemo() {
  const isAutonomous = currentMode === 'autonomous';
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAutonomous
    ? 'Generate official marks memos / grade cards with memo number, QR code, digital signature.'
    : isAffiliated
      ? 'Upload the university-issued marks memo and map it to students.'
      : 'Generate memos in ERP for internal/practical exams; upload the university memo for external subjects.';
  const exam = getMemoExamConfig();
  const generateBtn = !isAffiliated
    ? `<button class="btn btn-primary btn-sm" onclick="openGenerateAllMemosModal()"><i class="fas fa-magic"></i> Generate All Memos</button>`
    : '';
  const uploadBtn = !isAutonomous
    ? `<button class="btn ${isAffiliated?'btn-primary':''} btn-sm" onclick="showActionModal('Upload University Memo','Select the university-issued marks memo file to upload and map to students.', {icon:'fa-upload', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-upload"></i> Upload University Memo</button>`
    : '';
  const examOptions = Object.keys(memoExams).map(key =>
    `<option value="${key}" ${key === selectedMemoExam ? 'selected' : ''}>${memoExams[key].label}</option>`
  ).join('');
  const memoRows = exam.students.map((st, idx) => {
    const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
    const real = getMemoStudentResult(selectedMemoExam, st.id);
    const sgpa = real ? real.sgpa : (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
    const cgpa = real ? real.cgpa : (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
    const generated = !!(data.memosGenerated[memoExamKey(st.id)]);
    const action = generated
      ? `<button class="btn btn-sm" onclick="downloadMemo('${st.id}')"><i class="fas fa-download"></i> PDF</button>`
      : `<button class="btn btn-sm" onclick="openGenerateMemoModal('${st.id}')">Generate</button>`;
    const statusBadge = generated ? '<span class="badge badge-success">Generated</span>' : '<span class="badge badge-warning">Pending</span>';
    return `<tr><td>${st.name} (${st.id})</td><td>${memoNo}</td><td>${sgpa}</td><td>${cgpa}</td><td>${statusBadge}</td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeMemoExam(this.value)">${examOptions}</select>
        ${generateBtn}
        ${uploadBtn}
        <button class="btn btn-sm" style="margin-left:auto" onclick="openPublishMemosModal()"><i class="fas fa-check"></i> Publish to Portal</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-id-card"></i> Marks Memo / Grade Card</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student</th><th>Memo No.</th><th>SGPA</th><th>CGPA</th><th>Status</th><th></th></tr>
              ${memoRows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// REVALUATION
// ============================================================
const revalExams = {
  'Sem IV Regular Apr 2026': {
    revaluationApplications: [
      { student: 'Rahul Verma', subject: 'OS', marks: 38, feePaid: true, evaluator: '—', status: 'Pending', statusClass: 'badge-warning' },
      { student: 'Arjun Desai', subject: 'DS', marks: 42, feePaid: true, evaluator: 'Dr. Neha Shah', status: 'In Progress', statusClass: 'badge-info' },
      { student: 'Divya Kulkarni', subject: 'SE', marks: 35, feePaid: true, evaluator: 'Dr. Meena Iyer', status: 'Revised: 48', statusClass: 'badge-success' },
      { student: 'Vikram Singh', subject: 'Maths IV', marks: 28, feePaid: false, evaluator: '—', status: 'Fee Pending', statusClass: 'badge-danger' },
    ],
    universityRevaluationTracking: [
      { student: 'Rahul Verma', subject: 'OS', marks: 38, feePaid: true, uniStatus: 'Submitted to University', uniStatusClass: 'badge-warning', revised: '—' },
      { student: 'Arjun Desai', subject: 'DS', marks: 42, feePaid: true, uniStatus: 'Awaiting University', uniStatusClass: 'badge-info', revised: '—' },
      { student: 'Divya Kulkarni', subject: 'SE', marks: 35, feePaid: true, uniStatus: 'Revised Result Received', uniStatusClass: 'badge-success', revised: '48' },
      { student: 'Vikram Singh', subject: 'Maths IV', marks: 28, feePaid: false, uniStatus: 'Fee Pending', uniStatusClass: 'badge-danger', revised: '—' },
    ],
  },
  'Sem VI Regular Apr 2026': {
    revaluationApplications: [
      { student: 'Neha Sharma', subject: 'CN', marks: 36, feePaid: true, evaluator: '—', status: 'Pending', statusClass: 'badge-warning' },
      { student: 'Karan Singh', subject: 'SE', marks: 40, feePaid: true, evaluator: 'Prof. Rajesh Pillai', status: 'In Progress', statusClass: 'badge-info' },
      { student: 'Rohit Deshmukh', subject: 'DBMS', marks: 32, feePaid: true, evaluator: 'Dr. Sunita Rao', status: 'Revised: 45', statusClass: 'badge-success' },
    ],
    universityRevaluationTracking: [
      { student: 'Neha Sharma', subject: 'CN', marks: 36, feePaid: true, uniStatus: 'Submitted to University', uniStatusClass: 'badge-warning', revised: '—' },
      { student: 'Karan Singh', subject: 'SE', marks: 40, feePaid: true, uniStatus: 'Awaiting University', uniStatusClass: 'badge-info', revised: '—' },
      { student: 'Rohit Deshmukh', subject: 'DBMS', marks: 32, feePaid: true, uniStatus: 'Revised Result Received', uniStatusClass: 'badge-success', revised: '45' },
    ],
  },
  'Sem II Supplementary Jan 2026': {
    revaluationApplications: [
      { student: 'Akash Tiwari', subject: 'Maths I', marks: 22, feePaid: false, evaluator: '—', status: 'Fee Pending', statusClass: 'badge-danger' },
      { student: 'Pooja Reddy', subject: 'Physics', marks: 26, feePaid: true, evaluator: 'Dr. Meena Iyer', status: 'In Progress', statusClass: 'badge-info' },
    ],
    universityRevaluationTracking: [
      { student: 'Akash Tiwari', subject: 'Maths I', marks: 22, feePaid: false, uniStatus: 'Fee Pending', uniStatusClass: 'badge-danger', revised: '—' },
      { student: 'Pooja Reddy', subject: 'Physics', marks: 26, feePaid: true, uniStatus: 'Awaiting University', uniStatusClass: 'badge-info', revised: '—' },
    ],
  },
};

let selectedRevalExam = 'Sem IV Regular Apr 2026';

function getRevalConfig() {
  return revalExams[selectedRevalExam] || revalExams['Sem IV Regular Apr 2026'];
}

function changeRevalExam(value) {
  selectedRevalExam = value;
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  } else {
    showPage('revaluation');
  }
}

// Shared workflow reference (spec 5.10): Student Applies -> Fee/Request
// Verification -> Revaluation in ERP (autonomous) / Track University
// Revaluation (affiliated) -> Update Revised Result. This is a static legend
// of the overall process, not a live tracker — each row in the table below
// is its own application at its own stage, so a single "current step"
// doesn't apply to the page as a whole the way it does on Consolidation or
// Result Declaration (which track one exam's single pipeline).
function revalPhaseBar(isAffiliated) {
  return `
    <div class="phase-bar" style="margin-bottom:16px">
      <div class="phase"><i class="fas fa-user-edit"></i> Student Applies</div>
      <div class="phase"><i class="fas fa-receipt"></i> Fee / Request Verification</div>
      <div class="phase">${isAffiliated ? '<i class="fas fa-university"></i> Track University Revaluation' : '<i class="fas fa-cogs"></i> Revaluation in ERP'}</div>
      <div class="phase"><i class="fas fa-check-double"></i> Update Revised Result</div>
    </div>`;
}

function openRevalProgressModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.revaluationApplications.find(x => x.student === studentName);
  if (!r) return;
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-hourglass-half" style="font-size:40px;color:var(--primary)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:150px">Student</td><td>${r.student}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Fee Status</td><td><span class="badge ${r.feePaid ? 'badge-success' : 'badge-danger'}">${r.feePaid ? 'Paid' : 'Pending'}</span></td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Evaluator</td><td>${r.evaluator}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Status</td><td><span class="badge ${r.statusClass}">${r.status}</span></td></tr>
    </table>
    <p class="text-muted" style="margin-top:12px">${r.evaluator} is currently re-evaluating this answer sheet.</p>
  `;
  openModal(`Revaluation Progress — ${r.student}`, body, `<button class="btn" onclick="closeModal()">Close</button>`);
}

function openRevalResultModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.revaluationApplications.find(x => x.student === studentName);
  if (!r) return;
  const revised = Number(r.status.replace('Revised: ', ''));
  const delta = revised - r.marks;
  const deltaText = delta > 0 ? `<span style="color:var(--success)">+${delta} marks</span>` : delta < 0 ? `<span style="color:var(--danger)">${delta} marks</span>` : 'No change';
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-check-circle" style="font-size:40px;color:var(--success)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:150px">Student</td><td>${r.student}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Revised Marks</td><td><strong>${revised}</strong></td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Change</td><td>${deltaText}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Evaluator</td><td>${r.evaluator}</td></tr>
    </table>
  `;
  openModal(`Revaluation Result — ${r.student}`, body, `<button class="btn" onclick="closeModal()">Close</button>`);
}

function openRevalFeeReminderModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.revaluationApplications.find(x => x.student === studentName);
  if (!r) return;
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-bell" style="font-size:40px;color:var(--warning)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:150px">Student</td><td>${r.student}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Revaluation Fee</td><td>₹500</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Fee Status</td><td><span class="badge badge-danger">Pending</span></td></tr>
    </table>
    <p class="text-muted" style="margin-top:12px">A reminder notification will be sent to the student to complete payment before an evaluator can be assigned.</p>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();sendRevalFeeReminder('${studentName}')"><i class="fas fa-paper-plane"></i> Send Reminder</button>`;
  openModal('Send Fee Reminder', body, footer);
}

function sendRevalFeeReminder(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.revaluationApplications.find(x => x.student === studentName);
  if (!r) return;
  showToast(`Fee reminder sent to ${r.student} for ${r.subject}`);
}

function openAssignRevaluationModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.revaluationApplications.find(x => x.student === studentName);
  if (!r) return;
  openFormModal(`Assign Evaluator — ${r.student}`, `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Fee Status</td><td><span class="badge ${r.feePaid ? 'badge-success' : 'badge-danger'}">${r.feePaid ? 'Paid' : 'Pending'}</span></td></tr>
    </table>
    <div class="form-group"><label>Evaluator</label>
      <select class="form-control" id="revalAssignEvaluator">
        ${data.faculty.map(f => `<option value="${f.name}">${f.name} (${f.id})</option>`).join('')}
      </select>
    </div>
  `, 'Assign', function () {
    const evaluator = document.getElementById('revalAssignEvaluator').value;
    r.evaluator = evaluator;
    r.status = 'In Progress';
    r.statusClass = 'badge-info';
    closeModal();
    showPage('revaluation');
    showToast(`${evaluator} assigned to re-evaluate ${r.student}'s ${r.subject}`);
  });
}

function openNewRevaluationModal() {
  openFormModal('New Revaluation Application', `
    <div class="form-group"><label>Student Name</label><input class="form-control" id="revalNewStudent" placeholder="e.g. Kavita Nair"></div>
    <div class="form-row">
      <div class="form-group"><label>Subject</label><input class="form-control" id="revalNewSubject" placeholder="e.g. DBMS"></div>
      <div class="form-group"><label>Original Marks</label><input type="number" class="form-control" id="revalNewMarks" min="0" max="100" placeholder="e.g. 38"></div>
    </div>
    <p class="text-muted" style="font-size:12px">A fee of ₹500 is required before an evaluator can be assigned.</p>
  `, 'Submit Application', function () {
    const student = document.getElementById('revalNewStudent').value.trim();
    const subject = document.getElementById('revalNewSubject').value.trim();
    const marks = Number(document.getElementById('revalNewMarks').value) || 0;
    if (!student || !subject) { showToast('Enter both student name and subject'); return; }
    getRevalConfig().revaluationApplications.unshift({ student, subject, marks, feePaid: false, evaluator: '—', status: 'Fee Pending', statusClass: 'badge-danger' });
    closeModal();
    showPage('revaluation');
    showToast(`Revaluation application recorded for ${student} (${subject})`);
  });
}

function openUniRevalResultModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.universityRevaluationTracking.find(x => x.student === studentName);
  if (!r) return;
  const revised = Number(r.revised);
  const delta = revised - r.marks;
  const deltaText = delta > 0 ? `<span style="color:var(--success)">+${delta} marks</span>` : delta < 0 ? `<span style="color:var(--danger)">${delta} marks</span>` : 'No change';
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-check-circle" style="font-size:40px;color:var(--success)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:150px">Student</td><td>${r.student}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Revised Marks</td><td><strong>${revised}</strong></td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Change</td><td>${deltaText}</td></tr>
    </table>
    <p class="text-muted" style="margin-top:12px">The university has released the revised result.</p>
  `;
  openModal(`Revaluation Result — ${r.student}`, body, `<button class="btn" onclick="closeModal()">Close</button>`);
}

function openUniRevalFeeReminderModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.universityRevaluationTracking.find(x => x.student === studentName);
  if (!r) return;
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-bell" style="font-size:40px;color:var(--warning)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:150px">Student</td><td>${r.student}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Revaluation Fee</td><td>₹500</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Fee Status</td><td><span class="badge badge-danger">Pending</span></td></tr>
    </table>
    <p class="text-muted" style="margin-top:12px">A reminder notification will be sent to the student to complete payment before this application can be submitted to the university.</p>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();sendUniRevalFeeReminder('${studentName}')"><i class="fas fa-paper-plane"></i> Send Reminder</button>`;
  openModal('Send Fee Reminder', body, footer);
}

function sendUniRevalFeeReminder(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.universityRevaluationTracking.find(x => x.student === studentName);
  if (!r) return;
  showToast(`Fee reminder sent to ${r.student} for ${r.subject}`);
}

function openUpdateUniRevalStatusModal(studentName) {
  const cfg = getRevalConfig();
  const r = cfg.universityRevaluationTracking.find(x => x.student === studentName);
  if (!r) return;
  openFormModal(`Update University Status — ${r.student}`, `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Subject</td><td>${r.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Original Marks</td><td>${r.marks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Current Status</td><td><span class="badge ${r.uniStatusClass}">${r.uniStatus}</span></td></tr>
    </table>
    <div class="form-group"><label>New Status</label>
      <select class="form-control" id="revalUniStatus" onchange="document.getElementById('revalUniRevisedGroup').style.display = this.value === 'Revised Result Received' ? 'block' : 'none'">
        <option ${r.uniStatus === 'Submitted to University' ? 'selected' : ''}>Submitted to University</option>
        <option ${r.uniStatus === 'Awaiting University' ? 'selected' : ''}>Awaiting University</option>
        <option value="Revised Result Received" ${r.uniStatus === 'Revised Result Received' ? 'selected' : ''}>Revised Result Received</option>
      </select>
    </div>
    <div class="form-group" id="revalUniRevisedGroup" style="display:${r.uniStatus === 'Revised Result Received' ? 'block' : 'none'}"><label>Revised Marks</label><input type="number" class="form-control" id="revalUniRevised" min="0" max="100"></div>
  `, 'Update', function () {
    const status = document.getElementById('revalUniStatus').value;
    r.uniStatus = status;
    r.uniStatusClass = status === 'Revised Result Received' ? 'badge-success' : status === 'Awaiting University' ? 'badge-info' : 'badge-warning';
    if (status === 'Revised Result Received') {
      const revisedEl = document.getElementById('revalUniRevised');
      r.revised = revisedEl && revisedEl.value ? revisedEl.value : r.marks;
    }
    closeModal();
    showPage('revaluation');
    showToast(`University status updated for ${r.student}`);
  });
}

function openTrackRevaluationModal() {
  openFormModal('Track New University Revaluation', `
    <div class="form-group"><label>Student Name</label><input class="form-control" id="revalTrackStudent" placeholder="e.g. Kavita Nair"></div>
    <div class="form-row">
      <div class="form-group"><label>Subject</label><input class="form-control" id="revalTrackSubject" placeholder="e.g. DBMS"></div>
      <div class="form-group"><label>Original Marks</label><input type="number" class="form-control" id="revalTrackMarks" min="0" max="100" placeholder="e.g. 38"></div>
    </div>
  `, 'Add Tracking Record', function () {
    const student = document.getElementById('revalTrackStudent').value.trim();
    const subject = document.getElementById('revalTrackSubject').value.trim();
    const marks = Number(document.getElementById('revalTrackMarks').value) || 0;
    if (!student || !subject) { showToast('Enter both student name and subject'); return; }
    getRevalConfig().universityRevaluationTracking.unshift({ student, subject, marks, feePaid: false, uniStatus: 'Fee Pending', uniStatusClass: 'badge-danger', revised: '—' });
    closeModal();
    showPage('revaluation');
    showToast(`Tracking added for ${student}'s university revaluation (${subject})`);
  });
}

function renderRevaluation() {
  const revalOptions = Object.keys(revalExams).map(key =>
    `<option value="${key}" ${key === selectedRevalExam ? 'selected' : ''}>${revalExams[key].label || key}</option>`
  ).join('');
  if (currentMode === 'affiliated') {
    const cfg = getRevalConfig();
    const list = cfg.universityRevaluationTracking;
    const awaiting = list.filter(r => r.uniStatus === 'Awaiting University' || r.uniStatus === 'Submitted to University').length;
    const received = list.filter(r => r.uniStatus === 'Revised Result Received').length;
    const rows = list.map((r, i) => {
      const action = r.uniStatus === 'Revised Result Received'
        ? `<button class="btn btn-sm" onclick="openUniRevalResultModal('${r.student}')">View</button>`
        : r.uniStatus === 'Fee Pending'
          ? `<button class="btn btn-sm" onclick="openUniRevalFeeReminderModal('${r.student}')">Remind</button>`
          : `<button class="btn btn-sm" onclick="openUpdateUniRevalStatusModal('${r.student}')">Update</button>`;
      return `<tr><td>${r.student}</td><td>${r.subject}</td><td>${r.marks}</td><td><span class="badge ${r.feePaid ? 'badge-success' : 'badge-danger'}">${r.feePaid ? 'Paid' : 'Pending'}</span></td><td><span class="badge ${r.uniStatusClass}">${r.uniStatus}</span></td><td>${r.revised}</td><td>${action}</td></tr>`;
    }).join('');
    return `
      <div class="page-content">
        <div class="alert alert-info"><i class="fas fa-info-circle"></i> Affiliated mode: Track the student's revaluation application submitted to the university. Update the record once the university releases the revised result.</div>
        ${revalPhaseBar(true)}
        <div class="filter-bar">
          <select class="form-control" onchange="changeRevalExam(this.value)">${revalOptions}</select>
          <span class="chip">${list.length} Applications</span>
          <span class="chip">${awaiting} Awaiting University</span>
          <span class="chip">${received} Revised Result Received</span>
          <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="openTrackRevaluationModal()"><i class="fas fa-plus"></i> Track New Application</button>
        </div>
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-redo-alt"></i> University Revaluation Tracking</h3></div>
          <div class="card-body">
            <div class="table-wrap">
              <table>
                <tr><th>Student</th><th>Subject</th><th>Original Marks</th><th>Fee Status</th><th>University Status</th><th>Revised Result</th><th></th></tr>
                ${rows}
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  const modeAlert = currentMode === 'hybrid'
    ? 'Hybrid mode: Full revaluation cycle in ERP for internal/practical subjects; track university revaluation for external subjects.'
    : 'Students can apply for revaluation. Full cycle management in autonomous mode.';
  const cfg = getRevalConfig();
  const list = cfg.revaluationApplications;
  const inProgress = list.filter(r => r.status === 'In Progress').length;
  const completed = list.filter(r => r.status.startsWith('Revised')).length;
  const rows = list.map(r => {
    const action = r.status === 'Pending'
      ? `<button class="btn btn-sm btn-primary" onclick="openAssignRevaluationModal('${r.student}')">Assign</button>`
      : r.status === 'Fee Pending'
        ? `<button class="btn btn-sm" onclick="openRevalFeeReminderModal('${r.student}')">Remind</button>`
        : r.status.startsWith('Revised')
          ? `<button class="btn btn-sm" onclick="openRevalResultModal('${r.student}')">View</button>`
          : `<button class="btn btn-sm" onclick="openRevalProgressModal('${r.student}')">Track</button>`;
    return `<tr><td>${r.student}</td><td>${r.subject}</td><td>${r.marks}</td><td><span class="badge ${r.feePaid ? 'badge-success' : 'badge-danger'}">${r.feePaid ? 'Paid' : 'Pending'}</span></td><td>${r.evaluator}</td><td><span class="badge ${r.statusClass}">${r.status}</span></td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      ${revalPhaseBar(false)}
      <div class="filter-bar">
        <select class="form-control" onchange="changeRevalExam(this.value)">${revalOptions}</select>
        <span class="chip">${list.length} Applications</span>
        <span class="chip">${inProgress} In Progress</span>
        <span class="chip">${completed} Completed</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="openNewRevaluationModal()"><i class="fas fa-plus"></i> New Application</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-redo-alt"></i> Revaluation Applications</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student</th><th>Subject</th><th>Original Marks</th><th>Fee Status</th><th>Evaluator</th><th>Status</th><th></th></tr>
              ${rows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// ============================================================
// STUDENT PAGES
// ============================================================
// The student's own exam-day room/seat assignments — real per-student data
// (computeRealSeatingAllocation/getStudentSeatAssignments in data.js), not
// the aggregate room-capacity view the Exam Branch sees on Seating Plan.
function renderStudentSeating() {
  const assignments = getStudentSeatAssignments('Sem IV Regular Apr 2026', CURRENT_STUDENT_ID);
  const rows = assignments.map(a =>
    `<tr><td>${a.date}</td><td>${a.session}</td><td>${a.name}</td><td>${a.code}</td><td>${a.time}</td><td><strong>${a.room}</strong></td><td><strong>${a.seatNo}</strong></td></tr>`
  ).join('');
  return `
    <div class="page-content">
      <div class="card" style="overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);color:#fff;padding:24px 28px">
          <div style="display:flex;align-items:center;gap:16px">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">AS</div>
            <div><div style="font-size:20px;font-weight:700">Aarav Sharma</div><div style="font-size:13px;opacity:.85">S001 · B.E. Computer Engineering · Sem IV Regular Apr 2026</div></div>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-info"><i class="fas fa-info-circle"></i> Your room and seat number for each exam. Arrive at least 30 minutes early and carry your hall ticket and a valid photo ID.</div>
          <div class="table-wrap">
            <table>
              <tr><th>Date</th><th>Session</th><th>Subject</th><th>Code</th><th>Time</th><th>Room</th><th>Seat No.</th></tr>
              ${rows || '<tr><td colspan="7" class="text-center text-muted" style="padding:20px">No seating has been allocated yet.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// The student's already-completed exam sittings, reusing the Sem I-III
// entries already defined in studentSemData below — gives Hall Ticket a
// real multi-exam history for this student instead of just the one live
// Sem IV Regular Apr 2026 registration. Sem IV-VI are left out here since
// Sem IV is the current live exam (already listed via getRegistrationRoster)
// and Sem V/VI use exam-year labels that collide with other cohorts'
// current exams in eligibilityExams.
const studentPastHallTickets = [
  { examLabel: 'Sem I Regular Apr 2024', hallTicketNo: 'HT-2024-S001-1' },
  { examLabel: 'Sem II Regular Jul 2024', hallTicketNo: 'HT-2024-S001-2' },
  { examLabel: 'Sem III Regular Dec 2024', hallTicketNo: 'HT-2024-S001-3' },
];

function downloadPastHallTicket(examLabel) {
  const sem = studentSemData[examLabel];
  if (!sem) return;
  const entry = studentPastHallTickets.find(t => t.examLabel === examLabel);
  const hallTicketNo = entry ? entry.hallTicketNo : ('HT-' + CURRENT_STUDENT_ID);
  const subjectRows = sem.subjects.map(sub =>
    `<tr><td>${sub.code}</td><td>${sub.name}</td><td>${sub.credits}</td></tr>`
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
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f1f5f9; font-weight: 600; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
<div class="header">
  <h1>EXAMINATION ERP</h1>
  <h2>College of Engineering</h2>
  <p>Autonomous Institute Affiliated to University</p>
</div>
<div class="title">Hall Ticket / Admit Card (Archived)</div>
<table>
  <tr><td style="font-weight:600;width:160px">Hall Ticket No.</td><td>${hallTicketNo}</td></tr>
  <tr><td style="font-weight:600">Student Name</td><td>Aarav Sharma</td></tr>
  <tr><td style="font-weight:600">Student ID</td><td>${CURRENT_STUDENT_ID}</td></tr>
  <tr><td style="font-weight:600">Program</td><td>B.E. Computer Engineering</td></tr>
  <tr><td style="font-weight:600">Exam</td><td>${examLabel}</td></tr>
  <tr><td style="font-weight:600">Status</td><td>Completed</td></tr>
</table>
<table>
  <tr><th>Code</th><th>Subject</th><th>Credits</th></tr>
  ${subjectRows}
</table>
<div class="footer">This is a computer-generated document. Generated on ${new Date().toLocaleDateString()} · ${hallTicketNo}</div>
</body>
</html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${hallTicketNo}_Aarav_Sharma.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Hall ticket downloaded for ' + examLabel);
}

const studentSemData = {
  'Sem I Regular Apr 2024': {
    label: 'Sem I (1st Year)',
    subjects: [
      { code: 'MA101', name: 'Engineering Maths I', max: 100, obtained: 72, grade: 'B+', credits: 4 },
      { code: 'PH101', name: 'Engineering Physics', max: 100, obtained: 68, grade: 'B', credits: 4 },
      { code: 'CY101', name: 'Engineering Chemistry', max: 100, obtained: 75, grade: 'B+', credits: 4 },
      { code: 'CS101', name: 'Programming for Problem Solving', max: 100, obtained: 81, grade: 'A', credits: 3 },
      { code: 'EN101', name: 'English Communication', max: 100, obtained: 85, grade: 'A', credits: 3 },
      { code: 'EG101', name: 'Engineering Graphics', max: 100, obtained: 70, grade: 'B+', credits: 3 },
    ], sgpa: 7.6, cgpa: 7.6,
  },
  'Sem II Regular Jul 2024': {
    label: 'Sem II (1st Year)',
    subjects: [
      { code: 'MA201', name: 'Engineering Maths II', max: 100, obtained: 74, grade: 'B+', credits: 4 },
      { code: 'CS201', name: 'Programming in C', max: 100, obtained: 78, grade: 'B+', credits: 4 },
      { code: 'EC201', name: 'Digital Electronics', max: 100, obtained: 71, grade: 'B+', credits: 4 },
      { code: 'EE201', name: 'Basic Electrical Engg.', max: 100, obtained: 65, grade: 'B', credits: 3 },
      { code: 'EN201', name: 'Communication Skills', max: 100, obtained: 88, grade: 'A', credits: 3 },
      { code: 'EV201', name: 'Environmental Studies', max: 100, obtained: 82, grade: 'A', credits: 3 },
    ], sgpa: 7.7, cgpa: 7.65,
  },
  'Sem III Regular Dec 2024': {
    label: 'Sem III (2nd Year)',
    subjects: [
      { code: 'MA301', name: 'Engineering Maths III', max: 100, obtained: 70, grade: 'B+', credits: 4 },
      { code: 'CS301', name: 'Data Structures', max: 100, obtained: 80, grade: 'A', credits: 4 },
      { code: 'CS302', name: 'Object Oriented Programming', max: 100, obtained: 84, grade: 'A', credits: 4 },
      { code: 'CS303', name: 'Computer Organization', max: 100, obtained: 72, grade: 'B+', credits: 3 },
      { code: 'CS304', name: 'Microprocessors', max: 100, obtained: 66, grade: 'B', credits: 3 },
      { code: 'CS305', name: 'Discrete Maths', max: 100, obtained: 76, grade: 'B+', credits: 3 },
    ], sgpa: 7.8, cgpa: 7.7,
  },
  // Sem IV onward isn't here: this student is currently mid-way through Sem
  // IV Regular Apr 2026 (the live exam tracked in data.examResults) — it
  // hasn't been declared yet, and Sem V/VI haven't happened at all, so
  // pre-baked grades for them would contradict the hall ticket he just
  // received for an exam he hasn't sat. See getLiveSemIVResult() below for
  // the real, in-progress Sem IV entry.
};

// The live, currently-in-progress exam this student actually has a hall
// ticket for — kept separate from studentSemData (completed past semesters)
// since its result doesn't exist until the Exam Branch actually declares it.
const LIVE_STUDENT_SEM_LABEL = 'Sem IV Regular Apr 2026';

let selectedStudentSem = LIVE_STUDENT_SEM_LABEL;

function changeStudentSem(value) {
  selectedStudentSem = value;
  showPage('student-result');
}

// Builds a studentSemData-shaped result from this student's real marks in
// data.examResults, once resultDeclaredSemIV is true — so "My Result" shows
// the same numbers Result Processing/Freeze/Declaration produced, not a
// pre-baked fake grade card for an exam that's still in progress.
function getLiveSemIVResult() {
  const exam = data.examResults[LIVE_STUDENT_SEM_LABEL];
  const student = exam && exam.students.find(s => s.id === CURRENT_STUDENT_ID);
  if (!student) return null;
  const result = computeStudentResult(student, exam.subjects);
  return {
    label: 'Sem IV (2nd Year)',
    subjects: result.subjectResults.map(r => ({ code: r.code, name: r.name, max: 100, obtained: r.mark, grade: r.grade, credits: r.credits })),
    sgpa: result.sgpa.toFixed(2), cgpa: computeCumulativeGPA(CURRENT_STUDENT_ID).toFixed(2),
    failed: result.failed,
  };
}

function renderStudentResult() {
  const isLive = selectedStudentSem === LIVE_STUDENT_SEM_LABEL;
  const examOpts = [
    `<option value="${LIVE_STUDENT_SEM_LABEL}" ${isLive ? 'selected' : ''}>Sem IV (2nd Year) — ${resultDeclaredSemIV ? 'Declared' : 'In Progress'}</option>`,
    ...Object.keys(studentSemData).map(key => `<option value="${key}" ${key === selectedStudentSem ? 'selected' : ''}>${studentSemData[key].label}</option>`),
  ].join('');

  if (isLive && !resultDeclaredSemIV) {
    return `
    <div class="page-content">
      <div class="card" style="overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);color:#fff;padding:24px 28px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">AS</div>
              <div><div style="font-size:20px;font-weight:700">Aarav Sharma</div><div style="font-size:13px;opacity:.85">S001 · B.E. Computer Engineering · <strong>Sem IV (2nd Year)</strong></div></div>
            </div>
            <select class="form-control sem-select" onchange="changeStudentSem(this.value)" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3);max-width:220px">${examOpts}</select>
          </div>
        </div>
        <style>.sem-select option{color:#1e293b;background:#fff}.sem-select option:checked{background:#e0e7ff}</style>
        <div class="card-body">
          <div class="alert alert-warning" style="margin-bottom:0"><i class="fas fa-hourglass-half"></i> Your result for Sem IV Regular Apr 2026 hasn't been declared yet — you're still sitting this exam. It will appear here automatically once the Exam Branch completes Result Processing, Result Review &amp; Freeze, and Result Declaration.</div>
        </div>
      </div>
    </div>
    `;
  }

  const sem = isLive ? getLiveSemIVResult() : (studentSemData[selectedStudentSem] || studentSemData['Sem III Regular Dec 2024']);
  const isFail = sem.failed === true;
  const rows = sem.subjects.map(m => {
    let gradeColor = 'var(--text)';
    if (m.grade.startsWith('A')) gradeColor = '#059669';
    else if (m.grade.startsWith('B+')) gradeColor = '#0284c7';
    else if (m.grade === 'B') gradeColor = '#ca8a04';
    else if (m.grade === 'C') gradeColor = '#dc2626';
    return `<tr><td style="font-weight:500">${m.code}</td><td>${m.name}</td><td class="text-center">${m.max}</td><td class="text-center" style="font-weight:600">${m.obtained}</td><td class="text-center"><span style="color:${gradeColor};font-weight:700">${m.grade}</span></td><td class="text-center">${m.credits}</td></tr>`;
  }).join('');
  const totalMax = sem.subjects.reduce((s, m) => s + m.max, 0);
  const totalObtained = sem.subjects.reduce((s, m) => s + m.obtained, 0);
  const totalCredits = sem.subjects.reduce((s, m) => s + m.credits, 0);
  const pct = Math.round((totalObtained / totalMax) * 100);
  const sgpaPct = Math.min(100, Math.round((sem.sgpa / 10) * 100));
  return `
    <div class="page-content">
      <div class="card" style="overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);color:#fff;padding:24px 28px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">AS</div>
              <div><div style="font-size:20px;font-weight:700">Aarav Sharma</div><div style="font-size:13px;opacity:.85">S001 · B.E. Computer Engineering · <strong>${sem.label}</strong></div></div>
            </div>
            <select class="form-control sem-select" onchange="changeStudentSem(this.value)" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3);max-width:220px">${examOpts}</select>
          </div>
        </div>
        <style>.sem-select option{color:#1e293b;background:#fff}.sem-select option:checked{background:#e0e7ff}</style>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px">
            <div class="stat-card" style="position:relative;overflow:hidden">
              <div class="label">SGPA — ${sem.label}</div>
              <div style="display:flex;align-items:baseline;gap:8px"><span class="value" style="color:var(--primary)">${sem.sgpa}</span><span style="font-size:13px;color:var(--text-muted)">/ 10</span></div>
              <div style="margin-top:8px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden"><div style="height:100%;width:${sgpaPct}%;background:linear-gradient(90deg,#3b82f6,#2563eb);border-radius:3px"></div></div>
            </div>
            <div class="stat-card">
              <div class="label">Cumulative CGPA</div>
              <div style="display:flex;align-items:baseline;gap:8px"><span class="value" style="color:#059669">${sem.cgpa}</span><span style="font-size:13px;color:var(--text-muted)">/ 10</span></div>
              <div class="sub">Across all semesters</div>
            </div>
            <div class="stat-card">
              <div class="label">Total Marks</div>
              <div style="display:flex;align-items:baseline;gap:8px"><span class="value" style="color:#ca8a04">${totalObtained}</span><span style="font-size:13px;color:var(--text-muted)">/ ${totalMax}</span></div>
              <div class="sub">${pct}% aggregate</div>
            </div>
            <div class="stat-card">
              <div class="label">Credits & Status</div>
              <div style="display:flex;align-items:baseline;gap:8px"><span class="value" style="color:var(--primary)">${totalCredits}</span></div>
              <div><span class="badge ${isFail ? 'badge-danger' : 'badge-success'}" style="font-size:13px;padding:3px 10px"><i class="fas ${isFail ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${isFail ? 'FAIL' : 'PASS'}</span></div>
            </div>
          </div>
          <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px"><i class="fas fa-book-open"></i> Subject-wise Performance</h4>
          <div class="table-wrap">
            <table style="font-size:13px">
              <tr><th>Code</th><th>Subject</th><th class="text-center">Max</th><th class="text-center">Obtained</th><th class="text-center">Grade</th><th class="text-center">Credits</th></tr>
              ${rows}
              <tr style="font-weight:700;background:#f8fafc"><td colspan="2">Total</td><td class="text-center">${totalMax}</td><td class="text-center" style="color:var(--primary)">${totalObtained}</td><td class="text-center"></td><td class="text-center">${totalCredits}</td></tr>
            </table>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-muted)">
              <span><span style="color:#059669;font-weight:700">A+, A</span> — Excellent</span>
              <span><span style="color:#0284c7;font-weight:700">B+</span> — Very Good</span>
              <span><span style="color:#ca8a04;font-weight:700">B</span> — Good</span>
              <span><span style="color:#dc2626;font-weight:700">C, D</span> — Needs Improvement</span>
            </div>
            <button class="btn btn-primary" onclick="downloadStudentMarksMemo()" style="padding:10px 24px"><i class="fas fa-download"></i> Download Marks Memo</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function downloadStudentMarksMemo() {
  const isLive = selectedStudentSem === LIVE_STUDENT_SEM_LABEL;
  if (isLive && !resultDeclaredSemIV) return;
  const sem = isLive ? getLiveSemIVResult() : (studentSemData[selectedStudentSem] || studentSemData['Sem III Regular Dec 2024']);
  if (!sem) return;
  const memoPrefixMap = {
    'Sem I Regular Apr 2024': 'MM-2024-1',
    'Sem II Regular Jul 2024': 'MM-2024-2',
    'Sem III Regular Dec 2024': 'MM-2024-3',
  };
  const memoNo = isLive ? 'MM-2026-001' : (memoPrefixMap[selectedStudentSem] || 'MM-2024') + '-001';
  downloadMarksMemo('S001', 'Aarav Sharma', memoNo, sem.sgpa, sem.cgpa, selectedStudentSem, sem.subjects, sem.failed === true);
}

// Both seed applications reference real, already-declared semesters (their
// subject/marks match studentSemData) with dates shortly after that
// semester's result — not the live, still-undeclared Sem IV, since you can
// only apply for revaluation once a result actually exists.
const studentRevalApplications = [
  { semester: 'Sem III Regular Dec 2024', subject: 'Microprocessors', obtained: 66, date: '28 Dec 2024', status: 'In Progress', statusClass: 'badge-warning', revised: '—' },
  { semester: 'Sem II Regular Jul 2024', subject: 'Basic Electrical Engg.', obtained: 65, date: '25 Jul 2024', status: 'Completed', statusClass: 'badge-success', revised: 70 },
];

function applyStudentRevaluation(subject, obtained, semester) {
  showActionModal('Apply for Revaluation',
    `Apply for revaluation of ${subject} (obtained: ${obtained})? Fee of ₹500 will be added to your account.`,
    {
      icon: 'fa-redo-alt', confirmLabel: 'Apply & Pay', confirmIcon: 'fa-check',
      onConfirm: function () {
        const d = new Date();
        const today = d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear();
        studentRevalApplications.unshift({ semester, subject, obtained, date: today, status: 'Applied', statusClass: 'badge-info', revised: '—' });
        showPage('student-revaluation');
        showToast('Revaluation applied for ' + subject);
      }
    }
  );
}

function renderStudentRevaluation() {
  const isLive = selectedStudentSem === LIVE_STUDENT_SEM_LABEL;
  // Past applications (from already-declared semesters) should still show
  // even while the current live exam's result is pending — only the "apply
  // for a new subject" table depends on a declared result to pull from.
  const appRows = studentRevalApplications.map(a =>
    `<tr><td>${a.semester || '—'}</td><td>${a.subject}</td><td>${a.obtained}</td><td>${a.date}</td><td><span class="badge ${a.statusClass}">${a.status}</span></td><td>${a.revised}</td></tr>`
  ).join('');
  const myApplicationsCard = `
      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3><i class="fas fa-history"></i> My Applications</h3></div>
        <div class="card-body">
          ${appRows ? `
          <div class="table-wrap">
            <table>
              <tr><th>Semester</th><th>Subject</th><th>Original Marks</th><th>Application Date</th><th>Status</th><th>Revised Marks</th></tr>
              ${appRows}
            </table>
          </div>` : '<p class="text-muted text-center" style="padding:20px">No revaluation applications yet.</p>'}
        </div>
      </div>`;

  // You can only apply for revaluation on a subject once its result
  // actually exists — for the live, still-in-progress exam that means
  // waiting for Result Declaration, same gate as "My Result".
  if (isLive && !resultDeclaredSemIV) {
    return `
    <div class="page-content">
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-redo-alt"></i> Apply for Revaluation</h3></div>
        <div class="card-body">
          <div class="alert alert-warning" style="margin-bottom:0"><i class="fas fa-hourglass-half"></i> Your result for Sem IV Regular Apr 2026 hasn't been declared yet, so there's nothing new to apply for revaluation on yet. Check back after Result Declaration.</div>
        </div>
      </div>
      ${myApplicationsCard}
    </div>
    `;
  }
  const sem = isLive ? getLiveSemIVResult() : (studentSemData[selectedStudentSem] || studentSemData['Sem III Regular Dec 2024']);
  const applyRows = sem.subjects.map(s =>
    `<tr><td>${s.name}</td><td>${s.obtained}</td><td><button class="btn btn-sm btn-primary" onclick="applyStudentRevaluation('${s.name.replace(/'/g, "\\'")}',${s.obtained},'${selectedStudentSem}')">Apply</button></td></tr>`
  ).join('');
  return `
    <div class="page-content">
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-redo-alt"></i> Apply for Revaluation</h3></div>
        <div class="card-body">
          <div class="alert alert-info"><i class="fas fa-info-circle"></i> Submit revaluation applications for your subjects. Fee: ₹500 per subject. Showing subjects from <strong>${sem.label}</strong>.</div>
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Obtained</th><th>Apply</th></tr>
              ${applyRows}
            </table>
          </div>
        </div>
      </div>
      ${myApplicationsCard}
    </div>
  `;
}

// ============================================================
// ============================================================
// REPORTS
// ============================================================
// Every report named in the stat card subtitles below has a real entry here
// — previously the subtitles advertised report types (Invigilator,
// Malpractice, Collection, Evaluator, Scrutiny, Memo, Revaluation,
// Subject-wise, Toppers, Trend) that didn't actually exist as rows, so the
// counts silently undercounted what was promised.
const REPORT_STAGE_ORDER = ['Pre-Exam', 'In-Exam', 'Post-Exam', 'Analytics'];

// Fixed catalog of report *kinds* (spec 5.11) — which exams actually appear
// on this page comes from recentExams (the real list built by "Create &
// Activate Exam" in Exam Creation), not a separate hardcoded exam list, so a
// newly-created exam shows up here automatically.
const REPORT_CATALOG = {
  'Eligible Student List': 'Pre-Exam', 'Registered Student List': 'Pre-Exam', 'Exam Timetable': 'Pre-Exam',
  'Hall Ticket List': 'Pre-Exam', 'Seating Plan': 'Pre-Exam', 'Invigilator Duty Chart': 'Pre-Exam',
  'Attendance Report': 'In-Exam', 'D-Form': 'In-Exam', 'Answer Sheet Report': 'In-Exam',
  'Malpractice Report': 'In-Exam', 'Collection & Dispatch Report': 'In-Exam',
  'Bundle Summary': 'Post-Exam', 'Evaluator Assignment Report': 'Post-Exam', 'Marks Entry Status': 'Post-Exam',
  'Scrutiny Report': 'Post-Exam', 'Result Summary': 'Post-Exam', 'Marks Memo Report': 'Post-Exam', 'Revaluation Report': 'Post-Exam',
  'Pass / Fail Analysis': 'Analytics', 'Backlog Report': 'Analytics', 'Subject-wise Analysis': 'Analytics',
  'Toppers List': 'Analytics', 'Trend Analysis': 'Analytics',
};
const REPORT_CATEGORY_COUNTS = { 'Pre-Exam': 6, 'In-Exam': 5, 'Post-Exam': 7, 'Analytics': 5 };

// Maps an exam's real Exam Creation status to how far its reports can have
// progressed — mirrors the Pre-Exam -> In-Exam -> Post-Exam -> Analytics
// phases reports actually happen in.
function reportExamStage(exam) {
  if (!exam) return 'Analytics';
  if (exam.status === 'Pre-Exam') return 'Pre-Exam';
  if (exam.status === 'Closed') return 'Analytics';
  return 'In-Exam'; // Active, or any other in-progress status
}

function addDaysToDate(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Per-exam report state (which reports are generated, and when) is derived
// once from that exam's own real start/end date and cached, so a manual
// "Generate" click sticks across re-renders instead of resetting. Reports in
// categories already fully behind the exam's current stage are generated;
// the exam's *current* stage generates all but its last report (so
// "Generate" always has something real to demonstrate); reports in
// categories the exam hasn't reached yet stay locked. A Closed exam has
// everything generated since its whole lifecycle is already complete.
const reportsExamsCache = {};
function getExamReports(examLabel) {
  if (reportsExamsCache[examLabel]) return reportsExamsCache[examLabel];
  const exam = recentExams.find(e => e.label === examLabel);
  const stage = reportExamStage(exam);
  const stageIdx = REPORT_STAGE_ORDER.indexOf(stage);
  const isClosed = !!(exam && exam.status === 'Closed');
  const seenInCategory = {};
  const reports = {};
  Object.entries(REPORT_CATALOG).forEach(([name, category]) => {
    const catIdx = REPORT_STAGE_ORDER.indexOf(category);
    seenInCategory[category] = (seenInCategory[category] || 0) + 1;
    const posInCategory = seenInCategory[category];
    let lastGenerated = null;
    if (exam && catIdx <= stageIdx) {
      const isLastPending = !isClosed && catIdx === stageIdx && posInCategory === REPORT_CATEGORY_COUNTS[category];
      if (!isLastPending) {
        const baseDate = (category === 'Pre-Exam' || category === 'In-Exam') ? exam.startDate : exam.endDate;
        const offset = category === 'Pre-Exam' ? -8 + posInCategory : category === 'In-Exam' ? posInCategory : category === 'Post-Exam' ? 2 + posInCategory : 6 + posInCategory;
        lastGenerated = addDaysToDate(baseDate, offset);
      }
    }
    reports[name] = { category, lastGenerated };
  });
  reportsExamsCache[examLabel] = { stage, reports };
  return reportsExamsCache[examLabel];
}

let selectedReportsExam = 'Sem IV Regular Apr 2026';
let selectedReportsPhase = 'All Phases';

function changeReportsExam(value) {
  selectedReportsExam = value;
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  } else {
    showPage('reports');
  }
}

function changeReportsPhase(value) {
  selectedReportsPhase = value;
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  } else {
    showPage('reports');
  }
}

// Builds the actual data table for a report's downloaded file, instead of a
// bare metadata shell — reuses the exact same real data/functions each
// report's own native page already uses (eligibility, roster, timetable,
// seating, invigilator duty, attendance, malpractice), so the export can
// never disagree with what's shown live elsewhere. Falls back to an honest
// "no records available" note for Post-Exam/Analytics reports on exams that
// don't have a real result dataset in this demo (only Sem IV does, and it's
// still mid In-Exam so those categories aren't unlocked for it yet).
function buildReportTable(examLabel, reportName) {
  const th = (cols) => '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  const noData = (cols, msg) => `<table>${th(cols)}<tr><td colspan="${cols.length}" style="text-align:center;color:#64748b">${msg}</td></tr></table>`;

  if (reportName === 'Eligible Student List') {
    const cfg = eligibilityExams[examLabel] || eligibilityExams['Sem IV Regular Apr 2026'];
    const rows = cfg.students.map(s => {
      const { eligible, reasons } = effectiveEligibility(s);
      return `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.program}</td><td>${s.sem}</td><td>${s.status}</td><td>${eligible ? 'Eligible' : 'Not Eligible'}</td><td>${reasons.length ? reasons.join(', ') : '—'}</td></tr>`;
    }).join('');
    return `<table>${th(['Student ID', 'Name', 'Program', 'Sem', 'Status', 'Eligibility', 'Reason(s)'])}${rows}</table>`;
  }
  if (reportName === 'Registered Student List') {
    const roster = getRegistrationRoster(examLabel);
    const rows = roster.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.subjects.join(', ')}${r.backlog ? ' (Backlog)' : ''}</td><td>${r.feeStatus}</td><td>${r.approval}</td></tr>`).join('');
    return rows ? `<table>${th(['Student ID', 'Name', 'Subjects', 'Fee Status', 'Approval'])}${rows}</table>` : noData(['Student ID', 'Name', 'Subjects', 'Fee Status', 'Approval'], 'No registered students for this exam.');
  }
  if (reportName === 'Exam Timetable') {
    const slots = getExamTimetableSlots(examLabel);
    const rows = slots.map(s => `<tr><td>${s.date}</td><td>${s.session}</td><td>${s.code}</td><td>${s.subject}</td><td>${s.time}</td><td>${s.duration}</td></tr>`).join('');
    return rows ? `<table>${th(['Date', 'Session', 'Code', 'Subject', 'Time', 'Duration'])}${rows}</table>` : noData(['Date', 'Session', 'Code', 'Subject', 'Time', 'Duration'], 'No slots scheduled yet.');
  }
  if (reportName === 'Hall Ticket List') {
    const roster = getRegistrationRoster(examLabel);
    const rows = roster.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.subjects.join(', ')}${r.backlog ? ' (Backlog)' : ''}</td><td>${r.approval === 'Approved' ? 'Issued' : 'Pending Approval'}</td></tr>`).join('');
    return rows ? `<table>${th(['Student ID', 'Name', 'Subjects', 'Hall Ticket Status'])}${rows}</table>` : noData(['Student ID', 'Name', 'Subjects', 'Hall Ticket Status'], 'No students registered for this exam.');
  }
  if (reportName === 'Seating Plan') {
    const slots = getExamTimetableSlots(examLabel);
    let rows = '';
    if (data.examResults[examLabel]) {
      slots.forEach(slot => {
        const alloc = computeRealSeatingAllocation(examLabel, slot.code);
        alloc.takingStudents.forEach(s => {
          const seat = alloc.seatByStudentId[s.id];
          rows += `<tr><td>${slot.date}</td><td>${slot.code} — ${alloc.subject.name}</td><td>${s.id}</td><td>${s.name}</td><td>${seat.room}</td><td>${seat.seatNo}</td></tr>`;
        });
      });
    } else {
      const roster = getRegistrationRoster(examLabel);
      const slotLabel = slots[0] ? `${slots[0].code} — ${slots[0].subject}` : '—';
      let cursor = 0, seatNum = 1;
      data.rooms.forEach(room => {
        for (let i = 0; i < room.capacity && cursor < roster.length; i++, cursor++, seatNum++) {
          const r = roster[cursor];
          rows += `<tr><td>${slots[0] ? slots[0].date : '—'}</td><td>${slotLabel}</td><td>${r.id}</td><td>${r.name}</td><td>${room.name}</td><td>S${String(seatNum).padStart(3, '0')}</td></tr>`;
        }
      });
    }
    return rows ? `<table>${th(['Date', 'Subject', 'Student ID', 'Name', 'Room', 'Seat No.'])}${rows}</table>` : noData(['Date', 'Subject', 'Student ID', 'Name', 'Room', 'Seat No.'], 'No seating data available.');
  }
  if (reportName === 'Invigilator Duty Chart') {
    const slots = getExamTimetableSlots(examLabel);
    let rows = '';
    slots.forEach((slot, i) => {
      getInvigilatorAssignments(i).forEach(a => {
        const faculty = a.facultyId ? findFaculty(a.facultyId) : null;
        rows += `<tr><td>${slot.date}</td><td>${slot.session}</td><td>${a.room}</td><td>${faculty ? faculty.name : 'Not Assigned'}</td><td>${a.status}</td></tr>`;
      });
    });
    return rows ? `<table>${th(['Date', 'Session', 'Room', 'Invigilator', 'Status'])}${rows}</table>` : noData(['Date', 'Session', 'Room', 'Invigilator', 'Status'], 'No invigilator assignments yet.');
  }
  if (reportName === 'Attendance Report' || reportName === 'Answer Sheet Report') {
    const isAttendance = reportName === 'Attendance Report';
    const cols = isAttendance
      ? ['Date', 'Subject', 'Room', 'Student ID', 'Name', 'Attendance']
      : ['Date', 'Subject', 'Room', 'Student', 'Answer Sheet #', 'Suppl. Booklet #'];
    if (examLabel === 'Sem IV Regular Apr 2026') {
      let rows = '';
      data.timetableSlots.forEach(slot => {
        data.rooms.forEach(room => {
          const session = attendanceSessions[attendanceKey(slot.date, slot.session, room.name)];
          if (!session) return;
          getAttendanceRoster(room.name).forEach(s => {
            const e = session.entries[s.id];
            if (!e) return;
            rows += isAttendance
              ? `<tr><td>${slot.date}</td><td>${slot.subject}</td><td>${room.name}</td><td>${s.id}</td><td>${s.name}</td><td>${e.status}</td></tr>`
              : `<tr><td>${slot.date}</td><td>${slot.subject}</td><td>${room.name}</td><td>${s.id} - ${s.name}</td><td>${e.sheet || '—'}</td><td>${e.suppl || '—'}</td></tr>`;
          });
        });
      });
      return rows ? `<table>${th(cols)}${rows}</table>` : noData(cols, 'Attendance has not been submitted for this exam yet.');
    }
    return noData(cols, 'No attendance records are tracked for this exam in the demo.');
  }
  if (reportName === 'D-Form') {
    const cols = ['Subject', 'Date', 'Registered', 'Present', 'Absent', 'Malpractice', 'Answer Sheets'];
    if (data.examResults[examLabel]) {
      const summary = getExamResultSummary(examLabel);
      const rows = summary.subjectStats.map(s => {
        const slot = data.timetableSlots.find(t => t.code === s.code);
        const dateShort = slot ? slot.date : '—';
        return `<tr><td>${s.name}</td><td>${dateShort}</td><td>${s.total}</td><td>${s.total}</td><td>0</td><td>0</td><td>${s.total}</td></tr>`;
      }).join('');
      return `<table>${th(cols)}${rows}</table>`;
    }
    return noData(cols, 'D-Form has not been generated for this exam yet.');
  }
  if (reportName === 'Malpractice Report') {
    const cols = ['Date', 'Student', 'Subject', 'Type', 'Remarks', 'Status'];
    if (examLabel === 'Sem IV Regular Apr 2026' && data.malpracticeCases.length) {
      const rows = data.malpracticeCases.map(c => `<tr><td>${c.date}</td><td>${c.student}</td><td>${c.subject}</td><td>${c.type}</td><td>${c.remarks}</td><td>${c.status}</td></tr>`).join('');
      return `<table>${th(cols)}${rows}</table>`;
    }
    return noData(cols, 'No malpractice cases recorded for this exam.');
  }
  if (reportName === 'Collection & Dispatch Report') {
    const cols = ['Room', 'Subject', 'Present', 'Collected', 'Verified', 'Status'];
    if (examLabel === 'Sem IV Regular Apr 2026') {
      const rows = [
        ['Lab 101', 'DS & Algorithms', 30, 30, 'Yes', 'Verified'],
        ['Lab 102', 'DS & Algorithms', 28, 28, 'Yes', 'Verified'],
        ['Lecture Hall A', 'DS & Algorithms', 60, 59, 'No', 'Mismatch'],
        ['Lecture Hall B', 'DS & Algorithms', 60, 60, 'Yes', 'Verified'],
        ['Seminar Hall', 'DS & Algorithms', 70, 70, 'Yes', 'Verified'],
      ].map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
      return `<table>${th(cols)}${rows}</table>`;
    }
    return noData(cols, 'No collection records available for this exam.');
  }
  // Post-Exam / Analytics categories — no per-exam result dataset backs
  // these for exams outside the live Sem IV result-processing pipeline.
  return `<div style="padding:24px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:8px;margin-top:16px"><i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>No detailed records are available to export for "${reportName}" on ${examLabel} in this demo.</div>`;
}

function downloadReport(reportName) {
  const exam = getExamReports(selectedReportsExam);
  const info = exam.reports[reportName];
  const tableHTML = buildReportTable(selectedReportsExam, reportName);
  const content = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${reportName} - ${selectedReportsExam}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left;font-size:13px}th{background:#f1f5f9;font-weight:600}</style>
</head><body>
<h1>${reportName}</h1>
<p><strong>Exam:</strong> ${selectedReportsExam}</p>
<p><strong>Category:</strong> ${info.category}</p>
<p><strong>Generated:</strong> ${info.lastGenerated || new Date().toLocaleDateString()}</p>
${tableHTML}
<hr>
<p>This is a computer-generated report from the Examination ERP system.</p>
<p>Generated on: ${new Date().toLocaleString()}</p>
</body></html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportName.replace(/\s+/g, '_')}_${selectedReportsExam.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportReports(type) {
  const exam = getExamReports(selectedReportsExam);
  let reports = Object.entries(exam.reports);
  if (selectedReportsPhase !== 'All Phases') {
    reports = reports.filter(([_, info]) => info.category === selectedReportsPhase);
  }
  let tableRows = reports.map(([name, info]) =>
    `<tr><td>${name}</td><td>${info.category}</td><td>${info.lastGenerated || 'Not generated'}</td></tr>`
  ).join('');
  const content = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Reports Export - ${selectedReportsExam}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left;font-size:13px}th{background:#f1f5f9;font-weight:600}</style>
</head><body>
<h1>${type} Export — ${selectedReportsExam}</h1>
<p><strong>Phase filter:</strong> ${selectedReportsPhase}</p>
<p><strong>Exported on:</strong> ${new Date().toLocaleString()}</p>
<table>
<tr><th>Report Name</th><th>Category</th><th>Last Generated</th></tr>
${tableRows}
</table>
<hr>
<p><em>Total reports: ${reports.length}</em></p>
<p>This is a computer-generated ${type} export from the Examination ERP system.</p>
</body></html>`;
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = type === 'Excel' ? '_Excel' : '_PDF';
  a.download = `Reports_${selectedReportsExam.replace(/\s+/g, '_')}${ext}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(type + ' export completed for ' + selectedReportsExam);
}

function generateReport(reportName) {
  const exam = getExamReports(selectedReportsExam);
  if (exam.reports[reportName]) {
    exam.reports[reportName].lastGenerated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  } else {
    showPage('reports');
  }
  showToast(reportName + ' generated successfully');
}

function openGenerateReportModal(reportName) {
  const exam = getExamReports(selectedReportsExam);
  const info = exam.reports[reportName];
  if (!info) return;
  const badgeClass = info.category === 'Pre-Exam' ? 'badge-info' : info.category === 'In-Exam' ? 'badge-warning' : info.category === 'Post-Exam' ? 'badge-success' : 'badge-neutral';
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-magic" style="font-size:40px;color:var(--primary)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Report</td><td>${reportName}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Category</td><td><span class="badge ${badgeClass}">${info.category}</span></td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Exam</td><td>${selectedReportsExam}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Status</td><td><span class="badge badge-warning">Not generated yet</span></td></tr>
    </table>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();generateReport('${reportName}')"><i class="fas fa-magic"></i> Generate</button>`;
  openModal(`Generate ${reportName}`, body, footer);
}

function renderReports() {
  const examOptions = recentExams.map(e =>
    `<option value="${e.label}" ${e.label === selectedReportsExam ? 'selected' : ''}>${e.label}</option>`
  ).join('');
  const exam = getExamReports(selectedReportsExam);
  const phaseOptions = ['All Phases', 'Pre-Exam', 'In-Exam', 'Post-Exam', 'Analytics'].map(p =>
    `<option value="${p}" ${p === selectedReportsPhase ? 'selected' : ''}>${p}</option>`
  ).join('');
  let filteredReports = Object.entries(exam.reports);
  if (selectedReportsPhase !== 'All Phases') {
    filteredReports = filteredReports.filter(([_, info]) => info.category === selectedReportsPhase);
  }
  const preCount = Object.values(exam.reports).filter(r => r.category === 'Pre-Exam').length;
  const inCount = Object.values(exam.reports).filter(r => r.category === 'In-Exam').length;
  const postCount = Object.values(exam.reports).filter(r => r.category === 'Post-Exam').length;
  const analyticCount = Object.values(exam.reports).filter(r => r.category === 'Analytics').length;
  const stageIdx = REPORT_STAGE_ORDER.indexOf(exam.stage || 'Analytics');
  const rows = filteredReports.map(([name, info]) => {
    const isLocked = REPORT_STAGE_ORDER.indexOf(info.category) > stageIdx;
    const isGenerated = info.lastGenerated !== null;
    const action = isLocked
      ? `<span class="text-muted" style="font-size:12px"><i class="fas fa-lock"></i> Not available yet</span>`
      : isGenerated
      ? `<button class="btn btn-sm" onclick="downloadReport('${name}')"><i class="fas fa-download"></i> Download</button>`
      : `<button class="btn btn-sm btn-primary" onclick="openGenerateReportModal('${name}')"><i class="fas fa-magic"></i> Generate</button>`;
    const badgeClass = info.category === 'Pre-Exam' ? 'badge-info' : info.category === 'In-Exam' ? 'badge-warning' : info.category === 'Post-Exam' ? 'badge-success' : 'badge-neutral';
    return `<tr${isLocked ? ' style="opacity:.55"' : ''}><td>${name}</td><td><span class="badge ${badgeClass}">${info.category}</span></td><td>${info.lastGenerated || '—'}</td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Generate and export examination reports across all phases. Reports beyond this exam's current stage (<strong>${exam.stage}</strong>) aren't available yet.</div>
      <div class="phase-bar" style="margin-bottom:16px">
        <div class="phase"><i class="fas fa-calendar-check"></i> Select Exam</div>
        <div class="phase"><i class="fas fa-filter"></i> Select Report Type</div>
        <div class="phase"><i class="fas fa-magic"></i> Generate Report</div>
        <div class="phase"><i class="fas fa-file-export"></i> Export PDF / Excel</div>
      </div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeReportsExam(this.value)">${examOptions}</select>
        <select class="form-control" onchange="changeReportsPhase(this.value)">${phaseOptions}</select>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="exportReports('PDF')"><i class="fas fa-file-pdf"></i> Export PDF</button>
        <button class="btn btn-sm" onclick="exportReports('Excel')"><i class="fas fa-file-excel"></i> Export Excel</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="label">Pre-Exam Reports</div><div class="value" style="font-size:16px">${preCount}</div><div class="sub">Eligibility, Registration, Timetable, Hall Ticket, Seating, Invigilator</div></div>
        <div class="stat-card"><div class="label">In-Exam Reports</div><div class="value" style="font-size:16px">${inCount}</div><div class="sub">Attendance, Answer Sheet, Malpractice, D-Form, Collection</div></div>
        <div class="stat-card"><div class="label">Post-Exam Reports</div><div class="value" style="font-size:16px">${postCount}</div><div class="sub">Bundle, Evaluator, Marks, Scrutiny, Result, Memo, Revaluation</div></div>
        <div class="stat-card"><div class="label">Analytics</div><div class="value" style="font-size:16px">${analyticCount}</div><div class="sub">Pass/Fail, Backlog, Subject-wise, Toppers, Trend</div></div>
      </div>

      <div class="card">
        <div class="card-header"><h3><i class="fas fa-file-alt"></i> Available Reports</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Report Name</th><th>Category</th><th>Last Generated</th><th></th></tr>
              ${rows || '<tr><td colspan="4" class="text-center text-muted" style="padding:20px">No reports found for the selected phase.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
