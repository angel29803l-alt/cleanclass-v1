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

// ---- Pantalla principal: tabla con todos los estudiantes ----
function renderRegistryTab(){
  const myGrade = getCurrentGrade();
  const meses = getRegistryMonths();

  // Un registro por cada estudiante que pertenezca a algún grupo
  const filas = [];
  (D.cleanGroups||[]).forEach(g=>{
    if(!isAdmin() && myGrade && g.grade !== myGrade) return;
    (g.members||[]).forEach(alumno=>{
      const r = getMemberRecord(alumno, g.name, registryMonth);
      filas.push({ ...r, group: g.name, grade: g.grade || '—' });
    });
  });

  // Ordenar: primero los que más faltas tienen
  filas.sort((a,b)=> b.faltas - a.faltas || a.student.localeCompare(b.student));

  const totCumplidos = filas.reduce((s,f)=>s+f.cumplidos,0);
  const totFaltas    = filas.reduce((s,f)=>s+f.faltas,0);
  const totExcusados = filas.reduce((s,f)=>s+f.excusados,0);

  return `
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
    ${[
      {icon:'users',        label:'Estudiantes', val:filas.length,  color:'#2563eb'},
      {icon:'check-circle', label:'Asistencias', val:totCumplidos,  color:'#16a34a'},
      {icon:'x-circle',     label:'Faltas',      val:totFaltas,     color:'#ef4444'},
      {icon:'file-check',   label:'Excusadas',   val:totExcusados,  color:'#0891b2'}
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
    <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <h3 class="font-bold">Registro de asistencias</h3>
        <p style="font-size:12px;color:var(--textm);margin-top:2px">
          Toca un estudiante para ver el detalle día por día.
        </p>
      </div>
      <select class="inp" style="width:auto;padding:7px 30px 7px 12px;font-size:12px"
              onchange="registryMonth=this.value||null;render()">
        <option value="">Todos los meses</option>
        ${meses.map(m=>`<option value="${m}" ${registryMonth===m?'selected':''}>${monthLabel(m)}</option>`).join('')}
      </select>
    </div>

    ${filas.length===0?`
      <div style="padding:36px;text-align:center">
        <i data-lucide="folder-open" style="width:32px;height:32px;color:var(--textm);margin-bottom:10px"></i>
        <p style="color:var(--textm);font-size:14px">No hay estudiantes asignados a grupos de aseo.</p>
      </div>
    `:`
    <div style="overflow-x:auto"><table class="tbl">
      <thead><tr>
        <th>#</th>
        <th>Estudiante</th>
        <th>Grado</th>
        <th>Grupo</th>
        <th style="text-align:center">Asistió</th>
        <th style="text-align:center">Faltó</th>
        <th style="text-align:center">Excusadas</th>
        <th style="text-align:center">Cumplimiento</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${filas.map((f,i)=>{
          const color = f.porcentaje===null ? 'var(--textm)'
                      : f.porcentaje>=70 ? '#16a34a'
                      : f.porcentaje>=40 ? '#d97706' : '#ef4444';
          const abierto = registryOpenGroup === f.student+'|'+f.group;

          return `
          <tr style="${f.faltas>0?'background:rgba(239,68,68,.04)':''}">
            <td style="color:var(--textm);font-size:12px">${i+1}</td>
            <td style="font-weight:600">${f.student}</td>
            <td><span class="badge" style="background:rgba(6,182,212,.15);color:var(--accent)">${f.grade}</span></td>
            <td style="font-size:12px;color:var(--textm)">${f.group}</td>
            <td style="text-align:center;font-weight:700;color:#16a34a">${f.cumplidos}</td>
            <td style="text-align:center;font-weight:700;color:${f.faltas>0?'#ef4444':'var(--textm)'}">${f.faltas}</td>
            <td style="text-align:center;font-weight:700;color:${f.excusados>0?'#0891b2':'var(--textm)'}">${f.excusados}</td>
            <td style="text-align:center">
              ${f.porcentaje!==null
                ? `<span style="font-weight:800;color:${color}">${f.porcentaje}%</span>`
                : `<span style="color:var(--textm)">—</span>`}
            </td>
            <td style="text-align:right">
              <button class="pill pill-ghost" style="padding:4px 10px;font-size:11px"
                onclick="registryOpenGroup='${abierto?'':f.student+'|'+f.group}';render()">
                <i data-lucide="${abierto?'chevron-up':'chevron-down'}" style="width:12px;height:12px"></i>
                ${abierto?'Ocultar':'Ver días'}
              </button>
            </td>
          </tr>
          ${abierto?`
          <tr>
            <td colspan="9" style="background:var(--bg);padding:14px 18px">
              ${renderMemberDays(f)}
            </td>
          </tr>`:''}`;
        }).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

// ---- Detalle día por día de un estudiante ----
function renderMemberDays(f){
  if(f.detalle.length===0){
    return `<p style="color:var(--textm);font-size:12px;text-align:center">Sin días registrados en este período.</p>`;
  }

  return `
    <p style="font-size:11px;color:var(--textm);font-weight:600;margin-bottom:8px">
      DÍAS REGISTRADOS — ${f.student} · ${monthLabel(registryMonth)}
    </p>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${f.detalle.map(d=>{
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
          title="${d.estado}${d.excusa?.reason?' — '+d.excusa.reason:''}${d.excusa?.image_url?' (toca para ver la excusa)':''}">
          ${estilos.icon} ${formatDateShort(d.date)}
        </span>`;
      }).join('')}
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
