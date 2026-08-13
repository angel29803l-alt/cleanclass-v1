// ============================================================
// js/modules/excuses.js — Justificación de inasistencias
// El estudiante sube la foto de su excusa; el docente de su grado
// la aprueba (queda "Excusado") o la rechaza (sigue como falta).
// ============================================================

// ---- Detecta las faltas: días con evidencia del grupo donde el alumno no registró ----
function getAbsences(scope){
  // scope: 'mine' (estudiante) | 'grade' (docente/admin)
  const faltas = [];
  const myName = currentSession?.name;
  const myGrade = getCurrentGrade();

  // Fechas en las que cada grupo tuvo aseo (hay evidencia registrada)
  const diasConAseo = {};
  (D.evidence||[]).forEach(e=>{
    if(!e.group || !e.date) return;
    if(!diasConAseo[e.group]) diasConAseo[e.group] = new Set();
    diasConAseo[e.group].add(e.date);
  });

  (D.cleanGroups||[]).forEach(grupo=>{
    if(scope==='grade' && !isAdmin() && grupo.grade !== myGrade) return;
    const fechas = diasConAseo[grupo.name];
    if(!fechas) return;

    (grupo.members||[]).forEach(alumno=>{
      if(scope==='mine' && alumno !== myName) return;

      fechas.forEach(fecha=>{
        const registro = (D.checkins||[]).find(c=>
          c.student===alumno && c.group_name===grupo.name && c.date===fecha
        );
        if(registro) return; // sí asistió

        const excusa = (D.excuses||[]).find(x=>
          x.student===alumno && x.group_name===grupo.name && x.date===fecha
        );

        faltas.push({
          student: alumno,
          group_name: grupo.name,
          grade: grupo.grade,
          date: fecha,
          excuse: excusa || null,
          status: excusa ? excusa.status : 'Sin justificar'
        });
      });
    });
  });

  return faltas.sort((a,b)=> b.date.localeCompare(a.date));
}

// Cantidad de justificaciones esperando revisión (para el contador de la pestaña)
function pendingExcusesCount(){
  if(!isTeacher() && !isAdmin()) return 0;
  return (D.excuses||[]).filter(x=>{
    if(x.status !== 'Pendiente') return false;
    if(isAdmin()) return true;
    return x.grade === getCurrentGrade();
  }).length;
}

// ---- Pantalla principal de la pestaña Asistencias ----
function renderAttendanceTab(){
  const esDocente = isTeacher() || isAdmin();
  const faltas = getAbsences(esDocente ? 'grade' : 'mine');

  const sinJustificar = faltas.filter(f=>f.status==='Sin justificar').length;
  const pendientes    = faltas.filter(f=>f.status==='Pendiente').length;
  const excusadas     = faltas.filter(f=>f.status==='Excusado').length;
  const rechazadas    = faltas.filter(f=>f.status==='Rechazado').length;

  return `
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
    ${[
      {icon:'alert-circle', label:'Sin justificar', val:sinJustificar, color:'#ef4444'},
      {icon:'clock',        label:'Por revisar',    val:pendientes,    color:'#f59e0b'},
      {icon:'check-circle', label:'Excusadas',      val:excusadas,     color:'#059669'},
      {icon:'x-circle',     label:'Rechazadas',     val:rechazadas,    color:'#6b7280'}
    ].map((s,i)=>`
    <div class="kpi-card slide-up" style="animation-delay:${i*0.06}s">
      <div style="width:34px;height:34px;border-radius:9px;background:${s.color}18;display:flex;align-items:center;justify-content:center;margin-bottom:8px">
        <i data-lucide="${s.icon}" style="width:17px;height:17px;color:${s.color}"></i>
      </div>
      <p style="font-size:22px;font-weight:800;color:${s.color};line-height:1">${s.val}</p>
      <p style="font-size:12px;font-weight:600;margin-top:4px">${s.label}</p>
    </div>`).join('')}
  </div>

  <div class="card slide-up" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <h3 class="font-bold">${esDocente?'Inasistencias del grado':'Mis inasistencias'}</h3>
        <p style="font-size:12px;color:var(--textm);margin-top:2px">
          ${esDocente
            ? 'Revisa las justificaciones que suben los estudiantes y aprueba o rechaza.'
            : 'Sube una foto de tu excusa para justificar el día que faltaste.'}
        </p>
      </div>
      <span class="badge-pill badge-pill-teal">${faltas.length} registro${faltas.length===1?'':'s'}</span>
    </div>

    ${faltas.length===0?`
      <div style="padding:40px;text-align:center">
        <i data-lucide="party-popper" style="width:34px;height:34px;color:var(--accent);margin-bottom:10px"></i>
        <p style="color:var(--textm);font-size:14px">
          ${esDocente?'No hay inasistencias registradas en tu grado.':'No tienes inasistencias. ¡Buen trabajo!'}
        </p>
      </div>
    `:`
    <div style="overflow-x:auto"><table class="tbl">
      <thead><tr>
        ${esDocente?'<th>Estudiante</th>':''}
        <th>Fecha</th>
        <th>Grupo</th>
        <th>Estado</th>
        <th>Excusa</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${faltas.map(f=>{
          const badge = {
            'Sin justificar': 'badge-pill-red',
            'Pendiente':      'badge-pill-amber',
            'Excusado':       'badge-pill-green',
            'Rechazado':      'badge-pill-gray'
          }[f.status] || 'badge-pill-gray';

          const icono = {
            'Sin justificar': '✕',
            'Pendiente':      '◷',
            'Excusado':       '✔',
            'Rechazado':      '✕'
          }[f.status] || '';

          return `<tr>
            ${esDocente?`<td style="font-weight:600">${f.student}</td>`:''}
            <td>${formatDateNice(f.date)}</td>
            <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${f.group_name}</span></td>
            <td><span class="badge-pill ${badge}">${icono} ${f.status}</span></td>
            <td>
              ${f.excuse?.image_url
                ? `<button class="pill pill-ghost" style="padding:4px 10px;font-size:11px" onclick="viewExcuseImage('${f.excuse.image_url}')">
                     <i data-lucide="image" style="width:12px;height:12px"></i> Ver
                   </button>`
                : `<span style="color:var(--textm);font-size:12px">—</span>`}
            </td>
            <td style="text-align:right">
              ${renderExcuseActions(f, esDocente)}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

// Botones según quién mira y en qué estado está la falta
function renderExcuseActions(f, esDocente){
  if(esDocente){
    if(f.status === 'Pendiente'){
      return `<div class="flex gap-1" style="justify-content:flex-end">
        <button class="pill pill-success" style="padding:5px 11px;font-size:11px" onclick="reviewExcuse(${f.excuse.id}, 'Excusado')">
          <i data-lucide="check" style="width:12px;height:12px"></i> Excusar
        </button>
        <button class="pill pill-danger" style="padding:5px 11px;font-size:11px" onclick="reviewExcuse(${f.excuse.id}, 'Rechazado')">
          <i data-lucide="x" style="width:12px;height:12px"></i> Rechazar
        </button>
      </div>`;
    }
    if(f.status === 'Excusado' || f.status === 'Rechazado'){
      return `<button class="pill pill-ghost" style="padding:5px 11px;font-size:11px" onclick="reviewExcuse(${f.excuse.id}, 'Pendiente')">
        <i data-lucide="rotate-ccw" style="width:12px;height:12px"></i> Revertir
      </button>`;
    }
    return `<span style="color:var(--textm);font-size:12px">Sin excusa</span>`;
  }

  // Vista del estudiante
  if(f.status === 'Sin justificar' || f.status === 'Rechazado'){
    return `<button class="pill pill-primary" style="padding:5px 12px;font-size:11px"
      onclick="openExcuseModal('${f.group_name}','${f.date}','${f.grade||''}')">
      <i data-lucide="upload" style="width:12px;height:12px"></i> ${f.status==='Rechazado'?'Subir otra':'Justificar'}
    </button>`;
  }
  if(f.status === 'Pendiente'){
    return `<span style="color:var(--textm);font-size:12px">En revisión</span>`;
  }
  return `<span style="color:#16a34a;font-size:12px;font-weight:600">Justificada</span>`;
}

// Fecha en formato legible
function formatDateNice(dateStr){
  try{
    const [a,m,d] = dateStr.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${meses[parseInt(m)-1]} ${a}`;
  }catch(e){ return dateStr; }
}

// ---- Modal para que el estudiante suba su excusa ----
function openExcuseModal(groupName, date, grade){
  const html = `<div class="modal-bg" onclick="if(event.target===this)closeExcuseModal()">
    <div class="modal fade-in" style="max-width:420px">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">Justificar inasistencia</h2>
        <button onclick="closeExcuseModal()" class="pill pill-ghost" style="padding:5px">
          <i data-lucide="x" style="width:17px;height:17px"></i>
        </button>
      </div>

      <div style="padding:10px 14px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:8px;margin-bottom:14px">
        <p style="font-size:12px;color:var(--textm)">Día que faltaste</p>
        <p style="font-weight:700;color:var(--accent)">${formatDateNice(date)} — ${groupName}</p>
      </div>

      <label class="auth-label">Motivo (opcional)</label>
      <textarea id="excuseReason" class="inp mb-3" rows="3" placeholder="Ej: Cita médica, calamidad familiar..."></textarea>

      <label class="auth-label">Foto de la excusa</label>
      <input id="excuseImageInput" type="file" accept="image/*" class="inp mb-2" onchange="previewExcuseImage(this)">
      <img id="excusePreview" style="max-width:100%;max-height:180px;border-radius:8px;margin-bottom:10px;display:none">

      <p id="excuseError" style="color:#ef4444;font-size:12px;margin-bottom:8px;display:none"></p>

      <input type="hidden" id="excuseGroup" value="${groupName}">
      <input type="hidden" id="excuseDate" value="${date}">
      <input type="hidden" id="excuseGrade" value="${grade}">

      <button id="excuseSubmitBtn" class="pill pill-primary w-full" onclick="submitExcuse()">
        <i data-lucide="send" style="width:15px;height:15px"></i> Enviar justificación
      </button>
    </div>
  </div>`;

  let wrap = document.getElementById('excuseModalWrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.id='excuseModalWrap'; document.body.appendChild(wrap); }
  wrap.innerHTML = html;
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExcuseModal(){
  const wrap = document.getElementById('excuseModalWrap');
  if(wrap) wrap.innerHTML = '';
}

function previewExcuseImage(input){
  const file = input.files[0];
  if(!file) return;
  const preview = document.getElementById('excusePreview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
}

async function submitExcuse(){
  const file   = document.getElementById('excuseImageInput').files[0];
  const reason = document.getElementById('excuseReason').value.trim();
  const group  = document.getElementById('excuseGroup').value;
  const date   = document.getElementById('excuseDate').value;
  const grade  = document.getElementById('excuseGrade').value;
  const errEl  = document.getElementById('excuseError');
  const btn    = document.getElementById('excuseSubmitBtn');

  if(!file){
    errEl.textContent = 'Debes subir la foto de tu excusa.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const ok = await saveExcuse({
    student: currentSession?.name,
    group_name: group,
    grade: grade || getCurrentGrade(),
    date: date,
    reason: reason || null
  }, file);

  if(ok){
    closeExcuseModal();
    render();
  } else {
    errEl.textContent = 'No se pudo enviar. Intenta de nuevo.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="send" style="width:15px;height:15px"></i> Enviar justificación';
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// ---- Ver la foto de la excusa en grande ----
function viewExcuseImage(url){
  const html = `<div class="modal-bg" onclick="closeExcuseImage()">
    <div class="modal fade-in" style="max-width:560px;padding:14px">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-base">Excusa</h2>
        <button onclick="closeExcuseImage()" class="pill pill-ghost" style="padding:5px">
          <i data-lucide="x" style="width:17px;height:17px"></i>
        </button>
      </div>
      <img src="${url}" style="width:100%;border-radius:10px">
    </div>
  </div>`;
  let wrap = document.getElementById('excuseImgWrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.id='excuseImgWrap'; document.body.appendChild(wrap); }
  wrap.innerHTML = html;
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExcuseImage(){
  const wrap = document.getElementById('excuseImgWrap');
  if(wrap) wrap.innerHTML = '';
}

// ---- El docente aprueba o rechaza ----
async function reviewExcuse(id, nuevoEstado){
  const ok = await updateExcuseStatus(id, nuevoEstado, currentSession?.name);
  if(ok) render();
}
