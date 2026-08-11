// ============================================================
// js/modules/theme.js — Apariencia y accesibilidad
// Temas: claro, oscuro, alto contraste, daltónicos y personalizado
// ============================================================

const THEMES = {
  dark: {
    name: 'Oscuro',
    desc: 'El tema por defecto de CleanClass',
    icon: 'moon',
    swatch: ['#0f172a', '#1e293b', '#06b6d4', '#f1f5f9']
  },
  light: {
    name: 'Claro',
    desc: 'Fondo blanco, ideal con mucha luz',
    icon: 'sun',
    swatch: ['#f1f5f9', '#ffffff', '#0891b2', '#0f172a']
  },
  contrast: {
    name: 'Alto contraste',
    desc: 'Negro y amarillo, para baja visión',
    icon: 'contrast',
    swatch: ['#000000', '#000000', '#ffff00', '#ffffff']
  },
  deuter: {
    name: 'Daltonismo rojo-verde',
    desc: 'Protanopía y deuteranopía',
    icon: 'eye',
    swatch: ['#0f172a', '#1e293b', '#0072b2', '#e69f00']
  },
  trita: {
    name: 'Daltonismo azul-amarillo',
    desc: 'Tritanopía',
    icon: 'eye',
    swatch: ['#0f172a', '#1e293b', '#d55e00', '#009e73']
  },
  custom: {
    name: 'Personalizado',
    desc: 'Elige tú los colores y el tamaño',
    icon: 'palette',
    swatch: ['#0f172a', '#1e293b', '#8b5cf6', '#f1f5f9']
  }
};

const FONT_SIZES = {
  sm:  { label: 'Pequeño',   scale: 0.9 },
  md:  { label: 'Mediano',   scale: 1.0 },
  lg:  { label: 'Grande',    scale: 1.15 },
  xl:  { label: 'Muy grande', scale: 1.3 }
};

// Preferencias en memoria (se cargan desde Supabase al iniciar sesión)
let userPrefs = {
  theme: 'dark',
  font_size: 'md',
  custom_text_color: '#f1f5f9',
  custom_accent_color: '#06b6d4',
  custom_bg_color: '#0f172a'
};

// ---- Aplica el tema al documento ----
function applyTheme(prefs){
  const p = prefs || userPrefs;
  const root = document.documentElement;

  // Tema base
  if(p.theme === 'dark'){
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', p.theme);
  }

  // Tamaño de letra
  const scale = FONT_SIZES[p.font_size]?.scale || 1;
  root.style.setProperty('--font-scale', scale);

  // Colores personalizados — solo en el tema custom
  if(p.theme === 'custom'){
    root.style.setProperty('--text', p.custom_text_color);
    root.style.setProperty('--accent', p.custom_accent_color);
    root.style.setProperty('--bg', p.custom_bg_color);
    root.style.setProperty('--surface', lightenColor(p.custom_bg_color, 12));
    root.style.setProperty('--textm', fadeColor(p.custom_text_color, 0.75));
    root.style.setProperty('--border', lightenColor(p.custom_bg_color, 25));
  } else {
    // Limpiar overrides para que mande el CSS del tema
    ['--text','--accent','--bg','--surface','--textm','--border'].forEach(v=>{
      root.style.removeProperty(v);
    });
  }

  // Guardar en el dispositivo para aplicarlo al instante la próxima vez
  // (incluye la pantalla de login y la carga inicial, antes de saber quién es el usuario)
  try{
    localStorage.setItem('cc_prefs', JSON.stringify(p));
  }catch(e){}
}

// Aplica el tema guardado en el dispositivo lo antes posible,
// para que el login y la pantalla de carga ya salgan con el tema correcto.
(function applyStoredThemeEarly(){
  try{
    const saved = localStorage.getItem('cc_prefs');
    if(saved){
      const p = JSON.parse(saved);
      userPrefs = { ...userPrefs, ...p };
      const root = document.documentElement;
      if(p.theme && p.theme !== 'dark') root.setAttribute('data-theme', p.theme);
      const scale = FONT_SIZES[p.font_size]?.scale || 1;
      root.style.setProperty('--font-scale', scale);
      if(p.theme === 'custom'){
        root.style.setProperty('--text', p.custom_text_color);
        root.style.setProperty('--accent', p.custom_accent_color);
        root.style.setProperty('--bg', p.custom_bg_color);
        root.style.setProperty('--surface', lightenColor(p.custom_bg_color, 12));
        root.style.setProperty('--textm', fadeColor(p.custom_text_color, 0.75));
        root.style.setProperty('--border', lightenColor(p.custom_bg_color, 25));
      }
    }
  }catch(e){}
})();

// Aclara un color hex en un porcentaje dado
function lightenColor(hex, percent){
  const n = parseInt(hex.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0x00FF) + amt);
  const b = Math.min(255, (n & 0x0000FF) + amt);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Devuelve el color con menos intensidad (para texto secundario)
function fadeColor(hex, factor){
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---- Carga las preferencias del usuario desde Supabase ----
async function loadUserPrefs(){
  if(!currentSession?.id) return;
  try{
    const { data, error } = await sb.from('users')
      .select('theme, font_size, custom_text_color, custom_accent_color, custom_bg_color')
      .eq('id', currentSession.id).maybeSingle();

    if(!error && data){
      userPrefs = {
        theme: data.theme || 'dark',
        font_size: data.font_size || 'md',
        custom_text_color: data.custom_text_color || '#f1f5f9',
        custom_accent_color: data.custom_accent_color || '#06b6d4',
        custom_bg_color: data.custom_bg_color || '#0f172a'
      };
      console.log('✅ Apariencia cargada:', userPrefs.theme, '| tamaño:', userPrefs.font_size);
    }
  }catch(err){
    console.warn('No se pudieron cargar las preferencias de apariencia:', err.message);
  }
  applyTheme();
}

// Vigila la sesión y carga las preferencias apenas exista, sin importar
// si el usuario acaba de iniciar sesión o si recargó la página con sesión activa.
(function watchSessionForPrefs(){
  let cargado = false;
  const revisar = setInterval(() => {
    if(cargado) return clearInterval(revisar);
    if(typeof currentSession !== 'undefined' && currentSession?.id){
      cargado = true;
      clearInterval(revisar);
      loadUserPrefs();
    }
  }, 400);
  // Dejar de intentar después de 30 segundos
  setTimeout(() => clearInterval(revisar), 30000);
})();

// ---- Guarda las preferencias en Supabase ----
async function saveUserPrefs(){
  applyTheme();

  if(!currentSession?.id){
    console.warn('⚠ Tema aplicado solo en este dispositivo: no hay sesión activa todavía.');
    return false;
  }

  const { error } = await sb.from('users').update({
    theme: userPrefs.theme,
    font_size: userPrefs.font_size,
    custom_text_color: userPrefs.custom_text_color,
    custom_accent_color: userPrefs.custom_accent_color,
    custom_bg_color: userPrefs.custom_bg_color
  }).eq('id', currentSession.id);

  if(error){
    console.error('❌ No se pudo guardar el tema en Supabase:', error.message);
    console.error('   → Revisa que la tabla "users" tenga las columnas: theme, font_size, custom_text_color, custom_accent_color, custom_bg_color');
    if(typeof showDbError === 'function') showDbError('tema', error.message);
    return false;
  }

  console.log('✅ Tema guardado:', userPrefs.theme, '| tamaño:', userPrefs.font_size);
  return true;
}

// Redibuja solo la pestaña de apariencia, sin recargar toda la pantalla
// (así no vuelve a "Mi Perfil" cada vez que se cambia algo).
function refreshAppearanceTab(){
  const cont = document.getElementById('settingsAppearance');
  if(cont){
    cont.innerHTML = renderAppearanceTab();
    if(typeof lucide !== 'undefined') lucide.createIcons();
  } else if(typeof render === 'function'){
    render();
  }
}

// ---- Acciones desde la interfaz ----
function selectTheme(themeKey){
  userPrefs.theme = themeKey;
  applyTheme();
  saveUserPrefs();
  refreshAppearanceTab();
}

function selectFontSize(sizeKey){
  userPrefs.font_size = sizeKey;
  applyTheme();
  saveUserPrefs();
  refreshAppearanceTab();
}

function updateCustomColor(which, value){
  if(which === 'text')   userPrefs.custom_text_color = value;
  if(which === 'accent') userPrefs.custom_accent_color = value;
  if(which === 'bg')     userPrefs.custom_bg_color = value;
  userPrefs.theme = 'custom';
  applyTheme();
  // Marcar visualmente la tarjeta "Personalizado" sin redibujar
  // (redibujar cerraría el selector de color que el usuario tiene abierto)
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
  const cards = document.querySelectorAll('.theme-card');
  if(cards.length) cards[cards.length - 1].classList.add('selected');

  clearTimeout(window._prefsSaveTimer);
  window._prefsSaveTimer = setTimeout(saveUserPrefs, 600);
}

function resetAppearance(){
  userPrefs = {
    theme: 'dark',
    font_size: 'md',
    custom_text_color: '#f1f5f9',
    custom_accent_color: '#06b6d4',
    custom_bg_color: '#0f172a'
  };
  applyTheme();
  saveUserPrefs();
  refreshAppearanceTab();
}

// ---- Pantalla de apariencia (pestaña dentro de Perfil y Configuración) ----
function renderAppearanceTab(){
  return `
  <div class="grid gap-6 lg:grid-cols-2">

    <!-- TEMAS -->
    <div class="card" style="background:var(--surface)">
      <h3 class="font-bold text-base mb-1">
        <i data-lucide="palette" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px"></i>Tema de la aplicación
      </h3>
      <p style="color:var(--textm);font-size:12px;margin-bottom:16px">Elige cómo se ve CleanClass. El cambio se guarda en tu cuenta.</p>

      <div class="grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        ${Object.entries(THEMES).map(([key, th]) => `
          <button class="theme-card ${userPrefs.theme===key?'selected':''}" onclick="selectTheme('${key}')">
            <div class="theme-swatch">
              ${th.swatch.map(c=>`<span style="background:${c}"></span>`).join('')}
            </div>
            <p style="font-weight:700;font-size:13px;color:var(--text)">
              <i data-lucide="${th.icon}" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:4px"></i>${th.name}
            </p>
            <p style="color:var(--textm);font-size:11px;margin-top:2px">${th.desc}</p>
            ${userPrefs.theme===key?`<p style="color:var(--accent);font-size:11px;font-weight:700;margin-top:6px">✓ En uso</p>`:''}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- TAMAÑO DE LETRA + PERSONALIZACIÓN -->
    <div class="flex flex-col gap-6">

      <div class="card" style="background:var(--surface)">
        <h3 class="font-bold text-base mb-1">
          <i data-lucide="type" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px"></i>Tamaño de letra
        </h3>
        <p style="color:var(--textm);font-size:12px;margin-bottom:14px">Agranda el texto si te cuesta leerlo.</p>

        <div class="flex gap-2 flex-wrap">
          ${Object.entries(FONT_SIZES).map(([key, fs]) => `
            <button class="pill ${userPrefs.font_size===key?'pill-primary':'pill-ghost'}" onclick="selectFontSize('${key}')">
              ${fs.label}
            </button>
          `).join('')}
        </div>

        <div style="margin-top:16px;padding:14px;border-radius:10px;background:var(--bg);border:1px solid var(--border)">
          <p style="color:var(--textm);font-size:11px;margin-bottom:4px">Vista previa</p>
          <p style="color:var(--text);font-weight:700">Grupo de aseo 10-A</p>
          <p style="color:var(--textm);font-size:13px">Evidencia subida correctamente.</p>
        </div>
      </div>

      <div class="card" style="background:var(--surface)">
        <h3 class="font-bold text-base mb-1">
          <i data-lucide="sliders" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px"></i>Colores personalizados
        </h3>
        <p style="color:var(--textm);font-size:12px;margin-bottom:14px">
          Al cambiar un color se activa el tema <strong>Personalizado</strong>.
        </p>

        <div class="flex flex-col gap-3">
          <label class="flex items-center justify-between" style="gap:12px">
            <span style="font-size:13px;color:var(--text)">Color de la letra</span>
            <input type="color" value="${userPrefs.custom_text_color}"
                   onchange="updateCustomColor('text', this.value)"
                   style="width:46px;height:32px;padding:0;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer">
          </label>

          <label class="flex items-center justify-between" style="gap:12px">
            <span style="font-size:13px;color:var(--text)">Color de fondo</span>
            <input type="color" value="${userPrefs.custom_bg_color}"
                   onchange="updateCustomColor('bg', this.value)"
                   style="width:46px;height:32px;padding:0;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer">
          </label>

          <label class="flex items-center justify-between" style="gap:12px">
            <span style="font-size:13px;color:var(--text)">Color de acento (botones)</span>
            <input type="color" value="${userPrefs.custom_accent_color}"
                   onchange="updateCustomColor('accent', this.value)"
                   style="width:46px;height:32px;padding:0;border:1px solid var(--border);border-radius:8px;background:none;cursor:pointer">
          </label>
        </div>

        <button class="pill pill-ghost w-full mt-4" onclick="resetAppearance()">
          <i data-lucide="rotate-ccw" style="width:14px;height:14px"></i> Restaurar apariencia por defecto
        </button>
      </div>

    </div>
  </div>`;
}

// ---- Sistema de pestañas de Perfil y Configuración ----
// Reemplaza switchSettingsTab para que reconozca la pestaña 'appearance'
// y recuerde cuál estaba abierta si la pantalla se vuelve a dibujar.
window._activeSettingsTab = 'profile';

window.switchSettingsTab = function(tab){
  window._activeSettingsTab = tab;

  document.querySelectorAll('.settings-tab').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));

  const map = {
    profile:    'settingsProfile',
    appearance: 'settingsAppearance',
    about:      'settingsAbout'
  };
  const target = document.getElementById(map[tab]);
  if(target) target.style.display = 'block';

  const idx = Object.keys(map).indexOf(tab);
  const botones = document.querySelectorAll('.tab');
  if(idx >= 0 && botones[idx]) botones[idx].classList.add('active');

  if(typeof lucide !== 'undefined') lucide.createIcons();
};

// Tras cualquier render de la pantalla de configuración, restaurar la pestaña abierta.
// Se observa el contenedor principal en vez de tocar render(), para no interferir
// con el resto de la aplicación.
window.addEventListener('load', () => {
  const main = document.getElementById('main');
  if(!main) return;
  new MutationObserver(() => {
    if(document.getElementById('settingsAppearance') && window._activeSettingsTab !== 'profile'){
      const target = document.getElementById(
        window._activeSettingsTab === 'appearance' ? 'settingsAppearance' : 'settingsAbout'
      );
      // Solo actuar si la pestaña guardada no es la que se está mostrando
      if(target && target.style.display === 'none'){
        switchSettingsTab(window._activeSettingsTab);
      }
    }
  }).observe(main, { childList: true });
});
