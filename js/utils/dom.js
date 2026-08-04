// ============================================================
// js/utils/dom.js — Helpers genéricos para manipular el DOM
// ============================================================

// Muestra/oculta el texto de un campo de contraseña
function togglePassword(id, icon){
  const input = document.getElementById(id);
  if(input.type === 'password'){
    input.type = 'text';
    icon.classList.add('active');
  } else {
    input.type = 'password';
    icon.classList.remove('active');
  }
}
