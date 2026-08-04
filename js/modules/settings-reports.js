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
    <button class="pill pill-ghost" onclick="openHelpModal()"><i data-lucide="help-circle" style="width:14px;height:14px"></i> ¿Ayuda?</button>
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

  const weekEv  = D.evidence.filter(e => e && e.date && days.includes(e.date));
  const weekInc = D.incidents.filter(i => i && i.date && days.includes(i.date));
  const weekCk  = (D.checkins||[]).filter(c => c && c.date && days.includes(c.date));
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

  if(!input||!input.value){
    if(msg){msg.textContent='Selecciona una semana primero.';msg.style.display='block';msg.style.color='#ef4444';}
    return;
  }
  if(btn){btn.disabled=true;btn.innerHTML='⏳ Generando...';}
  if(msg){msg.style.display='none';}

  try{
    // xs(): escapa XML y elimina chars de control prohibidos XML 1.0
    const xs=v=>{
      if(v==null)return'';
      return String(v)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
    };
    const ss=v=>v==null?'':String(v);
    const mk=(n,fn)=>[...Array(n)].map((_,i)=>fn(i)); // crea N objetos nuevos

    const days=_getWeekDates(input.value);
    const DAY_L=['Lunes','Martes','Miércoles','Jueves','Viernes'];
    const DAY_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const grades=[...new Set([...D.students.map(s=>s.grade),...D.rooms.map(r=>r.grade)])].filter(Boolean).sort();

    const wEv =(D.evidence ||[]).filter(e=>e&&e.date&&days.includes(e.date));
    const wInc=(D.incidents||[]).filter(i=>i&&i.date&&days.includes(i.date));
    const wCk =(D.checkins ||[]).filter(c=>c&&c.date&&days.includes(c.date));
    const nOk=wEv.filter(e=>e.status==='Completado').length;
    const nRj=wEv.filter(e=>e.status==='Rechazado').length;
    const nPd=wEv.filter(e=>e.status==='Pendiente').length;
    const wLabel=new Date(days[0]).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})
                +' — '+new Date(days[4]).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});

    // ── Paleta ──
    const P={
      AZ:'1E3A5F',AZf:'FFFFFF',
      B2:'2563EB',B2f:'FFFFFF',
      BL:'FFFFFF',GL:'F3F4F6',GM:'D1D5DB',
      TX:'1F2937',
      VBg:'D1FAE5',VFg:'065F46',
      ABg:'FEF3C7',AFg:'92400E',
      RBg:'FEE2E2',RFg:'991B1B',
      VE:'10B981',AM:'F59E0B',RO:'EF4444',
    };

    // ── Celda ──
    // {v, b(old), s(z), bg, fg, a(lign):'L'|'C'|'R', w(rap), br(order):'n'|'t'|'m'}
    const sk=c=>[c.b?1:0,c.s||10,c.bg||'',c.fg||P.TX,c.a||'L',c.w?1:0,c.br||'t'].join('|');

    // helpers
    const tit =(v,nc)=>({v,b:1,s:13,bg:P.AZ,fg:P.AZf,a:'L',br:'m'});
    const sub =(v)   =>({v,b:1,s:10,bg:P.AZ,fg:P.AZf,a:'C',br:'m'});
    const hd  =(v)   =>({v,b:1,s:10,bg:P.B2,fg:P.B2f,a:'C',br:'t'});
    const mt  =(v)   =>({v,b:1,s:9, bg:'E8F0FE',fg:P.AZ,a:'L',br:'t'});
    const mtv =(v)   =>({v,b:0,s:9, bg:'E8F0FE',fg:P.TX,a:'L',br:'t'});
    const sep =()    =>({v:'',s:4,  bg:P.AZ,fg:P.AZ,br:'n'});
    const d   =(v,p,a)=>({v,s:10,bg:p?P.BL:P.GL,fg:P.TX,a:a||'L',br:'t'});
    const dc  =(v,p) =>({v,s:10,bg:p?P.BL:P.GL,fg:P.TX,a:'C',br:'t'});
    const emp =(p)   =>({v:'',s:10,bg:p?P.BL:P.GL,br:'t'});
    const badge=(v,p)=>{
      const m={'Completado':[P.VBg,P.VFg],'Aprobado':[P.VBg,P.VFg],'Resuelto':[P.VBg,P.VFg],'Baja':[P.VBg,P.VFg],
               'Rechazado':[P.RBg,P.RFg],'Abierto':[P.RBg,P.RFg],'Alta':[P.RBg,P.RFg],
               'Pendiente':[P.ABg,P.AFg],'En Proceso':[P.ABg,P.AFg],'Media':[P.ABg,P.AFg]};
      const[bg,fg]=m[v]||[P.GL,P.TX];
      return{v,b:1,s:10,bg,fg,a:'C',br:'t'};
    };
    const pct=(v,p)=>{
      const bg=v>=80?P.VBg:v>=50?P.ABg:P.RBg;
      const fg=v>=80?P.VFg:v>=50?P.AFg:P.RFg;
      return{v:`${v}%`,b:1,s:10,bg,fg,a:'C',br:'t'};
    };
    const bar=(v,p)=>{
      const bg=v>=80?P.VBg:v>=50?P.ABg:P.RBg;
      const fg=v>=80?P.VFg:v>=50?P.AFg:P.RFg;
      const n=Math.round(v/10);
      return{v:'|'.repeat(n)+'·'.repeat(10-n),b:1,s:9,bg,fg,a:'L',br:'t'};
    };
    const chk=(v,p)=>v==='✓'
      ?{v:'✓',b:1,s:11,bg:P.VBg,fg:P.VFg,a:'C',br:'t'}
      :{v:'',s:10,bg:p?P.BL:P.GL,fg:P.GM,a:'C',br:'t'};
    const kpiV=(v,fg)=>({v,b:1,s:18,bg:P.BL,fg:fg||P.AZ,a:'C',br:'t'});
    const kpiL=(v,fg)=>({v,b:1,s:9, bg:P.BL,fg:fg||P.AZ,a:'C',br:'t'});
    const rank=(v,p)=>{
      const bg=v===1?'FDE68A':v===2?'E5E7EB':v===3?'FCD9B6':p?P.BL:P.GL;
      const fg=v===1?'92400E':v===2?P.TX:v===3?'7C2D12':P.TX;
      return{v,b:1,s:10,bg,fg,a:'C',br:'t'};
    };

    // ── Motor XML ──
    function buildXLSX(sheets){
      const enc=new TextEncoder();

      // Recopilar estilos únicos
      const sIdx={};
      sheets.forEach(sh=>sh.rows.forEach(row=>{
        if(!row)return;
        (row.c||[]).forEach(cell=>{
          if(!cell)return;
          const k=sk(cell);
          if(!(k in sIdx))sIdx[k]=Object.keys(sIdx).length;
        });
      }));
      const sArr=Object.entries(sIdx).sort((a,b)=>a[1]-b[1]).map(([k])=>k.split('|'));
      // [bold,sz,bg,fg,align,wrap,border]

      // Fonts únicos por (bold,sz,fg)
      const fKeys=[...new Set(sArr.map(e=>`${e[0]}|${e[1]}|${e[3]}`))];
      const fIdx={};fKeys.forEach((k,i)=>fIdx[k]=i);

      // Fills únicos — solo los que tienen color real (bg vacío usa fillId=0)
      const bgKeys=[...new Set(sArr.map(e=>e[2]).filter(Boolean))];
      const bgIdx={};bgKeys.forEach((k,i)=>bgIdx[k]=i);

      const xmlF=`<fonts count="${fKeys.length}">${fKeys.map(k=>{
        const[b,s,fg]=k.split('|');
        return`<font>${b==='1'?'<b/>':''}<sz val="${s}"/><color rgb="FF${fg}"/><name val="Calibri"/></font>`;
      }).join('')}</fonts>`;

      const xmlBg=`<fills count="${bgKeys.length+2}">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        ${bgKeys.map(bg=>`<fill><patternFill patternType="solid"><fgColor rgb="FF${bg}"/><bgColor indexed="64"/></patternFill></fill>`).join('')}
      </fills>`;

      // Bordes: 0=none, 1=thin gris(tabla interna), 2=medium negro(exterior), 3=thin azul(header)
      // Cada celda tiene borde completo → efecto tabla sin necesidad de aplicar manualmente
      const xmlBr=`<borders count="4">
        <border><left/><right/><top/><bottom/></border>
        <border>
          <left style="thin"><color rgb="FF${P.GM}"/></left>
          <right style="thin"><color rgb="FF${P.GM}"/></right>
          <top style="thin"><color rgb="FF${P.GM}"/></top>
          <bottom style="thin"><color rgb="FF${P.GM}"/></bottom>
        </border>
        <border>
          <left style="medium"><color rgb="FF1E3A5F"/></left>
          <right style="medium"><color rgb="FF1E3A5F"/></right>
          <top style="medium"><color rgb="FF1E3A5F"/></top>
          <bottom style="medium"><color rgb="FF1E3A5F"/></bottom>
        </border>
        <border>
          <left style="thin"><color rgb="FF${P.AZ}"/></left>
          <right style="thin"><color rgb="FF${P.AZ}"/></right>
          <top style="thin"><color rgb="FF${P.AZ}"/></top>
          <bottom style="thin"><color rgb="FF${P.AZ}"/></bottom>
        </border>
      </borders>`;
      // border index: 0=none,1=thin gray,2=medium black,3=thin blue
      const brMap={'n':0,'t':1,'m':2,'d':3};

      const xfs=sArr.map(([bold,sz,bg,fg,align,wrap,border])=>{
        const fi=fIdx[`${bold}|${sz}|${fg}`]??0;
        const bi=bg?(bgIdx[bg]??0)+2:0; // bg vacío → fillId=0 (default 'none')
        const bri=brMap[border||'t']??1;
        const ha=align==='C'?'center':align==='R'?'right':'left';
        return`<xf numFmtId="0" fontId="${fi}" fillId="${bi}" borderId="${bri}" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="${ha}" vertical="center" wrapText="${wrap==='1'?1:0}"/></xf>`;
      });

      const xmlSt=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${xmlF}${xmlBg}${xmlBr}
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length+1}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>${xfs.join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="0"/>
<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

      function colName(i){let s='';i++;while(i>0){s=String.fromCharCode(64+(i%26||26))+s;i=Math.floor((i-1)/26);}return s;}

      const shXmls=sheets.map(sh=>{
        let x=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`;
        if(sh.freeze) x+=`<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`;
        if(sh.cols?.length) x+=`<cols>${sh.cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`;
        x+='<sheetData>';
        sh.rows.forEach((row,ri)=>{
          if(!row){x+=`<row r="${ri+1}"/>`;return;}
          const ht=row.h?` ht="${row.h}" customHeight="1"`:'';
          x+=`<row r="${ri+1}"${ht}>`;
          (row.c||[]).forEach((cell,ci)=>{
            if(!cell){x+=`<c r="${colName(ci)}${ri+1}"/>`;return;}
            const k=sk(cell);
            const si=(sIdx[k]??0)+1; // +1: saltamos el xf default en posición 0
            const addr=`${colName(ci)}${ri+1}`;
            if(typeof cell.v==='number'){
              x+=`<c r="${addr}" s="${si}" t="n"><v>${cell.v}</v></c>`;
            }else{
              const val=xs(cell.v);
              x+=val?`<c r="${addr}" s="${si}" t="inlineStr"><is><t>${val}</t></is></c>`:`<c r="${addr}" s="${si}"/>`;
            }
          });
          x+='</row>';
        });
        x+='</sheetData>';
        // Merges: solo los válidos [r,c,r2,c2]
        const mgs=(sh.merges||[]).filter(m=>Array.isArray(m)&&m.length===4&&m[0]!==m[2]||m[1]!==m[3]);
        if(mgs.length) x+=`<mergeCells count="${mgs.length}">${mgs.map(m=>`<mergeCell ref="${colName(m[1])}${m[0]+1}:${colName(m[3])}${m[2]+1}"/>`).join('')}</mergeCells>`;
        x+='</worksheet>';
        return x;
      });

      // ZIP
      function u32(n){return new Uint8Array([n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff]);}
      function u16(n){return new Uint8Array([n&0xff,(n>>8)&0xff]);}
      function crc32(d){
        let c=0xFFFFFFFF;
        const t=mk(256,i=>{let n=i;for(let j=0;j<8;j++)n=n&1?(n>>>1)^0xEDB88320:(n>>>1);return n});
        for(const b of d)c=t[(c^b)&0xff]^(c>>>8);
        return(c^0xFFFFFFFF)>>>0;
      }
      const zip={};
      zip['[Content_Types].xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
      zip['_rels/.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
      zip['xl/workbook.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xs(s.name)}" sheetId="${i+1}" r:id="rId${i+2}"/>`).join('')}</sheets></workbook>`;
      zip['xl/_rels/workbook.xml.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${sheets.map((_,i)=>`<Relationship Id="rId${i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`;
      zip['xl/styles.xml']=xmlSt;
      shXmls.forEach((x,i)=>{zip[`xl/worksheets/sheet${i+1}.xml`]=x;});

      const entries=[],cd=[];let off=0;
      for(const[name,content]of Object.entries(zip)){
        const nb=enc.encode(name),db=enc.encode(content);
        const crc=crc32(db),sz=db.length;
        const lh=new Uint8Array([0x50,0x4B,0x03,0x04,0x14,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,...u32(crc),...u32(sz),...u32(sz),...u16(nb.length),0x00,0x00]);
        const e=new Uint8Array(lh.length+nb.length+db.length);
        e.set(lh,0);e.set(nb,lh.length);e.set(db,lh.length+nb.length);
        entries.push(e);cd.push({nb,crc,sz,off});off+=e.length;
      }
      const cdes=cd.map(({nb,crc,sz,off})=>new Uint8Array([0x50,0x4B,0x01,0x02,0x14,0x00,0x14,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,...u32(crc),...u32(sz),...u32(sz),...u16(nb.length),0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,...u32(off),...nb]));
      const cdSz=cdes.reduce((s,e)=>s+e.length,0);
      const eocd=new Uint8Array([0x50,0x4B,0x05,0x06,0x00,0x00,0x00,0x00,...u16(cdes.length),...u16(cdes.length),...u32(cdSz),...u32(off),0x00,0x00]);
      const total=entries.reduce((s,e)=>s+e.length,0)+cdSz+eocd.length;
      const out=new Uint8Array(total);let pos=0;
      entries.forEach(e=>{out.set(e,pos);pos+=e.length;});
      cdes.forEach(e=>{out.set(e,pos);pos+=e.length;});
      out.set(eocd,pos);
      return {xlsxBytes: out, xmlFiles: {}};
    }

    // ── Cabecera estándar: título + semana + generado + separador ──
    function header(titulo,nc){
      const rows=[], mg=[];
      rows.push({h:26,c:[tit(titulo),...mk(nc-1,()=>tit(''))]}); mg.push([0,0,0,nc-1]);
      rows.push({h:16,c:[mt('Semana:'),mtv(wLabel),...mk(nc-2,()=>mtv(''))]}); mg.push([1,1,1,nc-1]);
      rows.push({h:14,c:[mt('Generado:'),mtv(new Date().toLocaleString('es-CO')),...mk(nc-2,()=>mtv(''))]}); mg.push([2,1,2,nc-1]);
      rows.push({h:3, c:mk(nc,()=>sep())});
      return{rows,mg};
    }

    // ══════════════════════════════════════════
    // HOJA 1: RESUMEN — 8 columnas
    // col: #(4) nombre(22) grado(8) valor(8) bar(20) .(4) .(4) .(4)
    // ══════════════════════════════════════════
    const NC=8;
    const h1=header('CleanClass — Reporte Semanal de Aseo',NC);
    const R1=h1.rows, M1=h1.mg;
    let ri=R1.length;

    // ── KPIs: tabla de 4 filas × 4 columnas (valor|etiqueta en pares) ──
    // Usamos 4 cols para 4 KPIs — cada KPI ocupa 2 cols (valor + nada)
    // Fila vacía
    R1.push({h:6,c:mk(NC,()=>({v:'',s:6,bg:P.BL,br:'t'}))}); ri++;

    const kpis=[
      {v:wEv.length, l:'Total Evidencias', fg:P.AZ},
      {v:nOk,        l:'Aprobadas',        fg:P.VFg},
      {v:nRj,        l:'Rechazadas',       fg:P.RFg},
      {v:nPd,        l:'Pendientes',       fg:P.AFg},
      {v:wCk.length, l:'Asistencias',    fg:P.AZ},
      {v:wInc.length,l:'Incidentes',       fg:P.AZ},
      {v:wInc.filter(i=>i.status==='Abierto').length,l:'Inc. Abiertos',fg:P.RFg},
    ];
    // 4 KPIs por fila, 2 columnas por KPI → 8 cols totales
    // Fila valores fila 1 (KPIs 0-3)
    const kv1=mk(NC,()=>({v:'',s:10,bg:P.BL,br:'t'}));
    const kl1=mk(NC,()=>({v:'',s:9, bg:P.BL,br:'t'}));
    [0,1,2,3].forEach((ki,pos)=>{
      const c=pos*2;
      kv1[c]=kpiV(kpis[ki].v,kpis[ki].fg); M1.push([ri,c,ri,c+1]);
      kl1[c]=kpiL(kpis[ki].l,kpis[ki].fg); M1.push([ri+1,c,ri+1,c+1]);
    });
    R1.push({h:28,c:kv1}); ri++;
    R1.push({h:14,c:kl1}); ri++;
    // Fila valores fila 2 (KPIs 4-6): 3 KPIs en 8 cols → ~2.67 por KPI, usamos 3+3+2
    const kv2=mk(NC,()=>({v:'',s:10,bg:P.BL,br:'t'}));
    const kl2=mk(NC,()=>({v:'',s:9, bg:P.BL,br:'t'}));
    [[0,3],[3,6],[6,8]].forEach(([c,c2],ki)=>{
      kv2[c]=kpiV(kpis[4+ki]?.v??0,kpis[4+ki]?.fg??P.AZ); M1.push([ri,c,ri,c2-1]);
      kl2[c]=kpiL(kpis[4+ki]?.l??'',kpis[4+ki]?.fg??P.AZ); M1.push([ri+1,c,ri+1,c2-1]);
    });
    R1.push({h:28,c:kv2}); ri++;
    R1.push({h:14,c:kl2}); ri++;

    R1.push({h:3,c:mk(NC,()=>sep())}); ri++;
    R1.push({h:6,c:mk(NC,()=>({v:'',s:6,bg:P.BL,br:'t'}))}); ri++;

    // ── Cumplimiento por grado ──
    R1.push({h:18,c:[sub('CUMPLIMIENTO POR GRADO'),...mk(NC-1,()=>sub(''))]}); M1.push([ri,0,ri,NC-1]); ri++;
    R1.push({h:16,c:['Grado','Evidencias','Aprobadas','Rechazadas','Pendientes','Cumplimiento','Progreso',''].map(hd)}); ri++;
    grades.forEach((g,i)=>{
      const p=i%2===0;
      const gEv=wEv.filter(e=>{const gr=D.cleanGroups.find(cg=>cg.name===e.group);return gr&&gr.grade===g;});
      const ga=gEv.filter(e=>e.status==='Completado').length;
      const gr=gEv.filter(e=>e.status==='Rechazado').length;
      const gp=gEv.filter(e=>e.status==='Pendiente').length;
      const grate=gEv.length?Math.round((ga/gEv.length)*100):0;
      R1.push({h:15,c:[d(g,p),dc(gEv.length,p),dc(ga,p),dc(gr,p),dc(gp,p),pct(grate,p),bar(grate,p),emp(p)]}); ri++;
    });
    if(!grades.length){R1.push({h:15,c:[d('Sin datos',true),...mk(NC-1,()=>emp(true))]}); ri++;}

    R1.push({h:3,c:mk(NC,()=>sep())}); ri++;
    R1.push({h:6,c:mk(NC,()=>({v:'',s:6,bg:P.BL,br:'t'}))}); ri++;

    // ── Top 10 faltas ──
    R1.push({h:18,c:[sub('TOP 10 — ESTUDIANTES CON MAS FALTAS'),...mk(NC-1,()=>sub(''))]}); M1.push([ri,0,ri,NC-1]); ri++;
    R1.push({h:16,c:['#','Estudiante','Grado','Faltas','Indicador','','',''].map(hd)}); ri++;
    const abs={};
    (D.cleanGroups||[]).forEach(g=>(g.members||[]).forEach(name=>{
      if(!name)return;
      const duty=days.filter(d=>{const dow=new Date(d+'T00:00:00').getDay();
        return g.frequency==='weekly'||(g.frequency==='daily'&&g.day===DAY_ES[dow]);}).length;
      const ci=days.filter(d=>wCk.some(c=>c.student===name&&c.date===d)).length;
      if(duty>0){if(!abs[name])abs[name]={name,grade:ss(g.grade),faltas:0};
        abs[name].faltas+=Math.max(0,duty-ci);}
    }));
    const topF=Object.values(abs).filter(a=>a.faltas>0).sort((a,b)=>b.faltas-a.faltas).slice(0,10);
    const maxF=topF[0]?.faltas||1;
    topF.forEach((a,i)=>{
      const p=i%2===0;
      const n=Math.round((a.faltas/maxF)*8);
      const ibg=i===0?P.RBg:i===1?P.ABg:i===2?'FEF9C3':p?P.BL:P.GL;
      const ifg=i===0?P.RFg:i===1?P.AFg:i===2?'92400E':P.TX;
      R1.push({h:15,c:[rank(i+1,p),d(a.name,p),dc(a.grade,p),dc(a.faltas,p),
        {v:'|'.repeat(n)+'·'.repeat(8-n),b:1,s:9,bg:ibg,fg:ifg,a:'L',br:'t'},
        emp(p),emp(p),emp(p)]}); ri++;
    });
    if(!topF.length){R1.push({h:15,c:[d('Sin faltas registradas esta semana',true),...mk(NC-1,()=>emp(true))]}); ri++;}

    // ══════════════════════════════════════════
    // HOJA 2: ASISTENCIA — 11 columnas
    // ══════════════════════════════════════════
    const NC2=11;
    const h2=header('CleanClass — Asistencia GPS Semanal',NC2);
    const R2=h2.rows,M2=h2.mg;
    R2.push({h:22,c:[...['Estudiante','Grado','Grupo'].map(hd),
      ...DAY_L.map((l,i)=>hd(l+' '+new Date(days[i]+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit'}))),
      ...['Asist.','Posibles','%'].map(hd)]});

    const stG={};
    (D.cleanGroups||[]).forEach(g=>(g.members||[]).forEach(n=>{
      if(n&&!stG[n])stG[n]={grade:ss(g.grade),group:ss(g.name),freq:g.frequency,day:g.day};
    }));
    [...(D.students||[])].sort((a,b)=>ss(a.grade).localeCompare(ss(b.grade))||ss(a.name).localeCompare(ss(b.name)))
      .forEach((st,i)=>{
        const p=i%2===0,sg=stG[ss(st.name)];
        const dc2=days.map(d=>wCk.some(c=>c.student===st.name&&c.date===d)?'✓':'');
        const ta=dc2.filter(v=>v==='✓').length;
        const tp=sg?days.filter(d=>{const dow=new Date(d+'T00:00:00').getDay();
          return sg.freq==='weekly'||(sg.freq==='daily'&&sg.day===DAY_ES[dow]);}).length:0;
        const pp=tp?Math.round((ta/tp)*100):0;
        R2.push({h:15,c:[d(ss(st.name),p),dc(ss(st.grade),p),d(sg?sg.group:'Sin grupo',p),
          ...dc2.map(v=>chk(v,p)),dc(ta,p),dc(tp,p),pct(pp,p)]});
      });

    // ══════════════════════════════════════════
    // HOJA 3: EVIDENCIAS — 8 columnas
    // ══════════════════════════════════════════
    const NC3=8;
    const h3=header('CleanClass — Evidencias de Aseo',NC3);
    const R3=h3.rows,M3=h3.mg;
    R3.push({h:16,c:['Fecha','Dia','Grupo','Grado','Subida por','Estado','Revisado por','Observaciones'].map(hd)});
    const evS=[...wEv].sort((a,b)=>ss(a.date).localeCompare(ss(b.date)));
    if(!evS.length){
      R3.push({h:15,c:[{...d('Sin evidencias esta semana',true),a:'C'},...mk(NC3-1,()=>emp(true))]});
      M3.push([R3.length-1,0,R3.length-1,NC3-1]);
    }else{
      evS.forEach((e,i)=>{
        const p=i%2===0,dow=new Date((ss(e.date)||'2000-01-01')+'T00:00:00').getDay();
        R3.push({h:15,c:[dc(ss(e.date),p),dc(DAY_ES[dow]||'',p),
          d(ss(e.group),p),dc((D.cleanGroups.find(g=>g.name===e.group)||{}).grade||'',p),
          d(ss(e.student),p),badge(ss(e.status),p),
          d(ss(e.reviewed_by)||'—',p),{...d(ss(e.observation)||'—',p),w:true}]});
      });
    }

    // ══════════════════════════════════════════
    // HOJA 4: INCIDENTES — 10 columnas
    // ══════════════════════════════════════════
    const NC4=10;
    const h4=header('CleanClass — Incidentes Reportados',NC4);
    const R4=h4.rows,M4=h4.mg;
    R4.push({h:16,c:['Fecha','Tipo','Grado','Prioridad','Estado','Ubicacion','Reportado por','Descripcion','Asignado a','Notas'].map(hd)});
    const incS=[...wInc].sort((a,b)=>ss(a.date).localeCompare(ss(b.date)));
    if(!incS.length){
      R4.push({h:15,c:[{...d('Sin incidentes esta semana',true),a:'C'},...mk(NC4-1,()=>emp(true))]});
      M4.push([R4.length-1,0,R4.length-1,NC4-1]);
    }else{
      incS.forEach((inc,i)=>{
        const p=i%2===0;
        R4.push({h:15,c:[dc(ss(inc.date),p),d(ss(inc.type),p),dc(ss(inc.grade),p),
          badge(ss(inc.priority),p),badge(ss(inc.status),p),d(ss(inc.location),p),
          d(ss(inc.reporter),p),{...d(ss(inc.description),p),w:true},
          d(ss(inc.assigned_to)||'—',p),{...d(ss(inc.notes)||'—',p),w:true}]});
      });
    }

    // ══════════════════════════════════════════
    // GENERAR Y DESCARGAR
    // ══════════════════════════════════════════
    const sheets=[
      {name:'Resumen',    rows:R1,merges:M1,freeze:4, cols:[4,22,8,8,8,10,18,4]},
      {name:'Asistencia', rows:R2,merges:M2,freeze:5, cols:[24,8,18,9,9,9,9,9,10,9,8]},
      {name:'Evidencias', rows:R3,merges:M3,freeze:5, cols:[12,10,22,8,22,12,18,40]},
      {name:'Incidentes', rows:R4,merges:M4,freeze:5, cols:[12,20,8,10,12,18,18,40,18,28]},
    ];

    const {xlsxBytes} = buildXLSX(sheets);
    const blob=new Blob([xlsxBytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=`CleanClass_Semana_${input.value}.xlsx`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    if(msg){msg.textContent='✅ Archivo descargado correctamente.';msg.style.display='block';msg.style.color='#10b981';}

  }catch(err){
    console.error('Excel error:',err);
    if(msg){msg.textContent='⚠ Error: '+err.message;msg.style.display='block';msg.style.color='#ef4444';}
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='<i data-lucide="download" style="width:18px;height:18px"></i> Descargar Excel';if(typeof lucide!=='undefined')lucide.createIcons();}
  }
}

