// Crea/actualiza un usuario de TEST en Firebase Auth (proyecto propio) para
// verificar el editor en local. Usa ADC (como set-admin.mjs) — no SA keys.
//
// Qué hace:
//   - Crea el usuario (o lo actualiza si ya existe) con email/password dados.
//   - Marca emailVerified=true y le asigna el custom claim { admin: true }.
//   - Emite un CUSTOM TOKEN → se intercambia por un ID token en el navegador
//     (signInWithCustomToken) para establecer la sesión SIN teclear la contraseña.
//
// Requisitos: ADC apuntando a express-renovation
//   gcloud auth application-default login   (expressrenovation.platform@gmail.com)
//
// Uso:
//   node src/backend/auth/scripts/create-test-user.mjs <email> <password>
//   (imprime uid + customToken en stdout como JSON en la última línea)

import admin from 'firebase-admin';

const projectId =
  process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'express-renovation';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Uso: node src/backend/auth/scripts/create-test-user.mjs <email> <password>');
  process.exit(1);
}

const CLAIMS = { admin: true };

try {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password, emailVerified: true, disabled: false });
    console.error(`Usuario existente actualizado: ${email} (uid ${user.uid}).`);
  } catch (e) {
    if (e?.code === 'auth/user-not-found') {
      user = await admin.auth().createUser({
        email,
        password,
        emailVerified: true,
        displayName: 'Test Editor',
      });
      console.error(`Usuario creado: ${email} (uid ${user.uid}).`);
    } else {
      throw e;
    }
  }

  await admin.auth().setCustomUserClaims(user.uid, CLAIMS);
  console.error(`Claims asignados: ${JSON.stringify(CLAIMS)}`);

  const customToken = await admin.auth().createCustomToken(user.uid, CLAIMS);
  // Última línea = JSON parseable (uid + customToken) para el paso de navegador.
  console.log(JSON.stringify({ uid: user.uid, email, customToken }));
  process.exit(0);
} catch (err) {
  console.error('ERROR:', err?.message || err);
  process.exit(1);
}
