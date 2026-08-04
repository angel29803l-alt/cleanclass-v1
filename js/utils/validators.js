// ============================================================
// js/utils/validators.js — Validaciones reusables de formularios
// ============================================================

// Valida formato básico de correo electrónico
function isValidEmail(email){
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
