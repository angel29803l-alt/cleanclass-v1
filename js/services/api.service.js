
// ---- FUNCIONES PARA LEER DATOS DESDE SUPABASE ----
async function loadStudents() {
  const { data, error } = await sb.from('students').select('*');
  if (!error && data) D.students = data;
}

async function loadTeachers() {
  const { data, error } = await sb.from('teachers').select('*');
  if (!error && data) D.teachers = data;
}

async function loadCleanGroups() {
  const { data, error } = await sb.from('clean_groups').select('*');
  if (!error && data) D.cleanGroups = data;
}

async function loadEvidence() {
  const { data, error } = await sb.from('evidence').select('*');
  if (!error && data) D.evidence = data;
}

async function loadIncidents() {
  const { data, error } = await sb.from('incidents').select('*');
  if (!error && data) D.incidents = data;
}

async function loadUsers() {
  const { data, error } = await sb.from('users').select('id, name, email, avatar_url');
  if (!error && data) D.usersProfiles = data;
}

async function loadNoClassDays() {
  const { data, error } = await sb.from('no_class_days').select('*');
  if (!error && data) D.noClassDays = data;
}

async function loadHelpTopics() {
  const { data, error } = await sb.from('help_topics').select('*').order('sort_order', { ascending: true });
  if (!error && data) D.helpTopics = data;
}

async function loadAllData() {
  await Promise.all([
    loadStudents(),
    loadTeachers(),
    loadCleanGroups(),
    loadEvidence(),
    loadIncidents(),
    loadRooms(),
    loadUsers(),
    loadNoClassDays(),
    loadHelpTopics(),
    loadSchedules(),
    loadSchoolConfig(),
    loadTodayCheckins()
  ]);
  console.log('✅ Datos cargados desde Supabase');
}

// ---- FUNCIONES PARA GUARDAR DATOS EN SUPABASE ----
// Guarda en Supabase: insert si es nuevo, update si ya existe
async function sbSave(table, payload, loadFn) {
  const localId = payload.id;
  const isNew = !localId || localId >= 100;
  const clean = {...payload};
  delete clean.id;

  let error;
  if (isNew) {
    ({ error } = await sb.from(table).insert(clean));
  } else {
    ({ error } = await sb.from(table).update(clean).eq('id', localId));
  }

  if (error) {
    console.error('❌ ' + table + ' save error:', error.message, error.details, error.hint);
    showDbError(table, error.message);
    return;
  }
  await loadFn();
}

async function saveStudent(student)   { await sbSave('students',    student,  loadStudents);    }
async function saveTeacher(teacher)   { await sbSave('teachers',    teacher,  loadTeachers);    }
async function saveHelpTopic(topic)   { await sbSave('help_topics', topic,    loadHelpTopics);  }

// Crea el tema y devuelve la fila real (con el id que generó Supabase),
// para no depender del id local que arma nid() — evita que se pierda la referencia.
async function createHelpTopic(title, sort_order) {
  const { data, error } = await sb.from('help_topics')
    .insert({ title, body: '', sort_order }).select().single();
  if (error) {
    console.error('❌ createHelpTopic error:', error.message);
    showDbError('tema de ayuda', error.message);
    return null;
  }
  await loadHelpTopics();
  return data;
}

// Actualiza un tema por su id real (sin heurísticas de "nuevo vs existente")
async function updateHelpTopic(id, fields) {
  const { error } = await sb.from('help_topics').update(fields).eq('id', id);
  if (error) {
    console.error('❌ updateHelpTopic error:', error.message);
    showDbError('tema de ayuda', error.message);
    return false;
  }
  await loadHelpTopics();
  return true;
}

async function deleteHelpTopic(id) {
  const { error } = await sb.from('help_topics').delete().eq('id', Number(id));
  if (error) { console.error('❌ deleteHelpTopic error:', error.message); showDbError('tema de ayuda', error.message); return; }
  await loadHelpTopics();
}

// Sube la imagen de un tema de ayuda y devuelve la URL pública
async function createStudentWithAuth(student, password) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        email: student.email,
        password: password,
        name: student.name,
        grade: student.grade
      })
    });
    const result = await res.json();

    if (!res.ok || result.error) {
      console.error('❌ createStudentWithAuth error:', result.error);
      showDbError('estudiante', result.error || 'No se pudo crear el usuario.');
      return false;
    }

    await loadStudents();
    return true;
  } catch (err) {
    console.error('❌ createStudentWithAuth error:', err.message);
    showDbError('estudiante', 'No se pudo conectar con el servidor. ' + err.message);
    return false;
  }
}

// Crea el docente en Supabase Auth (para que pueda iniciar sesión) y en la tabla teachers.
// Usa una Edge Function porque crear usuarios en Auth requiere la service_role key,
// que nunca debe exponerse en el frontend.
async function createTeacherWithAuth(teacher, password) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/dynamic-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        email: teacher.email,
        password: password,
        name: teacher.name,
        grade: teacher.grade
      })
    });
    const result = await res.json();

    if (!res.ok || result.error) {
      console.error('❌ createTeacherWithAuth error:', result.error);
      showDbError('docente', result.error || 'No se pudo crear el usuario.');
      return false;
    }

    await loadTeachers();
    return true;
  } catch (err) {
    console.error('❌ createTeacherWithAuth error:', err.message);
    showDbError('docente', 'No se pudo conectar con el servidor. ' + err.message);
    return false;
  }
}
async function saveCleanGroup(group)  { await sbSave('clean_groups',group,    loadCleanGroups); }
async function saveEvidence(evidence) { await sbSave('evidence',    evidence, loadEvidence);    }
async function saveIncident(incident) { await sbSave('incidents',   incident, loadIncidents);   }

// Muestra un toast de error de base de datos al usuario
function showDbError(entidad, msg) {
  const n = document.createElement('div');
  n.style.cssText = 'position:fixed;top:20px;right:20px;background:#7f1d1d;color:#fecaca;padding:16px 20px;border-radius:10px;z-index:9999;font-size:13px;font-weight:600;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,.4);border:1px solid #991b1b';
  n.innerHTML = `<strong>⚠ Error al guardar ${entidad}</strong><br><span style="font-weight:400;font-size:12px">${msg}</span><br><span style="font-weight:400;font-size:11px;opacity:.8">Revisa la consola (F12) y las políticas RLS en Supabase.</span>`;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 6000);
}

async function deleteStudent(id) {
  const { error } = await sb.from('students').delete().eq('id', Number(id));
  if (error) { console.error('❌ deleteStudent error:', error.message); showDbError('estudiante', error.message); return; }
  await loadStudents();
}

async function deleteTeacher(id) {
  const { error } = await sb.from('teachers').delete().eq('id', Number(id));
  if (error) { console.error('❌ deleteTeacher error:', error.message); showDbError('docente', error.message); return; }
  await loadTeachers();
}

async function deleteCleanGroup(id) {
  const { error } = await sb.from('clean_groups').delete().eq('id', id);
  if (!error) await loadCleanGroups();
}

async function deleteIncident(id) {
  const { error } = await sb.from('incidents').delete().eq('id', id);
  if (!error) await loadIncidents();
}

const D={
  // Usuarios — se cargan desde Supabase
  users:[],
  usersProfiles:[],
  noClassDays:[],
  helpTopics:[],
  schedules:[],
  schoolConfig:{lat:null,lng:null,radius_meters:150},
  checkins:[],

  // Estudiantes — se cargan desde Supabase
  students:[],

  // Docentes — se cargan desde Supabase
  teachers:[],

  // Salones — se cargan desde Supabase
  rooms:[],

  cleanGroups:[],

  // ---- EVIDENCIAS con booleano de cumplimiento ----
  evidence:[],

  incidents:[],
  nid:100
};

function nid(){return ++D.nid;}

// ---- SESIÓN ACTIVA ----
let currentSession = null;

function getCurrentGrade(){
  if(!currentSession) return null;
  return currentSession.grade;
}
function isAdmin()   { return currentSession && currentSession.role === 'admin';   }
function isTeacher() { return currentSession && currentSession.role === 'teacher'; }
function isStudent() { return currentSession && currentSession.role === 'student'; }

function filterByGrade(arr, gradeKey='grade'){
  if(isAdmin()) return arr;
  const g = getCurrentGrade();
  if(!g) return arr;
  return arr.filter(item => item[gradeKey] === g);
}

// ---- HELPERS CENTRALIZADOS ----
// Devuelve lista de nombres de estudiantes para un grado dado
function getStudentNamesByGrade(grade){
  return D.students
    .filter(s => !grade || s.grade === grade)
    .map(s => s.name);
}

// Computa cumplimiento booleano de una evidencia
function isCompliant(ev){
  return ev.status === 'Completado';
}

// Calcula score de cumplimiento de un grupo (0-100)
function groupComplianceScore(groupName){
  const evs = D.evidence.filter(e => e.group === groupName);
  if(!evs.length) return 0;
  return Math.round((evs.filter(e=>isCompliant(e)).length / evs.length) * 100);
}

// Ranking de grupos por cumplimiento
function getRankedGroups(filterGrade){
  const groups = filterGrade
    ? D.cleanGroups.filter(g => g.grade === filterGrade)
    : D.cleanGroups;
  return groups
    .map(g => ({
      ...g,
      score: groupComplianceScore(g.name),
      total: D.evidence.filter(e=>e.group===g.name).length,
      completed: D.evidence.filter(e=>e.group===g.name&&isCompliant(e)).length
    }))
    .sort((a,b) => b.score - a.score);
}

// Sin datos demo — todo se carga desde Supabase
D.nid = 400;

// ---- FUNCIONES PARA IMÁGENES (STORAGE) ----

// Sube una foto y devuelve la URL pública
async function saveEvidenceWithImage(evidenceData, imageFile) {
  let imageUrl = evidenceData.image || null;

  if (imageFile) {
    imageUrl = await uploadEvidenceImage(imageFile, evidenceData.id || Date.now());
    if (!imageUrl) {
      console.error('No se pudo subir la imagen');
      showDbError('imagen', 'No se pudo subir la foto. Verifica el bucket "evidencias" en Supabase Storage.');
      return false;
    }
  }

  const payload = {...evidenceData, image: imageUrl};
  if (payload.id && payload.id >= 100) delete payload.id;

  const { error } = await sb.from('evidence').upsert(payload);

  if (error) {
    console.error('❌ saveEvidenceWithImage error:', error.message, error.details, error.hint);
    showDbError('evidencia', error.message);
    return false;
  }
  await loadEvidence();
  return true;
}

// ---- FUNCIONES PARA SALONES ----
async function loadRooms() {
  const { data, error } = await sb.from('rooms').select('*');
  if (!error && data) D.rooms = data;
}

async function saveRoom(room) {
  await sbSave('rooms', room, loadRooms);
}

async function deleteRoom(id) {
  const { error } = await sb.from('rooms').delete().eq('id', Number(id));
  if (error) {
    console.error('❌ deleteRoom error:', error.message, error.details);
    showDbError('salón', error.message);
    return;
  }
  await loadRooms();
}

async function deleteStudentDb(id) {
  const { error } = await sb.from('students').delete().eq('id', Number(id));
  if (error) { console.error('❌ deleteStudent error:', error.message); showDbError('estudiante', error.message); return; }
  await loadStudents();
}

async function deleteTeacherDb(id) {
  const { error } = await sb.from('teachers').delete().eq('id', Number(id));
  if (error) { console.error('❌ deleteTeacher error:', error.message); showDbError('docente', error.message); return; }
  await loadTeachers();
}

// ---- REALTIME — actualización automática para todos los usuarios ----
function initRealtime() {
  if (window._realtimeInitialized) return;
  window._realtimeInitialized = true;
  sb.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' },
      async () => { await loadStudents(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' },
      async () => { await loadTeachers(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' },
      async () => { await loadRooms(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clean_groups' },
      async () => { await loadCleanGroups(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence' },
      async () => { await loadEvidence(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' },
      async () => { await loadIncidents(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' },
      async () => { await loadAllData(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'no_class_days' },
      async () => { await loadNoClassDays(); render(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' },
      async () => { await loadSchedules(); render(); })
    .subscribe();
  console.log('✅ Realtime activado');
}

// ---- HORARIOS DE ASEO ----
async function loadSchedules() {
  const { data, error } = await sb.from('schedules').select('*');
  if (!error && data) D.schedules = data;
}

async function saveSchedule(schedule) {
  const { error } = await sb.from('schedules').upsert(schedule);
  if (!error) await loadSchedules();
}

// ---- CONFIGURACIÓN UBICACIÓN DEL COLEGIO ----
async function loadSchoolConfig() {
  const { data, error } = await sb.from('school_config').select('*').eq('id', 1).maybeSingle();
  if (!error && data) D.schoolConfig = data;
}

async function saveSchoolConfig(lat, lng, radius_meters) {
  const { error } = await sb.from('school_config').upsert({ id: 1, lat, lng, radius_meters });
  if (!error) await loadSchoolConfig();
  return !error;
}

// Distancia en metros entre dos coordenadas (fórmula Haversine)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ---- CHECK-IN DE ASISTENCIA AL ASEO ----
async function loadTodayCheckins() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await sb.from('attendance_checkins').select('*').eq('date', today);
  if (!error && data) D.checkins = data;
}

// Genera un código corto al azar (solo como comprobante interno, no se pide a nadie)
function generateAttendanceCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Marca presente solo a quien sube la primera evidencia del día,
// y devuelve el código para que se lo pase de palabra a sus compañeros.
async function markGroupAttendanceFromEvidence(groupName, grade, student) {
  const today = new Date().toISOString().split('T')[0];
  const code = generateAttendanceCode();

  const { error } = await sb.from('attendance_checkins').insert({
    student, grade, group_name: groupName, date: today,
    code, lat: null, lng: null, distance_m: null
  });
  if (error) {
    console.error('❌ markGroupAttendanceFromEvidence error:', error.message);
    return null;
  }
  await loadTodayCheckins();
  return code;
}

// Cada compañero escribe el código que le pasó quien subió la evidencia,
// para marcar SU propia asistencia (uno por uno, no todo el grupo junto).
async function submitAttendanceCode(groupName, grade, student, code) {
  const today = new Date().toISOString().split('T')[0];

  // Verificar que sigamos dentro del horario de aseo de ese grado
  const sch = (D.schedules||[]).find(s=>s.grade===grade);
  if(sch?.clean_time){
    const now = new Date();
    const currentHM = now.getHours()*60+now.getMinutes();
    const [nh,nm] = sch.clean_time.substring(0,5).split(':').map(Number);
    const closeHM = (nh*60+nm) + (sch.evidence_window_min||30);
    if(currentHM > closeHM){
      return { ok: false, error: 'La ventana de aseo ya cerró.' };
    }
  }

  // ¿Existe ese código, para ese grupo, hoy?
  const { data: match, error: findErr } = await sb.from('attendance_checkins')
    .select('id').eq('group_name', groupName).eq('date', today)
    .eq('code', code.trim().toUpperCase()).limit(1);

  if (findErr || !match || !match.length) {
    return { ok: false, error: 'Código incorrecto o vencido.' };
  }

  // ¿Ya se había marcado este estudiante hoy?
  const already = D.checkins.find(c => c.student === student && c.group_name === groupName && c.date === today);
  if (already) return { ok: true };

  const { error } = await sb.from('attendance_checkins').insert({
    student, grade, group_name: groupName, date: today,
    code: code.trim().toUpperCase(), lat: null, lng: null, distance_m: null
  });
  if (error) return { ok: false, error: error.message };

  await loadTodayCheckins();
  return { ok: true };
}

async function saveCheckin(student, grade, groupName, lat, lng, distance_m) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await sb.from('attendance_checkins').insert({
    student, grade, group_name: groupName, date: today, lat, lng, distance_m
  });
  if (!error) await loadTodayCheckins();
  return !error;
}
