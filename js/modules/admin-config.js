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
    <p style="color:var(--textm);font-size:13px;margin-bottom:16px">Ajusta los horarios de aseo, los días sin clase, los salones y el Centro de Ayuda</p>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
    ${tabBtn('schedules','Horarios','clock')}
    ${tabBtn('rooms','Salones','door-open')}
    ${tabBtn('help','Ayuda','help-circle')}
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

  // ── TAB: AYUDA ──
  if(ct==='help'){
    html+=renderHelpConfig();
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
// ============================================================
// CENTRO DE AYUDA — gestión admin + vista pública (FAQ)
// ============================================================

// --- Vista admin: lista de temas con editar/borrar ---
// --- Control del asistente de 2 pasos: título → contenido → finalizar ---
function startNewHelpTopic(){
  window._helpWizardStep='title';
  window._helpWizardTopicId=null;
  render();
}

async function confirmHelpWizardTitle(){
  const input = document.getElementById('helpWizardTitleInput');
  const err = document.getElementById('helpWizardError');
  const title = input.value.trim();
  if(!title){ err.textContent='Escribe un título.'; err.style.display='block'; return; }

  const created = await createHelpTopic(title, D.helpTopics.length);

  if(!created){
    err.textContent='No se pudo crear el tema. Revisa la conexión o el mensaje de error arriba a la derecha.';
    err.style.display='block';
    return;
  }

  window._helpWizardTopicId = created.id;
  window._helpWizardStep = 'body';
  render();
}

function editHelpTopicWizard(id){
  window._helpWizardTopicId = id;
  window._helpWizardStep = 'body';
  render();
}

async function finalizeHelpTopic(){
  const rawBody = document.getElementById('helpPagesContainer').innerHTML.trim();
  // Guardamos las páginas como no-editables (el modo edición se re-activa solo al volver a abrir el tema)
  const body = rawBody.replace(/class="help-page" contenteditable="true"/g, 'class="help-page" contenteditable="false"');
  const topic = D.helpTopics.find(h=>h.id===window._helpWizardTopicId);
  if(!topic){
    alert('No se encontró el tema (probablemente no se creó bien en el Paso 1). Cancelá y empezá de nuevo.');
    return;
  }
  const ok = await updateHelpTopic(topic.id, { title: topic.title, body, sort_order: topic.sort_order });

  if(!ok){
    alert('No se pudo guardar. Revisa el mensaje de error arriba a la derecha (probablemente un problema de conexión con Supabase).');
    return;
  }

  window._helpWizardStep = null;
  window._helpWizardTopicId = null;
  render();
}

// --- Herramientas del editor de páginas (barra de texto) ---
function saveHelpSelection(){
  const sel = window.getSelection();
  if(sel.rangeCount>0){
    window._helpSavedRange = sel.getRangeAt(0).cloneRange();
  }
}

function applyHelpFontSize(px){
  if(!px || !window._helpSavedRange) return;
  const range = window._helpSavedRange;
  if(range.collapsed) return;
  try{
    const span=document.createElement('span');
    span.style.fontSize=px;
    range.surroundContents(span);
  }catch(err){
    console.warn('No se pudo aplicar el tamaño a esa selección (cruza varios elementos).');
  }
}

function applyHelpPageColor(color){
  const page = window._helpActivePage || document.querySelector('#helpPagesContainer .help-page');
  if(page) page.style.background = color;
}

function applyHelpTextColor(color){
  if(!window._helpSavedRange) return;
  const range = window._helpSavedRange;
  if(range.collapsed) return;
  try{
    const span=document.createElement('span');
    span.style.color=color;
    range.surroundContents(span);
  }catch(err){
    console.warn('No se pudo aplicar el color a esa selección (cruza varios elementos).');
  }
}

// --- Páginas del editor (como hojas de Word) ---
function addHelpPage(){
  const container=document.getElementById('helpPagesContainer');
  const div=document.createElement('div');
  div.className='help-page';
  div.contentEditable='true';
  div.style.cssText='position:relative;width:700px;max-width:100%;min-height:990px;margin:0 auto 20px;background:#fff;color:#111;border:1px solid var(--border);border-radius:4px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,.25)';
  div.addEventListener('focus', ()=>{ window._helpActivePage = div; });
  div.addEventListener('mouseup', saveHelpSelection);
  div.addEventListener('keyup', saveHelpSelection);
  container.appendChild(div);
  window._helpActivePage = div;
  div.focus();
  div.scrollIntoView({behavior:'smooth', block:'nearest'});
}

// --- Insertar imagen flotante: se puede mover y agrandar/achicar libremente ---
async function insertHelpFloatingImage(input){
  const file = input.files[0];
  if(!file) return;
  const activePage = window._helpActivePage || document.querySelector('#helpPagesContainer .help-page');
  if(!activePage){ alert('Agrega una página primero.'); return; }

  const url = await uploadHelpImage(file, document.getElementById('helpTopicId').value || Date.now());
  if(!url){ alert('No se pudo subir la imagen.'); input.value=''; return; }

  const box=document.createElement('div');
  box.className='help-img-box';
  box.setAttribute('contenteditable','false');
  box.setAttribute('onmousedown','startHelpImgDrag(event,this)');
  box.style.cssText='position:absolute;left:24px;top:24px;width:220px;height:160px;resize:both;overflow:hidden;cursor:move;border-radius:6px;border:1px solid #ccc';
  box.innerHTML=`<img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none">`;
  activePage.appendChild(box);
  input.value='';
}

// Marca visualmente qué imagen está seleccionada, para poder borrarla desde la barra
function selectHelpImage(el){
  document.querySelectorAll('.help-img-box').forEach(b=>b.style.outline='none');
  el.style.outline='3px solid #06b6d4';
  window._helpSelectedImgBox = el;
}

function removeSelectedHelpImage(){
  if(!window._helpSelectedImgBox){
    alert('Primero tocá la imagen que querés quitar.');
    return;
  }
  window._helpSelectedImgBox.remove();
  window._helpSelectedImgBox = null;
}

// Arrastrar una imagen flotante a cualquier parte de la página (sin salirse de ella)
function startHelpImgDrag(e, el){
  if(e.target.closest && e.target.closest('.help-img-remove-btn')) return; // dejar que el botón ✕ funcione

  selectHelpImage(el);

  const rect = el.getBoundingClientRect();
  const isResizeZone = (e.clientX > rect.right-18) && (e.clientY > rect.bottom-18);
  if(isResizeZone) return; // esa esquina la usa el navegador para cambiar el tamaño

  e.preventDefault();
  const page = el.closest('.help-page');
  const startX=e.clientX, startY=e.clientY;
  const startLeft=el.offsetLeft, startTop=el.offsetTop;

  function onMove(ev){
    let nl = startLeft + (ev.clientX-startX);
    let nt = startTop + (ev.clientY-startY);
    nl = Math.max(0, Math.min(nl, page.clientWidth-el.offsetWidth));
    nt = Math.max(0, Math.min(nt, page.clientHeight-el.offsetHeight));
    el.style.left = nl+'px';
    el.style.top = nt+'px';
  }
  function onUp(){
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

async function cancelHelpWizard(){
  // Si ya se había creado el tema (paso 2) y se cancela, lo borramos para no dejar temas vacíos
  if(window._helpWizardStep==='body' && window._helpWizardTopicId){
    const topic = D.helpTopics.find(h=>h.id===window._helpWizardTopicId);
    if(topic && !topic.body){
      await deleteHelpTopic(topic.id);
    }
  }
  window._helpWizardStep = null;
  window._helpWizardTopicId = null;
  render();
}

function renderHelpConfig(){
  const step = window._helpWizardStep;

  // ---- PASO 1: solo el título ----
  if(step==='title'){
    return `
    <div class="card" style="background:var(--surface);padding:24px;max-width:520px;margin:0 auto">
      <h2 class="font-bold text-lg mb-4"><i data-lucide="help-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px"></i>Nuevo Tema — Paso 1 de 2</h2>
      <label class="auth-label">Título</label>
      <input id="helpWizardTitleInput" class="inp mb-4" placeholder="Ej: ¿Cómo subo una evidencia?" autofocus>
      <p id="helpWizardError" style="color:#ef4444;font-size:12px;margin-bottom:10px;display:none"></p>
      <div class="flex gap-2">
        <button class="pill pill-ghost flex-1" onclick="cancelHelpWizard()">Cancelar</button>
        <button class="pill pill-primary flex-1" onclick="confirmHelpWizardTitle()"><i data-lucide="arrow-right" style="width:14px;height:14px"></i> Crear</button>
      </div>
    </div>`;
  }

  // ---- PASO 2: armar el contenido, por páginas tipo Word ----
  if(step==='body'){
    const topic = D.helpTopics.find(h=>h.id===window._helpWizardTopicId);
    let pagesHtml;
    if(topic?.body && topic.body.includes('help-page')){
      pagesHtml = topic.body.replace(/class="help-page" contenteditable="false"/g, 'class="help-page" contenteditable="true"');
    } else {
      pagesHtml = `<div class="help-page" contenteditable="true" onfocus="window._helpActivePage=this" onmouseup="saveHelpSelection()" onkeyup="saveHelpSelection()" style="position:relative;width:700px;max-width:100%;min-height:990px;margin:0 auto 20px;background:#fff;color:#111;border:1px solid var(--border);border-radius:4px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,.25)">${topic?.body||''}</div>`;
    }
    return `
    <div>
      <h2 class="font-bold text-lg mb-1"><i data-lucide="help-circle" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px"></i>${topic?.title||''} — Paso 2 de 2</h2>
      <p style="color:var(--textm);font-size:12px;margin-bottom:14px">Escribe el contenido e inserta imágenes donde quieras. Cuando termines, tocá Finalizar.</p>

      <div class="flex gap-2 mb-3 flex-wrap items-center" style="padding:8px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
        <button type="button" class="pill pill-ghost" style="padding:6px 10px" onclick="document.execCommand('justifyLeft')" title="Alinear izquierda"><i data-lucide="align-left" style="width:13px;height:13px"></i></button>
        <button type="button" class="pill pill-ghost" style="padding:6px 10px" onclick="document.execCommand('justifyCenter')" title="Centrar"><i data-lucide="align-center" style="width:13px;height:13px"></i></button>
        <select onchange="applyHelpFontSize(this.value)" class="inp" style="width:auto;padding:6px 8px;font-size:12px">
          <option value="">Tamaño letra</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="20px">20</option>
          <option value="26px">26</option>
          <option value="34px">34</option>
        </select>
        <span style="width:1px;height:20px;background:var(--border)"></span>
        <label style="font-size:11px;color:var(--textm);display:flex;align-items:center;gap:4px">Hoja <input type="color" value="#ffffff" onchange="applyHelpPageColor(this.value)" style="width:26px;height:26px;padding:0;border:none;background:none;cursor:pointer"></label>
        <label style="font-size:11px;color:var(--textm);display:flex;align-items:center;gap:4px">Letra <input type="color" value="#111111" onchange="applyHelpTextColor(this.value)" style="width:26px;height:26px;padding:0;border:none;background:none;cursor:pointer"></label>
        <span style="width:1px;height:20px;background:var(--border)"></span>
        <button type="button" class="pill pill-ghost" style="font-size:12px;padding:6px 12px" onclick="document.getElementById('helpInlineImgInput').click()"><i data-lucide="image-plus" style="width:13px;height:13px"></i> Insertar imagen</button>
        <button type="button" class="pill pill-danger" style="font-size:12px;padding:6px 12px" onclick="removeSelectedHelpImage()"><i data-lucide="image-off" style="width:13px;height:13px"></i> Quitar imagen</button>
        <input id="helpInlineImgInput" type="file" accept="image/*" style="display:none" onchange="insertHelpFloatingImage(this)">
      </div>

      <div id="helpPagesContainer" style="display:flex;flex-direction:column;max-height:65vh;overflow-y:auto;padding:14px;background:rgba(0,0,0,.15);border-radius:10px">
        ${pagesHtml}
      </div>
      <button type="button" class="pill pill-ghost mt-2" onclick="addHelpPage()"><i data-lucide="plus" style="width:13px;height:13px"></i> Agregar página</button>

      <input id="helpTopicId" type="hidden" value="${topic?.id||''}">
      <div class="flex gap-2 mt-4">
        <button class="pill pill-ghost" onclick="cancelHelpWizard()">Cancelar</button>
        <button class="pill pill-primary" onclick="finalizeHelpTopic()"><i data-lucide="check" style="width:14px;height:14px"></i> Finalizar</button>
      </div>
    </div>`;
  }

  // ---- LISTA NORMAL ----
  return `
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-base"><i data-lucide="help-circle" style="width:15px;height:15px;display:inline-block;vertical-align:middle"></i> Centro de Ayuda</h2>
      <button class="pill pill-primary" onclick="startNewHelpTopic()"><i data-lucide="plus" style="width:14px;height:14px"></i> Nuevo Tema</button>
    </div>
    <p style="color:var(--textm);font-size:12px;margin-bottom:14px">Estos temas son los que ven docentes y estudiantes al tocar "¿Ayuda?".</p>
    ${D.helpTopics.length>0?`
    <div class="flex flex-col gap-2">
      ${D.helpTopics.map(h=>{
        const plainText = (h.body||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
        const firstImg = (h.body||'').match(/<img[^>]+src="([^"]+)"/);
        return `
        <div class="card" style="background:var(--surface);padding:12px 14px;display:flex;align-items:center;gap:10px">
          ${firstImg?`<img src="${firstImg[1]}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0">`:`<div style="width:44px;height:44px;border-radius:8px;background:rgba(6,182,212,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i data-lucide="file-text" style="width:18px;height:18px;color:var(--accent)"></i></div>`}
          <div style="flex:1;min-width:0">
            <p style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.title||'Sin título'}</p>
            <p style="font-size:11px;color:var(--textm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${plainText.substring(0,80)}</p>
          </div>
          <div class="flex gap-1" style="flex-shrink:0">
            <button class="pill pill-ghost" style="padding:6px 9px;font-size:11px" onclick="editHelpTopicWizard(${h.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i></button>
            <button class="pill pill-danger" style="padding:6px 9px;font-size:11px" onclick="if(confirm('¿Eliminar este tema de ayuda?'))deleteHelpTopic(${h.id}).then(()=>render())"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
          </div>
        </div>`;
      }).join('')}
    </div>`:`<p style="color:var(--textm);text-align:center;padding:20px">Todavía no hay temas de ayuda cargados</p>`}
  </div>`;
}

// --- Modal admin: crear/editar un tema (título + texto + imagen) ---
function openHelpTopicForm(id){
  const topic = id ? D.helpTopics.find(h=>h.id===id) : null;
  const html=`<div class="modal-bg" onclick="if(event.target===this)closeHelpFormModal()">
    <div class="modal fade-in" style="max-width:900px;width:94vw;max-height:94vh;overflow-y:auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg">${topic?'Editar Tema':'Nuevo Tema de Ayuda'}</h2>
        <button onclick="closeHelpFormModal()" class="pill pill-ghost" style="padding:5px"><i data-lucide="x" style="width:17px;height:17px"></i></button>
      </div>
      <label class="auth-label">Título</label>
      <input id="helpTitleInput" class="inp mb-3" value="${topic?.title||''}" placeholder="Ej: ¿Cómo subo una evidencia?">
      <label class="auth-label">Texto (podés insertar imágenes donde quieras)</label>
      <div class="flex gap-2 mb-2">
        <button type="button" class="pill pill-ghost" style="font-size:12px;padding:6px 12px" onclick="document.getElementById('helpInlineImgInput').click()"><i data-lucide="image-plus" style="width:13px;height:13px"></i> Insertar imagen</button>
        <input id="helpInlineImgInput" type="file" accept="image/*" style="display:none" onchange="insertHelpInlineImage(this)">
      </div>
      <div id="helpBodyEditor" contenteditable="true" class="inp mb-3" style="min-height:480px;max-height:70vh;overflow-y:auto;line-height:1.6;font-size:14px">${topic?.body||''}</div>
      <input id="helpTopicId" type="hidden" value="${topic?.id||''}">
      <p id="helpFormError" style="color:#ef4444;font-size:12px;margin-bottom:8px;display:none"></p>
      <button class="pill pill-primary w-full" onclick="submitHelpTopic()"><i data-lucide="check" style="width:15px;height:15px"></i> Guardar</button>
    </div>
  </div>`;
  let wrap=document.getElementById('helpFormModalWrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.id='helpFormModalWrap'; document.body.appendChild(wrap); }
  wrap.innerHTML=html;
  if(typeof lucide!=='undefined') lucide.createIcons();
}

function closeHelpFormModal(){
  const wrap=document.getElementById('helpFormModalWrap');
  if(wrap) wrap.innerHTML='';
}

async function submitHelpTopic(){
  const title = document.getElementById('helpTitleInput').value.trim();
  const body = document.getElementById('helpBodyEditor').innerHTML.trim();
  const idVal = document.getElementById('helpTopicId').value;
  const errEl = document.getElementById('helpFormError');

  if(!title){ errEl.textContent='El título es obligatorio.'; errEl.style.display='block'; return; }

  const topic = { title, body };
  topic.id = idVal ? Number(idVal) : nid();
  topic.sort_order = idVal ? (D.helpTopics.find(h=>h.id===Number(idVal))?.sort_order ?? D.helpTopics.length) : D.helpTopics.length;

  await saveHelpTopic(topic);
  closeHelpFormModal();
  render();
}

// --- Vista pública tipo FAQ: la ven todos (incluso sin loguearse, desde el login) ---
async function openHelpModal(){
  let wrap=document.getElementById('helpModalWrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.id='helpModalWrap'; document.body.appendChild(wrap); }

  wrap.innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeHelpModal()">
    <div class="modal fade-in" style="max-width:480px;text-align:center;padding:40px">
      <p style="color:var(--textm)">Cargando ayuda...</p>
    </div>
  </div>`;

  await loadHelpTopics();
  window._openHelpTopicId = null;
  renderHelpModalContent();
}

function renderHelpModalContent(){
  const wrap=document.getElementById('helpModalWrap');
  if(!wrap) return;
  const openId = window._openHelpTopicId;
  const openTopic = openId ? D.helpTopics.find(h=>h.id===openId) : null;

  let inner;
  if(openTopic){
    // Vista de solo lectura: las imágenes no se deben poder mover ni redimensionar acá
    const readOnlyBody = (openTopic.body||'')
      .replace(/\s*onmousedown="[^"]*"/g, '')
      .replace(/resize:\s*both;?/g, '')
      .replace(/cursor:\s*move;?/g, '');
    inner=`
      <button onclick="window._openHelpTopicId=null;renderHelpModalContent()" class="pill pill-ghost" style="padding:5px 10px;font-size:12px;margin-bottom:14px"><i data-lucide="arrow-left" style="width:13px;height:13px"></i> Volver</button>
      <h2 class="font-bold text-lg mb-3">${openTopic.title}</h2>
      <div style="color:var(--textm);font-size:14px;line-height:1.6">${readOnlyBody}</div>
    `;
  } else {
    inner=`
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg"><i data-lucide="help-circle" style="width:18px;height:18px;color:var(--accent);display:inline-block;vertical-align:middle;margin-right:6px"></i>Centro de Ayuda</h2>
        <button onclick="closeHelpModal()" class="pill pill-ghost" style="padding:5px"><i data-lucide="x" style="width:17px;height:17px"></i></button>
      </div>
      ${D.helpTopics.length>0?`
        <div class="flex flex-col gap-2">
          ${D.helpTopics.map(h=>`
            <button onclick="window._openHelpTopicId=${h.id};renderHelpModalContent()" style="text-align:left;width:100%;display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.15);cursor:pointer">
              <i data-lucide="chevron-right" style="width:15px;height:15px;color:var(--accent);flex-shrink:0"></i>
              <span style="font-size:13px;font-weight:600;color:var(--text)">${h.title}</span>
            </button>`).join('')}
        </div>`:`<p style="color:var(--textm);text-align:center;padding:20px">Todavía no hay temas de ayuda cargados.</p>`}
    `;
  }

  wrap.innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeHelpModal()">
    <div class="modal fade-in" style="max-width:640px;width:92vw;max-height:85vh;overflow-y:auto">
      ${openTopic?`<div class="flex justify-end mb-2"><button onclick="closeHelpModal()" class="pill pill-ghost" style="padding:5px"><i data-lucide="x" style="width:17px;height:17px"></i></button></div>`:''}
      ${inner}
    </div>
  </div>`;
  if(typeof lucide!=='undefined') lucide.createIcons();
}

function closeHelpModal(){
  const wrap=document.getElementById('helpModalWrap');
  if(wrap) wrap.innerHTML='';
}

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
    <p style="color:var(--textm);font-size:13px">Consulta el estado diario del aseo, el ranking de incumplimiento y exporta el reporte semanal a Excel</p>
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
            <p style="font-size:11px;color:var(--textm)">Asistencia automática por grado y día</p>
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
      <p style="color:var(--textm);font-size:13px;margin-top:6px">Gráficos y estadísticas de cumplimiento del aseo por grado y grupo</p>
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

