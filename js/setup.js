// ── TRANSLATIONS ───────────────────────────
const T = {
  es: {
    viendo:'Viendo', progreso:'Progreso del día',
    semana:'Semana — click para navegar',
    overview:'Overview semanal',
    pendientes:'Pendientes', enfoque:'Enfoque del día',
    agenda:'Agenda', workout:'Workout', habito:'Hábito',
    compras:'Lista de compras', supermercado:'Supermercado',
    casa:'Casa', personal:'Personal', mama:'Mamá', negocio:'Negocio',
    gastos:'Gastos del día', totalSemana:'Total semana',
    porCategoria:'Por categoría esta semana',
    recordatorio:'Recordatorio del día', nuevaFrase:'nueva frase',
    agregar:'+ Agregar', agregarEvento:'Agregar evento:',
    clima:'Obteniendo ubicación...',
    conectarGcal:'Conectar Google Calendar',
    agregarPendiente:'Agregar pendiente...',
    primerEnfoque:'Primer enfoque...',
    segundoEnfoque:'Segundo enfoque...',
    tercerEnfoque:'Tercer enfoque...',
    desc:'Descripción...', monto:'$0',
    listo:'¡Listo, empezar!'
  },
  en: {
    viendo:'Viewing', progreso:'Day progress',
    semana:'Week — click to navigate',
    overview:'Weekly overview',
    pendientes:'To-do', enfoque:'Focus of the day',
    agenda:'Schedule', workout:'Workout', habito:'Habit',
    compras:'Shopping list', supermercado:'Grocery',
    casa:'Home', personal:'Personal', mama:'Mom', negocio:'Business',
    gastos:'Daily expenses', totalSemana:'Week total',
    porCategoria:'By category this week',
    recordatorio:'Daily reminder', nuevaFrase:'new quote',
    agregar:'+ Add', agregarEvento:'Add event:',
    clima:'Getting location...',
    conectarGcal:'Connect Google Calendar',
    agregarPendiente:'Add to-do...',
    primerEnfoque:'First focus...',
    segundoEnfoque:'Second focus...',
    tercerEnfoque:'Third focus...',
    desc:'Description...', monto:'$0',
    listo:'Get started!'
  }
};

const WORKOUT_MAP={
  '🤿 Apnea':'🤿 Free Diving',
  '💃 Baile':'💃 Dance',
  '🥊 Box':'🥊 Box',
  '🏃 Correr':'🏃 Running',
  '🏅 CrossFit':'🏅 CrossFit',
  '🧗 Escalar':'🧗 Climbing',
  '🏇 Equitación':'🏇 Horse Riding',
  '⚡ Funcional':'⚡ Functional',
  '🏋️ Gym':'🏋️ Gym',
  '🔥 HIIT':'🔥 HIIT',
  '🏊 Nadar':'🏊 Swimming',
  '🏓 Padel':'🏓 Padel',
  '⛸️ Patinar':'⛸️ Skate',
  '🧘 Pilates':'🧘 Pilates',
  '🎾 Tennis':'🎾 Tennis',
  '🌿 Yoga':'🌿 Yoga',
};
const DEFAULT_WORKOUTS=Object.keys(WORKOUT_MAP);
const HABITO_MAP={
  '✍️ Escribir':'✍️ Journal',
  '🙏 Gratitud':'🙏 Gratitude',
  '📖 Leer':'📖 Read',
  '🧘 Meditar':'🧘 Meditate',
  '💤 Sleep 8hrs':'💤 Sleep 8hrs',
  '🤸 Stretching':'🤸 Stretching',
  '🚰 Tomar agua':'🚰 Drink water',
};
const DEFAULT_HABITOS=Object.keys(HABITO_MAP);
const DEFAULT_SHOP_ES=['Supermercado','Casa','Personal','Oficina'];
const DEFAULT_SHOP_EN=['Supermarket','Home','Personal','Office'];
let DEFAULT_SHOP=[...DEFAULT_SHOP_ES];

function updateGastosLang(lang){
  const isEn=lang==='en';
  // Translate workout/habito selects
  ['wo1','wo2'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    const cur=sel.value;
    const opts=Array.from(sel.options).map(o=>o.value||'');
    sel.innerHTML='<option value="">—</option>'+(setupCfg.workouts||DEFAULT_WORKOUTS).map(w=>{
      const en=WORKOUT_MAP[w]||w;
      const label=isEn?en:w;
      return '<option'+(w===cur||en===cur?' selected':'')+'>'+label+'</option>';
    }).join('');
  });
  ['ha1','ha2'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    const cur=sel.value;
    sel.innerHTML='<option value="">—</option>'+(setupCfg.habitos||DEFAULT_HABITOS).map(h=>{
      const en=HABITO_MAP[h]||h;
      const label=isEn?en:h;
      return '<option'+(h===cur||en===cur?' selected':'')+'>'+label+'</option>';
    }).join('');
  });
  // Translate shopping section headers
  renderSh();
  // Table headers
  const d=document.getElementById('gth-desc');if(d)d.textContent=isEn?'Description':'Descripción';
  const c=document.getElementById('gth-cat');if(c)c.textContent=isEn?'Category':'Categoría';
  const m=document.getElementById('gth-monto');if(m)m.textContent=isEn?'Amount':'Monto';
  // Gastos dropdown
  const sel=document.getElementById('gasto-cat');
  if(sel){
    // Use user's custom categories if available
    const userCats=setupCfg&&setupCfg.gastoCats&&setupCfg.gastoCats.length?setupCfg.gastoCats:null;
    const defaultCats=isEn
      ?['🍽 Restaurant','🛒 Grocery','🎬 Entertainment','⛽ Gas','🚗 Transport','📱 Subscription','💪 Exercise','📚 School','🔧 Service payment','💼 Business','🏠 Home','💳 Loan','✈️ Travel','💸 Other']
      :['🍽 Restaurante','🛒 Supermercado','🎬 Entretenimiento','⛽ Gasolina','🚗 Transporte','📱 Suscripción','💪 Ejercicio','📚 Escuela','🔧 Pago a servicio','💼 Negocio','🏠 Casa','💳 Préstamo','✈️ Viaje','💸 Otro'];
    const cats=userCats||defaultCats;
    sel.innerHTML=cats.map(c=>'<option>'+c+'</option>').join('');
  }
  // Total label
  const tot=document.getElementById('gastos-total-lbl');
  if(tot){const range=tot.textContent.replace(/^(Total |Week total )/i,'');tot.textContent=(isEn?'Week total ':'Total ')+range;}
  // Viendo label
  const vl=document.getElementById('viendo-lbl');if(vl)vl.textContent=isEn?'Viewing':'Viendo';
  // Rain badge update
  const rain=document.getElementById('rain');
  if(rain){const txt=rain.textContent;
    if(isEn){rain.textContent=txt.replace('Lluvia probable hoy','Rain likely today').replace('Sin lluvia hoy','No rain today');}
    else{rain.textContent=txt.replace('Rain likely today','Lluvia probable hoy').replace('No rain today','Sin lluvia hoy');}
  }
  // desc placeholder
  const gd=document.getElementById('gasto-desc');if(gd)gd.placeholder=isEn?'Description...':'Descripción...';
  const gm=document.getElementById('gasto-monto');if(gm)gm.placeholder='$0';
  // GCal note
  // Agregar buttons
  const btnTask=document.getElementById('btn-add-task');if(btnTask)btnTask.textContent=isEn?'+ Add':'+ Agregar';
  const btnGasto=document.getElementById('btn-add-gasto');if(btnGasto)btnGasto.textContent=isEn?'+ Add':'+ Agregar';
  const gcalNote=document.getElementById('gcal-snote');
  if(gcalNote)gcalNote.textContent=isEn
    ?'*For security, your calendar cannot stay connected. Connect whenever you want your events to appear here and when you want your events saved to Google Calendar.'
    :'*Por seguridad, tu calendario no puede permanecer conectado. Conéctate cuando quieras que tus eventos se reflejen aquí y cuando quieras que tus eventos de aquí se guarden en tu Google Calendar.';
  // Re-render weather descriptions in new language
  if(_lastWeather)renderWeatherDesc(_lastWeather.code,_lastWeather.temp,_lastWeather.pre);
  // Annual report button
  const annBtn=document.getElementById('annual-btn-lbl');if(annBtn)annBtn.textContent=isEn?'Annual report':'Reporte anual';
  // Sync SmartSelect inputs after rebuilding workout/habit options
  ['wo1','wo2','ha1','ha2'].forEach(id=>{
    const sel=document.getElementById(id);
    const wrap=document.getElementById(id+'_ss');
    const inp=wrap?.querySelector('input.ss-input');
    if(sel&&inp)inp.value=sel.value;
  });
}

function applyLang(lang){
  // Set lang in config first so all renders use it
  if(!setupCfg)setupCfg={};
  setupCfg.lang=lang;
  // Switch all language arrays
  DIAS=lang==='en'?DIAS_EN:DIAS_ES;
  DS=lang==='en'?DS_EN:DS_ES;
  MES=lang==='en'?MES_EN:MES_ES;
  CAL_DIAS=lang==='en'?CAL_DIAS_EN:CAL_DIAS_ES;
  CAL_MESES=lang==='en'?CAL_MESES_EN:CAL_MESES_ES;
  QS=shuffleArr(lang==='en'?[...QS_EN]:[...QS_ES]);
  qcur=Math.floor(Math.random()*QS.length);
  showQ(QS[qcur]);
  buildCalendar();
  renderDay();
  const t=T[lang]||T.es;
  // Update all .sec headings by matching content
  document.querySelectorAll('.sec, .lbl').forEach(el=>{
    const txt=el.textContent.trim().toLowerCase();
    if(txt.includes('pendientes')||txt.includes('to-do'))el.textContent=t.pendientes;
    else if(txt.includes('enfoque')||txt.includes('focus of'))el.textContent=t.enfoque;
    else if(txt.includes('agenda')||txt.includes('schedule'))el.textContent=t.agenda;
    else if(txt.includes('workout'))el.textContent=t.workout;
    else if(txt.includes('hábito')||txt.includes('habit'))el.textContent=t.habito;
    else if(txt.includes('overview')||txt.includes('semanal'))el.textContent=t.overview;
    else if(txt.includes('lista')||txt.includes('shopping'))el.textContent=t.compras;
    else if(txt.includes('categoría')||txt.includes('category this'))el.textContent=t.porCategoria;
    else if(txt.includes('semana')||txt.includes('week —')||txt.includes('week —'))el.textContent=t.semana;
    else if(txt.includes('recordatorio')||txt.includes('reminder'))el.textContent=t.recordatorio;
    else if(txt.includes('gastos')||txt.includes('expenses'))el.textContent=t.gastosDia||t.gastos;
    else if(txt.includes('por categoría')||txt.includes('by category'))el.textContent=t.porCat||t.porCategoria;
  });
  // Placeholders
  const ph=(id,v)=>{const e=document.getElementById(id);if(e)e.placeholder=v;};
  ph('task-in',t.agregarPendiente);
  ph('fi1',t.primerEnfoque);ph('fi2',t.segundoEnfoque);ph('fi3',t.tercerEnfoque);
  ph('gasto-desc',t.desc);
  ph('ev-title',lang==='en'?'Event...':'Evento...');
  ph('task-in',lang==='en'?'Add to-do...':'Agregar pendiente...');
  ph('sh-super-in',t.agregar||'Add...');ph('sh-casa-in',t.agregar||'Add...');
  ph('sh-pers-in',t.agregar||'Add...');ph('sh-mama-in',t.agregar||'Add...');ph('sh-neg-in',t.agregar||'Add...');
  // Buttons and labels
  const gcalBtn=document.getElementById('gcal-btn');if(gcalBtn)gcalBtn.textContent=t.conectarGcal;
  const qbtn=document.querySelector('.qbtn');if(qbtn)qbtn.textContent=t.nuevaFrase;
  const snote=document.querySelector('.snote');if(snote&&t.snote)snote.textContent=t.snote;
  const evLbl=document.querySelector('.ev-lbl');if(evLbl)evLbl.textContent=t.evLbl||t.agregarEvento;
  const lbl=document.getElementById('location-lbl');
  if(lbl&&(lbl.textContent.includes('ubicación')||lbl.textContent.includes('location')||lbl.textContent.includes('Getting')||lbl.textContent.includes('Obteniendo')))lbl.textContent=t.clima;
  const progLbl=document.getElementById('prog-lbl');
  if(progLbl){const pct=progLbl.textContent.match(/\d+/)?.[0]||'0';progLbl.textContent=t.progreso+': '+pct+'%';}
  // Total labels
  const totLbl=document.getElementById('gastos-total-lbl');
  if(totLbl){const range=totLbl.textContent.split('–')[1]||'';totLbl.textContent=(t.totalSem||t.totalSemana)+(range?'–'+range:'');}
  updateGastosLang(lang);
  const greet=document.getElementById('user-greeting');
  if(greet&&setupCfg.name){greet.textContent=(lang==='en'?'Hello ':'Hola ')+setupCfg.name+'!';}
  // Translate bottom bar
  const en=lang==='en';
  const lblBudget=document.getElementById('bar-lbl-budget');
  const lblReport=document.getElementById('bar-lbl-report');
  const lblSettings=document.getElementById('bar-lbl-settings');
  const lblLogout=document.getElementById('bar-lbl-logout');
  if(lblBudget)lblBudget.textContent=en?'Budget':'Presupuesto';
  if(lblReport)lblReport.textContent=en?'Report':'Reporte';
  if(lblSettings)lblSettings.textContent=en?'Settings':'Ajustes';
  if(lblLogout)lblLogout.textContent=en?'Sign out':'Salir';
}

// ── PALETTES ───────────────────────────────
const PALETTES = {
  // 🌿 Forest — original, balanced
  forest: {
    teal:'#618985',tealL:'#e8f0ef',tealD:'#4a6e6b',
    mauve:'#B75D69',mauveL:'#f5e8eb',mauveD:'#8f4652',
    brown:'#414535',silkL:'#f7f0ec',
    bg:'#fff',bg2:'#f8f6f4',bgPage:'#f0ebe6',
    border:'rgba(0,0,0,0.1)',text:'#1a1a1a',text2:'#666',text3:'#999'
  },
  // 🌸 Rosé — pastels, soft bordeaux accent
  rose: {
    teal:'#c9847a',tealL:'#faeae8',tealD:'#8f5a54',   // powder blush warm
    mauve:'#c4788a',mauveL:'#fce8ef',mauveD:'#8f4d5e', // petal rose
    brown:'#7a4a52',silkL:'#EEEBD0',                   // dark bordeaux for text/accents
    bg:'#fff',bg2:'#fdf7f5',bgPage:'#f7ede9',
    border:'rgba(0,0,0,0.09)',text:'#2a1a1c',text2:'#7a5a5e',text3:'#b09498'
  },
  // 🏺 Earth — muted, sophisticated
  earth: {
    teal:'#607466',tealL:'#eaefeb',tealD:'#3d4d42',   // granite green
    mauve:'#9a7b6a',mauveL:'#f2ebe7',mauveD:'#6b5246', // camel warm
    brown:'#5C4a55',silkL:'#e8e0da',                   // mauve shadow
    bg:'#fff',bg2:'#f7f4f1',bgPage:'#ede8e2',
    border:'rgba(0,0,0,0.09)',text:'#1e1a18',text2:'#6b605a',text3:'#a89890'
  },
  // 🤍 Minimal — deep teal + warm neutrals
  minimal: {
    teal:'#607466',tealL:'#eaefeb',tealD:'#3d4d42',
    mauve:'#4a3f3c',mauveL:'#ede9e8',mauveD:'#2a2220',
    brown:'#8B786D',silkL:'#e8e0d8',
    bg:'#fff',bg2:'#f5f3f0',bgPage:'#ede8e2',
    border:'rgba(0,0,0,0.09)',text:'#1a1816',text2:'#6a6058',text3:'#a89888'
  },
  // 🖤 Black & White — pure, crisp
  bw: {
    teal:'#555555',tealL:'#efefef',tealD:'#333333',
    mauve:'#222222',mauveL:'#f2f2f2',mauveD:'#000000',
    brown:'#777777',silkL:'#f0f0f0',
    bg:'#ffffff',bg2:'#f6f6f6',bgPage:'#ebebeb',
    border:'rgba(0,0,0,0.11)',text:'#111111',text2:'#555',text3:'#999'
  }
};

function applyPalette(key){
  const p=PALETTES[key]||PALETTES.forest;
  const r=document.documentElement.style;
  r.setProperty('--teal',p.teal);
  r.setProperty('--teal-l',p.tealL);
  r.setProperty('--teal-d',p.tealD);
  r.setProperty('--mauve',p.mauve);
  r.setProperty('--mauve-l',p.mauveL);
  r.setProperty('--mauve-d',p.mauveD);
  r.setProperty('--brown',p.brown);
  r.setProperty('--silk-l',p.silkL);
  r.setProperty('--bg',p.bg);
  r.setProperty('--bg2',p.bg2);
  r.setProperty('--border',p.border);
  r.setProperty('--text',p.text);
  r.setProperty('--text2',p.text2);
  r.setProperty('--text3',p.text3);
  document.body.style.background=p.bgPage;
}

// ── SETUP STATE ────────────────────────────

const DEFAULT_GASTOS=['🍽 Restaurante','🛒 Supermercado','🎬 Entretenimiento','⛽ Gasolina','🚗 Transporte','📱 Suscripción','💪 Ejercicio','📚 Escuela','🔧 Pago a servicio','💼 Negocio','🏠 Casa','💳 Préstamo','✈️ Viaje','💸 Otro'];

let setupCfg={
  name:'',lang:'es',currency:'MXN',palette:'forest',
  features:{quotes:true,gcal:true,weather:true,gastos:true,quickGasto:true},
  workouts:[],
  habitos:[],
  shopCats:[],
  gastoCats:[]
};

let selectedPal='forest';
let selectedLang='es';
function isEn(){return setupCfg&&setupCfg.lang==='en';}

function initSetupChips(){
  renderChips('workout',setupCfg.workouts);
  renderChips('habito',setupCfg.habitos);
  renderChips('shop',setupCfg.shopCats);
  renderChips('gasto',setupCfg.gastoCats);
}

const CHIP_GHOST_EXAMPLES={
  workout:{es:['🎾 Tenis','🏃 Correr'],en:['🎾 Tennis','🏃 Running']},
  habito:{es:['✍️ Diario','🙏 Gratitud'],en:['✍️ Journal','🙏 Gratitude']},
  shop:{es:['🛒 Súper','🏠 Casa'],en:['🛒 Grocery','🏠 Home']},
  gasto:{es:['🍽 Restaurante','🛒 Súper'],en:['🍽 Restaurant','🛒 Grocery']}
};
function renderChips(type,arr){
  const wrap=document.getElementById(type+'-chips');
  if(!wrap)return;
  wrap.innerHTML='';
  if(!arr||arr.length===0){
    const g=CHIP_GHOST_EXAMPLES[type]||{};const examples=(isEn()?g.en:g.es)||[];
    examples.forEach(item=>{
      const el=document.createElement('div');
      el.className='chip-item';
      el.style.cssText='opacity:0.38;border-style:dashed;cursor:default;pointer-events:none;';
      el.textContent=item;
      wrap.appendChild(el);
    });
    const hint=document.createElement('div');
    hint.style.cssText='font-size:10px;color:var(--text3);margin-top:4px;font-style:italic;';
    hint.textContent=isEn()?'TIP: Adding emojis helps you find them faster':'TIP: Ponerles emojis los hace más fáciles de encontrar';
    wrap.appendChild(hint);
    return;
  }
  arr.forEach((item,i)=>{
    const el=document.createElement('div');
    el.className='chip-item';
    el.innerHTML='<span contenteditable="true" spellcheck="false" style="outline:none;cursor:text;min-width:4px;" onblur="editChip(\''+type+'\','+i+',this)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur();}">'+item+'</span><span class="chip-x" onclick="removeChip(\''+type+'\','+i+')">×</span>';
    wrap.appendChild(el);
  });
}

function addChip(type){
  const inputId={workout:'wo-custom',habito:'ha-custom',shop:'shop-custom',gasto:'gasto-custom'}[type];
  const arr={workout:setupCfg.workouts,habito:setupCfg.habitos,shop:setupCfg.shopCats,gasto:setupCfg.gastoCats}[type];
  const inp=document.getElementById(inputId);
  const v=inp.value.trim();
  if(!v)return;
  arr.push(v);
  inp.value='';
  renderChips(type,arr);
  saveConfigToFirebase();
}

function saveConfigToFirebase(){
  if(db&&currentUser){
    if(!setupCfg||Object.keys(setupCfg).length===0){console.warn('saveConfig: skipped empty');return;}
    localStorage.setItem('wp_config',JSON.stringify(setupCfg));
    userCol().doc('config').set({cfg:setupCfg}).catch(e=>console.error('Config sync:',e));
  }
}

function removeChip(type,i){
  const arr={workout:setupCfg.workouts,habito:setupCfg.habitos,shop:setupCfg.shopCats,gasto:setupCfg.gastoCats}[type];
  arr.splice(i,1);
  renderChips(type,arr);
  saveConfigToFirebase();
}
function editChip(type,i,el){
  const v=el.textContent.trim();
  const arr={workout:setupCfg.workouts,habito:setupCfg.habitos,shop:setupCfg.shopCats,gasto:setupCfg.gastoCats}[type];
  if(!arr)return;
  if(!v){arr.splice(i,1);renderChips(type,arr);saveConfigToFirebase();return;}
  if(v!==arr[i]){arr[i]=v;saveConfigToFirebase();}
}

function selectPal(el){
  document.querySelectorAll('.pal-opt').forEach(e=>e.classList.remove('active'));
  el.classList.add('active');
  selectedPal=el.dataset.pal;
  applyPalette(selectedPal);
}

function selectLang(el){
  document.querySelectorAll('.lang-opt').forEach(e=>e.classList.remove('active'));
  el.classList.add('active');
  selectedLang=el.dataset.lang;
  setupCfg.lang=selectedLang;
  translateSetup(selectedLang);
  // Translate chips
  const langIsEn=selectedLang==='en';
  const translateArr=(arr,map)=>arr.map(v=>langIsEn?(map[v]||v):v);
  const wo=setupCfg.workouts;
  renderChips('workout',wo&&wo.length?translateArr(wo,WORKOUT_MAP):[]);
  const ha=setupCfg.habitos;
  renderChips('habito',ha&&ha.length?translateArr(ha,HABITO_MAP):[]);
  // Shop chips
  const shopMap2={'Supermercado':'Supermarket','Casa':'Home','Personal':'Personal','Oficina':'Office','Mamá':'Mom','Negocio':'Business','Supermarket':'Supermercado','Home':'Casa','Office':'Oficina','Mom':'Mamá'};
  const sc=setupCfg.shopCats;
  const shopChips=sc&&sc.length?(langIsEn?sc.map(c=>shopMap2[c]||c):sc):[];
  renderChips('shop',shopChips);
  // Gasto chips
  if(!setupCfg.gastoCats||setupCfg.gastoCats.length===0){
    renderChips('gasto',[]);
  }else{
    const gaArr=langIsEn
      ?['🍽 Restaurant','🛒 Grocery','🎬 Entertainment','⛽ Gas','🚗 Transport','📱 Subscription','💪 Exercise','📚 School','🔧 Service payment','💼 Business','🏠 Home','💳 Loan','✈️ Travel','💸 Other']
      :['🍽 Restaurante','🛒 Supermercado','🎬 Entretenimiento','⛽ Gasolina','🚗 Transporte','📱 Suscripción','💪 Ejercicio','📚 Escuela','🔧 Pago a servicio','💼 Negocio','🏠 Casa','💳 Préstamo','✈️ Viaje','💸 Otro'];
    renderChips('gasto',gaArr);
  }
}

const SETUP_T={
  es:{
    subtitle:'Por cada minuto dedicado a organizarte, ganas una hora.',
    basics:'Lo básico',
    name:'Tu nombre',
    namePh:'Ej. Fernanda',
    iconLbl:'Ícono para el dock (opcional)',
    iconBtn:'Subir imagen...',
    iconHint:'PNG o JPG, cuadrado. Agrega al dock DESPUÉS de guardar.',
    lang:'Idioma',
    currency:'Moneda para gastos',
    palette:'Paleta de colores',
    features:'Funciones',
    quotes:'Recordatorio del día',
    quotesSub:'Frase inspiracional en el inicio',
    gcal:'Google Calendar',
    gcalSub:'Sincronizar eventos',
    weather:'Clima',
    weatherSub:'Temperatura y pronóstico',
    gastos:'Widget de gastos',
    gastosSub:'Registro y totales semanales',
    quickGasto:'Gasto rápido en móvil',
    quickGastoSub:'Pantalla de acceso directo al abrir en celular',
    workouts:'Workouts',
    woAdd:'Agregar workout...',
    habitos:'Hábitos',
    haAdd:'Agregar hábito...',
    shopCats:'Categorías de lista de compras',
    shopAdd:'Agregar categoría...',
    gastoCats:'Rubros de gastos',
    gastoAdd:'Agregar rubro...',
    btn:'¡Listo, empezar!',
    currencies:['MXN — Peso mexicano ($)','USD — Dólar ($)','EUR — Euro (€)','COP — Peso colombiano ($)','ARS — Peso argentino ($)','Otra'],
  },
  en:{
    subtitle:'For every minute spent organizing, an hour is earned.',
    basics:'The basics',
    name:'Your name',
    namePh:'e.g. Sarah',
    iconLbl:'Dock icon (optional)',
    iconBtn:'Upload image...',
    iconHint:'PNG or JPG, square. Add to home screen AFTER saving.',
    lang:'Language',
    currency:'Currency for expenses',
    palette:'Color palette',
    features:'Features',
    quotes:'Daily reminder',
    quotesSub:'Inspirational quote on the home screen',
    gcal:'Google Calendar',
    gcalSub:'Sync events',
    weather:'Weather',
    weatherSub:'Temperature and forecast',
    gastos:'Expenses widget',
    gastosSub:'Weekly records and totals',
    quickGasto:'Quick expense on mobile',
    quickGastoSub:'Direct access screen when opening on phone',
    workouts:'Workouts',
    woAdd:'Add workout...',
    habitos:'Habits',
    haAdd:'Add habit...',
    shopCats:'Shopping list categories',
    shopAdd:'Add category...',
    gastoCats:'Expense categories',
    gastoAdd:'Add category...',
    btn:'Get started!',
    currencies:['MXN — Mexican Peso ($)','USD — US Dollar ($)','EUR — Euro (€)','COP — Colombian Peso ($)','ARS — Argentine Peso ($)','Other'],
  }
};

function translateSetup(lang){
  const t=SETUP_T[lang]||SETUP_T.es;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  const setPh=(id,v)=>{const e=document.getElementById(id);if(e)e.placeholder=v;};
  const setText=(sel,v)=>{const e=document.querySelector(sel);if(e)e.textContent=v;};

  // Subtitle
  set('setup-tagline',lang==='en'?'For every minute spent organizing, an hour is earned.':'Por cada minuto dedicado a organizarte, ganas una hora.');
  // Section headers — find by current text
  document.querySelectorAll('#setup-screen .setup-sec').forEach((el,i)=>{
    const secLabels=[t.basics,t.palette,t.features,t.workouts,t.habitos,t.shopCats,t.gastoCats];
    if(secLabels[i])el.textContent=secLabels[i];
  });
  // Field labels
  document.querySelectorAll('#setup-screen .setup-lbl').forEach((el,i)=>{
    const lbls=[t.name,t.lang,t.currency];
    if(lbls[i]!==undefined)el.textContent=lbls[i];
  });
  // Placeholders
  setPh('cfg-name',t.namePh);
  // Icon button

  // Toggle labels
  const toggleNames=document.querySelectorAll('#setup-screen .toggle-name');
  const toggleSubs=document.querySelectorAll('#setup-screen .toggle-sub');
  const tNames=[t.quotes,t.gcal,t.weather,t.gastos,t.quickGasto];
  const tSubs=[t.quotesSub,t.gcalSub,t.weatherSub,t.gastosSub,t.quickGastoSub];
  toggleNames.forEach((el,i)=>{if(tNames[i])el.textContent=tNames[i];});
  toggleSubs.forEach((el,i)=>{if(tSubs[i])el.textContent=tSubs[i];});
  // Input placeholders for chips
  setPh('wo-custom',t.woAdd);
  setPh('ha-custom',t.haAdd);
  setPh('shop-custom',t.shopAdd);
  setPh('gasto-custom',t.gastoAdd);
  // Save button
  const saveBtn=document.querySelector('#setup-screen button[onclick="saveSetup()"]');
  if(saveBtn)saveBtn.textContent=t.btn;
  // Currency options
  const currSel=document.getElementById('cfg-currency');
  if(currSel){
    Array.from(currSel.options).forEach((opt,i)=>{if(t.currencies[i])opt.text=t.currencies[i];});
  }
  // Palette section names (pal-name divs)
  // These stay in their language since they're proper names
}

function toggleCfg(el,key){
  el.classList.toggle('active');
  setupCfg.features[key]=el.classList.contains('active');
  applyConfig(setupCfg);
  saveConfigToFirebase();
}



function updateFavicon(b64){
  let link=document.querySelector('link[rel="apple-touch-icon"]');
  if(!link){link=document.createElement('link');link.rel='apple-touch-icon';document.head.appendChild(link);}
  link.href=b64;
  let link2=document.querySelector('link[rel="icon"]');
  if(!link2){link2=document.createElement('link');link2.rel='icon';document.head.appendChild(link2);}
  link2.href=b64;
}

function saveSetup(){
  setupCfg.name=document.getElementById('cfg-name').value.trim()||'';
  setupCfg.lang=selectedLang;
  setupCfg.currency=document.getElementById('cfg-currency').value;
  setupCfg.palette=selectedPal;
  localStorage.setItem('wp_config',JSON.stringify(setupCfg));
  document.getElementById('setup-screen').style.display='none';
  applyConfig(setupCfg);
  applyLang(setupCfg.lang);
  renderDay();
  // Save to Firebase in background
  if(db&&currentUser){
    userCol().doc('config').set({cfg:setupCfg}).catch(e=>console.error('Config save:',e));
  }
}

function applyConfig(cfg){
  applyPalette(cfg.palette);
  if(cfg.lang)applyLang(cfg.lang);
  // Show/hide features
  const weatherCard=document.querySelector('.card-teal');
  if(weatherCard)weatherCard.style.display=cfg.features.weather?'':'none';
  document.querySelectorAll('.desktop-quote,.mobile-quote').forEach(el=>el.style.display=cfg.features.quotes?'':'none');
  const gastosCard=document.getElementById('gastos-title');
  if(gastosCard)gastosCard.closest('.card').style.display=cfg.features.gastos?'':'none';
  const gcalBtn=document.getElementById('gcal-btn');
  if(gcalBtn)gcalBtn.style.display=cfg.features.gcal?'':'none';
  // Set greeting
  const greet=document.getElementById('user-greeting');
  if(greet&&cfg.name){
    const isEn=cfg.lang==='en';
    greet.textContent=(isEn?'Hello ':'Hola ')+cfg.name+'!';
  }
  // Apply workout/habito options to selects
  const wo=setupCfg.workouts||DEFAULT_WORKOUTS;
  const ha=setupCfg.habitos||DEFAULT_HABITOS;
  ['wo1','wo2'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    const cur=sel.value;
    sel.innerHTML='<option value="">—</option>'+wo.map(w=>'<option'+(w===cur?' selected':'')+'>'+w+'</option>').join('');
  });
  ['ha1','ha2'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    const cur=sel.value;
    sel.innerHTML='<option value="">—</option>'+ha.map(h=>'<option'+(h===cur?' selected':'')+'>'+h+'</option>').join('');
  });
  const sc=(setupCfg.shopCats&&setupCfg.shopCats.length)?setupCfg.shopCats:DEFAULT_SHOP;
  if(sc.length){applyShopCats(sc);initShoppingItems();}
  const gc=(setupCfg.gastoCats&&setupCfg.gastoCats.length)?setupCfg.gastoCats:DEFAULT_GASTOS;
  if(gc.length){const sel=document.getElementById('gasto-cat');if(sel)sel.innerHTML=gc.map(c=>'<option>'+c+'</option>').join('');}
}

const SHOP_EMOJI={};

function applyShopCats(cats){
  const shAll=document.getElementById('sh-all');
  if(!shAll)return;
  shAll.innerHTML='';
  cats.forEach((cat,idx)=>{
    const key='cat'+idx;
    if(!shoppingItems[key])shoppingItems[key]=[];
    const emoji=SHOP_EMOJI[cat]||'';
    const col=document.createElement('div');
    col.innerHTML=`
      <div style="font-size:11px;font-weight:500;color:var(--mauve);margin-bottom:6px;">${emoji} ${cat}</div>
      <div id="sh-${key}"></div>
      <div class="add-row" style="margin-top:6px;">
        <input type="text" id="sh-${key}-in" placeholder="Agregar..." onkeydown="if(event.key==='Enter')addShCat('${key}')">
        <button onclick="addShCat('${key}')">+</button>
      </div>`;
    shAll.appendChild(col);
  });
  renderSh();
}

function openSettings(){
  const cfg=JSON.parse(localStorage.getItem('wp_config')||'{}');
  translateSetup(cfg.lang||'es');
  if(cfg.name)document.getElementById('cfg-name').value=cfg.name;
  if(cfg.currency)document.getElementById('cfg-currency').value=cfg.currency;
  if(cfg.palette){
    selectedPal=cfg.palette;
    document.querySelectorAll('.pal-opt').forEach(e=>{
      e.classList.toggle('active',e.dataset.pal===cfg.palette);
    });
  }
  // Sync feature toggle states
  const featureToggles={quotes:'tog-quotes',gcal:'tog-gcal',weather:'tog-weather',gastos:'tog-gastos',quickGasto:'tog-quickgasto'};
  Object.entries(featureToggles).forEach(([key,id])=>{
    const el=document.getElementById(id);
    if(el)el.classList.toggle('active',(cfg.features||{})[key]!==false);
  });
  initSetupChips();
  document.getElementById('setup-screen').style.display='block';
}

function initApp(){
  if(typeof lucide!=='undefined')lucide.createIcons();
  if(typeof QS!=='undefined')shuffleArr(QS);
  const saved=localStorage.getItem('wp_config');
  if(!saved){
    // First time — show setup
    initSetupChips();
    document.getElementById('setup-screen').style.display='block';
  } else {
    const cfg=JSON.parse(saved);
    setupCfg={
      ...setupCfg,
      ...cfg,
      workouts: cfg.workouts&&cfg.workouts.length ? cfg.workouts : [...DEFAULT_WORKOUTS],
      habitos: cfg.habitos&&cfg.habitos.length ? cfg.habitos : [...DEFAULT_HABITOS],
      shopCats: cfg.shopCats&&cfg.shopCats.length ? cfg.shopCats : [...DEFAULT_SHOP],
      gastoCats: cfg.gastoCats&&cfg.gastoCats.length ? cfg.gastoCats : [...DEFAULT_GASTOS],
    };
    // Shopping DOM built by renderSh()
    applyConfig(setupCfg);
    initSetupChips();
  }
}


