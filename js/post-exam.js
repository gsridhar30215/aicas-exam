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
      : `<button class="btn btn-sm" onclick="showActionModal('Bundle ${b.id}','${b.range} sheets — evaluator: ${b.evaluator}. Status: ${b.status}${b.scrutiny ? '. Scrutiny: ' + b.scrutiny : ''}.', {icon:'fa-layer-group', iconColor:'${b.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}'})">View</button>`;
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
      ? `<button class="btn btn-sm" onclick="showActionModal('Bundle ${b.id}','All ${b.sheets} answer sheets evaluated by ${b.evaluator}. Marks submitted for scrutiny${b.scrutiny ? ' — ' + b.scrutiny : ''}.', {icon:'fa-check-circle', iconColor:'var(--success)'})">View</button>`
      : `<button class="btn btn-sm" onclick="showActionModal('Bundle ${b.id} Progress','${b.evaluator} has evaluated ${Math.round(b.sheets * b.progress / 100)} of ${b.sheets} answer sheets so far (${b.progress}% complete).', {icon:'fa-chart-line'})">Track</button>`;
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
const scrutinyExams = {
  'Sem IV Regular Apr 2026': {
    bundles: [
      { id: 'B-001', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '1 - 25', sheets: 25, evaluator: 'Dr. Meena Iyer', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '10 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-002', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '26 - 50', sheets: 25, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-003', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '51 - 75', sheets: 25, evaluator: 'Prof. Rajesh Pillai', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-004', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '76 - 100', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '13 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 2 },
      { id: 'B-005', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '101 - 125', sheets: 25, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-006', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '126 - 150', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '13 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 2 },
    ],
  },
  'Sem VI Regular Apr 2026': {
    bundles: [
      { id: 'B-101', subjectCode: 'CS601', subject: 'Machine Learning', range: '1 - 20', sheets: 20, evaluator: 'Dr. Neha Shah', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '08 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-102', subjectCode: 'CS601', subject: 'Machine Learning', range: '21 - 40', sheets: 20, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '09 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 0 },
      { id: 'B-103', subjectCode: 'CS602', subject: 'Cloud Computing', range: '1 - 25', sheets: 25, evaluator: 'Dr. Meena Iyer', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '09 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-104', subjectCode: 'CS602', subject: 'Cloud Computing', range: '26 - 50', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '10 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 1 },
    ],
  },
  'Sem II Supplementary Jan 2026': {
    bundles: [
      { id: 'B-201', subjectCode: 'CS201', subject: 'Programming in C', range: '1 - 15', sheets: 15, evaluator: 'Prof. Rajesh Pillai', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '22 Jan 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
      { id: 'B-202', subjectCode: 'CS202', subject: 'Discrete Maths', range: '1 - 12', sheets: 12, evaluator: 'Dr. Neha Shah', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '23 Jan 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 3 },
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
      ? `<button class="btn btn-sm" onclick="showActionModal('Bundle ${b.id}','${b.sheets} sheets, ${b.errors} errors found. Approved on ${b.submitted} and locked for result processing.', {icon:'fa-check-circle', iconColor:'var(--success)'})">View</button>`
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

function openScrutinyReviewModal(bundleId) {
  const exam = scrutinyExams[selectedScrutinyExam] || scrutinyExams['Sem IV Regular Apr 2026'];
  const bundle = exam.bundles.find(b => b.id === bundleId);
  if (!bundle) return;
  const message = bundle.errors > 0
    ? `Bundle ${bundleId} has ${bundle.errors} potential issue(s): missing marks or totaling mismatches were found. Approve if the marks are actually valid, or return the bundle to the evaluator for correction.`
    : `Bundle ${bundleId} has no errors found. Ready to approve and lock for result processing.`;
  document.getElementById('modalTitle').textContent = 'Scrutiny Review — Bundle ' + bundleId;
  const body = document.getElementById('modalBody');
  body.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = message;
  body.appendChild(p);

  const footer = document.getElementById('modalFooter');
  footer.innerHTML = '';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = closeModal;
  footer.appendChild(cancelBtn);

  if (bundle.errors > 0) {
    const returnBtn = document.createElement('button');
    returnBtn.className = 'btn btn-warning';
    returnBtn.textContent = 'Return for Correction';
    returnBtn.onclick = function () {
      bundle.status = 'Assigned';
      bundle.statusClass = 'badge-info';
      bundle.progress = 50;
      bundle.submitted = null;
      bundle.scrutiny = null;
      bundle.scrutinyClass = '';
      bundle.errors = 0;
      const dbBundle = data.bundles.find(b => b.id === bundleId);
      if (dbBundle) { Object.assign(dbBundle, bundle); }
      closeModal();
      showPage('scrutiny');
      showToast('Bundle ' + bundleId + ' returned to ' + bundle.evaluator + ' for correction');
    };
    footer.appendChild(returnBtn);
  }

  const approveBtn = document.createElement('button');
  approveBtn.className = 'btn btn-success';
  approveBtn.textContent = 'Approve';
  approveBtn.onclick = function () {
    bundle.scrutiny = 'Approved';
    bundle.scrutinyClass = 'badge-success';
    const dbBundle = data.bundles.find(b => b.id === bundleId);
    if (dbBundle) { dbBundle.scrutiny = 'Approved'; dbBundle.scrutinyClass = 'badge-success'; }
    closeModal();
    showPage('scrutiny');
    showToast('Bundle ' + bundleId + ' approved');
  };
  footer.appendChild(approveBtn);

  document.getElementById('modalOverlay').classList.add('show');
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
// CONSOLIDATION
// ============================================================
function renderConsolidation() {
  const isAutonomous = currentMode === 'autonomous';
  const modeAlert = isAutonomous
    ? 'Collect all marks components: internal, practical, project, external theory (from evaluator entry).'
    : 'Collect all marks components: internal, practical, project (college) and external theory (imported from university result).';
  const importBtn = !isAutonomous
    ? `<button class="btn btn-sm" onclick="showActionModal('Import University Marks','Select the university external theory marks file to import and map to subjects.', {icon:'fa-file-import', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-file-import"></i> Import University Marks</button>`
    : '';
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control"><option>Sem IV Regular Apr 2026</option></select>
        ${importBtn}
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="openModal('All Marks Validated','<div class=\\'text-center\\' style=\\'padding:20px\\'><i class=\\'fas fa-check-circle\\' style=\\'font-size:48px;color:#059669\\'></i><h3 style=\\'margin-top:12px'>All Marks Validated & Locked</h3><p class=\\'text-muted\\'>All components verified. Ready for result processing.</p></div>','<button class=\\'btn btn-primary\\' onclick=\\'closeModal();showPage(\\'result-processing\\')\\'><i class=\\'fas fa-arrow-right\\'></i> Proceed to Result Processing</button>')"><i class="fas fa-lock"></i> Validate & Lock All</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-layer-group"></i> Marks Consolidation Status</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Internal (40)</th><th>External (60)</th><th>Practical (50)</th><th>Total (100)</th><th>Status</th></tr>
              <tr><td>DS & Algorithms</td><td><span class="badge badge-success">35.2</span></td><td><span class="badge badge-success">42.5</span></td><td><span class="badge badge-success">40.0</span></td><td><strong>88.0</strong></td><td><span class="badge badge-success">Locked</span></td></tr>
              <tr><td>Database Management Systems</td><td><span class="badge badge-success">36.0</span></td><td><span class="badge badge-success">38.0</span></td><td><span class="badge badge-success">42.0</span></td><td><strong>88.0</strong></td><td><span class="badge badge-success">Locked</span></td></tr>
              <tr><td>Operating Systems</td><td><span class="badge badge-success">34.5</span></td><td><span class="badge badge-success">40.0</span></td><td>—</td><td><strong>82.5</strong></td><td><span class="badge badge-warning">Pending External</span></td></tr>
              <tr><td>Computer Networks</td><td><span class="badge badge-success">35.0</span></td><td><span class="badge badge-warning">Not Available</span></td><td><span class="badge badge-success">38.0</span></td><td>—</td><td><span class="badge badge-danger">Incomplete</span></td></tr>
            </table>
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
  let actionBlock;
  if (currentMode === 'autonomous') {
    actionBlock = `<button class="btn btn-primary" onclick="openModal('Process Results','<p>Process results for all 248 students? This will calculate pass/fail, SGPA/CGPA based on locked marks and grading rules.</p>','<button class=\\'btn\\' onclick=\\'closeModal()\\'>Cancel</button><button class=\\'btn btn-primary\\' onclick=\\'closeModal();showPage(\\'result-freeze\\')\\'><i class=\\'fas fa-calculator\\'></i> Process Results</button>')"><i class="fas fa-cogs"></i> Calculate Results</button>`;
  } else if (currentMode === 'affiliated') {
    actionBlock = `<button class="btn btn-primary" onclick="openModal('Import University Result','<div class=\\'form-group\\'><label>University Result File</label><input type=\\'file\\' class=\\'form-control\\'></div><p>Import and map the university result file to students and subjects.</p>','<button class=\\'btn\\' onclick=\\'closeModal()\\'>Cancel</button><button class=\\'btn btn-primary\\' onclick=\\'closeModal();showPage(\\'result-freeze\\')\\'><i class=\\'fas fa-file-import\\'></i> Import Result</button>')"><i class="fas fa-file-import"></i> Import University Result</button>`;
  } else {
    actionBlock = `<button class="btn btn-primary" onclick="openModal('Process Results','<p>Calculate internal/practical results in ERP and combine with the imported university external result.</p>','<button class=\\'btn\\' onclick=\\'closeModal()\\'>Cancel</button><button class=\\'btn btn-primary\\' onclick=\\'closeModal();showPage(\\'result-freeze\\')\\'><i class=\\'fas fa-calculator\\'></i> Calculate & Combine</button>')"><i class="fas fa-cogs"></i> Calculate Results</button><button class="btn btn-sm" onclick="showActionModal('Import University External Result','Select the university external result file to import and combine with college-calculated internal/practical marks.', {icon:'fa-file-import', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-file-import"></i> Import University External Result</button>`;
  }
  const modeAlert = currentMode === 'autonomous'
    ? '<strong>Autonomous Mode:</strong> Calculating results in ERP based on locked marks.'
    : currentMode === 'affiliated'
      ? '<strong>Affiliated Mode:</strong> Import the university result file and map it to students.'
      : '<strong>Hybrid Mode:</strong> Combine college-calculated internal/practical marks with the imported university external result.';
  return `
    <div class="page-content">
      <div class="alert alert-success"><i class="fas fa-university"></i> ${modeAlert}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="label">Mode</div><div class="value" style="font-size:20px">${m.label}</div><div class="sub">${m.desc}</div></div>
        <div class="stat-card"><div class="label">Students</div><div class="value">248</div><div class="sub">Result pending</div></div>
        <div class="stat-card"><div class="label">Pass</div><div class="value" style="color:var(--success)">—</div><div class="sub">Not yet processed</div></div>
        <div class="stat-card"><div class="label">Fail / Backlog</div><div class="value" style="color:var(--danger)">—</div><div class="sub">Not yet processed</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-calculator"></i> Result Calculation</h3><div class="flex gap-2">${actionBlock}</div></div>
        <div class="card-body">
          <div class="text-center empty-state"><i class="fas fa-hourglass-half"></i><p>Results have not been processed yet.</p></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// RESULT FREEZE
// ============================================================
function renderResultFreeze() {
  const modeAlert = currentMode === 'affiliated'
    ? 'University result imported. Review and lock the student/subject mapping before declaration.'
    : 'Results calculated. Review and freeze before declaration.';
  return `
    <div class="page-content">
      <div class="alert alert-success"><i class="fas fa-check-circle"></i> ${modeAlert}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="label">Total Students</div><div class="value">248</div></div>
        <div class="stat-card"><div class="label">Pass</div><div class="value" style="color:var(--success)">226</div><div class="sub">91.1%</div></div>
        <div class="stat-card"><div class="label">Fail / Backlog</div><div class="value" style="color:var(--danger)">22</div><div class="sub">8.9%</div></div>
        <div class="stat-card"><div class="label">Withheld</div><div class="value" style="color:var(--warning)">2</div><div class="sub">Under review</div></div>
      </div>
      <div class="card mt-2">
        <div class="card-header"><h3><i class="fas fa-clipboard-check"></i> Result Review</h3><div class="flex gap-2"><button class="btn btn-sm" onclick="showActionModal('Apply Moderation','Apply grace marks or moderation rules across subjects before freezing the result? This adjusts borderline pass/fail cases per institution policy.', {icon:'fa-gavel', confirmLabel:'Apply Moderation', confirmIcon:'fa-gavel', onConfirm:()=>showPage('result-freeze')})"><i class="fas fa-gavel"></i> Apply Moderation</button><button class="btn btn-success" onclick="openModal('Freeze Result','<div class=\\'text-center\\'><i class=\\'fas fa-exclamation-triangle\\' style=\\'font-size:48px;color:#d97706\\'></i><h3 style=\\'margin-top:12px'>Confirm Result Freeze</h3><p>Once frozen, results cannot be modified without proper authorization. Are you sure?</p></div>','<button class=\\'btn\\' onclick=\\'closeModal()\\'>Cancel</button><button class=\\'btn btn-success\\' onclick=\\'closeModal();showPage(\\'result-declaration\\')\\'><i class=\\'fas fa-lock\\'></i> Freeze Result</button>')"><i class="fas fa-lock"></i> Freeze Result</button></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Total</th><th>Pass</th><th>Fail</th><th>Pass %</th><th>Topper</th><th>Marks</th></tr>
              <tr><td>DS & Algorithms</td><td>42</td><td>39</td><td>3</td><td>92.9%</td><td>Aarav Sharma</td><td>92</td></tr>
              <tr><td>DBMS</td><td>42</td><td>40</td><td>2</td><td>95.2%</td><td>Priya Patel</td><td>94</td></tr>
              <tr><td>Operating Systems</td><td>42</td><td>38</td><td>4</td><td>90.5%</td><td>Vikram Singh</td><td>88</td></tr>
              <tr><td>Computer Networks</td><td>42</td><td>41</td><td>1</td><td>97.6%</td><td>Sneha Reddy</td><td>96</td></tr>
              <tr><td>Software Engineering</td><td>42</td><td>36</td><td>6</td><td>85.7%</td><td>Divya Kulkarni</td><td>90</td></tr>
              <tr><td>Mathematics IV</td><td>38</td><td>32</td><td>6</td><td>84.2%</td><td>Aarav Sharma</td><td>85</td></tr>
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
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAffiliated
    ? 'Imported university result is locked and ready for publication.'
    : 'Result frozen and ready for declaration.';
  const publishHint = isAffiliated
    ? 'Result has been locked. Click "Publish Result" to make the university result available to students via the student portal.'
    : 'Result has been frozen. Click "Publish Result" to make it available to students via the student portal. Notifications will be sent after declaration.';
  return `
    <div class="page-content">
      <div class="alert alert-success"><i class="fas fa-check-circle"></i> ${modeAlert}</div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-bullhorn"></i> Result Declaration</h3><div class="flex gap-2"><button class="btn btn-success btn-lg" onclick="openModal('Result Declared','<div class=\\'text-center\\' style=\\'padding:20px\\'><i class=\\'fas fa-check-circle\\' style=\\'font-size:48px;color:#059669\\'></i><h3 style=\\'margin-top:12px'>Result Published Successfully</h3><p class=\\'text-muted\\'>Results are now live on the student portal. Notifications sent.</p></div>','<button class=\\'btn btn-primary\\' onclick=\\'closeModal();showPage(\\'marks-memo\\')\\'><i class=\\'fas fa-arrow-right\\'></i> Generate Marks Memo</button>')"><i class="fas fa-globe"></i> Publish Result</button></div></div>
        <div class="card-body">
          <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${publishHint}</div>
          <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card"><div class="label">Published</div><div class="value" style="color:var(--success)">Yes</div></div>
            <div class="stat-card"><div class="label">Students Notified</div><div class="value">248</div></div>
            <div class="stat-card"><div class="label">Portal Access</div><div class="value">Live</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MARKS MEMO
// ============================================================
const GRADE_POINTS = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5 };

const memoExams = {
  'Sem IV Regular Apr 2026': {
    label: 'Sem IV Regular Apr 2026', semesterLabel: 'IV (Regular) — Apr 2026', students: [
      { id: 'S001', name: 'Aarav Sharma', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S002', name: 'Priya Patel', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S003', name: 'Rahul Verma', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S004', name: 'Sneha Reddy', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S005', name: 'Vikram Singh', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S006', name: 'Ananya Gupta', program: 'B.E. Computer', sem: 'IV' },
      { id: 'S007', name: 'Rohit Joshi', program: 'B.E. Computer', sem: 'IV' },
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

function changeMemoExam(value) {
  selectedMemoExam = value;
  if (typeof renderCurrentPage === 'function') {
    renderCurrentPage();
  } else {
    showPage('marks-memo');
  }
}

function downloadMarksMemo(studentId, studentName, memoNo, sgpa, cgpa, semesterLabel, subjects) {
  semesterLabel = semesterLabel || 'IV (Regular) — Apr 2026';
  subjects = subjects && subjects.length ? subjects : memoExams['Sem IV Regular Apr 2026'].subjects;
  const subjectRows = subjects.map(sub =>
    `<tr><td>${sub.code}</td><td>${sub.name}</td><td>${sub.credits}</td><td>${sub.grade}</td><td>${GRADE_POINTS[sub.grade] || '-'}</td></tr>`
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
  <tr><td style="font-weight:600">Total Credits</td><td>${totalCredits}</td><td style="font-weight:600">Result</td><td>PASS</td></tr>
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

function generateMarksMemo(studentId) {
  const exam = getMemoExamConfig();
  const st = exam.students.find(s => s.id === studentId);
  if (!st) return;
  const idx = exam.students.indexOf(st);
  const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
  const sgpa = (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
  const cgpa = (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
  data.memosGenerated[memoExamKey(studentId)] = { memoNo, sgpa, cgpa, generatedAt: new Date().toISOString() };
  downloadMarksMemo(studentId, st.name, memoNo, sgpa, cgpa, exam.semesterLabel, exam.subjects);
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
      const sgpa = (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
      const cgpa = (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
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
  downloadMarksMemo(studentId, st.name, gen.memoNo, gen.sgpa, gen.cgpa, exam.semesterLabel, exam.subjects);
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
    ? `<button class="btn btn-primary btn-sm" onclick="openModal('Generate All Memos','<p>Generate official marks memos for all ${exam.students.length} students? This will create PDFs with memo numbers, QR codes, and digital signatures.</p>','<button class=\\'btn\\' onclick=\\'closeModal()\\'>Cancel</button><button class=\\'btn btn-primary\\' onclick=\\'closeModal();generateAllMemos()\\'><i class=\\'fas fa-magic\\'></i> Generate All</button>')"><i class="fas fa-magic"></i> Generate All Memos</button>`
    : '';
  const uploadBtn = !isAutonomous
    ? `<button class="btn ${isAffiliated?'btn-primary':''} btn-sm" onclick="showActionModal('Upload University Memo','Select the university-issued marks memo file to upload and map to students.', {icon:'fa-upload', confirmLabel:'Choose File', confirmIcon:'fa-upload'})"><i class="fas fa-upload"></i> Upload University Memo</button>`
    : '';
  const examOptions = Object.keys(memoExams).map(key =>
    `<option value="${key}" ${key === selectedMemoExam ? 'selected' : ''}>${memoExams[key].label}</option>`
  ).join('');
  const memoRows = exam.students.map((st, idx) => {
    const memoNo = exam.memoPrefix + String(idx + 1 + exam.startIdx).padStart(3, '0');
    const sgpa = (exam.baseSgpa + (idx % 5) * 0.4).toFixed(1);
    const cgpa = (exam.baseCgpa + (idx % 5) * 0.35).toFixed(1);
    const generated = !!(data.memosGenerated[memoExamKey(st.id)]);
    const action = generated
      ? `<button class="btn btn-sm" onclick="downloadMemo('${st.id}')"><i class="fas fa-download"></i> PDF</button>`
      : `<button class="btn btn-sm" onclick="showActionModal('Generate Marks Memo','Generate the official marks memo for ${st.name} (${st.id}) with memo number, QR code, and digital signature?', {icon:'fa-id-card', confirmLabel:'Generate', confirmIcon:'fa-magic', onConfirm:()=>generateMarksMemo('${st.id}')})">Generate</button>`;
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
        <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Publish to Portal','Generated marks memos are now published and downloadable from the student portal.', {icon:'fa-check-circle', iconColor:'var(--success)', showCancel:false, confirmLabel:'OK'})"><i class="fas fa-check"></i> Publish to Portal</button>
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
        ? `<button class="btn btn-sm" onclick="showActionModal('Revaluation Result — ${r.student}','Subject: ${r.subject}. Original marks: ${r.marks}. Revised marks: ${r.revised}. University has released the revised result.', {icon:'fa-check-circle', iconColor:'var(--success)'})">View</button>`
        : r.uniStatus === 'Fee Pending'
          ? `<button class="btn btn-sm" onclick="showActionModal('Send Fee Reminder','Send a fee payment reminder to ${r.student} for the ${r.subject} revaluation application?', {icon:'fa-bell', confirmLabel:'Send Reminder', confirmIcon:'fa-paper-plane', onConfirm:()=>showPage('revaluation')})">Remind</button>`
          : `<button class="btn btn-sm" onclick="showActionModal('Update Status — ${r.student}','Update the university revaluation status for ${r.subject} once the university responds.', {icon:'fa-redo-alt'})">Update</button>`;
      return `<tr><td>${r.student}</td><td>${r.subject}</td><td>${r.marks}</td><td><span class="badge ${r.feePaid ? 'badge-success' : 'badge-danger'}">${r.feePaid ? 'Paid' : 'Pending'}</span></td><td><span class="badge ${r.uniStatusClass}">${r.uniStatus}</span></td><td>${r.revised}</td><td>${action}</td></tr>`;
    }).join('');
    return `
      <div class="page-content">
        <div class="alert alert-info"><i class="fas fa-info-circle"></i> Affiliated mode: Track the student's revaluation application submitted to the university. Update the record once the university releases the revised result.</div>
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
        ? `<button class="btn btn-sm" onclick="showActionModal('Send Fee Reminder','Send a fee payment reminder to ${r.student} for the ${r.subject} revaluation application?', {icon:'fa-bell', confirmLabel:'Send Reminder', confirmIcon:'fa-paper-plane', onConfirm:()=>showPage('revaluation')})">Remind</button>`
        : r.status.startsWith('Revised')
          ? `<button class="btn btn-sm" onclick="showActionModal('Revaluation Result — ${r.student}','Subject: ${r.subject}. Original marks: ${r.marks}. ${r.status} by ${r.evaluator}.', {icon:'fa-check-circle', iconColor:'var(--success)'})">View</button>`
          : `<button class="btn btn-sm" onclick="showActionModal('Revaluation Progress — ${r.student}','Subject: ${r.subject}. Original marks: ${r.marks}. ${r.evaluator} is currently re-evaluating this answer sheet.', {icon:'fa-chart-line'})">Track</button>`;
    return `<tr><td>${r.student}</td><td>${r.subject}</td><td>${r.marks}</td><td><span class="badge ${r.feePaid ? 'badge-success' : 'badge-danger'}">${r.feePaid ? 'Paid' : 'Pending'}</span></td><td>${r.evaluator}</td><td><span class="badge ${r.statusClass}">${r.status}</span></td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
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
  'Sem IV Regular Apr 2025': {
    label: 'Sem IV (2nd Year)',
    subjects: [
      { code: 'CS401', name: 'DS & Algorithms', max: 100, obtained: 78, grade: 'B+', credits: 4 },
      { code: 'CS402', name: 'Computer Networks', max: 100, obtained: 82, grade: 'A', credits: 4 },
      { code: 'CS403', name: 'DBMS', max: 100, obtained: 85, grade: 'A', credits: 4 },
      { code: 'CS404', name: 'Software Engg.', max: 100, obtained: 74, grade: 'B+', credits: 3 },
      { code: 'CS405', name: 'Operating Systems', max: 100, obtained: 68, grade: 'B', credits: 3 },
      { code: 'CS406', name: 'Web Tech', max: 100, obtained: 90, grade: 'A+', credits: 3 },
    ], sgpa: 8.2, cgpa: 7.8,
  },
  'Sem V Regular Dec 2025': {
    label: 'Sem V (3rd Year)',
    subjects: [
      { code: 'CS501', name: 'Artificial Intelligence', max: 100, obtained: 86, grade: 'A', credits: 4 },
      { code: 'CS502', name: 'Compiler Design', max: 100, obtained: 72, grade: 'B+', credits: 4 },
      { code: 'CS503', name: 'Computer Graphics', max: 100, obtained: 78, grade: 'B+', credits: 4 },
      { code: 'CS504', name: 'Cryptography', max: 100, obtained: 80, grade: 'A', credits: 3 },
      { code: 'CS505', name: 'Data Mining', max: 100, obtained: 84, grade: 'A', credits: 3 },
      { code: 'CS506', name: 'Human Computer Interaction', max: 100, obtained: 88, grade: 'A', credits: 3 },
    ], sgpa: 8.4, cgpa: 7.95,
  },
  'Sem VI Regular Apr 2026': {
    label: 'Sem VI (3rd Year)',
    subjects: [
      { code: 'CS601', name: 'Machine Learning', max: 100, obtained: 82, grade: 'A', credits: 4 },
      { code: 'CS602', name: 'Cloud Computing', max: 100, obtained: 80, grade: 'A', credits: 4 },
      { code: 'CS603', name: 'Big Data Analytics', max: 100, obtained: 76, grade: 'B+', credits: 4 },
      { code: 'CS604', name: 'Internet of Things', max: 100, obtained: 84, grade: 'A', credits: 3 },
      { code: 'CS605', name: 'Deep Learning', max: 100, obtained: 78, grade: 'B+', credits: 3 },
      { code: 'CS606', name: 'Blockchain Tech', max: 100, obtained: 88, grade: 'A', credits: 3 },
    ], sgpa: 8.3, cgpa: 8.0,
  },
};

let selectedStudentSem = 'Sem VI Regular Apr 2026';

function changeStudentSem(value) {
  selectedStudentSem = value;
  showPage('student-result');
}

function renderStudentResult() {
  const sem = studentSemData[selectedStudentSem] || studentSemData['Sem VI Regular Apr 2026'];
  const examOpts = Object.keys(studentSemData).map(key =>
    `<option value="${key}" ${key === selectedStudentSem ? 'selected' : ''}>${studentSemData[key].label}</option>`
  ).join('');
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
              <div><span class="badge badge-success" style="font-size:13px;padding:3px 10px"><i class="fas fa-check-circle"></i> PASS</span></div>
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
  const sem = studentSemData[selectedStudentSem] || studentSemData['Sem VI Regular Apr 2026'];
  const memoPrefixMap = {
    'Sem I Regular Apr 2024': 'MM-2024-1',
    'Sem II Regular Jul 2024': 'MM-2024-2',
    'Sem III Regular Dec 2024': 'MM-2024-3',
    'Sem IV Regular Apr 2025': 'MM-2025-1',
    'Sem V Regular Dec 2025': 'MM-2025-2',
    'Sem VI Regular Apr 2026': 'MM-2026-3',
  };
  const memoNo = (memoPrefixMap[selectedStudentSem] || 'MM-2026') + '-001';
  downloadMarksMemo('S001', 'Aarav Sharma', memoNo, sem.sgpa, sem.cgpa, selectedStudentSem, sem.subjects);
}

const studentRevalApplications = [
  { subject: 'Operating Systems', obtained: 68, date: '15 Apr 2026', status: 'In Progress', statusClass: 'badge-warning', revised: '—' },
  { subject: 'Data Structures', obtained: 48, date: '10 Apr 2026', status: 'Completed', statusClass: 'badge-success', revised: 48 },
];

function applyStudentRevaluation(subject, obtained) {
  showActionModal('Apply for Revaluation',
    `Apply for revaluation of ${subject} (obtained: ${obtained})? Fee of ₹500 will be added to your account.`,
    {
      icon: 'fa-redo-alt', confirmLabel: 'Apply & Pay', confirmIcon: 'fa-check',
      onConfirm: function () {
        const d = new Date();
        const today = d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getFullYear();
        studentRevalApplications.unshift({ subject, obtained, date: today, status: 'Applied', statusClass: 'badge-info', revised: '—' });
        showPage('student-revaluation');
        showToast('Revaluation applied for ' + subject);
      }
    }
  );
}

function renderStudentRevaluation() {
  const sem = studentSemData[selectedStudentSem] || studentSemData['Sem VI Regular Apr 2026'];
  const applyRows = sem.subjects.map(s =>
    `<tr><td>${s.name}</td><td>${s.obtained}</td><td><button class="btn btn-sm btn-primary" onclick="applyStudentRevaluation('${s.name.replace(/'/g, "\\'")}',${s.obtained})">Apply</button></td></tr>`
  ).join('');
  const appRows = studentRevalApplications.map(a =>
    `<tr><td>${a.subject}</td><td>${a.obtained}</td><td>${a.date}</td><td><span class="badge ${a.statusClass}">${a.status}</span></td><td>${a.revised}</td></tr>`
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
      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3><i class="fas fa-history"></i> My Applications</h3></div>
        <div class="card-body">
          ${appRows ? `
          <div class="table-wrap">
            <table>
              <tr><th>Subject</th><th>Original Marks</th><th>Application Date</th><th>Status</th><th>Revised Marks</th></tr>
              ${appRows}
            </table>
          </div>` : '<p class="text-muted text-center" style="padding:20px">No revaluation applications yet.</p>'}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// ============================================================
// REPORTS
// ============================================================
const reportsExams = {
  'Sem IV Regular Apr 2026': {
    reports: {
      'Eligible Student List': { category: 'Pre-Exam', lastGenerated: '05 Apr 2026' },
      'Registered Student List': { category: 'Pre-Exam', lastGenerated: '06 Apr 2026' },
      'Exam Timetable': { category: 'Pre-Exam', lastGenerated: '07 Apr 2026' },
      'Hall Ticket List': { category: 'Pre-Exam', lastGenerated: '08 Apr 2026' },
      'Seating Plan': { category: 'Pre-Exam', lastGenerated: '08 Apr 2026' },
      'Attendance Report (D-Form)': { category: 'In-Exam', lastGenerated: '10 Apr 2026' },
      'Answer Sheet Report': { category: 'In-Exam', lastGenerated: '10 Apr 2026' },
      'Bundle Summary': { category: 'Post-Exam', lastGenerated: null },
      'Marks Entry Status': { category: 'Post-Exam', lastGenerated: null },
      'Result Summary': { category: 'Post-Exam', lastGenerated: null },
      'Pass / Fail Analysis': { category: 'Analytics', lastGenerated: null },
      'Backlog Report': { category: 'Analytics', lastGenerated: null },
    },
  },
  'Sem VI Regular Apr 2026': {
    reports: {
      'Eligible Student List': { category: 'Pre-Exam', lastGenerated: '03 Apr 2026' },
      'Registered Student List': { category: 'Pre-Exam', lastGenerated: '04 Apr 2026' },
      'Exam Timetable': { category: 'Pre-Exam', lastGenerated: '05 Apr 2026' },
      'Hall Ticket List': { category: 'Pre-Exam', lastGenerated: '06 Apr 2026' },
      'Seating Plan': { category: 'Pre-Exam', lastGenerated: '06 Apr 2026' },
      'Attendance Report (D-Form)': { category: 'In-Exam', lastGenerated: '08 Apr 2026' },
      'Answer Sheet Report': { category: 'In-Exam', lastGenerated: '08 Apr 2026' },
      'Bundle Summary': { category: 'Post-Exam', lastGenerated: null },
      'Marks Entry Status': { category: 'Post-Exam', lastGenerated: null },
      'Result Summary': { category: 'Post-Exam', lastGenerated: null },
      'Pass / Fail Analysis': { category: 'Analytics', lastGenerated: null },
      'Backlog Report': { category: 'Analytics', lastGenerated: null },
    },
  },
  'Sem II Supplementary Jan 2026': {
    reports: {
      'Eligible Student List': { category: 'Pre-Exam', lastGenerated: '12 Jan 2026' },
      'Registered Student List': { category: 'Pre-Exam', lastGenerated: '14 Jan 2026' },
      'Exam Timetable': { category: 'Pre-Exam', lastGenerated: '15 Jan 2026' },
      'Hall Ticket List': { category: 'Pre-Exam', lastGenerated: '16 Jan 2026' },
      'Seating Plan': { category: 'Pre-Exam', lastGenerated: '16 Jan 2026' },
      'Attendance Report (D-Form)': { category: 'In-Exam', lastGenerated: '20 Jan 2026' },
      'Answer Sheet Report': { category: 'In-Exam', lastGenerated: '20 Jan 2026' },
      'Bundle Summary': { category: 'Post-Exam', lastGenerated: null },
      'Marks Entry Status': { category: 'Post-Exam', lastGenerated: null },
      'Result Summary': { category: 'Post-Exam', lastGenerated: null },
      'Pass / Fail Analysis': { category: 'Analytics', lastGenerated: null },
      'Backlog Report': { category: 'Analytics', lastGenerated: null },
    },
  },
};

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

function downloadReport(reportName) {
  const exam = reportsExams[selectedReportsExam];
  const info = exam.reports[reportName];
  const content = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${reportName} - ${selectedReportsExam}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:8px}</style>
</head><body>
<h1>${reportName}</h1>
<p><strong>Exam:</strong> ${selectedReportsExam}</p>
<p><strong>Category:</strong> ${info.category}</p>
<p><strong>Generated:</strong> ${info.lastGenerated || new Date().toLocaleDateString()}</p>
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
  const exam = reportsExams[selectedReportsExam];
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
  const exam = reportsExams[selectedReportsExam];
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

function renderReports() {
  const examOptions = Object.keys(reportsExams).map(key =>
    `<option value="${key}" ${key === selectedReportsExam ? 'selected' : ''}>${key}</option>`
  ).join('');
  const exam = reportsExams[selectedReportsExam];
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
  const rows = filteredReports.map(([name, info]) => {
    const isGenerated = info.lastGenerated !== null;
    const action = isGenerated
      ? `<button class="btn btn-sm" onclick="downloadReport('${name}')"><i class="fas fa-download"></i> Download</button>`
      : `<button class="btn btn-sm btn-primary" onclick="showActionModal('Generate ${name}','Generate the ${name.toLowerCase()} report for ${selectedReportsExam}?', {icon:'fa-magic', confirmLabel:'Generate', confirmIcon:'fa-magic', onConfirm:()=>generateReport('${name}')})"><i class="fas fa-magic"></i> Generate</button>`;
    const badgeClass = info.category === 'Pre-Exam' ? 'badge-info' : info.category === 'In-Exam' ? 'badge-warning' : info.category === 'Post-Exam' ? 'badge-success' : 'badge-neutral';
    return `<tr><td>${name}</td><td><span class="badge ${badgeClass}">${info.category}</span></td><td>${info.lastGenerated || '—'}</td><td>${action}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Generate and export examination reports across all phases.</div>
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
