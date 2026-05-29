const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

admin.initializeApp();

const ALLOWED_ORIGINS = new Set([
  'https://chipbutt.github.io',
  'https://jameschipbutt.github.io',
  'https://planufproductions-d1484.web.app',
  'https://planufproductions-d1484.firebaseapp.com',
]);

function sendCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

async function requireAdmin(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) throw new Error('Missing Firebase ID token.');

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const db = admin.firestore();

  let userDoc = null;
  const byUid = await db.collection('usersByUid').doc(decoded.uid).get();
  if (byUid.exists) userDoc = byUid.data();

  if (!userDoc) {
    const byUserUid = await db.collection('users').where('firebaseAuthUid', '==', decoded.uid).limit(1).get();
    if (!byUserUid.empty) userDoc = byUserUid.docs[0].data();
  }

  if (!userDoc || userDoc.role !== 'Admin' || userDoc.active === false || userDoc.loginEnabled === false) {
    throw new Error('Only active Planuf admin users can change staff authentication records.');
  }

  return { decoded, userDoc };
}

function getPayload(req) {
  return typeof req.body === 'object' && req.body ? req.body : {};
}

function requireUid(payload) {
  const uid = String(payload.firebaseAuthUid || '').trim();
  if (!uid) throw new Error('Missing firebaseAuthUid.');
  return uid;
}

async function updateFirestoreArchiveState({ payload, action, caller }) {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const profileId = String(payload.profileId || '').trim();
  const linkedUserId = String(payload.linkedUserId || '').trim();
  const firebaseAuthUid = String(payload.firebaseAuthUid || '').trim();
  const batch = db.batch();

  if (profileId) {
    const profileRef = db.collection('profiles').doc(profileId);
    if (action === 'archive') {
      batch.set(profileRef, { active: false, status: 'archived', loginEnabled: false, archivedAt: now, archivedBy: caller.userDoc.id || caller.decoded.uid, updatedAt: now }, { merge: true });
    } else if (action === 'restore') {
      batch.set(profileRef, { active: true, status: 'active', loginEnabled: true, restoredAt: now, restoredBy: caller.userDoc.id || caller.decoded.uid, updatedAt: now }, { merge: true });
    }
  }

  const userIds = new Set();
  if (linkedUserId) userIds.add(linkedUserId);
  if (firebaseAuthUid) {
    const byUid = await db.collection('usersByUid').doc(firebaseAuthUid).get();
    if (byUid.exists && byUid.data().userId) userIds.add(byUid.data().userId);
    const byUserUid = await db.collection('users').where('firebaseAuthUid', '==', firebaseAuthUid).get();
    byUserUid.forEach((doc) => userIds.add(doc.id));
  }

  for (const userId of userIds) {
    const ref = db.collection('users').doc(userId);
    if (action === 'archive') {
      batch.set(ref, { active: false, loginEnabled: false, archivedAt: now, archivedBy: caller.userDoc.id || caller.decoded.uid }, { merge: true });
    } else if (action === 'restore') {
      batch.set(ref, { active: true, loginEnabled: true, restoredAt: now, restoredBy: caller.userDoc.id || caller.decoded.uid }, { merge: true });
    }
  }

  await batch.commit();
}

async function deleteFirestoreRecords({ payload }) {
  const db = admin.firestore();
  const profileId = String(payload.profileId || '').trim();
  const linkedUserId = String(payload.linkedUserId || '').trim();
  const firebaseAuthUid = String(payload.firebaseAuthUid || '').trim();
  const batch = db.batch();

  if (profileId) batch.delete(db.collection('profiles').doc(profileId));
  if (linkedUserId) batch.delete(db.collection('users').doc(linkedUserId));
  if (firebaseAuthUid) batch.delete(db.collection('usersByUid').doc(firebaseAuthUid));

  if (firebaseAuthUid) {
    const users = await db.collection('users').where('firebaseAuthUid', '==', firebaseAuthUid).get();
    users.forEach((doc) => batch.delete(doc.ref));
  }

  if (profileId) {
    const usersByProfile = await db.collection('users').where('profileId', '==', profileId).get();
    usersByProfile.forEach((doc) => batch.delete(doc.ref));
  }

  await batch.commit();
}

function makeHandler(action) {
  return onRequest({ region: 'us-central1', cors: false }, async (req, res) => {
    sendCors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only.' });

    try {
      const caller = await requireAdmin(req);
      const payload = getPayload(req);
      const uid = requireUid(payload);

      if (action === 'delete') {
        await admin.auth().deleteUser(uid);
        await deleteFirestoreRecords({ payload });
        return res.json({ ok: true, action: 'delete', firebaseAuthUid: uid });
      }

      if (action === 'archive') {
        await admin.auth().updateUser(uid, { disabled: true });
        await updateFirestoreArchiveState({ payload, action: 'archive', caller });
        return res.json({ ok: true, action: 'archive', firebaseAuthUid: uid });
      }

      if (action === 'restore') {
        await admin.auth().updateUser(uid, { disabled: false });
        await updateFirestoreArchiveState({ payload, action: 'restore', caller });
        return res.json({ ok: true, action: 'restore', firebaseAuthUid: uid });
      }

      return res.status(400).json({ ok: false, error: 'Unknown action.' });
    } catch (error) {
      logger.error(`Planuf ${action} staff user action failed`, error);
      return res.status(400).json({ ok: false, error: error.message || 'Admin user action failed.' });
    }
  });
}

exports.deleteStaffUser = makeHandler('delete');
exports.archiveStaffUser = makeHandler('archive');
exports.restoreStaffUser = makeHandler('restore');


exports.notifyOnMessageCreated = onDocumentCreated({
  region: 'us-central1',
  document: 'messages/{messageId}'
}, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const message = snap.data() || {};
  const toUserIds = Array.isArray(message.toUserIds) ? message.toUserIds.filter(Boolean) : [message.toUserId].filter(Boolean);
  if (!toUserIds.length) return;

  const db = admin.firestore();
  const tokenDocs = [];
  for (const appUserId of toUserIds.slice(0, 10)) {
    const subSnap = await db.collection('pushSubscriptions')
      .where('appUserId', '==', appUserId)
      .get();
    subSnap.forEach((doc) => tokenDocs.push(doc));
  }

  const tokens = Array.from(new Set(tokenDocs
    .map((doc) => (doc.data() || {}).fcmToken)
    .filter(Boolean)));
  if (!tokens.length) return;

  let senderName = 'Planuf';
  if (message.fromUserId) {
    try {
      const sender = await db.collection('users').doc(message.fromUserId).get();
      if (sender.exists) {
        const senderData = sender.data() || {};
        senderName = senderData.displayName || senderData.nickname || senderName;
      }
    } catch (error) {
      logger.warn('Could not resolve Planuf message sender name', error);
    }
  }

  const body = String(message.body || 'You have received a new message.').slice(0, 180);
  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: `New Planuf message from ${senderName}`,
      body
    },
    data: {
      type: 'planuf-message',
      messageId: String(event.params.messageId || ''),
      threadId: String(message.threadId || ''),
      fromUserId: String(message.fromUserId || ''),
      body
    },
    webpush: {
      fcmOptions: {
        link: message.threadId ? `/#/messages/${encodeURIComponent(String(message.threadId))}` : '/#/messages'
      }
    }
  });

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error && result.error.code ? result.error.code : '';
      logger.warn('Planuf push notification failed', { code, token: tokens[index] });
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  if (invalidTokens.length) {
    const batch = db.batch();
    tokenDocs.forEach((doc) => {
      const token = (doc.data() || {}).fcmToken;
      if (invalidTokens.includes(token)) batch.set(doc.ref, { fcmToken: '', invalidatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    await batch.commit();
  }
});
