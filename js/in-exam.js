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
function renderAttendance() {
  const rows = data.students.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>DS & Algorithms</td><td><select class="form-control" style="width:auto;min-width:100px;padding:4px 8px"><option>Present</option><option>Absent</option><option>Malpractice</option><option>Withheld</option></select></td><td><input class="form-control" style="width:120px;padding:4px 8px" placeholder="Booklet #"></td><td><input class="form-control" style="width:60px;padding:4px 8px" placeholder="0"></td></tr>`).join('');
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Invigilator: Mark student attendance and enter answer sheet details.</div>
      <div class="filter-bar">
        <select class="form-control"><option>10 Apr 2026 - Morning</option></select>
        <select class="form-control"><option>Lab 101 - DS & Algorithms</option></select>
        <span class="chip"><i class="fas fa-user-check" style="color:#059669"></i> 30 Present</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="showActionModal('Attendance Submitted','Room Lab 101 attendance has been recorded. Waiting for Exam Branch verification.', {icon:'fa-check-circle', iconColor:'#059669', confirmLabel:'OK', confirmIcon:'fa-check'})"><i class="fas fa-check"></i> Submit Attendance</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-clipboard-list"></i> Room Lab 101 - Student Attendance</h3><div class="flex gap-2"><button class="btn btn-sm btn-success" onclick="showActionModal('Attendance Verified & Locked','Verified by Exam Branch. Ready for D-Form generation.', {icon:'fa-lock', iconColor:'#059669', confirmLabel:'OK', confirmIcon:'fa-check'})"><i class="fas fa-lock"></i> Verify & Lock</button></div></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student ID</th><th>Name</th><th>Subject</th><th>Attendance</th><th>Answer Sheet #</th><th>Suppl.</th></tr>
              ${rows}
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
function renderAnswerSheet() {
  return `
    <div class="page-content">
      <div class="alert alert-info"><i class="fas fa-info-circle"></i> Track answer sheet / booklet numbers issued to each student.</div>
      <div class="filter-bar">
        <select class="form-control"><option>10 Apr 2026 - Morning</option></select>
        <select class="form-control"><option>All Rooms</option></select>
        <button class="btn btn-sm" style="margin-left:auto" onclick="showActionModal('Export Answer Sheet Report','The answer sheet / booklet number mapping report has been exported.', {icon:'fa-file-export', confirmLabel:'Download', confirmIcon:'fa-download'})"><i class="fas fa-file-export"></i> Export Answer Sheet Report</button>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-file-alt"></i> Answer Sheet Number Mapping</h3></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <tr><th>Student</th><th>Subject</th><th>Room</th><th>Answer Sheet #</th><th>Suppl. Sheets</th><th>Verified</th></tr>
              <tr><td>S001 - Aarav Sharma</td><td>DS & Algorithms</td><td>Lab 101</td><td>AS-00101</td><td>2</td><td><span class="badge badge-success">Yes</span></td></tr>
              <tr><td>S002 - Priya Patel</td><td>DS & Algorithms</td><td>Lab 101</td><td>AS-00102</td><td>1</td><td><span class="badge badge-success">Yes</span></td></tr>
              <tr><td>S003 - Rahul Verma</td><td>DS & Algorithms</td><td>Lab 101</td><td>AS-00103</td><td>0</td><td><span class="badge badge-success">Yes</span></td></tr>
              <tr><td>S004 - Sneha Reddy</td><td>DS & Algorithms</td><td>Lab 101</td><td>AS-00104</td><td>3</td><td><span class="badge badge-warning">Pending</span></td></tr>
              <tr><td>S005 - Vikram Singh</td><td>DS & Algorithms</td><td>Lab 101</td><td>AS-00105</td><td>1</td><td><span class="badge badge-warning">Pending</span></td></tr>
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
function renderMalpractice() {
  const rows = data.malpracticeCases.map((c, i) => `<tr><td>${c.date}</td><td>${c.student}</td><td>${c.subject}</td><td><span class="badge ${c.typeClass}">${c.type}</span></td><td>${c.remarks}</td><td><span class="badge ${c.statusClass}">${c.status}</span></td><td><button class="btn btn-sm" onclick="showActionModal('${c.type} Case — ${c.student}','Subject: ${c.subject}. Remarks: ${c.remarks}. Status: ${c.status}.', {icon:'fa-exclamation-triangle', iconColor:'var(--danger)'})">View</button></td></tr>`).join('');
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
            <div class="stat-card"><div class="label">Registered</div><div class="value" style="color:var(--primary)">248</div></div>
            <div class="stat-card"><div class="label">Present</div><div class="value" style="color:var(--success)">238</div></div>
            <div class="stat-card"><div class="label">Absent</div><div class="value" style="color:var(--danger)">8</div></div>
            <div class="stat-card"><div class="label">Malpractice</div><div class="value" style="color:var(--warning)">2</div></div>
          </div>
          <div class="table-wrap mt-2">
            <table>
              <tr><th>Subject</th><th>Date</th><th>Registered</th><th>Present</th><th>Absent</th><th>Malpractice</th><th>Answer Sheets</th></tr>
              <tr><td>DS & Algorithms</td><td>10 Apr</td><td>42</td><td>40</td><td>1</td><td>1</td><td>40</td></tr>
              <tr><td>DBMS</td><td>12 Apr</td><td>42</td><td>41</td><td>1</td><td>0</td><td>41</td></tr>
              <tr><td>Operating Systems</td><td>14 Apr</td><td>42</td><td>39</td><td>2</td><td>1</td><td>39</td></tr>
              <tr><td>Computer Networks</td><td>16 Apr</td><td>42</td><td>42</td><td>0</td><td>0</td><td>42</td></tr>
              <tr><td>Software Engineering</td><td>18 Apr</td><td>42</td><td>40</td><td>2</td><td>0</td><td>40</td></tr>
              <tr><td>Mathematics IV</td><td>20 Apr</td><td>38</td><td>36</td><td>2</td><td>0</td><td>36</td></tr>
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
