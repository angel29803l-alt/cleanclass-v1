// ============================================================
// i18n.js — CleanClass
// Sistema de internacionalización: ES / EN
// ============================================================

let currentLang = 'es';

const TRANSLATIONS = {
  es: {
    // AUTH
    welcome: '¡BIENVENIDO!',
    loginSubtitle: 'Ingresa a tu cuenta',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    change: 'Cambiar',
    loginBtn: 'Iniciar sesión',
    noAccount: '¿No tienes cuenta?',
    register: 'Regístrate',
    createAccount: 'Crea una cuenta',
    fullName: 'Nombre completo',
    birthDate: 'Fecha de nacimiento',
    birthPlaceholder: 'DD/MM/AAAA',
    idNumber: 'Número de identificación',
    confirmPassword: 'Confirmar contraseña',
    rolePlaceholder: 'Estudiante / Docente',
    rol: 'Rol',
    registerBtn: 'Registrarse',
    alreadyAccount: '¿Ya tienes cuenta?',
    verifyUser: 'Verificación de usuario',
    enterCode: 'Ingresa el código',
    resendCode: 'Reenviar código en:',
    send: 'Enviar',
    changePasswordBtn: 'Cambiar contraseña',
    newPassword: 'Nueva contraseña',
    newPasswordTitle: 'Nueva contraseña',
    confirmNewPassword: 'Confirmar contraseña',
    saveChange: 'Guardar cambio',
    goBack: '¿Deseas volver?',
    // NAV
    dashboard: 'Inicio',
    users: 'Usuarios',
    students: 'Estudiantes',
    teachers: 'Docentes',
    classrooms: 'Gestión de Aulas',
    rooms: 'Salones',
    cleanTurns: 'Turnos de Aseo',
    evidence: 'Evidencias',
    validation: 'Validación',
    incidents: 'Incidentes',
    reports: 'Reportes',
    settings: 'Mi Perfil',
    adminPanel: 'Panel Admin',
    // NOTIFICATIONS
    notifications: 'Notificaciones',
    pending: 'Pendiente',
    completed: 'Completado',
    cleanProgress: 'Progreso de Aseo',
    // GENERAL
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    records: 'registros',
    noRecords: 'Sin registros',
    actions: 'Acciones',
    // DASHBOARD
    cleanGroups: 'Grupos Aseo',
    today: 'Hoy',
    upcomingTurns: 'Próximos Turnos de Aseo',
    members: 'miembros',
    noTurns: 'Sin turnos asignados',
    weeklyRotation: 'sem.',
    eachWeek: '(cada semana)',
    // CLEAN
    cleanTitle: 'Turnos de Aseo',
    dailyMode: 'Modo Diario',
    weeklyMode: 'Modo Semanal',
    newGroup: 'Nuevo Grupo',
    dailyGroups: 'Grupos Diarios (Un día por semana)',
    weeklyGroups: 'Grupos Semanales (Toda la semana)',
    noGroup: 'Sin grupo',
    noGroupsCreated: 'No hay grupos creados',
    createFirstGroup: 'Crear Primer Grupo',
    totalGroups: 'Total de Grupos',
    assignedStudents: 'Estudiantes Asignados',
    avgPerGroup: 'Promedio por Grupo',
    createGroupFirst: 'Crea tu primer grupo de aseo en modo',
    manageDaily: 'Gestiona turnos diarios de limpieza',
    manageWeekly: 'Gestiona turnos semanales de limpieza',
    monFri: 'Lun - Vie (Toda la semana)',
    students_label: 'Estudiantes:',
    // EVIDENCE
    evidenceTitle: 'Evidencias de Aseo',
    evidenceSubtitle: 'Sube la foto de tu grupo de aseo',
    uploadEvidence: 'Subir Evidencia',
    noGroupsYet: 'Sin grupos creados',
    completedLabel: 'Completadas',
    pendingLabel: 'Pendientes',
    totalRecords: 'Total de Registros',
    compliance: 'Cumplimiento',
    complianceByGroup: 'Cumplimiento por Grupo',
    recentEvidence: 'Evidencias Recientes',
    noEvidence: 'Aún no hay evidencias',
    uploadFirst: 'Sube la primera foto de limpieza',
    // INCIDENTS
    incidentsTitle: 'Gestión de Incidentes',
    reportIncident: 'Reportar Incidente',
    openIncidents: 'Abiertos',
    inProgress: 'En Proceso',
    resolved: 'Resueltos',
    totalIncidents: 'Total',
    noIncidents: 'No hay incidentes registrados',
    // REPORTS
    reportsTitle: 'Reportes y Análisis',
    // SETTINGS
    settingsTitle: 'Mi Perfil y Configuración',
    profile: 'Perfil',
    security: 'Seguridad',
    preferences: 'Preferencias',
    about: 'Acerca de',
    // CALENDAR DAYS
    sun: 'Dom', mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb',
    monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
    langLabel: 'ES',
    langFlag: '🇨🇴',
    // ROLES
    roleAdmin: 'Administrador',
    roleTeacher: 'Docente',
    roleStudent: 'Estudiante',
    // ADMIN PANEL
    adminPanelTitle: 'Panel de Administración',
    adminPanelSubtitle: 'Control total del sistema CleanClass',
    manageStudents: 'Gestionar Estudiantes',
    manageTeachers: 'Gestionar Docentes',
    manageRooms: 'Gestionar Salones',
    systemStats: 'Estadísticas del Sistema',
    allGrades: 'Todos los Grados',
    gradeFilter: 'Filtrar por Grado',
    // CLEAN GROUPS JOIN
    joinGroup: 'Unirse a Grupo',
    myGroup: 'Mi Grupo',
    myTurns: 'Mis Turnos',
    myEvidences: 'Mis Evidencias',
    myValidations: 'Mis Validaciones',
    // VALIDATION
    approveBtn: 'Aprobar',
    rejectBtn: 'Rechazar',
    pendingReview: 'Por Revisar',
    reviewed: 'Revisadas',
  },

  en: {
    welcome: 'WELCOME!',
    loginSubtitle: 'Sign in to your account',
    email: 'Email address',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    change: 'Change',
    loginBtn: 'Sign in',
    noAccount: "Don't have an account?",
    register: 'Sign up',
    createAccount: 'Create an account',
    fullName: 'Full name',
    birthDate: 'Date of birth',
    birthPlaceholder: 'DD/MM/YYYY',
    idNumber: 'ID number',
    confirmPassword: 'Confirm password',
    rolePlaceholder: 'Student / Teacher',
    rol: 'Role',
    registerBtn: 'Sign up',
    alreadyAccount: 'Already have an account?',
    verifyUser: 'User verification',
    enterCode: 'Enter the code',
    resendCode: 'Resend code in:',
    send: 'Send',
    changePasswordBtn: 'Change password',
    newPassword: 'New password',
    newPasswordTitle: 'New password',
    confirmNewPassword: 'Confirm password',
    saveChange: 'Save change',
    goBack: 'Want to go back?',
    dashboard: 'Home',
    users: 'Users',
    students: 'Students',
    teachers: 'Teachers',
    classrooms: 'Classroom Management',
    rooms: 'Rooms',
    cleanTurns: 'Cleaning Shifts',
    evidence: 'Evidence',
    validation: 'Validation',
    incidents: 'Incidents',
    reports: 'Reports',
    settings: 'My Profile',
    adminPanel: 'Admin Panel',
    notifications: 'Notifications',
    pending: 'Pending',
    completed: 'Completed',
    cleanProgress: 'Cleaning Progress',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    records: 'records',
    noRecords: 'No records',
    actions: 'Actions',
    cleanGroups: 'Clean Groups',
    today: 'Today',
    upcomingTurns: 'Upcoming Cleaning Shifts',
    members: 'members',
    noTurns: 'No shifts assigned',
    weeklyRotation: 'wk.',
    eachWeek: '(every week)',
    cleanTitle: 'Cleaning Shifts',
    dailyMode: 'Daily Mode',
    weeklyMode: 'Weekly Mode',
    newGroup: 'New Group',
    dailyGroups: 'Daily Groups (One day per week)',
    weeklyGroups: 'Weekly Groups (Full week)',
    noGroup: 'No group',
    noGroupsCreated: 'No groups created',
    createFirstGroup: 'Create First Group',
    totalGroups: 'Total Groups',
    assignedStudents: 'Assigned Students',
    avgPerGroup: 'Avg per Group',
    createGroupFirst: 'Create your first cleaning group in',
    manageDaily: 'Manage daily cleaning shifts',
    manageWeekly: 'Manage weekly cleaning shifts',
    monFri: 'Mon - Fri (Full week)',
    students_label: 'Students:',
    evidenceTitle: 'Cleaning Evidence',
    evidenceSubtitle: 'Upload your cleaning group photo',
    uploadEvidence: 'Upload Evidence',
    noGroupsYet: 'No groups created',
    completedLabel: 'Completed',
    pendingLabel: 'Pending',
    totalRecords: 'Total Records',
    compliance: 'Compliance',
    complianceByGroup: 'Compliance by Group',
    recentEvidence: 'Recent Evidence',
    noEvidence: 'No evidence yet',
    uploadFirst: 'Upload the first cleaning photo',
    incidentsTitle: 'Incident Management',
    reportIncident: 'Report Incident',
    openIncidents: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    totalIncidents: 'Total',
    noIncidents: 'No incidents recorded',
    reportsTitle: 'Reports & Analytics',
    settingsTitle: 'My Profile & Settings',
    profile: 'Profile',
    security: 'Security',
    preferences: 'Preferences',
    about: 'About',
    sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
    monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    langLabel: 'EN',
    langFlag: '🇺🇸',
    roleAdmin: 'Administrator',
    roleTeacher: 'Teacher',
    roleStudent: 'Student',
    adminPanelTitle: 'Administration Panel',
    adminPanelSubtitle: 'Full system control for CleanClass',
    manageStudents: 'Manage Students',
    manageTeachers: 'Manage Teachers',
    manageRooms: 'Manage Rooms',
    systemStats: 'System Statistics',
    allGrades: 'All Grades',
    gradeFilter: 'Filter by Grade',
    joinGroup: 'Join Group',
    myGroup: 'My Group',
    myTurns: 'My Shifts',
    myEvidences: 'My Evidence',
    myValidations: 'My Validations',
    approveBtn: 'Approve',
    rejectBtn: 'Reject',
    pendingReview: 'Pending Review',
    reviewed: 'Reviewed',
  }
};

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
         (TRANSLATIONS['es'] && TRANSLATIONS['es'][key]) || key;
}

function setLang(lang) {
  currentLang = lang;
  applyAuthTranslations();
  updateSidebarLabels();
  const drop = document.getElementById('langDropdown');
  if (drop) drop.style.display = 'none';
  const lbl = document.getElementById('langBtnLabel');
  if (lbl) lbl.textContent = t('langLabel');
  const flag = document.querySelector('#langBtn span:first-child');
  if (flag) flag.textContent = t('langFlag');
  if (document.getElementById('app') && document.getElementById('app').style.display !== 'none') {
    render();
  }
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
}

function toggleLangDropdown() {
  const drop = document.getElementById('langDropdown');
  if (!drop) return;
  const isOpen = drop.style.display === 'block';
  drop.style.display = isOpen ? 'none' : 'block';
  drop.style.animation = 'fadeIn .15s ease';
}

document.addEventListener('click', (e) => {
  const btn = document.getElementById('langBtn');
  const drop = document.getElementById('langDropdown');
  if (drop && btn && !btn.contains(e.target) && !drop.contains(e.target)) {
    drop.style.display = 'none';
  }
});

function applyAuthTranslations() {
  const screens = {
    'screen-login': () => {
      const s = document.getElementById('screen-login');
      if (!s) return;
      s.querySelector('.auth-welcome').textContent = t('welcome');
      s.querySelector('.auth-sub').textContent = t('loginSubtitle');
      const labels = s.querySelectorAll('.auth-label');
      if (labels[0]) labels[0].textContent = t('email');
      if (labels[1]) labels[1].textContent = t('password');
      const olvido = s.querySelector('.auth-olvido');
      if (olvido) {
        olvido.querySelector('.auth-link').textContent = t('forgotPassword');
        olvido.querySelector('.auth-mini-btn').textContent = t('change');
      }
      s.querySelector('.auth-btn-primary').textContent = t('loginBtn');
      const bottom = s.querySelector('.auth-bottom');
      if (bottom) {
        bottom.querySelector('.auth-link').textContent = t('noAccount');
        bottom.querySelector('.auth-btn-secondary').textContent = t('register');
      }
    },
    'screen-registro': () => {
      const s = document.getElementById('screen-registro');
      if (!s) return;
      s.querySelector('.auth-sub').textContent = t('createAccount');
      const labels = s.querySelectorAll('.auth-label');
      const lmap = ['fullName','birthDate','email','idNumber','password','confirmPassword','rol'];
      labels.forEach((l, i) => { if (lmap[i]) l.textContent = t(lmap[i]); });
      const bdate = s.querySelector('input[placeholder]');
      if (bdate) bdate.placeholder = t('birthPlaceholder');
      const roleInput = s.querySelector('input[placeholder="Estudiante / Docente"], input[placeholder="Student / Teacher"]');
      if (roleInput) roleInput.placeholder = t('rolePlaceholder');
      const btn = s.querySelector('.auth-btn-primary');
      if (btn) btn.textContent = t('registerBtn');
      const bottom = s.querySelector('.auth-bottom');
      if (bottom) {
        bottom.querySelector('.auth-link').textContent = t('alreadyAccount');
        bottom.querySelector('.auth-btn-secondary').textContent = t('loginBtn');
      }
    },
    'screen-verificacion': () => {
      const s = document.getElementById('screen-verificacion');
      if (!s) return;
      s.querySelector('.auth-sub').textContent = t('verifyUser');
      const labels = s.querySelectorAll('.auth-label');
      if (labels[0]) labels[0].textContent = t('email');
      if (labels[1]) labels[1].textContent = t('enterCode');
      const count = s.querySelector('.auth-count');
      if (count) {
        const secs = count.textContent.match(/\d+/)?.[0] || '56';
        count.textContent = t('resendCode') + ' ' + secs + ' s';
      }
      const miniBtn = s.querySelector('.auth-mini-btn');
      if (miniBtn) miniBtn.textContent = t('send');
      const mainBtn = s.querySelector('.auth-btn-primary');
      if (mainBtn) mainBtn.textContent = t('changePasswordBtn');
    },
    'screen-nueva': () => {
      const s = document.getElementById('screen-nueva');
      if (!s) return;
      s.querySelector('.auth-sub').textContent = t('newPasswordTitle');
      const labels = s.querySelectorAll('.auth-label');
      if (labels[0]) labels[0].textContent = t('newPassword');
      if (labels[1]) labels[1].textContent = t('confirmNewPassword');
      const btn = s.querySelector('.auth-btn-primary');
      if (btn && btn.id === 'btnGuardar') btn.textContent = t('saveChange');
      const bottom = s.querySelector('.auth-bottom');
      if (bottom) {
        bottom.querySelector('.auth-link').textContent = t('goBack');
        bottom.querySelector('.auth-btn-secondary').textContent = t('loginBtn');
      }
    }
  };
  Object.values(screens).forEach(fn => fn());
}

function updateSidebarLabels() {
  const notifLabel = document.getElementById('notifLabel');
  if (notifLabel) notifLabel.textContent = t('notifications');
}
