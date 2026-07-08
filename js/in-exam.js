// ============================================================
// IN-EXAM MODULE — render functions
// ------------------------------------------------------------
// Activities that happen DURING the examination period.
// Logins that use this module:
//   • Invigilator  — Attendance, Answer Sheet capture, records Special Cases
//   • Exam Branch  — verifies/locks attendance, D-Form, Collection & Dispatch
//   • Admin        — super-user, full access
// (Student / Evaluator / Scrutinizer are NOT involved in In-Exam.)
//
// These mirror the inline functions in demo/index.html so the standalone
// In-Exam pages and the main SPA stay in sync. They depend on `data`
// (data.js), the modal/toast helpers (core.js) and openRecordCaseModal
// (create-flows.js).
// ============================================================

// ============================================================
// 4.1 EXAM-DAY ATTENDANCE  (Invigilator marks → Exam Branch verifies & locks)
// ============================================================
// Deterministic (not real, but reproducible) room split of the 12 named
// students across the 5 real rooms in data.rooms, so the Room selector
// actually changes who's shown instead of always listing everyone under a
// single hardcoded "Lab 101".
function getStudentRoom(index) {
  return data.rooms[index % data.rooms.length].name;
}
function getAttendanceRoster(room) {
  return data.students.filter((s, i) => getStudentRoom(i) === room);
}

let selectedAttendanceSlotIndex = 0;
let selectedAttendanceRoom = null;

// Keyed by date|session|room so switching slot/room and coming back keeps
// whatever was entered, instead of resetting on every render.
const attendanceSessions = {};

function attendanceKey(date, session, room) {
  return `${date}|${session}|${room}`;
}

function getAttendanceSession(date, session, room, roster) {
  const key = attendanceKey(date, session, room);
  if (!attendanceSessions[key]) {
    attendanceSessions[key] = {
      submitted: false,
      verified: false,
      entries: Object.fromEntries(roster.map(s => [s.id, { status: 'Present', sheet: '', suppl: '' }])),
    };
  }
  return attendanceSessions[key];
}

function changeAttendanceSlot(value) {
  selectedAttendanceSlotIndex = Number(value);
  showPage('attendance');
}

function changeAttendanceRoom(value) {
  selectedAttendanceRoom = value;
  showPage('attendance');
}

function getCurrentAttendanceContext() {
  const slots = data.timetableSlots;
  const idx = Math.min(selectedAttendanceSlotIndex, slots.length - 1);
  const slot = slots[idx];
  const room = (selectedAttendanceRoom && data.rooms.some(r => r.name === selectedAttendanceRoom))
    ? selectedAttendanceRoom
    : data.rooms[0].name;
  selectedAttendanceRoom = room;
  const roster = getAttendanceRoster(room);
  const session = getAttendanceSession(slot.date, slot.session, room, roster);
  return { slots, idx, slot, room, roster, session };
}

function submitAttendance() {
  const { slot, room, roster, session } = getCurrentAttendanceContext();
  roster.forEach(s => {
    const statusEl = document.getElementById(`att-status-${s.id}`);
    const sheetEl = document.getElementById(`att-sheet-${s.id}`);
    const supplEl = document.getElementById(`att-suppl-${s.id}`);
    session.entries[s.id] = {
      status: statusEl ? statusEl.value : session.entries[s.id].status,
      sheet: sheetEl ? sheetEl.value.trim() : session.entries[s.id].sheet,
      suppl: supplEl ? supplEl.value.trim() : session.entries[s.id].suppl,
    };
  });
  session.submitted = true;
  const presentCount = Object.values(session.entries).filter(e => e.status === 'Present').length;
  showPage('attendance');
  showActionModal('Attendance Submitted', `Room ${room} attendance for ${slot.subject} (${slot.date} - ${slot.session}) has been recorded — ${presentCount} of ${roster.length} present. Waiting for Exam Branch verification.`, {
    icon: 'fa-check-circle', iconColor: '#059669', showCancel: false, confirmLabel: 'OK', confirmIcon: 'fa-check',
  });
}

function verifyAttendance() {
  const { slot, room, session } = getCurrentAttendanceContext();
  if (!session.submitted) {
    showToast('Submit attendance for this room before it can be verified and locked');
    return;
  }
  session.verified = true;
  showPage('attendance');
  showActionModal('Attendance Verified & Locked', `Room ${room} attendance for ${slot.subject} has been verified by the Exam Branch and is now locked. Ready for D-Form generation.`, {
    icon: 'fa-lock', iconColor: '#059669', showCancel: false, confirmLabel: 'OK', confirmIcon: 'fa-check',
  });
}

function renderAttendance() {
  const { slots, idx, slot, room, roster, session } = getCurrentAttendanceContext();
  const presentCount = Object.values(session.entries).filter(e => e.status === 'Present').length;
  const slotOptions = slots.map((s, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${s.date} - ${s.session}</option>`).join('');
  const roomOptions = data.rooms.map(r => `<option value="${r.name}" ${r.name === room ? 'selected' : ''}>${r.name} - ${slot.subject}</option>`).join('');
  const isLocked = session.verified || session.submitted;
  const rows = roster.map(s => {
    const entry = session.entries[s.id];
    return `<tr>
      <td>${s.id}</td><td>${s.name}</td><td>${slot.subject}</td>
      <td><select class="form-control" id="att-status-${s.id}" style="width:auto;min-width:120px;padding:4px 8px" ${isLocked ? 'disabled' : ''}>${['Present', 'Absent', 'Malpractice', 'Withheld'].map(opt => `<option ${entry.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select></td>
      <td><input class="form-control" id="att-sheet-${s.id}" style="width:120px;padding:4px 8px" placeholder="Booklet #" value="${entry.sheet}" ${isLocked ? 'disabled' : ''}></td>
      <td><input class="form-control" id="att-suppl-${s.id}" style="width:120px;padding:4px 8px" placeholder="Suppl. Booklet # (if any)" value="${entry.suppl}" ${isLocked ? 'disabled' : ''}></td>
    </tr>`;
  }).join('');
  const statusBadge = session.verified
    ? `<span class="badge badge-success"><i class="fas fa-lock"></i> Verified &amp; Locked</span>`
    : session.submitted
      ? `<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending verification</span>`
      : `<span class="badge badge-neutral">Not submitted</span>`;
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Invigilator: Mark student attendance and enter answer sheet details.</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeAttendanceSlot(this.value)">${slotOptions}</select>
        <select class="form-control" onchange="changeAttendanceRoom(this.value)">${roomOptions}</select>
        <span class="chip"><i class="fas fa-user-check" style="color:#059669"></i> ${presentCount} Present</span>
        ${statusBadge}
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="submitAttendance()" ${session.submitted ? 'disabled title="Already submitted for this room"' : ''}><i class="fas fa-check"></i> Submit Attendance</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-clipboard-list"></i> Room ${room} - Student Attendance</h3><div class="flex gap-2"><button class="btn btn-sm btn-success" onclick="verifyAttendance()" ${(!session.submitted || session.verified) ? `disabled title="${session.verified ? 'Already verified' : 'Submit attendance first'}"` : ''}><i class="fas fa-lock"></i> Verify & Lock</button></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student ID</th><th>Name</th><th>Subject</th><th>Attendance</th><th>Answer Sheet #</th><th>Suppl. Booklet #</th></tr>
              ${rows || '<tr><td colspan="6" class="text-center text-muted" style="padding:20px">No students assigned to this room for this session.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 4.2 ANSWER SHEET NUMBER CAPTURE  (Invigilator)
// ============================================================
// Pulls straight from the same `attendanceSessions` state that Attendance
// (4.1) writes to on Submit — this page only ever shows a room/session once
// its attendance has actually been submitted, so a booklet number recorded
// here always traces back to a real Attendance entry, not a canned mock row.
let selectedAnswerSheetSlotIndex = 0;
let selectedAnswerSheetRoom = 'All Rooms';

function changeAnswerSheetSlot(value) {
  selectedAnswerSheetSlotIndex = Number(value);
  showPage('answer-sheet');
}

function changeAnswerSheetRoom(value) {
  selectedAnswerSheetRoom = value;
  showPage('answer-sheet');
}

function getAnswerSheetMapping(slot, room) {
  const roomsToCheck = room === 'All Rooms' ? data.rooms.map(r => r.name) : [room];
  const mapping = [];
  roomsToCheck.forEach(roomName => {
    const session = attendanceSessions[attendanceKey(slot.date, slot.session, roomName)];
    if (!session || !session.submitted) return;
    getAttendanceRoster(roomName).forEach(s => {
      const entry = session.entries[s.id];
      if (!entry) return;
      mapping.push({ student: s, room: roomName, entry, verified: session.verified });
    });
  });
  return mapping;
}

function renderAnswerSheet() {
  const slots = data.timetableSlots;
  const idx = Math.min(selectedAnswerSheetSlotIndex, slots.length - 1);
  const slot = slots[idx];
  const mapping = getAnswerSheetMapping(slot, selectedAnswerSheetRoom);
  const slotOptions = slots.map((s, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${s.date} - ${s.session}</option>`).join('');
  const roomOptions = ['All Rooms', ...data.rooms.map(r => r.name)].map(r => `<option ${r === selectedAnswerSheetRoom ? 'selected' : ''}>${r}</option>`).join('');
  const rows = mapping.map(({ student, room, entry, verified }) => `<tr>
      <td>${student.id} - ${student.name}</td>
      <td>${slot.subject}</td>
      <td>${room}</td>
      <td>${entry.sheet ? entry.sheet : '<span class="text-muted">Not recorded</span>'}</td>
      <td>${entry.suppl ? entry.suppl : '<span class="text-muted">—</span>'}</td>
      <td><span class="badge ${verified ? 'badge-success' : 'badge-warning'}">${verified ? 'Yes' : 'Pending'}</span></td>
    </tr>`).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Track answer sheet / booklet numbers issued to each student — pulled from what invigilators submitted on Attendance.</div>
      <div class="filter-bar">
        <select class="form-control" onchange="changeAnswerSheetSlot(this.value)">${slotOptions}</select>
        <select class="form-control" onchange="changeAnswerSheetRoom(this.value)">${roomOptions}</select>
        <span class="chip"><i class="fas fa-file-alt"></i> ${mapping.length} sheet(s) mapped</span>
        <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Export Answer Sheet Report','The answer sheet / booklet number mapping report (${mapping.length} record(s)) has been exported.', {icon:'fa-file-export', confirmLabel:'Download', confirmIcon:'fa-download'})"><i class="fas fa-file-export"></i> Export Answer Sheet Report</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-file-alt"></i> Answer Sheet Number Mapping</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student</th><th>Subject</th><th>Room</th><th>Answer Sheet #</th><th>Suppl. Booklet #</th><th>Verified</th></tr>
              ${rows || '<tr><td colspan="6" class="text-center text-muted" style="padding:20px">No attendance has been submitted for this date/session/room yet — go to Attendance to record it first.</td></tr>'}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 4.3 MALPRACTICE & SPECIAL CASE RECORDING  (Invigilator or Exam Branch)
// ============================================================
function viewMalpracticeCase(index) {
  const c = data.malpracticeCases[index];
  if (!c) return;
  const isUnderReview = c.status === 'Under Review';
  const body = `
    <div class="text-center" style="padding:8px 0 16px">
      <i class="fas fa-exclamation-triangle" style="font-size:40px;color:var(--danger)"></i>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="font-weight:600;padding:6px 0;width:140px">Date</td><td>${c.date}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Student</td><td>${c.student}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Subject</td><td>${c.subject}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Case Type</td><td><span class="badge ${c.typeClass}">${c.type}</span></td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Remarks</td><td>${c.remarks}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0">Status</td><td><span class="badge ${c.statusClass}">${c.status}</span></td></tr>
    </table>
  `;
  const footer = `<button class="btn" onclick="closeModal()">Close</button>${isUnderReview ? `<button class="btn btn-primary" onclick="resolveMalpracticeCase(${index})"><i class="fas fa-check"></i> Mark Resolved</button>` : ''}`;
  openModal(`${c.type} Case — ${c.student}`, body, footer);
}

function resolveMalpracticeCase(index) {
  const c = data.malpracticeCases[index];
  if (!c) return;
  c.status = 'Resolved';
  c.statusClass = 'badge-info';
  closeModal();
  showPage('malpractice');
  showToast('Case marked Resolved for ' + c.student);
}

function renderMalpractice() {
  const rows = data.malpracticeCases.map((c, i) => `<tr><td>${c.date}</td><td>${c.student}</td><td>${c.subject}</td><td><span class="badge ${c.typeClass}">${c.type}</span></td><td>${c.remarks}</td><td><span class="badge ${c.statusClass}">${c.status}</span></td><td><button class="btn btn-sm" onclick="viewMalpracticeCase(${i})">View</button></td></tr>`).join('');
  return `
    <div class="page-content">
      <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Record special cases: malpractice, court case, withheld, blank booklet, mismatch, etc.</div>
      <div class="filter-bar">
        <select class="form-control"><option>Sem IV Regular Apr 2026</option></select>
        <button class="btn btn-primary btn-sm" onclick="openRecordCaseModal()"><i class="fas fa-plus"></i> Record New Case</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-exclamation-circle"></i> Special Cases Recorded</h3><span class="text-muted">${data.malpracticeCases.length} case(s)</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Date</th><th>Student</th><th>Subject</th><th>Case Type</th><th>Remarks</th><th>Status</th><th></th></tr>
              ${rows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 4.4 D-FORM / ATTENDANCE REPORT GENERATION  (Exam Branch)
// ============================================================
function renderDForm() {
  const summary = getExamResultSummary('Sem IV Regular Apr 2026');
  // No absentees/malpractice modeled among the 10 real registered students —
  // every subject's Present/Answer Sheets equal its real registered count.
  const subjectRows = summary.subjectStats.map(s => {
    const slot = data.timetableSlots.find(t => t.code === s.code);
    const dateShort = slot ? slot.date.replace(/ \d{4}$/, '') : '—';
    return `<tr><td>${s.name}</td><td>${dateShort}</td><td>${s.total}</td><td>${s.total}</td><td>0</td><td>0</td><td>${s.total}</td></tr>`;
  }).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Generate D-Form / Attendance Summary Report after attendance verification.</div>
      <div class="filter-bar">
        <select class="form-control"><option>Sem IV Regular Apr 2026</option></select>
        <select class="form-control"><option>10 Apr 2026 - DS & Algorithms</option></select>
        <button class="btn btn-primary btn-sm" onclick="showActionModal('D-Form Generated','D-Form has been generated. You can download it below.', {icon:'fa-file-alt', confirmLabel:'Download D-Form', confirmIcon:'fa-download'})"><i class="fas fa-file-alt"></i> Generate D-Form</button>
        <button class="btn btn-sm" onclick="showActionModal('Lock Attendance','Lock attendance records for all 6 subjects? Once locked, attendance cannot be edited without proper authorization.', {icon:'fa-lock', confirmLabel:'Lock', confirmIcon:'fa-lock'})"><i class="fas fa-lock"></i> Lock Attendance</button>
        <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Download Report','The D-Form / attendance summary report has been downloaded.', {icon:'fa-download', confirmLabel:'Download', confirmIcon:'fa-download'})"><i class="fas fa-download"></i> Download Report</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-file-invoice"></i> D-Form / Attendance Summary</h3></div>
        <div class="card-body">
          <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card"><div class="label">Registered</div><div class="value" style="color:var(--primary)">${summary.totalStudents}</div></div>
            <div class="stat-card"><div class="label">Present</div><div class="value" style="color:var(--success)">${summary.totalStudents}</div></div>
            <div class="stat-card"><div class="label">Absent</div><div class="value" style="color:var(--danger)">0</div></div>
            <div class="stat-card"><div class="label">Malpractice</div><div class="value" style="color:var(--warning)">0</div></div>
          </div>
          <div class="table-wrap mt-2">
            <table>
              <tr><th>Subject</th><th>Date</th><th>Registered</th><th>Present</th><th>Absent</th><th>Malpractice</th><th>Answer Sheets</th></tr>
              ${subjectRows}
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 4.5 ANSWER SHEET COLLECTION & DISPATCH  (Exam Branch)
// Autonomous -> move to Bundle Creation. Affiliated -> dispatch report.
// ============================================================
function renderCollection() {
  const isAffiliated = currentMode === 'affiliated';
  const modeAlert = isAffiliated
    ? 'Affiliated: Verify answer sheet collection against attendance, then generate a dispatch report for submission to the university.'
    : 'Verify answer sheet collection matches attendance, then move to bundle creation for evaluation.';
  const verifyBtn = isAffiliated
    ? `<button class="btn btn-primary btn-sm" onclick="showActionModal('Collection Verified','Answer sheets verified against attendance. Proceed to generate the dispatch report for the university.', {icon:'fa-truck', confirmLabel:'Generate Dispatch Report', confirmIcon:'fa-truck'})"><i class="fas fa-check"></i> Verify Collection</button>`
    : `<button class="btn btn-primary btn-sm" onclick="showActionModal('Collection Verified','Answer sheets verified. Next step is Bundle Creation (Post-Exam) for evaluation.', {icon:'fa-check-circle', iconColor:'#059669', confirmLabel:'OK', confirmIcon:'fa-check'})"><i class="fas fa-check"></i> Verify Collection</button>`;
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> ${modeAlert}</div>
      <div class="filter-bar">
        <select class="form-control"><option>Sem IV Regular Apr 2026</option></select>
        ${verifyBtn}
        <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Generate Dispatch Report','A dispatch report listing all collected answer sheets has been generated for submission.', {icon:'fa-truck', confirmLabel:'Download', confirmIcon:'fa-download'})"><i class="fas fa-truck"></i> Generate Dispatch Report</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-boxes"></i> Answer Sheet Collection Status</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Room</th><th>Subject</th><th>Present</th><th>Collected</th><th>Verified</th><th>Status</th></tr>
              <tr><td>Lab 101</td><td>DS & Algorithms</td><td>30</td><td>30</td><td><span class="badge badge-success">Yes</span></td><td><span class="badge badge-success">Verified</span></td></tr>
              <tr><td>Lab 102</td><td>DS & Algorithms</td><td>28</td><td>28</td><td><span class="badge badge-success">Yes</span></td><td><span class="badge badge-success">Verified</span></td></tr>
              <tr><td>Lecture Hall A</td><td>DS & Algorithms</td><td>60</td><td>59</td><td><span class="badge badge-danger">No</span></td><td><span class="badge badge-warning">Mismatch</span></td></tr>
              <tr><td>Lecture Hall B</td><td>DS & Algorithms</td><td>60</td><td>60</td><td><span class="badge badge-success">Yes</span></td><td><span class="badge badge-success">Verified</span></td></tr>
              <tr><td>Seminar Hall</td><td>DS & Algorithms</td><td>70</td><td>70</td><td><span class="badge badge-success">Yes</span></td><td><span class="badge badge-success">Verified</span></td></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
