async function uploadHelpImage(file, topicId) {
  const ext = file.name.split('.').pop();
  const fileName = `ayuda_${topicId || Date.now()}_${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from('ayuda')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Error subiendo imagen de ayuda:', error.message);
    return null;
  }

  const { data } = sb.storage.from('ayuda').getPublicUrl(fileName);
  return data.publicUrl;
}

// Crea el estudiante en Supabase Auth (para que pueda iniciar sesión) y en la tabla students.
async function uploadEvidenceImage(file, evidenceId) {
  const ext = file.name.split('.').pop();
  const fileName = `evidencia_${evidenceId}_${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from('evidencias')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Error subiendo imagen:', error.message);
    return null;
  }

  const { data } = sb.storage
    .from('evidencias')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Elimina una foto del storage
async function deleteEvidenceImage(imageUrl) {
  if (!imageUrl) return;
  const fileName = imageUrl.split('/evidencias/').pop();
  await sb.storage.from('evidencias').remove([fileName]);
}

// Sube foto y guarda la evidencia en la base de datos
