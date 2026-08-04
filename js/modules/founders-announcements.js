async function loadFounders(){
  try {
    const {data} = await sb.from('app_settings').select('value').eq('key','founders').maybeSingle();
    if(data?.value){
      window._founders = JSON.parse(data.value);
      localStorage.setItem('cc_founders', data.value);
    }
  } catch(e){ console.log('founders from localStorage'); }
}

async function saveFounders(){
  const val = JSON.stringify(window._founders);
  localStorage.setItem('cc_founders', val);
  try {
    await sb.from('app_settings').upsert({key:'founders', value:val},{onConflict:'key'});
  } catch(e){ console.log('saveFounders local only'); }
}

function openFounderManager(){
  if(!isAdmin()) return;
  const existing = window._founders;
  const allGrades = [...new Set([...D.students.map(s=>s.grade),...D.rooms.map(r=>r.grade)])].filter(Boolean).sort();
  // Estado del filtro de grado — persiste mientras el modal está abierto
  if(typeof window._fmGrade==='undefined') window._fmGrade=null;

  const allPeople = [
    ...D.students.map(s=>({...s,role:'Estudiante'})),
    ...D.teachers.map(t=>({...t,role:'Docente'}))
  ].filter(p=>!window._fmGrade||p.grade===window._fmGrade);

  const FRAME_TYPES = [
    {id:'fire',     label:'🔥 Fuego'},
    {id:'gold',     label:'✨ Dorado'},
    {id:'electric', label:'⚡ Eléctrico'},
    {id:'aurora',   label:'🌌 Aurora'},
    {id:'rainbow',  label:'🌈 Rainbow'},
    {id:'ocean',    label:'🌊 Océano'},
    {id:'chaos',    label:'💥 Caos'},
    {id:'order',    label:'🔷 Orden'},
    {id:'crystal',  label:'💎 Cristalico'},
    {id:'poison',   label:'☠️ Veneno'},
    {id:'blackhole',label:'🌑 Agujero Negro'},
    {id:'ice',      label:'❄️ Hielo'},
  ];

  const html = `
  <div class="modal-bg" id="founderManagerBg" onclick="if(event.target===this)this.remove()" style="z-index:9999">
    <div class="modal" style="max-width:540px;background:#1e293b;max-height:85vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h2 style="font-size:16px;font-weight:700">⭐ Gestionar Fundadores</h2>
        <button onclick="document.getElementById('founderManagerBg').remove()" class="pill pill-ghost" style="padding:4px 10px">✕</button>
      </div>
      <p style="font-size:12px;color:var(--textm);margin-bottom:10px">Elige quién es fundador, su marco animado y color del nombre.</p>

      <!-- Filtro por grado — dropdown -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <select id="fmGradeSelect" onchange="window._fmGrade=this.value||null;document.getElementById('founderManagerBg').remove();openFounderManager()"
          style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(6,182,212,.3);background:#0f172a;color:var(--text);font-size:13px;cursor:pointer;outline:none">
          <option value="">📋 Todos los grados (${D.students.length + D.teachers.length} personas)</option>
          ${allGrades.map(g=>{
            const cnt=[...D.students,...D.teachers].filter(p=>p.grade===g).length;
            return `<option value="${g}" ${window._fmGrade===g?'selected':''}>${g} · ${cnt} persona(s)</option>`;
          }).join('')}
        </select>
        <span style="font-size:11px;color:var(--accent);font-weight:700;white-space:nowrap">${existing.length} fundador(es)</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:0">
        ${allPeople.map(p=>{
          const f = existing.find(x=>x.email===p.email||x.name===p.name);
          const color = f?.color||'#FFD700';
          const ftype = f?.type||'gold';
          const eid = p.email.replace(/[@.]/g,'_');
          return `<div style="padding:10px 12px;border-radius:10px;background:${f?'rgba(6,182,212,.06)':'rgba(6,182,212,.02)'};border:1px solid ${f?'rgba(6,182,212,.2)':'rgba(6,182,212,.08)'};margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:${f?'10px':'0'}">
              <input type="checkbox" id="f_${eid}" ${f?'checked':''} style="width:16px;height:16px;accent-color:#06b6d4;flex-shrink:0"
                onchange="toggleFounder('${p.email}','${p.name}',this.checked,document.getElementById('ft_${eid}').value);this.closest('div').parentElement.style.background=this.checked?'rgba(6,182,212,.06)':'rgba(6,182,212,.02)';this.closest('div').parentElement.style.border=this.checked?'1px solid rgba(6,182,212,.2)':'1px solid rgba(6,182,212,.08)';document.getElementById('fex_${eid}').style.display=this.checked?'flex':'none'">
              <div style="flex:1;min-width:0">
                <p style="font-size:13px;font-weight:600">${p.name}</p>
                <p style="font-size:11px;color:var(--textm)">${p.role} · ${p.email||'—'}</p>
              </div>

            </div>
            <div id="fex_${eid}" style="display:${f?'flex':'none'};gap:6px;flex-wrap:wrap;margin-top:4px">
              <select id="ft_${eid}" style="font-size:11px;padding:4px 8px;border-radius:8px;border:1px solid rgba(6,182,212,.3);background:#0f172a;color:var(--text);cursor:pointer"
                onchange="toggleFounder('${p.email}','${p.name}',true,this.value)">
                ${FRAME_TYPES.map(t=>`<option value="${t.id}" ${ftype===t.id?'selected':''}>${t.label}</option>`).join('')}
              </select>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px">
        <button class="pill pill-ghost" onclick="document.getElementById('founderManagerBg').remove()">Cerrar</button>
        <button class="pill pill-primary" onclick="document.getElementById('founderManagerBg').remove();render()">✓ Aplicar</button>
      </div>
    </div>
  </div>`;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

function toggleFounder(email, name, checked, type){
  window._founders = window._founders.filter(f=>f.email!==email&&f.name!==name);
  if(checked) window._founders.push({email, name, type: type||'gold'});
  saveFounders();
}

// ============================================================
// PANEL CTRL+K — anuncios del admin en tiempo real
// ============================================================
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key==='k'){
    e.preventDefault();
    if(isAdmin()) openCmdPanel();
  }
});

function openCmdPanel(){
  if(document.getElementById('cmdPanel')) return;
  const html = `
  <div id="cmdPanel" onclick="if(event.target===this)closeCmdPanel()">
    <div id="cmdBox">
      <div id="cmdHeader">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb);display:flex;align-items:center;justify-content:center">
            <i data-lucide="megaphone" style="width:16px;height:16px;color:#fff"></i>
          </div>
          <div>
            <p style="font-size:14px;font-weight:700">Enviar Anuncio</p>
            <p style="font-size:11px;color:var(--textm)">Se mostrará a todos los usuarios conectados</p>
          </div>
        </div>
        <button onclick="closeCmdPanel()" style="background:none;border:none;color:var(--textm);cursor:pointer;font-size:18px;padding:4px">✕</button>
      </div>
      <textarea id="cmdInput" placeholder="Escribe tu anuncio aquí..." rows="3"
        style="width:100%;padding:16px 20px;background:transparent;border:none;outline:none;font-size:15px;color:var(--text);font-family:'DM Sans',sans-serif;resize:none;border-bottom:1px solid rgba(6,182,212,.1)"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAnnounce();}if(event.key==='Escape')closeCmdPanel()"></textarea>
      <div id="cmdFooter">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="pill pill-ghost" style="font-size:11px;padding:4px 10px" onclick="openFounderManager()">⭐ Fundadores</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:11px;color:var(--textm)">Enter para enviar · Shift+Enter nueva línea</span>
          <button class="pill pill-primary" style="padding:7px 18px" onclick="sendAnnounce()">
            <i data-lucide="send" style="width:14px;height:14px"></i> Enviar
          </button>
        </div>
      </div>
    </div>
  </div>`;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
  if(typeof lucide!=='undefined') lucide.createIcons();
  setTimeout(()=>document.getElementById('cmdInput')?.focus(), 100);
}

function closeCmdPanel(){
  const p = document.getElementById('cmdPanel');
  if(p) p.remove();
}

function sendAnnounce(){
  const input = document.getElementById('cmdInput');
  const msg = input?.value?.trim();
  if(!msg) return;

  // Guardar en Supabase para que todos lo vean via realtime
  sb.from('announcements').insert({
    message: msg,
    sender: currentSession?.name || 'Admin',
    created_at: new Date().toISOString()
  }).then(({error})=>{
    if(error){
      // Si la tabla no existe, mostrar igual localmente
      console.warn('announcements table:', error.message);
    }
  });

  // Mostrar localmente de inmediato
  showAnnounce(msg, currentSession?.name||'Admin');
  closeCmdPanel();
}

function showAnnounce(msg, sender){
  const existing = document.getElementById('announceBanner');
  if(existing) existing.remove();

  const html = `
  <div id="announceBanner">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
      <div style="display:flex;align-items:flex-start;gap:12px;flex:1">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i data-lucide="megaphone" style="width:18px;height:18px;color:#fff"></i>
        </div>
        <div>
          <p style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:4px">📢 ANUNCIO DE ${(sender||'ADMIN').toUpperCase()}</p>
          <p style="font-size:14px;color:var(--text);line-height:1.5">${msg}</p>
        </div>
      </div>
      <button onclick="document.getElementById('announceBanner').remove()" style="background:none;border:none;color:var(--textm);cursor:pointer;font-size:16px;flex-shrink:0">✕</button>
    </div>
  </div>`;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
  if(typeof lucide!=='undefined') lucide.createIcons();

  // Auto cerrar después de 10s
  setTimeout(()=>{
    const b = document.getElementById('announceBanner');
    if(b){ b.style.animation='announceOut .3s ease forwards'; setTimeout(()=>b.remove(),300); }
  }, 10000);
}

// Escuchar anuncios en tiempo real de otros usuarios
// Cargar fundadores desde Supabase al iniciar
async function initFounders(){
  await loadFounders();
  // Re-renderizar si ya hay una vista activa
  if(typeof render==='function') render();
}

function initAnnouncementsRealtime(){
  if (window._announcementsRealtimeInitialized) return;
  window._announcementsRealtimeInitialized = true;
  sb.channel('announcements-channel')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'announcements'},
      payload=>{
        if(payload.new?.sender!==currentSession?.name){
          showAnnounce(payload.new.message, payload.new.sender);
        }
      })
    .subscribe();
}
