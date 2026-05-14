// /api/createStoreAdmin.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, nickname, storeId } = req.body;

  if (!email || !password || !nickname || !storeId) {
    return res.status(400).json({ error: '필수 항목이 누락됐어요.' });
  }

  try {
    // Firebase Auth 계정 생성
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nickname,
    });

    // Firestore에 유저 정보 저장
    await admin.firestore().doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email,
      nickname,
      isAdmin: true,
      adminRole: 'store',
      storeId,
      managedStores: [],
      passwordChanged: false,
      points: 0,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
    console.error('계정 생성 실패:', error);
    return res.status(500).json({ error: error.message });
  }
};