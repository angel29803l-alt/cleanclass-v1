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
        <p style="color:var(--textm);font-size:13px;margin-top:6px">Consulta los estudiantes y docentes registrados en el sistema</p>
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
        // Cumplimiento real del GRUPO (no individual):
        // = evidencias aprobadas del grupo / total evidencias del grupo (incluyendo rechazadas y pendientes)
        // Así si el grupo no subió un día, ese día cuenta como incumplimiento
        const _grpEvs=group?D.evidence.filter(e=>e.group===group.name):[];
        const _grpOk=_grpEvs.filter(e=>e.compliant||e.status==='Completado').length;
        // Además: calcular días que el grupo debía hacer aseo en los últimos 30 días
        // para penalizar también los días sin evidencia
        const _now2=new Date();
        const _DES2=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        let _dutyDays=0;
        if(group){
          for(let _di=0;_di<30;_di++){
            const _d2=new Date(_now2); _d2.setDate(_d2.getDate()-_di);
            const _dStr2=_d2.toISOString().split('T')[0];
            const _dow2=_d2.getDay();
            if(_dow2===0||_dow2===6) continue;
            if((D.noClassDays||[]).some(nc=>nc.date===_dStr2)) continue;
            const _dn2=_DES2[_dow2];
            if(group.frequency==='weekly'||(group.frequency==='daily'&&group.day===_dn2)) _dutyDays++;
          }
        }
        const _totalBase=Math.max(_grpEvs.length,_dutyDays);
        const comp=_totalBase>0?Math.round((_grpOk/_totalBase)*100):null;
        const evs=D.evidence.filter(e=>e.student===s.name);
        const cc=comp===null?'var(--textm)':comp>=70?'#10b981':comp>=40?'#f59e0b':'#ef4444';
        // Fundadores
        const _f=window._founders&&window._founders.find(f=>f.email===s.email);
        const _ft=_f?(_f.type||'gold'):'';
        const _FGRAD={'fire':'#ff4500,#ffd700,#ff4500','gold':'#b8860b,#FFD700,#fffacd','electric':'#0080ff,#00f5ff,#7000ff','aurora':'#00ff88,#00cfff,#8000ff','rainbow':'#ff0000,#00ff00,#ff0000','ocean':'#006994,#00b4d8,#90e0ef','chaos':'#8b0000,#ff4500,#ff0000','order':'#1e3a5f,#4a90d9,#ffffff','crystal':'#7dd3fc,#ffffff,#b3ecff','poison':'#004d00,#39ff14,#7fff00','blackhole':'#4b0082,#8b00ff,#000080','ice':'#5bc8e0,#ffffff,#a8e6f0'};
        const _fg=_f?(_FGRAD[_ft]||'#FFD700,#fff,#FFD700').split(','):[];
        const _up=D.usersProfiles?.find(u=>u.email===s.email);
        const _av=_up?.avatar_url||null;
        return `<tr>
          <td style="color:var(--textm);font-size:12px;text-align:center">${i+1}</td>
          <td><div style="display:flex;align-items:center;gap:9px">
            <div class="${_f?`founder-avatar founder-${_ft}`:''}" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:700;flex-shrink:0;overflow:${_f?'visible':'hidden'}">${_av?`<img src="${_av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">`:`${s.name.charAt(0)}`}</div>
            <div style="display:flex;flex-direction:column;gap:1px">
              <span class="${_f?`founder-nm founder-nm-${_ft}`:''}" style="font-weight:${_f?'800':'600'};font-size:13px">${s.name}</span>
              ${_f?`<span class="founder-badge founder-bd-${_ft}" style="font-size:9px;padding:1px 6px;width:fit-content">★</span>`:''}
            </div>
          </div></td>
          <td><span class="badge" style="background:rgba(6,182,212,.15);color:#06b6d4;font-size:11px">${s.grade||'—'}</span></td>
          <td class="col-hide-mobile" style="font-size:12px;color:var(--textm)">${s.email||'—'}</td>
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
// ---- Lista de asistencia para una evidencia (grupo + fecha) ----
function renderAttendanceList(groupName, dateStr){
  const group = D.cleanGroups.find(g=>g.name===groupName);
  if(!group || !group.members?.length) return '';
  const checkins = (D.checkins||[]).filter(c=>c.group_name===groupName && c.date===dateStr);

  return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
    <p style="font-size:10px;color:var(--textm);font-weight:600;margin-bottom:4px">ASISTENCIA (código de evidencia)</p>
    ${group.members.map(name=>{
      const c = checkins.find(x=>x.student===name);
      if(c){
        return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#16a34a;padding:2px 0">
          <i data-lucide="check-circle" style="width:12px;height:12px"></i> ${name}
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#ef4444;padding:2px 0">
        <i data-lucide="x-circle" style="width:12px;height:12px"></i> ${name} <span style="color:var(--textm)">(no registró)</span>
      </div>`;
    }).join('')}
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
      <p style="color:var(--textm);font-size:13px">Galería de fotos del aseo subidas por los estudiantes, organizadas por grado</p>
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
      <p style="color:var(--textm);font-size:13px">Sube la foto del aseo de tu grupo para que el docente la revise y apruebe</p>
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
      const todayCode = new Date().toISOString().split('T')[0];
      const iAlreadyMarked = (D.checkins||[]).some(c=>c.student===currentSession?.name && c.group_name===myGroup.name && c.date===todayCode);

      if(currentHM <= closeHM){
        if(iAlreadyMarked) return `<span style="font-size:13px;color:#16a34a;font-style:italic"><i data-lucide="check-circle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>Ya registraste tu asistencia hoy</span>`;
        const label = hasEvidenceToday ? 'Marcar mi asistencia' : 'Tomar Foto';
        const icon = hasEvidenceToday ? 'key' : 'camera';
        return `<button class="pill pill-primary flex items-center gap-2" onclick="openCameraModal()"><i data-lucide="${icon}" style="width:16px;height:16px"></i>${label}</button>`;
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
  const today = now.toISOString().split('T')[0];

  if(!myGroup){ alert('No estás en ningún grupo de aseo.'); return; }

  // Verificar que sigamos dentro del horario de aseo (misma ventana que la evidencia)
  const sch = (D.schedules||[]).find(s=>s.grade===(myGroup.grade||myGrade));
  const cleanTime = sch?.clean_time?.substring(0,5);
  if(cleanTime){
    const currentHM = now.getHours()*60+now.getMinutes();
    const [nh,nm] = cleanTime.split(':').map(Number);
    const closeHM = (nh*60+nm) + (sch?.evidence_window_min||30);
    if(currentHM > closeHM){
      alert('⏰ La ventana de aseo ya cerró. No se puede registrar evidencia ni asistencia.');
      return;
    }
  }

  const alreadyUploadedByMe = D.evidence.some(e=>
    e.group===myGroup.name && e.student===currentSession?.name && e.date===today
  );
  if(alreadyUploadedByMe){
    alert('Ya subiste una evidencia hoy para este grupo.');
    return;
  }

  const iAlreadyMarked = (D.checkins||[]).some(c=>
    c.student===currentSession?.name && c.group_name===myGroup.name && c.date===today
  );
  if(iAlreadyMarked){
    alert('Ya registraste tu asistencia hoy.');
    return;
  }

  const groupHasEvidenceToday = D.evidence.some(e=>e.group===myGroup.name && e.date===today);

  // Si un compañero ya subió la evidencia hoy, en vez de cámara pedimos el código
  if(groupHasEvidenceToday){
    openAttendanceCodeModal(myGroup);
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
  const todayStrEv = now.toISOString().split('T')[0];
  const isFirstEvidenceToday = !D.evidence.some(e=>e.group===group && e.date===todayStrEv);
  const ev={
    group, student,
    date: todayStrEv,
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
      // Primera evidencia del grupo hoy: marca presente a quien la subió y genera el código
      if(isFirstEvidenceToday){
        const grp = D.cleanGroups.find(g=>g.name===group);
        if(grp){
          const code = await markGroupAttendanceFromEvidence(group, grp.grade, student);
          if(code){
            alert(`✅ Evidencia guardada y asistencia registrada.\n\nCódigo para tus compañeros: ${code}\n\nDíselo de palabra — cada uno debe escribirlo en "Marcar mi asistencia" dentro de su grupo.`);
          }
        }
      }
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

// Modal para que un compañero escriba el código y marque su propia asistencia.
// Solo aparece si un compañero ya subió la evidencia hoy, y solo dentro del horario de aseo.
function openAttendanceCodeModal(myGroup){
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeCameraModal()">
    <div class="modal fade-in" style="max-width:400px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg flex items-center gap-2">
          <i data-lucide="key" style="width:18px;height:18px;color:var(--accent)"></i>
          Marcar mi asistencia
        </h2>
        <button onclick="closeCameraModal()" class="pill pill-ghost" style="padding:5px">
          <i data-lucide="x" style="width:17px;height:17px"></i>
        </button>
      </div>
      <p style="font-size:13px;color:var(--textm);margin-bottom:14px">
        Un compañero de <b>${myGroup.name}</b> ya subió la evidencia de hoy. Pídele el código y escríbelo acá para marcar tu asistencia.
      </p>
      <input id="attCodeInput" class="inp" placeholder="Código" style="text-transform:uppercase;text-align:center;font-size:18px;letter-spacing:3px;font-weight:700" maxlength="10">
      <p id="attCodeError" style="color:#ef4444;font-size:12px;text-align:center;margin-top:8px;display:none"></p>
      <button class="pill pill-primary w-full mt-4" onclick="submitAttendanceCodeFromModal('${myGroup.name}')">
        <i data-lucide="check" style="width:15px;height:15px;display:inline;margin-right:5px"></i>Confirmar
      </button>
    </div>
  </div>`;
  const wrap=document.getElementById('cameraModalWrap');
  wrap.innerHTML=html;
  if(typeof lucide!=='undefined') lucide.createIcons();
}

async function submitAttendanceCodeFromModal(groupName){
  const input = document.getElementById('attCodeInput');
  const err = document.getElementById('attCodeError');
  const code = input?.value?.trim();
  if(!code){ if(err){err.textContent='Escribe el código.';err.style.display='block';} return; }

  const myGrade = getCurrentGrade();
  const grp = D.cleanGroups.find(g=>g.name===groupName);
  const grade = grp?.grade || myGrade;

  const result = await submitAttendanceCode(groupName, grade, currentSession?.name, code);
  if(result.ok){
    closeCameraModal();
    render();
  } else if(err){
    err.textContent = result.error || 'Código incorrecto.';
    err.style.display='block';
  }
}

function closeCameraModal(){
  if(_camStream) _camStream.getTracks().forEach(t=>t.stop());
  _camStream=null; _capturedDataUrl=null;
  const wrap=document.getElementById('cameraModalWrap');
  if(wrap) wrap.innerHTML='';
}

