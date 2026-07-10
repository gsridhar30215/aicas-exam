// ============================================================
// CREATE FLOWS — these mutate the `data` arrays and re-render the
// current page, so newly created items actually appear in their table.
// ============================================================

function openRecordCaseModal() {
  openFormModal('Record Special Case', `
    <div class="form-group"><label>Student</label>
      <select class="form-control" id="newCaseStudent">
        ${data.students.map(s => `<option>${s.name} (${s.id})</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Subject</label>
      <select class="form-control" id="newCaseSubject">
        ${data.subjects.map(s => `<option>${s.name}</option>`).join('')}
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

// "10:00 - 12:00" -> { start: 600, end: 720 } (minutes since midnight), used
// to detect real overlaps regardless of the Morning/Afternoon session label.
function parseSlotTimeRange(timeStr) {
  const parts = (timeStr || '').split('-').map(t => t.trim());
  const toMinutes = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
  return { start: toMinutes(parts[0]), end: toMinutes(parts[1]) };
}

// Keeps the Duration stepper honest with whatever Start/End Time was just
// picked, rounded to the nearest half hour — still just a starting point,
// since the field itself stays editable for e.g. a scheduled break.
function syncSlotDurationFromTimes() {
  const start = document.getElementById('newSlotStartTime').value;
  const end = document.getElementById('newSlotEndTime').value;
  const durationInput = document.getElementById('newSlotDurationHrs');
  if (!start || !end || !durationInput) return;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMinutes > 0) durationInput.value = Math.round((diffMinutes / 60) * 2) / 2;
}

// Repopulates the Subject select to whichever program is currently chosen —
// called on open and whenever the Program dropdown changes.
function updateSlotSubjectOptions() {
  const examSubjects = getExamSubjects(currentExamLabel);
  const programSelect = document.getElementById('newSlotProgram');
  const subjectSelect = document.getElementById('newSlotSubject');
  if (!subjectSelect) return;
  const program = programSelect ? programSelect.value : null;
  const options = program ? examSubjects.filter(s => s.program === program) : examSubjects;
  subjectSelect.innerHTML = options.map(s => `<option value="${s.code}">${s.name} (${s.code})</option>`).join('');
}

function openAddSlotModal() {
  const examSubjects = getExamSubjects(currentExamLabel);
  // A Program picker only earns its place when this exam actually spans more
  // than one program (Sem IV's real-world "many papers, many rooms, one day"
  // catalog) — exams with a single implicit program (Sem VI, Sem II Suppl.)
  // keep the plain flat Subject dropdown instead.
  const programs = [...new Set(examSubjects.map(s => s.program).filter(Boolean))];
  const hasPrograms = programs.length > 1;
  // Never default to — or allow picking — a date before today, so Add Slot
  // can't backdate an exam into the past.
  const todayISO = new Date().toISOString().slice(0, 10);
  const programField = hasPrograms ? `
    <div class="form-group"><label>Program</label>
      <select class="form-control" id="newSlotProgram" onchange="updateSlotSubjectOptions()">
        ${programs.map(p => `<option value="${p}">${p}${getProgramCode(p) ? ` (${getProgramCode(p)})` : ''}</option>`).join('')}
      </select>
    </div>` : '';
  const initialSubjectOptions = (hasPrograms ? examSubjects.filter(s => s.program === programs[0]) : examSubjects)
    .map(s => `<option value="${s.code}">${s.name} (${s.code})</option>`).join('');
  openFormModal('Add Timetable Slot', `
    <div id="addSlotError" class="alert alert-danger hidden"></div>
    <div class="form-row">
      <div class="form-group"><label>Date</label><input type="date" class="form-control" id="newSlotDate" value="${todayISO}" min="${todayISO}"></div>
      <div class="form-group"><label>Session</label>
        <select class="form-control" id="newSlotSession"><option>Morning</option><option>Afternoon</option></select>
      </div>
    </div>
    ${programField}
    <div class="form-group"><label>Subject</label>
      <select class="form-control" id="newSlotSubject">${initialSubjectOptions}</select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Start Time</label><input type="time" class="form-control" id="newSlotStartTime" value="10:00" onchange="syncSlotDurationFromTimes()"></div>
      <div class="form-group"><label>End Time</label><input type="time" class="form-control" id="newSlotEndTime" value="12:00" onchange="syncSlotDurationFromTimes()"></div>
    </div>
    <div class="form-group"><label>Duration</label>
      <div class="flex gap-2" style="align-items:center">
        <input type="number" class="form-control" id="newSlotDurationHrs" value="2" min="1" max="6" step="0.5" style="max-width:100px">
        <span class="text-muted">hrs (auto-filled from Start/End Time — adjust if needed)</span>
      </div>
    </div>
  `, 'Add Slot', function () {
    const dateRaw = document.getElementById('newSlotDate').value;
    const date = dateRaw ? new Date(dateRaw + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';
    const session = document.getElementById('newSlotSession').value;
    const code = document.getElementById('newSlotSubject').value;
    const subjectDef = examSubjects.find(s => s.code === code);
    const subject = subjectDef?.name || code;
    const program = subjectDef?.program || null;
    const startTime = document.getElementById('newSlotStartTime').value;
    const endTime = document.getElementById('newSlotEndTime').value;
    const time = (startTime && endTime) ? `${startTime} - ${endTime}` : 'TBD';
    const durationHrs = document.getElementById('newSlotDurationHrs').value;
    const duration = durationHrs ? `${Number(durationHrs)} ${Number(durationHrs) === 1 ? 'hr' : 'hrs'}` : 'TBD';
    const errorBox = document.getElementById('addSlotError');
    const slots = getExamTimetableSlots(currentExamLabel);
    // Block an exact duplicate entry (same Date, Session, Subject, Time and
    // Duration).
    const exactDuplicate = slots.find(s => s.date === date && s.session === session && s.code === code && s.time === time && s.duration === duration);
    if (exactDuplicate) {
      errorBox.textContent = 'Duplicate timetable entry. An exam with the same Date, Session, Subject, Time, and Duration already exists. Please modify the details before adding the slot.';
      errorBox.classList.remove('hidden');
      return;
    }
    // Block a time clash only against another slot for the SAME program —
    // those exams share students, so they genuinely can't overlap. Different
    // programs (different students, different rooms) can and do run at the
    // same time on a real exam day, so they're never blocked against each
    // other here. Exams with no program info at all (legacy/un-tagged slots)
    // fall back to the old "block any overlap" behavior.
    const overlapping = slots.find(s => {
      if (s.date !== date) return false;
      if (program && s.program && s.program !== program) return false;
      const a = parseSlotTimeRange(time);
      const b = parseSlotTimeRange(s.time);
      if ([a.start, a.end, b.start, b.end].some(Number.isNaN)) return false;
      return a.start < b.end && b.start < a.end;
    });
    if (overlapping) {
      errorBox.textContent = `This time (${time}) overlaps with ${overlapping.subject} (${overlapping.code}) already scheduled ${overlapping.date} at ${overlapping.time}${program && program === overlapping.program ? ` for ${program}` : ''}. Students of the same program cannot sit two exams at once.`;
      errorBox.classList.remove('hidden');
      return;
    }
    slots.push({ date, session, subject, code, time, duration, published: false, program });
    closeModal();
    showPage('timetable');
    showToast('Slot added for ' + subject);
  });
}

function publishTimetable() {
  const slots = getExamTimetableSlots(currentExamLabel);
  showActionModal('Publish Timetable', `${slots.length} subjects scheduled. No conflicts found. Publish the timetable so it becomes visible for hall ticket generation.`, {
    icon: 'fa-check-circle', iconColor: 'var(--success)', confirmLabel: 'Publish', confirmIcon: 'fa-check',
    onConfirm: function () {
      slots.forEach(s => { s.published = true; });
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
