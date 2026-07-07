// ============================================================
// CORE — navigation, modal helpers, login/session, toast
// ============================================================
// ============================================================
// NAVIGATION
// ============================================================
const pageTitles = {
  dashboard: 'Dashboard',
  'exam-creation': 'Exam Creation', 'eligibility': 'Eligible Student Generation', 'registration': 'Exam Registration',
  'timetable': 'Exam Scheduling / Timetable', 'hallticket': 'Hall Ticket Management', 'seating': 'Room & Seating Plan',
  'invigilator': 'Invigilator Duty Management', 'attendance': 'Exam-Day Attendance', 'answer-sheet': 'Answer Sheet Capture',
  'malpractice': 'Malpractice & Special Cases', 'dform': 'D-Form / Attendance Report', 'collection': 'Answer Sheet Collection & Dispatch',
  'bundle': 'Bundle Creation', 'evaluator': 'Evaluator Assignment', 'marks-entry': 'Marks Entry',
  'scrutiny': 'Scrutiny', 'consolidation': 'Marks Consolidation', 'result-processing': 'Result Processing',
  'result-freeze': 'Result Review & Freeze', 'result-declaration': 'Result Declaration', 'marks-memo': 'Marks Memo / Grade Card',
  'revaluation': 'Revaluation', 'reports': 'Reports & Analytics',
  'student-result': 'My Result', 'student-revaluation': 'Apply Revaluation'
};

let currentPage = 'dashboard';
let currentMode = 'autonomous';
// Which exam (from Exam Creation's Recent Exams list) is currently "open" —
// read by every Pre-Exam page's exam selector so opening a specific exam
// actually carries its label across pages instead of everything showing the
// same hardcoded exam regardless of what you clicked.
let currentExamLabel = 'Sem IV Regular Apr 2026';

const modeInfo = {
  autonomous: { label: 'Autonomous', icon: 'fa-university', desc: 'Full exam cycle managed by college' },
  affiliated: { label: 'Affiliated', icon: 'fa-building', desc: 'University-controlled exam process' },
  hybrid: { label: 'Hybrid', icon: 'fa-handshake', desc: 'College + University combined' },
};

function updateModeBadge() {
  const m = modeInfo[currentMode];
  const badge = document.getElementById('modeBadge');
  if (badge) badge.innerHTML = `<i class="fas ${m.icon}"></i> ${m.label} Mode`;
}

function toggleSection(el) { el.classList.toggle('open'); }

function showPage(page) {
  currentPage = page;
  try { localStorage.setItem('examDemoCurrentPage', page); } catch (e) {}
  const pageTitleEl = document.getElementById('pageTitle');
  const breadcrumbEl = document.getElementById('breadcrumbPage');
  if (pageTitleEl) pageTitleEl.textContent = pageTitles[page] || 'Dashboard';
  if (breadcrumbEl) breadcrumbEl.textContent = pageTitles[page] || 'Overview';
  document.querySelectorAll('.nav-sub a').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-sub a[onclick*="'${page}'"]`);
  if (activeLink) activeLink.classList.add('active');
  updateModeBadge();
  renderPage(page);
  return false;
}

// Cross-context navigation for links used by shared render functions
// (e.g. renderEvaluator()'s "create a bundle first" link): inside the SPA
// (index.html has #pageTitle) it does an in-app showPage() switch; on a
// standalone post-exam/*.html page (no #pageTitle) it does a real page
// navigation to the sibling file instead, since there's no SPA router there.
function goToPage(page, standaloneFile) {
  if (document.getElementById('pageTitle')) {
    showPage(page);
  } else {
    window.location.href = standaloneFile;
  }
  return false;
}

// Records which exam a Recent Exams row's "Open"/"View" action just jumped
// to, so the destination page's exam selector shows that exam's label
// instead of always showing the same hardcoded one. Call this immediately
// before the existing showPage()/goToPage() navigation, not instead of it.
function openExam(label) {
  // Eligibility's manual overrides / approved-lock state are specific to
  // whichever exam is open — switching exams should start from a clean
  // slate, not carry over another exam's overrides or "approved" state.
  if (label !== currentExamLabel && typeof eligibilityOverrides !== 'undefined') {
    eligibilityOverrides = {};
    eligibilityApproved = false;
  }
  currentExamLabel = label;
}

function renderAffiliatedNotApplicable(icon, title, message) {
  return `
    <div class="page-content">
      <div class="alert alert-warning"><i class="fas fa-info-circle"></i> Not applicable in Affiliated mode — answer sheets are sent directly to the university for evaluation.</div>
      <div class="card">
        <div class="card-body">
          <div class="text-center empty-state">
            <i class="fas ${icon}"></i>
            <h3 style="margin-top:8px;font-size:16px;color:var(--text)">${title}</h3>
            <p>${message}</p>
            <button class="btn btn-primary mt-2" onclick="showPage('collection')"><i class="fas fa-arrow-left"></i> Back to Collection / Dispatch</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// MODAL
// ============================================================
function openModal(title, bodyHtml, footerHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  if (footerHtml) document.getElementById('modalFooter').innerHTML = footerHtml;
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

// ============================================================
// FILE DOWNLOAD — turns "Download" / "Export" buttons into real file saves.
// Serializes the report table currently shown in #pageContent to CSV.
// ============================================================
function slugifyName(s) { return (s || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'report'; }
function defaultReportName() { var h1 = document.querySelector('.topbar-left h1'); return slugifyName(h1 ? h1.textContent : 'report'); }
function tableToCSV(table) {
  return Array.from(table.rows).map(function (row) {
    return Array.from(row.cells).map(function (cell) {
      var t = (cell.innerText || cell.textContent || '').replace(/\s+/g, ' ').trim();
      if (/[",\n]/.test(t)) t = '"' + t.replace(/"/g, '""') + '"';
      return t;
    }).join(',');
  }).join('\r\n');
}
function downloadBlob(filename, content, mime) {
  var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
function downloadReport(name) {
  var base = name || defaultReportName();
  var container = document.getElementById('pageContent');
  var table = container ? container.querySelector('table') : null;
  if (table) { downloadBlob(base + '.csv', tableToCSV(table), 'text/csv;charset=utf-8'); showSuccessToast('Downloaded ' + base + '.csv'); }
  else { downloadBlob(base + '.txt', base.replace(/-/g, ' ') + ' - generated ' + new Date().toLocaleString(), 'text/plain'); showSuccessToast('Downloaded ' + base + '.txt'); }
}
function showSuccessToast(msg) {
  var toast = document.getElementById('demoToast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'demoToast'; toast.className = 'demo-toast'; document.body.appendChild(toast); }
  toast.innerHTML = '<i class="fas fa-check-circle" style="color:#34d399"></i> ' + msg;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
}

// Builds modal content via DOM APIs (not HTML strings), so plain button
// labels/messages never need HTML-attribute quote-escaping.
function showActionModal(title, message, opts) {
  opts = opts || {};
  document.getElementById('modalTitle').textContent = title;

  const body = document.getElementById('modalBody');
  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'text-center';
  wrap.style.padding = '8px 0';
  if (opts.icon) {
    const icon = document.createElement('i');
    icon.className = 'fas ' + opts.icon;
    icon.style.fontSize = '40px';
    icon.style.color = opts.iconColor || 'var(--primary)';
    wrap.appendChild(icon);
  }
  const msg = document.createElement('p');
  msg.className = 'text-muted';
  msg.style.marginTop = '12px';
  msg.style.lineHeight = '1.5';
  msg.textContent = message;
  wrap.appendChild(msg);
  body.appendChild(wrap);

  const footer = document.getElementById('modalFooter');
  footer.innerHTML = '';
  if (opts.showCancel !== false) {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Close';
    cancelBtn.onclick = closeModal;
    footer.appendChild(cancelBtn);
  }
  if (opts.confirmLabel !== null) {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn ' + (opts.confirmClass || 'btn-primary');
    if (opts.confirmIcon) {
      const ci = document.createElement('i');
      ci.className = 'fas ' + opts.confirmIcon;
      confirmBtn.appendChild(ci);
      confirmBtn.appendChild(document.createTextNode(' ' + (opts.confirmLabel || 'OK')));
    } else {
      confirmBtn.textContent = opts.confirmLabel || 'OK';
    }
    confirmBtn.onclick = function () {
      closeModal();
      if (opts.onConfirm) { opts.onConfirm(); return; }
      // A "Download"/"Export" confirm with no explicit action saves the report.
      var lbl = opts.confirmLabel || '';
      if (opts.confirmIcon === 'fa-download' || /download|export/i.test(lbl)) {
        downloadReport(opts.downloadName);
      }
    };
    footer.appendChild(confirmBtn);
  }

  document.getElementById('modalOverlay').classList.add('show');
}

// Real data-entry modal: fieldsHtml is plain form markup (ids only, no
// nested onclick), onSubmit reads those ids and is responsible for
// mutating a data array + re-rendering + closing the modal.
function openFormModal(title, fieldsHtml, submitLabel, onSubmit) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = fieldsHtml;

  const footer = document.getElementById('modalFooter');
  footer.innerHTML = '';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = closeModal;
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = submitLabel || 'Submit';
  submitBtn.onclick = onSubmit;
  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);

  document.getElementById('modalOverlay').classList.add('show');
}

// ============================================================
// RENDERERS
// ============================================================
function renderPage(page) {
  const c = document.getElementById('pageContent');
  switch(page) {
    case 'dashboard': c.innerHTML = renderDashboard(); break;
    case 'exam-creation': c.innerHTML = renderExamCreation(); break;
    case 'eligibility': c.innerHTML = renderEligibility(); break;
    case 'registration': c.innerHTML = renderRegistration(); break;
    case 'timetable': c.innerHTML = renderTimetable(); break;
    case 'hallticket': c.innerHTML = renderHallTicket(); break;
    case 'seating': c.innerHTML = renderSeating(); break;
    case 'invigilator': c.innerHTML = renderInvigilator(); break;
    case 'attendance': c.innerHTML = renderAttendance(); break;
    case 'answer-sheet': c.innerHTML = renderAnswerSheet(); break;
    case 'malpractice': c.innerHTML = renderMalpractice(); break;
    case 'dform': c.innerHTML = renderDForm(); break;
    case 'collection': c.innerHTML = renderCollection(); break;
    case 'bundle': c.innerHTML = renderBundle(); break;
    case 'evaluator': c.innerHTML = renderEvaluator(); break;
    case 'marks-entry': c.innerHTML = renderMarksEntry(); break;
    case 'scrutiny': c.innerHTML = renderScrutiny(); break;
    case 'consolidation': c.innerHTML = renderConsolidation(); break;
    case 'result-processing': c.innerHTML = renderResultProcessing(); break;
    case 'result-freeze': c.innerHTML = renderResultFreeze(); break;
    case 'result-declaration': c.innerHTML = renderResultDeclaration(); break;
    case 'marks-memo': c.innerHTML = renderMarksMemo(); break;
    case 'revaluation': c.innerHTML = renderRevaluation(); break;
    case 'reports': c.innerHTML = renderReports(); break;
    case 'student-result': c.innerHTML = renderStudentResult(); break;
    case 'student-revaluation': c.innerHTML = renderStudentRevaluation(); break;
    default: c.innerHTML = renderDashboard();
  }
}

// ============================================================
// LOGIN
// ============================================================
let loggedInUser = null;
const roleData = {
  'exam-branch': { name: 'Exam Branch', user: 'exam.branch', label: 'Exam Branch' },
  'invigilator': { name: 'Invigilator', user: 'invigilator', label: 'Invigilator' },
  'evaluator': { name: 'Evaluator', user: 'evaluator', label: 'Evaluator' },
  'scrutinizer': { name: 'Scrutinizer', user: 'scrutinizer', label: 'Scrutinizer' },
  'student': { name: 'Student', user: 'student', label: 'Student' },
  'admin': { name: 'Administrator', user: 'admin', label: 'Admin' },
};

function selectLoginRole(el) {
  document.querySelectorAll('.login-role').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  const role = el.dataset.role;
  const data = roleData[role];
  document.getElementById('loginUser').value = data.user;
  document.getElementById('loginPass').value = 'pass';
  document.getElementById('loginError').classList.remove('show');
}

function handleLogin() {
  const selected = document.querySelector('.login-role.selected');
  if (!selected) {
    showLoginError('Please select a role');
    return;
  }
  const role = selected.dataset.role;
  const data = roleData[role];
  loggedInUser = { role, ...data };
  applyLogin();
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.querySelector('span').textContent = msg;
  el.classList.add('show');
}

function applySidebarAccessForRole(role) {
  document.querySelectorAll('.nav-sub a[data-roles]').forEach(a => {
    const allowed = a.dataset.roles.split(',');
    a.style.display = allowed.includes(role) ? '' : 'none';
  });
  document.querySelectorAll('.nav-section').forEach(section => {
    const links = section.querySelectorAll('.nav-sub a');
    if (links.length === 0) return;
    const anyVisible = Array.from(links).some(a => a.style.display !== 'none');
    section.style.display = anyVisible ? '' : 'none';
  });
}

function applyLogin() {
  if (!loggedInUser) return;
  const role = loggedInUser.role;
  const label = loggedInUser.label;
  const initials = label.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('topbarUser').textContent = label;
  document.getElementById('sidebarUser').textContent = label;
  document.getElementById('sidebarRole').textContent = role.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('topbarAvatar').textContent = initials;
  document.getElementById('loginOverlay').classList.add('hidden');
  applySidebarAccessForRole(role);
  updateModeBadge();
  try { localStorage.setItem('examDemoSession', JSON.stringify(loggedInUser)); } catch (e) {}
  let savedPage = null;
  try { savedPage = localStorage.getItem('examDemoCurrentPage'); } catch (e) {}
  showPage(savedPage && pageTitles[savedPage] ? savedPage : 'dashboard');
}

function handleLogout() {
  loggedInUser = null;
  try { localStorage.removeItem('examDemoSession'); localStorage.removeItem('examDemoCurrentPage'); } catch (e) {}
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('loginError').classList.remove('show');
  document.querySelector('.login-role.selected')?.classList.remove('selected');
  document.querySelector('.login-role')?.classList.add('selected');
}

// Restore a previous session (if any) so a page refresh doesn't log
// the user out — only an explicit Logout click should do that.
function restoreSession() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('examDemoSession') || 'null'); } catch (e) {}
  if (saved && saved.role && roleData[saved.role]) {
    loggedInUser = saved;
    applyLogin();
    return true;
  }
  return false;
}

// Allow Enter key to login
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !loggedInUser) {
    handleLogin();
  }
});

// ============================================================
// DEMO FEEDBACK TOAST
// Many buttons in this mockup aren't wired to a specific modal
// (e.g. "View", "Assign", "Download", "Auto Allocate"). Rather than
// leaving them silently do nothing when clicked, show a toast so
// every button gives visible feedback.
// ============================================================
function showToast(label, isDemo) {
  let toast = document.getElementById('demoToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'demoToast';
    toast.className = 'demo-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-info-circle"></i> ${label}${isDemo ? ' — this action isn\'t wired up in the demo yet.' : ''}`;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (!btn || btn.hasAttribute('onclick') || btn.onclick) return;
  const label = btn.textContent.trim().replace(/\s+/g, ' ');
  showToast('"' + label + '"', true);
});
