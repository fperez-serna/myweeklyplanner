// ── AUTH ───────────────────────────────────
let loginLang=localStorage.getItem('wp_login_lang')||'es';
function applyLoginLang(){
  const en=loginLang==='en';
  const b=id=>document.getElementById(id);
  if(b('login-lang-btn'))b('login-lang-btn').textContent=en?'ES':'EN';
  if(b('login-quote'))b('login-quote').textContent=en?'Time, fragile and fleeting, is the most precious gift, and only when lived wisely does it grant the quiet freedom of having truly been.':'El tiempo, frágil y efímero, es el bien más preciado, y solo quien lo vive con conciencia alcanza la quieta libertad de haber existido de verdad.';
  if(b('login-pass'))b('login-pass').placeholder=en?'Password':'Contraseña';
  if(b('login-btn'))b('login-btn').textContent=en?'Sign in':'Entrar';
  if(b('login-forgot-btn'))b('login-forgot-btn').textContent=en?'Forgot my password':'Olvidé mi contraseña';
  if(b('login-privacy'))b('login-privacy').textContent=en?'Your data is private and only you can see it.':'Tus datos son privados y solo tú puedes verlos.';
  if(b('login-signup-prompt'))b('login-signup-prompt').textContent=en?"Don't have an account yet?":'¿Aún no tienes cuenta?';
  if(b('login-buy-link'))b('login-buy-link').textContent=en?'Buy access →':'Comprar acceso →';
}
function toggleLoginLang(){
  loginLang=loginLang==='es'?'en':'es';
  localStorage.setItem('wp_login_lang',loginLang);
  applyLoginLang();
}
async function signInEmail(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  const err=document.getElementById('login-error');
  if(!email||!pass){
    if(!email)flashInvalid(document.getElementById('login-email'));
    if(!pass)flashInvalid(document.getElementById('login-pass'));
    if(err){err.style.display='block';err.textContent=isEn()?'Enter email and password':'Ingresa email y contraseña';}
    return;
  }
  try{
    await auth.signInWithEmailAndPassword(email,pass);
    if(err)err.style.display='none';
  }catch(e){
    if(err){err.style.display='block';err.textContent=isEn()?'Incorrect email or password':'Email o contraseña incorrectos';}
  }
}

async function forgotPassword(){
  const email=document.getElementById('login-email').value.trim();
  if(!email){alert(isEn()?'Enter your email first':'Ingresa tu email primero');return;}
  try{
    await auth.sendPasswordResetEmail(email);
    alert(isEn()?'Reset email sent!':'¡Email de recuperación enviado!');
  }catch(e){alert(isEn()?'Error sending email':'Error al enviar el email');}
}

function signOut(){
  auth.signOut().then(()=>{
    currentUser=null;
    const wall=document.getElementById('payment-wall');
    if(wall)wall.remove();
    document.getElementById('login-screen').style.display='flex';
    document.querySelector('.db').style.display='none';
    document.getElementById('logout-btn').style.display='none';
    applyLoginLang();
  });
}

// ── MAIN INIT ──────────────────────────────
(function(){
  initFirebase();
  document.getElementById('login-screen').style.display='flex';
  document.querySelector('.db').style.display='none';
  applyLoginLang();

  auth.onAuthStateChanged(async user=>{
    if(user){
      currentUser=user;

      // Check if user has paid access
      try{
        const checkFn=window.fbFunctions||firebase.app().functions('us-central1');
        const checkAccess=checkFn.httpsCallable('checkAccess');
        const result=await checkAccess();
        if(!result.data.hasAccess){
          // No access - show payment screen
          document.getElementById('login-screen').style.display='none';
          document.querySelector('.db').style.display='none';
          showPaymentWall(result.data.expired);
          return;
        }
      }catch(e){
        // Block on explicit permission errors; allow on network/availability issues
        const blocked=['permission-denied','unauthenticated','not-found'];
        if(e.code&&blocked.includes(e.code)){
          document.getElementById('login-screen').style.display='none';
          document.querySelector('.db').style.display='none';
          showPaymentWall(false);
          return;
        }
        console.warn('Access check failed (network/functions issue), allowing:', e);
      }

      document.getElementById('login-screen').style.display='none';
      document.querySelector('.db').style.display='';
      document.getElementById('settings-btn-wrap').style.display='flex';
      document.getElementById('logout-btn').style.display='block';

      initApp();
      document.getElementById('ev-date').value=dk(today);
      try{
        await loadDB();
        await loadPendingTasks();
        await loadShoppingDB();
        await loadAnnualData();
        applyConfig(setupCfg);
        applyLang(setupCfg.lang||'es');
        renderDay();
        buildCalendar();
        setTimeout(()=>{showQ(QS[qcur]);fetchWeather();},200);
        subscribeDB();
        setTimeout(()=>autoBackup(),3000); // run after everything loads
        subscribeShoppingDB();
        subscribeConfig();
      }catch(e){
        console.warn('Firebase error:',e);
        renderDay();
        renderSh();
      }
      fetchGCal();
      initGCal();
    } else {
      document.getElementById('login-screen').style.display='flex';
      document.querySelector('.db').style.display='none';
      document.getElementById('logout-btn').style.display='none';
    }
  });
})();
