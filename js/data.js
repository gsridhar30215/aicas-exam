// ============================================================
// DATA
// ============================================================
const data = {
  // attendance/feeStatus back the Eligibility page's multi-reason checks
  // (attendance shortage, fee pending, detained, inactive — spec 3.2).
  students: [
    { id: 'S001', name: 'Aarav Sharma', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 92, feeStatus: 'Paid' },
    { id: 'S002', name: 'Priya Patel', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 88, feeStatus: 'Paid' },
    { id: 'S003', name: 'Rahul Verma', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 81, feeStatus: 'Paid' },
    { id: 'S004', name: 'Sneha Reddy', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 95, feeStatus: 'Paid' },
    { id: 'S005', name: 'Vikram Singh', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 79, feeStatus: 'Paid' },
    { id: 'S006', name: 'Ananya Gupta', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 90, feeStatus: 'Paid' },
    { id: 'S007', name: 'Rohit Joshi', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Detained', attendance: 58, feeStatus: 'Paid' },
    { id: 'S008', name: 'Kavita Nair', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 86, feeStatus: 'Paid' },
    { id: 'S009', name: 'Arjun Desai', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 77, feeStatus: 'Paid' },
    { id: 'S010', name: 'Divya Kulkarni', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 93, feeStatus: 'Paid' },
    { id: 'S021', name: 'Sanjay Mehta', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Active', attendance: 84, feeStatus: 'Pending' },
    { id: 'S022', name: 'Neha Kapoor', program: 'B.E. Computer', sem: 'IV', reg: '2022-24', status: 'Inactive', attendance: 80, feeStatus: 'Paid' },
  ],
  // verifiedSheets = answer sheets verified after Collection/Dispatch (In-Exam
  // 4.5), available for Bundle Creation to draw from ("Fetch Verified Answer
  // Sheets" step). Bundle Creation should not let you bundle more than this.
  subjects: [
    { code: 'CS401', name: 'Data Structures & Algorithms', credits: 4, verifiedSheets: 238 },
    { code: 'CS402', name: 'Database Management Systems', credits: 4, verifiedSheets: 226 },
    { code: 'CS403', name: 'Operating Systems', credits: 3, verifiedSheets: 231 },
    { code: 'CS404', name: 'Computer Networks', credits: 3, verifiedSheets: 240 },
    { code: 'CS405', name: 'Software Engineering', credits: 3, verifiedSheets: 219 },
    { code: 'CS406', name: 'Mathematics IV', credits: 3, verifiedSheets: 205 },
  ],
  // Declared public holidays, checked against scheduled exam dates by the
  // Timetable page's Holiday Validation. Dates use the same "DD Mon YYYY"
  // display format as every other date in this app.
  holidays: ['26 Jan 2026', '04 Mar 2026', '15 Aug 2026', '02 Oct 2026', '08 Nov 2026'],
  rooms: [
    { name: 'Lab 101', capacity: 30 },
    { name: 'Lab 102', capacity: 30 },
    { name: 'Lecture Hall A', capacity: 60 },
    { name: 'Lecture Hall B', capacity: 60 },
    { name: 'Seminar Hall', capacity: 80 },
    // 3 new rooms, kept at 8 total (not 9) so it stays in step with the 8
    // faculty below: getInvigilatorAssignments' default seed relies on
    // rooms.length - 1 assignable rooms mapping onto faculty.length via
    // modulo — mismatched counts would auto-assign the same faculty to two
    // rooms by default, which is exactly what the one-room-per-invigilator
    // rule is supposed to prevent.
    { name: 'Lab 103', capacity: 30 },
    { name: 'Lecture Hall C', capacity: 60 },
    { name: 'Conference Hall', capacity: 40 },
  ],
  faculty: [
    { id: 'F01', name: 'Dr. Meena Iyer', dept: 'Computer' },
    { id: 'F02', name: 'Prof. Amit Kumar', dept: 'Computer' },
    { id: 'F03', name: 'Dr. Sunita Rao', dept: 'Computer' },
    { id: 'F04', name: 'Prof. Rajesh Pillai', dept: 'Computer' },
    { id: 'F05', name: 'Dr. Neha Shah', dept: 'Computer' },
    // Extra faculty beyond what the rooms need each session, so a room can
    // actually get a genuine second/backup invigilator without it being a
    // double-booking (see the rooms list above for why this count matters).
    { id: 'F06', name: 'Dr. Anil Deshpande', dept: 'Computer' },
    { id: 'F07', name: 'Prof. Kavita Menon', dept: 'Computer' },
    { id: 'F08', name: 'Dr. Farah Sheikh', dept: 'Computer' },
    { id: 'F09', name: 'Prof. Vikas Chandran', dept: 'Computer' },
    { id: 'F10', name: 'Dr. Ritu Bhatnagar', dept: 'Computer' },
    { id: 'F11', name: 'Prof. Sameer Joshi', dept: 'Computer' },
    { id: 'F12', name: 'Dr. Lakshmi Narayan', dept: 'Computer' },
  ],
  // Mutable lists — "create" actions push into these so new items actually
  // show up in their tables, instead of just popping a confirmation.
  malpracticeCases: [
    { date: '10 Apr 2026', student: 'Rohit Joshi (S007)', subject: 'DS & Algorithms', type: 'Malpractice', typeClass: 'badge-danger', remarks: 'Cellular phone found', status: 'Under Review', statusClass: 'badge-warning' },
    { date: '12 Apr 2026', student: 'Ananya Gupta (S006)', subject: 'DBMS', type: 'Blank Booklet', typeClass: 'badge-warning', remarks: 'Student reported blank pages', status: 'Resolved', statusClass: 'badge-info' },
  ],
  // A real exam day runs many programs' papers side by side (different
  // rooms, same date/session) — B.E. Computer's own 6 papers keep their
  // original dates/times below, and the Mechanical/Civil/Electrical/
  // Electronics papers scheduled alongside them (same date+time, so they're
  // genuinely simultaneous) are appended right after. Every slot is tagged
  // with `program` so Add Slot's overlap check, Seating, and Invigilator can
  // all tell which exams share students/rooms vs. which just share a date.
  timetableSlots: [
    { date: '10 Apr 2026', session: 'Morning', subject: 'Data Structures & Algorithms', code: 'CS401', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Database Management Systems', code: 'CS402', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Operating Systems', code: 'CS403', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Computer Networks', code: 'CS404', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Software Engineering', code: 'CS405', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Computer' },
    { date: '20 Apr 2026', session: 'Morning', subject: 'Mathematics IV', code: 'CS406', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Computer' },
    { date: '10 Apr 2026', session: 'Morning', subject: 'Thermodynamics', code: 'ME401', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Mechanical' },
    { date: '10 Apr 2026', session: 'Morning', subject: 'Structural Analysis', code: 'CE401', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Civil' },
    { date: '10 Apr 2026', session: 'Morning', subject: 'Electrical Machines', code: 'EE401', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Electrical' },
    { date: '10 Apr 2026', session: 'Morning', subject: 'Analog Electronics', code: 'EC401', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Electronics' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Fluid Mechanics', code: 'ME402', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Mechanical' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Hydraulics', code: 'CE402', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Civil' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Power Systems', code: 'EE402', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Electrical' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Digital Signal Processing', code: 'EC402', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Electronics' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Machine Design', code: 'ME403', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Mechanical' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Geotechnical Engineering', code: 'CE403', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Civil' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Control Systems', code: 'EE403', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Electrical' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Communication Systems', code: 'EC403', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Electronics' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Manufacturing Processes', code: 'ME404', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Mechanical' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Surveying', code: 'CE404', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Civil' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Electrical Measurements', code: 'EE404', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Electrical' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Microprocessors', code: 'EC404', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Electronics' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Strength of Materials', code: 'ME405', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Mechanical' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Concrete Technology', code: 'CE405', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Civil' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Power Electronics', code: 'EE405', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Electrical' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'VLSI Design', code: 'EC405', time: '10:00 - 12:00', duration: '2 hrs', program: 'B.E. Electronics' },
    { date: '20 Apr 2026', session: 'Morning', subject: 'Engineering Mathematics IV', code: 'ME406', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Mechanical' },
    { date: '20 Apr 2026', session: 'Morning', subject: 'Engineering Mathematics IV', code: 'CE406', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Civil' },
    { date: '20 Apr 2026', session: 'Morning', subject: 'Engineering Mathematics IV', code: 'EE406', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Electrical' },
    { date: '20 Apr 2026', session: 'Morning', subject: 'Engineering Mathematics IV', code: 'EC406', time: '10:00 - 13:00', duration: '3 hrs', program: 'B.E. Electronics' },
  ],
  // Unified bundle lifecycle shared by Bundle Creation, Evaluator Assignment,
  // Marks Entry and Scrutiny — one bundle flows through all four pages:
  // Unassigned -> Assigned (evaluator entering marks) -> Completed (submitted,
  // awaiting scrutiny) -> scrutiny: Approved | back to Assigned if returned.
  bundles: [
    { id: 'B-001', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '1 - 25', sheets: 25, evaluator: '—', status: 'Unassigned', statusClass: 'badge-warning', progress: 0, submitted: null, scrutiny: null, scrutinyClass: '', errors: 0 },
    { id: 'B-002', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '26 - 50', sheets: 25, evaluator: '—', status: 'Unassigned', statusClass: 'badge-warning', progress: 0, submitted: null, scrutiny: null, scrutinyClass: '', errors: 0 },
    { id: 'B-003', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '51 - 75', sheets: 25, evaluator: '—', status: 'Unassigned', statusClass: 'badge-warning', progress: 0, submitted: null, scrutiny: null, scrutinyClass: '', errors: 0 },
    { id: 'B-004', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '76 - 100', sheets: 25, evaluator: 'Dr. Meena Iyer', status: 'Assigned', statusClass: 'badge-info', progress: 40, submitted: null, scrutiny: null, scrutinyClass: '', errors: 0 },
    { id: 'B-005', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '101 - 125', sheets: 25, evaluator: 'Prof. Amit Kumar', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '11 Apr 2026', scrutiny: 'Approved', scrutinyClass: 'badge-success', errors: 0 },
    { id: 'B-006', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '126 - 150', sheets: 25, evaluator: 'Dr. Sunita Rao', status: 'Completed', statusClass: 'badge-success', progress: 100, submitted: '13 Apr 2026', scrutiny: 'Pending Review', scrutinyClass: 'badge-warning', errors: 2 },
    { id: 'B-007', subjectCode: 'CS401', subject: 'DS & Algorithms', range: '151 - 175', sheets: 25, evaluator: 'Prof. Rajesh Pillai', status: 'Assigned', statusClass: 'badge-info', progress: 20, submitted: null, scrutiny: null, scrutinyClass: '', errors: 0 },
  ],
  revaluationApplications: [
    { student: 'Rahul Verma', subject: 'OS', marks: 38, feePaid: true, evaluator: '—', status: 'Pending', statusClass: 'badge-warning' },
    { student: 'Arjun Desai', subject: 'DS', marks: 42, feePaid: true, evaluator: 'Dr. Neha Shah', status: 'In Progress', statusClass: 'badge-info' },
    { student: 'Divya Kulkarni', subject: 'SE', marks: 35, feePaid: true, evaluator: 'Dr. Meena Iyer', status: 'Revised: 48', statusClass: 'badge-success' },
    // Vikram Singh is on backlog for this exam (DS/DBMS/CN/SE only — see
    // registrationSubjects override in pre-exam.js) and never sits Maths IV,
    // so his revaluation subject/marks must be one he actually took: DBMS,
    // where he failed at 28 (matches data.examResults below).
    { student: 'Vikram Singh', subject: 'DBMS', marks: 28, feePaid: false, evaluator: '—', status: 'Fee Pending', statusClass: 'badge-danger' },
  ],
  universityRevaluationTracking: [
    { student: 'Rahul Verma', subject: 'OS', marks: 38, feePaid: true, uniStatus: 'Submitted to University', uniStatusClass: 'badge-warning', revised: '—' },
    { student: 'Arjun Desai', subject: 'DS', marks: 42, feePaid: true, uniStatus: 'Awaiting University', uniStatusClass: 'badge-info', revised: '—' },
    { student: 'Divya Kulkarni', subject: 'SE', marks: 35, feePaid: true, uniStatus: 'Revised Result Received', uniStatusClass: 'badge-success', revised: '48' },
    { student: 'Vikram Singh', subject: 'DBMS', marks: 28, feePaid: false, uniStatus: 'Fee Pending', uniStatusClass: 'badge-danger', revised: '—' },
  ],
  memosGenerated: {},
  // Real per-student, per-subject marks for the 10 students who are actually
  // registered/eligible for Sem IV Regular Apr 2026 (data.students minus
  // Rohit Joshi [Detained] and Neha Kapoor [Inactive] — the same roster
  // getRegistrationRoster() produces). Vikram Singh is backlog-only and has
  // no entry for CS403/CS406, matching his registrationSubjects override.
  // This backs every Post-Exam/In-Exam summary (D-Form, Result Processing,
  // Result Freeze, Result Declaration, Marks Memo) so they all count and
  // grade the same real people instead of independent placeholder totals.
  examResults: {
    'Sem IV Regular Apr 2026': {
      subjects: [
        { code: 'CS401', name: 'Data Structures & Algorithms', credits: 4 },
        { code: 'CS402', name: 'Database Management Systems', credits: 4 },
        { code: 'CS403', name: 'Operating Systems', credits: 3 },
        { code: 'CS404', name: 'Computer Networks', credits: 3 },
        { code: 'CS405', name: 'Software Engineering', credits: 3 },
        { code: 'CS406', name: 'Mathematics IV', credits: 3 },
      ],
      students: [
        { id: 'S001', name: 'Aarav Sharma', marks: { CS401: 92, CS402: 85, CS403: 79, CS404: 95, CS405: 84, CS406: 85 } },
        { id: 'S002', name: 'Priya Patel', marks: { CS401: 88, CS402: 94, CS403: 82, CS404: 90, CS405: 78, CS406: 75 } },
        { id: 'S003', name: 'Rahul Verma', marks: { CS401: 74, CS402: 80, CS403: 38, CS404: 88, CS405: 71, CS406: 60 } },
        { id: 'S004', name: 'Sneha Reddy', marks: { CS401: 90, CS402: 86, CS403: 88, CS404: 96, CS405: 88, CS406: 84 } },
        { id: 'S005', name: 'Vikram Singh', marks: { CS401: 65, CS402: 28, CS404: 70, CS405: 55 } },
        { id: 'S006', name: 'Ananya Gupta', marks: { CS401: 80, CS402: 68, CS403: 76, CS404: 84, CS405: 82, CS406: 62 } },
        { id: 'S008', name: 'Kavita Nair', marks: { CS401: 70, CS402: 65, CS403: 60, CS404: 78, CS405: 90, CS406: 55 } },
        { id: 'S009', name: 'Arjun Desai', marks: { CS401: 42, CS402: 62, CS403: 58, CS404: 68, CS405: 60, CS406: 48 } },
        { id: 'S010', name: 'Divya Kulkarni', marks: { CS401: 84, CS402: 88, CS403: 80, CS404: 90, CS405: 35, CS406: 78 } },
        { id: 'S021', name: 'Sanjay Mehta', marks: { CS401: 45, CS402: 45, CS403: 38, CS404: 52, CS405: 41, CS406: 32 } },
      ],
    },
    // Already-declared past exam for the same 10-student cohort (before they
    // advanced to Sem IV) — Aarav Sharma's marks match exactly what "My
    // Result" already shows for him (studentSemData in post-exam.js), so
    // Result Processing/Freeze/Declaration and the student portal agree on
    // his real numbers. The other 9 students are new for this historical
    // exam, following the same relative strengths established in Sem IV
    // (Sanjay weakest, Vikram/Arjun with one recurring weak subject, etc).
    'Sem III Regular Dec 2024': {
      subjects: [
        { code: 'MA301', name: 'Engineering Maths III', credits: 4 },
        { code: 'CS301', name: 'Data Structures', credits: 4 },
        { code: 'CS302', name: 'Object Oriented Programming', credits: 4 },
        { code: 'CS303', name: 'Computer Organization', credits: 3 },
        { code: 'CS304', name: 'Microprocessors', credits: 3 },
        { code: 'CS305', name: 'Discrete Maths', credits: 3 },
      ],
      students: [
        { id: 'S001', name: 'Aarav Sharma', marks: { MA301: 70, CS301: 80, CS302: 84, CS303: 72, CS304: 66, CS305: 76 } },
        { id: 'S002', name: 'Priya Patel', marks: { MA301: 82, CS301: 88, CS302: 90, CS303: 80, CS304: 78, CS305: 85 } },
        { id: 'S003', name: 'Rahul Verma', marks: { MA301: 65, CS301: 70, CS302: 72, CS303: 60, CS304: 55, CS305: 68 } },
        { id: 'S004', name: 'Sneha Reddy', marks: { MA301: 85, CS301: 90, CS302: 88, CS303: 82, CS304: 80, CS305: 86 } },
        { id: 'S005', name: 'Vikram Singh', marks: { MA301: 45, CS301: 68, CS302: 60, CS303: 42, CS304: 38, CS305: 50 } },
        { id: 'S006', name: 'Ananya Gupta', marks: { MA301: 70, CS301: 75, CS302: 78, CS303: 65, CS304: 60, CS305: 72 } },
        { id: 'S008', name: 'Kavita Nair', marks: { MA301: 60, CS301: 65, CS302: 70, CS303: 58, CS304: 55, CS305: 62 } },
        { id: 'S009', name: 'Arjun Desai', marks: { MA301: 48, CS301: 55, CS302: 50, CS303: 45, CS304: 35, CS305: 52 } },
        { id: 'S010', name: 'Divya Kulkarni', marks: { MA301: 80, CS301: 85, CS302: 88, CS303: 78, CS304: 75, CS305: 82 } },
        { id: 'S021', name: 'Sanjay Mehta', marks: { MA301: 32, CS301: 45, CS302: 38, CS303: 30, CS304: 25, CS305: 40 } },
      ],
    },
  },
};

// ============================================================
// RESULT AGGREGATION — shared by D-Form (in-exam.js), Result Processing /
// Result Freeze / Result Declaration and Marks Memo (post-exam.js) so every
// page that summarizes an exam's outcome counts and grades the same real
// students from data.examResults instead of each page inventing its own
// unrelated placeholder totals.
// ============================================================
const PASS_MARK = 40;
const GRADE_POINTS = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };

function markToGrade(mark) {
  if (mark >= 90) return 'A+';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B+';
  if (mark >= 60) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= PASS_MARK) return 'D';
  return 'F';
}

// Per-student SGPA from their real subject marks/credits (one exam only).
function computeStudentResult(student, subjects) {
  let creditSum = 0, pointSum = 0;
  const subjectResults = subjects.filter(sub => student.marks[sub.code] !== undefined).map(sub => {
    const mark = student.marks[sub.code];
    const grade = markToGrade(mark);
    creditSum += sub.credits;
    pointSum += sub.credits * GRADE_POINTS[grade];
    return { code: sub.code, name: sub.name, credits: sub.credits, mark, grade };
  });
  const sgpa = creditSum ? Math.round((pointSum / creditSum) * 100) / 100 : 0;
  const failed = subjectResults.some(r => r.grade === 'F');
  return { subjectResults, sgpa, failed };
}

// Real cumulative GPA: the standard credit-weighted average grade point
// across every exam this demo has actual per-student marks for (Sem III
// Regular Dec 2024 + Sem IV Regular Apr 2026, the same 10-student cohort
// before/after advancing a semester) — not just SGPA copied over, since a
// student's CGPA should genuinely differ from their latest SGPA.
function computeCumulativeGPA(studentId) {
  let creditSum = 0, pointSum = 0;
  ['Sem III Regular Dec 2024', 'Sem IV Regular Apr 2026'].forEach(examLabel => {
    const exam = data.examResults[examLabel];
    const student = exam && exam.students.find(s => s.id === studentId);
    if (!student) return;
    const result = computeStudentResult(student, exam.subjects);
    result.subjectResults.forEach(r => {
      creditSum += r.credits;
      pointSum += r.credits * GRADE_POINTS[r.grade];
    });
  });
  return creditSum ? Math.round((pointSum / creditSum) * 100) / 100 : 0;
}

function getExamResultSummary(examLabel) {
  const exam = data.examResults[examLabel] || data.examResults['Sem IV Regular Apr 2026'];
  const studentResults = exam.students.map(s => ({ id: s.id, name: s.name, ...computeStudentResult(s, exam.subjects) }));
  const subjectStats = exam.subjects.map(sub => {
    const entries = exam.students
      .filter(s => s.marks[sub.code] !== undefined)
      .map(s => ({ name: s.name, mark: s.marks[sub.code] }));
    const total = entries.length;
    const pass = entries.filter(e => e.mark >= PASS_MARK).length;
    const topper = entries.reduce((best, e) => (!best || e.mark > best.mark) ? e : best, null);
    return {
      code: sub.code, name: sub.name, total, pass, fail: total - pass,
      passPercent: total ? Math.round((pass / total) * 1000) / 10 : 0,
      topperName: topper ? topper.name : '—', topperMarks: topper ? topper.mark : '—',
    };
  });
  const totalStudents = studentResults.length;
  const passCount = studentResults.filter(s => !s.failed).length;
  const failCount = totalStudents - passCount;
  return {
    exam, studentResults, subjectStats, totalStudents, passCount, failCount,
    passPercent: totalStudents ? Math.round((passCount / totalStudents) * 1000) / 10 : 0,
  };
}

// Real per-student seat assignment — distinct from the EB Seating Plan
// page's computeSeatingAllocation() (pre-exam.js), which allocates by the
// large data.subjects[].verifiedSheets placeholder count, not the real
// roster. This fills data.rooms in order with the real students registered
// for a subject (from data.examResults), assigning each one an actual room
// and seat number, so a specific student can look up exactly where they sit.
function computeRealSeatingAllocation(examLabel, subjectCode) {
  const exam = data.examResults[examLabel] || data.examResults['Sem IV Regular Apr 2026'];
  const subject = exam.subjects.find(s => s.code === subjectCode) || exam.subjects[0];
  const takingStudents = exam.students.filter(s => s.marks[subject.code] !== undefined);
  const seatByStudentId = {};
  let cursor = 0;
  let seatNum = 1;
  data.rooms.forEach(room => {
    const remainingStudents = takingStudents.length - cursor;
    const allocated = Math.max(0, Math.min(room.capacity, remainingStudents));
    for (let i = 0; i < allocated; i++) {
      const student = takingStudents[cursor];
      seatByStudentId[student.id] = { room: room.name, seatNo: `S${String(seatNum).padStart(3, '0')}` };
      cursor++; seatNum++;
    }
  });
  return { subject, takingStudents, seatByStudentId };
}

// All of a specific student's exam-day room/seat assignments across every
// subject on the timetable, in schedule order — backs the student's
// "My Seating" page.
function getStudentSeatAssignments(examLabel, studentId) {
  const exam = data.examResults[examLabel] || data.examResults['Sem IV Regular Apr 2026'];
  return exam.subjects
    .filter(sub => exam.students.some(s => s.id === studentId && s.marks[sub.code] !== undefined))
    .map(sub => {
      const alloc = computeRealSeatingAllocation(examLabel, sub.code);
      const seat = alloc.seatByStudentId[studentId];
      const slot = data.timetableSlots.find(t => t.code === sub.code);
      return {
        code: sub.code, name: sub.name,
        date: slot ? slot.date : '—', session: slot ? slot.session : '—', time: slot ? slot.time : '—',
        room: seat ? seat.room : '—', seatNo: seat ? seat.seatNo : '—',
      };
    });
}
