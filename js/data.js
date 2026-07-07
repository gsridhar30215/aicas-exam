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
  rooms: [
    { name: 'Lab 101', capacity: 30 },
    { name: 'Lab 102', capacity: 30 },
    { name: 'Lecture Hall A', capacity: 60 },
    { name: 'Lecture Hall B', capacity: 60 },
    { name: 'Seminar Hall', capacity: 80 },
  ],
  faculty: [
    { id: 'F01', name: 'Dr. Meena Iyer', dept: 'Computer' },
    { id: 'F02', name: 'Prof. Amit Kumar', dept: 'Computer' },
    { id: 'F03', name: 'Dr. Sunita Rao', dept: 'Computer' },
    { id: 'F04', name: 'Prof. Rajesh Pillai', dept: 'Computer' },
    { id: 'F05', name: 'Dr. Neha Shah', dept: 'Computer' },
  ],
  // Mutable lists — "create" actions push into these so new items actually
  // show up in their tables, instead of just popping a confirmation.
  malpracticeCases: [
    { date: '10 Apr 2026', student: 'Rohit Joshi (S007)', subject: 'DS & Algorithms', type: 'Malpractice', typeClass: 'badge-danger', remarks: 'Cellular phone found', status: 'Under Review', statusClass: 'badge-warning' },
    { date: '12 Apr 2026', student: 'Ananya Gupta (S006)', subject: 'DBMS', type: 'Blank Booklet', typeClass: 'badge-warning', remarks: 'Student reported blank pages', status: 'Resolved', statusClass: 'badge-info' },
  ],
  timetableSlots: [
    { date: '10 Apr 2026', session: 'Morning', subject: 'Data Structures & Algorithms', code: 'CS401', time: '10:00 - 13:00', duration: '3 hrs' },
    { date: '12 Apr 2026', session: 'Morning', subject: 'Database Management Systems', code: 'CS402', time: '10:00 - 13:00', duration: '3 hrs' },
    { date: '14 Apr 2026', session: 'Morning', subject: 'Operating Systems', code: 'CS403', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '16 Apr 2026', session: 'Morning', subject: 'Computer Networks', code: 'CS404', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '18 Apr 2026', session: 'Morning', subject: 'Software Engineering', code: 'CS405', time: '10:00 - 12:00', duration: '2 hrs' },
    { date: '20 Apr 2026', session: 'Morning', subject: 'Mathematics IV', code: 'CS406', time: '10:00 - 13:00', duration: '3 hrs' },
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
    { student: 'Vikram Singh', subject: 'Maths IV', marks: 28, feePaid: false, evaluator: '—', status: 'Fee Pending', statusClass: 'badge-danger' },
  ],
  universityRevaluationTracking: [
    { student: 'Rahul Verma', subject: 'OS', marks: 38, feePaid: true, uniStatus: 'Submitted to University', uniStatusClass: 'badge-warning', revised: '—' },
    { student: 'Arjun Desai', subject: 'DS', marks: 42, feePaid: true, uniStatus: 'Awaiting University', uniStatusClass: 'badge-info', revised: '—' },
    { student: 'Divya Kulkarni', subject: 'SE', marks: 35, feePaid: true, uniStatus: 'Revised Result Received', uniStatusClass: 'badge-success', revised: '48' },
    { student: 'Vikram Singh', subject: 'Maths IV', marks: 28, feePaid: false, uniStatus: 'Fee Pending', uniStatusClass: 'badge-danger', revised: '—' },
  ],
  memosGenerated: {},
};
