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
];

let _tourStep=0;

function startTour(){
  if(localStorage.getItem('wp_tour_done'))return;
  _tourStep=0;
  const overlay=document.getElementById('tour-overlay');
  if(!overlay)return;
  overlay.style.display='block';
  showTourStep(0);
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

    // Spotlight path (evenodd = hole in overlay)
    document.getElementById('tour-path').setAttribute('d',
      `M0,0 H${vw} V${vh} H0 Z M${x},${y} h${w} v${h} h${-w} Z`);

    // Text
    const es=typeof isEn==='function'?!isEn():true;
    document.getElementById('tour-title').textContent=es?step.title:step.titleEn;
    document.getElementById('tour-desc').textContent=es?step.desc:step.descEn;

    // Skip / Next buttons
    const isLast=idx===TOUR_STEPS.length-1;
    document.getElementById('tour-skip').textContent=es?'Saltar':'Skip';
    document.getElementById('tour-next').textContent=isLast?(es?'¡Listo!':'Done!'):(es?'Siguiente →':'Next →');

    // Dots
    document.getElementById('tour-dots').innerHTML=
      TOUR_STEPS.map((_,i)=>`<span class="tour-dot${i===idx?' active':''}"></span>`).join('');

    // Position tooltip
    const tt=document.getElementById('tour-tooltip');
    const isMobile=vw<640;
    if(isMobile){
      tt.style.cssText='position:fixed;bottom:24px;left:16px;right:16px;width:auto;';
    } else {
      tt.style.position='fixed';
      tt.style.width='290px';
      const ttH=tt.offsetHeight||130;
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
