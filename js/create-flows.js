// ============================================================
// CREATE FLOWS — these mutate the `data` arrays and re-render the
// current page, so newly created items actually appear in their table.
// ============================================================

function openRecordCaseModal() {
  openFormModal('Record Special Case', `
    <div class="form-group"><label>Student</label>
      <select class="form-control" id="newCaseStudent">
        <option>Rohit Joshi (S007)</option>
        <option>Ankit Tiwari (S011)</option>
      </select>
    </div>
    <div class="form-group"><label>Subject</label>
      <select class="form-control" id="newCaseSubject">
        <option>DS & Algorithms</option><option>DBMS</option><option>Operating Systems</option><option>Computer Networks</option><option>Software Engineering</option><option>Mathematics IV</option>
      </select>
    </div>
    <div class="form-group"><label>Case Type</label>
      <select class="form-control" id="newCaseType">
        <option>Malpractice</option><option>Court Case</option><option>Withheld Result</option><option>Blank Booklet</option><option>Mismatch</option><option>Other</option>
      </select>
    </div>
    <div class="form-group"><label>Remarks</label>
      <textarea class="form-control" id="newCaseRemarks" rows="3" placeholder="Describe what happened"></textarea>
    </div>
  `, 'Submit', function () {
    const student = document.getElementById('newCaseStudent').value;
    const subject = document.getElementById('newCaseSubject').value;
    const type = document.getElementById('newCaseType').value;
    const remarks = document.getElementById('newCaseRemarks').value.trim() || 'No remarks provided';
    const typeClass = (type === 'Malpractice' || type === 'Court Case') ? 'badge-danger' : 'badge-warning';
    data.malpracticeCases.unshift({
      date: 'Today', student, subject, type, typeClass,
      remarks, status: 'Under Review', statusClass: 'badge-warning',
    });
    closeModal();
    showPage('malpractice');
    showToast('Case recorded for ' + student);
  });
}

function openAddSlotModal() {
  openFormModal('Add Timetable Slot', `
    <div class="form-row">
      <div class="form-group"><label>Date</label><input type="date" class="form-control" id="newSlotDate" value="2026-04-22"></div>
      <div class="form-group"><label>Session</label>
        <select class="form-control" id="newSlotSession"><option>Morning</option><option>Afternoon</option></select>
      </div>
    </div>
    <div class="form-group"><label>Subject</label>
      <select class="form-control" id="newSlotSubject">
        ${data.subjects.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Time</label><input class="form-control" id="newSlotTime" value="10:00 - 12:00"></div>
      <div class="form-group"><label>Duration</label><input class="form-control" id="newSlotDuration" value="2 hrs"></div>
    </div>
  `, 'Add Slot', function () {
    const dateRaw = document.getElementById('newSlotDate').value;
    const date = dateRaw ? new Date(dateRaw + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';
    const session = document.getElementById('newSlotSession').value;
    const code = document.getElementById('newSlotSubject').value;
    const subject = data.subjects.find(s => s.code === code)?.name || code;
    const time = document.getElementById('newSlotTime').value || 'TBD';
    const duration = document.getElementById('newSlotDuration').value || 'TBD';
    data.timetableSlots.push({ date, session, subject, code, time, duration, published: false });
    closeModal();
    showPage('timetable');
    showToast('Slot added for ' + subject);
  });
}

function publishTimetable() {
  showActionModal('Publish Timetable', `${data.timetableSlots.length} subjects scheduled. No conflicts found. Publish the timetable so it becomes visible for hall ticket generation.`, {
    icon: 'fa-check-circle', iconColor: 'var(--success)', confirmLabel: 'Publish', confirmIcon: 'fa-check',
    onConfirm: function () {
      data.timetableSlots.forEach(s => { s.published = true; });
      showPage('hallticket');
      showToast('Timetable published');
    }
  });
}

function openCreateBundleModal(subjectCode) {
  const subject = data.subjects.find(s => s.code === subjectCode) || data.subjects[0];
  const subjectBundles = data.bundles.filter(b => b.subjectCode === subject.code);
  const lastEnd = subjectBundles.reduce((max, b) => {
    const end = Number(b.range.split(' - ')[1]);
    return isNaN(end) ? max : Math.max(max, end);
  }, 0);
  const bundledSheets = subjectBundles.reduce((sum, b) => sum + (b.sheets || 0), 0);
  const remaining = Math.max(0, subject.verifiedSheets - bundledSheets);
  if (remaining === 0) {
    showToast('All verified sheets for ' + subject.name + ' are already bundled');
    return;
  }
  // Offer sane preset sizes that fit within what's remaining; only fall back
  // to "bundle everything left" when remaining is smaller than the smallest
  // preset (10) — never silently default to bundling all remaining sheets.
  let sizeOptions = [10, 15, 20, 25].filter(n => n <= remaining);
  if (sizeOptions.length === 0) sizeOptions = [remaining];
  const defaultIdx = sizeOptions.length - 1;
  openFormModal('Create Bundle', `
    <div class="form-group"><label>Bundle Size</label>
      <select class="form-control" id="newBundleSize">
        ${sizeOptions.map((n, i) => `<option ${i === defaultIdx ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
    </div>
    <p class="text-muted">Creating a new bundle for ${subject.name} (${subject.code}), starting from sheet ${lastEnd + 1}. ${remaining} verified sheet(s) still available to bundle.</p>
  `, 'Create Bundle', function () {
    const size = parseInt(document.getElementById('newBundleSize').value, 10);
    const start = lastEnd + 1;
    const end = lastEnd + size;
    const nextNum = data.bundles.length + 1;
    const id = 'B-' + String(nextNum).padStart(3, '0');
    data.bundles.push({
      id, subjectCode: subject.code, subject: subject.name, range: `${start} - ${end}`, sheets: size,
      evaluator: '—', status: 'Unassigned', statusClass: 'badge-warning',
      progress: 0, submitted: null, scrutiny: null, scrutinyClass: '', errors: 0,
    });
    closeModal();
    showPage('bundle');
    showToast('Bundle ' + id + ' created');
  });
}

function openAssignEvaluatorModal(prefilledBundleId, subjectCode) {
  let unassigned = data.bundles.filter(b => b.status === 'Unassigned');
  if (subjectCode && subjectCode !== 'all') {
    unassigned = unassigned.filter(b => b.subjectCode === subjectCode);
  }
  if (unassigned.length === 0) {
    const subject = subjectCode && subjectCode !== 'all' ? data.subjects.find(s => s.code === subjectCode) : null;
    showToast(subject ? `No unassigned bundles for ${subject.name} — create one on Bundle Creation first` : 'No unassigned bundles available');
    return;
  }
  openFormModal('Assign Evaluator', `
    <div class="form-group"><label>Select Bundle</label>
      <select class="form-control" id="assignBundleId">
        ${unassigned.map(b => `<option value="${b.id}" ${b.id === prefilledBundleId ? 'selected' : ''}>${b.id} — ${b.subject} (${b.range})</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Select Evaluator</label>
      <select class="form-control" id="assignEvaluatorName">
        ${data.faculty.map(f => `<option>${f.name}</option>`).join('')}
      </select>
    </div>
  `, 'Assign', function () {
    const bundleId = document.getElementById('assignBundleId').value;
    const evaluator = document.getElementById('assignEvaluatorName').value;
    const bundle = data.bundles.find(b => b.id === bundleId);
    if (bundle) {
      bundle.evaluator = evaluator;
      bundle.status = 'Assigned';
      bundle.statusClass = 'badge-info';
      bundle.progress = 0;
    }
    closeModal();
    showPage('evaluator');
    showToast(evaluator + ' assigned to ' + bundleId);
  });
}

const revalExtraStudents = ['Sneha Reddy', 'Ananya Gupta', 'Kavita Nair', 'Rohit Joshi', 'Aarav Sharma'];
const revalExtraSubjects = ['DS & Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Mathematics IV'];

function openNewRevaluationModal() {
  const cfg = getRevalConfig();
  const existingStudents = cfg.revaluationApplications.map(r => r.student).filter((v,i,a) => a.indexOf(v) === i);
  const existingSubjects = cfg.revaluationApplications.map(r => r.subject).filter((v,i,a) => a.indexOf(v) === i);
  const allStudents = [...revalExtraStudents.filter(s => !existingStudents.includes(s)), ...existingStudents];
  const allSubjects = [...revalExtraSubjects.filter(s => !existingSubjects.includes(s)), ...existingSubjects];
  openFormModal('New Revaluation Request', `
    <div class="form-group"><label>Student</label>
      <select class="form-control" id="newRevalStudent">
        ${allStudents.map(s => `<option>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Subject</label>
      <select class="form-control" id="newRevalSubject">
        ${allSubjects.map(s => `<option>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Reason</label>
      <textarea class="form-control" id="newRevalReason" rows="3" placeholder="Why are you requesting revaluation?"></textarea>
    </div>
  `, 'Submit Request', function () {
    const student = document.getElementById('newRevalStudent').value;
    const subject = document.getElementById('newRevalSubject').value;
    getRevalConfig().revaluationApplications.unshift({
      student, subject, marks: '—', feePaid: false, evaluator: '—',
      status: 'Fee Pending', statusClass: 'badge-danger',
    });
    closeModal();
    showPage('revaluation');
    showToast('Revaluation request submitted for ' + student);
  });
}

function openTrackRevaluationModal() {
  const cfg = getRevalConfig();
  const students = cfg.universityRevaluationTracking.map(r => r.student).filter((v,i,a) => a.indexOf(v) === i);
  const subjects = cfg.universityRevaluationTracking.map(r => r.subject).filter((v,i,a) => a.indexOf(v) === i);
  openFormModal('Track University Revaluation', `
    <div class="form-group"><label>Student</label>
      <select class="form-control" id="newTrackStudent">
        ${students.map(s => `<option>${s}</option>`).join('') || '<option>New Student</option>'}
      </select>
    </div>
    <div class="form-group"><label>Subject</label>
      <select class="form-control" id="newTrackSubject">
        ${subjects.map(s => `<option>${s}</option>`).join('') || '<option>General</option>'}
      </select>
    </div>
    <div class="form-group"><label>University Application Number</label>
      <input class="form-control" id="newTrackAppNum" placeholder="Enter application #">
    </div>
  `, 'Track Application', function () {
    const student = document.getElementById('newTrackStudent').value;
    const subject = document.getElementById('newTrackSubject').value;
    getRevalConfig().universityRevaluationTracking.unshift({
      student, subject, marks: '—', feePaid: true,
      uniStatus: 'Submitted to University', uniStatusClass: 'badge-warning', revised: '—',
    });
    closeModal();
    showPage('revaluation');
    showToast('Tracking application for ' + student);
  });
}

function openAssignRevaluationModal(student) {
  openFormModal('Assign Revaluation — ' + student, `
    <div class="form-group"><label>Select Evaluator</label>
      <select class="form-control" id="assignRevalEvaluator">
        ${data.faculty.map(f => `<option>${f.name}</option>`).join('')}
      </select>
    </div>
  `, 'Assign', function () {
    const evaluator = document.getElementById('assignRevalEvaluator').value;
    const entry = getRevalConfig().revaluationApplications.find(r => r.student === student);
    if (entry) {
      entry.evaluator = evaluator;
      entry.status = 'In Progress';
      entry.statusClass = 'badge-info';
    }
    closeModal();
    showPage('revaluation');
    showToast(evaluator + ' assigned to ' + student + "'s revaluation");
  });
}
