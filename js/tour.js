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
  document.getElementById('welcome-banner').style.display='none';
  saveSetup();
  setTimeout(()=>{
    localStorage.removeItem('wp_tour_done');
    startTour();
  },600);
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
