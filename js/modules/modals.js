// ============================================================
// modals.js — CleanClass v2.0
// CAMBIO PUNTO 4: Select múltiple de estudiantes desde BD central
// CAMBIO PUNTO 1: Admin Override en grupos
// ============================================================

const formFields={
  students:(mode)=>{
    const base=[
      {k:'name',  l:'Nombre completo'},
      {k:'email', l:'Correo electrónico'},
      {k:'grade', l:'Grado', type:'select', options:()=>
        [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))].sort().map(g=>({id:g,name:g}))
      }
    ];
    if(mode==='add'){
      base.push({k:'password', l:'Contraseña', type:'password'});
    }
    return base;
  },
  teachers:(mode)=>{
    const base=[
      {k:'name',  l:'Nombre completo'},
      {k:'email', l:'Correo electrónico'},
      {k:'grade', l:'Grado a cargo', type:'select', options:()=>
        [...new Set(D.rooms.map(r=>r.grade).filter(Boolean))].sort().map(g=>({id:g,name:g}))
      }
    ];
    // La contraseña solo se pide al crear el docente (no al editar)
    if(mode==='add'){
      base.push({k:'password', l:'Contraseña', type:'password'});
    }
    return base;
  },
  rooms:[
    {k:'name',l:'Nombre del Salón'},
    {k:'capacity',l:'Capacidad',type:'number'},
    {k:'grade',l:'Grado'}
  ],
  cleanGroups:()=>{
    const defaultGrades = ['6°1','6°2','7°1','7°2','8°1','8°2','9°1','9°2','10°1','10°2','11°1','11°2'];
    const roomGrades = D.rooms.map(r=>r.grade).filter(Boolean);
    const allG = [...new Set([...defaultGrades, ...roomGrades])].sort();
    const gradeOpts = isAdmin()
      ? allG.map(g=>({id:g,name:g}))
      : [{id:getCurrentGrade(),name:getCurrentGrade()}];

    const baseFields = [
      {k:'name', l:'Nombre del Grupo'},
      {k:'grade', l:'Grado', type:'select', options:()=>gradeOpts},
      {k:'color', l:'Color del Grupo', type:'color'}
    ];

    if(assignmentMode==='daily'){
      return [
        ...baseFields.filter(Boolean).slice(0, isAdmin() ? 2 : 1),
        {k:'day', l:'Día de la Semana', type:'select', options:()=>{
          return ['Lunes','Martes','Miércoles','Jueves','Viernes'].map(d=>({id:d,name:d}));
        }},
        {k:'members', l:'Miembros del Grupo', type:'multiselect'},
        baseFields[2]
      ];
    } else {
      return [
        ...baseFields.filter(Boolean).slice(0, isAdmin() ? 2 : 1),
        {k:'members', l:'Miembros del Grupo', type:'multiselect'},
        baseFields[2]
      ];
    }
  },
  evidence:[
    {k:'group', l:'Grupo', type:'select', options:()=>{
      const myGrade=getCurrentGrade();
      const groups = isAdmin() ? D.cleanGroups : D.cleanGroups.filter(g=>!myGrade||g.grade===myGrade);
      return groups.map(g=>({id:g.id,name:g.name}));
    }},
    {k:'student', l:'Tu Nombre'},
    {k:'image', l:'Foto de la Limpieza', type:'file'}
  ],
  incidents:[
    {k:'type',l:'Tipo de Incidente',type:'select',options:()=>[
      {id:1,name:'Suciedad'},{id:2,name:'Daño a Mueble'},
      {id:3,name:'Material Faltante'},{id:4,name:'Otros'}
    ]},
    {k:'description',l:'Descripción'},
    {k:'location',l:'Salón',type:'select',options:()=>D.rooms.map(r=>({id:r.name,name:r.name}))},
    {k:'priority',l:'Prioridad',type:'select',options:()=>[
      {id:1,name:'Baja'},{id:2,name:'Media'},{id:3,name:'Alta'}
    ]},
    {k:'image',l:'Foto del incidente (opcional)',type:'camera'}
  ]
};

// ---- RENDER DE CAMPO MULTISELECT (PUNTO 4) ----
function renderMultiSelect(fieldKey, label, selectedMembers, gradeValue){
  const grade = gradeValue || getCurrentGrade();
  const studentNames = getStudentNamesByGrade(grade);
  const sel = selectedMembers || [];
  return `
  <div id="field-${fieldKey}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <label class="text-sm font-medium" style="color:var(--textm)">${label}</label>
      <div style="display:flex;gap:6px">
        <button type="button" onclick="selectAllMembers()" class="btn btn-s" style="padding:3px 8px;font-size:11px">
          Todos
        </button>
        <button type="button" onclick="clearAllMembers()" class="btn" style="padding:3px 8px;font-size:11px;background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3)">
          Limpiar
        </button>
      </div>
    </div>
    <div id="multiSelectWrap" style="border:1.5px solid #1d4ed8;border-radius:10px;overflow:hidden;background:#0b1d35;max-height:200px;overflow-y:auto">
      ${studentNames.length > 0
        ? studentNames.map(name => `
          <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(59,130,246,.1);transition:background .15s"
            onmouseover="this.style.background='rgba(59,130,246,.15)'"
            onmouseout="this.style.background='transparent'">
            <input type="checkbox" name="member_cb" value="${name}"
              ${sel.includes(name)?'checked':''}
              style="width:16px;height:16px;accent-color:#06b6d4;cursor:pointer">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;flex-shrink:0">
              ${name.charAt(0)}
            </div>
            <span style="font-size:13px;color:#bfdbfe;font-weight:500">${name}</span>
          </label>`).join('')
        : `<p style="text-align:center;padding:20px;color:var(--textm);font-size:13px">No hay estudiantes en este grado</p>`
      }
    </div>
    <p id="memberCount" style="font-size:11px;color:var(--textm);margin-top:6px;text-align:right">
      ${sel.length} seleccionados
    </p>
  </div>`;
}

function selectAllMembers(){
  document.querySelectorAll('input[name="member_cb"]').forEach(cb=>{cb.checked=true;});
  updateMemberCount();
}
function clearAllMembers(){
  document.querySelectorAll('input[name="member_cb"]').forEach(cb=>{cb.checked=false;});
  updateMemberCount();
}
function updateMemberCount(){
  const count=document.querySelectorAll('input[name="member_cb"]:checked').length;
  const el=document.getElementById('memberCount');
  if(el) el.textContent=count+' seleccionados';
}

function openModal(mode,col,id){
  let fields=formFields[col];
  if(typeof fields==='function') fields=fields(mode);
  if(!fields){
    console.error('openModal: no hay formFields para "'+col+'"');
    alert('Error: formulario no configurado para "'+col+'". Revisa la consola.');
    return;
  }
  let item={};
  if(mode==='edit'){
    const found=D[col].find(x=>x.id===id);
    if(!found) return;
    item={...found};
  }

  const modalTitle = col==='incidents'
    ? (mode==='add'?t('reportIncident'):t('edit'))
    : mode==='add'?t('add'):t('edit');

  // ---- ADMIN OVERRIDE BADGE (PUNTO 1) ----
  const adminOverrideBadge = (col==='cleanGroups' && (isAdmin()||isTeacher()))
    ? `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:8px;margin-bottom:12px">
        <i data-lucide="shield-check" style="width:14px;height:14px;color:var(--accent)"></i>
        <span style="font-size:11px;color:var(--accent);font-weight:600">${isAdmin()?'Admin Override activo — Edición total':'Modo Docente — Puedes editar este grupo manualmente'}</span>
       </div>`
    : '';

  const html=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal fade-in" style="max-width:480px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">${modalTitle}</h2>
        <button onclick="closeModal()" class="btn btn-s" style="padding:4px">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
      </div>
      ${adminOverrideBadge}
      <form id="modalForm" class="flex flex-col gap-3">
        ${fields.map(f=>{
          if(f.type==='multiselect'){
            return renderMultiSelect(f.k, f.l, item.members||[], item.grade||getCurrentGrade());
          }else if(f.type==='color'){
            return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <input type="color" class="inp mt-1" name="${f.k}" value="${item[f.k]||'#06b6d4'}" style="padding:4px;cursor:pointer"></div>`;
          }else if(f.type==='select'){
            const opts=f.options?.();
            return `<div id="field-${f.k}"><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <select class="inp mt-1" name="${f.k}" required onchange="onGradeSelectChange(this)">
                <option value="">Selecciona una opción</option>
                ${opts?.map(o=>`<option value="${o.name}" ${item[f.k]===o.name?'selected':''}>${o.name}</option>`).join('')||''}
              </select></div>`;
          }else if(f.type==='file'){
            return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <input type="file" class="inp mt-1" name="${f.k}" accept="image/*" ${col==='evidence'?'required':''} style="padding:8px">
              <p style="font-size:11px;color:var(--textm);margin-top:4px">JPG o PNG, máximo 5MB</p></div>`;
          }else if(f.type==='camera'){
            return `<div>
              <label class="text-sm font-medium" style="color:var(--textm);display:block;margin-bottom:6px">${f.l}</label>
              <label style="display:block;width:100%;height:140px;border-radius:10px;background:rgba(6,182,212,.05);border:2px dashed rgba(6,182,212,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:8px;position:relative" id="incidentPhotoPreview">
                <i data-lucide="camera" style="width:28px;height:28px;color:var(--accent)"></i>
                <p style="font-size:12px;color:var(--textm)">Toca para tomar foto</p>
                <input type="file" accept="image/*" capture="environment" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%" onchange="previewIncidentPhoto(this)">
              </label>
            </div>`;
          }else if(f.type==='number'){
            return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <input class="inp mt-1" name="${f.k}" type="number" value="${item[f.k]||''}" required></div>`;
          }else if(f.type==='password'){
            return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <input class="inp mt-1" name="${f.k}" type="password" autocomplete="new-password" minlength="6" placeholder="Mínimo 6 caracteres" required></div>`;
          }else{
            return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <input class="inp mt-1" name="${f.k}" type="text" value="${(item[f.k]||'').toString().replace(/"/g,'&quot;')}" required></div>`;
          }
        }).join('')}

        ${col==='incidents'&&mode==='edit'&&(isAdmin()||isTeacher())?`
          <div><label class="text-sm font-medium" style="color:var(--textm)">Estado del Incidente</label>
            <select class="inp mt-1" name="status" required>
              <option value="Abierto" ${item.status==='Abierto'?'selected':''}>Abierto</option>
              <option value="En Proceso" ${item.status==='En Proceso'?'selected':''}>En Proceso</option>
              <option value="Resuelto" ${item.status==='Resuelto'?'selected':''}>Resuelto</option>
            </select>
          </div>
          <div><label class="text-sm font-medium" style="color:var(--textm)">Notas/Observaciones</label>
            <textarea class="inp mt-1" name="notes" style="resize:vertical;min-height:80px;padding:10px">${item.notes||''}</textarea>
          </div>`
        :col==='incidents'&&mode==='add'?`
          <div><label class="text-sm font-medium" style="color:var(--textm)">Reportado por</label>
            <input class="inp mt-1" name="reporter" type="text" value="${currentSession?currentSession.name:''}" required>
          </div>`:''}

        <button type="submit" class="btn btn-p mt-2 w-full slide-up">
          ${col==='incidents'?mode==='add'?t('reportIncident'):t('edit'):col==='evidence'?t('uploadEvidence'):t('save')}
        </button>
      </form>
    </div>
  </div>`;

  const d=document.createElement('div');
  d.id='modalWrap';
  d.innerHTML=html;
  document.body.appendChild(d);
  lucide.createIcons();

  // Listener para actualizar contador de multiselect
  document.querySelectorAll('input[name="member_cb"]').forEach(cb=>{
    cb.addEventListener('change', updateMemberCount);
  });

  document.getElementById('modalForm').onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const obj={};

    if(col==='evidence'){
      obj.group=fd.get('group');
      obj.student=fd.get('student');
      obj.date=new Date().toISOString().split('T')[0];
      obj.status='Pendiente';
      obj.compliant=false; // booleano de cumplimiento (PUNTO 3)
      obj.image=null;
      obj.reviewed_by=null;
      obj.observation=null;
      obj.reviewed_at=null;

      const file=fd.get('image');
      if(file&&file.size>0){
        obj.id=nid();
        D[col].push(obj);
        closeModal();
        saveEvidenceWithImage(obj, file).then(()=>render());
        return;
      }else if(mode==='edit'&&item.image){
        obj.image=item.image;
      }
    }else if(col==='incidents'){
      obj.type=fd.get('type');
      obj.description=fd.get('description');
      obj.location=fd.get('location');
      obj.priority=fd.get('priority');
      obj.grade=getCurrentGrade();
      if(mode==='add'){
        obj.date=new Date().toISOString().split('T')[0];
        obj.reporter=fd.get('reporter');
        obj.status='Abierto';
        obj.assigned_to='Por Asignar';
        obj.resolution_date=null;
        obj.notes='';
        obj.grade=getCurrentGrade();

        // Manejar foto del incidente
        const imgFile = typeof _incidentPhotoFile !== 'undefined' ? _incidentPhotoFile : null;
        if(imgFile){
          (async()=>{
            const ext = imgFile.name.split('.').pop();
            const fileName = `incidente_${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('evidencias').upload(fileName, imgFile, {upsert:true});
            if(!upErr){
              const { data } = sb.storage.from('evidencias').getPublicUrl(fileName);
              obj.image = data.publicUrl;
            }
            _incidentPhotoFile = null;
            if(mode==='add'){obj.id=nid();D[col].push(obj);}
            saveIncident(obj);
            closeModal(); render();
          })();
          return;
        }
      }else{
        obj.status=(isAdmin()||isTeacher())?fd.get('status'):item.status;
        obj.notes=(isAdmin()||isTeacher())?fd.get('notes'):item.notes;
        obj.date=item.date;
        obj.reporter=item.reporter;
        obj.assigned_to=item.assigned_to;
        obj.resolution_date=item.resolution_date;
      }
    }else{
      fields.forEach(f=>{
        if(f.type==='file'||f.type==='radio'||f.type==='multiselect'||f.type==='camera'||f.type==='password') return;
        obj[f.k]=f.type==='number'?Number(fd.get(f.k)):fd.get(f.k);
      });
      if(col==='cleanGroups'){
        obj.frequency=assignmentMode;
        if(assignmentMode==='daily') obj.day=fd.get('day');
        // PUNTO 4: leer miembros del multiselect
        obj.members=[...document.querySelectorAll('input[name="member_cb"]:checked')].map(cb=>cb.value);
        if(!obj.color) obj.color='#06b6d4';
        if(!isAdmin()) obj.grade=getCurrentGrade();
      }
    }

    if(mode==='add'){obj.id=nid();D[col].push(obj);}
    else{const idx=D[col].findIndex(x=>x.id===id);if(idx>=0){obj.id=id;Object.assign(D[col][idx],obj);}}

    // ---- DOCENTES: crea usuario en Supabase Auth + guarda en tabla teachers ----
    if(col==='teachers'){
      if(mode==='add'){
        const password=fd.get('password');
        const submitBtn=e.target.querySelector('button[type="submit"]');
        if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Creando...';}
        createTeacherWithAuth(obj, password).then(ok=>{
          closeModal(); render();
        });
      }else{
        saveTeacher(obj);
        closeModal(); render();
      }
      return;
    }

    // ---- ESTUDIANTES: crea usuario en Supabase Auth + guarda en tabla students ----
    if(col==='students'){
      if(mode==='add'){
        const password=fd.get('password');
        const submitBtn=e.target.querySelector('button[type="submit"]');
        if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Creando...';}
        createStudentWithAuth(obj, password).then(()=>{
          closeModal(); render();
        });
      }else{
        saveStudent(obj);
        closeModal(); render();
      }
      return;
    }

    // Guardar en Supabase
    if(col==='cleanGroups') saveCleanGroup(obj);
    else if(col==='evidence') saveEvidence(obj);
    else if(col==='incidents') saveIncident(obj);
    else if(col==='rooms') saveRoom(obj);
    else if(col==='students') saveStudent(obj);
    closeModal(); render();
  };
}

// Cuando cambia el grado en el select, actualizar el multiselect de miembros
function onGradeSelectChange(sel){
  if(sel.name !== 'grade') return;
  const wrap = document.getElementById('field-members');
  if(!wrap) return;
  const grade = sel.value;
  const currentChecked = [...document.querySelectorAll('input[name="member_cb"]:checked')].map(cb=>cb.value);
  wrap.innerHTML = renderMultiSelect('members','Miembros del Grupo', currentChecked, grade);
  document.querySelectorAll('input[name="member_cb"]').forEach(cb=>{
    cb.addEventListener('change', updateMemberCount);
  });
}

function closeModal(){
  const w=document.getElementById('modalWrap');
  if(w) w.remove();
}

// ---- ADMIN MODAL (students & teachers) ----
function openAdminModal(type, id){
  const isEdit = typeof id !== 'undefined';
  let item = {};
  if(isEdit){
    if(type==='student') item={...D.students.find(s=>s.id===id)||{}};
    else item={...D.teachers.find(t=>t.id===id)||{}};
  }
  // Grados fijos + los que vienen de salones
  const defaultGrades = ['6°1','6°2','7°1','7°2','8°1','8°2','9°1','9°2','10°1','10°2','11°1','11°2'];
  const roomGrades = D.rooms.map(r=>r.grade).filter(Boolean);
  const allGrades = [...new Set([...defaultGrades, ...roomGrades])].sort();

  const fields = type==='student'
    ? [
        {k:'name',   l:'Nombre completo', v:item.name||''},
        {k:'grade',  l:'Grado',           v:item.grade||'', type:'select', opts:allGrades},
        {k:'email',  l:'Email',           v:item.email||'', inputType:'email'},
        ...(!isEdit ? [{k:'password', l:'Contraseña', v:'', inputType:'password'}] : [])
      ]
    : [
        {k:'name',       l:'Nombre completo',  v:item.name||''},
        {k:'subject',    l:'Materia',          v:item.subject||''},
        {k:'grade',      l:'Grado asignado',   v:item.grade||'', type:'select', opts:allGrades},
        {k:'email',      l:'Email',            v:item.email||'', inputType:'email'},
        ...(!isEdit ? [{k:'password', l:'Contraseña', v:'', inputType:'password'}] : [])
      ];

  const html=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal fade-in">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">${isEdit?'Editar':'Agregar'} ${type==='student'?t('students'):t('teachers')}</h2>
        <button onclick="closeModal()" class="btn btn-s" style="padding:4px"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:8px;margin-bottom:12px">
        <i data-lucide="database" style="width:14px;height:14px;color:var(--accent)"></i>
        <span style="font-size:11px;color:var(--accent);font-weight:600">Base de Datos Centralizada — CleanClass v2.0</span>
      </div>
      <form id="adminModalForm" class="flex flex-col gap-3">
        ${fields.map(f=>{
          if(f.type==='select'){
            return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
              <select class="inp mt-1" name="${f.k}" required>
                <option value="">Selecciona grado</option>
                ${f.opts.map(g=>`<option value="${g}" ${f.v===g?'selected':''}>${g}</option>`).join('')}
              </select></div>`;
          }
          return `<div><label class="text-sm font-medium" style="color:var(--textm)">${f.l}</label>
            <input class="inp mt-1" name="${f.k}" type="${f.inputType||'text'}" value="${f.v}" autocomplete="${f.inputType==='password'?'new-password':f.inputType==='email'?'off':'off'}" required></div>`;
        }).join('')}
        <button type="submit" class="btn btn-p mt-2 w-full">${isEdit?t('save'):'Agregar'}</button>
      </form>
    </div>
  </div>`;
  const d=document.createElement('div');d.id='modalWrap';d.innerHTML=html;document.body.appendChild(d);
  lucide.createIcons();

  document.getElementById('adminModalForm').onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const obj={};
    fields.forEach(f=>obj[f.k]=fd.get(f.k));
    if(isEdit){
      const col=type==='student'?'students':'teachers';
      const idx=D[col].findIndex(x=>x.id===id);
      if(idx>=0){obj.id=id;Object.assign(D[col][idx],obj);}
    }else{
      obj.id=nid();
      obj.status='active';
      obj.joinDate=new Date().toISOString().split('T')[0];
      if(type==='student') D.students.push(obj);
      else D.teachers.push(obj);
    }
    // Guardar en Supabase
    if(type==='student') {
      if(!isEdit && obj.password) {
        (async () => {
          const { data: signUpData, error: signUpError } = await sb.auth.signUp({
            email: obj.email,
            password: obj.password,
            options: { data: { full_name: obj.name } }
          });
          if (signUpError && !signUpError.message.includes('already registered')) {
            showDbError('estudiante', signUpError.message);
            return;
          }
          const userId = signUpData?.user?.id;
          if (userId) {
            await sb.from('users').insert({
              id: userId,
              name: obj.name,
              email: obj.email,
              role: 'student',
              avatar: '👤',
              status: 'active'
            });
          }
          delete obj.password;
          await saveStudent(obj);
          closeModal(); render();
        })();
      } else {
        delete obj.password;
        saveStudent(obj);
        closeModal(); render();
      }
    } else {
      // Para docentes nuevos, crear en Supabase Auth
      if(!isEdit && obj.password) {
        (async () => {
          const { data: signUpData, error: signUpError } = await sb.auth.signUp({
            email: obj.email,
            password: obj.password,
            options: { data: { full_name: obj.name, role: 'teacher' } }
          });

          if (signUpError && !signUpError.message.includes('already registered')) {
            showDbError('docente', signUpError.message);
            return;
          }

          // Guardar en tabla users con rol teacher
          const userId = signUpData?.user?.id;
          if (userId) {
            await sb.from('users').upsert({
              id: userId,
              name: obj.name,
              email: obj.email,
              role: 'teacher',
              avatar: '👩‍🏫',
              status: 'active'
            });
          }

          delete obj.password;
          await saveTeacher(obj);
          closeModal(); render();
        })();
      } else {
        delete obj.password;
        saveTeacher(obj);
        closeModal(); render();
      }
    }
  };
}

async function delAdmin(col, id){
  if(col==='students'){
    // Guardar email ANTES de filtrar
    const student = D.students.find(s=>s.id===id);
    const email = student?.email;
    D.students = D.students.filter(x=>x.id!==id);
    await deleteStudent(id);
    // El trigger borra de auth.users automáticamente
    if(email) await sb.from('users').delete().eq('email', email);
  } else if(col==='teachers'){
    const teacher = D.teachers.find(t=>t.id===id);
    const email = teacher?.email;
    D.teachers = D.teachers.filter(x=>x.id!==id);
    await deleteTeacher(id);
    if(email) await sb.from('users').delete().eq('email', email);
  } else if(col==='rooms'){
    D.rooms = D.rooms.filter(x=>x.id!==id);
    await deleteRoom(id);
  }
  render();
}

let pendingDel=null;
function del(col,id){
  if(pendingDel&&pendingDel.col===col&&pendingDel.id===id){
    D[col]=D[col].filter(x=>x.id!==id);
    // Eliminar en Supabase
    if(col==='cleanGroups') deleteCleanGroup(id);
    else if(col==='incidents') deleteIncident(id);
    pendingDel=null;render();return;
  }
  pendingDel={col,id};
  const btn=event.currentTarget;
  btn.innerHTML='<span style="font-size:11px">¿Seguro?</span>';
  btn.classList.remove('btn-d');btn.classList.add('btn-p');
  setTimeout(()=>{pendingDel=null;render();},2500);
}

function changeAssignmentMode(mode){
  assignmentMode=mode;
  render();
}

function bindEvents(){
  document.querySelectorAll('.validation-btn').forEach(btn=>{
    btn.onclick=async e=>{
      e.preventDefault();
      const evidenceId=btn.dataset.id;
      const action=btn.dataset.action;
      const obs=document.getElementById(`obs-${evidenceId}`);
      const observation=obs?.value||'';
      const evidence=D.evidence.find(ev=>String(ev.id)===String(evidenceId));
      if(!evidence){ console.error('Evidencia no encontrada:', evidenceId); return; }

      const newStatus=action==='approve'?'Completado':'Rechazado';
      const reviewedBy=currentSession?.name||'Docente';

      // Actualizar directamente en Supabase solo los campos de validación
      const { error } = await sb.from('evidence')
        .update({
          status: newStatus,
          compliant: action==='approve',
          reviewed_by: reviewedBy,
          observation: observation,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', evidenceId);

      if(error){
        console.error('❌ Error al guardar validación:', error.message, error.details);
        const n=document.createElement('div');
        n.style.cssText='position:fixed;top:20px;right:20px;background:#7f1d1d;color:#fecaca;padding:14px 18px;border-radius:10px;z-index:9999;font-size:13px;font-weight:600';
        n.textContent='⚠ Error al guardar: '+error.message;
        document.body.appendChild(n);
        setTimeout(()=>n.remove(),5000);
        return;
      }

      // Actualizar local y re-renderizar
      evidence.status=newStatus;
      evidence.compliant=action==='approve';
      evidence.reviewed_by=reviewedBy;
      evidence.observation=observation;
      evidence.reviewed_at=new Date().toISOString();
      await loadEvidence();
      render();
    };
  });

  document.querySelectorAll('.quality-btn').forEach(btn=>{
    btn.onclick=e=>{
      e.preventDefault();
      document.querySelectorAll('.quality-btn[data-id="'+btn.dataset.id+'"]').forEach(b=>{
        b.style.background='transparent';b.style.color='var(--textm)';b.style.borderColor='var(--border)';
      });
      btn.style.background='var(--accent)';
      btn.style.color='#fff';
      btn.style.borderColor='var(--accent)';
    };
  });
}
