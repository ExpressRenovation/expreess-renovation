// Asigna el custom claim { admin: true } a un usuario de Firebase Auth por email.
// Standalone (sin alias @/): usa Application Default Credentials (ADC).
//
// Requisitos:
//   - ADC apuntando a express-renovation:
//       gcloud auth application-default login   (con expressrenovation.platform@gmail.com)
//       gcloud auth application-default set-quota-project express-renovation
//   - El usuario ya debe existir en Firebase Auth (crealo por /signup o Console).
//
// Uso (desde la raíz del repo):
//   node src/backend/auth/scripts/set-admin.mjs tu-email@ejemplo.com
//
// Tras ejecutarlo, cierra sesión y vuelve a entrar para refrescar el token con el claim.

import admin from 'firebase-admin';

const projectId =
  process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'express-renovation';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const email = process.argv[2];
if (!email) {
  console.error('Uso: node src/backend/auth/scripts/set-admin.mjs <email>');
  process.exit(1);
}

try {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`OK: admin=true asignado a ${email} (uid ${user.uid}) en proyecto ${projectId}.`);
  console.log('Cierra sesión y vuelve a entrar para que el token recoja el claim.');
  process.exit(0);
} catch (err) {
  console.error('ERROR:', err?.message || err);
  process.exit(1);
}
