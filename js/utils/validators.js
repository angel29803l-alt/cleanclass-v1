// ============================================================
// js/utils/validators.js — Validaciones reusables de formularios
// ============================================================

// Valida el formato de un correo electrónico.
// Además del formato general, exige que el dominio tenga una extensión
// de al menos 2 letras (evita cosas como "a@b.c") y descarta errores
// comunes como puntos seguidos o al inicio/final.
function isValidEmail(email){
  if(!email || typeof email !== 'string') return false;

  const limpio = email.trim();

  if(limpio.length < 6 || limpio.length > 254) return false;
  if(limpio.includes('..')) return false;
  if(limpio.startsWith('.') || limpio.endsWith('.')) return false;
  if((limpio.match(/@/g) || []).length !== 1) return false;

  const [usuario, dominio] = limpio.split('@');
  if(!usuario || !dominio) return false;
  if(usuario.startsWith('.') || usuario.endsWith('.')) return false;
  if(dominio.startsWith('-') || dominio.endsWith('-')) return false;
  if(!dominio.includes('.')) return false;

  const extension = dominio.split('.').pop();
  if(extension.length < 2) return false;

  const patron = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  return patron.test(limpio);
}

// Valida un nombre de persona: solo letras, espacios, tildes, guiones y apóstrofes
function isValidName(name){
  if(!name || typeof name !== 'string') return false;
  const limpio = name.trim();
  if(limpio.length < 3 || limpio.length > 80) return false;
  return /^[a-zA-ZÁÉÍÓÚáéíóúÑñÜü\s'-]+$/.test(limpio);
}
