// ============================================================
// js/modules/registry.js — Registro histórico por grupo
// Lista los grupos de aseo; al abrir uno muestra a cada integrante
// con sus días cumplidos, faltas y justificaciones, mes por mes.
// ============================================================

let registryOpenGroup = null;   // grupo abierto actualmente
let registryMonth = null;       // 'YYYY-MM' o null = todos los meses

const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Devuelve los meses que tienen actividad registrada (para el selector)
function getRegistryMonths(){
  const meses = new Set();
  (D.evidence||[]).forEach(e=>{ if(e.date) meses.add(e.date.substring(0,7)); });
  return [...meses].sort().reverse();
}

function monthLabel(ym){
  if(!ym) return 'Todos los meses';
  const [a,m] = ym.split('-');
  return `${MESES_NOMBRE[parseInt(m)-1]} ${a}`;
}

// Días en los que un grupo tuvo aseo (hay evidencia registrada)
function getGroupCleaningDays(groupName, month){
  const dias = new Set();
  (D.evidence||[]).forEach(e=>{
    if(e.group !== groupName || !e.date) return;
    if(month && !e.date.startsWith(month)) return;
    dias.add(e.date);
  });
  return [...dias].sort().reverse();
}

// Resumen de un integrante: cumplidos, faltas, excusados y el detalle de cada día
function getMemberRecord(student, groupName, month){
  const dias = getGroupCleaningDays(groupName, month);
  const detalle = [];
  let cumplidos = 0, faltas = 0, excusados = 0, pendientes = 0;

  dias.forEach(fecha=>{
    const asistio = (D.checkins||[]).some(c=>
      c.student===student && c.group_name===groupName && c.date===fecha
    );

    if(asistio){
      cumplidos++;
      detalle.push({ date: fecha, estado: 'Cumplió' });
      return;
    }

    const excusa = (D.excuses||[]).find(x=>
      x.student===student && x.group_name===groupName && x.date===fecha
    );

    if(excusa?.status === 'Excusado'){
      excusados++;
      detalle.push({ date: fecha, estado: 'Excusado', excusa });
    } else if(excusa?.status === 'Pendiente'){
      pendientes++;
      detalle.push({ date: fecha, estado: 'Excusa en revisión', excusa });
    } else {
      faltas++;
      detalle.push({ date: fecha, estado: 'Faltó', excusa: excusa || null });
    }
  });

  const evaluables = cumplidos + faltas;   // los excusados no cuentan en contra
  const porcentaje = evaluables > 0 ? Math.round((cumplidos / evaluables) * 100) : null;

  return { student, cumplidos, faltas, excusados, pendientes, detalle, porcentaje, totalDias: dias.length };
}

// ---- Pantalla principal de la pestaña Registro ----
function renderRegistryTab(){
  const myGrade = getCurrentGrade();
  const grupos = (D.cleanGroups||[]).filter(g=> isAdmin() || !myGrade || g.grade === myGrade);
  const meses = getRegistryMonths();

  // Si hay un grupo abierto, mostrar su detalle
  if(registryOpenGroup){
    return renderGroupDetail(registryOpenGroup, meses);
  }

  return `
  <div class="card slide-up" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <h3 class="font-bold">Registro por grupo</h3>
        <p style="font-size:12px;color:var(--textm);margin-top:2px">
          Toca un grupo para ver el historial de cada integrante.
        </p>
      </div>
      <select class="inp" style="width:auto;padding:7px 30px 7px 12px;font-size:12px"
              onchange="registryMonth=this.value||null;render()">
        <option value="">Todos los meses</option>
        ${meses.map(m=>`<option value="${m}" ${registryMonth===m?'selected':''}>${monthLabel(m)}</option>`).join('')}
      </select>
    </div>

    ${grupos.length===0?`
      <div style="padding:36px;text-align:center">
        <i data-lucide="folder-open" style="width:32px;height:32px;color:var(--textm);margin-bottom:10px"></i>
        <p style="color:var(--textm);font-size:14px">No hay grupos de aseo creados todavía.</p>
      </div>
    `:`
    <div class="grid gap-3 p-4" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
      ${grupos.map(g=>{
        const dias = getGroupCleaningDays(g.name, registryMonth);
        const registros = (g.members||[]).map(m=>getMemberRecord(m, g.name, registryMonth));
        const totalFaltas = registros.reduce((s,r)=>s+r.faltas, 0);
        const totalExcusados = registros.reduce((s,r)=>s+r.excusados, 0);

        return `
        <button onclick="registryOpenGroup='${g.name}';render()"
          style="text-align:left;padding:16px;border-radius:12px;border:1.5px solid var(--border);
                 background:var(--bg);cursor:pointer;transition:all .2s"
          onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.transform='none'">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span class="badge" style="background:rgba(6,182,212,.18);color:var(--accent)">${g.grade||'—'}</span>
            <i data-lucide="chevron-right" style="width:15px;height:15px;color:var(--textm)"></i>
          </div>
          <p style="font-weight:700;font-size:15px;margin-bottom:8px">${g.name}</p>
          <div style="display:flex;gap:14px;flex-wrap:wrap">
            <div>
              <p style="font-size:18px;font-weight:800;color:var(--accent);line-height:1">${(g.members||[]).length}</p>
              <p style="font-size:11px;color:var(--textm)">Integrantes</p>
            </div>
            <div>
              <p style="font-size:18px;font-weight:800;color:#0891b2;line-height:1">${dias.length}</p>
              <p style="font-size:11px;color:var(--textm)">Días de aseo</p>
            </div>
            <div>
              <p style="font-size:18px;font-weight:800;color:#ef4444;line-height:1">${totalFaltas}</p>
              <p style="font-size:11px;color:var(--textm)">Faltas</p>
            </div>
            ${totalExcusados>0?`
            <div>
              <p style="font-size:18px;font-weight:800;color:#059669;line-height:1">${totalExcusados}</p>
              <p style="font-size:11px;color:var(--textm)">Excusadas</p>
            </div>`:''}
          </div>
        </button>`;
      }).join('')}
    </div>`}
  </div>`;
}

// ---- Detalle de un grupo: cada integrante con su historial ----
function renderGroupDetail(groupName, meses){
  const grupo = (D.cleanGroups||[]).find(g=>g.name===groupName);
  if(!grupo) { registryOpenGroup = null; return renderRegistryTab(); }

  const dias = getGroupCleaningDays(groupName, registryMonth);
  const registros = (grupo.members||[]).map(m=>getMemberRecord(m, groupName, registryMonth));

  return `
  <div class="card slide-up" style="background:var(--surface);padding:0;overflow:hidden">
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="pill pill-ghost" style="padding:6px 12px;font-size:12px" onclick="registryOpenGroup=null;render()">
          <i data-lucide="arrow-left" style="width:13px;height:13px"></i> Volver
        </button>
        <div>
          <h3 class="font-bold">${grupo.name}</h3>
          <p style="font-size:12px;color:var(--textm);margin-top:2px">
            ${grupo.grade||'—'} · ${dias.length} día${dias.length===1?'':'s'} de aseo · ${monthLabel(registryMonth)}
          </p>
        </div>
      </div>
      <select class="inp" style="width:auto;padding:7px 30px 7px 12px;font-size:12px"
              onchange="registryMonth=this.value||null;render()">
        <option value="">Todos los meses</option>
        ${meses.map(m=>`<option value="${m}" ${registryMonth===m?'selected':''}>${monthLabel(m)}</option>`).join('')}
      </select>
    </div>

    ${registros.length===0?`
      <div style="padding:36px;text-align:center">
        <p style="color:var(--textm);font-size:14px">Este grupo no tiene integrantes asignados.</p>
      </div>
    `:`
    <div style="padding:14px;display:flex;flex-direction:column;gap:12px">
      ${registros.map(r=>`
        <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--bg)">
          <div style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;border-bottom:1px solid var(--border)">
            <div>
              <p style="font-weight:700;font-size:14px">${r.student}</p>
              <p style="font-size:11px;color:var(--textm)">${r.totalDias} día${r.totalDias===1?'':'s'} registrado${r.totalDias===1?'':'s'}</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <span class="badge-pill badge-pill-green">✔ ${r.cumplidos} cumplió</span>
              <span class="badge-pill badge-pill-red">✕ ${r.faltas} faltó</span>
              ${r.excusados>0?`<span class="badge-pill badge-pill-teal">📄 ${r.excusados} excusada${r.excusados===1?'':'s'}</span>`:''}
              ${r.pendientes>0?`<span class="badge-pill badge-pill-amber">◷ ${r.pendientes} en revisión</span>`:''}
              ${r.porcentaje!==null?`
                <span style="font-weight:800;font-size:15px;color:${r.porcentaje>=70?'#16a34a':r.porcentaje>=40?'#d97706':'#ef4444'}">
                  ${r.porcentaje}%
                </span>`:''}
            </div>
          </div>

          ${r.detalle.length===0?`
            <p style="padding:14px;color:var(--textm);font-size:12px;text-align:center">Sin días registrados en este período.</p>
          `:`
          <div style="padding:10px 16px;display:flex;flex-wrap:wrap;gap:6px">
            ${r.detalle.map(d=>{
              const estilos = {
                'Cumplió':            {bg:'rgba(34,197,94,.12)',  color:'#16a34a', icon:'✔'},
                'Faltó':              {bg:'rgba(239,68,68,.12)',  color:'#ef4444', icon:'✕'},
                'Excusado':           {bg:'rgba(6,182,212,.12)',  color:'#0891b2', icon:'📄'},
                'Excusa en revisión': {bg:'rgba(245,158,11,.12)', color:'#d97706', icon:'◷'}
              }[d.estado];

              const clickable = d.excusa?.image_url
                ? `onclick="viewExcuseImage('${d.excusa.image_url}')" style="cursor:pointer;`
                : `style="`;

              return `<span ${clickable}display:inline-flex;align-items:center;gap:5px;padding:5px 10px;
                border-radius:8px;font-size:11px;font-weight:600;
                background:${estilos.bg};color:${estilos.color}"
                title="${d.estado}${d.excusa?.reason?' — '+d.excusa.reason:''}">
                ${estilos.icon} ${formatDateShort(d.date)}
              </span>`;
            }).join('')}
          </div>`}
        </div>
      `).join('')}
    </div>`}
  </div>`;
}

// Fecha corta para las etiquetas de días
function formatDateShort(dateStr){
  try{
    const [a,m,d] = dateStr.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${meses[parseInt(m)-1]}`;
  }catch(e){ return dateStr; }
}
