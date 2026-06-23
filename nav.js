// ============================================================
// nav.js — CleanClass v2.0
// Módulos completos: Usuarios, Analíticas, Ranking visibles
// ============================================================

function getModules(){
  if(isAdmin()){
    return [
      {key:'dashboard',  icon:'layout-dashboard', label:'Dashboard'},
      {key:'users',      icon:'users',            label:'Usuarios'},
      {key:'evidence',   icon:'camera',           label:'Evidencias'},
      {key:'incidents',  icon:'alert-circle',     label:'Incidentes'},
      {key:'reports',    icon:'file-bar-chart',   label:'Reportes'},
      {key:'config',     icon:'settings',         label:'Configuración'},
      {key:'settings',   icon:'user-circle',      label:'Mi Cuenta'}
    ];
  } else if(isTeacher()){
    return [
      {key:'dash',       icon:'layout-dashboard', label:'Inicio'},
      {key:'users',      icon:'users',            label:'Usuarios del Grado'},
      {key:'analytics',  icon:'bar-chart-2',      label:'Analíticas y Gráficos'},
      {key:'clean',      icon:'sparkles',         label:'Turnos de Aseo'},
      {key:'validation', icon:'check-square',     label:'Validación'},
      {key:'incidents',  icon:'alert-circle',     label:'Incidentes'},
      {key:'settings',   icon:'settings',         label:'Mi Perfil'}
    ];
  } else {
    return [
      {key:'dash',           icon:'layout-dashboard', label:'Inicio'},
      {key:'users',          icon:'users',            label:'Usuarios'},
      {key:'analytics',      icon:'bar-chart-2',      label:'Gráficos y Ranking'},
      {key:'clean',          icon:'sparkles',         label:'Mis Turnos'},
      {key:'evidence',       icon:'camera',           label:'Evidencias'},
      {key:'myvalidations',  icon:'eye',              label:'Mis Validaciones'},
      {key:'reportIncident', icon:'alert-triangle',   label:'Reportar Incidente'},
      {key:'settings',       icon:'settings',         label:'Mi Perfil'}
    ];
  }
}

let cur='dash';
let expandedMenu=null;
let sidebarCollapsed=false;

function buildNav(){
  const nav=document.getElementById('nav');
  const modules=getModules();
  if(isAdmin()&&(cur==='dash'||cur==='adminPanel'||cur===''))cur='dashboard';

  nav.innerHTML=modules.map(m=>`
    <div>
      <button class="sidebar-btn flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium ${cur===m.key?'active':''}" data-k="${m.key}"
        style="color:${cur===m.key?'#fff':'var(--textm)'};width:100%;text-align:left">
        <div class="flex items-center gap-2">
          <i data-lucide="${m.icon}" style="width:17px;height:17px"></i>${m.label}
        </div>
      </button>
    </div>`).join('');

  nav.querySelectorAll('button').forEach(b=>{
    b.onclick=()=>{cur=b.dataset.k;render();closeSidebar();};
  });
  lucide.createIcons();
}

function toggleSidebar(){
  const sb=document.getElementById('sidebar');
  const isHidden=sb.classList.contains('hidden');
  if(isHidden){
    sb.classList.remove('hidden');
    // Crear overlay para cerrar al tocar afuera
    if(!document.getElementById('sidebarOverlay')){
      const ov=document.createElement('div');
      ov.id='sidebarOverlay';
      ov.style.cssText='position:fixed;inset:0;z-index:49;background:rgba(0,0,0,.4)';
      ov.onclick=()=>closeSidebar();
      document.body.appendChild(ov);
    }
  } else {
    closeSidebar();
  }
}

function closeSidebar(){
  if(window.innerWidth<768){
    document.getElementById('sidebar').classList.add('hidden');
    const ov=document.getElementById('sidebarOverlay');
    if(ov) ov.remove();
  }
}

function toggleSidebarHide(){
  const sb=document.getElementById('sidebar');
  const btn=document.getElementById('toggleSidebarBtn');
  sidebarCollapsed=!sidebarCollapsed;
  if(sidebarCollapsed){
    sb.style.width='48px';sb.style.overflow='hidden';sb.style.padding='12px 6px';
    btn.innerHTML='<i data-lucide="panel-right" style="width:16px;height:16px"></i>';
    sb.querySelectorAll('#nav,#notifPanel,.mt-auto,.mt-6').forEach(el=>el.style.display='none');
    const tr=sb.querySelector('.flex.items-center.justify-between');
    if(tr){const la=tr.querySelector('.flex.items-center.gap-2');if(la)la.style.display='none';}
  }else{
    sb.style.width='220px';sb.style.overflow='';sb.style.padding='16px 10px';
    btn.innerHTML='<i data-lucide="panel-left" style="width:16px;height:16px"></i>';
    sb.querySelectorAll('#nav,#notifPanel,.mt-auto,.mt-6').forEach(el=>el.style.display='');
    const tr=sb.querySelector('.flex.items-center.justify-between');
    if(tr){const la=tr.querySelector('.flex.items-center.gap-2');if(la)la.style.display='';}
  }
  lucide.createIcons();
}

function checkResp(){
  const sb=document.getElementById('sidebar');
  const mh=document.getElementById('mobileHeader');
  const mn=document.getElementById('main');
  const btn=document.getElementById('toggleSidebarBtn');
  if(window.innerWidth<768){
    sb.classList.add('hidden');
    sb.style.position='fixed';sb.style.zIndex='50';sb.style.height='100%';
    sb.style.width='220px';sb.style.overflow='';sb.style.padding='16px 10px';
    mh.classList.remove('hidden');mh.classList.add('flex');
    mn.style.paddingTop='56px';
    if(btn)btn.style.display='none';
    sidebarCollapsed=false;
  }else{
    sb.classList.remove('hidden');
    sb.style.position='';sb.style.zIndex='';sb.style.height='';
    mh.classList.add('hidden');mh.classList.remove('flex');
    mn.style.paddingTop='';
    if(btn)btn.style.display='block';
    if(sidebarCollapsed){sb.style.width='48px';sb.style.overflow='hidden';sb.style.padding='12px 6px';}
    else{sb.style.width='220px';sb.style.overflow='';sb.style.padding='16px 10px';}
  }
}
window.onresize=checkResp;
