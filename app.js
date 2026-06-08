// ============================================================
// app.js — CleanClass
// Login con roles, tabs, modales, logout
// ============================================================

let assignmentMode='daily';
let isLoggedOut=false;

function switchValidationTab(tab){
  document.querySelectorAll('.validation-tab').forEach(t=>t.style.display='none');
  document.getElementById('validation'+tab.charAt(0).toUpperCase()+tab.slice(1)).style.display='block';
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function switchReportTab(tab){
  document.querySelectorAll('.report-tab').forEach(t=>t.style.display='none');
  const tabMap={students:'reportStudents',rooms:'reportRooms',history:'reportHistory'};
  const el=document.getElementById(tabMap[tab]);
  if(el)el.style.display='block';
  document.querySelectorAll('button.tab').forEach(t=>t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function switchSettingsTab(tab){
  document.querySelectorAll('.settings-tab').forEach(t=>t.style.display='none');
  const el=document.getElementById('settings'+tab.charAt(0).toUpperCase()+tab.slice(1));
  if(el)el.style.display='block';
  document.querySelectorAll('button.tab').forEach(t=>t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function openEditProfileModal(){
  if(!D._user)return;
  const u=D._user;
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal fade-in" style="max-width:500px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">Editar Perfil</h2>
        <button onclick="closeModal()" class="pill pill-ghost" style="padding:4px"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <form id="editProfileForm" class="flex flex-col gap-3">
        <div><label class="text-sm font-medium" style="color:var(--textm)">Nombre Completo</label>
          <input type="text" name="name" class="inp mt-1" value="${u.name}" required></div>
        <div><label class="text-sm font-medium" style="color:var(--textm)">Email</label>
          <input type="email" name="email" class="inp mt-1" value="${u.email}" required></div>
        <div><label class="text-sm font-medium" style="color:var(--textm)">Teléfono</label>
          <input type="tel" name="phone" class="inp mt-1" value="${u.phone||''}"></div>
        <div class="flex gap-2 mt-3">
          <button type="button" class="pill pill-ghost flex-1" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="pill pill-primary flex-1">Guardar Cambios</button>
        </div>
      </form>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='modalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();
  document.getElementById('editProfileForm').onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    D._user.name=fd.get('name');
    D._user.email=fd.get('email');
    D._user.phone=fd.get('phone');
    closeModal();render();
    const n=document.createElement('div');
    n.style.cssText='position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:16px 20px;border-radius:8px;z-index:100;font-weight:600';
    n.textContent='✓ Perfil actualizado correctamente';
    document.body.appendChild(n);
    setTimeout(()=>n.remove(),3000);
  };
}

function openWeeklyAssignmentModal(){
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal fade-in" style="max-width:460px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">Cómo funciona la rotación</h2>
        <button onclick="closeModal()" class="pill pill-ghost" style="padding:4px"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="flex flex-col gap-4">
        <div style="background:rgba(6,182,212,.08);padding:16px;border-radius:8px;border-left:4px solid var(--accent)">
          <h3 class="font-bold text-sm mb-2">Grupos Diarios</h3>
          <p style="font-size:13px;color:var(--textm)">Cada grupo limpia <strong>un día específico</strong> cada semana. Ej: Grupo A → siempre los Lunes.</p>
        </div>
        <div style="background:rgba(236,72,153,.08);padding:16px;border-radius:8px;border-left:4px solid #ec4899">
          <h3 class="font-bold text-sm mb-2">Grupos Semanales</h3>
          <p style="font-size:13px;color:var(--textm)">Un grupo limpia <strong>toda la semana completa</strong> (Lun–Vie), rotando cada semana.</p>
        </div>
      </div>
      <button class="pill pill-primary w-full mt-6" onclick="closeModal()">Entendido</button>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='modalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();
}

function openIncidentDetail(id){
  const incident=D.incidents.find(i=>i.id===id);
  if(!incident)return;
  const priorityColors={Alta:'#dc2626',Media:'#f59e0b',Baja:'#10b981'};
  const statusColors={Abierto:'#ef4444','En Proceso':'#f59e0b',Resuelto:'#10b981'};
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal fade-in" style="max-width:500px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">Detalle del Incidente</h2>
        <button onclick="closeModal()" class="pill pill-ghost" style="padding:4px"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <div><p style="font-size:12px;color:var(--textm);margin-bottom:4px">TIPO</p><h3 class="font-bold text-lg">${incident.type}</h3></div>
          <div class="flex gap-2">
            <span class="badge" style="background:${priorityColors[incident.priority]}15;color:${priorityColors[incident.priority]};font-size:11px">${incident.priority}</span>
            <span class="badge" style="background:${statusColors[incident.status]}15;color:${statusColors[incident.status]};font-size:11px">${incident.status}</span>
          </div>
        </div>
        <div style="background:rgba(6,182,212,.08);padding:12px;border-radius:8px;border-left:3px solid var(--accent)">
          <p style="font-size:11px;color:var(--textm);margin-bottom:6px">DESCRIPCIÓN</p>
          <p style="font-size:13px;color:var(--text);line-height:1.5">${incident.description}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><p style="font-size:11px;color:var(--textm);margin-bottom:4px">UBICACIÓN</p><p class="font-medium text-sm">${incident.location}</p></div>
          <div><p style="font-size:11px;color:var(--textm);margin-bottom:4px">REPORTADO POR</p><p class="font-medium text-sm">${incident.reporter}</p></div>
          <div><p style="font-size:11px;color:var(--textm);margin-bottom:4px">FECHA</p><p class="font-medium text-sm">${incident.date}</p></div>
          <div><p style="font-size:11px;color:var(--textm);margin-bottom:4px">ASIGNADO A</p><p class="font-medium text-sm">${incident.assigned_to||'Por Asignar'}</p></div>
        </div>
        ${incident.notes?`<div style="background:rgba(59,130,246,.08);padding:12px;border-radius:8px;border-left:3px solid #3b82f6"><p style="font-size:11px;color:var(--textm);margin-bottom:6px">NOTAS</p><p style="font-size:13px;color:var(--text);line-height:1.5">${incident.notes}</p></div>`:''}
        <div class="flex gap-2 pt-4" style="border-top:1px solid var(--border)">
          ${(isAdmin()||isTeacher())?`<button class="pill pill-primary flex-1 flex items-center justify-center gap-1" onclick="closeModal();openModal('edit','incidents',${incident.id})"><i data-lucide="edit" style="width:14px;height:14px"></i>Actualizar</button>`:''}
          <button class="pill pill-ghost flex-1 flex items-center justify-center gap-1" onclick="closeModal()"><i data-lucide="x" style="width:14px;height:14px"></i>Cerrar</button>
        </div>
      </div>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='modalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();
}

function viewReviewDetail(id){
  const evidence=D.evidence.find(e=>e.id===id);
  if(!evidence)return;
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal fade-in">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">Detalle de Revisión</h2>
        <button onclick="closeModal()" class="pill pill-ghost" style="padding:4px"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="flex flex-col gap-4">
        <div><p style="font-size:12px;color:var(--textm);margin-bottom:4px">Grupo</p><p class="font-medium">${evidence.group}</p></div>
        <div><p style="font-size:12px;color:var(--textm);margin-bottom:4px">Estado Final</p>
          <span class="badge" style="background:${evidence.status==='Completado'?'#d1fae5;color:#059669':'#fee2e2;color:#dc2626'}">${evidence.status}</span>
        </div>
        <div><p style="font-size:12px;color:var(--textm);margin-bottom:4px">Revisado por</p><p class="font-medium">${evidence.reviewed_by||'—'}</p></div>
        <div><p style="font-size:12px;color:var(--textm);margin-bottom:4px">Observaciones</p>
          <div style="background:rgba(6,182,212,.08);padding:10px;border-radius:6px;border-left:2px solid var(--accent);min-height:60px">
            <p style="font-size:13px;color:var(--text);">${evidence.observation||'Sin observaciones'}</p>
          </div>
        </div>
        <div><p style="font-size:12px;color:var(--textm);margin-bottom:4px">Fecha de Revisión</p>
          <p class="font-medium">${evidence.reviewed_at?new Date(evidence.reviewed_at).toLocaleDateString('es-CO'):'—'}</p>
        </div>
      </div>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='modalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();
}

function toggleNotifPanel(){
  const panel=document.getElementById('notifPanel');
  const icon=document.getElementById('notifToggleIcon');
  panel.classList.toggle('hidden');
  icon.style.transform=panel.classList.contains('hidden')?'rotate(0deg)':'rotate(180deg)';
}

// ---- AUTH ----
function showScreen(name){
  document.querySelectorAll('.auth-screen').forEach(s=>s.classList.remove('auth-active'));
  const target=document.getElementById('screen-'+name);
  if(target) target.classList.add('auth-active');
}

let authTimer, authTime=56;
async function startAuthTimer(){
  // Obtener el correo ingresado
  const emailInput = document.getElementById('recoveryEmail');
  const emailVal = (emailInput?.value||'').trim();

  if(!emailVal){
    const countEl = document.getElementById('authCount');
    if(countEl) countEl.textContent = '⚠ Ingresa tu correo primero';
    return;
  }

  // Enviar correo de recuperación con Supabase
  const { error } = await sb.auth.resetPasswordForEmail(emailVal, {
    redirectTo: window.location.origin + '/?recovery=true'
  });

  const countEl = document.getElementById('authCount');
  if(error){
    if(countEl) countEl.textContent = '⚠ Error: ' + error.message;
    return;
  }

  if(countEl) countEl.textContent = '✅ Correo enviado. Revisa tu bandeja.';

  // Iniciar contador para reenvío
  clearInterval(authTimer); authTime=60;
  authTimer=setInterval(()=>{
    authTime--;
    if(countEl) countEl.textContent='Reenviar en: '+authTime+' s';
    if(authTime<=0){
      clearInterval(authTimer);
      if(countEl) countEl.textContent='Reenviar código';
    }
  },1000);
}

function togglePassword(id,icon){
  const input=document.getElementById(id);
  if(input.type==='password'){input.type='text';icon.classList.add('active');}
  else{input.type='password';icon.classList.remove('active');}
}

async function doLogin(){
  const loginScreen=document.getElementById('screen-login');
  const inputs=loginScreen.querySelectorAll('input');
  const emailVal=(inputs[0]?.value||'').trim().toLowerCase();
  const passVal=(inputs[1]?.value||'').trim();

  const btn=loginScreen.querySelector('.auth-btn-primary');
  const originalText=btn.textContent;
  btn.textContent='Entrando...';
  btn.disabled=true;

  function showError(msg){
    btn.textContent=originalText;
    btn.disabled=false;
    const existing=loginScreen.querySelector('.login-error');
    if(existing)existing.remove();
    const err=document.createElement('p');
    err.className='login-error';
    err.style.cssText='color:#ef4444;font-size:13px;text-align:center;margin-top:8px';
    err.textContent=msg;
    btn.insertAdjacentElement('beforebegin',err);
  }

  if(!emailVal||!passVal){
    showError('Por favor ingresa tu correo y contraseña');return;
  }

  // Login con Supabase Auth
  const { data, error } = await sb.auth.signInWithPassword({ email:emailVal, password:passVal });
  if(error){ showError('Correo o contraseña incorrectos'); return; }

  const sbUser = data.user;

  // Leer rol desde tabla users
  const { data: userData } = await sb.from('users').select('*').eq('id', sbUser.id).single();

  // Si no está en tabla users es admin hardcodeado (admin@cleanclass.edu)
  let localUser = userData;
  if(!localUser){
    localUser = D.users.find(u=>u.email.toLowerCase()===emailVal) || {
      id: sbUser.id,
      name: sbUser.email.split('@')[0],
      email: sbUser.email,
      role: 'admin',
      grade: null,
      department: 'Administración',
      phone: '',
      avatar: '👨‍💼'
    };
  }

  currentSession = localUser;
  currentSession.birth_date = localUser.birth_date || null;
  currentSession.avatar_url = localUser.avatar_url || null;
  D._user = {
    name: localUser.name,
    email: localUser.email,
    role: localUser.role==='admin'?t('roleAdmin'):localUser.role==='teacher'?t('roleTeacher'):t('roleStudent'),
    department: localUser.department||'—',
    phone: localUser.phone||'—',
    joinDate: localUser.created_at||'2024-01-15',
    avatar: localUser.avatar||'👤'
  };

  if(isAdmin()) cur='adminPanel';
  else cur='dash';

  document.getElementById('authWrap').style.display='none';
  const lbw=document.getElementById('langBtnWrap');if(lbw)lbw.style.display='none';
  const app=document.getElementById('app');
  app.style.removeProperty('display');
  app.style.display='flex';
  isLoggedOut=false;
  checkResp();
  loadAllData().then(async ()=>{
    render();
    if (typeof initRealtime === 'function') initRealtime();
    // Verificar si el usuario tiene notificaciones activas
    if(currentSession?.fcm_token) {
      setTimeout(initNotifications, 1500);
      setTimeout(updateNotifBtn, 1600);
    } else {
      setTimeout(updateNotifBtn, 500);
    }
  });
}

async function doRegistro(){
  const btn=document.getElementById('btnRegistro');
  const nameVal=(document.getElementById('regName')?.value||'').trim();
  const birthVal=(document.getElementById('regBirth')?.value||'').trim();
  const idNumVal=(document.getElementById('regIdNum')?.value||'').trim();
  const emailVal=(document.getElementById('regEmail')?.value||'').trim();
  const passVal=(document.getElementById('passRegistro')?.value||'').trim();
  const confirmVal=(document.getElementById('passConfirm')?.value||'').trim();
  const errEl=document.getElementById('regError');

  function showRegError(msg){
    if(errEl){errEl.textContent=msg;errEl.style.display='block';}
    if(btn){btn.textContent='Registrarse';btn.disabled=false;}
  }

  if(!nameVal||!emailVal||!passVal||!confirmVal){
    showRegError('Por favor completa todos los campos');return;
  }
  if(passVal.length<6){
    showRegError('La contraseña debe tener mínimo 6 caracteres');return;
  }
  if(passVal!==confirmVal){
    showRegError('Las contraseñas no coinciden');return;
  }
  const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(emailVal)){
    showRegError('Por favor ingresa un correo electrónico válido');return;
  }

  if(btn){btn.textContent='Registrando...';btn.disabled=true;}
  if(errEl) errEl.style.display='none';

  // Crear usuario en Supabase Auth
  const { data, error } = await sb.auth.signUp({
    email: emailVal,
    password: passVal,
    options: { data: { full_name: nameVal } }
  });

  if(error){
    if(error.message.includes('already registered')||error.message.includes('already been registered')){
      showRegError('Este correo ya está registrado. Intenta iniciar sesión.');
    } else {
      showRegError('Error al registrarse: '+error.message);
    }
    return;
  }

  // Guardar datos extras en tabla users
  if(data.user){
    await sb.from('users').insert({
      id: data.user.id,
      name: nameVal,
      email: emailVal,
      birth_date: birthVal||null,
      id_number: idNumVal||null,
      role: 'student',
      avatar: '👤'
    });
  }

  if(btn){btn.textContent='¡Registrado! ✓';btn.classList.add('auth-success');}
  setTimeout(()=>{
    if(btn){btn.textContent='Registrarse';btn.classList.remove('auth-success');btn.disabled=false;}
    showScreen('login');
  },2000);
}

async function doGuardar(){
  const btn=document.getElementById('btnGuardar');
  const pass1=(document.getElementById('passNueva')?.value||'').trim();
  const pass2=(document.getElementById('passNueva2')?.value||'').trim();

  function showErr(msg){
    let err=document.getElementById('guardError');
    if(!err){
      err=document.createElement('p');
      err.id='guardError';
      err.style.cssText='color:#ef4444;font-size:13px;text-align:center;margin-top:8px';
      btn.insertAdjacentElement('beforebegin',err);
    }
    err.textContent=msg;
    if(btn){btn.textContent='Guardar cambio';btn.disabled=false;}
  }

  if(!pass1||!pass2){ showErr('Por favor completa ambos campos'); return; }
  if(pass1.length<6){ showErr('La contraseña debe tener mínimo 6 caracteres'); return; }
  if(pass1!==pass2){ showErr('Las contraseñas no coinciden'); return; }

  if(btn){btn.textContent='Guardando...';btn.disabled=true;}

  const { error } = await sb.auth.updateUser({ password: pass1 });

  if(error){
    showErr('Error: '+error.message);
    return;
  }

  if(btn){btn.textContent='¡Guardado! ✓';btn.classList.add('auth-success');}
  setTimeout(()=>{
    if(btn){btn.textContent='Guardar cambio';btn.classList.remove('auth-success');btn.disabled=false;}
    showScreen('login');
  },2000);
}

function showEmailModal(){
  if(isLoggedOut)return;
  const roleLabel=isAdmin()?t('roleAdmin'):isTeacher()?t('roleTeacher'):t('roleStudent');
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeEmailModal()">
    <div class="modal fade-in" style="max-width:350px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">Mi Cuenta</h2>
        <button onclick="closeEmailModal()" class="pill pill-ghost" style="padding:4px"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="flex flex-col gap-4">
        <div style="background:var(--border);padding:12px;border-radius:8px;text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;margin:0 auto 8px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;border:2px solid var(--accent)">
            ${(currentSession?.avatar_url||D._profileImage)?`<img src="${currentSession?.avatar_url||D._profileImage}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:28px">${currentSession?.avatar||'👤'}</span>`}
          </div>
          <p class="font-bold">${currentSession?.name||''}</p>
          <p style="color:var(--accent);font-size:12px;font-weight:600">${roleLabel}</p>
          ${currentSession?.grade?`<p style="color:var(--textm);font-size:12px;margin-top:4px">Grado: ${currentSession.grade}</p>`:''}
          <p style="color:var(--textm);font-size:12px;margin-top:4px;word-break:break-all">${currentSession?.email||''}</p>
        </div>
        <button class="pill pill-danger w-full flex items-center justify-center gap-2" onclick="confirmLogout()">
          <i data-lucide="log-out" style="width:16px;height:16px"></i>Cerrar Sesión
        </button>
      </div>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='emailModalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();
}

function closeEmailModal(){const w=document.getElementById('emailModalWrap');if(w)w.remove();}

function confirmLogout(){
  closeEmailModal();
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeLogoutModal()">
    <div class="modal fade-in" style="max-width:320px;text-align:center">
      <h2 class="font-bold text-lg mb-2">¿Cerrar Sesión?</h2>
      <p style="color:var(--textm);font-size:14px;margin-bottom:6px">¿Estás seguro de que deseas cerrar sesión?</p>
      <div class="flex gap-2 mt-4">
        <button class="pill pill-ghost flex-1" onclick="closeLogoutModal()">Cancelar</button>
        <button class="pill pill-danger flex-1" onclick="performLogout()">Cerrar Sesión</button>
      </div>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='logoutModalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();
}

function closeLogoutModal(){const w=document.getElementById('logoutModalWrap');if(w)w.remove();}

async function performLogout(){
  closeLogoutModal();
  await sb.auth.signOut();
  isLoggedOut=true;
  currentSession=null;
  D._user=null;
  D._profileImage=null;
  cur='dash';
  document.getElementById('app').style.display='none';
  document.getElementById('authWrap').style.display='flex';
  const lbw=document.getElementById('langBtnWrap');if(lbw)lbw.style.display='block';
  showScreen('login');
  // Limpiar TODOS los campos de auth
  document.querySelectorAll('.auth-input').forEach(i=>i.value='');
  // Resetear botón de login
  const loginBtn=document.querySelector('#screen-login .auth-btn-primary');
  if(loginBtn){loginBtn.textContent='Iniciar sesión';loginBtn.disabled=false;}
}

function updateProfileImage(input){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    D._profileImage=reader.result;
    const img=document.getElementById('profileAvatarImg');
    const emoji=document.getElementById('profileAvatarEmoji');
    if(img){img.src=D._profileImage;}
    else if(emoji){
      const parent=emoji.parentElement;emoji.remove();
      const newImg=document.createElement('img');newImg.id='profileAvatarImg';
      newImg.src=D._profileImage;newImg.style.cssText='width:100%;height:100%;object-fit:cover';
      parent.insertBefore(newImg,parent.firstChild);
    }
    const emailBtn=document.getElementById('emailBtn');
    if(emailBtn)emailBtn.innerHTML=`<img src="${D._profileImage}" style="width:100%;height:100%;object-fit:cover">`;
    const n=document.createElement('div');
    n.style.cssText='position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:14px 18px;border-radius:8px;z-index:999;font-weight:600;font-size:14px';
    n.textContent='✓ Foto de perfil actualizada';
    document.body.appendChild(n);
    setTimeout(()=>n.remove(),2500);
  };
  reader.readAsDataURL(file);
}

// ---- ELEMENT SDK ----
const defaultConfig={app_title:'CleanClass',background_color:'#0f172a',surface_color:'#1e293b',text_color:'#f1f5f9',accent_color:'#06b6d4',secondary_color:'#334155',font_family:'DM Sans',font_size:16};

function applyConfig(c){
  document.documentElement.style.setProperty('--bg',c.background_color||defaultConfig.background_color);
  document.documentElement.style.setProperty('--surface',c.surface_color||defaultConfig.surface_color);
  document.documentElement.style.setProperty('--text',c.text_color||defaultConfig.text_color);
  document.documentElement.style.setProperty('--accent',c.accent_color||defaultConfig.accent_color);
  document.documentElement.style.setProperty('--border',c.secondary_color||defaultConfig.secondary_color);
  document.body.style.background='var(--bg)';document.body.style.color='var(--text)';
  const f=c.font_family||defaultConfig.font_family;
  document.body.style.fontFamily=`${f}, DM Sans, sans-serif`;
  const titleEl=document.getElementById('appTitle');if(titleEl)titleEl.textContent=c.app_title||defaultConfig.app_title;
  if(currentSession)render();
}

if(window.elementSdk){
  window.elementSdk.init({
    defaultConfig,
    onConfigChange:async(c)=>applyConfig(c),
    mapToCapabilities:(c)=>({
      recolorables:[
        {get:()=>c.background_color||defaultConfig.background_color,set:v=>{c.background_color=v;window.elementSdk.setConfig({background_color:v})}},
        {get:()=>c.surface_color||defaultConfig.surface_color,set:v=>{c.surface_color=v;window.elementSdk.setConfig({surface_color:v})}},
        {get:()=>c.text_color||defaultConfig.text_color,set:v=>{c.text_color=v;window.elementSdk.setConfig({text_color:v})}},
        {get:()=>c.accent_color||defaultConfig.accent_color,set:v=>{c.accent_color=v;window.elementSdk.setConfig({accent_color:v})}},
        {get:()=>c.secondary_color||defaultConfig.secondary_color,set:v=>{c.secondary_color=v;window.elementSdk.setConfig({secondary_color:v})}}
      ],
      borderables:[],
      fontEditable:{get:()=>c.font_family||defaultConfig.font_family,set:v=>{c.font_family=v;window.elementSdk.setConfig({font_family:v})}},
      fontSizeable:{get:()=>c.font_size||defaultConfig.font_size,set:v=>{c.font_size=v;window.elementSdk.setConfig({font_size:v})}}
    }),
    mapToEditPanelValues:(c)=>new Map([['app_title',c.app_title||defaultConfig.app_title]])
  });
}

// PASSWORD_RECOVERY se maneja dentro de initApp

// ---- AUTO LOGIN — verifica sesión activa al cargar ----
document.addEventListener('DOMContentLoaded', async function initApp() {
  // Mostrar pantalla de carga
  const loader = document.createElement('div');
  loader.id = 'appLoader';
  loader.style.cssText = 'position:fixed;inset:0;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px;transition:opacity .3s';
  loader.innerHTML = `
    <div style="width:48px;height:48px;border-radius:12px;background:#06b6d4;display:flex;align-items:center;justify-content:center;animation:pulse-glow 1.5s infinite">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    </div>
    <p style="color:#cbd5e1;font-size:14px;font-weight:600;letter-spacing:.3px">Cargando CleanClass...</p>
  `;
  document.body.appendChild(loader);

  function hideLoader() {
    const l = document.getElementById('appLoader');
    if (l) { l.style.opacity = '0'; setTimeout(() => { if (l && l.parentNode) l.remove(); }, 300); }
  }

  // Timeout de seguridad — si después de 5 segundos sigue el loader, quitarlo y mostrar login
  setTimeout(() => {
    const l = document.getElementById('appLoader');
    if (l) {
      hideLoader();
      if (!currentSession) {
        document.getElementById('authWrap').style.display = 'flex';
        const lbw = document.getElementById('langBtnWrap');
        if (lbw) lbw.style.display = 'block';
      }
    }
  }, 5000);

  async function enterApp(session) {
    try {
      const { data: userData } = await sb.from('users').select('*').eq('id', session.user.id).single();
      let localUser = userData;
      if (!localUser) {
        // Verificar si es el admin hardcodeado
        const hardAdmin = D.users.find(u => u.email.toLowerCase() === session.user.email.toLowerCase());
        if (hardAdmin) {
          localUser = hardAdmin;
        } else {
          // Usuario no existe en la tabla users ni es admin — cerrar sesión
          await sb.auth.signOut();
          isLoggedOut = true;
          document.getElementById('authWrap').style.display = 'flex';
          const lbw = document.getElementById('langBtnWrap');
          if (lbw) lbw.style.display = 'block';
          hideLoader();
          showScreen('login');
          return;
        }
      }
      currentSession = localUser;
  currentSession.birth_date = localUser.birth_date || null;
  currentSession.avatar_url = localUser.avatar_url || null;
      D._user = {
        name: localUser.name,
        email: localUser.email,
        role: localUser.role === 'admin' ? t('roleAdmin') : localUser.role === 'teacher' ? t('roleTeacher') : t('roleStudent'),
        department: localUser.department || '—',
        phone: localUser.phone || '—',
        joinDate: localUser.created_at || '2024-01-15',
        avatar: localUser.avatar || '👤'
      };
      if (isAdmin()) cur = 'adminPanel';
      else cur = 'dash';
      document.getElementById('authWrap').style.display = 'none';
      const lbw = document.getElementById('langBtnWrap');
      if (lbw) lbw.style.display = 'none';
      const app = document.getElementById('app');
      app.style.removeProperty('display');
      app.style.display = 'flex';
      isLoggedOut = false;
      checkResp();
      await loadAllData();
      render();
      // Activar actualización en tiempo real
      if (typeof initRealtime === 'function') initRealtime();
    } catch(e) {
      console.error('Error entrando a la app:', e);
    }
  }

  // Verificar si la URL tiene token de recuperación de contraseña
  const urlHash = window.location.hash;
  const isRecovery = urlHash.includes('type=recovery') || urlHash.includes('type=email');

  if (isRecovery) {
    // Es un enlace de recuperación — esperar el evento PASSWORD_RECOVERY
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        hideLoader();
        document.getElementById('authWrap').style.display = 'flex';
        const lbw = document.getElementById('langBtnWrap');
        if (lbw) lbw.style.display = 'block';
        const app = document.getElementById('app');
        if (app) app.style.display = 'none';
        // Limpiar la URL
        history.replaceState(null, '', window.location.pathname);
        showScreen('nueva');
      }
    });
    return;
  }

  // Manejar recuperación de contraseña y cierre de sesión forzado
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      hideLoader();
      document.getElementById('authWrap').style.display = 'flex';
      const lbw = document.getElementById('langBtnWrap');
      if (lbw) lbw.style.display = 'block';
      const app = document.getElementById('app');
      if (app) app.style.display = 'none';
      history.replaceState(null, '', window.location.pathname);
      showScreen('nueva');
      return;
    }

    // Si la sesión se cerró inesperadamente (usuario borrado desde Supabase o Panel Admin)
    if (event === 'SIGNED_OUT' && !isLoggedOut && currentSession) {
      currentSession = null;
      D._user = null;
      isLoggedOut = true;
      const appEl = document.getElementById('app');
      if (appEl) appEl.style.display = 'none';
      const authWrap = document.getElementById('authWrap');
      if (authWrap) authWrap.style.display = 'flex';
      const lbw = document.getElementById('langBtnWrap');
      if (lbw) lbw.style.display = 'block';
      showScreen('login');
      // Mostrar mensaje al usuario
      const msg = document.createElement('div');
      msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#7f1d1d;color:#fecaca;padding:14px 20px;border-radius:10px;z-index:9999;font-size:13px;font-weight:600;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      msg.textContent = '⚠ Tu sesión fue cerrada. Contacta al administrador.';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 5000);
    }
  });

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session && !isLoggedOut) {
      await enterApp(session);
    } else {
      // No hay sesión — mostrar login
      document.getElementById('authWrap').style.display = 'flex';
      const lbw = document.getElementById('langBtnWrap');
      if (lbw) lbw.style.display = 'block';
    }
  } catch(e) {
    console.error('Error verificando sesión:', e);
    document.getElementById('authWrap').style.display = 'flex';
    const lbw = document.getElementById('langBtnWrap');
    if (lbw) lbw.style.display = 'block';
  } finally {
    hideLoader();
  }
});

// ---- GUARDAR HORARIOS ----
async function saveAllSchedules() {
  const grades = [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))];
  for(const grade of grades) {
    const gid = grade.replace(/[°\s]/g,'_');
    const cleanEl = document.getElementById(`clean_${gid}`);
    if(!cleanEl) continue;
    const cleanTime = cleanEl.value || '15:00';
    const existing = D.schedules?.find(s=>s.grade===grade);
    
    if(existing) {
      // Update
      const { error } = await sb.from('schedules').update({ clean_time: cleanTime }).eq('id', existing.id);
      if(error) console.error('Error actualizando horario:', error.message);
    } else {
      // Insert
      const { error } = await sb.from('schedules').insert({ grade, clean_time: cleanTime });
      if(error) console.error('Error insertando horario:', error.message);
    }
  }
  await loadSchedules();
  // Mostrar confirmación
  const n = document.createElement('div');
  n.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:14px 18px;border-radius:8px;z-index:999;font-weight:600;font-size:14px';
  n.textContent = '✅ Horarios guardados';
  document.body.appendChild(n);
  setTimeout(()=>n.remove(), 2500);
  // Reprogramar notificaciones
  initNotifications();
}

// ---- SISTEMA DE NOTIFICACIONES FCM ----
const VAPID_KEY = 'BE-B5i3Vyu89wcEhORXlKe9jH2Pia94LGWoWmMCjfDO4H5kmp6lkuRc_1CZz1b23Q0yodiemNBSs7RmtoWN04v4';

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

async function getFCMToken() {
  try {
    if (!window._fcmMessaging) return null;
    const token = await window._fcmMessaging.getToken({ vapidKey: VAPID_KEY });
    return token;
  } catch(e) {
    console.error('Error FCM token:', e);
    return null;
  }
}

async function scheduleLocalNotification() {
  if (!currentSession) return;
  const grade = getCurrentGrade();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dow = today.getDay();
  if (dow === 0 || dow === 6) return;
  const isNoClass = (D.noClassDays || []).some(x => x.date === todayStr);
  if (isNoClass) return;
  const schedule = D.schedules?.find(s => s.grade === grade) || D.schedules?.[0];
  if (!schedule) return;
  const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const hasEarlyExit = schedule.early_exit_days?.includes(dayNames[dow]);
  const notifTime = hasEarlyExit ? (schedule.early_exit_time || schedule.clean_time) : schedule.clean_time;
  if (!notifTime) return;
  if (window._swReg?.active) {
    window._swReg.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      time: notifTime,
      title: '🧹 ¡Hora del Aseo!',
      body: grade ? `Grado ${grade}: Es hora de hacer el aseo del salón` : 'Es hora de hacer el aseo',
      grade
    });
    console.log(`✅ Notificación programada: ${notifTime}`);
  }
}

async function initNotifications() {
  const granted = await requestNotificationPermission();
  if (!granted) { console.log('Notificaciones no permitidas'); return; }
  const token = await getFCMToken();
  if (token) {
    await sb.from('users').update({ fcm_token: token }).eq('id', currentSession?.id);
    console.log('✅ Token FCM guardado');
  }
  await scheduleLocalNotification();
  if (window._fcmMessaging) {
    window._fcmMessaging.onMessage(payload => {
      const { title, body } = payload.notification || {};
      const n = document.createElement('div');
      n.style.cssText = 'position:fixed;top:20px;right:20px;background:var(--accent);color:#fff;padding:16px 20px;border-radius:12px;z-index:9999;font-weight:600;font-size:14px;max-width:300px;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      n.innerHTML = `<strong>${title||'🧹 CleanClass'}</strong><br><span style="font-weight:400;font-size:13px">${body||'¡Es hora del aseo!'}</span>`;
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 6000);
    });
  }
}

// ---- TOGGLE NOTIFICACIONES ----
async function toggleNotifications() {
  const btn = document.getElementById('btnNotif');
  if (Notification.permission === 'granted') {
    // Desactivar — no hay forma de revocar permiso via JS, guiar al usuario
    if(btn) btn.textContent = '🔕 Notificaciones activas';
    alert('Para desactivar las notificaciones, ve a Configuración del sitio en tu navegador.');
    return;
  }
  if(btn){ btn.textContent = '⏳ Activando...'; btn.disabled = true; }
  await initNotifications();
  if (Notification.permission === 'granted') {
    if(btn){ btn.textContent = '🔕 Desactivar notificaciones'; btn.disabled = false; }
  } else {
    if(btn){ btn.textContent = '🔔 Activar notificaciones'; btn.disabled = false; }
  }
}

// Actualizar estado del botón al cargar
function updateNotifBtn() {
  const btn = document.getElementById('btnNotif');
  if (!btn) return;
  const isActive = Notification.permission === 'granted' && currentSession?.fcm_token;
  btn.innerHTML = isActive 
    ? '<i data-lucide="bell-off" style="width:15px;height:15px"></i> Notificaciones activas'
    : '<i data-lucide="bell" style="width:15px;height:15px"></i> Activar notificaciones';
  btn.style.background = isActive ? 'rgba(34,197,94,.15)' : '';
  btn.style.borderColor = isActive ? 'rgba(34,197,94,.3)' : '';
  btn.style.color = isActive ? '#16a34a' : '';
  if(typeof lucide !== 'undefined') lucide.createIcons();
}
