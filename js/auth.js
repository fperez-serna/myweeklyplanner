// ── QUICK GASTO WIDGET ─────────────────────
function launchFullApp(){
  document.querySelector('.db').style.display='';
  document.getElementById('settings-btn-wrap').style.display='flex';
  document.getElementById('logout-btn').style.display='block';
  const qs=document.getElementById('quick-gasto-screen');
  if(qs)qs.style.display='none';
  initApp();
  renderDay();
  buildCalendar();
  setTimeout(()=>{showQ(QS[qcur]);fetchWeather();},200);
  renderSh();
}

function showQuickGasto(){
  const screen=document.getElementById('quick-gasto-screen');
  if(!screen)return launchFullApp();
  screen.style.display='flex';
  if(typeof lucide!=='undefined')lucide.createIcons();

  const es=!isEn();
  const b=id=>document.getElementById(id);
  if(b('qg-title'))b('qg-title').textContent=es?'Agregar gasto':'Add expense';
  if(b('qg-sub'))b('qg-sub').textContent=es?'Registra rápido y sigue con tu día':'Log it fast and get on with your day';
  if(b('qg-btn'))b('qg-btn').textContent=es?'+ Agregar gasto':'+ Add expense';
  if(b('qg-full-btn'))b('qg-full-btn').textContent=es?'Ver semana completa →':'Open full app →';
  if(b('qg-never-lbl'))b('qg-never-lbl').textContent=es?'Nunca más mostrar esta pantalla':'Never show this screen again';

  // Categorías
  const catSel=b('qg-cat');
  if(catSel){
    const cats=setupCfg.gastoCats||['Restaurante','Supermercado','Transporte','Ejercicio','Casa','Otro'];
    catSel.innerHTML=cats.map(c=>`<option>${c}</option>`).join('');
  }

  // Métodos de pago (igual que el formulario principal)
  const pagoSel=b('qg-pago');
  if(pagoSel){
    pagoSel.innerHTML=`<option value="Efectivo">${es?'Efectivo':'Cash'}</option><option value="Débito">${es?'Débito':'Debit'}</option>`;
    (budgetData?.debts||[]).filter(d=>d.tipo==='tarjeta').forEach(d=>{
      const opt=document.createElement('option');
      opt.value=d.nombre;opt.textContent=d.nombre;
      pagoSel.appendChild(opt);
    });
  }

  qgUpdateTotal();
  setTimeout(()=>b('qg-desc')?.focus(),300);
}

function qgUpdateTotal(){
  const totalEl=document.getElementById('qg-total');
  if(!totalEl)return;
  const es=!isEn();
  let total=0;
  for(let i=0;i<7;i++){
    (weekData.gastos?.[i]||[]).forEach(g=>total+=g.monto||0);
  }
  totalEl.textContent=`${es?'Total semana':'Week total'}: $${total.toLocaleString()}`;
}

function quickGastoAdd(){
  const desc=document.getElementById('qg-desc')?.value.trim();
  const cat=document.getElementById('qg-cat')?.value||'Otro';
  const pagoCon=document.getElementById('qg-pago')?.value||'Efectivo';
  const monto=parseFloat(document.getElementById('qg-monto')?.value);
  if(!desc||!monto||monto<=0){
    if(!desc)document.getElementById('qg-desc')?.focus();
    return;
  }
  const di=dayIdx();
  if(!weekData.gastos)weekData.gastos={};
  if(!weekData.gastos[di])weekData.gastos[di]=[];
  weekData.gastos[di].push({desc,cat,monto,pagoCon});
  saveDB();
  qgUpdateTotal();

  const confirm=document.getElementById('qg-confirm');
  if(confirm){
    const es=!isEn();
    confirm.textContent=es?`Listo — $${monto.toLocaleString()} registrado`:`Done — $${monto.toLocaleString()} logged`;
    confirm.style.display='block';
    setTimeout(()=>confirm.style.display='none',2000);
  }
  document.getElementById('qg-desc').value='';
  document.getElementById('qg-monto').value='';
  document.getElementById('qg-desc')?.focus();
}

function quickGastoGoFull(fromBtn=true){
  const neverCb=document.getElementById('qg-never');
  if(neverCb?.checked){
    localStorage.setItem('wp_never_quick_gasto','1');
  }
  launchFullApp();
}

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
  if(b('remember-me-lbl'))b('remember-me-lbl').textContent=en?'Remember me':'Recuérdame';
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
    const remember=document.getElementById('remember-me')?.checked!==false;
    const persistence=remember
      ?firebase.auth.Auth.Persistence.LOCAL
      :firebase.auth.Auth.Persistence.SESSION;
    await auth.setPersistence(persistence);
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

      const isMobile=window.innerWidth<=768;
      const neverShow=localStorage.getItem('wp_never_quick_gasto')==='1';
      const quickGastoEnabled=setupCfg.features?.quickGasto!==false;

      if(isMobile&&quickGastoEnabled&&!neverShow){
        // Pre-cargar config y tarjetas antes de mostrar el widget (dos lecturas rápidas en paralelo)
        try{
          const [cfgSnap,budSnap]=await Promise.all([
            userCol().doc('config').get(),
            userCol().doc('budget_config').get(),
          ]);
          if(cfgSnap.exists)Object.assign(setupCfg,cfgSnap.data());
          if(budSnap.exists&&budSnap.data().debts)budgetData.debts=budSnap.data().debts;
        }catch(e){}
        showQuickGasto();
      } else {
        launchFullApp();
      }

      // Cargar Firebase en background sin bloquear la UI
      document.getElementById('ev-date').value=dk(today);
      try{
        await loadDB();
        await loadPendingTasks();
        await loadShoppingDB();
        await loadAnnualData();
        applyConfig(setupCfg);
        applyLang(setupCfg.lang||'es');
        subscribeDB();
        setTimeout(()=>autoBackup(),3000);
        subscribeShoppingDB();
        subscribeConfig();
      }catch(e){
        console.warn('Firebase error:',e);
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
