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
  {id:'card-agenda',
   title:'Agenda',                 titleEn:'Calendar',
   desc:'Agrega eventos libres para verlos en el overview. Conecta Google Calendar para sincronizar: lo que agregues aquí aparece en tu Google Calendar, y los eventos del calendar los ves aquí. Para anclar un evento de Google Calendar al planner, tócalo en el overview.',
   descEn:'Add events freely to see them in the overview. Connect Google Calendar to sync: what you add here appears in your Google Calendar, and calendar events show here. To anchor a Google Calendar event to the planner, tap it in the overview.'},
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

function startTour(){
  if(localStorage.getItem('wp_tour_done'))return;
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

// ── shared nav helpers ────────────────────────
function _prevBtn(onclickFn){
  return `<button onclick="${onclickFn}" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;padding:0;line-height:1;">←</button>`;
}
function _counter(cur,total){
  return `<span style="font-size:11px;color:var(--text3);">${cur} / ${total}</span>`;
}
function _nextBtn(label){
  return `<button onclick="nextTourStep()" style="background:var(--mauve);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;">${label}</button>`;
}
function _skipLink(label,onclick){
  return `<div style="text-align:center;margin-top:6px;"><button onclick="${onclick}" style="background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;padding:0;text-decoration:underline;">${label}</button></div>`;
}
function _positionTooltip(rect,pad){
  const tt=document.getElementById('tour-tooltip');
  const vw=window.innerWidth;const vh=window.innerHeight;
  if(vw<640){
    tt.style.cssText='position:fixed;bottom:24px;left:16px;right:16px;width:auto;';
  } else {
    tt.style.position='fixed';tt.style.width='320px';
    tt.style.left='';tt.style.right='';tt.style.bottom='';
    const ttH=tt.offsetHeight||160;
    const below=rect.bottom+pad+12+ttH<vh;
    tt.style.top=below?(rect.bottom+pad+8)+'px':Math.max(8,rect.top-pad-ttH-8)+'px';
    tt.style.left=Math.max(12,Math.min(vw-332,rect.left))+'px';
  }
}

function showTourStep(idx){
  const step=TOUR_STEPS[idx];
  const el=document.getElementById(step.id);
  if(!el||el.style.display==='none'){nextTourStep();return;}

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

    const closeBtn=document.getElementById('tour-close');
    if(closeBtn){closeBtn.style.display='block';closeBtn.onclick=endTour;}

    const footer=document.getElementById('tour-footer');
    const prev=idx>0?_prevBtn('prevTourStep()'):'<div style="width:24px;"></div>';
    const counter=_counter(idx+1,TOUR_STEPS.length);

    if(step.customButtons){
      footer.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px;">
          ${prev}${counter}<div style="width:24px;"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button onclick="endTour();openSettings();" style="padding:10px;border-radius:9px;background:var(--mauve);color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;">${es?'Ir a ajustes a personalizar':'Go to Settings to customize'}</button>
          <button onclick="endTour();openBudget();setTimeout(startBudgetTour,1500);" style="padding:9px;border-radius:9px;background:var(--teal);color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;">${es?'Tour del presupuesto →':'Budget tour →'}</button>
          <button onclick="endTour();" style="padding:9px;border-radius:9px;background:none;border:0.5px solid var(--border);color:var(--text3);font-size:12px;cursor:pointer;">${es?'Listo, explorar el app':'Done, explore the app'}</button>
        </div>`;
    } else {
      const isLast=idx===TOUR_STEPS.length-1;
      footer.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:6px;">
          ${prev}${counter}${_nextBtn(isLast?(es?'¡Listo!':'Done!'):(es?'Siguiente →':'Next →'))}
        </div>
        ${_skipLink(es?'Saltar al final':'Skip to end',`showTourStep(${TOUR_STEPS.length-1})`)}`;
    }

    _positionTooltip(rect,pad);
  },350);
}

function nextTourStep(){
  _tourStep++;
  if(_tourStep>=TOUR_STEPS.length){endTour();}
  else{showTourStep(_tourStep);}
}

function prevTourStep(){
  if(_tourStep>0){_tourStep--;showTourStep(_tourStep);}
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

// ── BUDGET TOUR ───────────────────────────────
const BUDGET_TOUR_STEPS=[
  {id:'budget-income-section',
   title:'Ingresos mensuales',          titleEn:'Monthly income',
   desc:'Registra todas tus fuentes de ingreso del mes: sueldo, freelance, rentas, etc.',
   descEn:'Record all your monthly income sources: salary, freelance, rentals, etc.'},
  {id:'budget-inc-list',
   title:'Detalle de ingresos',         titleEn:'Income detail',
   desc:'Cada fuente aparece aquí por separado. Toca la cifra para editarla.',
   descEn:'Each source appears here separately. Tap the amount to edit it.'},
  {id:'stat-total-ingresos',
   title:'Total ingresos',              titleEn:'Total income',
   desc:'La suma de todos tus ingresos del mes.',
   descEn:'The sum of all your income for the month.'},
  {id:'stat-total-gastos',
   title:'Total gastos dashboard',      titleEn:'Total dashboard expenses',
   desc:'Todo lo que registraste en el widget de gastos diarios del dashboard.',
   descEn:'Everything you logged in the daily expenses widget on the dashboard.'},
  {id:'stat-disponible',
   title:'Disponible',                  titleEn:'Available',
   desc:'Lo que te queda: ingresos menos tus gastos del dashboard.',
   descEn:'What remains: income minus your dashboard expenses.'},
  {id:'stat-presupuestado',
   title:'Presupuestado',               titleEn:'Budgeted',
   desc:'El total que asignaste manualmente a tus grupos de gastos planeados.',
   descEn:'The total you manually assigned to your planned expense groups.'},
  {id:'stat-real',
   title:'Real — capturado',            titleEn:'Actual — captured',
   desc:'Lo que tú mismo capturaste como gasto real al final del mes, para comparar con lo presupuestado.',
   descEn:'What you manually entered as real spending at month end, to compare against budgeted.'},
  {id:'stat-sin-presupuestar',
   title:'Sin presupuestar',            titleEn:'Unbudgeted',
   desc:'El remanente de tus ingresos que queda libre después de lo que asignaste al presupuesto.',
   descEn:'The remaining income that is free after what you assigned to your budget.'},
  {id:'budget-groups-section',
   title:'Gastos planeados',            titleEn:'Planned expenses',
   desc:'Organiza tus gastos en grupos y subcategorías. Compara lo presupuestado vs lo real al final del mes.',
   descEn:'Organize expenses in groups and subcategories. Compare budgeted vs real at month end.'},
  {id:'budget-debt-section',
   title:'Crédito, Préstamos y Deudas', titleEn:'Credit, Loans & Debts',
   desc:'Registra tus deudas y tarjetas. Las tarjetas que agregues aparecen como opción de pago en los gastos diarios.',
   descEn:'Track your debts and credit cards. Cards added here appear as payment options in daily expenses.'},
  {id:'budget-export-area',
   title:'Exportar y cerrar',           titleEn:'Export & close',
   desc:'Descarga tu reporte en PDF o Excel. El × guarda automáticamente y cierra el presupuesto.',
   descEn:'Download your report as PDF or Excel. The × saves automatically and closes the budget.',
   budgetEnd:true},
];

let _budgetTourStep=0;

function startBudgetTour(){
  _budgetTourStep=0;
  const overlay=document.getElementById('tour-overlay');
  if(!overlay)return;
  let attempts=0;
  const tryStart=()=>{
    if(document.getElementById('budget-income-section')){
      overlay.style.display='block';
      showBudgetTourStep(0);
    } else if(attempts<12){
      attempts++;
      setTimeout(tryStart,300);
    }
  };
  tryStart();
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
    const closeBtn=document.getElementById('tour-close');
    if(closeBtn){closeBtn.style.display='block';closeBtn.onclick=endBudgetTour;}

    const footer=document.getElementById('tour-footer');
    const prev=idx>0?_prevBtn('prevBudgetTourStep()'):'<div style="width:24px;"></div>';
    const counter=_counter(idx+1,BUDGET_TOUR_STEPS.length);
    const nextLabel=step.budgetEnd?(es?'¡Listo!':'Done!'):(es?'Siguiente →':'Next →');
    const nextOnclick=step.budgetEnd?'endBudgetTour()':'nextBudgetTourStep()';
    const nextBtnHtml=`<button onclick="${nextOnclick}" style="background:var(--mauve);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;">${nextLabel}</button>`;

    footer.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:6px;">
        ${prev}${counter}${nextBtnHtml}
      </div>
      ${_skipLink(es?'Saltar — ir a ¡Ya conoces el app!':'Skip — go to You know the app!','backToDashboardTour()')}`;

    _positionTooltip(rect,pad);
  },350);
}

function nextBudgetTourStep(){
  _budgetTourStep++;
  if(_budgetTourStep>=BUDGET_TOUR_STEPS.length)endBudgetTour();
  else showBudgetTourStep(_budgetTourStep);
}

function prevBudgetTourStep(){
  if(_budgetTourStep>0){_budgetTourStep--;showBudgetTourStep(_budgetTourStep);}
  else backToDashboardTour();
}

function endBudgetTour(){
  const overlay=document.getElementById('tour-overlay');
  if(overlay)overlay.style.display='none';
  localStorage.setItem('wp_tour_done','1');
}

function backToDashboardTour(){
  const modal=document.getElementById('budget-modal');
  if(modal){modal.style.display='none';document.body.style.overflow='';}
  _tourStep=TOUR_STEPS.length-1;
  const overlay=document.getElementById('tour-overlay');
  if(!overlay)return;
  overlay.style.display='block';
  showTourStep(TOUR_STEPS.length-1);
}
