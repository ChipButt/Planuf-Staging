
(function(){
  const firebaseAppUrl = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
  const firebaseAuthUrl = "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
  const projectId = "planufproductions-d1484";
  const firebaseConfig = {
    apiKey: "AIzaSyD2BphkPc8Ho_7QPmOxtnRWVcMSfqLJf7o",
    authDomain: "planufproductions-d1484.firebaseapp.com",
    projectId: "planufproductions-d1484",
    storageBucket: "planufproductions-d1484.firebasestorage.app",
    messagingSenderId: "1064640847372",
    appId: "1:1064640847372:web:291b833757f82b7f9e5829",
    measurementId: "G-CV076XFFKE"
  };

  async function getCurrentIdToken(){
    const [appModule, authModule] = await Promise.all([import(firebaseAppUrl), import(firebaseAuthUrl)]);
    const app = appModule.getApps().length ? appModule.getApps()[0] : appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      throw new Error("You must be signed in to Firebase as an admin before archive, restore or delete can change Firebase Authentication.");
    }
    return user.getIdToken(true);
  }

  window.planufAdminUserAction = async function(functionName, payload){
    if (!payload || !payload.firebaseAuthUid) return { ok:true, skipped:true };
    const token = await getCurrentIdToken();
    const response = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    let body = {};
    try { body = await response.json(); } catch (error) { body = {}; }
    if (!response.ok || body.ok === false) {
      throw new Error(body.error || `Firebase admin action failed: ${functionName}`);
    }
    return body;
  };
})();
