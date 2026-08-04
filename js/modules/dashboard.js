// CleanClass views.js — build 2025-06-20
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
            <p style="color:var(--textm);font-size:13px">Resumen general del estado del aseo escolar hoy</p>
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
          <p style="font-size:11px;color:var(--textm)">${g.groups} grupo(s) · ${g.checkins}/${g.totalMembers} asistencia · ${g.evidenceCount} evidencia(s)</p>
        </div>`;
      }).filter(Boolean).join('')}
      ${gradeStatus.every(g=>g.groups===0)?'<p style="color:var(--textm);text-align:center;padding:20px">No hay grupos de aseo asignados</p>':''}
    </div>
  </div>

  <!-- Dos columnas: Evidencias Hoy + Estado del Sistema -->
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="card" style="background:var(--surface)">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">Evidencias Recientes</h3>
        <span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${todayEvidence.length} hoy</span>
      </div>
      ${(()=>{
        const _stBg=s=>s==='Completado'?'#d1fae5;color:#059669':s==='Rechazado'?'#fee2e2;color:#dc2626':'#fef3c7;color:#92400e';
        const _now=new Date();
        const _nowMin=_now.getHours()*60+_now.getMinutes();
        const _DES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        const _noClassSet=new Set((D.noClassDays||[]).map(d=>d.date));
        const _schedule=D.schedules&&D.schedules[0];
        const _windowMin=_schedule?(_schedule.evidence_window_min||30):30;
        const _cleanTime=_schedule?(_schedule.clean_time||'15:00').substring(0,5):'15:00';
        const [_ch,_cm]=_cleanTime.split(':').map(Number);
        const _deadlineMin=_ch*60+_cm+_windowMin;

        // Incumplimientos últimos 7 días
        const _incumplidos=[];
        for(let _di=0;_di<7;_di++){
          const _d=new Date(_now); _d.setDate(_d.getDate()-_di);
          const _dStr=_d.toISOString().split('T')[0];
          const _dDow=_d.getDay();
          if(_dDow===0||_dDow===6||_noClassSet.has(_dStr)) continue;
          if(_di===0&&_nowMin<_deadlineMin) continue;
          const _dName=_DES[_dDow];
          const _gruposDelDia=D.cleanGroups.filter(g=>g.frequency==='weekly'||(g.frequency==='daily'&&g.day===_dName));
          for(const _g of _gruposDelDia){
            if(D.evidence.filter(e=>e.group===_g.name&&e.date===_dStr).length===0){
              _incumplidos.push({g:_g,date:_dStr,dn:_dName,di:_di});
            }
          }
        }

        // Evidencias de hoy
        const evHtml=todayEvidence.length>0
          ?'<div class="flex flex-col gap-2 mb-4">'+[...todayEvidence].sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date)).map(e=>{
              const imgTag=e.image?'<img src="'+e.image+'" style="width:48px;height:48px;border-radius:8px;object-fit:cover;cursor:pointer" onclick="openImageFullscreen(this.src)">'
                :'<div style="width:48px;height:48px;border-radius:8px;background:rgba(6,182,212,.1)"></div>';
              return '<div style="display:flex;gap:10px;padding:8px;background:rgba(6,182,212,.05);border-radius:8px;border:1px solid rgba(6,182,212,.1)">'+imgTag+'<div style="flex:1;min-width:0"><p style="font-size:12px;font-weight:600">'+e.group+'</p><p style="font-size:11px;color:var(--textm)">'+e.student+'</p><span class="badge" style="font-size:10px;background:'+_stBg(e.status)+'">'+e.status+'</span></div></div>';
            }).join('')+'</div>'
          :'';

        // Incumplimientos
        const incHtml=_incumplidos.length>0
          ?'<div><p style="font-size:12px;font-weight:700;color:#ef4444;margin-bottom:8px">❌ Grupos sin evidencia ('+_incumplidos.length+')</p>'+
            _incumplidos.map(({g,date:dt,dn,di})=>{
              const mbs=(g.members||[]).map(m=>'<span style="font-size:10px;padding:2px 7px;border-radius:50px;background:rgba(6,182,212,.08);color:var(--textm)">'+m+'</span>').join('');
              const lbl=di===0?'Hoy':di===1?'Ayer':dn+' '+dt.substring(5);
              return '<div style="padding:10px 12px;background:rgba(239,68,68,.05);border-radius:10px;border:1px solid rgba(239,68,68,.15);margin-bottom:6px"><div class="flex items-center justify-between mb-1"><div class="flex items-center gap-2"><span style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block"></span><p style="font-size:12px;font-weight:700">'+g.name+'</p></div><div class="flex items-center gap-2"><span style="font-size:10px;color:var(--textm)">'+lbl+'</span><span style="font-size:10px;font-weight:600;color:#ef4444;background:rgba(239,68,68,.1);padding:1px 7px;border-radius:50px">'+g.grade+'</span></div></div><div style="display:flex;flex-wrap:wrap;gap:3px">'+mbs+'</div></div>';
            }).join('')+'</div>'
          :'';

        if(!evHtml&&!incHtml) return '<p style="color:var(--textm);text-align:center;padding:30px;font-size:13px">✅ Todo al día — sin incumplimientos recientes</p>';
        return evHtml+incHtml;
        })()}
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
