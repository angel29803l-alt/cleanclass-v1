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
    <p style="color:var(--textm);font-size:13px">${isStudent()?'Consulta qué días te toca el aseo y con qué grupo':'Crea y organiza los grupos encargados del aseo del salón'}</p>
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
    <p style="color:var(--textm);font-size:13px">Revisa las fotos del aseo y aprueba o rechaza cada evidencia subida por los estudiantes</p>
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
    <p style="color:var(--textm);font-size:13px">Aquí puedes ver si tu evidencia fue aprobada o rechazada por el docente</p>
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
      <p style="color:var(--textm);font-size:13px">Seguimiento de daños, problemas o situaciones reportadas en los salones del colegio</p>
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
    <p style="color:var(--textm);font-size:13px">Revisa y da seguimiento a los incidentes reportados en tu grado</p>
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
      <p style="color:var(--textm);font-size:13px">Reporta cualquier daño o problema que encuentres en el salón para que el docente lo gestione</p>
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
