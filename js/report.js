// ── MONTHLY REPORT ─────────────────────────
let reportYear=new Date().getFullYear();
let reportMonth=new Date().getMonth();
let reportSections={gastos:true,workout:true,productivity:true};
let reportData=[];
let reportIncome=0;

function openReport(){
  reportYear=new Date().getFullYear();
  reportMonth=new Date().getMonth();
  document.getElementById('report-modal').style.display='block';
  document.body.style.overflow='hidden';
  loadReportData();
}

function closeReport(){
  document.getElementById('report-modal').style.display='none';
  document.body.style.overflow='';
}

function toggleReportSection(el){
  el.classList.toggle('on');
  reportSections[el.dataset.key]=el.classList.contains('on');
  renderReport();
}

function reportPrevMonth(){
  reportMonth--;
  if(reportMonth<0){reportMonth=11;reportYear--;}
  loadReportData();
}

function reportNextMonth(){
  const now=new Date();
  if(reportYear===now.getFullYear()&&reportMonth>=now.getMonth())return;
  reportMonth++;
  if(reportMonth>11){reportMonth=0;reportYear++;}
  loadReportData();
}

async function loadReportData(){
  const MES_ES_FULL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const MES_EN_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const meses=isEn()?MES_EN_FULL:MES_ES_FULL;
  document.getElementById('report-month-lbl').textContent=meses[reportMonth]+' '+reportYear;
  const now=new Date();
  const nextBtn=document.getElementById('report-next-btn');
  if(nextBtn)nextBtn.style.opacity=(reportYear===now.getFullYear()&&reportMonth>=now.getMonth())?'0.3':'1';
  document.getElementById('report-content').innerHTML='<div class="report-loading">'+(isEn()?'Loading...':'Cargando...')+'</div>';
  const firstDay=new Date(reportYear,reportMonth,1);
  const lastDay=new Date(reportYear,reportMonth+1,0);
  const weekStarts=[];
  const d=new Date(firstDay);
  const dow=d.getDay();
  d.setDate(d.getDate()-(dow===0?6:dow-1));
  while(d<=lastDay){weekStarts.push(new Date(d));d.setDate(d.getDate()+7);}
  reportData=[];
  if(!db||!currentUser){
    document.getElementById('report-content').innerHTML='<div style="text-align:center;color:var(--text3);padding:2rem;font-size:14px;">'+(isEn()?'Sign in to view your report':'Inicia sesión para ver tu reporte')+'</div>';
    return;
  }
  const promises=weekStarts.map(ws=>{
    const key='week_'+dk(ws);
    return userCol().doc(key).get()
      .then(snap=>({key,weekStart:new Date(ws),data:snap.exists?snap.data():null}))
      .catch(()=>({key,weekStart:new Date(ws),data:null}));
  });
  reportData=await Promise.all(promises);
  // Load income from budget_config (moved from budget_actual)
  reportIncome=0;
  try{
    const snap=await userCol().doc('budget_config').get();
    reportIncome=snap.exists?((snap.data().income||[]).reduce((s,i)=>s+(i.amt||0),0)):0;
  }catch(e){reportIncome=0;}
  renderReport();
}

function renderReport(){
  const container=document.getElementById('report-content');
  let html='';
  const firstDay=new Date(reportYear,reportMonth,1);
  const lastDay=new Date(reportYear,reportMonth+1,0);
  const daysInMonth=lastDay.getDate();
  const dayMap={};
  reportData.forEach(({weekStart,data})=>{
    if(!data)return;
    for(let di=0;di<7;di++){
      const d=new Date(weekStart);d.setDate(d.getDate()+di);
      if(d.getMonth()===reportMonth&&d.getFullYear()===reportYear)dayMap[d.getDate()]={di,data};
    }
  });
  if(reportSections.gastos){
    const catTotals={};let monthTotal=0;let maxDay=0,maxDayAmt=0;
    for(let day=1;day<=daysInMonth;day++){
      const entry=dayMap[day];if(!entry)continue;
      const gastos=(entry.data.gastos&&entry.data.gastos[entry.di])||[];
      let dayTotal=0;
      gastos.forEach(g=>{monthTotal+=g.monto;dayTotal+=g.monto;catTotals[g.cat]=(catTotals[g.cat]||0)+g.monto;});
      if(dayTotal>maxDayAmt){maxDayAmt=dayTotal;maxDay=day;}
    }
    const weekCount=Math.ceil(daysInMonth/7);
    const avgWeekly=weekCount>0?(monthTotal/weekCount):0;
    const sortedCats=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
    const topCat=sortedCats[0]||null;
    html+=`<div class="report-section">
      <div class="report-sec-title"><i data-lucide="receipt" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:5px;"></i>${isEn()?'Income & Expenses':'Ingresos y Gastos'}</div>
      ${reportIncome>0?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <div class="rstat" style="background:#e8f0ef;"><div class="rstat-val" style="color:var(--teal);">$${reportIncome.toLocaleString()}</div><div class="rstat-lbl">${isEn()?'Income':'Ingresos'}</div></div>
        <div class="rstat"><div class="rstat-val" style="color:#c0392b;">$${monthTotal.toLocaleString()}</div><div class="rstat-lbl">${isEn()?'Expenses':'Gastos'}</div></div>
        <div class="rstat" style="grid-column:1/-1;background:${reportIncome-monthTotal>=0?'#e8f0ef':'#fce4ec'};text-align:center;"><div class="rstat-val" style="color:${reportIncome-monthTotal>=0?'var(--teal)':'#c0392b'};">$${(reportIncome-monthTotal).toLocaleString()}</div><div class="rstat-lbl">${isEn()?'Remaining this month':'Restante del mes'}</div></div>
      </div>`:''}
      <div class="report-stat-grid">
        <div class="rstat"><div class="rstat-val">$${monthTotal.toLocaleString()}</div><div class="rstat-lbl">${isEn()?'Month total':'Total del mes'}</div></div>
        <div class="rstat"><div class="rstat-val">$${Math.round(avgWeekly).toLocaleString()}</div><div class="rstat-lbl">${isEn()?'Weekly avg':'Promedio semanal'}</div></div>
        ${maxDay?`<div class="rstat"><div class="rstat-val">${(()=>{const d=new Date(reportYear,reportMonth,maxDay);return(isEn()?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'])[(d.getDay()+6)%7]+' '+maxDay;})()} </div><div class="rstat-lbl">${isEn()?'Most expensive day':'Día más caro'} $${maxDayAmt.toLocaleString()}</div></div>`:''}
        ${topCat?`<div class="rstat"><div class="rstat-val" style="font-size:12px;font-weight:600;">${topCat[0]}</div><div class="rstat-lbl">${isEn()?'Top category':'Categoría top'} $${topCat[1].toLocaleString()}</div></div>`:''}
      </div>`;
    if(sortedCats.length){
      const sorted=sortedCats;
      const max=sorted[0][1];
      html+=`<div style="margin-top:8px;">`;
      sorted.forEach(([cat,amt])=>{
        const c=GASTO_COLORS[cat]||GASTO_COLORS['Otro']||{bg:'#eee',color:'#666'};
        const pct=Math.round((amt/max)*100);
        html+=`<div class="rbar-row"><div class="rbar-lbl">${cat}</div><div class="rbar-track"><div class="rbar-fill" style="width:${pct}%;background:${c.color};"></div></div><div class="rbar-amt">$${amt.toLocaleString()}</div></div>`;
      });
      html+=`</div>`;
    }
    html+=`</div>`;
  }
  if(reportSections.workout){
    const woCounts={};const haCounts={};let activeDays=0;let maxStreak=0,curStreak=0;
    for(let day=1;day<=daysInMonth;day++){
      const entry=dayMap[day];
      const wo=entry?(entry.data.workout&&entry.data.workout[entry.di]):null;
      const hasActivity=wo&&(wo.wo1||wo.wo2||wo.ha1||wo.ha2);
      if(hasActivity){activeDays++;curStreak++;if(curStreak>maxStreak)maxStreak=curStreak;
        if(wo.wo1)woCounts[wo.wo1]=(woCounts[wo.wo1]||0)+1;
        if(wo.wo2)woCounts[wo.wo2]=(woCounts[wo.wo2]||0)+1;
        if(wo.ha1)haCounts[wo.ha1]=(haCounts[wo.ha1]||0)+1;
        if(wo.ha2)haCounts[wo.ha2]=(haCounts[wo.ha2]||0)+1;
      } else {curStreak=0;}
    }
    const topWo=Object.entries(woCounts).sort((a,b)=>b[1]-a[1])[0]||null;
    const topHa=Object.entries(haCounts).sort((a,b)=>b[1]-a[1])[0]||null;
    html+=`<div class="report-section">
      <div class="report-sec-title"><i data-lucide="dumbbell" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:5px;"></i>${isEn()?'Workouts & Habits':'Workouts & Hábitos'}</div>
      <div class="report-stat-grid">
        <div class="rstat"><div class="rstat-val">${activeDays}/${daysInMonth}</div><div class="rstat-lbl">${isEn()?'Active days':'Días activos'}</div></div>
        <div class="rstat"><div class="rstat-val">${maxStreak}</div><div class="rstat-lbl">${isEn()?'Best streak':'Racha máxima'}</div></div>
        ${topWo?`<div class="rstat"><div class="rstat-val" style="font-size:13px;">${topWo[0]}</div><div class="rstat-lbl">${isEn()?'Top workout':'Fav workout'} (${topWo[1]}x)</div></div>`:''}
        ${topHa?`<div class="rstat"><div class="rstat-val" style="font-size:13px;">${topHa[0]}</div><div class="rstat-lbl">${isEn()?'Top habit':'Hábito fav'} (${topHa[1]}x)</div></div>`:''}
      </div>
      <div class="rcal-grid">`;
    const dayLabels=isEn()?['M','T','W','T','F','S','S']:['L','M','M','J','V','S','D'];
    dayLabels.forEach(d=>{html+=`<div class="rcal-day-lbl">${d}</div>`;});
    const firstDow=firstDay.getDay();const offset=firstDow===0?6:firstDow-1;
    for(let i=0;i<offset;i++)html+=`<div></div>`;
    const todayStr=dk(new Date());
    for(let day=1;day<=daysInMonth;day++){
      const entry=dayMap[day];
      const wo=entry?(entry.data.workout&&entry.data.workout[entry.di]):null;
      const hasWo=wo&&(wo.wo1||wo.wo2);const hasHa=wo&&(wo.ha1||wo.ha2);
      const cls=hasWo&&hasHa?'both':hasWo?'has-workout':hasHa?'has-focus':'';
      const dateStr=reportYear+'-'+String(reportMonth+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      const isToday=dateStr===todayStr?'today-cell':'';
      html+=`<div class="rcal-cell ${cls} ${isToday}" title="${day}"></div>`;
    }
    html+=`</div></div>`;
  }
  if(reportSections.productivity){
    let focusTotal=0,focusDone=0,tasksTotal=0,tasksDone=0,bestDay=0,bestPct=0;
    for(let day=1;day<=daysInMonth;day++){
      const entry=dayMap[day];if(!entry)continue;
      const f=(entry.data.focus&&entry.data.focus[entry.di])||{};
      const fd=entry.data.focusDone||{};
      const fTotal=Object.values(f).filter(Boolean).length;
      const fDone=[1,2,3].filter(n=>fd[entry.di+'_'+n]!==undefined||fd[String(entry.di)+'_'+String(n)]!==undefined).length;
      focusTotal+=fTotal;focusDone+=Math.min(fDone,fTotal);
      const tasks=(entry.data.tasks||[]).filter(t=>t.addedOnDay===entry.di);
      const done=tasks.filter(t=>t.doneOnDay!==undefined).length;
      tasksTotal+=tasks.length;tasksDone+=done;
      const dayPct=fTotal>0?Math.round((fDone/fTotal)*100):0;
      if(dayPct>bestPct){bestPct=dayPct;bestDay=day;}
    }
    const focusPct=focusTotal>0?Math.round((focusDone/focusTotal)*100):0;
    const taskPct=tasksTotal>0?Math.round((tasksDone/tasksTotal)*100):0;
    html+=`<div class="report-section">
      <div class="report-sec-title"><i data-lucide="target" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:5px;"></i>${isEn()?'Productivity':'Productividad'}</div>
      <div class="report-stat-grid">
        <div class="rstat"><div class="rstat-val">${focusPct}%</div><div class="rstat-lbl">${isEn()?'Focus completed':'Enfoques completados'}</div></div>
        <div class="rstat"><div class="rstat-val">${taskPct}%</div><div class="rstat-lbl">${isEn()?'Tasks done':'Pendientes resueltos'}</div></div>
        <div class="rstat"><div class="rstat-val">${focusDone}/${focusTotal}</div><div class="rstat-lbl">${isEn()?'Focus goals':'Metas de enfoque'}</div></div>
        ${bestDay?`<div class="rstat"><div class="rstat-val">${(()=>{const d=new Date(reportYear,reportMonth,bestDay);return(isEn()?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'])[(d.getDay()+6)%7]+' '+bestDay;})()} </div><div class="rstat-lbl">${isEn()?'Best day':'Día más productivo'} ${bestPct}%</div></div>`:''}
      </div>
      <div style="margin-top:8px;">
        <div class="rbar-row"><div class="rbar-lbl">${isEn()?'Focus':'Enfoque'}</div><div class="rbar-track"><div class="rbar-fill" style="width:${focusPct}%;"></div></div><div class="rbar-amt">${focusPct}%</div></div>
        <div class="rbar-row"><div class="rbar-lbl">${isEn()?'Tasks':'Tareas'}</div><div class="rbar-track"><div class="rbar-fill" style="width:${taskPct}%;background:var(--teal);"></div></div><div class="rbar-amt">${taskPct}%</div></div>
      </div>
    </div>`;
  }
  if(!html)html=`<div style="text-align:center;color:var(--text3);padding:2rem;font-size:14px;">${isEn()?'Select at least one section above':'Selecciona al menos una sección arriba'}</div>`;
  container.innerHTML=html;
  if(typeof lucide!=='undefined')lucide.createIcons();
}

function initBudgetSmartSelects(cats){
  const es = !isEn();
  const rubroOpts = cats || setupCfg.gastoCats || DEFAULT_GASTOS;

  function onAddRubro(name){
    if(!setupCfg.gastoCats) setupCfg.gastoCats=[...DEFAULT_GASTOS];
    if(!setupCfg.gastoCats.includes(name)){
      setupCfg.gastoCats.push(name);
      saveConfigToFirebase();
      localStorage.setItem('wp_config', JSON.stringify(setupCfg));
      showToast(es?'Rubro agregado ✓':'Category added ✓');
    }
  }

  // Mobile rubro selects
  document.querySelectorAll('.ss-budget-rubro-mobile').forEach(placeholder => {
    const gi = parseInt(placeholder.dataset.gi);
    const si = parseInt(placeholder.dataset.si);
    const val = placeholder.dataset.val || '';
    const ss = createSmartSelect({
      id: `rubro_mobile_${gi}_${si}`,
      options: rubroOpts,
      value: val,
      placeholder: es?'Rubro...':'Category...',
      onChange: (v) => {
        budgetChangeRubro(gi, si, v);
        // Sync desktop SS too
        const desktopSS = document.getElementById(`rubro_${gi}_${si}`);
        if(desktopSS) desktopSS.value = v;
      },
      onAddNew: onAddRubro,
      small: true
    });
    placeholder.replaceWith(ss);
  });

  // Existing sub rows
  document.querySelectorAll('.ss-budget-rubro').forEach(placeholder => {
    const gi = parseInt(placeholder.dataset.gi);
    const si = parseInt(placeholder.dataset.si);
    const val = placeholder.dataset.val || '';
    const ss = createSmartSelect({
      id: `rubro_${gi}_${si}`,
      options: rubroOpts,
      value: val,
      placeholder: es?'Rubro...':'Category...',
      onChange: (v) => budgetChangeRubro(gi, si, v),
      onAddNew: onAddRubro,
      small: true
    });
    placeholder.replaceWith(ss);
  });

  // Add-sub rows
  document.querySelectorAll('.ss-budget-addrubro').forEach(placeholder => {
    const gi = parseInt(placeholder.dataset.gi);
    const ss = createSmartSelect({
      id: `bsub-rubro-${gi}`,
      options: rubroOpts,
      value: '',
      placeholder: es?'Rubro...':'Category...',
      onChange: () => {},
      onAddNew: onAddRubro,
      small: true
    });
    placeholder.replaceWith(ss);
  });
}

function initSmartSelects(){
  const es = !isEn();

  // Workout selects
  const woOpts = (setupCfg.workouts||DEFAULT_WORKOUTS); // keys already have emoji+ES name
  ['wo1','wo2'].forEach(id => {
    const sel = document.getElementById(id);
    if(!sel || sel.dataset.ssReplaced) return;
    const opts = woOpts;
    sel.dataset.ssReplaced = '1';
    const cur = sel.value || ''; // value already set by renderWo->setSelectVal
    const ss = createSmartSelect({
      id: id+'_ss',
      options: opts,
      value: cur,
      placeholder: '—',
      onChange: (v) => {
        if(v){const otherId=id==='wo1'?'wo2':'wo1';const otherSel=document.getElementById(otherId);if(otherSel?.value===v){showToast(isEn()?'Already selected in the other field':'Ya seleccionado en el otro campo');return;}}
        sel.value=v; saveWorkout();
      },
      onAddNew: (name) => {
        if(!setupCfg.workouts) setupCfg.workouts=[...DEFAULT_WORKOUTS];
        if(!setupCfg.workouts.includes(name)) setupCfg.workouts.push(name);
        saveConfigToFirebase();
        localStorage.setItem('wp_config', JSON.stringify(setupCfg));
        _suppressSSReset=false;
        showToast(es?'Workout agregado ✓':'Workout added ✓');
      }
    });
    sel.style.cssText = 'display:none!important;';
    sel.parentNode.insertBefore(ss, sel.nextSibling);
  });

  // Hábito selects
  const haOpts = (setupCfg.habitos||DEFAULT_HABITOS); // keys already have emoji+ES name
  ['ha1','ha2'].forEach(id => {
    const sel = document.getElementById(id);
    if(!sel || sel.dataset.ssReplaced) return;
    sel.dataset.ssReplaced = '1';
    const cur = sel.value || ''; // value already set by renderWo->setSelectVal
    const ss = createSmartSelect({
      id: id+'_ss',
      options: haOpts,
      value: cur,
      placeholder: '—',
      onChange: (v) => {
        if(v){const otherId=id==='ha1'?'ha2':'ha1';const otherSel=document.getElementById(otherId);if(otherSel?.value===v){showToast(isEn()?'Already selected in the other field':'Ya seleccionado en el otro campo');return;}}
        sel.value=v; saveWorkout();
      },
      onAddNew: (name) => {
        if(!setupCfg.habitos) setupCfg.habitos=[...DEFAULT_HABITOS];
        if(!setupCfg.habitos.includes(name)) setupCfg.habitos.push(name);
        saveConfigToFirebase();
        localStorage.setItem('wp_config', JSON.stringify(setupCfg));
        _suppressSSReset=false;
        showToast(es?'Hábito agregado ✓':'Habit added ✓');
      }
    });
    sel.style.cssText = 'display:none!important;';
    sel.parentNode.insertBefore(ss, sel.nextSibling);
  });

  // Sync all select values to SS inputs
  ['wo1','wo2','ha1','ha2'].forEach(id=>{
    const sel=document.getElementById(id);
    const wrap=document.getElementById(id+'_ss');
    const inp=wrap?.querySelector('input.ss-input');
    if(sel&&inp)inp.value=sel.value;
  });

  // Gasto category select
  const gastoCatSel = document.getElementById('gasto-cat');
  if(gastoCatSel && !gastoCatSel.dataset.ssReplaced){
    gastoCatSel.value = '';
    gastoCatSel.dataset.ssReplaced = '1';
    const baseOpts = (setupCfg.gastoCats||DEFAULT_GASTOS);
    const gaOpts = baseOpts.includes(PAGO_CREDITO_CAT)?baseOpts:[...baseOpts,PAGO_CREDITO_CAT];
    gastoCatSel.innerHTML = gaOpts.map(c=>`<option value="${c}">${c}</option>`).join('');
    const ss = createSmartSelect({
      id: 'gasto-cat_ss',
      options: gaOpts,
      value: '',
      placeholder: es?'Categoría...':'Category...',
      onChange: (v) => { gastoCatSel.value=v; buildPagoSelect(); },
      onAddNew: (name) => {
        if(!setupCfg.gastoCats) setupCfg.gastoCats=[...DEFAULT_GASTOS];
        if(!setupCfg.gastoCats.includes(name)) setupCfg.gastoCats.push(name);
        saveConfigToFirebase();
        localStorage.setItem('wp_config', JSON.stringify(setupCfg));
        // Rebuild gasto cat select options
        gastoCatSel.innerHTML = setupCfg.gastoCats.map(c=>`<option>${c}</option>`).join('');
        showToast(es?'Categoría agregada ✓':'Category added ✓');
      }
    });
    gastoCatSel.style.cssText = 'display:none!important;flex:1;';
    gastoCatSel.parentNode.insertBefore(ss, gastoCatSel.nextSibling);
    ss.style.flex = '1';
  }
}

// Reset SmartSelects on re-render (remove old ones first)
function resetSmartSelects(){
  if(document.activeElement?.classList.contains('ss-input'))return;
  document.querySelectorAll('.ss-wrap').forEach(el => el.remove());
  document.querySelectorAll('[data-ss-replaced]').forEach(el => {
    el.style.display = '';
    delete el.dataset.ssReplaced;
  });
}

// ── SMART SELECT COMPONENT ─────────────────────────────────────────
let _ssOpenId = null;
let _ssCloseTimer = null;

function ssClose(){
  const existing = document.getElementById('ss-dropdown-active');
  if(existing) existing.remove();
  _ssOpenId = null;
}

function ssOpen(inputEl, options, onChange, onAddNew, isTyping=false){
  clearTimeout(_ssCloseTimer);
  _ssCloseTimer = null;
  ssClose();
  const id = 'ss-dropdown-active';
  const rect = inputEl.getBoundingClientRect();
  const drop = document.createElement('div');
  drop.id = id;
  drop.className = 'ss-dropdown';

  // Position
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  drop.style.position = 'fixed';
  drop.style.left = Math.max(4, rect.left) + 'px';
  drop.style.width = Math.max(180, rect.width) + 'px';
  drop.style.zIndex = '999999';
  if(spaceBelow > 150 || spaceBelow > rect.top){
    drop.style.top = (rect.bottom + 2) + 'px';
  } else {
    drop.style.top = Math.max(4, rect.top - Math.min(220, rect.top) - 2) + 'px';
  }

  const filter = isTyping ? inputEl.value.toLowerCase() : '';
  const filtered = filter ? options.filter(o => o.toLowerCase().includes(filter)) : options;
  
  // Empty option
  const addRow = (text, val, isAdd) => {
    const div = document.createElement('div');
    div.className = 'ss-item' + (isAdd ? ' ss-add' : '');
    div.textContent = text;
    const _itemHandler = (e) => {
      e.preventDefault();
      if(isAdd){
        const name = inputEl.value.trim() || prompt(isEn()?'New name:':'Nombre nuevo:','');
        if(name){ onAddNew && onAddNew(name); onChange && onChange(name); inputEl.value = name; }
      } else {
        inputEl.value = val;
        onChange && onChange(val);
      }
      ssClose();
    };
    let _tStartY = 0, _tMoved = false;
    div.addEventListener('touchstart', (e) => { _tStartY = e.touches[0].clientY; _tMoved = false; }, {passive:true});
    div.addEventListener('touchmove', (e) => { if(Math.abs(e.touches[0].clientY - _tStartY) > 8) _tMoved = true; }, {passive:true});
    div.addEventListener('mousedown', _itemHandler);
    div.addEventListener('touchend', (e) => { if(_tMoved) return; e.preventDefault(); _itemHandler(e); });
    drop.appendChild(div);
  };

  addRow('— ' + (isEn()?'None':'Ninguno'), '', false);
  if(!filtered.length && filter){
    const empty = document.createElement('div');
    empty.className = 'ss-empty';
    empty.textContent = isEn()?'No results':'Sin resultados';
    drop.appendChild(empty);
  }
  filtered.forEach(o => addRow(o, o, false));
  if(onAddNew){
    addRow(filter ? (isEn()?`+ Add "${inputEl.value}"`:`+ Agregar "${inputEl.value}"`) : (isEn()?'+ Add new...':'+ Agregar nuevo...'), '', true);
  }

  document.body.appendChild(drop);
  _ssOpenId = inputEl.id;
}

// Close SS on click/touch outside
function _ssOutsideHandler(e){
  const drop = document.getElementById('ss-dropdown-active');
  if(drop && !drop.contains(e.target)){
    const activeInput = _ssOpenId ? document.getElementById(_ssOpenId) : null;
    if(!activeInput || !activeInput.contains(e.target)) ssClose();
  }
}
document.addEventListener('mousedown', _ssOutsideHandler);
document.addEventListener('touchstart', _ssOutsideHandler, {passive:true});

function createSmartSelect({id, options, value='', placeholder='—', onChange, onAddNew, small=false}){
  const wrap = document.createElement('div');
  wrap.className = 'ss-wrap';
  
  const input = document.createElement('input');
  input.id = id + '_ss'; // _ss suffix so getElementById(id+'_ss') always works
  wrap.id = id;
  input.className = 'ss-input';
  if(small) input.style.cssText = 'font-size:10px;padding:2px 22px 2px 6px;height:26px;';
  input.placeholder = placeholder;
  input.value = value;
  input.autocomplete = 'off';
  input.spellcheck = false;

  const arrow = document.createElement('span');
  arrow.className = 'ss-arrow';
  arrow.textContent = '▾';
  arrow.addEventListener('mousedown', e => { e.preventDefault(); input.focus(); });
  arrow.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); clearTimeout(_ssCloseTimer);_ssCloseTimer=null;ssOpen(input, options, onChange, onAddNew, false); }, {passive:false});

  input.addEventListener('focus', () => ssOpen(input, options, onChange, onAddNew, false));
  input.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); clearTimeout(_ssCloseTimer);_ssCloseTimer=null;ssOpen(input, options, onChange, onAddNew, false); }, {passive:false});
  input.addEventListener('input', () => ssOpen(input, options, onChange, onAddNew, true));
  input.addEventListener('blur', () => { if(!('ontouchstart' in window)) _ssCloseTimer=setTimeout(ssClose, 150); });
  input.addEventListener('keydown', e => {
    if(e.key === 'Escape' || e.key === 'Tab'){ ssClose(); input.blur(); return; }
    if(e.key === 'Enter'){
      e.preventDefault();
      const drop = document.getElementById('ss-dropdown-active');
      if(drop){
        // Select first real option (skip "None")
        const items = Array.from(drop.querySelectorAll('.ss-item')).filter(el => !el.textContent.startsWith('—'));
        if(items.length){
          items[0].dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
        } else if(onAddNew && input.value.trim()){
          onAddNew(input.value.trim());
          onChange && onChange(input.value.trim());
          ssClose();
        }
      } else if(input.value.trim()){
        // No dropdown open - if value matches an option, confirm it
        const match = options.find(o => o.toLowerCase() === input.value.toLowerCase());
        if(match){ onChange && onChange(match); input.value = match; }
        else if(onAddNew){ onAddNew(input.value.trim()); onChange && onChange(input.value.trim()); }
        input.blur();
      }
    }
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(!document.getElementById('ss-dropdown-active')) ssOpen(input, options, onChange, onAddNew);
    }
  });

  wrap.appendChild(input);
  wrap.appendChild(arrow);
  return wrap;
}
// ── END SMART SELECT ───────────────────────────────────────────────

// ══════════════════════════════════════════════════════
// BACKUP SYSTEM
// ══════════════════════════════════════════════════════
const BACKUP_DAYS = 7;
const BACKUP_KEY = 'wp_last_backup_date';

async function autoBackup(){
  if(!db||!currentUser)return;
  const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  const lastBackup = localStorage.getItem(BACKUP_KEY+'_'+currentUser.uid);
  if(lastBackup === today) return; // already backed up today
  try{
    // Collect all current data
    const snapshot = {};
    
    // Week data (current week + last 4 weeks)
    const weekPromises = [];
    for(let w=0; w<5; w++){
      const d = new Date(weekDays[0]);
      d.setDate(d.getDate() - w*7);
      const key = 'week_' + dk(d);
      weekPromises.push(
        userCol().doc(key).get()
          .then(s => { if(s.exists) snapshot[key] = s.data(); })
          .catch(()=>{})
      );
    }
    await Promise.all(weekPromises);
    
    // Budget config
    const budgetSnap = await userCol().doc('budget_config').get();
    if(budgetSnap.exists) snapshot['budget_config'] = budgetSnap.data();
    
    // Shopping
    const shopSnap = await userCol().doc('shopping').get();
    if(shopSnap.exists) snapshot['shopping'] = shopSnap.data();
    
    // Config
    const cfgSnap = await userCol().doc('config').get();
    if(cfgSnap.exists) snapshot['config'] = cfgSnap.data();
    
    // Pending tasks
    const pendSnap = await userCol().doc('pending_tasks').get();
    if(pendSnap.exists) snapshot['pending_tasks'] = pendSnap.data();

    // Budget monthly actuals (last 13 months)
    const budgetMonthPromises = [];
    const now = new Date();
    for(let i=0; i<13; i++){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const key = 'budget_actual_'+d.getFullYear()+'_'+String(d.getMonth()+1).padStart(2,'0');
      budgetMonthPromises.push(
        userCol().doc(key).get()
          .then(s=>{ if(s.exists) snapshot[key]=s.data(); })
          .catch(()=>{})
      );
    }
    await Promise.all(budgetMonthPromises);

    // Save backup
    if(Object.keys(snapshot).length > 0){
      await userCol().doc('backups').collection('daily').doc(today).set({
        date: today,
        ts: Date.now(),
        docs: snapshot
      });
      localStorage.setItem(BACKUP_KEY+'_'+currentUser.uid, today);
      console.log('✅ Backup saved for', today, '— docs:', Object.keys(snapshot).length);
      
      // Clean up old backups (keep last 7 days)
      await cleanOldBackups();
    }
  }catch(e){
    console.warn('Backup failed (non-critical):', e);
  }
}

async function cleanOldBackups(){
  try{
    const snaps = await userCol().doc('backups').collection('daily')
      .orderBy('ts','desc')
      .get();
    const docs = snaps.docs;
    if(docs.length > BACKUP_DAYS){
      const toDelete = docs.slice(BACKUP_DAYS);
      await Promise.all(toDelete.map(d => d.ref.delete()));
      console.log('🗑 Cleaned', toDelete.length, 'old backups');
    }
  }catch(e){ console.warn('Cleanup failed:', e); }
}

async function getBackupList(){
  try{
    const snaps = await userCol().doc('backups').collection('daily')
      .orderBy('ts','desc')
      .limit(BACKUP_DAYS)
      .get();
    return snaps.docs.map(d => ({id: d.id, date: d.data().date, ts: d.data().ts, docCount: Object.keys(d.data().docs||{}).length}));
  }catch(e){ return []; }
}

async function restoreFromBackup(dateStr){
  if(!db||!currentUser)return;
  const es = !isEn();
  if(!confirm(es?`¿Restaurar todos tus datos al ${dateStr}? Esto reemplazará tu información actual.`:`Restore all your data to ${dateStr}? This will replace your current data.`)) return;
  
  try{
    const snap = await userCol().doc('backups').collection('daily').doc(dateStr).get();
    if(!snap.exists){ alert(es?'Respaldo no encontrado':'Backup not found'); return; }
    
    const {docs} = snap.data();
    showToast(es?'Restaurando...' : 'Restoring...');
    
    // Save current state as emergency backup before restoring
    const emergencyDate = new Date().toISOString().slice(0,16).replace('T','_').replace(':','-');
    await userCol().doc('backups').collection('daily').doc('pre_restore_'+emergencyDate).set({
      date: emergencyDate,
      ts: Date.now(),
      docs: {} // we'll fill this minimally
    }).catch(()=>{});

    // Restore each doc
    const restorePromises = Object.entries(docs).map(([docId, data]) => 
      userCol().doc(docId).set(data).catch(e => console.warn('Failed to restore', docId, e))
    );
    await Promise.all(restorePromises);
    
    showToast(es?'Datos restaurados — recargando...' : 'Data restored — reloading...');
    setTimeout(() => window.location.reload(), 1500);
  }catch(e){
    console.error('Restore failed:', e);
    alert(es?'Error al restaurar: '+e.message : 'Restore failed: '+e.message);
  }
}

async function openBackupsUI(){
  const es = !isEn();
  const modal = document.createElement('div');
  modal.id = 'backups-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
  
  modal.innerHTML = `<div style="background:var(--bg);border-radius:16px;padding:20px;width:100%;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,.2);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="font-size:16px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:7px;"><i data-lucide="database" style="width:16px;height:16px;"></i>${es?'Respaldos':'Backups'}</div>
      <button onclick="document.getElementById('backups-modal').remove()" style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--text3);">×</button>
    </div>
    <div id="backups-list" style="font-size:13px;color:var(--text3);text-align:center;padding:16px;">${es?'Cargando...':'Loading...'}</div>
    <button onclick="forceBackupNow()" id="force-backup-btn" style="width:100%;margin-top:12px;padding:10px;border-radius:10px;border:none;background:var(--mauve);color:#fff;font-size:13px;font-weight:500;cursor:pointer;">
      <i data-lucide="save" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"></i>${es?'Hacer respaldo ahora':'Backup now'}
    </button>
    <div style="font-size:11px;color:var(--text3);margin-top:8px;padding-top:8px;border-top:0.5px solid var(--border);">
      ${es?'Se guarda un respaldo automático una vez al día. Se mantienen los últimos 7 días.':'Auto-backup runs once daily. Last 7 days are kept.'}
    </div>
  </div>`;
  
  document.body.appendChild(modal);
  if(typeof lucide!=='undefined')lucide.createIcons();

  const list = document.getElementById('backups-list');
  const backups = await getBackupList();
  
  if(!backups.length){
    list.textContent = es?"No hay respaldos aún. Se crearán automáticamente cada día.":"No backups yet. They'll be created automatically each day.";
    return;
  }
  
  list.innerHTML = backups.map(b => {
    const d = new Date(b.ts);
    const label = d.toLocaleDateString(es?'es-MX':'en-US', {weekday:'short',month:'short',day:'numeric'});
    const time = d.toLocaleTimeString(es?'es-MX':'en-US', {hour:'2-digit',minute:'2-digit'});
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:0.5px solid var(--border);">
      <div>
        <div style="font-weight:500;color:var(--text);">${label}</div>
        <div style="font-size:11px;color:var(--text3);">${time} · ${b.docCount} ${es?'docs':'docs'}</div>
      </div>
      <button onclick="document.getElementById('backups-modal').remove();restoreFromBackup('${b.id}')" 
        style="padding:5px 12px;border-radius:8px;border:0.5px solid var(--mauve);background:none;color:var(--mauve);font-size:12px;cursor:pointer;">
        ${es?'Restaurar':'Restore'}
      </button>
    </div>`;
  }).join('');
}
async function forceBackupNow(){
  const es=!isEn();
  const btn=document.getElementById('force-backup-btn');
  if(btn){btn.disabled=true;btn.textContent=es?'Guardando...':'Saving...';}
  try{
    localStorage.removeItem(BACKUP_KEY+'_'+currentUser.uid);
    await autoBackup();
    if(btn){btn.textContent=es?'Respaldo guardado':'Backup saved';}
    setTimeout(()=>document.getElementById('backups-modal')?.remove(),1200);
  }catch(e){
    if(btn){btn.disabled=false;btn.innerHTML='<i data-lucide="save" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"></i>'+(es?'Hacer respaldo ahora':'Backup now');if(typeof lucide!=='undefined')lucide.createIcons();}
    showToast(es?'Error al hacer respaldo':'Backup failed');
  }
}

// ══════════════════════════════════════════════════════
// END BACKUP SYSTEM
// ══════════════════════════════════════════════════════

// ── PAYMENT WALL ──────────────────────────────────────
function showPaymentWall(expired=false){
  const es=loginLang!=='en';
  const existing=document.getElementById('payment-wall');
  if(existing)existing.remove();
  const wall=document.createElement('div');
  wall.id='payment-wall';
  wall.style.cssText='position:fixed;inset:0;background:var(--bg2);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  wall.innerHTML=`
    <div style="background:var(--bg);border-radius:20px;padding:2.5rem 2rem;max-width:380px;width:100%;text-align:center;border:0.5px solid var(--border);">
      <img src="data:image/png;base64,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yJGjth96nk0vs9ATvVb30d07IHmn2341uvrii+eh50eteDK+kowP97aNsarML06e3d89OnywfzldnXC+nC1yo/faw8kiLUqd5pnkg26rPVskcSfwvWA6S7Y6vXSoknmaQv7ty8vtQds5OBhuWaazVM9VmRtzcjlDS2CT1XgqOANrBHAeACplSuvSLFfGDLu9oigNEJMyTTMpuESmrPE86UlPMqmtHfa7/U732YtjycV4ugBk83nCkC1XaafNBt0WIuWl4kiGi9F0EQcy8MJclblSni+3ui0mxHgyvnu09/jR26PReD4/3t7uOc7kqrxcLuIWDv1Y1ApJ5ewk4IgOiLO1r7RWievBW+NTgAafNBdqd+naR1855CuDH9SJ+xo6abwXzd+1hwwby3atVq2TRuHaVYJITYZXRgSMVdkCAcCulXkEViVeRxRUueWQIVrmiIHRxjDuiNA5n/NWGM8k/jKw//uzF7/75nnXD/tbQ78ddbut0phnx2cAaE3JsLu1veeUEuBaccR3BmcnJ6PJpUPbkvzu3t5zoIvRJQd4/93H2rrJcjoeLX7ygw86g1hptVpkDx8cnV+OWoEv2/zocNeScY52t4YoWZa7s0WmyD0/fkVWLacjKkuO4AwRopis0q1utxNxyLNSmbwsoqAIfF9l+Spbhr70ObdE1jlnnEX64XsPvn32Spf6yYsXxjhhiQOWWhnj7W71ACDJS6/rd7udAfNOr86llMB5XhaC+/1O+/7dO3mmposlF7i3vfPO24/2dgcH+/3jF+cvL0ePHt755ssnHNpd9JzWRMA4ByBWpzZFwsYaUw9sM+YVMV0HczSE1BgXCZGQsCK6ik1hcxvQOnVmZStijDmqtg+qs/1WNNcYC69V9/V3US9SrbORUaUvVkCbsetbK1yDaJEYkOWMAMA656yrNMEoCILAK1Tq8S+F+ets9jeL6e8+fzVo9f70xz+0loTAKIoc0cnl5fjkJOz0h/09GYl8ld89PDg+fYlMlMUqDgIRtlarld/pYETL2YwxMV4uRlfjd9995JjOV7lDneVpXig/9EfTmS7t3nAwksvxfLq91REs6A/apTUWsN02Xz1/loxe6aLAajs5V3NckafJlLFBK2IMY086slleGGMMkWAMgBwSEr371qPxZM6l/Orp+Xy1fOvunel8hUJobeIoJGdbUSCEMNb2Wu3F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" style="width:80px;height:80px;border-radius:14px;margin-bottom:14px;object-fit:cover;">
      <h2 style="font-size:22px;font-weight:500;color:var(--text);margin-bottom:8px;">Weekly Planner</h2>
      ${expired
        ? `<p style="font-size:14px;color:var(--mauve);margin-bottom:8px;">${es?'Tu acceso ha expirado':'Your access has expired'}</p>`
        : `<p style="font-size:14px;color:var(--text2);margin-bottom:8px;">${es?'Accede a todas las funciones':'Access all features'}</p>`
      }
      <p style="font-size:26px;font-weight:500;color:var(--text);margin:16px 0 4px;">$499 <span style="font-size:14px;color:var(--text3);">MXN</span></p>
      <p style="font-size:12px;color:var(--text3);margin-bottom:24px;">${es?'por año':'per year'}</p>
      <a href="https://buy.stripe.com/fZu5kDg2EcMe7aJgBIebu00" target="_blank"
        style="display:block;width:100%;padding:14px;border-radius:12px;background:var(--mauve);color:#fff;font-size:15px;font-weight:500;text-decoration:none;margin-bottom:12px;">
        ${es?'Comprar acceso':'Buy access'} →
      </a>
      <p style="font-size:11px;color:var(--text3);margin-bottom:16px;">${es?'Después de pagar, regresa e inicia sesión nuevamente.':'After paying, come back and log in again.'}</p>
      <button onclick="signOut()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:12px;text-decoration:underline;">
        ${es?'Cerrar sesión':'Sign out'}
      </button>
    </div>`;
  document.body.appendChild(wall);
}
// ── END PAYMENT WALL ──────────────────────────────────

// ── AVISO DE PRIVACIDAD ────────────────────────────────
function updatePrivacyBtn(){
  const c1=document.getElementById('privacy-check1');
  const c2=document.getElementById('privacy-check2');
  const btn=document.getElementById('privacy-accept-btn');
  if(c1&&c2&&btn){
    btn.classList.toggle('ready', c1.checked&&c2.checked);
  }
}

async function acceptPrivacy(){
  const c1=document.getElementById('privacy-check1');
  const c2=document.getElementById('privacy-check2');
  if(!c1?.checked||!c2?.checked)return;
  // Save acceptance to Firebase
  if(db&&currentUser){
    try{
      await userCol().doc('privacy').set({
        accepted:true,
        ts:Date.now(),
        version:'2026-04',
        email:currentUser.email
      });
    }catch(e){console.warn('Privacy save error:',e);}
  }
  // Also save locally as fallback
  localStorage.setItem('wp_privacy_accepted_'+( currentUser?.uid||''), '2026-04');
  document.getElementById('privacy-modal').classList.remove('show');
}

async function checkPrivacyAccepted(){
  if(!currentUser)return true;
  // Check local first (faster)
  const local=localStorage.getItem('wp_privacy_accepted_'+currentUser.uid);
  if(local)return true;
  // Check Firebase
  try{
    const snap=await userCol().doc('privacy').get();
    if(snap.exists&&snap.data().accepted){
      localStorage.setItem('wp_privacy_accepted_'+currentUser.uid,'2026-04');
      return true;
    }
  }catch(e){console.warn('Privacy check error:',e);}
  return false;
}

async function showPrivacyIfNeeded(){
  const accepted=await checkPrivacyAccepted();
  if(!accepted){
    document.getElementById('privacy-modal').classList.add('show');
  }
}
// ── END AVISO DE PRIVACIDAD ────────────────────────────

