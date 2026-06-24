// ── TOUR ─────────────────────────────────────
const TOUR_STEPS=[
  {id:'card-week-nav',
   title:'Navega tu semana',       titleEn:'Your week',
   desc:'Toca cualquier día para ver y editar su contenido.',
   descEn:'Tap any day to view and edit its content.'},
  {id:'card-overview',
   title:'Vista semanal',          titleEn:'Weekly overview',
   desc:'Resumen visual de toda tu semana: tareas, eventos, workouts y enfoques.',
   descEn:'Visual summary of your whole week: tasks, events, workouts and focus.'},
  {id:'card-tasks',
   title:'Pendientes',             titleEn:'To-do list',
   desc:'Agrega tareas, asígnales una categoría y llévalas de día en día hasta completarlas.',
   descEn:'Add tasks, assign a category and carry them forward until done.'},
  {id:'card-focus',
   title:'Enfoque del día',        titleEn:'Daily focus',
   desc:'Define tus 3 prioridades. Márcalas al completarlas al final del día.',
   descEn:'Set your 3 daily priorities and check them off as you complete them.'},
  {id:'card-workout',
   title:'Workout & Hábitos',      titleEn:'Workout & Habits',
   desc:'Registra tu actividad y hábitos diarios. Aparecen en tu reporte mensual.',
   descEn:'Log your daily workouts and habits. They show up in your monthly report.'},
  {id:'card-gastos',
   title:'Gastos del día',         titleEn:'Daily expenses',
   desc:'Registra cada gasto con categoría y forma de pago. Se consolidan en el presupuesto.',
   descEn:'Log each expense with category and payment method. They feed into your budget.'},
  {id:'settings-btn-wrap',
   title:'¡Ya conoces el app!',    titleEn:'You know the app!',
   desc:'Puedes personalizar colores, categorías, workouts y más en Ajustes.',
   descEn:'Customize colors, categories, workouts and more in Settings.',
   customButtons:true},
];

let _tourStep=0;

// ── BUDGET TOUR ───────────────────────────────
const BUDGET_TOUR_STEPS=[
  {id:'budget-income-section',
   title:'Ingresos mensuales',        titleEn:'Monthly income',
   desc:'Registra todas tus fuentes de ingreso del mes: sueldo, freelance, rentas, etc.',
   descEn:'Record all your monthly income sources: salary, freelance, rentals, etc.'},
  {id:'budget-inc-list',
   title:'Detalle de ingresos',       titleEn:'Income detail',
   desc:'Cada ingreso aparece aquí. Puedes editarlo tocando la cifra.',
   descEn:'Each income source appears here. Tap the amount to edit it.'},
  {id:'budget-stats-section',
   title:'Resumen del mes',           titleEn:'Month summary',
   desc:'Total ingresos · Gastos del dashboard · Disponible · Presupuestado · Real capturado · Sin presupuestar.',
   descEn:'Total income · Dashboard expenses · Available · Budgeted · Real captured · Unbudgeted.'},
  {id:'budget-groups-section',
   title:'Gastos planeados',          titleEn:'Planned expenses',
   desc:'Organiza tu presupuesto en grupos y subcategorías. Al final del mes compara lo presupuestado vs lo real.',
   descEn:'Organize your budget in groups and subcategories. At month end, compare budgeted vs real.'},
  {id:'budget-debt-section',
   title:'Crédito, Préstamos y Deudas', titleEn:'Credit, Loans & Debts',
   desc:'Registra tus deudas y tarjetas. Las tarjetas que agregues aquí aparecen como opción de pago en tus gastos diarios.',
   descEn:'Track your debts and credit cards. Cards added here appear as payment options in daily expenses.'},
  {id:'budget-export-area',
   title:'Exportar y cerrar',         titleEn:'Export & close',
   desc:'Descarga tu reporte en PDF o Excel. El × de arriba guarda automáticamente y cierra el presupuesto.',
   descEn:'Download your report as PDF or Excel. The × above saves automatically and closes the budget.',
   customButtons:true,budgetEnd:true},
];

let _budgetTourStep=0;

function startBudgetTour(){
  _budgetTourStep=0;
  const overlay=document.getElementById('tour-overlay');
  if(!overlay)return;
  overlay.style.display='block';
  showBudgetTourStep(0);
}

function showBudgetTourStep(idx){
  const step=BUDGET_TOUR_STEPS[idx];
  const el=document.getElementById(step.id);
  if(!el){_budgetTourStep++;if(_budgetTourStep<BUDGET_TOUR_STEPS.length)showBudgetTourStep(_budgetTourStep);else endBudgetTour();return;}

  el.scrollIntoView({behavior:'smooth',block:'center'});

  setTimeout(()=>{
    const rect=el.getBoundingClientRect();
    const pad=10;
    const vw=window.innerWidth;const vh=window.innerHeight;
    const x=Math.max(0,rect.left-pad);const y=Math.max(0,rect.top-pad);
    const w=Math.min(vw-x,rect.width+pad*2);const h=Math.min(vh-y,rect.height+pad*2);
    document.getElementById('tour-path').setAttribute('d',
      `M0,0 H${vw} V${vh} H0 Z M${x},${y} h${w} v${h} h${-w} Z`);

    const es=typeof isEn==='function'?!isEn():true;
    document.getElementById('tour-title').textContent=es?step.title:step.titleEn;
    document.getElementById('tour-desc').textContent=es?step.desc:step.descEn;

    const footer=document.getElementById('tour-footer');
    if(step.budgetEnd){
      footer.innerHTML=`
        <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
          <button onclick="endBudgetTour();" style="padding:10px;border-radius:9px;background:var(--mauve);color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;">${es?'¡Listo! Explorar el app':'Done! Explore the app'}</button>
        </div>`;
    } else {
      const isLast=idx===BUDGET_TOUR_STEPS.length-1;
      footer.innerHTML=`
        <div id="tour-dots"></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button onclick="endBudgetTour()" id="tour-skip"></button>
          <button onclick="nextBudgetTourStep()" id="tour-next"></button>
        </div>`;
      document.getElementById('tour-skip').textContent=es?'Saltar':'Skip';
      document.getElementById('tour-next').textContent=es?'Siguiente →':'Next →';
      document.getElementById('tour-dots').innerHTML=
        BUDGET_TOUR_STEPS.map((_,i)=>`<span class="tour-dot${i===idx?' active':''}"></span>`).join('');
    }

    const tt=document.getElementById('tour-tooltip');
    const isMobile=vw<640;
    if(isMobile){
      tt.style.cssText='position:fixed;bottom:24px;left:16px;right:16px;width:auto;';
    } else {
      tt.style.position='fixed';tt.style.width='290px';
      tt.style.left='';tt.style.right='';tt.style.bottom='';
      const ttH=tt.offsetHeight||140;
      const below=rect.bottom+pad+12+ttH<vh;
      tt.style.top=below?(rect.bottom+pad+8)+'px':Math.max(8,rect.top-pad-ttH-8)+'px';
      tt.style.left=Math.max(12,Math.min(vw-302,rect.left))+'px';
    }
  },350);
}

function nextBudgetTourStep(){
  _budgetTourStep++;
  if(_budgetTourStep>=BUDGET_TOUR_STEPS.length)endBudgetTour();
  else showBudgetTourStep(_budgetTourStep);
}

function endBudgetTour(){
  const overlay=document.getElementById('tour-overlay');
  if(overlay)overlay.style.display='none';
  localStorage.setItem('wp_tour_done','1');
}

function startTour(){
  if(localStorage.getItem('wp_tour_done'))return;
  // No iniciar si la pantalla de ajustes está abierta
  const setup=document.getElementById('setup-screen');
  if(setup&&setup.style.display!=='none')return;
  _tourStep=0;
  const overlay=document.getElementById('tour-overlay');
  if(!overlay)return;
  overlay.style.display='block';
  showTourStep(0);
}

function startTourFromSetup(){
  const banner=document.getElementById('welcome-banner');
  if(banner)banner.style.display='none';
  saveSetup();
  localStorage.removeItem('wp_tour_done');
  setTimeout(()=>{
    const overlay=document.getElementById('tour-overlay');
    if(!overlay)return;
    _tourStep=0;
    overlay.style.display='block';
    showTourStep(0);
  },900);
}

function skipTourFromSetup(){
  localStorage.setItem('wp_tour_done','1');
  document.getElementById('welcome-banner').style.display='none';
}

function showTourStep(idx){
  const step=TOUR_STEPS[idx];
  const el=document.getElementById(step.id);
  if(!el||el.style.display==='none'){nextTourStep();return;}

  el.scrollIntoView({behavior:'smooth',block:'center'});

  setTimeout(()=>{
    const rect=el.getBoundingClientRect();
    const pad=10;
    const vw=window.innerWidth;
    const vh=window.innerHeight;
    const x=Math.max(0,rect.left-pad);
    const y=Math.max(0,rect.top-pad);
    const w=Math.min(vw-x,rect.width+pad*2);
    const h=Math.min(vh-y,rect.height+pad*2);

    document.getElementById('tour-path').setAttribute('d',
      `M0,0 H${vw} V${vh} H0 Z M${x},${y} h${w} v${h} h${-w} Z`);

    const es=typeof isEn==='function'?!isEn():true;
    document.getElementById('tour-title').textContent=es?step.title:step.titleEn;
    document.getElementById('tour-desc').textContent=es?step.desc:step.descEn;

    // Buttons
    const footer=document.getElementById('tour-footer');
    if(step.customButtons){
      footer.innerHTML=`
        <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
          <button onclick="endTour();openSettings();" style="padding:10px;border-radius:9px;background:var(--mauve);color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;">${es?'Ir a ajustes a personalizar':'Go to Settings to customize'}</button>
          <button onclick="endTour();openBudget();setTimeout(startBudgetTour,1500);" style="padding:9px;border-radius:9px;background:var(--teal);color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;">${es?'Tour del presupuesto →':'Budget tour →'}</button>
          <button onclick="endTour();" style="padding:9px;border-radius:9px;background:none;border:0.5px solid var(--border);color:var(--text3);font-size:12px;cursor:pointer;">${es?'Listo, explorar el app':'Done, explore the app'}</button>
        </div>`;
    } else {
      footer.innerHTML=`
        <div id="tour-dots"></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button onclick="endTour()" id="tour-skip"></button>
          <button onclick="nextTourStep()" id="tour-next"></button>
        </div>`;
      const isLast=idx===TOUR_STEPS.length-1;
      document.getElementById('tour-skip').textContent=es?'Saltar':'Skip';
      document.getElementById('tour-next').textContent=isLast?(es?'¡Listo!':'Done!'):(es?'Siguiente →':'Next →');
      document.getElementById('tour-dots').innerHTML=
        TOUR_STEPS.filter(s=>!s.customButtons).map((_,i)=>`<span class="tour-dot${i===idx?' active':''}"></span>`).join('');
    }

    // Position tooltip
    const tt=document.getElementById('tour-tooltip');
    const isMobile=vw<640;
    if(isMobile){
      tt.style.cssText='position:fixed;bottom:24px;left:16px;right:16px;width:auto;';
    } else {
      tt.style.position='fixed';
      tt.style.width='290px';
      tt.style.left='';tt.style.right='';tt.style.bottom='';
      const ttH=tt.offsetHeight||140;
      const below=rect.bottom+pad+12+ttH<vh;
      tt.style.top=below?(rect.bottom+pad+8)+'px':Math.max(8,rect.top-pad-ttH-8)+'px';
      tt.style.left=Math.max(12,Math.min(vw-302,rect.left))+'px';
    }
  },350);
}

function nextTourStep(){
  _tourStep++;
  if(_tourStep>=TOUR_STEPS.length){endTour();}
  else{showTourStep(_tourStep);}
}

function endTour(){
  const overlay=document.getElementById('tour-overlay');
  if(overlay)overlay.style.display='none';
  localStorage.setItem('wp_tour_done','1');
}

function resetTour(){
  localStorage.removeItem('wp_tour_done');
}

function launchTourFromSettings(){
  resetTour();
  saveSetup();
  setTimeout(()=>{
    const o=document.getElementById('tour-overlay');
    if(!o)return;
    _tourStep=0;
    o.style.display='block';
    showTourStep(0);
  },900);
}
