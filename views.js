// ============================================================
// views.js — CleanClass  (roles: admin / teacher / student)
// ============================================================

function render(){
  buildNav();
  const m=document.getElementById('main');
  if(!m)return;
  const map={
    dashboard:rDashboardAdmin,
    adminPanel:rDashboardAdmin,
    dash:rDash,
    rooms:rRooms,
    clean:rClean,
    evidence:rEvidence,
    validation:rValidation,
    myvalidations:rMyValidations,
    incidents:rIncidents,
    reportIncident:rReportIncident,
    reports:isAdmin()?rReportsAdmin:rReports,
    config:rConfig,
    settings:rSettings,
    analytics:rAnalytics,
    users:rUsers
  };
  const fn=map[cur]||rDash;
  const html=typeof fn==='function'?fn():'';
  m.innerHTML='<div class="fade-in">'+html+'</div>';
  lucide.createIcons();
  bindEvents();
  if(typeof initCharts==="function") setTimeout(initCharts,80);
}

// ============================================================
// DASHBOARD ADMIN — Resumen del día para la coordinadora
// ============================================================
function rDashboardAdmin(){
  const allGrades=[...new Set([...D.students.map(s=>s.grade),...D.rooms.map(r=>r.grade)])].filter(Boolean).sort();
  const todayStr = new Date().toISOString().split('T')[0];
  const DAYS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const todayName = DAYS_ES[new Date().getDay()];
  const completionRate = D.evidence.length>0 ? Math.round((D.evidence.filter(e=>e.status==='Completado').length/D.evidence.length)*100) : 0;
  const openInc = D.incidents.filter(i=>i.status==='Abierto').length;
  const pendEv = D.evidence.filter(e=>e.status==='Pendiente').length;
  const todayEvidence = D.evidence.filter(e=>e.date===todayStr);

  // Estado de aseo por grado hoy
  const gradeStatus = allGrades.map(grade=>{
    const groups = D.cleanGroups.filter(g=>g.grade===grade&&(g.frequency==='weekly'||(g.frequency==='daily'&&g.day===todayName)));
    const ev = todayEvidence.filter(e=>{ const g=D.cleanGroups.find(cg=>cg.name===e.group); return g&&g.grade===grade; });
    const checkins = (D.checkins||[]).filter(c=>c.grade===grade&&c.date===todayStr);
    const totalMembers = groups.reduce((sum,g)=>(g.members?sum+g.members.length:sum),0);
    const hasEvidence = ev.length>0;
    const approvedEv = ev.filter(e=>e.status==='Completado').length;
    return { grade, groups:groups.length, hasEvidence, evidenceCount:ev.length, approvedEv, checkins:checkins.length, totalMembers };
  });

  const gradesWithEvidence = gradeStatus.filter(g=>g.hasEvidence).length;
  const gradesWithoutEvidence = gradeStatus.filter(g=>g.groups>0&&!g.hasEvidence).length;

  return `
  <div style="background:linear-gradient(135deg,rgba(6,182,212,.18),rgba(37,99,235,.12));border:1px solid rgba(6,182,212,.3);border-radius:16px;padding:24px;margin-bottom:24px">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#06b6d4,#2563eb);display:flex;align-items:center;justify-content:center">
            <i data-lucide="layout-dashboard" style="width:24px;height:24px;color:#fff"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold">Dashboard</h1>
            <p style="color:var(--accent);font-size:13px;font-weight:600">${todayName} ${todayStr} — CleanClass</p>
          </div>
        </div>
        <p style="color:var(--textm);font-size:13px">Bienvenido, <strong style="color:var(--text)">${currentSession?.name||'Administrador'}</strong></p>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
    ${[
      {icon:'users',      label:'Estudiantes',     val:D.students.length, color:'#2563eb'},
      {icon:'book-open',  label:'Docentes',        val:D.teachers.length, color:'#7c3aed'},
      {icon:'door-open',  label:'Salones',         val:D.rooms.length,    color:'#059669'},
      {icon:'sparkles',   label:'Grupos Aseo',     val:D.cleanGroups.length, color:'#ea580c'},
      {icon:'trending-up',label:'Cumplimiento',    val:completionRate+'%',color:'#06b6d4'}
    ].map(s=>`
      <div class="card" style="background:var(--surface);text-align:center;padding:16px">
        <div style="width:40px;height:40px;border-radius:12px;background:${s.color}18;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
          <i data-lucide="${s.icon}" style="width:20px;height:20px;color:${s.color}"></i>
        </div>
        <p class="text-2xl font-bold">${s.val}</p>
        <p style="color:var(--textm);font-size:12px">${s.label}</p>
      </div>`).join('')}
  </div>

  <!-- Estado de Aseo HOY por grado -->
  <div class="card mb-6" style="background:var(--surface)">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-lg"><i data-lucide="calendar-check" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:6px"></i>Estado de Aseo — Hoy</h3>
      <div class="flex gap-2">
        <span class="badge-pill badge-pill-green">${gradesWithEvidence} cumplieron</span>
        <span class="badge-pill badge-pill-red">${gradesWithoutEvidence} sin evidencia</span>
      </div>
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      ${gradeStatus.map(g=>{
        if(g.groups===0) return '';
        const status = g.hasEvidence ? (g.approvedEv>0?'approved':'pending') : 'missing';
        const colors = {approved:'#10b981',pending:'#f59e0b',missing:'#ef4444'};
        const labels = {approved:'✅ Completado',pending:'⏳ Pendiente de validar',missing:'❌ Sin evidencia'};
        const icons = {approved:'check-circle',pending:'clock',missing:'x-circle'};
        return `<div style="padding:14px;border-radius:10px;border-left:4px solid ${colors[status]};background:${colors[status]}08">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold">${g.grade}</span>
            <span class="badge-pill" style="background:${colors[status]}15;color:${colors[status]};font-size:10px"><i data-lucide="${icons[status]}" style="width:11px;height:11px;display:inline-block;vertical-align:middle;margin-right:3px"></i>${labels[status]}</span>
          </div>
          <p style="font-size:11px;color:var(--textm)">${g.groups} grupo(s) · ${g.checkins}/${g.totalMembers} asistencia GPS · ${g.evidenceCount} evidencia(s)</p>
        </div>`;
      }).filter(Boolean).join('')}
      ${gradeStatus.every(g=>g.groups===0)?'<p style="color:var(--textm);text-align:center;padding:20px">No hay grupos de aseo asignados</p>':''}
    </div>
  </div>

  <!-- Dos columnas: Evidencias Hoy + Estado del Sistema -->
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="card" style="background:var(--surface)">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">Evidencias de Hoy</h3>
        <span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${todayEvidence.length} total</span>
      </div>
      ${todayEvidence.length>0?`
      <div class="flex flex-col gap-3">
        ${todayEvidence.sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date)).map(e=>`
          <div style="display:flex;gap:10px;padding:10px;background:rgba(6,182,212,.05);border-radius:8px">
            ${e.image?`<img src="${e.image}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;cursor:pointer" onclick="openImageFullscreen('${e.image}')">`:'<div style="width:60px;height:60px;border-radius:8px;background:rgba(6,182,212,.1);display:flex;align-items:center;justify-content:center"><i data-lucide="image" style="width:24px;height:24px;color:rgba(6,182,212,.4)"></i></div>'}
            <div style="flex:1">
              <p style="font-size:13px;font-weight:600">${e.group}</p>
              <p style="font-size:11px;color:var(--textm)">${e.student} · ${e.time||''}</p>
              <span class="badge" style="font-size:10px;background:${e.status==='Completado'?'#d1fae5;color:#059669':e.status==='Rechazado'?'#fee2e2;color:#dc2626':'#fef3c7;color:#92400e'}">${e.status}</span>
            </div>
          </div>`).join('')}
      </div>`:`<p style="color:var(--textm);text-align:center;padding:30px">Sin evidencias hoy</p>`}
    </div>

    <div class="card" style="background:var(--surface)">
      <h3 class="font-bold text-lg mb-4">Estado del Sistema</h3>
      <div class="flex flex-col gap-3">
        <div style="padding:14px;background:rgba(239,68,68,.08);border-radius:10px;border-left:4px solid #ef4444;display:flex;justify-content:space-between;align-items:center">
          <div><p style="font-size:12px;color:var(--textm)">Incidentes abiertos</p><p class="font-bold text-lg" style="color:#ef4444">${openInc}</p></div>
          <i data-lucide="alert-circle" style="width:28px;height:28px;color:#ef4444;opacity:.7"></i>
        </div>
        <div style="padding:14px;background:rgba(245,158,11,.08);border-radius:10px;border-left:4px solid #f59e0b;display:flex;justify-content:space-between;align-items:center">
          <div><p style="font-size:12px;color:var(--textm)">Evidencias pendientes</p><p class="font-bold text-lg" style="color:#f59e0b">${pendEv}</p></div>
          <i data-lucide="clock" style="width:28px;height:28px;color:#f59e0b;opacity:.7"></i>
        </div>
        <div style="padding:14px;background:rgba(16,185,129,.08);border-radius:10px;border-left:4px solid #10b981;display:flex;justify-content:space-between;align-items:center">
          <div><p style="font-size:12px;color:var(--textm)">Tasa de cumplimiento</p><p class="font-bold text-lg" style="color:#10b981">${completionRate}%</p></div>
          <i data-lucide="trending-up" style="width:28px;height:28px;color:#10b981;opacity:.7"></i>
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================================
// CONFIGURACIÓN — Horarios, GPS, Días sin clase, Salones
// ============================================================
function rConfig(){
  const allGrades=[...new Set([...D.students.map(s=>s.grade),...D.rooms.map(r=>r.grade)])].filter(Boolean).sort();
  if(typeof window._configTab==='undefined') window._configTab='schedules';
  const ct=window._configTab;

  const tabBtn=(key,label,icon)=>`<button onclick="window._configTab='${key}';render()"
    style="display:flex;align-items:center;gap:8px;padding:10px 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;
    background:${ct===key?'var(--accent)':'rgba(6,182,212,.08)'};color:${ct===key?'#fff':'var(--textm)'}">
    <i data-lucide="${icon}" style="width:15px;height:15px"></i>${label}
  </button>`;

  let html=`
  <div style="margin-bottom:20px">
    <h1 class="text-2xl font-bold mb-1"><i data-lucide="settings" style="width:24px;height:24px;display:inline-block;vertical-align:middle;margin-right:8px"></i>Configuración</h1>
    <p style="color:var(--textm);font-size:13px">Horarios, ubicación GPS, días sin clase y salones</p>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
    ${tabBtn('schedules','Horarios','clock')}
    ${tabBtn('rooms','Salones','door-open')}
  </div>`;

  // ── TAB: HORARIOS (extraído de rAdminPanel) ──
  if(ct==='schedules'){
    // Reutilizar el bloque de horarios del adminPanel
    html+=renderSchedulesConfig(allGrades);
  }

  // ── TAB: SALONES ──
  if(ct==='rooms'){
    html+=renderRoomsConfig();
  }

  return html;
}

// Helper: renderiza config de horarios (extraído de adminPanel)
function renderSchedulesConfig(grades){
  const today = new Date();
  const noClassSet = new Set((D.noClassDays||[]).map(x=>x.date));
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const firstDay = (new Date(year,month,1).getDay()+6)%7;
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames2 = ['L','M','X','J','V','S','D'];

  let calHtml = '';
  for(let d=1;d<=daysInMonth;d++){
    const dow=(firstDay+d-1)%7;
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isNoClass=noClassSet.has(dateStr);
    const isToday=d===today.getDate()&&month===today.getMonth();
    const isWknd=dow>=5;
    calHtml+=`${d===1?'<div></div>'.repeat(firstDay):''}
      <div style="text-align:center;padding:6px 2px;border-radius:8px;font-size:12px;font-weight:${isToday?'700':'500'};
        background:${isNoClass?'rgba(239,68,68,.15)':isToday?'rgba(6,182,212,.15)':'transparent'};
        color:${isNoClass?'#ef4444':isWknd?'var(--textm)':'var(--text)'};
        cursor:pointer;border:${isToday?'1.5px solid var(--accent)':'1px solid transparent'}"
        onclick="toggleNoClassDay('${dateStr}',${isNoClass})" title="${isNoClass?'Quitar día sin clase':'Marcar día sin clase'}">
        ${d}${isNoClass?'<div style=\\"width:4px;height:4px;background:#ef4444;border-radius:50%;margin:2px auto 0\\"></div>':''}
      </div>`;
  }

  return `
  <!-- BLOQUE 1: HORARIO UNIVERSAL -->
  <div>
    <h2 class="font-bold text-base mb-1"><i data-lucide="clock" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Horario de Aseo</h2>
    <p style="font-size:12px;color:var(--textm);margin-bottom:12px">Esta hora aplica para <strong>todos los grados</strong>. A esta hora se envía la notificación y se abre la ventana para subir evidencias.</p>
    <div class="card" style="background:var(--surface);padding:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div>
          <label class="auth-label">Hora del aseo</label>
          <input type="time" class="inp" id="clean_universal" value="${(D.schedules&&D.schedules[0]?.clean_time)||'15:00'}" style="width:130px;padding:8px 12px;font-size:16px">
        </div>
        <div>
          <label class="auth-label">Ventana para subir evidencia</label>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" min="5" max="180" class="inp" id="window_universal" value="${(D.schedules&&D.schedules[0]?.evidence_window_min)||30}" style="width:70px;padding:8px;text-align:center;font-size:16px">
            <span style="font-size:13px;color:var(--textm)">minutos</span>
          </div>
        </div>
        <div style="display:flex;align-items:flex-end">
          <button class="pill pill-primary" onclick="saveUniversalSchedule()"><i data-lucide="save" style="width:14px;height:14px"></i> Guardar</button>
        </div>
      </div>
      <p style="font-size:11px;color:var(--textm);margin-top:10px">Ejemplo: Si pones 14:00 con 30 min, los estudiantes podrán subir evidencia entre las 2:00 PM y las 2:30 PM.</p>
    </div>
  </div>

  <!-- Salidas tempranas -->
  <div style="margin-top:16px">
    <h3 class="font-bold text-sm mb-1"><i data-lucide="log-out" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></i> Salidas Tempranas</h3>
    <p style="font-size:12px;color:var(--textm);margin-bottom:8px">Si un grado sale antes de la hora normal, programa aquí su hora especial para ese día.</p>
    <div class="card" style="background:var(--surface);padding:14px">
      <div class="grid gap-3 sm:grid-cols-2">
        <div><label class="auth-label">Grado</label>
          <select class="inp" id="earlyGrade">${grades.map(g=>`<option value="${g}">${g}</option>`).join('')}</select></div>
        <div><label class="auth-label">Hora de salida</label>
          <input type="time" class="inp" id="earlyTime"></div>
        <div><label class="auth-label">Fecha</label>
          <input type="date" class="inp" id="earlyDate"></div>
        <div style="display:flex;align-items:flex-end">
          <button class="pill pill-primary w-full" onclick="saveEarlyExit()"><i data-lucide="save" style="width:14px;height:14px"></i> Guardar</button>
        </div>
      </div>
      <div style="margin-top:12px">
        <p style="font-size:12px;color:var(--textm);margin-bottom:6px">Salidas programadas:</p>
        ${(D.schedules||[]).filter(s=>s.early_exit_time).map(s=>`
          <div class="card" style="background:var(--surface);padding:14px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <span style="font-weight:600;color:var(--accent)">${s.grade}</span>
                <span style="color:var(--textm);font-size:12px;margin-left:8px">${s.early_exit_time} — ${s.early_exit_date||'Sin fecha'}</span>
              </div>
            </div>
          </div>`).join('') || `<p style="font-size:12px;color:var(--textm)">No hay salidas tempranas configuradas</p>`}
      </div>
    </div>
  </div>

  <button class="pill pill-primary mt-4" onclick="saveUniversalSchedule()"><i data-lucide="save" style="width:15px;height:15px"></i> Guardar Horarios</button>

  <!-- BLOQUE 1.5: UBICACIÓN DEL COLEGIO -->
  <div style="margin-top:20px">
    <h2 class="font-bold text-base mb-3"><i data-lucide="map-pin" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Ubicación del Colegio</h2>
    <div class="card" style="background:var(--surface);padding:16px">
      <p style="font-size:12px;color:var(--textm);margin-bottom:10px">
        Define la ubicación del colegio para validar el check-in de asistencia al aseo (GPS).
      </p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="auth-label">Latitud</label>
          <input type="number" step="any" class="inp" id="schoolLat" value="${D.schoolConfig?.lat ?? ''}" placeholder="Ej: 4.6097">
        </div>
        <div>
          <label class="auth-label">Longitud</label>
          <input type="number" step="any" class="inp" id="schoolLng" value="${D.schoolConfig?.lng ?? ''}" placeholder="Ej: -74.0817">
        </div>
      </div>
      <div class="mb-3">
        <label class="auth-label">Radio permitido (metros)</label>
        <input type="number" class="inp" id="schoolRadius" value="${D.schoolConfig?.radius_meters ?? 150}" placeholder="150">
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="pill pill-ghost" style="font-size:12px" onclick="useMyLocationForSchool()"><i data-lucide="crosshair" style="width:14px;height:14px"></i> Usar mi ubicación actual</button>
        <button class="pill pill-primary" style="font-size:12px" onclick="saveSchoolLocationFromForm()"><i data-lucide="save" style="width:14px;height:14px"></i> Guardar</button>
      </div>
      <p id="schoolLocMsg" style="font-size:12px;color:#22c55e;margin-top:8px;display:none"></p>
    </div>
  </div>

  <!-- BLOQUE 2: DÍAS SIN CLASE -->
  <div style="margin-top:20px">
    <h2 class="font-bold text-base mb-3"><i data-lucide="calendar-x" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Días sin Clase — ${monthNames[month]} ${year}</h2>
    <div class="card" style="background:var(--surface);padding:16px">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
        ${dayNames2.map(d=>`<div style="text-align:center;font-size:11px;font-weight:700;color:var(--textm)">${d}</div>`).join('')}
        ${calHtml}
      </div>
      <p style="font-size:11px;color:var(--textm);margin-top:8px">Clic en un día para marcarlo/desmarcarlo como día sin clase. Los días en <span style="color:#ef4444">rojo</span> no tendrán aseo.</p>
    </div>
  </div>`;
}

// Helper: renderiza config de salones
function renderRoomsConfig(){
  return `
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-base"><i data-lucide="door-open" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Gestión de Salones</h2>
      <button class="pill pill-primary" onclick="openModal('add','rooms')"><i data-lucide="plus" style="width:14px;height:14px"></i> Nuevo Salón</button>
    </div>
    ${D.rooms.length>0?`
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Salón</th><th>Grado</th><th>Capacidad</th><th>Acciones</th></tr></thead>
        <tbody>
          ${D.rooms.map(r=>`<tr>
            <td style="font-weight:600">${r.name||'—'}</td>
            <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent);font-size:11px">${r.grade||'—'}</span></td>
            <td>${r.capacity||'—'}</td>
            <td>
              <div class="flex gap-1">
                <button class="pill pill-ghost" style="padding:4px 8px;font-size:11px" onclick="openModal('edit','rooms',${r.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i></button>
                <button class="pill pill-danger" style="padding:4px 8px;font-size:11px" onclick="if(confirm('¿Eliminar este salón?'))deleteRoom(${r.id}).then(()=>render())"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`:`<p style="color:var(--textm);text-align:center;padding:20px">Sin salones registrados</p>`}
  </div>`;
}

// ============================================================
// REPORTES ADMIN — Para la coordinadora
// ============================================================
function rReportsAdmin(){
  if(typeof window._reportTab==='undefined') window._reportTab='daily';
  const rt=window._reportTab;
  const todayStr = new Date().toISOString().split('T')[0];
  const DAYS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const todayName = DAYS_ES[new Date().getDay()];
  const allGrades=[...new Set([...D.students.map(s=>s.grade),...D.rooms.map(r=>r.grade)])].filter(Boolean).sort();

  const tabBtn=(key,label,icon)=>`<button onclick="window._reportTab='${key}';render()"
    style="display:flex;align-items:center;gap:8px;padding:10px 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;
    background:${rt===key?'var(--accent)':'rgba(6,182,212,.08)'};color:${rt===key?'#fff':'var(--textm)'}">
    <i data-lucide="${icon}" style="width:15px;height:15px"></i>${label}
  </button>`;

  let html=`
  <div style="margin-bottom:20px">
    <h1 class="text-2xl font-bold mb-1"><i data-lucide="file-bar-chart" style="width:24px;height:24px;display:inline-block;vertical-align:middle;margin-right:8px"></i>Reportes</h1>
    <p style="color:var(--textm);font-size:13px">Informes detallados para la coordinación</p>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
    ${tabBtn('daily','Reporte Diario','calendar')}
    ${tabBtn('ranking','Ranking Incumplimiento','award')}
    ${tabBtn('evidence','Evidencias del Día','camera')}
    ${tabBtn('excel','Excel Semanal','file-spreadsheet')}
  </div>`;

  // ── TAB: REPORTE DIARIO ──
  if(rt==='daily'){
    const gradeRows = allGrades.map(grade=>{
      const groups = D.cleanGroups.filter(g=>g.grade===grade&&(g.frequency==='weekly'||(g.frequency==='daily'&&g.day===todayName)));
      const ev = D.evidence.filter(e=>{const g=D.cleanGroups.find(cg=>cg.name===e.group);return g&&g.grade===grade&&e.date===todayStr;});
      const checkins = (D.checkins||[]).filter(c=>c.grade===grade&&c.date===todayStr);
      const totalMembers = groups.reduce((sum,g)=>(g.members?sum+g.members.length:sum),0);
      const absentNames = [];
      groups.forEach(g=>{
        (g.members||[]).forEach(name=>{
          if(!checkins.some(c=>c.student===name)) absentNames.push(name);
        });
      });
      return { grade, groups:groups.length, hasEvidence:ev.length>0, status:ev.length>0?(ev.some(e=>e.status==='Completado')?'Completado':'Pendiente'):'Sin evidencia', checkins:checkins.length, totalMembers, absentNames };
    }).filter(g=>g.groups>0);

    html+=`
    <div class="card" style="background:var(--surface)">
      <h3 class="font-bold text-lg mb-4">Reporte del ${todayName} ${todayStr}</h3>
      ${gradeRows.length>0?`
      <div style="overflow-x:auto">
        <table class="tbl">
          <thead><tr><th>Grado</th><th>Estado</th><th>Asistencia GPS</th><th>Ausentes</th></tr></thead>
          <tbody>
            ${gradeRows.map(g=>{
              const sc={Completado:'#10b981',Pendiente:'#f59e0b','Sin evidencia':'#ef4444'};
              return `<tr>
                <td class="font-bold">${g.grade}</td>
                <td><span class="badge" style="background:${sc[g.status]}15;color:${sc[g.status]};font-size:11px">${g.status}</span></td>
                <td style="font-size:12px">${g.checkins}/${g.totalMembers}</td>
                <td style="font-size:12px;color:${g.absentNames.length>0?'#ef4444':'#10b981'}">${g.absentNames.length>0?g.absentNames.join(', '):'Todos presentes'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`:`<p style="color:var(--textm);text-align:center;padding:20px">No hay grupos con turno hoy</p>`}
    </div>`;
  }

  // ── TAB: RANKING DE INCUMPLIMIENTO ──
  if(rt==='ranking'){
    // Contar ausencias por estudiante (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now()-30*86400000).toISOString().split('T')[0];
    const allMembers = {};
    D.cleanGroups.forEach(g=>{
      (g.members||[]).forEach(name=>{
        if(!allMembers[name]) allMembers[name]={name, grade:g.grade, absences:0, total:0};
      });
    });

    // Para cada día de los últimos 30, verificar quién no hizo check-in
    const checkins30 = (D.checkins||[]).filter(c=>c.date>=thirtyDaysAgo);
    D.cleanGroups.forEach(g=>{
      (g.members||[]).forEach(name=>{
        if(allMembers[name]){
          // Contar días que le tocaba aseo (simplificación: contar evidencias del grupo)
          const groupEvs = D.evidence.filter(e=>e.group===g.name&&e.date>=thirtyDaysAgo);
          const daysWithDuty = groupEvs.length || 1;
          const daysCheckedIn = checkins30.filter(c=>c.student===name&&c.group_name===g.name).length;
          allMembers[name].total += daysWithDuty;
          allMembers[name].absences += Math.max(0, daysWithDuty - daysCheckedIn);
        }
      });
    });

    const ranking = Object.values(allMembers).filter(m=>m.absences>0).sort((a,b)=>b.absences-a.absences);

    html+=`
    <div class="card" style="background:var(--surface)">
      <h3 class="font-bold text-lg mb-4">Ranking de Incumplimiento (Últimos 30 días)</h3>
      ${ranking.length>0?`
      <div style="overflow-x:auto">
        <table class="tbl">
          <thead><tr><th>#</th><th>Estudiante</th><th>Grado</th><th>Faltas</th></tr></thead>
          <tbody>
            ${ranking.slice(0,20).map((m,i)=>`<tr style="background:${i<3?'rgba(239,68,68,.05)':''}">
              <td style="font-weight:700;color:${i<3?'#ef4444':'var(--text)'}">${i+1}</td>
              <td style="font-weight:600">${m.name}</td>
              <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent);font-size:11px">${m.grade||'—'}</span></td>
              <td style="font-weight:700;color:#ef4444">${m.absences}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`:`<p style="color:var(--textm);text-align:center;padding:20px">Sin datos de incumplimiento</p>`}
    </div>`;
  }

  // ── TAB: EVIDENCIAS DEL DÍA ──
  if(rt==='evidence'){
    const todayEvidence = [...D.evidence.filter(e=>e.date===todayStr)].sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date));

    html+=`
    <div class="card" style="background:var(--surface)">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">Evidencias — ${todayStr}</h3>
        <span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${todayEvidence.length} foto(s)</span>
      </div>
      ${todayEvidence.length>0?`
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${todayEvidence.map(e=>{
          const group = D.cleanGroups.find(g=>g.name===e.group);
          return `<div class="card" style="background:var(--surface);padding:0;overflow:hidden">
            <div style="height:180px;background:rgba(6,182,212,.08);cursor:pointer" onclick="openImageFullscreen('${e.image||''}')">
              ${e.image?`<img src="${e.image}" style="width:100%;height:100%;object-fit:cover">`:'<div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="image" style="width:36px;height:36px;color:rgba(6,182,212,.3)"></i></div>'}
            </div>
            <div style="padding:12px">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-sm">${e.group}</span>
                <span class="badge" style="font-size:10px;background:${e.status==='Completado'?'#d1fae5;color:#059669':e.status==='Rechazado'?'#fee2e2;color:#dc2626':'#fef3c7;color:#92400e'}">${e.status}</span>
              </div>
              <p style="font-size:11px;color:var(--textm)">${e.student} · ${group?.grade||''}</p>
              ${e.image?`<a href="${e.image}" download style="font-size:11px;color:var(--accent);text-decoration:none;margin-top:6px;display:inline-block"><i data-lucide="download" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:3px"></i>Descargar</a>`:''}
              ${renderAttendanceList(e.group, e.date)}
            </div>
          </div>`;
        }).join('')}
      </div>`:`<p style="color:var(--textm);text-align:center;padding:30px">Sin evidencias hoy</p>`}
    </div>`;
  }

  // ── TAB: EXCEL SEMANAL ──
  if(rt==='excel'){
    const nowEx = new Date();
    const dayOfWeek = nowEx.getDay();
    const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const defaultMon = new Date(nowEx);
    defaultMon.setDate(nowEx.getDate() + diffToMon);
    const defaultMonStr = defaultMon.toISOString().split('T')[0];

    html += `
    <div class="card" style="background:var(--surface)">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 class="font-bold text-lg flex items-center gap-2">
            <i data-lucide="file-spreadsheet" style="width:20px;height:20px;color:#10b981"></i>
            Exportar Reporte Semanal a Excel
          </h3>
          <p style="color:var(--textm);font-size:13px;margin-top:4px">
            Genera un archivo Excel con 4 hojas: Resumen, Asistencia, Evidencias e Incidentes para la semana seleccionada.
          </p>
        </div>
      </div>

      <!-- Selector de semana -->
      <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:20px;margin-bottom:20px">
        <p style="font-size:13px;font-weight:600;color:#10b981;margin-bottom:12px">
          <i data-lucide="calendar-range" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px"></i>
          Selecciona la semana a exportar
        </p>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div>
            <label class="auth-label">Lunes de la semana</label>
            <input type="date" id="excelWeekStart" class="inp" value="${defaultMonStr}"
              style="width:180px" onchange="updateExcelWeekPreview()">
          </div>
          <div style="padding:10px 16px;background:rgba(6,182,212,.08);border-radius:8px;border:1px solid rgba(6,182,212,.2)">
            <p style="font-size:12px;color:var(--textm)">Semana</p>
            <p id="excelWeekLabel" style="font-size:13px;font-weight:700;color:var(--accent)">—</p>
          </div>
        </div>
      </div>

      <!-- KPIs de preview -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" id="excelPreviewKpis"></div>

      <!-- Hojas que tendrá -->
      <div style="margin-bottom:20px">
        <p style="font-size:13px;font-weight:600;margin-bottom:10px">El archivo tendrá 4 hojas:</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div style="padding:14px;background:rgba(6,182,212,.08);border-radius:10px;border:1px solid rgba(6,182,212,.2)">
            <i data-lucide="layout-dashboard" style="width:18px;height:18px;color:#06b6d4;margin-bottom:8px;display:block"></i>
            <p style="font-weight:700;font-size:13px;margin-bottom:2px">1. Resumen</p>
            <p style="font-size:11px;color:var(--textm)">KPIs generales de la semana</p>
          </div>
          <div style="padding:14px;background:rgba(37,99,235,.08);border-radius:10px;border:1px solid rgba(37,99,235,.2)">
            <i data-lucide="user-check" style="width:18px;height:18px;color:#2563eb;margin-bottom:8px;display:block"></i>
            <p style="font-weight:700;font-size:13px;margin-bottom:2px">2. Asistencia</p>
            <p style="font-size:11px;color:var(--textm)">Check-in GPS por grado y día</p>
          </div>
          <div style="padding:14px;background:rgba(124,58,237,.08);border-radius:10px;border:1px solid rgba(124,58,237,.2)">
            <i data-lucide="camera" style="width:18px;height:18px;color:#7c3aed;margin-bottom:8px;display:block"></i>
            <p style="font-weight:700;font-size:13px;margin-bottom:2px">3. Evidencias</p>
            <p style="font-size:11px;color:var(--textm)">Fotos subidas y su estado</p>
          </div>
          <div style="padding:14px;background:rgba(239,68,68,.08);border-radius:10px;border:1px solid rgba(239,68,68,.2)">
            <i data-lucide="alert-circle" style="width:18px;height:18px;color:#ef4444;margin-bottom:8px;display:block"></i>
            <p style="font-weight:700;font-size:13px;margin-bottom:2px">4. Incidentes</p>
            <p style="font-size:11px;color:var(--textm)">Incidentes reportados en la semana</p>
          </div>
        </div>
      </div>

      <!-- Botón exportar -->
      <button class="pill pill-primary flex items-center gap-2" style="font-size:15px;padding:14px 32px"
        onclick="exportWeeklyExcel()">
        <i data-lucide="download" style="width:18px;height:18px"></i>
        Descargar Excel
      </button>
      <p id="excelMsg" style="font-size:12px;color:var(--textm);margin-top:10px;display:none"></p>
    </div>`;
  }

  return html;
}

/* ============================================================
   DASHBOARD — docentes y estudiantes
   ============================================================ */
let calendarOffset=0;

// renderCheckinCard fue eliminado (código muerto — nunca se llamaba).
// La lógica de check-in está integrada directamente en rDash/rEvidence.

function rDash(){
  const myGrade=getCurrentGrade();
  const myGroups=D.cleanGroups.filter(g=>!myGrade||g.grade===myGrade);
  const stats=[
    {icon:'users',     label:t('students'),   val:filterByGrade(D.students).length,  color:'#2563eb'},
    {icon:'door-open', label:t('rooms'),      val:filterByGrade(D.rooms).length,     color:'#059669'},
    {icon:'sparkles',  label:t('cleanGroups'),val:myGroups.length,                   color:'#ea580c'},
    {icon:'camera',    label:t('evidence'),   val:D.evidence.filter(e=>{const g=D.cleanGroups.find(cg=>cg.name===e.group);return !myGrade||!g||g.grade===myGrade;}).length, color:'#7c3aed'}
  ];

  const now=new Date();
  const year=new Date(now.getFullYear(),now.getMonth()+calendarOffset,1).getFullYear();
  const month=new Date(now.getFullYear(),now.getMonth()+calendarOffset,1).getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthNames=[...t('monthNames')];
  const dayNames=[...t('dayNames')];
  const EPOCH=new Date(1970,0,5);
  const base=new Date(now.getFullYear(),now.getMonth(),1);
  const view=new Date(year,month,1);
  const daysDiff=Math.round((view-base)/(864e5));
  const globalWeekAtStart=Math.floor(daysDiff/7);
  const byDay={};
  myGroups.filter(g=>g.frequency==='daily').forEach(g=>{if(!byDay[g.day])byDay[g.day]=[];byDay[g.day].push(g);});
  const weekly=myGroups.filter(g=>g.frequency==='weekly');

  let calDays='';
  const noClassSet=new Set((D.noClassDays||[]).filter(x=>!x.grade||x.grade===myGrade).map(x=>x.date));
  for(let i=0;i<firstDay;i++)calDays+=`<div></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const dow=new Date(year,month,d).getDay();
    const dname=dayNames[dow];
    const isWD=[1,2,3,4,5].includes(dow);
    const isToday=d===now.getDate()&&month===now.getMonth()&&year===now.getFullYear();
    const isPast=new Date(year,month,d)<new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isNoClass=noClassSet.has(dateStr);
    let group=null;
    if(isWD&&!isNoClass){
      // Primero revisar grupos diarios (tienen prioridad si el día coincide)
      const cands=byDay[dname]||[];
      if(cands.length>0){
        const dd=Math.round((new Date(year,month,d)-EPOCH)/(864e5));
        const idx=((Math.floor(dd/7)%cands.length)+cands.length)%cands.length;
        group=cands[idx];
      } else if(weekly.length>0){
        const gw=globalWeekAtStart+Math.floor((d-1+firstDay)/7);
        group=weekly[((gw%weekly.length)+weekly.length)%weekly.length];
      }
    }
    const bg=isNoClass?'rgba(239,68,68,.1)':isPast?'transparent':group?(group.color||'#06b6d4')+'28':'transparent';
    const brd=isNoClass?'1px solid rgba(239,68,68,.3)':group&&!isPast?'2px solid '+(group.color||'#06b6d4'):isToday?'2px solid var(--accent)':'1px solid transparent';
    const col=isNoClass?'#ef4444':isPast?'rgba(100,100,100,.4)':group&&!isPast?(group.color||'#06b6d4'):isToday?'var(--accent)':'inherit';
    const clickFn=isAdmin()&&isWD?`onclick="toggleNoClassDay('${dateStr}',${isNoClass})"`:""
    calDays+=`<div ${clickFn} ${group&&!isPast?`title="${group.name}"`:''}style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 2px;border-radius:6px;background:${bg};border:${brd};min-height:36px;${isAdmin()&&isWD?'cursor:pointer;':''}"
      ${isAdmin()&&isWD?`onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'"`:''}>
      <span style="font-size:12px;font-weight:${(group&&!isPast)||isToday?'700':'400'};color:${col};${isPast?'opacity:.5':''}${isNoClass?'text-decoration:line-through':''}">${d}</span>
      ${group&&!isPast?`<div style="width:7px;height:7px;border-radius:50%;background:${group.color||'#06b6d4'};margin-top:3px"></div>`:''}
      ${isNoClass?`<div style="width:7px;height:7px;border-radius:50%;background:#ef4444;margin-top:3px"></div>`:''}
    </div>`;
  }

  const _avatarSrc = currentSession?.avatar_url || D._profileImage;
  const avatarInner=_avatarSrc?`<img src="${_avatarSrc}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:32px;font-weight:700;color:#fff">${currentSession?.name?.charAt(0)||''}</span>`;
  const emailBtn=`<button id="emailBtn" style="width:80px;height:80px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.2);border:none;cursor:pointer;transition:transform .2s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="showEmailModal()">${avatarInner}</button>`;

  return `<div class="flex items-center justify-between mb-6">
    <div><h1 class="text-3xl font-bold">CleanClass</h1>${myGrade?`<p style="color:var(--accent);font-size:13px;font-weight:600">Grado ${myGrade}</p>`:''}</div>
    ${emailBtn}
  </div>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${stats.map(s=>`<div class="card" style="background:var(--surface)">
      <div style="width:36px;height:36px;border-radius:10px;background:${s.color}15;display:flex;align-items:center;justify-content:center;margin-bottom:10px">
        <i data-lucide="${s.icon}" style="width:18px;height:18px;color:${s.color}"></i>
      </div>
      <p class="text-2xl font-bold">${s.val}</p>
      <p style="color:var(--textm);font-size:13px">${s.label}</p>
    </div>`).join('')}
  </div>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="card" style="background:var(--surface)">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold">${monthNames[month]} ${year}</h3>
        <div class="flex gap-1">
          <button class="pill pill-ghost" style="padding:5px 8px" onclick="calendarOffset--;render()"><i data-lucide="chevron-left" style="width:15px;height:15px"></i></button>
          ${calendarOffset!==0?`<button class="pill pill-ghost" style="padding:5px 8px;font-size:11px" onclick="calendarOffset=0;render()">Hoy</button>`:''}
          <button class="pill pill-ghost" style="padding:5px 8px" onclick="calendarOffset++;render()"><i data-lucide="chevron-right" style="width:15px;height:15px"></i></button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px">
        ${[t('sun'),t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat')].map(d=>`<div style="text-align:center;font-size:12px;font-weight:600;color:var(--textm);padding:4px">${d}</div>`).join('')}
        ${calDays}
      </div>
    </div>
    <div class="card" style="background:var(--surface)">
      <h3 class="font-bold mb-3">${t('upcomingTurns')}</h3>
      ${myGroups.length>0?myGroups.map(g=>{
        const label=g.frequency==='daily'?g.day+' '+t('eachWeek'):t('weeklyRotation')+' '+(myGroups.filter(x=>x.frequency==='weekly').indexOf(g)+1);
        return `<div class="flex items-center justify-between py-2" style="border-bottom:1px solid var(--border)">
          <div><span class="font-medium text-sm">${g.name}</span><span class="badge" style="background:${g.color||'#06b6d4'}20;color:${g.color||'#06b6d4'};margin-left:6px">${label}</span></div>
          <span style="color:var(--textm);font-size:13px">${g.members.length} ${t('members')}</span>
        </div>`;
      }).join(''):`<p style="color:var(--textm);font-size:13px;padding:10px 0">${t('noTurns')}</p>`}
    </div>
  </div>`;
}

/* ============================================================
   SALONES
   ============================================================ */
// ============================================================
// rAnalytics — Gráficos (Pie/Bar/Line) + Ranking + Tabla BIEN/MAL
// ============================================================
// ============================================================
// ANALYTICS — optimizado, sin charts cuando no hay datos
// ============================================================
let analyticsTab = 'charts';
let rankingFilter = 'school';
const _charts = {};
function destroyChart(id){ if(_charts[id]){_charts[id].destroy();delete _charts[id];} }

function complianceBadge(ev){
  if(ev.status==='Pendiente') return `<span class="badge-pill badge-pill-amber">⏳ Pendiente</span>`;
  if(ev.compliant||ev.status==='Completado') return `<span class="badge-pill badge-pill-green">✅ BIEN</span>`;
  return `<span class="badge-pill badge-pill-red">❌ MAL</span>`;
}

window.initCharts = function(){
  if(!document.getElementById('chartPie')) return;
  const myGrade = getCurrentGrade();
  const myEv = D.evidence.filter(e=>{ const g=D.cleanGroups.find(cg=>cg.name===e.group); return !myGrade||!g||g.grade===myGrade; });
  if(!myEv.length) return; // sin datos, no inicializar

  const completed = myEv.filter(e=>e.compliant||e.status==='Completado').length;
  const rejected  = myEv.filter(e=>e.status==='Rechazado').length;
  const pending   = myEv.filter(e=>e.status==='Pendiente').length;

  const cfg = { color:'#cbd5e1', borderColor:'rgba(6,182,212,.12)', font:{family:'DM Sans',size:12} };
  Chart.defaults.color=cfg.color; Chart.defaults.borderColor=cfg.borderColor; Chart.defaults.font=cfg.font;

  const pieEl=document.getElementById('chartPie');
  if(pieEl){ destroyChart('pie');
    _charts['pie']=new Chart(pieEl,{type:'doughnut',
      data:{labels:['✅ BIEN','❌ MAL','⏳ Pendiente'],
        datasets:[{data:[completed,rejected,pending],
          backgroundColor:['rgba(16,185,129,.85)','rgba(239,68,68,.85)','rgba(245,158,11,.85)'],
          borderColor:['#064e3b','#7f1d1d','#78350f'],borderWidth:2,hoverOffset:8}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'62%',
        animation:{duration:500},
        plugins:{legend:{position:'bottom',labels:{padding:14,boxWidth:12,font:{size:12}}},
          tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed/myEv.length*100)}%)`}}}}});
  }

  const barEl=document.getElementById('chartBar');
  if(barEl){ destroyChart('bar');
    const grades=[...new Set(D.cleanGroups.map(g=>g.grade))].filter(Boolean).sort();
    const vals=grades.map(grade=>{ const evs=D.evidence.filter(e=>{const g=D.cleanGroups.find(cg=>cg.name===e.group);return g&&g.grade===grade;}); return evs.length?Math.round((evs.filter(e=>e.compliant||e.status==='Completado').length/evs.length)*100):0; });
    _charts['bar']=new Chart(barEl,{type:'bar',
      data:{labels:grades.length?grades:['Sin grupos'],
        datasets:[{label:'%',data:grades.length?vals:[0],
          backgroundColor:vals.map(v=>v>=70?'rgba(16,185,129,.75)':v>=40?'rgba(245,158,11,.75)':'rgba(239,68,68,.75)'),
          borderColor:vals.map(v=>v>=70?'#10b981':v>=40?'#f59e0b':'#ef4444'),
          borderWidth:2,borderRadius:6}]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:500},
        plugins:{legend:{display:false}},
        scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'},grid:{color:'rgba(6,182,212,.07)'}},x:{grid:{display:false}}}}});
  }

  const lineEl=document.getElementById('chartLine');
  if(lineEl){ destroyChart('line');
    const now=new Date(); const weeks=[],weekData=[];
    for(let w=7;w>=0;w--){
      const d=new Date(now); d.setDate(d.getDate()-w*7);
      const wStart=new Date(d); wStart.setDate(wStart.getDate()-7);
      weeks.push(`S${8-w}`);
      weekData.push(myEv.filter(e=>{const ed=new Date(e.date);return (e.compliant||e.status==='Completado')&&ed>=wStart&&ed<=d;}).length);
    }
    _charts['line']=new Chart(lineEl,{type:'line',
      data:{labels:weeks,datasets:[{label:'Completadas',data:weekData,borderColor:'#06b6d4',
        backgroundColor:'rgba(6,182,212,.1)',borderWidth:2,pointBackgroundColor:'#06b6d4',
        pointRadius:4,fill:true,tension:.4}]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:500},
        plugins:{legend:{display:false}},
        scales:{y:{min:0,ticks:{stepSize:1},grid:{color:'rgba(6,182,212,.07)'}},x:{grid:{display:false}}}}});
  }
};

function rAnalytics(){
  const myGrade   = getCurrentGrade();
  const allGrades = [...new Set(D.cleanGroups.map(g=>g.grade))].filter(Boolean).sort();
  const myEv = D.evidence.filter(e=>{ const g=D.cleanGroups.find(cg=>cg.name===e.group); return !myGrade||!g||g.grade===myGrade; });
  const completed = myEv.filter(e=>e.compliant||e.status==='Completado').length;
  const rejected  = myEv.filter(e=>e.status==='Rechazado').length;
  const pending   = myEv.filter(e=>e.status==='Pendiente').length;
  const compRate  = myEv.length?Math.round((completed/myEv.length)*100):0;
  const hasData   = myEv.length > 0;

  const rankGrade = rankingFilter==='school'?null:rankingFilter;
  const ranked    = getRankedGroups(rankGrade);
  const medals    = ['<i data-lucide="medal" style="width:16px;height:16px;display:inline-block;vertical-align:middle;color:#f59e0b"></i>','<i data-lucide="medal" style="width:16px;height:16px;display:inline-block;vertical-align:middle;color:#94a3b8"></i>','<i data-lucide="medal" style="width:16px;height:16px;display:inline-block;vertical-align:middle;color:#cd7c2f"></i>'];

  const emptyState = (icon,msg,sub='')=>`
    <div style="text-align:center;padding:50px 20px;border:2px dashed rgba(6,182,212,.2);border-radius:12px;background:rgba(6,182,212,.03)">
      <i data-lucide="${icon}" style="width:44px;height:44px;color:rgba(6,182,212,.35);margin:0 auto 14px;display:block"></i>
      <p style="font-weight:600;color:var(--textm)">${msg}</p>
      ${sub?`<p style="font-size:12px;color:var(--textm);margin-top:6px;opacity:.7">${sub}</p>`:''}
    </div>`;

  return `
  <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-3">
        <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i data-lucide="bar-chart-2" style="width:22px;height:22px;color:#fff"></i>
        </div>
        Analíticas y Gráficos
      </h1>
      <p style="color:var(--textm);font-size:13px;margin-top:4px">${myGrade?'Grado '+myGrade:'Todo el colegio'}</p>
    </div>
  </div>

  <!-- KPIs -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${[
      {icon:'check-circle',label:'BIEN',        val:completed,    color:'#10b981',bg:'rgba(16,185,129,.1)', sub:'Aprobadas'},
      {icon:'x-circle',    label:'MAL',         val:rejected,     color:'#ef4444',bg:'rgba(239,68,68,.1)',  sub:'Rechazadas'},
      {icon:'clock',       label:'Pendientes',  val:pending,      color:'#f59e0b',bg:'rgba(245,158,11,.1)', sub:'Sin revisar'},
      {icon:'trending-up', label:'Cumplimiento',val:compRate+'%', color:compRate>=70?'#10b981':compRate>=40?'#f59e0b':'#ef4444',
       bg:compRate>=70?'rgba(16,185,129,.1)':compRate>=40?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)',sub:'Tasa general'}
    ].map((s,i)=>`
    <div class="kpi-card slide-up" style="animation-delay:${i*0.06}s">
      <div style="width:40px;height:40px;border-radius:12px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin-bottom:10px">
        <i data-lucide="${s.icon}" style="width:20px;height:20px;color:${s.color}"></i>
      </div>
      <p style="font-size:26px;font-weight:800;color:${s.color};line-height:1">${s.val}</p>
      <p style="font-weight:700;font-size:13px;margin:4px 0 2px">${s.label}</p>
      <p style="color:var(--textm);font-size:11px">${s.sub}</p>
    </div>`).join('')}
  </div>

  <!-- Tabs -->
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:10px">
    ${[{key:'charts',icon:'pie-chart',label:'Gráficos'},{key:'ranking',icon:'award',label:'Tabla de Puntuación'},{key:'table',icon:'clipboard-list',label:'Registro BIEN / MAL'}].map(tab=>`
    <button onclick="analyticsTab='${tab.key}';render()"
      style="display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .2s;
      background:${analyticsTab===tab.key?'var(--accent)':'rgba(6,182,212,.07)'};color:${analyticsTab===tab.key?'#fff':'var(--textm)'}">
      <i data-lucide="${tab.icon}" style="width:14px;height:14px"></i>${tab.label}
    </button>`).join('')}
  </div>

  <!-- GRÁFICOS -->
  ${analyticsTab==='charts'?(!hasData?emptyState('bar-chart-2','Aún no hay evidencias registradas','Los gráficos aparecerán cuando el docente apruebe o rechace evidencias'):`
  <div class="grid gap-5 lg:grid-cols-2">
    <div class="chart-wrap slide-up">
      <h3 class="font-bold mb-1">Rendimiento General</h3>
      <p style="font-size:12px;color:var(--textm);margin-bottom:14px">BIEN / MAL / Pendiente</p>
      <div style="height:220px;position:relative"><canvas id="chartPie"></canvas></div>
    </div>
    <div class="chart-wrap slide-up" style="animation-delay:.08s">
      <h3 class="font-bold mb-1">Comparativa por Salón</h3>
      <p style="font-size:12px;color:var(--textm);margin-bottom:14px">% de cumplimiento por grado</p>
      <div style="height:220px;position:relative"><canvas id="chartBar"></canvas></div>
    </div>
    <div class="chart-wrap lg:col-span-2 slide-up" style="animation-delay:.16s">
      <h3 class="font-bold mb-1">Tendencia — Últimas 8 Semanas</h3>
      <p style="font-size:12px;color:var(--textm);margin-bottom:14px">Limpiezas completadas por semana</p>
      <div style="height:200px;position:relative"><canvas id="chartLine"></canvas></div>
    </div>
  </div>`):''}

  <!-- RANKING -->
  ${analyticsTab==='ranking'?`
  <div class="slide-up">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:18px;padding:12px 16px;background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.18);border-radius:10px">
      <i data-lucide="filter" style="width:14px;height:14px;color:var(--accent)"></i>
      <span style="font-size:13px;font-weight:600;color:var(--accent)">Filtrar:</span>
      <button onclick="rankingFilter='school';render()" style="padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:${rankingFilter==='school'?'var(--accent)':'rgba(6,182,212,.1)'};color:${rankingFilter==='school'?'#fff':'var(--textm)'}"><i data-lucide="school" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Todo el Colegio</button>
      ${allGrades.map(g=>`<button onclick="rankingFilter='${g}';render()" style="padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:${rankingFilter===g?'#f59e0b':'rgba(245,158,11,.1)'};color:${rankingFilter===g?'#fff':'#f59e0b'}"><i data-lucide="trophy" style="width:16px;height:16px;display:inline-block;vertical-align:middle;color:#f59e0b"></i> ${g}</button>`).join('')}
    </div>
    ${ranked.length===0?emptyState('award','No hay grupos con evidencias aún','Crea grupos de aseo y sube evidencias para ver el ranking'):
    `<div class="grid gap-4 sm:grid-cols-3 mb-5">
      ${ranked.slice(0,3).map((g,i)=>{
        const cs=['rgba(251,191,36,.12)','rgba(148,163,184,.1)','rgba(180,83,9,.1)'];
        const bs=['rgba(251,191,36,.3)','rgba(148,163,184,.25)','rgba(180,83,9,.25)'];
        const bc=g.score>=70?'#10b981':g.score>=40?'#f59e0b':'#ef4444';
        return `<div class="card pop-in" style="background:${cs[i]};border:2px solid ${bs[i]};text-align:center;animation-delay:${i*0.07}s">
          <div style="font-size:34px;margin-bottom:6px">${medals[i]}</div>
          <div style="width:10px;height:10px;border-radius:50%;background:${g.color||'#06b6d4'};margin:0 auto 8px"></div>
          <p style="font-weight:700;font-size:15px;margin-bottom:3px">${g.name}</p>
          <span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent);font-size:11px;margin-bottom:10px;display:inline-block">${g.grade}</span>
          <p style="font-size:30px;font-weight:800;color:${bc};line-height:1;margin-bottom:6px">${g.score}%</p>
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${g.score}%;background:${bc}"></div></div>
          <p style="font-size:11px;color:var(--textm);margin-top:6px">${g.completed}/${g.total} limpiezas</p>
        </div>`;
      }).join('')}
    </div>
    <div class="card" style="background:var(--surface);padding:0;overflow:hidden">
      <div style="padding:12px 18px;border-bottom:1px solid var(--border)"><h3 class="font-bold">Clasificación Completa</h3></div>
      <div style="overflow-x:auto"><table class="tbl" style="margin:0">
        <thead><tr style="background:rgba(6,182,212,.04)">
          <th style="width:48px;text-align:center">Pos.</th><th>Grupo</th><th>Grado</th>
          <th style="text-align:center">✅</th><th style="text-align:center">❌</th><th>Puntuación</th><th style="text-align:center">Estado</th>
        </tr></thead>
        <tbody>${ranked.map((g,i)=>{
          const bc=g.score>=70?'#10b981':g.score>=40?'#f59e0b':'#ef4444';
          return `<tr class="${g.score>=70?'compliant-row':g.total>0&&g.score<40?'non-compliant-row':''}">
            <td style="text-align:center;font-size:${i<3?'18':'13'}px">${i<3?medals[i]:`<span style="color:var(--textm);font-weight:700">#${i+1}</span>`}</td>
            <td><div style="display:flex;align-items:center;gap:8px"><div style="width:9px;height:9px;border-radius:50%;background:${g.color||'#06b6d4'}"></div><span style="font-weight:600">${g.name}</span></div></td>
            <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent);font-size:11px">${g.grade||'—'}</span></td>
            <td style="text-align:center"><span class="badge-pill badge-pill-green">${g.completed}</span></td>
            <td style="text-align:center"><span class="badge-pill badge-pill-red">${g.total-g.completed}</span></td>
            <td style="min-width:130px"><div style="display:flex;align-items:center;gap:8px">
              <div class="progress-bar-track" style="flex:1"><div class="progress-bar-fill" style="width:${g.score}%;background:${bc}"></div></div>
              <span style="font-weight:700;color:${bc};font-size:13px">${g.score}%</span>
            </div></td>
            <td style="text-align:center">${g.score>=70?`<span class="badge-pill badge-pill-green">BIEN</span>`:g.total===0?`<span style="font-size:11px;color:var(--textm)">—</span>`:`<span class="badge-pill badge-pill-red">MAL</span>`}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`}
  </div>`:''}

  <!-- TABLA BIEN/MAL -->
  ${analyticsTab==='table'?(!hasData?emptyState('clipboard-list','Sin evidencias para mostrar','El registro aparecerá cuando se suban y revisen evidencias'):`
  <div class="card slide-up" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <h3 class="font-bold flex items-center gap-2"><i data-lucide="clipboard-list" style="width:16px;height:16px;color:var(--accent)"></i>Registro de Cumplimiento</h3>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span class="badge-pill badge-pill-green">${completed} BIEN</span>
        <span class="badge-pill badge-pill-red">${rejected} MAL</span>
        <span class="badge-pill badge-pill-amber">${pending} Pendiente</span>
        ${isStudent()?`<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(6,182,212,.1);border-radius:8px;font-size:11px;color:var(--accent);font-weight:600"><i data-lucide="eye" style="width:11px;height:11px"></i> Solo lectura</span>`:''}
      </div>
    </div>
    <div style="overflow-x:auto"><table class="tbl" style="margin:0">
      <thead><tr style="background:rgba(6,182,212,.04)">
        <th>Fecha</th><th>Grupo</th><th>Estudiante</th>
        <th style="text-align:center">Aseo</th><th style="text-align:center">Resultado</th>
        <th>Revisado por</th><th>Observación</th>
      </tr></thead>
      <tbody>${[...myEv].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((e,i)=>{
        const bien=e.compliant||e.status==='Completado'; const mal=e.status==='Rechazado';
        return `<tr class="${bien?'compliant-row':mal?'non-compliant-row':''}" style="animation-delay:${i*0.02}s">
          <td style="font-size:12px;white-space:nowrap"><strong>${e.date}</strong>${e.time?`<br><span style="color:var(--textm)">${e.time}</span>`:''}  </td>
          <td style="font-size:13px">${e.group}</td>
          <td style="font-size:12px">${e.student}</td>
          <td style="text-align:center;font-size:22px">${bien?'✅':mal?'❌':'⏳'}</td>
          <td style="text-align:center">${complianceBadge(e)}</td>
          <td style="font-size:12px;color:var(--textm)">${e.reviewed_by||'—'}</td>
          <td style="font-size:12px;color:var(--textm);max-width:160px">${e.observation||'—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>`):''}`;
}

// ============================================================
// MÓDULO DE USUARIOS — solo lectura, sin botones de agregar
// ============================================================
let usersTab = 'students';
let usersGradeFilter = null;
let usersSearch = '';

function rUsers(){
  const allGrades  = [...new Set(D.rooms.map(r=>r.grade))].sort();
  const myGrade    = getCurrentGrade();
  const gradeScope = isAdmin()?( usersGradeFilter||null):myGrade;

  const filteredStudents = D.students
    .filter(s=>!gradeScope||s.grade===gradeScope)
    .filter(s=>!usersSearch||s.name.toLowerCase().includes(usersSearch.toLowerCase())||(s.email||'').toLowerCase().includes(usersSearch.toLowerCase()));

  const filteredTeachers = D.teachers
    .filter(t=>!gradeScope||t.grade===gradeScope)
    .filter(t=>!usersSearch||t.name.toLowerCase().includes(usersSearch.toLowerCase())||(t.email||'').toLowerCase().includes(usersSearch.toLowerCase()));

  const gradeDistrib = allGrades.map(g=>({
    grade:g, students:D.students.filter(s=>s.grade===g).length, teachers:D.teachers.filter(t=>t.grade===g).length
  }));

  return `
  <div style="background:linear-gradient(135deg,rgba(37,99,235,.16),rgba(124,58,237,.08));border:1px solid rgba(37,99,235,.25);border-radius:16px;padding:20px;margin-bottom:20px">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-3">
          <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i data-lucide="users" style="width:21px;height:21px;color:#fff"></i>
          </div>
          Módulo de Usuarios
        </h1>
        <p style="color:var(--textm);font-size:13px;margin-top:4px">${isAdmin()?'Aquí puedes ver, agregar y gestionar todos los estudiantes y docentes del colegio, organizados por grado.':myGrade?'Grado '+myGrade:'Sin grado asignado'}</p>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <div style="position:relative">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--textm);pointer-events:none"></i>
          <input type="text" placeholder="Buscar..." value="${usersSearch}"
            onchange="usersSearch=this.value;render()" onkeydown="if(event.key==='Enter'){usersSearch=this.value;render()}"
            class="inp" style="padding:8px 12px 8px 32px;width:170px;font-size:13px">
        </div>
        ${isAdmin()?`<select class="inp" style="width:auto;padding:8px 32px 8px 12px;font-size:13px" onchange="usersGradeFilter=this.value||null;render()">
          <option value="">Todos los grados</option>
          ${allGrades.map(g=>`<option value="${g}" ${usersGradeFilter===g?'selected':''}>${g}</option>`).join('')}
        </select>`:''}
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${[
      {icon:'users',    label:'Estudiantes', val:D.students.filter(s=>!gradeScope||s.grade===gradeScope).length, color:'#2563eb'},
      {icon:'book-open',label:'Docentes',    val:D.teachers.filter(t=>!gradeScope||t.grade===gradeScope).length, color:'#7c3aed'},
      {icon:'door-open',label:'Salones',     val:D.rooms.filter(r=>!gradeScope||r.grade===gradeScope).length,    color:'#059669'},
      {icon:'sparkles', label:'Grupos Aseo', val:D.cleanGroups.filter(g=>!gradeScope||g.grade===gradeScope).length, color:'#f59e0b'}
    ].map((s,i)=>`
    <div class="kpi-card slide-up" style="animation-delay:${i*0.07}s">
      <div style="width:38px;height:38px;border-radius:10px;background:${s.color}18;display:flex;align-items:center;justify-content:center;margin-bottom:10px">
        <i data-lucide="${s.icon}" style="width:19px;height:19px;color:${s.color}"></i>
      </div>
      <p style="font-size:24px;font-weight:800;color:${s.color};line-height:1">${s.val}</p>
      <p style="font-size:13px;font-weight:600;margin:4px 0 2px">${s.label}</p>
    </div>`).join('')}
  </div>

  <!-- Distribución por grado (admin) -->
  ${isAdmin()?`
  <div class="card mb-5 slide-up" style="background:var(--surface)">
    <h3 class="font-bold mb-3 flex items-center gap-2">
      <i data-lucide="layout-grid" style="width:15px;height:15px;color:var(--accent)"></i>
      Distribución por Grado
      ${usersGradeFilter?`<button class="pill pill-ghost" style="font-size:11px;padding:3px 10px" onclick="usersGradeFilter=null;render()">✕ Quitar filtro</button>`:''}
    </h3>
    <div class="grid gap-3 sm:grid-cols-3">
      ${gradeDistrib.map(g=>`
      <div onclick="usersGradeFilter='${g.grade}';render()" style="padding:12px;border-radius:10px;cursor:pointer;transition:all .2s;
        background:${usersGradeFilter===g.grade?'rgba(6,182,212,.12)':'rgba(6,182,212,.04)'};
        border:2px solid ${usersGradeFilter===g.grade?'var(--accent)':'rgba(6,182,212,.12)'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="badge" style="background:rgba(6,182,212,.18);color:var(--accent)">${g.grade}</span>
          <i data-lucide="chevron-right" style="width:13px;height:13px;color:var(--textm)"></i>
        </div>
        <div style="display:flex;gap:16px">
          <div><p style="font-size:20px;font-weight:700;color:#2563eb">${g.students}</p><p style="font-size:11px;color:var(--textm)">Estudiantes</p></div>
          <div><p style="font-size:20px;font-weight:700;color:#7c3aed">${g.teachers}</p><p style="font-size:11px;color:var(--textm)">Docentes</p></div>
        </div>
      </div>`).join('')}
    </div>
  </div>`:''}

  <!-- Tabs -->
  <div style="display:flex;gap:6px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:10px;flex-wrap:wrap">
    ${[
      {key:'students',label:`Estudiantes (${filteredStudents.length})`,color:'#2563eb'},
      {key:'teachers',label:`Docentes (${filteredTeachers.length})`,color:'#7c3aed'}
    ].map(tab=>`
    <button onclick="usersTab='${tab.key}';render()"
      style="padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .2s;
      background:${usersTab===tab.key?tab.color:'transparent'};color:${usersTab===tab.key?'#fff':'var(--textm)'}">
      ${tab.label}
    </button>`).join('')}
  </div>

  <!-- TABLA ESTUDIANTES -->
  ${usersTab==='students'?`
  <div class="card slide-up" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <h3 class="font-bold">Estudiantes</h3>
      <div class="flex gap-2 items-center">
        <span class="badge" style="background:rgba(37,99,235,.15);color:#2563eb">${filteredStudents.length} registros</span>
        ${isAdmin()?`<button class="pill pill-primary" style="font-size:12px;padding:6px 14px" onclick="openModal('add','students')"><i data-lucide="plus" style="width:13px;height:13px"></i> Agregar</button>`:''}
      </div>
    </div>
    <div style="overflow-x:auto"><table class="tbl" style="margin:0">
      <thead><tr style="background:rgba(37,99,235,.04)">
        <th style="width:36px">#</th><th>Nombre</th><th>Grado</th><th>Email</th><th>Grupo Aseo</th><th style="text-align:center">Cumplimiento</th>${isAdmin()?'<th>Acciones</th>':''}
      </tr></thead>
      <tbody>${filteredStudents.length>0?filteredStudents.map((s,i)=>{
        const group=D.cleanGroups.find(g=>g.members&&g.members.includes(s.name));
        const evs=D.evidence.filter(e=>e.student===s.name);
        const comp=evs.length?Math.round((evs.filter(e=>e.compliant||e.status==='Completado').length/evs.length)*100):null;
        const cc=comp===null?'var(--textm)':comp>=70?'#10b981':comp>=40?'#f59e0b':'#ef4444';
        return `<tr>
          <td style="color:var(--textm);font-size:12px;text-align:center">${i+1}</td>
          <td><div style="display:flex;align-items:center;gap:9px">
            <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:700;flex-shrink:0">${(()=>{const up=D.usersProfiles?.find(u=>u.email===s.email);const av=up?.avatar_url;return av?`<img src="${av}" style="width:100%;height:100%;object-fit:cover">`:`${s.name.charAt(0)}`;})()}</div>
            <span style="font-weight:600;font-size:13px">${s.name}</span>
          </div></td>
          <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${s.grade}</span></td>
          <td style="font-size:12px;color:var(--textm)">${s.email||'—'}</td>
          <td>${group?`<span class="badge" style="background:${group.color||'#06b6d4'}20;color:${group.color||'#06b6d4'};font-size:11px">${group.name}</span>`:`<span style="font-size:12px;color:var(--textm);font-style:italic">Sin grupo</span>`}</td>
          <td style="text-align:center">${comp!==null?`<div style="display:flex;align-items:center;gap:7px;justify-content:center">
            <div style="width:50px;height:5px;border-radius:3px;background:rgba(6,182,212,.1);overflow:hidden"><div style="width:${comp}%;height:100%;background:${cc}"></div></div>
            <span style="font-size:12px;font-weight:700;color:${cc}">${comp}%</span>
          </div>`:`<span style="font-size:11px;color:var(--textm)">—</span>`}</td>
          ${isAdmin()?`<td><div class="flex gap-1">
            <button class="pill pill-ghost" style="padding:4px 8px;font-size:11px" onclick="openModal('edit','students',${s.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i></button>
            <button class="pill pill-danger" style="padding:4px 8px;font-size:11px" onclick="if(confirm('¿Eliminar a ${s.name}?'))deleteStudentDb(${s.id}).then(()=>render())"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
          </div></td>`:''}
        </tr>`;
      }).join(''):`<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--textm)">Sin estudiantes</td></tr>`}
      </tbody>
    </table></div>
  </div>`:''}

  <!-- TABLA DOCENTES -->
  ${usersTab==='teachers'?`
  <div class="card slide-up" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <h3 class="font-bold">Docentes</h3>
      <div class="flex gap-2 items-center">
        <span class="badge" style="background:rgba(124,58,237,.15);color:#7c3aed">${filteredTeachers.length} registros</span>
        ${isAdmin()?`<button class="pill pill-primary" style="font-size:12px;padding:6px 14px" onclick="openModal('add','teachers')"><i data-lucide="plus" style="width:13px;height:13px"></i> Agregar</button>`:''}
      </div>
    </div>
    <div style="overflow-x:auto"><table class="tbl" style="margin:0">
      <thead><tr style="background:rgba(124,58,237,.04)">
        <th style="width:36px">#</th><th>Nombre</th><th>Materia</th><th>Grado</th><th>Email</th>${isAdmin()?'<th>Acciones</th>':''}
      </tr></thead>
      <tbody>${filteredTeachers.length>0?filteredTeachers.map((tc,i)=>`
      <tr>
        <td style="color:var(--textm);font-size:12px;text-align:center">${i+1}</td>
        <td><div style="display:flex;align-items:center;gap:9px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#ec4899);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:700;flex-shrink:0">${tc.name.replace('Prof. ','').charAt(0)}</div>
          <span style="font-weight:600;font-size:13px">${tc.name}</span>
        </div></td>
        <td style="font-size:13px">${tc.subject||'—'}</td>
        <td><span class="badge" style="background:rgba(124,58,237,.15);color:#7c3aed">${tc.grade||'—'}</span></td>
        <td style="font-size:12px;color:var(--textm)">${tc.email||'—'}</td>
        ${isAdmin()?`<td><div class="flex gap-1">
          <button class="pill pill-ghost" style="padding:4px 8px;font-size:11px" onclick="openModal('edit','teachers',${tc.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i></button>
          <button class="pill pill-danger" style="padding:4px 8px;font-size:11px" onclick="if(confirm('¿Eliminar a ${tc.name}?'))deleteTeacherDb(${tc.id}).then(()=>render())"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
        </div></td>`:''}
      </tr>`).join(''):`<tr><td colspan="${isAdmin()?6:5}" style="text-align:center;padding:36px;color:var(--textm)">Sin docentes</td></tr>`}
      </tbody>
    </table></div>
  </div>`:''}
`;
}

// ============================================================
// EVIDENCIAS — cámara directa con sello de fecha/hora/día
// ============================================================
// ---- Lista de asistencia GPS para una evidencia (grupo + fecha) ----
function renderAttendanceList(groupName, dateStr){
  const group = D.cleanGroups.find(g=>g.name===groupName);
  if(!group || !group.members?.length) return '';
  const checkins = (D.checkins||[]).filter(c=>c.group_name===groupName && c.date===dateStr);
  const myName = currentSession?.name;
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dateStr===todayStr;

  return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
    <p style="font-size:10px;color:var(--textm);font-weight:600;margin-bottom:4px">ASISTENCIA (GPS)</p>
    ${group.members.map(name=>{
      const c = checkins.find(x=>x.student===name);
      if(c){
        return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#16a34a;padding:2px 0">
          <i data-lucide="check-circle" style="width:12px;height:12px"></i> ${name} <span style="color:var(--textm)">(${Math.round(c.distance_m)}m)</span>
        </div>`;
      }
      // Si es el propio usuario y aún no marcó, puede tocar su nombre para registrar
      if(name===myName && isToday){
        return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#f59e0b;padding:2px 0;cursor:pointer;text-decoration:underline" onclick="doCheckin('${groupName}')">
          <i data-lucide="map-pin" style="width:12px;height:12px"></i> ${name} — Toca para registrar tu asistencia
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#ef4444;padding:2px 0">
        <i data-lucide="x-circle" style="width:12px;height:12px"></i> ${name} <span style="color:var(--textm)">(no registró)</span>
      </div>`;
    }).join('')}
    <p id="checkinMsg" style="font-size:11px;margin-top:4px;display:none"></p>
  </div>`;
}

function rEvidence(){
  // ── ADMIN: galería de evidencias con filtro por grado ──
  if(isAdmin()){
    if(typeof window._evGradeFilter==='undefined') window._evGradeFilter=null;
    const allGrades=[...new Set(D.cleanGroups.map(g=>g.grade).filter(Boolean))].sort();
    const filtered = window._evGradeFilter
      ? D.evidence.filter(e=>{const g=D.cleanGroups.find(cg=>cg.name===e.group);return g&&g.grade===window._evGradeFilter;})
      : D.evidence;
    const sorted = [...filtered].sort((a,b)=>new Date(b.date+' '+(b.time||''))-new Date(a.date+' '+(a.time||'')));
    const completed=filtered.filter(e=>e.status==='Completado').length;
    const pending=filtered.filter(e=>e.status==='Pendiente').length;
    const rejected=filtered.filter(e=>e.status==='Rechazado').length;
    const total=filtered.length;
    const rate=total?Math.round((completed/total)*100):0;

    return `
    <div style="margin-bottom:20px">
      <h1 class="text-2xl font-bold mb-1"><i data-lucide="camera" style="width:24px;height:24px;display:inline-block;vertical-align:middle;margin-right:8px"></i>Evidencias de Aseo</h1>
      <p style="color:var(--textm);font-size:13px">Aquí puedes ver todas las fotos que los estudiantes suben después del aseo. Toca una imagen para verla en grande.</p>
    </div>

    <!-- Filtro por grado — mini cards estéticas -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">
      <p style="font-size:11px;color:var(--textm);width:100%;margin-bottom:4px">Filtrar por grado:</p>
      <button onclick="window._evGradeFilter=null;render()"
        style="padding:8px 16px;border-radius:10px;border:1.5px solid ${!window._evGradeFilter?'var(--accent)':'var(--border)'};
        background:${!window._evGradeFilter?'rgba(6,182,212,.15)':'transparent'};
        color:${!window._evGradeFilter?'var(--accent)':'var(--textm)'};font-size:13px;font-weight:600;cursor:pointer;transition:all .2s">
        📚 Todos <span style="background:rgba(6,182,212,.2);padding:1px 8px;border-radius:20px;font-size:11px;margin-left:4px">${D.evidence.length}</span>
      </button>
      ${allGrades.map(g=>{
        const count=D.evidence.filter(e=>{const cg=D.cleanGroups.find(c=>c.name===e.group);return cg&&cg.grade===g;}).length;
        const isActive=window._evGradeFilter===g;
        return `<button onclick="window._evGradeFilter='${g}';render()"
          style="padding:8px 16px;border-radius:10px;border:1.5px solid ${isActive?'var(--accent)':'var(--border)'};
          background:${isActive?'rgba(6,182,212,.15)':'transparent'};
          color:${isActive?'var(--accent)':'var(--textm)'};font-size:13px;font-weight:600;cursor:pointer;transition:all .2s">
          ${g} <span style="background:${count>0?'rgba(6,182,212,.2)':'rgba(100,116,139,.15)'};padding:1px 8px;border-radius:20px;font-size:11px;margin-left:4px">${count}</span>
        </button>`;
      }).join('')}
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${[
        {icon:'check-circle',label:'Aprobadas',   val:completed,color:'#10b981',bg:'rgba(16,185,129,.1)'},
        {icon:'x-circle',    label:'Rechazadas',  val:rejected, color:'#ef4444',bg:'rgba(239,68,68,.1)'},
        {icon:'clock',       label:'Pendientes',  val:pending,  color:'#f59e0b',bg:'rgba(245,158,11,.1)'},
        {icon:'trending-up', label:'Cumplimiento',val:rate+'%', color:rate>=70?'#10b981':rate>=40?'#f59e0b':'#ef4444',bg:'rgba(6,182,212,.1)'}
      ].map((s,i)=>`
      <div class="kpi-card slide-up" style="animation-delay:${i*0.07}s">
        <div style="width:38px;height:38px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin-bottom:10px">
          <i data-lucide="${s.icon}" style="width:19px;height:19px;color:${s.color}"></i>
        </div>
        <p style="font-size:24px;font-weight:800;color:${s.color};line-height:1">${s.val}</p>
        <p style="font-size:13px;color:var(--textm);margin-top:4px">${s.label}</p>
      </div>`).join('')}
    </div>

    <!-- Galería de evidencias -->
    <h3 class="font-bold text-lg mb-3">Evidencias ${window._evGradeFilter?'— Grado '+window._evGradeFilter:''}</h3>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${sorted.length>0?sorted.map((e,i)=>{
        const group=D.cleanGroups.find(g=>g.name===e.group);
        return `
        <div class="card pop-in" style="background:var(--surface);padding:0;overflow:hidden;animation-delay:${i*0.04}s">
          <div style="height:180px;background:rgba(6,182,212,.08);cursor:pointer;position:relative" onclick="openImageFullscreen('${e.image||''}')">
            ${e.image?`<img src="${e.image}" style="width:100%;height:100%;object-fit:cover">`:'<div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="image" style="width:36px;height:36px;color:rgba(6,182,212,.3)"></i></div>'}
            <div style="position:absolute;top:8px;right:8px">
              <span class="badge" style="font-size:10px;background:${e.status==='Completado'?'#d1fae5;color:#059669':e.status==='Rechazado'?'#fee2e2;color:#dc2626':'#fef3c7;color:#92400e'}">${e.status}</span>
            </div>
            ${e.image?`<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.75));padding:8px 10px">
              <p style="font-size:10px;color:#fff;font-weight:600">${e.date}${e.time?' · '+e.time:''}</p>
            </div>`:''}
          </div>
          <div style="padding:12px">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-sm">${e.group}</span>
              <span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent);font-size:10px">${group?.grade||'—'}</span>
            </div>
            <p style="font-size:11px;color:var(--textm)">Subida por: ${e.student}</p>
            ${renderAttendanceList(e.group, e.date)}
            ${e.image?`<a href="${e.image}" download style="font-size:11px;color:var(--accent);text-decoration:none;margin-top:8px;display:inline-flex;align-items:center;gap:4px"><i data-lucide="download" style="width:12px;height:12px"></i>Descargar foto</a>`:''}
          </div>
        </div>`;
      }).join(''):`
      <div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--textm);border:2px dashed var(--border);border-radius:12px">
        <i data-lucide="camera" style="width:44px;height:44px;opacity:.35;margin:0 auto 14px;display:block"></i>
        <p class="font-medium">Sin evidencias</p>
        <p style="font-size:13px;margin-top:4px">Las evidencias subidas por los estudiantes aparecerán aquí</p>
      </div>`}
    </div>`;
  }

  // ── ESTUDIANTE / DOCENTE: vista original ──
  const myGrade   = getCurrentGrade();
  const myGroups  = D.cleanGroups.filter(g=>!myGrade||g.grade===myGrade);
  const myEvidence= isStudent()
    ? D.evidence.filter(e=>{
        const g=D.cleanGroups.find(cg=>cg.name===e.group);
        return g?.members?.includes(currentSession.name) || e.student===currentSession.name;
      })
    : D.evidence.filter(e=>{ const g=D.cleanGroups.find(cg=>cg.name===e.group); return !myGrade||!g||g.grade===myGrade; });
  const completed = myEvidence.filter(e=>e.compliant||e.status==='Completado').length;
  const pending   = myEvidence.filter(e=>e.status==='Pendiente').length;
  const rejected  = myEvidence.filter(e=>e.status==='Rechazado').length;
  const total     = myEvidence.length;
  const rate      = total?Math.round((completed/total)*100):0;

  return `
  <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold">Evidencias de Aseo</h1>
      <p style="color:var(--textm);font-size:13px">Toma la foto de la limpieza directamente desde la app</p>
    </div>
    ${(()=>{
      // Verificar si hoy es día sin clase
      const todayStr2 = new Date().toISOString().split('T')[0];
      const isTodayNoClass = (D.noClassDays||[]).some(x=>x.date===todayStr2 && (!x.grade||x.grade===myGrade));
      if(isTodayNoClass) return `<span style="font-size:13px;color:#ef4444;font-style:italic"><i data-lucide="calendar-x" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>Hoy no hay clase</span>`;
      if(!isStudent()) return myGroups.length>0?`<button class="pill pill-primary flex items-center gap-2" onclick="openCameraModal()"><i data-lucide="camera" style="width:16px;height:16px"></i>Tomar Foto</button>`:`<span style="font-size:13px;color:var(--textm);font-style:italic">Sin grupos creados</span>`;
      const myGroup=D.cleanGroups.find(g=>g.members&&g.members.includes(currentSession?.name));
      if(!myGroup) return `<span style="font-size:13px;color:var(--textm);font-style:italic">No estás en ningún grupo</span>`;

      // ---- VENTANA DE ASEO (check-in GPS + evidencia) ----
      const DAYS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const todayName2 = DAYS_ES[new Date().getDay()];
      const isMyTurnToday = myGroup.frequency==='weekly' || (myGroup.frequency==='daily' && myGroup.day===todayName2);

      if(!isMyTurnToday) return `<span style="font-size:13px;color:var(--textm);font-style:italic">Hoy no te toca aseo</span>`;

      const sch = (D.schedules||[]).find(s=>s.grade===myGrade);
      const cleanTime = sch?.clean_time?.substring(0,5);

      if(!cleanTime){
        return `<span style="font-size:13px;color:var(--textm);font-style:italic">Horario de aseo no configurado</span>`;
      }

      const now2 = new Date();
      const currentHM = now2.getHours()*60 + now2.getMinutes();
      const [nh,nm] = cleanTime.split(':').map(Number);
      const cleanHM = nh*60+nm;

      if(currentHM < cleanHM){
        return `<span style="font-size:13px;color:var(--textm);font-style:italic"><i data-lucide="clock" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>El aseo es a las ${cleanTime}</span>`;
      }

      const windowMin = sch?.evidence_window_min || 30;
      const closeHM = cleanHM + windowMin;
      const hasEvidenceToday = D.evidence.some(e=>e.group===myGroup.name && e.date===todayStr2);

      if(currentHM <= closeHM){
        return `<button class="pill pill-primary flex items-center gap-2" onclick="openCameraModal()"><i data-lucide="camera" style="width:16px;height:16px"></i>Tomar Foto</button>`;
      }
      if(hasEvidenceToday) return '';
      return `<span style="font-size:13px;color:#ef4444;font-style:italic"><i data-lucide="x-circle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>⏰ Ventana cerrada — no se subió evidencia</span>`;
    })()}
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${[
      {icon:'check-circle',label:'BIEN',       val:completed,color:'#10b981',bg:'rgba(16,185,129,.1)'},
      {icon:'x-circle',    label:'MAL',        val:rejected, color:'#ef4444',bg:'rgba(239,68,68,.1)'},
      {icon:'clock',       label:'Pendientes', val:pending,  color:'#f59e0b',bg:'rgba(245,158,11,.1)'},
      {icon:'trending-up', label:'Cumplimiento',val:rate+'%',color:rate>=70?'#10b981':rate>=40?'#f59e0b':'#ef4444',bg:'rgba(6,182,212,.1)'}
    ].map((s,i)=>`
    <div class="kpi-card slide-up" style="animation-delay:${i*0.07}s">
      <div style="width:38px;height:38px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin-bottom:10px">
        <i data-lucide="${s.icon}" style="width:19px;height:19px;color:${s.color}"></i>
      </div>
      <p style="font-size:24px;font-weight:800;color:${s.color};line-height:1">${s.val}</p>
      <p style="font-size:13px;color:var(--textm);margin-top:4px">${s.label}</p>
    </div>`).join('')}
  </div>

  <h3 class="font-bold text-lg mb-4">Evidencias Recientes</h3>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    ${myEvidence.length>0?[...myEvidence].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((e,i)=>`
    <div class="card pop-in" style="background:var(--surface);animation-delay:${i*0.05}s">
      <div style="width:100%;height:160px;border-radius:10px;overflow:hidden;margin-bottom:12px;background:rgba(6,182,212,.08);position:relative;cursor:pointer" onclick="if('${e.image}')openImageFullscreen('${e.image}')">
        ${e.image?`<img src="${e.image}" style="width:100%;height:100%;object-fit:cover">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:8px"><i data-lucide="image" style="width:36px;height:36px;color:rgba(6,182,212,.4)"></i><p style="font-size:11px;color:var(--textm)">Sin imagen</p></div>`}
        ${e.image?`<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.75));padding:8px 10px">
          <p style="font-size:10px;color:#fff;font-weight:600">${e.date}${e.time?' · '+e.time:''}</p>
        </div>`:''}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <h4 style="font-weight:700;font-size:13px">${e.group}</h4>
        ${complianceBadge(e)}
      </div>
      <p style="font-size:12px;color:var(--textm)">${e.student}</p>
      <p style="font-size:11px;color:var(--textm);margin-top:2px">${e.date}${e.time?' · '+e.time:''}</p>
      ${renderAttendanceList(e.group, e.date)}
      ${e.reviewed_by&&e.observation?`<div style="margin-top:8px;padding:8px;background:rgba(6,182,212,.07);border-radius:7px;border-left:3px solid var(--accent)">
        <p style="font-size:11px;color:var(--accent);font-weight:600">${e.reviewed_by}:</p>
        <p style="font-size:11px;color:var(--textm);margin-top:2px">${e.observation}</p>
      </div>`:''}
      ${(isStudent()&&e.student===currentSession?.name&&e.status==='Pendiente')||isAdmin()?`
      <button class="pill pill-danger w-full mt-2" style="font-size:12px;padding:6px" onclick="deleteEvidenceFromApp(${e.id},'${e.image||''}')"><i data-lucide="trash-2" style="width:13px;height:13px;display:inline;margin-right:4px"></i>Eliminar</button>`:''}
    </div>`).join(''):`
    <div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--textm);border:2px dashed var(--border);border-radius:12px">
      <i data-lucide="camera" style="width:44px;height:44px;opacity:.35;margin:0 auto 14px;display:block"></i>
      <p class="font-medium">Sin evidencias aún</p>
      <p style="font-size:13px;margin-top:4px">Toma la primera foto de limpieza</p>
    </div>`}
  </div>

  <!-- MODAL CÁMARA (se crea por JS) -->
  <div id="cameraModalWrap"></div>`;
}

// ---- CÁMARA MODAL con sello fecha/hora/día ----
function openCameraModal(){
  const myGrade = getCurrentGrade();
  const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const now     = new Date();
  const stamp   = `${dayNames[now.getDay()]} ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}`;

  // Obtener el grupo del estudiante automáticamente
  const myGroup = D.cleanGroups.find(g=>g.members&&g.members.includes(currentSession?.name));

  // Verificar si ya subió evidencia hoy para este grupo
  const today = now.toISOString().split('T')[0];
  const alreadyUploaded = myGroup && D.evidence.some(e=>
    e.group===myGroup.name &&
    e.student===currentSession?.name &&
    e.date===today
  );

  if(alreadyUploaded){
    alert('Ya subiste una evidencia hoy para este grupo.');
    return;
  }

  const html=`<div class="modal-bg" onclick="if(event.target===this)closeCameraModal()">
    <div class="modal fade-in" style="max-width:500px;max-height:92vh;overflow-y:auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg flex items-center gap-2">
          <i data-lucide="camera" style="width:18px;height:18px;color:var(--accent)"></i>
          Subir Evidencia de Aseo
        </h2>
        <button onclick="closeCameraModal()" class="pill pill-ghost" style="padding:5px">
          <i data-lucide="x" style="width:17px;height:17px"></i>
        </button>
      </div>

      <!-- Info del grupo (solo lectura) -->
      <div class="flex flex-col gap-3 mb-4">
        <div style="padding:10px 14px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:8px">
          <p style="font-size:12px;color:var(--textm);margin-bottom:2px">Grupo asignado</p>
          <p style="font-weight:700;color:var(--accent)">${myGroup?.name||'Sin grupo'} — ${myGroup?.grade||''}</p>
        </div>
        <input id="camGroup" type="hidden" value="${myGroup?.name||''}">
        <input id="camStudent" type="hidden" value="${currentSession?.name||''}">
      </div>

      <!-- Área de cámara/preview -->
      <div style="position:relative;border-radius:12px;overflow:hidden;background:#000;margin-bottom:14px">
        <video id="camVideo" autoplay playsinline style="width:100%;display:block;max-height:300px;object-fit:cover"></video>
        <canvas id="camCanvas" style="display:none;width:100%;max-height:300px;object-fit:cover"></canvas>
        <img id="camPreview" style="display:none;width:100%;max-height:300px;object-fit:cover;border-radius:12px">

        <!-- Sello de fecha/hora superpuesto -->
        <div id="camStamp" style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,.7);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;backdrop-filter:blur(4px)">
          ${stamp}
        </div>
      </div>

      <!-- Botones -->
      <div id="camBtns" class="flex gap-3">
        <button id="btnCapture" class="pill pill-primary w-full flex items-center justify-center gap-2" onclick="capturePhoto()">
          <i data-lucide="camera" style="width:16px;height:16px"></i>Tomar Foto
        </button>
      </div>
      <div id="camRetakeBtns" style="display:none" class="flex gap-3">
        <button class="pill pill-ghost flex-1" onclick="retakePhoto()">
          <i data-lucide="rotate-ccw" style="width:15px;height:15px;display:inline;margin-right:5px"></i>Retomar
        </button>
        <button class="pill pill-primary flex-1" onclick="saveEvidence()">
          <i data-lucide="check" style="width:15px;height:15px;display:inline;margin-right:5px"></i>Guardar Evidencia
        </button>
      </div>

      <p id="camError" style="color:#ef4444;font-size:12px;text-align:center;margin-top:10px;display:none"></p>
    </div>
  </div>`;

  const wrap=document.getElementById('cameraModalWrap');
  wrap.innerHTML=html;
  lucide.createIcons();
  startCamera();
}

let _camStream=null;
let _capturedDataUrl=null;
let _capturedStamp=null;

function startCamera(){
  const video=document.getElementById('camVideo');
  if(!video) return;
  const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const now=new Date();
  _capturedStamp=`${dayNames[now.getDay()]} ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}`;

  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false})
    .then(stream=>{
      _camStream=stream;
      video.srcObject=stream;
    })
    .catch(()=>{
      // Si no hay cámara disponible (desktop), mostrar solo la opción de subir
      video.style.display='none';
      const btnCap=document.getElementById('btnCapture');
      if(btnCap) btnCap.style.display='none';
      const err=document.getElementById('camError');
      if(err){err.textContent='Cámara no disponible en este dispositivo';err.style.display='block';}
    });
}

function capturePhoto(){
  const video  = document.getElementById('camVideo');
  const canvas = document.getElementById('camCanvas');
  const preview= document.getElementById('camPreview');
  if(!video||!canvas) return;

  const now=new Date();
  const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  _capturedStamp=`${dayNames[now.getDay()]} ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}`;

  // Dibujar frame del video en el canvas con sello
  canvas.width=video.videoWidth||640;
  canvas.height=video.videoHeight||480;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(video,0,0,canvas.width,canvas.height);

  // Dibujar sello de fecha/hora/día
  const stamp=_capturedStamp;
  ctx.fillStyle='rgba(0,0,0,.65)';
  ctx.fillRect(10,canvas.height-38,ctx.measureText(stamp).width+20,28);
  ctx.fillStyle='#ffffff';
  ctx.font='bold 14px DM Sans, sans-serif';
  ctx.fillText(stamp,20,canvas.height-18);

  _capturedDataUrl=canvas.toDataURL('image/jpeg',0.85);

  // Mostrar preview
  preview.src=_capturedDataUrl;
  preview.style.display='block';
  video.style.display='none';
  document.getElementById('camBtns').style.display='none';
  document.getElementById('camRetakeBtns').style.display='flex';
  if(_camStream) _camStream.getTracks().forEach(t=>t.stop());
}

function loadFromFile(input){
  const file=input.files[0];
  if(!file) return;
  const now=new Date();
  const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  _capturedStamp=`${dayNames[now.getDay()]} ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}`;

  const reader=new FileReader();
  reader.onload=ev=>{
    // Dibujar imagen + sello en canvas
    const img=new Image();
    img.onload=()=>{
      const canvas=document.getElementById('camCanvas');
      canvas.width=img.width; canvas.height=img.height;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      const stamp=_capturedStamp;
      ctx.fillStyle='rgba(0,0,0,.65)';
      ctx.fillRect(10,canvas.height-38,ctx.measureText(stamp).width+20,28);
      ctx.fillStyle='#ffffff';
      ctx.font='bold 14px DM Sans, sans-serif';
      ctx.fillText(stamp,20,canvas.height-18);
      _capturedDataUrl=canvas.toDataURL('image/jpeg',0.85);

      const preview=document.getElementById('camPreview');
      preview.src=_capturedDataUrl;
      preview.style.display='block';
      document.getElementById('camVideo').style.display='none';
      document.getElementById('camBtns').style.display='none';
      document.getElementById('camRetakeBtns').style.display='flex';
      if(_camStream) _camStream.getTracks().forEach(t=>t.stop());
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function retakePhoto(){
  _capturedDataUrl=null;
  document.getElementById('camPreview').style.display='none';
  document.getElementById('camVideo').style.display='block';
  document.getElementById('camBtns').style.display='flex';
  document.getElementById('camRetakeBtns').style.display='none';
  startCamera();
}

async function saveEvidence(){
  const group  = document.getElementById('camGroup')?.value;
  const student= document.getElementById('camStudent')?.value?.trim();
  const err    = document.getElementById('camError');
  const btn    = document.querySelector('#camRetakeBtns .btn-p');

  if(!group){if(err){err.textContent='Selecciona un grupo';err.style.display='block';}return;}
  if(!student){if(err){err.textContent='Ingresa tu nombre';err.style.display='block';}return;}
  if(!_capturedDataUrl){if(err){err.textContent='Toma o sube una foto primero';err.style.display='block';}return;}

  // Bloquear si hoy es día sin clase (para el grado del usuario o global)
  const todayStrCheck = new Date().toISOString().split('T')[0];
  const userGrade = getCurrentGrade();
  const isNoClassToday = (D.noClassDays||[]).some(x => x.date===todayStrCheck && (!x.grade || x.grade===userGrade));
  if(isNoClassToday){
    if(err){err.textContent='Hoy no hay clases — no se puede subir evidencia';err.style.display='block';}
    return;
  }

  if(btn){btn.textContent='Guardando...';btn.disabled=true;}

  const now=new Date();
  const ev={
    group, student,
    date: now.toISOString().split('T')[0],
    status:'Pendiente',
    compliant:false,
    reviewed_by:null, observation:null, reviewed_at:null
  };

  try {
    // Convertir dataUrl a File para subir al Storage
    const res = await fetch(_capturedDataUrl);
    const blob = await res.blob();
    const file = new File([blob], `evidencia_${Date.now()}.jpg`, {type:'image/jpeg'});

    const ok = await saveEvidenceWithImage(ev, file);
    if(ok){
      closeCameraModal();
      render();
    } else {
      if(err){err.textContent='Error al guardar. Intenta de nuevo.';err.style.display='block';}
      if(btn){btn.textContent='Guardar Evidencia';btn.disabled=false;}
    }
  } catch(e) {
    console.error('Error guardando evidencia:', e);
    if(err){err.textContent='Error al guardar: '+e.message;err.style.display='block';}
    if(btn){btn.textContent='Guardar Evidencia';btn.disabled=false;}
  }
}

function closeCameraModal(){
  if(_camStream) _camStream.getTracks().forEach(t=>t.stop());
  _camStream=null; _capturedDataUrl=null;
  const wrap=document.getElementById('cameraModalWrap');
  if(wrap) wrap.innerHTML='';
}

function rRooms(){
  const rows=filterByGrade(D.rooms);
  return `<div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div><h1 class="text-2xl font-bold">${t('rooms')}</h1></div>
    ${isAdmin()?`<button class="pill pill-primary flex items-center gap-1" onclick="openModal('add','rooms')"><i data-lucide="plus" style="width:15px;height:15px"></i>${t('add')}</button>`:''}
  </div>
  <div class="card overflow-x-auto" style="background:var(--surface);padding:0">
    <table class="tbl">
      <thead><tr><th>Salón</th><th>Capacidad</th><th>Grado</th>${isAdmin()?`<th style="width:100px">${t('actions')}</th>`:''}</tr></thead>
      <tbody>${rows.map(r=>`<tr><td>${r.name}</td><td>${r.capacity}</td><td>${r.grade}</td>
        ${isAdmin()?`<td><div class="flex gap-1">
          <button class="pill pill-ghost" style="padding:5px" onclick="openModal('edit','rooms',${r.id})"><i data-lucide="edit" style="width:14px;height:14px"></i></button>
          <button class="pill pill-danger" style="padding:5px" onclick="del('rooms',${r.id})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div></td>`:''}
      </tr>`).join('')}</tbody>
    </table>
    ${rows.length===0?`<p class="text-center py-8" style="color:var(--textm)">${t('noRecords')}</p>`:''}
  </div>`;
}

/* ============================================================
   TURNOS DE ASEO
   ============================================================ */
function rClean(){
  const myGrade=getCurrentGrade();
  const canCreate=isTeacher();
  const allGroups=(isTeacher()?D.cleanGroups.filter(g=>!myGrade||g.grade===myGrade):D.cleanGroups).filter(g=>g.frequency===assignmentMode);
  const days=['Lunes','Martes','Miércoles','Jueves','Viernes'];
  const byDay={};
  allGroups.filter(g=>g.frequency==='daily').forEach(g=>{if(!byDay[g.day])byDay[g.day]=[];byDay[g.day].push(g);});
  const weekly=allGroups.filter(g=>g.frequency==='weekly');

  return `<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div><h1 class="text-2xl font-bold">${isStudent()?'Mis Turnos de Aseo':t('cleanTitle')}${myGrade?' — '+myGrade:''}</h1>
    <p style="color:var(--textm)" class="text-sm">${assignmentMode==='daily'?t('manageDaily'):t('manageWeekly')}</p></div>
    <div class="flex gap-2 flex-wrap">
      <button class="btn ${assignmentMode==='daily'?'btn-p':'btn-s'} flex items-center gap-1" onclick="changeAssignmentMode('daily')" style="font-size:12px"><i data-lucide="calendar" style="width:14px;height:14px"></i>${t('dailyMode')}</button>
      <button class="btn ${assignmentMode==='weekly'?'btn-p':'btn-s'} flex items-center gap-1" onclick="changeAssignmentMode('weekly')" style="font-size:12px"><i data-lucide="repeat" style="width:14px;height:14px"></i>${t('weeklyMode')}</button>
      ${canCreate?`<button class="pill pill-primary flex items-center gap-1" onclick="openModal('add','cleanGroups')"><i data-lucide="plus" style="width:15px;height:15px"></i>${t('newGroup')}</button>`:''}
    </div>
  </div>
  <div class="grid gap-6">
    ${allGroups.length>0?`<div>
      <h3 class="font-bold text-lg mb-3">${assignmentMode==='daily'?t('dailyGroups'):t('weeklyGroups')}</h3>
      ${assignmentMode==='daily'?`
      <div class="card" style="background:var(--surface)">
        <div class="grid grid-cols-5 gap-2">
          ${days.map(d=>{
            const gfd=byDay[d]||[];
            const hg=gfd.length>0;
            const bg=hg?gfd[0].color:'rgba(6,182,212,.08)';
            const brd=hg?gfd[0].color:'rgba(6,182,212,.2)';
            return `<div style="border-radius:10px;padding:12px;background:${bg}20;border:2px solid ${brd};min-height:140px">
              <p class="font-semibold text-sm mb-3" style="color:${hg?bg:'var(--accent)'}">${d}</p>
              <div class="flex flex-col gap-2">
                ${gfd.map(g=>`<div style="background:${g.color||'#06b6d4'};padding:10px;border-radius:8px;cursor:pointer" onclick="showGroupMembers(${g.id})">
                  <p class="text-xs font-bold text-white">${g.name}</p>
                  <p style="font-size:10px;color:rgba(255,255,255,.8);margin-top:2px">${g.members.length} est.</p>
                  ${canCreate?`<div class="flex gap-1 mt-2" onclick="event.stopPropagation()">
                    <button class="btn" style="flex:1;background:rgba(255,255,255,.2);color:#fff;border:none;padding:4px;font-size:10px;border-radius:4px" onclick="openModal('edit','cleanGroups',${g.id})">${t('edit')}</button>
                    <button class="btn" style="background:rgba(255,0,0,.3);color:#fff;border:none;padding:4px;font-size:10px;border-radius:4px" onclick="del('cleanGroups',${g.id})">✕</button>
                  </div>`:''}
                </div>`).join('')}
                ${gfd.length===0?`<p style="font-size:11px;color:var(--textm)">${t('noGroup')}</p>`:''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`:`
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${weekly.map(g=>`<div class="card" style="background:var(--surface);border-left:4px solid ${g.color||'#06b6d4'};cursor:pointer" onclick="showGroupMembers(${g.id})">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <div style="width:12px;height:12px;border-radius:50%;background:${g.color||'#06b6d4'}"></div>
              <h4 class="font-bold">${g.name}</h4>
            </div>
            ${canCreate?`<div class="flex gap-1">
              <button class="pill pill-ghost" style="padding:5px" onclick="openModal('edit','cleanGroups',${g.id})"><i data-lucide="edit" style="width:14px;height:14px"></i></button>
              <button class="pill pill-danger" style="padding:5px" onclick="del('cleanGroups',${g.id})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>`:''}
          </div>
          <p class="badge mb-3" style="background:${g.color||'#06b6d4'}20;color:${g.color||'#06b6d4'}">Lun – Vie (Toda la semana)</p>
          <p style="font-size:11px;color:var(--textm);margin-bottom:8px">Miembros: ${g.members.length}</p>
          <div class="flex flex-wrap gap-1">
            ${g.members.map(m=>`<span class="badge" style="background:${g.color||'#06b6d4'}20;color:${g.color||'#06b6d4'};font-size:11px">${m}</span>`).join('')}
          </div>
        </div>`).join('')}
      </div>`}
    </div>`:''}
    ${allGroups.length===0?`<div style="text-align:center;padding:60px 20px;background:rgba(6,182,212,.05);border:2px dashed rgba(6,182,212,.2);border-radius:12px">
      <i data-lucide="calendar" style="width:48px;height:48px;color:rgba(6,182,212,.4);margin:0 auto 16px;display:block"></i>
      <h3 class="font-bold text-lg" style="margin-bottom:8px">${t('noGroupsCreated')}</h3>
      <p style="color:var(--textm);margin-bottom:16px">${canCreate?'Crea el primer grupo de aseo para tu grado.':'El docente aún no ha creado grupos de aseo para tu grado.'}</p>
      ${canCreate?`<button class="pill pill-primary flex items-center justify-center gap-2 mx-auto" onclick="openModal('add','cleanGroups')"><i data-lucide="plus" style="width:16px;height:16px"></i>${t('createFirstGroup')}</button>`:''}
    </div>`:''}
    ${allGroups.length>0?`<div class="grid gap-3 sm:grid-cols-3">
      <div class="card" style="background:var(--surface)"><p style="font-size:12px;color:var(--textm)">Total de Grupos</p><p class="text-2xl font-bold" style="color:var(--accent)">${allGroups.length}</p></div>
      <div class="card" style="background:var(--surface)"><p style="font-size:12px;color:var(--textm)">Estudiantes Asignados</p><p class="text-2xl font-bold" style="color:#3b82f6">${allGroups.reduce((a,g)=>a+g.members.length,0)}</p></div>
      <div class="card" style="background:var(--surface)"><p style="font-size:12px;color:var(--textm)">Promedio por Grupo</p><p class="text-2xl font-bold" style="color:#22c55e">${allGroups.length?Math.round(allGroups.reduce((a,g)=>a+g.members.length,0)/allGroups.length):0}</p></div>
    </div>`:''}
  </div>`;
}

/* ============================================================
   EVIDENCIAS — estudiantes suben, docentes ven todas las de su grado
   ============================================================ */
// Grupos que ya pasó su ventana de aseo hoy y no subieron evidencia
function getGroupsMissingEvidence(myGrade){
  const DAYS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const todayName = DAYS_ES[new Date().getDay()];
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHM = now.getHours()*60+now.getMinutes();

  const groups = D.cleanGroups.filter(g=>!myGrade||g.grade===myGrade);
  return groups.filter(g=>{
    const isTurn = g.frequency==='weekly' || (g.frequency==='daily' && g.day===todayName);
    if(!isTurn) return false;
    const sch = (D.schedules||[]).find(s=>s.grade===g.grade);
    const cleanTime = sch?.clean_time?.substring(0,5);
    if(!cleanTime) return false;
    const [nh,nm]=cleanTime.split(':').map(Number);
    const closeHM = nh*60+nm + (sch?.evidence_window_min||30);
    if(currentHM <= closeHM) return false; // aún no cierra
    return !D.evidence.some(e=>e.group===g.name && e.date===todayStr);
  });
}

function rValidation(){
  const myGrade=getCurrentGrade();
  const pending=D.evidence.filter(e=>{
    if(e.status!=='Pendiente')return false;
    const g=D.cleanGroups.find(cg=>cg.name===e.group);
    return !myGrade||!g||g.grade===myGrade;
  });
  const reviewed=D.evidence.filter(e=>{
    if(e.status!=='Completado'&&e.status!=='Rechazado')return false;
    const g=D.cleanGroups.find(cg=>cg.name===e.group);
    return !myGrade||!g||g.grade===myGrade;
  });

  const missingGroups = getGroupsMissingEvidence(myGrade);

  return `<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div><h1 class="text-2xl font-bold">${t('validation')}${myGrade?' — '+myGrade:''}</h1>
    <p style="color:var(--textm)" class="text-sm">Revisión y aprobación de evidencias de aseo</p></div>
  </div>
  ${missingGroups.length>0?`<div class="card mb-4" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);padding:14px">
    <p style="font-size:13px;font-weight:700;color:#ef4444;margin-bottom:4px"><i data-lucide="alert-triangle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>Grupos sin evidencia hoy</p>
    ${missingGroups.map(g=>`<p style="font-size:12px;color:var(--textm)">⏰ ${g.name} (Grado ${g.grade}) — no subió evidencia en la ventana asignada</p>`).join('')}
  </div>`:''}
  <div class="card mb-6" style="background:linear-gradient(135deg,rgba(6,182,212,.15),rgba(6,182,212,.05));border:1px solid rgba(6,182,212,.3);padding:16px">
    <div class="flex items-center gap-3">
      <i data-lucide="shield-check" style="width:20px;height:20px;color:var(--accent)"></i>
      <div><p style="font-size:12px;color:var(--textm)">Acceso Docente</p><p class="font-semibold">${currentSession?.name}</p></div>
    </div>
  </div>
  <div class="grid gap-4 sm:grid-cols-3 mb-6">
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#f59e0b">${pending.length}</p><p style="color:var(--textm);font-size:13px">Por Revisar</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#10b981">${D.evidence.filter(e=>e.status==='Completado'&&e.reviewed_by).length}</p><p style="color:var(--textm);font-size:13px">Aprobadas</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#ef4444">${D.evidence.filter(e=>e.status==='Rechazado').length}</p><p style="color:var(--textm);font-size:13px">Rechazadas</p></div>
  </div>
  <div class="flex gap-2 mb-6 border-b" style="border-color:var(--border)">
    <button class="tab active" onclick="switchValidationTab('pending')">Pendientes (${pending.length})</button>
    <button class="tab" onclick="switchValidationTab('reviewed')">Revisadas (${reviewed.length})</button>
  </div>
  <div id="validationPending" class="validation-tab">
    ${pending.length>0?`<div class="grid gap-4">
      ${pending.map(e=>{
        const group=D.cleanGroups.find(g=>g.name===e.group);
        return `<div class="card" style="background:var(--surface);border-left:4px solid #f59e0b">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <div class="flex items-start justify-between mb-3">
                <div><h3 class="font-bold text-lg">${e.group}</h3><p style="color:var(--textm);font-size:13px">${e.date}</p></div>
                <span class="badge" style="background:#fef3c7;color:#92400e">${e.status}</span>
              </div>
              <div style="width:100%;height:160px;border-radius:8px;overflow:hidden;margin-bottom:12px;background:rgba(6,182,212,.1)">
                ${e.image?`<img src="${e.image}" style="width:100%;height:100%;object-fit:cover">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="image" style="width:40px;height:40px;color:rgba(6,182,212,.4)"></i></div>`}
              </div>
              <div style="background:rgba(6,182,212,.08);padding:10px;border-radius:6px">
                <p style="font-size:11px;color:var(--textm)"><strong>Estudiante:</strong> ${e.student}</p>
                ${group?`<p style="font-size:11px;color:var(--textm);margin-top:4px"><strong>Miembros:</strong> ${group.members.join(', ')}</p>`:''}
                ${renderAttendanceList(e.group, e.date)}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div>
                <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Decisión</label>
                <div class="flex gap-2">
                  <button class="pill pill-ghost flex-1 validation-btn" data-action="approve" data-id="${e.id}" style="background:rgba(16,185,129,.1);color:#10b981;border:2px solid rgba(16,185,129,.3);padding:12px;border-radius:8px;font-weight:600">
                    <i data-lucide="check-circle" style="width:16px;height:16px;margin-right:6px;display:inline"></i>Aprobar
                  </button>
                  <button class="pill pill-ghost flex-1 validation-btn" data-action="reject" data-id="${e.id}" style="background:rgba(239,68,68,.1);color:#ef4444;border:2px solid rgba(239,68,68,.3);padding:12px;border-radius:8px;font-weight:600">
                    <i data-lucide="x-circle" style="width:16px;height:16px;margin-right:6px;display:inline"></i>Rechazar
                  </button>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Observaciones</label>
                <textarea id="obs-${e.id}" class="inp" style="resize:vertical;min-height:100px;padding:10px" placeholder="Anota observaciones de la limpieza..."></textarea>
              </div>
              <div>
                <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Calidad</label>
                <div class="flex gap-2 flex-wrap">
                  ${['Excelente','Buena','Regular','Deficiente'].map(q=>`<button class="quality-btn" data-quality="${q}" data-id="${e.id}" style="padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--textm);font-size:12px;cursor:pointer">${q}</button>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`:`<div style="text-align:center;padding:40px;background:rgba(16,185,129,.05);border-radius:8px;border:1px solid rgba(16,185,129,.2)">
      <i data-lucide="check-circle" style="width:40px;height:40px;color:#10b981;margin:0 auto 12px;display:block"></i>
      <p class="font-medium">¡Todo al día!</p>
      <p style="color:var(--textm);font-size:13px">No hay evidencias pendientes de revisar</p>
    </div>`}
  </div>
  <div id="validationReviewed" class="validation-tab" style="display:none">
    ${reviewed.length>0?`<table class="tbl">
      <thead><tr><th>Fecha</th><th>Grupo</th><th>Estado</th><th>Revisado por</th><th>Observaciones</th><th>Ver</th></tr></thead>
      <tbody>${reviewed.map(e=>`<tr>
        <td><strong>${e.date}</strong></td><td>${e.group}</td>
        <td><span class="badge" style="background:${e.status==='Completado'?'#d1fae5;color:#059669':'#fee2e2;color:#dc2626'}">${e.status}</span></td>
        <td style="font-size:12px;color:var(--textm)">${e.reviewed_by||'—'}</td>
        <td style="font-size:12px;color:var(--textm)">${e.observation?e.observation.substring(0,40)+'...':'—'}</td>
        <td><button class="pill pill-ghost" style="padding:5px" onclick="viewReviewDetail(${e.id})"><i data-lucide="eye" style="width:14px;height:14px"></i></button></td>
      </tr>`).join('')}</tbody>
    </table>`:`<p style="text-align:center;padding:40px;color:var(--textm)">Sin evidencias revisadas aún</p>`}
  </div>`;
}

/* ============================================================
   MIS VALIDACIONES — solo estudiantes (solo lectura)
   ============================================================ */
function rMyValidations(){
  const mine=D.evidence.filter(e=>e.student===currentSession?.name);
  const reviewed=mine.filter(e=>e.status!=='Pendiente');
  return `<div class="mb-6">
    <h1 class="text-2xl font-bold">Mis Validaciones</h1>
    <p style="color:var(--textm)" class="text-sm">Aquí ves lo que el docente respondió sobre tus evidencias</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-3 mb-6">
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold">${mine.length}</p><p style="color:var(--textm);font-size:13px">Total subidas</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#10b981">${mine.filter(e=>e.status==='Completado').length}</p><p style="color:var(--textm);font-size:13px">Aprobadas</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#f59e0b">${mine.filter(e=>e.status==='Pendiente').length}</p><p style="color:var(--textm);font-size:13px">Pendientes</p></div>
  </div>
  ${mine.length>0?`<div class="grid gap-4">
    ${mine.map(e=>`<div class="card" style="background:var(--surface);border-left:4px solid ${e.status==='Completado'?'#10b981':e.status==='Rechazado'?'#ef4444':'#f59e0b'}">
      <div class="flex items-start justify-between mb-3">
        <div><h3 class="font-bold">${e.group}</h3><p style="font-size:12px;color:var(--textm)">${e.date}</p></div>
        <span class="badge" style="background:${e.status==='Completado'?'#d1fae5;color:#059669':e.status==='Rechazado'?'#fee2e2;color:#dc2626':'#fef3c7;color:#92400e'}">${e.status}</span>
      </div>
      ${e.reviewed_by?`<div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px">
        <p style="font-size:12px;color:var(--textm);margin-bottom:4px"><strong>Revisado por:</strong> ${e.reviewed_by}</p>
        ${e.observation?`<p style="font-size:12px;color:var(--text)"><strong>Observación:</strong> ${e.observation}</p>`:''}
        ${e.reviewed_at?`<p style="font-size:11px;color:var(--textm);margin-top:4px">Fecha: ${new Date(e.reviewed_at).toLocaleDateString('es-CO')}</p>`:''}
      </div>`:`<p style="font-size:13px;color:var(--textm);font-style:italic">Pendiente de revisión del docente</p>`}
    </div>`).join('')}
  </div>`:`<div style="text-align:center;padding:40px;color:var(--textm)">
    <i data-lucide="inbox" style="width:40px;height:40px;margin:0 auto 12px;opacity:.5;display:block"></i>
    <p>Aún no has subido evidencias</p>
  </div>`}`;
}

/* ============================================================
   INCIDENTES — docentes ven y gestionan los de su grado
   ============================================================ */
function rIncidents(){
  const myGrade=getCurrentGrade();

  // ── Filtro por grado para admin ──
  if(isAdmin()){
    if(typeof window._incGradeFilter==='undefined') window._incGradeFilter=null;
    const allGrades=[...new Set(D.incidents.map(i=>i.grade).filter(Boolean))].sort();
    var mine = window._incGradeFilter
      ? D.incidents.filter(i=>i.grade===window._incGradeFilter)
      : D.incidents;
  } else {
    var mine=D.incidents.filter(i=>!myGrade||!i.grade||i.grade===myGrade);
  }

  const statuses=['Abierto','En Proceso','Resuelto'];
  const pc={Alta:'#dc2626',Media:'#f59e0b',Baja:'#10b981'};
  const sc={Abierto:'#ef4444','En Proceso':'#f59e0b',Resuelto:'#10b981'};

  let headerHtml = '';
  if(isAdmin()){
    const allGrades=[...new Set(D.incidents.map(i=>i.grade).filter(Boolean))].sort();
    headerHtml = `
    <div style="margin-bottom:20px">
      <h1 class="text-2xl font-bold mb-1"><i data-lucide="alert-circle" style="width:24px;height:24px;display:inline-block;vertical-align:middle;margin-right:8px"></i>Gestión de Incidentes</h1>
      <p style="color:var(--textm);font-size:13px">Aquí puedes ver y gestionar todos los incidentes reportados por los estudiantes. Usa el filtro para ver por grado.</p>
    </div>
    <!-- Filtro por grado -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:12px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">
      <p style="font-size:11px;color:var(--textm);width:100%;margin-bottom:4px">Filtrar por grado:</p>
      <button onclick="window._incGradeFilter=null;render()"
        style="padding:8px 16px;border-radius:10px;border:1.5px solid ${!window._incGradeFilter?'var(--accent)':'var(--border)'};
        background:${!window._incGradeFilter?'rgba(6,182,212,.15)':'transparent'};
        color:${!window._incGradeFilter?'var(--accent)':'var(--textm)'};font-size:13px;font-weight:600;cursor:pointer">
        📋 Todos <span style="background:rgba(6,182,212,.2);padding:1px 8px;border-radius:20px;font-size:11px;margin-left:4px">${D.incidents.length}</span>
      </button>
      ${allGrades.map(g=>{
        const count=D.incidents.filter(i=>i.grade===g).length;
        const isActive=window._incGradeFilter===g;
        return `<button onclick="window._incGradeFilter='${g}';render()"
          style="padding:8px 16px;border-radius:10px;border:1.5px solid ${isActive?'var(--accent)':'var(--border)'};
          background:${isActive?'rgba(6,182,212,.15)':'transparent'};
          color:${isActive?'var(--accent)':'var(--textm)'};font-size:13px;font-weight:600;cursor:pointer">
          ${g} <span style="background:${count>0?'rgba(239,68,68,.2)':'rgba(100,116,139,.15)'};padding:1px 8px;border-radius:20px;font-size:11px;margin-left:4px;color:${count>0?'#ef4444':'var(--textm)'}">${count}</span>
        </button>`;
      }).join('')}
    </div>`;
  } else {
    headerHtml = `<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold">Incidentes del Grado${myGrade?' — '+myGrade:''}</h1>
      <p style="color:var(--textm)" class="text-sm">Incidentes reportados por estudiantes. Revisa, actualiza el estado y haz seguimiento.</p>
    </div>
  </div>
  <div class="card mb-6" style="background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.04));border:1px solid rgba(239,68,68,.25);padding:16px">
    <div class="flex items-center gap-3">
      <i data-lucide="alert-circle" style="width:20px;height:20px;color:#ef4444"></i>
      <div><p style="font-size:12px;color:var(--textm)">Director de Grado</p><p class="font-semibold">${currentSession?.name} · Grado ${myGrade||'—'}</p></div>
    </div>
  </div>`;
  }

  return `${headerHtml}
  <div class="grid gap-4 sm:grid-cols-3 mb-6">
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#ef4444">${mine.filter(i=>i.status==='Abierto').length}</p><p style="color:var(--textm);font-size:13px">Abiertos</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#f59e0b">${mine.filter(i=>i.status==='En Proceso').length}</p><p style="color:var(--textm);font-size:13px">En Proceso</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#10b981">${mine.filter(i=>i.status==='Resuelto').length}</p><p style="color:var(--textm);font-size:13px">Resueltos</p></div>
  </div>
  <!-- Kanban por estado -->
  <div class="grid gap-6 lg:grid-cols-3 mb-6">
    ${statuses.map(status=>{
      const list=mine.filter(i=>i.status===status);
      const color=sc[status];
      return `<div>
        <h3 class="font-bold text-lg mb-3 flex items-center gap-2" style="color:${color}">
          <div style="width:10px;height:10px;border-radius:50%;background:${color}"></div>
          ${status} (${list.length})
        </h3>
        <div class="flex flex-col gap-3">
          ${list.length>0?list.map(inc=>`<div class="card" style="background:var(--surface);border-left:4px solid ${color}">
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-bold text-sm">${inc.type}</h4>
              <div class="flex gap-1">
                <button class="pill pill-ghost" style="padding:4px" onclick="openModal('edit','incidents',${inc.id})"><i data-lucide="edit" style="width:13px;height:13px"></i></button>
                <button class="pill pill-danger" style="padding:4px" onclick="del('incidents',${inc.id})"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button>
              </div>
            </div>
            <span class="badge" style="background:${pc[inc.priority]||'#888'}20;color:${pc[inc.priority]||'#888'};font-size:10px;margin-bottom:8px;display:inline-block">${inc.priority}</span>
            <p style="font-size:12px;color:var(--textm);margin-bottom:6px;line-height:1.4">${inc.description}</p>
            <div style="background:rgba(6,182,212,.06);padding:8px;border-radius:6px">
              <p style="font-size:11px;color:var(--textm)"><i data-lucide="map-pin" style="width:13px;height:13px;display:inline-block;vertical-align:middle"></i> ${inc.location}</p>
              <p style="font-size:11px;color:var(--textm);margin-top:2px"> ${inc.reporter}</p>
              <p style="font-size:11px;color:var(--textm);margin-top:2px"><i data-lucide="calendar" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> ${inc.date}</p>
            </div>
            <button class="pill pill-primary w-full flex items-center justify-center gap-1 mt-3" style="padding:8px;font-size:12px" onclick="openIncidentDetail(${inc.id})">
              <i data-lucide="eye" style="width:13px;height:13px"></i>Ver Detalles
            </button>
          </div>`).join(''):`<div style="text-align:center;padding:20px;color:var(--textm);border:2px dashed var(--border);border-radius:8px"><p style="font-size:12px">Sin incidentes</p></div>`}
        </div>
      </div>`;
    }).join('')}
  </div>
  <!-- Tabla completa -->
  ${mine.length>0?`<div class="card" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border)"><h3 class="font-bold">Historial Completo</h3></div>
    <div style="overflow-x:auto">
      <table class="tbl" style="margin-bottom:0">
        <thead><tr><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Ubicación</th><th>Reportado por</th><th>Fecha</th><th style="width:90px">Acciones</th></tr></thead>
        <tbody>${mine.map(i=>`<tr>
          <td style="font-size:12px;font-weight:600">${i.type}</td>
          <td><span class="badge" style="background:${pc[i.priority]||'#888'}15;color:${pc[i.priority]||'#888'};font-size:10px">${i.priority}</span></td>
          <td><span class="badge" style="background:${sc[i.status]||'#888'}15;color:${sc[i.status]||'#888'};font-size:10px">${i.status}</span></td>
          <td style="font-size:12px">${i.location}</td>
          <td style="font-size:12px;color:var(--textm)">${i.reporter}</td>
          <td style="font-size:12px;color:var(--textm)">${i.date}</td>
          <td><div class="flex gap-1">
            <button class="pill pill-ghost" style="padding:4px" onclick="openModal('edit','incidents',${i.id})"><i data-lucide="edit" style="width:13px;height:13px"></i></button>
            <button class="pill pill-danger" style="padding:4px" onclick="del('incidents',${i.id})"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </div>`:''}`
}

/* ============================================================
   REPORTAR INCIDENTE — solo estudiantes
   ============================================================ */
function rReportIncident(){
  const myIncidents=D.incidents.filter(i=>i.reporter===currentSession?.name);
  const pc={Alta:'#dc2626',Media:'#f59e0b',Baja:'#10b981'};
  const sc={Abierto:'#ef4444','En Proceso':'#f59e0b',Resuelto:'#10b981'};

  return `<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold">Reportar Incidente</h1>
      <p style="color:var(--textm)" class="text-sm">Reporta cualquier problema o daño en el salón al docente</p>
    </div>
    <button class="pill pill-primary flex items-center gap-1" onclick="openModal('add','incidents')">
      <i data-lucide="plus" style="width:15px;height:15px"></i>Nuevo Reporte
    </button>
  </div>
  <div class="grid gap-4 sm:grid-cols-3 mb-6">
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold">${myIncidents.length}</p><p style="color:var(--textm);font-size:13px">Mis Reportes</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#ef4444">${myIncidents.filter(i=>i.status==='Abierto').length}</p><p style="color:var(--textm);font-size:13px">Abiertos</p></div>
    <div class="card" style="background:var(--surface)"><p class="text-2xl font-bold" style="color:#10b981">${myIncidents.filter(i=>i.status==='Resuelto').length}</p><p style="color:var(--textm);font-size:13px">Resueltos</p></div>
  </div>
  <h3 class="font-bold text-lg mb-4">Mis Reportes Anteriores</h3>
  ${myIncidents.length>0?`<div class="grid gap-3 sm:grid-cols-2">
    ${myIncidents.map(i=>`<div class="card" style="background:var(--surface);border-left:4px solid ${sc[i.status]||'#888'}">
      <div class="flex items-start justify-between mb-2">
        <h4 class="font-bold text-sm">${i.type}</h4>
        <span class="badge" style="background:${sc[i.status]||'#888'}15;color:${sc[i.status]||'#888'};font-size:10px">${i.status}</span>
      </div>
      <p style="font-size:12px;color:var(--textm);margin-bottom:6px">${i.description}</p>
      <p style="font-size:11px;color:var(--textm)"><i data-lucide="map-pin" style="width:13px;height:13px;display:inline-block;vertical-align:middle"></i> ${i.location} · <i data-lucide="calendar" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> ${i.date}</p>
      <span class="badge" style="background:${pc[i.priority]||'#888'}15;color:${pc[i.priority]||'#888'};font-size:10px;margin-top:6px;display:inline-block">${i.priority}</span>
      ${i.image?`<img src="${i.image}" onclick="openImageFullscreen('${i.image}')" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-top:8px;cursor:pointer">`:''}

      ${i.notes?`<div style="background:rgba(59,130,246,.08);padding:8px;border-radius:6px;margin-top:8px;border-left:2px solid #3b82f6">
        <p style="font-size:11px;font-weight:600;color:#3b82f6">Respuesta del docente:</p>
        <p style="font-size:12px;color:var(--text);margin-top:2px">${i.notes}</p>
      </div>`:''}
    </div>`).join('')}
  </div>`:`<div style="text-align:center;padding:40px;color:var(--textm);border:2px dashed var(--border);border-radius:12px">
    <i data-lucide="inbox" style="width:40px;height:40px;margin:0 auto 12px;opacity:.5;display:block"></i>
    <p>Aún no has reportado ningún incidente</p>
    <button class="pill pill-primary flex items-center gap-2 mx-auto mt-4" onclick="openModal('add','incidents')">
      <i data-lucide="plus" style="width:15px;height:15px"></i>Crear primer reporte
    </button>
  </div>`}`;


}

/* ============================================================
   REPORTES — solo docentes
   ============================================================ */
function rReports(){
  const myGrade=getCurrentGrade();
  const myEv=D.evidence.filter(e=>{const g=D.cleanGroups.find(cg=>cg.name===e.group);return !myGrade||!g||g.grade===myGrade;});
  const myStudents=filterByGrade(D.students);
  const completed=myEv.filter(e=>e.status==='Completado').length;
  const total=myEv.length;
  const rate=total>0?Math.round((completed/total)*100):0;
  const sStats={};
  myStudents.forEach(s=>{sStats[s.id]={name:s.name,grade:s.grade,total:0,completed:0,pending:0};});
  myEv.forEach(e=>{const st=myStudents.find(s=>s.name===e.student);if(st&&sStats[st.id]){sStats[st.id].total++;if(e.status==='Completado')sStats[st.id].completed++;else if(e.status==='Pendiente')sStats[st.id].pending++;}});
  const sArr=Object.values(sStats).filter(s=>s.name).sort((a,b)=>b.completed-a.completed);
  const history=[...myEv].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);

  return `<div class="mb-6">
    <h1 class="text-2xl font-bold">Reportes${myGrade?' — '+myGrade:''}</h1>
    <p style="color:var(--textm)" class="text-sm">Análisis y métricas del sistema</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
    ${[
      {icon:'users',val:myStudents.length,label:'Estudiantes',color:'#2563eb'},
      {icon:'check-circle',val:completed,label:'Completadas',color:'#10b981'},
      {icon:'trending-up',val:rate+'%',label:'Cumplimiento',color:'#d97706'},
      {icon:'clock',val:total-completed,label:'Pendientes',color:'#ef4444'}
    ].map(s=>`<div class="card" style="background:var(--surface)">
      <div style="width:36px;height:36px;border-radius:10px;background:${s.color}18;display:flex;align-items:center;justify-content:center;margin-bottom:10px"><i data-lucide="${s.icon}" style="width:18px;height:18px;color:${s.color}"></i></div>
      <p class="text-2xl font-bold" style="color:${s.color}">${s.val}</p><p style="color:var(--textm);font-size:13px">${s.label}</p>
    </div>`).join('')}
  </div>
  <div class="flex gap-2 mb-6 border-b overflow-x-auto" style="border-color:var(--border)">
    <button class="tab active" onclick="switchReportTab('students')"><i data-lucide="user-check" style="width:14px;height:14px;display:inline;margin-right:6px"></i>Por Estudiante</button>
    <button class="tab" onclick="switchReportTab('history')"><i data-lucide="history" style="width:14px;height:14px;display:inline;margin-right:6px"></i>Historial</button>
  </div>
  <div id="reportStudents" class="report-tab">
    <div class="card" style="background:var(--surface);padding:0;overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border)"><h3 class="font-bold">Cumplimiento por Estudiante</h3></div>
      <div style="overflow-x:auto">
        <table class="tbl" style="margin-bottom:0">
          <thead><tr style="background:rgba(6,182,212,.05)"><th>Estudiante</th><th>Grado</th><th>Total</th><th>Completadas</th><th>Pendientes</th><th>%</th></tr></thead>
          <tbody>${sArr.length>0?sArr.map(st=>{
            const r=st.total>0?Math.round((st.completed/st.total)*100):0;
            const c=r>=80?'#10b981':r>=50?'#f59e0b':'#ef4444';
            return `<tr>
              <td class="font-medium">${st.name}</td>
              <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent);font-size:11px">${st.grade}</span></td>
              <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${st.total}</span></td>
              <td><span class="badge" style="background:rgba(16,185,129,.15);color:#10b981">${st.completed}</span></td>
              <td><span class="badge" style="background:rgba(239,68,68,.15);color:#ef4444">${st.pending}</span></td>
              <td><div style="display:flex;align-items:center;gap:8px">
                <div style="width:60px;height:6px;border-radius:3px;background:rgba(6,182,212,.1);overflow:hidden"><div style="width:${r}%;height:100%;background:${c}"></div></div>
                <span style="font-size:12px;font-weight:600;color:${c}">${r}%</span>
              </div></td>
            </tr>`;
          }).join(''):`<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--textm)">Sin datos</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  </div>
  <div id="reportHistory" class="report-tab" style="display:none">
    <div class="card" style="background:var(--surface)">
      <h3 class="font-bold text-lg mb-4">Historial (Últimas 20 limpiezas)</h3>
      ${history.length>0?`<div style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>Fecha</th><th>Grupo</th><th>Estudiante</th><th>Estado</th><th>Revisado por</th><th>Obs.</th></tr></thead>
        <tbody>${history.map(h=>{
          const bg=h.status==='Completado'?'#d1fae5;color:#059669':h.status==='Pendiente'?'#fef3c7;color:#92400e':'#fee2e2;color:#dc2626';
          return `<tr><td><strong>${h.date}</strong></td><td>${h.group}</td><td>${h.student}</td>
            <td><span class="badge" style="background:${bg}">${h.status}</span></td>
            <td style="font-size:12px;color:var(--textm)">${h.reviewed_by||'—'}</td>
            <td style="font-size:12px;color:var(--textm)">${h.observation?h.observation.substring(0,30)+'...':'—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`:`<p style="text-align:center;padding:40px;color:var(--textm)">Sin historial</p>`}
    </div>
  </div>`;
}

/* ============================================================
   PERFIL / CONFIGURACIÓN
   ============================================================ */
function rSettings(){
  // D._user se llena en login (app.js). Si por algún motivo no existe aún,
  // usar los datos de currentSession como respaldo (sin valores ficticios).
  if(!D._user) D._user={
    name: currentSession?.name || '—',
    email: currentSession?.email || '—',
    role: isAdmin()?t('roleAdmin'):isTeacher()?t('roleTeacher'):t('roleStudent'),
    department: currentSession?.department || '—',
    phone: currentSession?.phone || '',
    joinDate: currentSession?.created_at || '—',
    avatar: currentSession?.avatar || '👤'
  };
  if(!D._settings) D._settings={
    notifications:true,
    emailAlerts:true,
    darkMode:true,
    language:'es',
    twoFactor:false,
    sessionTimeout:30
  };
  const currentUser=D._user;
  const settings=D._settings;
  
  return `<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div><h1 class="text-2xl font-bold">Perfil y Configuración</h1><p style="color:var(--textm)" class="text-sm">Gestión de cuenta y preferencias</p></div>
  </div>
  
  <!-- Pestañas -->
  <div class="flex gap-2 mb-6 border-b overflow-x-auto" style="border-color:var(--border)">
    <button class="tab active" onclick="switchSettingsTab('profile')">
      <i data-lucide="user" style="width:14px;height:14px;display:inline;margin-right:6px"></i>Mi Perfil
    </button>
    <button class="tab" onclick="switchSettingsTab('about')">
      <i data-lucide="info" style="width:14px;height:14px;display:inline;margin-right:6px"></i>Acerca de
    </button>
  </div>
  
  <!-- TAB 1: MI PERFIL -->
  <div id="settingsProfile" class="settings-tab">
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Card de perfil principal -->
      <div class="lg:col-span-1">
        <div class="card" style="background:linear-gradient(135deg,rgba(6,182,212,.15),rgba(6,182,212,.05));border:1px solid rgba(6,182,212,.3);text-align:center">
          <div style="width:96px;height:96px;border-radius:50%;overflow:hidden;margin:0 auto 12px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;border:3px solid var(--accent)">
            ${(currentSession?.avatar_url||D._profileImage)?`<img id="profileAvatarImg" src="${currentSession?.avatar_url||D._profileImage}" style="width:100%;height:100%;object-fit:cover">`:`<span id="profileAvatarEmoji" style="font-size:48px">${currentUser.avatar}</span>`}
          </div>
          <!-- Botón cambiar foto -->
          <label style="display:inline-block;margin-bottom:12px;cursor:pointer">
            <span class="pill pill-ghost" style="font-size:12px;padding:5px 12px">
              <i data-lucide="camera" style="width:13px;height:13px;display:inline;margin-right:4px"></i>Cambiar foto
            </span>
            <input type="file" id="avatarFileInput" accept="image/*" style="display:none" onchange="updateProfileImage(this)">
          </label>
          <h2 class="font-bold text-xl">${currentUser.name}</h2>
          <p style="color:var(--accent);font-size:13px;font-weight:600;margin:4px 0">${currentUser.role}</p>
          <p style="color:var(--textm);font-size:12px;margin-bottom:12px">${currentUser.department}</p>
          
          <button class="pill pill-primary w-full flex items-center justify-center gap-2 mt-4" onclick="openEditProfileModal()">
            <i data-lucide="edit" style="width:14px;height:14px"></i>Editar Perfil
          </button>
        </div>
      </div>
      
      <!-- Información detallada -->
      <div class="lg:col-span-2">
        <div class="card" style="background:var(--surface)">
          <h3 class="font-bold text-lg mb-6">Información Personal</h3>
          
          <div class="grid gap-6 sm:grid-cols-2">
            <!-- Nombre -->
            <div>
              <p style="font-size:12px;color:var(--textm);margin-bottom:6px">NOMBRE COMPLETO</p>
              <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
                <p class="font-medium">${currentUser.name}</p>
              </div>
            </div>
            
            <!-- Email -->
            <div>
              <p style="font-size:12px;color:var(--textm);margin-bottom:6px">EMAIL</p>
              <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
                <p class="font-medium" style="word-break:break-all">${currentUser.email}</p>
              </div>
            </div>
            
            <!-- Rol -->
            <div>
              <p style="font-size:12px;color:var(--textm);margin-bottom:6px">ROL EN EL SISTEMA</p>
              <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
                <p class="font-medium">${currentUser.role}</p>
              </div>
            </div>
            
            <!-- Miembro desde -->
            <div>
              <p style="font-size:12px;color:var(--textm);margin-bottom:6px">MIEMBRO DESDE</p>
              <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
                <p class="font-medium">${currentUser.joinDate?new Date(currentUser.joinDate).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'}):'—'}</p>
              </div>
            </div>
            
            <!-- Días en la plataforma -->
            <div>
              <p style="font-size:12px;color:var(--textm);margin-bottom:6px">DÍAS EN CLEANCLASS</p>
              <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
                <p class="font-medium" style="color:var(--accent)">${(()=>{const d=currentSession?.created_at||currentUser.joinDate;if(!d)return '—';const days=Math.floor((new Date()-new Date(d))/(1000*60*60*24));return days===0?'¡Hoy te uniste!':days+' días';})()}</p>
              </div>
            </div>
            
            <!-- Edad -->
            <div>
              <p style="font-size:12px;color:var(--textm);margin-bottom:6px">EDAD</p>
              <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
                <p class="font-medium">${(()=>{const bd=currentSession?.birth_date;if(!bd)return '—';const p=bd.split('/');if(p.length!==3)return '—';const birth=new Date(p[2],p[1]-1,p[0]);const now=new Date();let age=now.getFullYear()-birth.getFullYear();const m=now.getMonth()-birth.getMonth();if(m<0||(m===0&&now.getDate()<birth.getDate()))age--;return age+' años';})()}</p>
              </div>
            </div>
          </div>
          
          <!-- Sección de Estado -->
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border)">
            <h4 class="font-bold text-sm mb-4" style="color:var(--textm)">ESTADO DE LA CUENTA</h4>
            <div class="flex flex-wrap gap-3">
              <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(16,185,129,.1);border-radius:6px;border:1px solid rgba(16,185,129,.2)">
                <i data-lucide="check-circle" style="width:18px;height:18px;color:#10b981"></i>
                <span style="font-size:12px;font-weight:600;color:#10b981">Cuenta Activa</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(59,130,246,.1);border-radius:6px;border:1px solid rgba(59,130,246,.2)">
                <i data-lucide="shield-check" style="width:18px;height:18px;color:#3b82f6"></i>
                <span style="font-size:12px;font-weight:600;color:#3b82f6">Verificado</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,.1);border-radius:6px;border:1px solid rgba(34,197,94,.2)">
                <i data-lucide="lock" style="width:18px;height:18px;color:#22c55e"></i>
                <span style="font-size:12px;font-weight:600;color:#22c55e">Protegida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div id="settingsAbout" class="settings-tab" style="display:none">
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Información del sistema -->
      <div class="card" style="background:linear-gradient(135deg,rgba(6,182,212,.15),rgba(6,182,212,.05));border:1px solid rgba(6,182,212,.3)">
        <div style="text-align:center;margin-bottom:20px">
        <div style="display:flex;justify-content:center;margin-bottom:12px;">
          <div style="width:80px;height:80px;border-radius:20px;background:var(--accent);display:flex;align-items:center;justify-content:center">
            <i data-lucide="graduation-cap" style="width:44px;height:44px;color:#1e293b"></i>
          </div>
        </div>
          <h2 class="font-bold text-2xl mb-2">CleanClass</h2>
          <p style="color:var(--accent);font-weight:600">Sistema de Gestión de Aseo Escolar</p>
        </div>
        
        <div style="background:rgba(6,182,212,.05);padding:20px;border-radius:12px;text-align:center">
          <p style="font-size:12px;color:var(--textm);line-height:1.6">
            Una solución integral para gestionar turnos de aseo, registrar evidencias y validar el cumplimiento en instituciones educativas.
          </p>
        </div>
      </div>
      
      <!-- Detalles técnicos -->
      <div class="card" style="background:var(--surface)">
        <h3 class="font-bold text-lg mb-4">Información del Sistema</h3>
        
        <div class="flex flex-col gap-3">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--textm);font-size:12px">Versión</span>
            <span class="font-medium">v1.0.0</span>
          </div>
          
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--textm);font-size:12px">Última Actualización</span>
            <span class="font-medium">15 de Enero, 2025</span>
          </div>
          
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--textm);font-size:12px">Estado del Sistema</span>
            <span class="font-medium" style="color:#10b981">Operativo</span>
          </div>
          
          <div style="display:flex;justify-content:space-between;padding:8px 0">
            <span style="color:var(--textm);font-size:12px">Usuarios Activos</span>
            <span class="font-medium">1</span>
          </div>
        </div>
      </div>
      
      <!-- Características -->
      <div class="card" style="background:var(--surface);lg:col-span-2">
        <h3 class="font-bold text-lg mb-4">Características Principales</h3>
        
        <div class="grid gap-3 sm:grid-cols-2">
          <div style="display:flex;gap:10px">
            <i data-lucide="users" style="width:18px;height:18px;color:var(--accent);flex-shrink:0"></i>
            <div>
              <p class="font-medium text-sm">Gestión de Usuarios</p>
              <p style="font-size:11px;color:var(--textm)">Estudiantes, docentes y administrativos</p>
            </div>
          </div>
          
          <div style="display:flex;gap:10px">
            <i data-lucide="sparkles" style="width:18px;height:18px;color:var(--accent);flex-shrink:0"></i>
            <div>
              <p class="font-medium text-sm">Turnos de Aseo</p>
              <p style="font-size:11px;color:var(--textm)">Programación semanal flexible</p>
            </div>
          </div>
          
          <div style="display:flex;gap:10px">
            <i data-lucide="camera" style="width:18px;height:18px;color:var(--accent);flex-shrink:0"></i>
            <div>
              <p class="font-medium text-sm">Evidencias Fotográficas</p>
              <p style="font-size:11px;color:var(--textm)">Validación con imágenes</p>
            </div>
          </div>
          
          <div style="display:flex;gap:10px">
            <i data-lucide="check-square" style="width:18px;height:18px;color:var(--accent);flex-shrink:0"></i>
            <div>
              <p class="font-medium text-sm">Validación de Aseos</p>
              <p style="font-size:11px;color:var(--textm)">Aprobación por profesores</p>
            </div>
          </div>
          
          <div style="display:flex;gap:10px">
            <i data-lucide="alert-circle" style="width:18px;height:18px;color:var(--accent);flex-shrink:0"></i>
            <div>
              <p class="font-medium text-sm">Reporte de Incidentes</p>
              <p style="font-size:11px;color:var(--textm)">Seguimiento y resolución</p>
            </div>
          </div>
          
          <div style="display:flex;gap:10px">
            <i data-lucide="bar-chart-2" style="width:18px;height:18px;color:var(--accent);flex-shrink:0"></i>
            <div>
              <p class="font-medium text-sm">Reportes Analíticos</p>
              <p style="font-size:11px;color:var(--textm)">Métricas y estadísticas</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Soporte -->
      <div class="card" style="background:var(--surface);lg:col-span-2">
        <h3 class="font-bold text-lg mb-4">Soporte y Contacto</h3>
        
        <div class="grid gap-4 sm:grid-cols-3">
          <div style="text-align:center">
            <i data-lucide="mail" style="width:32px;height:32px;color:var(--accent);margin:0 auto 12px"></i>
            <p class="font-medium text-sm">Email de Soporte</p>
            <p style="font-size:12px;color:var(--textm);margin-top:4px">soporte@cleanclass.edu</p>
          </div>
          
          <div style="text-align:center">
            <i data-lucide="phone" style="width:32px;height:32px;color:var(--accent);margin:0 auto 12px"></i>
            <p class="font-medium text-sm">Teléfono</p>
            <p style="font-size:12px;color:var(--textm);margin-top:4px">+57 (1) 234 5678</p>
          </div>
          
          <div style="text-align:center">
            <i data-lucide="globe" style="width:32px;height:32px;color:var(--accent);margin:0 auto 12px"></i>
            <p class="font-medium text-sm">Sitio Web</p>
            <p style="font-size:12px;color:var(--textm);margin-top:4px">www.cleanclass.edu</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}


// ---- VER IMAGEN EN PANTALLA COMPLETA ----

// ============================================================
// EXCEL SEMANAL — exportWeeklyExcel + updateExcelWeekPreview
// Usa SheetJS (xlsx) cargado desde CDN en index.html
// ============================================================

function _getWeekDates(mondayStr){
  const mon = new Date(mondayStr + 'T00:00:00');
  const days = [];
  for(let i=0;i<5;i++){
    const d = new Date(mon);
    d.setDate(mon.getDate()+i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days; // [lun, mar, mie, jue, vie]
}

function updateExcelWeekPreview(){
  const input = document.getElementById('excelWeekStart');
  if(!input || !input.value) return;
  const days = _getWeekDates(input.value);
  const fri = new Date(days[4]);

  // Label de semana
  const labelEl = document.getElementById('excelWeekLabel');
  if(labelEl){
    const opts = {day:'2-digit', month:'short'};
    const from = new Date(days[0]).toLocaleDateString('es-CO', opts);
    const to   = fri.toLocaleDateString('es-CO', opts);
    labelEl.textContent = `${from} — ${to}`;
  }

  // KPIs de preview
  const kpisEl = document.getElementById('excelPreviewKpis');
  if(!kpisEl) return;

  const weekEv  = D.evidence.filter(e => days.includes(e.date));
  const weekInc = D.incidents.filter(i => days.includes(i.date));
  const weekCk  = (D.checkins||[]).filter(c => days.includes(c.date));
  const approved = weekEv.filter(e => e.status==='Completado').length;
  const rate = weekEv.length ? Math.round((approved/weekEv.length)*100) : 0;

  const kpis = [
    {icon:'camera',       label:'Evidencias',  val:weekEv.length,  color:'#7c3aed', bg:'rgba(124,58,237,.1)'},
    {icon:'check-circle', label:'Aprobadas',   val:approved,       color:'#10b981', bg:'rgba(16,185,129,.1)'},
    {icon:'map-pin',      label:'Check-ins',   val:weekCk.length,  color:'#2563eb', bg:'rgba(37,99,235,.1)'},
    {icon:'alert-circle', label:'Incidentes',  val:weekInc.length, color:'#ef4444', bg:'rgba(239,68,68,.1)'},
  ];

  kpisEl.innerHTML = kpis.map(s=>`
    <div class="kpi-card" style="padding:14px">
      <div style="width:36px;height:36px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin-bottom:8px">
        <i data-lucide="${s.icon}" style="width:18px;height:18px;color:${s.color}"></i>
      </div>
      <p style="font-size:22px;font-weight:800;color:${s.color};line-height:1">${s.val}</p>
      <p style="font-size:12px;color:var(--textm);margin-top:4px">${s.label}</p>
    </div>`).join('');
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

async function exportWeeklyExcel(){
  const input = document.getElementById('excelWeekStart');
  const msg   = document.getElementById('excelMsg');
  const btn   = document.querySelector('[onclick="exportWeeklyExcel()"]');

  if(!input || !input.value){
    if(msg){msg.textContent='Selecciona una semana primero.';msg.style.display='block';msg.style.color='#ef4444';}
    return;
  }

  // Verificar SheetJS disponible
  if(typeof XLSX === 'undefined'){
    if(msg){msg.textContent='Error: librería Excel no disponible. Recarga la página.';msg.style.display='block';msg.style.color='#ef4444';}
    return;
  }

  if(btn){btn.disabled=true;btn.innerHTML='<i data-lucide="loader" style="width:16px;height:16px;animation:spin 1s linear infinite"></i> Generando...';}
  if(msg){msg.style.display='none';}

  try {
    const days  = _getWeekDates(input.value);
    const DAYS_LABELS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
    const allGrades = [...new Set([...D.students.map(s=>s.grade),...D.rooms.map(r=>r.grade)])].filter(Boolean).sort();

    const weekEv  = D.evidence.filter(e => days.includes(e.date));
    const weekInc = D.incidents.filter(i => days.includes(i.date));
    const weekCk  = (D.checkins||[]).filter(c => days.includes(c.date));

    const approved  = weekEv.filter(e=>e.status==='Completado').length;
    const rejected  = weekEv.filter(e=>e.status==='Rechazado').length;
    const pending   = weekEv.filter(e=>e.status==='Pendiente').length;
    const rate      = weekEv.length ? Math.round((approved/weekEv.length)*100) : 0;

    const weekLabel = (() => {
      const opts={day:'2-digit',month:'short'};
      return new Date(days[0]).toLocaleDateString('es-CO',opts)+' — '+new Date(days[4]).toLocaleDateString('es-CO',opts);
    })();

    const wb = XLSX.utils.book_new();

    // ──────────────────────────────────────────
    // HOJA 1: RESUMEN
    // ──────────────────────────────────────────
    const resumenRows = [
      ['REPORTE SEMANAL — CleanClass'],
      ['Semana:', weekLabel],
      ['Generado:', new Date().toLocaleString('es-CO')],
      [],
      ['INDICADORES GENERALES'],
      ['Métrica', 'Valor'],
      ['Total evidencias semana', weekEv.length],
      ['Evidencias aprobadas', approved],
      ['Evidencias rechazadas', rejected],
      ['Evidencias pendientes', pending],
      ['Tasa de cumplimiento (%)', rate],
      ['Total check-ins GPS', weekCk.length],
      ['Total incidentes', weekInc.length],
      ['Incidentes abiertos', weekInc.filter(i=>i.status==='Abierto').length],
      [],
      ['CUMPLIMIENTO POR GRADO'],
      ['Grado', 'Grupos activos', 'Evidencias', 'Aprobadas', 'Rechazadas', 'Pendientes', 'Cumplimiento (%)'],
      ...allGrades.map(grade => {
        const gradeEv = weekEv.filter(e=>{const g=D.cleanGroups.find(cg=>cg.name===e.group);return g&&g.grade===grade;});
        const gradeGroups = D.cleanGroups.filter(g=>g.grade===grade).length;
        const ga = gradeEv.filter(e=>e.status==='Completado').length;
        const gr = gradeEv.filter(e=>e.status==='Rechazado').length;
        const gp = gradeEv.filter(e=>e.status==='Pendiente').length;
        const gr2 = gradeEv.length ? Math.round((ga/gradeEv.length)*100) : 0;
        return [grade, gradeGroups, gradeEv.length, ga, gr, gp, gr2];
      }),
      [],
      ['TOP 10 — ESTUDIANTES CON MÁS FALTAS EN LA SEMANA'],
      ['Estudiante', 'Grado', 'Faltas de asistencia'],
      ...(() => {
        const absences = {};
        D.cleanGroups.forEach(g => {
          (g.members||[]).forEach(name => {
            const checkedIn = days.filter(d => weekCk.some(c=>c.student===name&&c.date===d)).length;
            const dutyDays  = days.filter(d => {
              const DAYS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
              const dow = new Date(d+'T00:00:00').getDay();
              const dname = DAYS_ES[dow];
              return g.frequency==='weekly' || (g.frequency==='daily' && g.day===dname);
            }).length;
            if(dutyDays > 0){
              if(!absences[name]) absences[name] = {name, grade:g.grade, faltas:0};
              absences[name].faltas += Math.max(0, dutyDays - checkedIn);
            }
          });
        });
        return Object.values(absences)
          .filter(a=>a.faltas>0)
          .sort((a,b)=>b.faltas-a.faltas)
          .slice(0,10)
          .map(a=>[a.name, a.grade, a.faltas]);
      })()
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(resumenRows);
    ws1['!cols'] = [{wch:32},{wch:18},{wch:16},{wch:16},{wch:16},{wch:16},{wch:20}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

    // ──────────────────────────────────────────
    // HOJA 2: ASISTENCIA (check-in GPS)
    // ──────────────────────────────────────────
    const asistenciaRows = [
      ['ASISTENCIA GPS — Semana: '+weekLabel],
      [],
      ['Estudiante', 'Grado', 'Grupo', ...DAYS_LABELS, 'Total Asistencias', 'Total Posibles', 'Asistencia (%)']
    ];

    const studentGroups = {};
    D.cleanGroups.forEach(g => {
      (g.members||[]).forEach(name => {
        if(!studentGroups[name]) studentGroups[name] = {grade:g.grade, group:g.name, freq:g.frequency, day:g.day};
      });
    });

    D.students.forEach(s => {
      const sg = studentGroups[s.name];
      const DAYS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const dayChecks = days.map(d => {
        const checked = weekCk.some(c=>c.student===s.name&&c.date===d);
        return checked ? '✓' : '';
      });
      const totalAsist = dayChecks.filter(v=>v==='✓').length;
      const totalPosibles = sg ? days.filter(d=>{
        const dow = new Date(d+'T00:00:00').getDay();
        const dname = DAYS_ES[dow];
        return sg.freq==='weekly' || (sg.freq==='daily' && sg.day===dname);
      }).length : 0;
      const pct = totalPosibles ? Math.round((totalAsist/totalPosibles)*100) : '';
      asistenciaRows.push([
        s.name, s.grade,
        sg ? sg.group : 'Sin grupo',
        ...dayChecks,
        totalAsist, totalPosibles, pct===''?'—':pct+'%'
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(asistenciaRows);
    ws2['!cols'] = [{wch:28},{wch:12},{wch:20},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:18},{wch:16},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Asistencia');

    // ──────────────────────────────────────────
    // HOJA 3: EVIDENCIAS
    // ──────────────────────────────────────────
    const evidenciasRows = [
      ['EVIDENCIAS DE ASEO — Semana: '+weekLabel],
      [],
      ['Fecha', 'Día', 'Grupo', 'Grado', 'Subida por', 'Estado', 'Revisado por', 'Observaciones']
    ];
    const DAYS_ES_EV=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    [...weekEv].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e => {
      const group = D.cleanGroups.find(g=>g.name===e.group);
      const dow = new Date(e.date+'T00:00:00').getDay();
      evidenciasRows.push([
        e.date,
        DAYS_ES_EV[dow],
        e.group,
        group?.grade || '—',
        e.student,
        e.status,
        e.reviewed_by || '—',
        e.observation || '—'
      ]);
    });
    if(weekEv.length === 0) evidenciasRows.push(['Sin evidencias en esta semana']);

    const ws3 = XLSX.utils.aoa_to_sheet(evidenciasRows);
    ws3['!cols'] = [{wch:14},{wch:12},{wch:22},{wch:12},{wch:24},{wch:14},{wch:22},{wch:40}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Evidencias');

    // ──────────────────────────────────────────
    // HOJA 4: INCIDENTES
    // ──────────────────────────────────────────
    const incidentesRows = [
      ['INCIDENTES — Semana: '+weekLabel],
      [],
      ['Fecha', 'Tipo', 'Grado', 'Prioridad', 'Estado', 'Ubicación', 'Reportado por', 'Descripción', 'Asignado a', 'Notas']
    ];
    [...weekInc].sort((a,b)=>a.date.localeCompare(b.date)).forEach(i => {
      incidentesRows.push([
        i.date, i.type, i.grade||'—', i.priority, i.status,
        i.location, i.reporter, i.description,
        i.assigned_to||'—', i.notes||'—'
      ]);
    });
    if(weekInc.length === 0) incidentesRows.push(['Sin incidentes en esta semana']);

    const ws4 = XLSX.utils.aoa_to_sheet(incidentesRows);
    ws4['!cols'] = [{wch:14},{wch:20},{wch:12},{wch:12},{wch:14},{wch:22},{wch:22},{wch:40},{wch:22},{wch:30}];
    XLSX.utils.book_append_sheet(wb, ws4, 'Incidentes');

    // ──────────────────────────────────────────
    // DESCARGAR
    // ──────────────────────────────────────────
    const fileName = `CleanClass_Semana_${input.value}.xlsx`;
    XLSX.writeFile(wb, fileName);

    if(msg){
      msg.textContent = `✅ Archivo "${fileName}" descargado correctamente.`;
      msg.style.display='block';
      msg.style.color='#10b981';
    }

  } catch(err) {
    console.error('Error exportando Excel:', err);
    if(msg){
      msg.textContent = '⚠ Error al generar el archivo: '+err.message;
      msg.style.display='block';
      msg.style.color='#ef4444';
    }
  } finally {
    if(btn){
      btn.disabled=false;
      btn.innerHTML='<i data-lucide="download" style="width:18px;height:18px"></i> Descargar Excel';
      if(typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}

function openImageFullscreen(url){
  if(!url) return;
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  d.onclick = () => d.remove();
  d.innerHTML = `<img src="${url}" style="max-width:95vw;max-height:95vh;object-fit:contain;border-radius:8px">
    <button style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.2);border:none;border-radius:50%;width:36px;height:36px;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center" onclick="this.parentElement.remove()">×</button>`;
  document.body.appendChild(d);
}

// ---- BORRAR EVIDENCIA DESDE LA APP ----
async function deleteEvidenceFromApp(id, imageUrl){
  if(!confirm('¿Seguro que quieres eliminar esta evidencia?')) return;
  if(imageUrl) await deleteEvidenceImage(imageUrl);
  const { error } = await sb.from('evidence').delete().eq('id', Number(id));
  if(error){ console.error('Error borrando evidencia:', error.message); return; }
  await loadEvidence();
  render();
}

// ---- VER INTEGRANTES DEL GRUPO ----
function showGroupMembers(groupId){
  const g = D.cleanGroups.find(x=>x.id===groupId);
  if(!g) return;
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  d.onclick = (e) => { if(e.target===d) d.remove(); };
  d.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:360px;max-height:80vh;overflow-y:auto;border:1px solid rgba(6,182,212,.2)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:12px;height:12px;border-radius:50%;background:${g.color||'#06b6d4'}"></div>
          <h3 style="font-weight:700;font-size:16px">${g.name}</h3>
        </div>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background:transparent;border:none;color:var(--textm);font-size:20px;cursor:pointer">×</button>
      </div>
      <p style="font-size:12px;color:var(--textm);margin-bottom:12px">${g.grade} · ${g.members.length} integrantes</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${g.members.map(m=>{
          const student = D.students.find(s=>s.name===m);
          const profile = student ? D.usersProfiles?.find(u=>u.email===student.email) : null;
          const av = profile?.avatar_url;
          return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(6,182,212,.05);border-radius:8px;border:1px solid rgba(6,182,212,.1)">
            <div style="width:32px;height:32px;border-radius:50%;background:${g.color||'#06b6d4'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden">${av?`<img src="${av}" style="width:100%;height:100%;object-fit:cover">`:m.charAt(0)}</div>
            <span style="font-size:13px;font-weight:500">${m}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  document.body.appendChild(d);
}

// ---- FOTO INCIDENTE ----
let _incidentPhotoFile = null;

function previewIncidentPhoto(input){
  const file = input.files[0];
  if(!file) return;
  _incidentPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('incidentPhotoPreview');
    if(preview){
      preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">
        <div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.6);border-radius:6px;padding:4px 8px;font-size:11px;color:#fff;cursor:pointer" onclick="document.getElementById('incidentCamInput').click()">Cambiar</div>`;
      preview.style.position = 'relative';
      preview.style.border = 'none';
      preview.onclick = null;
    }
  };
  reader.readAsDataURL(file);
}

// ---- DÍAS SIN CLASE ----
async function toggleNoClassDay(dateStr, isNoClass) {
  if(isNoClass) {
    await sb.from('no_class_days').delete().eq('date', dateStr);
  } else {
    await sb.from('no_class_days').insert({date: dateStr, created_by: currentSession?.name});
  }
  await loadNoClassDays();
  render();
}

// ---- MODAL SALIDA TEMPRANA ----
function showEarlyExitModal() {
  const grades = [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))].sort();
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  d.onclick = e => { if(e.target===d) d.remove(); };
  d.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:400px;border:1px solid rgba(6,182,212,.2)">
      <h3 style="font-weight:700;font-size:16px;margin-bottom:16px"><i data-lucide="door-open" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Agregar Salida Temprana</h3>
      
      <div style="margin-bottom:12px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">¿Para quién?</label>
        <select id="earlyScope" class="inp" onchange="updateEarlyGradeList()">
          <option value="all">Todos los grados</option>
          <option value="some">Algunos grados</option>
          <option value="one">Un grado específico</option>
        </select>
      </div>

      <div id="earlyGradeList" style="display:none;margin-bottom:12px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Selecciona grados</label>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;padding:8px;background:rgba(6,182,212,.05);border-radius:8px;border:1px solid rgba(6,182,212,.15)">
          ${grades.map(g=>`
          <label style="display:flex;align-items:center;gap:8px;padding:6px;cursor:pointer">
            <input type="checkbox" class="earlyGradeCheck" value="${g}">
            <span style="font-size:13px">Grado ${g}</span>
          </label>`).join('')}
        </div>
      </div>

      <div id="earlyOneGrade" style="display:none;margin-bottom:12px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Selecciona el grado</label>
        <select id="earlyOneSelect" class="inp">
          ${grades.map(g=>`<option value="${g}">Grado ${g}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:12px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Hora de salida temprana</label>
        <input type="time" id="earlyTime" class="inp" value="12:00">
      </div>

      <div style="margin-bottom:16px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Fecha de la salida temprana</label>
        <input type="date" id="earlyDate" class="inp" value="${new Date().toISOString().split('T')[0]}">
        <p style="font-size:11px;color:var(--textm);margin-top:4px">Se borrará automáticamente al día siguiente.</p>
      </div>

      <div style="display:flex;gap:8px">
        <button class="pill pill-ghost flex-1" onclick="this.closest('[style*=fixed]').remove()">Cancelar</button>
        <button class="pill pill-primary flex-1" onclick="saveEarlyExit()">Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(d);
}

function updateEarlyGradeList() {
  const scope = document.getElementById('earlyScope')?.value;
  document.getElementById('earlyGradeList').style.display = scope==='some' ? 'block' : 'none';
  document.getElementById('earlyOneGrade').style.display = scope==='one' ? 'block' : 'none';
}

async function saveEarlyExit() {
  const scope = document.getElementById('earlyScope')?.value;
  const time = document.getElementById('earlyTime')?.value;
  const earlyDate = document.getElementById('earlyDate')?.value || new Date().toISOString().split('T')[0];
  if(!time) return alert('Selecciona una hora');

  let gradesToSave = [];
  if(scope==='all') {
    gradesToSave = [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))];
  } else if(scope==='some') {
    gradesToSave = [...document.querySelectorAll('.earlyGradeCheck:checked')].map(c=>c.value);
  } else {
    gradesToSave = [document.getElementById('earlyOneSelect')?.value];
  }
  if(!gradesToSave.filter(Boolean).length) return alert('Selecciona al menos un grado');

  for(const grade of gradesToSave) {
    if(!grade) continue;
    const existing = D.schedules?.find(s=>s.grade===grade);
    const payload = { early_exit_time: time, early_exit_date: earlyDate };
    if(existing?.id) {
      const { error } = await sb.from('schedules').update(payload).eq('id', existing.id);
      if(error) console.error('Error update:', error.message);
    } else {
      const { error } = await sb.from('schedules').insert({ grade, clean_time: '15:00', ...payload });
      if(error) console.error('Error insert:', error.message);
    }
  }
  await loadSchedules();
  document.querySelector('[style*=fixed]')?.remove();
  render();
  // Reprogramar notificación con nueva hora
  if(typeof scheduleLocalNotification === 'function') scheduleLocalNotification();
}

async function removeEarlyExit(grade) {
  const existing = D.schedules?.find(s=>s.grade===grade);
  if(!existing?.id) return;
  const { error } = await sb.from('schedules').update({ early_exit_time: null, early_exit_date: null }).eq('id', existing.id);
  if(error) console.error('Error remove early exit:', error.message);
  await loadSchedules();
  render();
}

// ---- MARCAR DÍAS SIN CLASE ----
function markNoClassModal(scope) {
  const grades = [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))].sort();
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  d.onclick = e => { if(e.target===d) d.remove(); };
  d.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;padding:24px;width:100%;max-width:400px;border:1px solid rgba(6,182,212,.2)">
      <h3 style="font-weight:700;font-size:16px;margin-bottom:16px"><i data-lucide="calendar" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Marcar Día Sin Clase</h3>
      
      <div style="margin-bottom:12px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Fecha</label>
        <input type="date" id="noClassDate" class="inp" value="${new Date().toISOString().split('T')[0]}">
      </div>

      ${scope==='all'?'<p style="font-size:13px;color:var(--textm);margin-bottom:16px">Se marcará para <strong>todos los grados</strong>.</p>':''}
      
      ${scope==='some'?`<div style="margin-bottom:16px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Selecciona grados</label>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;padding:8px;background:rgba(6,182,212,.05);border-radius:8px;border:1px solid rgba(6,182,212,.15)">
          ${grades.map(g=>`
          <label style="display:flex;align-items:center;gap:8px;padding:6px;cursor:pointer">
            <input type="checkbox" class="noClassGradeCheck" value="${g}">
            <span style="font-size:13px">Grado ${g}</span>
          </label>`).join('')}
        </div>
      </div>`:''}

      ${scope==='one'?`<div style="margin-bottom:16px">
        <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">Selecciona el grado</label>
        <select id="noClassOneSelect" class="inp">
          ${grades.map(g=>`<option value="${g}">Grado ${g}</option>`).join('')}
        </select>
      </div>`:''}

      <div style="display:flex;gap:8px">
        <button class="pill pill-ghost flex-1" onclick="this.closest('[style*=fixed]').remove()">Cancelar</button>
        <button class="pill pill-primary flex-1" onclick="saveNoClassDay('${scope}')">Marcar</button>
      </div>
    </div>`;
  document.body.appendChild(d);
}

async function saveNoClassDay(scope) {
  const date = document.getElementById('noClassDate')?.value;
  if(!date) return alert('Selecciona una fecha');
  const grades = [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))];
  let selectedGrades = [];
  if(scope==='all') selectedGrades = grades;
  else if(scope==='some') selectedGrades = [...document.querySelectorAll('.noClassGradeCheck:checked')].map(c=>c.value);
  else selectedGrades = [document.getElementById('noClassOneSelect')?.value];
  if(!selectedGrades.length) return alert('Selecciona al menos un grado');

  for(const grade of selectedGrades) {
    const existing = (D.noClassDays||[]).find(x=>x.date===date&&x.grade===grade);
    if(!existing) await sb.from('no_class_days').insert({date, grade, created_by: currentSession?.name});
  }
  await loadNoClassDays();
  document.querySelector('[style*=fixed]')?.remove();
  render();
}

async function clearAllNoClassDays() {
  if(!confirm('¿Limpiar todos los días sin clase marcados?')) return;
  await sb.from('no_class_days').delete().neq('id', 0);
  await loadNoClassDays();
  render();
}

// ---- LIMPIAR SALIDAS TEMPRANAS VENCIDAS ----
async function clearExpiredEarlyExits() {
  const today = new Date().toISOString().split('T')[0];
  const expired = (D.schedules||[]).filter(s => s.early_exit_time && s.early_exit_date && s.early_exit_date < today);
  for(const s of expired) {
    await sb.from('schedules').update({ early_exit_time: null, early_exit_date: null }).eq('id', s.id);
  }
  if(expired.length) await loadSchedules();
}
