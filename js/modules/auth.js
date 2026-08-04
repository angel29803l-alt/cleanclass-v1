
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
    // Si el usuario no tiene grado (tabla users no tiene grade),
    // buscarlo en D.students o D.teachers por email
    if(currentSession && !currentSession.grade && currentSession.role!=='admin'){
      const st = D.students.find(s=>s.email===currentSession.email);
      if(st) currentSession.grade = st.grade;
      if(!currentSession.grade){
        const tc = D.teachers.find(t=>t.email===currentSession.email);
        if(tc) currentSession.grade = tc.grade;
      }
    }
    // Si se abrió desde la notificación de aseo, ir directo a Evidencias
    try{
      const params = new URLSearchParams(window.location.search);
      if(params.get('goto')==='evidence'){
        cur = 'evidence';
        history.replaceState({}, '', window.location.pathname);
      }
    }catch(e){}
    render();
    if (typeof initRealtime === 'function') initRealtime();
    if (typeof initAnnouncementsRealtime === 'function') initAnnouncementsRealtime();
    if (typeof initFounders === 'function') initFounders();
    if (typeof initCapacitorNotifications === 'function') initCapacitorNotifications();
    if (typeof clearExpiredEarlyExits === 'function') clearExpiredEarlyExits();
    setTimeout(() => {
      updateNotifBtn();
      if(Notification.permission === 'granted') {
        scheduleLocalNotification().then(() => {});
      }
    }, 800);
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
    if(errEl){
      errEl.textContent=msg;errEl.style.display='block';
      document.querySelectorAll('#screen-registro input').forEach(inp=>{
        inp.addEventListener('input', ()=>{ errEl.style.display='none'; }, {once:true});
      });
    }
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
  if(!isValidEmail(emailVal)){
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

    // Limpiar estado previo del login y prellenar con el correo recién registrado
    const loginScreen=document.getElementById('screen-login');
    if(loginScreen){
      const oldErr=loginScreen.querySelector('.login-error');
      if(oldErr) oldErr.remove();
      const inputs=loginScreen.querySelectorAll('input');
      if(inputs[0]) inputs[0].value=emailVal;
      if(inputs[1]) inputs[1].value='';

      // Mensaje de confirmación de registro exitoso
      const successMsg=document.createElement('p');
      successMsg.className='login-success-msg';
      successMsg.style.cssText='color:#22c55e;font-size:13px;text-align:center;margin-bottom:8px;font-weight:600';
      successMsg.textContent='✓ Cuenta creada correctamente. Ahora inicia sesión.';
      loginScreen.querySelector('.auth-sub')?.insertAdjacentElement('afterend', successMsg);
      setTimeout(()=>successMsg.remove(), 6000);
    }
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

