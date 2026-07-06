// ── QUICK GASTO WIDGET ─────────────────────
let _weatherInterval=null;
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
  if(_weatherInterval)clearInterval(_weatherInterval);
  _weatherInterval=setInterval(fetchWeather, 10*60*1000);
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

  // Categorías — deduplicadas y sincronizadas con la config actual
  const catSel=b('qg-cat');
  if(catSel){
    const rawCats=(setupCfg.gastoCats&&setupCfg.gastoCats.length)?setupCfg.gastoCats:DEFAULT_GASTOS;
    const cats=[...new Set(rawCats.includes(PAGO_CREDITO_CAT)?rawCats:[...rawCats,PAGO_CREDITO_CAT])];
    const otroLabel=es?'+ Nueva categoría':'+ New category';
    catSel.innerHTML=cats.map(c=>`<option>${c}</option>`).join('')+`<option value="__new__">${otroLabel}</option>`;
    catSel.onchange=function(e){qgToggleNewCat(e.target.value);qgUpdatePagoSel();};
  }
  const newCatEl=b('qg-cat-new');
  if(newCatEl){newCatEl.style.display='none';newCatEl.value='';}

  // Métodos de pago (igual que el formulario principal)
  qgUpdatePagoSel();

  qgUpdateTotal();
  setTimeout(()=>b('qg-desc')?.focus(),300);
}

function qgUpdatePagoSel(){
  const es=!isEn();
  const pagoSel=document.getElementById('qg-pago');
  if(!pagoSel)return;
  const catVal=document.getElementById('qg-cat')?.value||'';
  if(catVal===PAGO_CREDITO_CAT){
    pagoSel.innerHTML='';
    (budgetData?.debts||[]).forEach(d=>{
      const opt=document.createElement('option');
      opt.value=d.nombre;opt.textContent=(d.tipo==='tarjeta'?'💳 ':'🏦 ')+d.nombre;
      pagoSel.appendChild(opt);
    });
  } else {
    pagoSel.innerHTML=`<option value="Efectivo">${es?'Efectivo':'Cash'}</option><option value="Débito">${es?'Débito':'Debit'}</option><option value="Transferencia">${es?'Transferencia':'Transfer'}</option>`;
    (budgetData?.debts||[]).filter(d=>d.tipo==='tarjeta').forEach(d=>{
      const opt=document.createElement('option');
      opt.value=d.nombre;opt.textContent=d.nombre;
      pagoSel.appendChild(opt);
    });
  }
}

function qgUpdateTotal(){
  const totalEl=document.getElementById('qg-total');
  if(!totalEl)return;
  const es=!isEn();
  let total=0;
  const todayDi=weekDays.findIndex(d=>dk(d)===dk(today));
  const maxDi=todayDi>=0?todayDi:6;
  for(let i=0;i<=maxDi;i++){
    (weekData.gastos?.[i]||[]).forEach(g=>total+=g.monto||0);
  }
  totalEl.textContent=`${es?'Total semana':'Week total'}: $${total.toLocaleString()}`;
}

function qgToggleNewCat(val){
  const inp=document.getElementById('qg-cat-new');
  if(!inp)return;
  inp.style.display=val==='__new__'?'block':'none';
  if(val==='__new__')setTimeout(()=>inp.focus(),50);
}

function quickGastoAdd(){
  const desc=document.getElementById('qg-desc')?.value.trim();
  const catSel=document.getElementById('qg-cat');
  const catNew=document.getElementById('qg-cat-new')?.value.trim();
  const cat=(catSel?.value==='__new__')?(catNew||'Otro'):(catSel?.value||'Otro');
  if(catSel?.value==='__new__'&&catNew){
    if(!setupCfg.gastoCats)setupCfg.gastoCats=[...DEFAULT_GASTOS];
    if(!setupCfg.gastoCats.includes(catNew)){setupCfg.gastoCats.push(catNew);saveConfigToFirebase();localStorage.setItem('wp_config',JSON.stringify(setupCfg));}
  }
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
  const qgDesc=document.getElementById('qg-desc');
  const qgMonto=document.getElementById('qg-monto');
  if(qgDesc){qgDesc.value='';qgDesc.focus();}
  if(qgMonto)qgMonto.value='';
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
    localStorage.setItem('wp_remember',remember?'1':'0');
    await auth.setPersistence(remember?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);
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

async function signOut(){
  showToast(isEn()?'Saving...':'Guardando...');
  await flushPendingSaves();
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
  // Set persistence at startup from saved preference — avoids blocking login
  const rememberPref=localStorage.getItem('wp_remember')!=='0';
  auth.setPersistence(rememberPref?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);
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

      const isFirstTime=!localStorage.getItem('wp_config');
      if(isMobile&&quickGastoEnabled&&!neverShow&&!isFirstTime){
        // Leer config del localStorage (instantáneo, mismo dispositivo) —
        // misma lógica de fallback que initApp() para arrays vacíos.
        const savedCfg=localStorage.getItem('wp_config');
        if(savedCfg){try{const cfg=JSON.parse(savedCfg);setupCfg={...setupCfg,...cfg,gastoCats:cfg.gastoCats&&cfg.gastoCats.length?cfg.gastoCats:[...DEFAULT_GASTOS],shopCats:cfg.shopCats&&cfg.shopCats.length?cfg.shopCats:[...DEFAULT_SHOP],workouts:cfg.workouts&&cfg.workouts.length?cfg.workouts:[...DEFAULT_WORKOUTS],habitos:cfg.habitos&&cfg.habitos.length?cfg.habitos:[...DEFAULT_HABITOS]};}catch(e){}}
        // Pre-cargar tarjetas de crédito desde Firebase (una lectura rápida)
        try{
          const budSnap=await userCol().doc('budget_config').get();
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
        renderSh();
        await loadAnnualData();
        loadBudgetDebts();
        applyConfig(setupCfg);
        applyLang(setupCfg.lang||'es');
        subscribeDB();
        setTimeout(()=>autoBackup(),3000);
        subscribeShoppingDB();
        subscribeConfig();
        setTimeout(()=>startTour(),800);
        // Refrescar quick gasto si está abierto (asegura categorías actualizadas)
        const qgEl=document.getElementById('quick-gasto-screen');
        if(qgEl&&qgEl.style.display==='flex')showQuickGasto();
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
