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

// ============================================================
// FUNDADORES — gestión y marco animado
// ============================================================
// FUNDADORES — guardados en Supabase para persistir en APK
window._founders = JSON.parse(localStorage.getItem('cc_founders') || '[]');

