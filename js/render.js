// ── RENDER ─────────────────────────────────
function setWeekRange(){
  
  const wr=isEn()
    ?(MES[weekDays[0].getMonth()]+' '+weekDays[0].getDate()+' — '+MES[weekDays[6].getMonth()]+' '+weekDays[6].getDate())
    :('Semana '+weekDays[0].getDate()+' de '+MES[weekDays[0].getMonth()]+' — '+weekDays[6].getDate()+' de '+MES[weekDays[6].getMonth()]);
  document.getElementById('week-range').textContent=wr;
}

function buildNav(){
  const nav=document.getElementById('wk-nav');nav.innerHTML='';
  weekDays.forEach((d,i)=>{
    const isT=dk(d)===dk(today);const isA=dk(d)===dk(activeDate);
    const dt=tasksForDay(i);const df=focusForDay(i);
    const has=dt.filter(t=>t.addedOnDay===i).length>0||df[1]||df[2]||df[3]||((weekData.events||{})[i]&&weekData.events[i].length>0)||(gcalEvts[dk(d)]&&gcalEvts[dk(d)].length>0);
    const btn=document.createElement('div');
    btn.className='wk-btn'+(isA?' active':'')+(isT?' istoday':'')+(has?' has-data':'');
    btn.innerHTML='<span class="wdn">'+DS[d.getDay()]+'</span><span class="wdnum">'+d.getDate()+'</span><span class="wdot"></span>';
    btn.onclick=()=>{activeDate=new Date(d);document.getElementById('ev-date').value=dk(d);renderDay();};
    nav.appendChild(btn);
  });

  // Mini nav above gastos
  const miniNav=document.getElementById('wk-nav-mini');
  if(miniNav){
    miniNav.innerHTML='';
    weekDays.forEach((d,i)=>{
      const isT=dk(d)===dk(today);
      const isA=dk(d)===dk(activeDate);
      const col=document.createElement('div');
      col.style.cssText='flex:1;text-align:center;cursor:pointer;padding:6px 2px;border-radius:8px;'+(isA?'background:var(--mauve);':'');
      col.innerHTML='<div style="font-size:9px;font-weight:500;color:'+(isA?'#fff':'var(--text3)')+'">'+DS[d.getDay()]+'</div>'+
        '<div style="font-size:14px;font-weight:'+(isA?'600':'400')+';color:'+(isA?'#fff':(isT?'var(--mauve)':'var(--text)'))+' ">'+d.getDate()+'</div>';
      col.onclick=()=>{activeDate=new Date(d);document.getElementById('ev-date').value=dk(d);renderDay();};
      miniNav.appendChild(col);
    });
  }
}

function buildOv(){
  const ov=document.getElementById('wkov');ov.innerHTML='';
  weekDays.forEach((d,i)=>{
    const isT=dk(d)===dk(today);
    const col=document.createElement('div');col.className='wcol';
    const n=document.createElement('div');n.className='wovn'+(isT?' today':'');n.textContent=DS[d.getDay()];col.appendChild(n);
    const w=dayWo(i);
    if(w.wo1){const t=document.createElement('div');t.className='wtag wwo';t.textContent=emoji(w.wo1,WE);col.appendChild(t);}
    if(w.wo2){const t=document.createElement('div');t.className='wtag wwo';t.textContent=w.wo2;col.appendChild(t);}
    if(w.ha1){const t=document.createElement('div');t.className='wtag whb';t.textContent=w.ha1;col.appendChild(t);}
    if(w.ha2){const t=document.createElement('div');t.className='wtag whb';t.textContent=w.ha2;col.appendChild(t);}
    const df=focusForDay(i);
    const fd=weekData.focusDone||{};
    [1,2,3].forEach(n=>{
      if(df[n]){
        const isDone=fd[String(i)+'_'+String(n)]!==undefined;
        const el=document.createElement('div');
        el.className='wtsk'+(isDone?' done-task':'');
        el.textContent=df[n];
        col.appendChild(el);
      }
    });
    const gcalEvDay=gcalEvts[dk(d)]||[];
    const manualEvDay=dayEvts(i);
    const manualTitles=new Set(manualEvDay.map(e=>(e.title||'').toLowerCase()));
    // Parsear hora para ordenar ("8:30 AM" → minutos desde medianoche, "Todo el día" → -1)
    const parseT=t=>{if(!t||t==='Todo el día'||t==='All day')return-1;const m=t.match(/(\d+):(\d+)\s*(AM|PM)/i);if(!m)return-1;let h=parseInt(m[1]);const mn=parseInt(m[2]);const ap=m[3].toUpperCase();if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;return h*60+mn;};
    // Combinar: manual (siempre) + GCal no duplicados
    const allEvs=[
      ...manualEvDay.map(e=>({...e,_src:'manual'})),
      ...gcalEvDay.filter(e=>!manualTitles.has(e.title.toLowerCase())).map(e=>({...e,_src:'gcal'}))
    ].sort((a,b)=>parseT(a.time)-parseT(b.time));
    allEvs.forEach(ev=>{
      const t=document.createElement('div');
      const isPinned=!!ev.pinned;
      const isGcal=ev._src==='gcal';
      t.className='wtag wev'+(isPinned?' pinned':'');
      t.textContent=ev.title;
      if(isPinned){t.title='Click para desanclar';t.onclick=()=>pinGCalEvent(i,ev);}
      else if(isGcal){t.title='Click para guardar en el planner';t.onclick=()=>pinGCalEvent(i,ev);}
      col.appendChild(t);
    });
    ov.appendChild(col);
  });
}

function renderDay(){
  resetSmartSelects();
  const di=dayIdx();
  
  document.getElementById('active-date').textContent=isEn()
    ?(DIAS[activeDate.getDay()]+', '+MES[activeDate.getMonth()]+' '+activeDate.getDate())
    :(DIAS[activeDate.getDay()]+', '+activeDate.getDate()+' de '+MES[activeDate.getMonth()]);
  setWeekRange();buildNav();buildOv();
  if(setupCfg&&setupCfg.lang)updateGastosLang(setupCfg.lang);
  renderTasks(di);renderFocus(di);renderEvts(di);renderWo(di);updateProg(di);renderSh();renderGastos(di);
  initSmartSelects();
}

function renderTasks(di){
  const list=document.getElementById('task-list');list.innerHTML='';
  const tasks=tasksForDay(di);
  const carried=tasks.filter(t=>t.addedOnDay<di);
  const undoneCarried=carried.filter(t=>t.doneOnDay===undefined);
  const ch=document.getElementById('ch');
  if(undoneCarried.length){ch.style.display='block';ch.textContent=undoneCarried.length+' pendiente'+(undoneCarried.length>1?'s':'')+' sin completar del día anterior';}
  else ch.style.display='none';
  const displayTasks=[...tasks].sort((a,b)=>(a.doneOnDay!==undefined?1:0)-(b.doneOnDay!==undefined?1:0));
  const undoneDisplay=displayTasks.filter(t=>t.doneOnDay===undefined);
  displayTasks.forEach(t=>{
    const isDone=t.doneOnDay!==undefined;const isCar=t.addedOnDay<di;
    const d=document.createElement('div');d.className='task-item'+(isCar?' carried':'');
    const tid=t.id;
    const allIdx=undoneDisplay.findIndex(tt=>tt.id===t.id);
    const arrows=isDone?'<div style="width:18px;flex-shrink:0;"></div>':
      '<div style="display:flex;flex-direction:column;gap:0;flex-shrink:0;">'+
        '<button onclick="moveTask(this.dataset.id,-1)" data-id="'+tid+'" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:9px;padding:0;line-height:1.2;opacity:'+(allIdx===0?'.2':'1')+(allIdx===0?'" disabled':'"')+'>▲</button>'+
        '<button onclick="moveTask(this.dataset.id,1)" data-id="'+tid+'" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:9px;padding:0;line-height:1.2;opacity:'+(allIdx===undoneDisplay.length-1?'.2':'1')+(allIdx===undoneDisplay.length-1?'" disabled':'"')+'>▼</button>'+
      '</div>';
    d.innerHTML=arrows+'<div class="cb'+(isDone?' done':'')+'" data-id="'+t.id+'" onclick="toggleTask(this)"><svg class="ck" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="white" stroke-width="1.5"/></svg></div><span class="tt'+(isDone?' done':'')+'" contenteditable="true" spellcheck="false" data-id="'+t.id+'" onblur="updateTaskText(this)">'+t.text+'</span>'+(isCar&&!isDone?'<span class="cbadge">anterior</span>':'')+'<button class="dx" data-id="'+t.id+'" onclick="deleteTask(this)">×</button>';
    list.appendChild(d);
  });
}

function updateProg(di){
  const tasks=tasksForDay(di);const done=tasks.filter(t=>t.doneOnDay!==undefined).length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;
  document.getElementById('prog-fill').style.width=pct+'%';
  
  document.getElementById('prog-lbl').textContent=(isEn()?'Day progress':'Progreso del día')+': '+pct+'%';
}

function toggleTask(el){
  const id=el.dataset.id;const di=dayIdx();
  const t=(weekData.tasks||[]).find(t=>t.id===id);
  // Also check pendingTasks
  const pt=pendingTasks.find(p=>p.id===id);
  if(t){
    if(t.doneOnDay!==undefined){
      delete t.doneOnDay;
      // Restore to pending if undone
      if(pt===undefined)addPendingTask(id,t.text,dk(weekDays[t.addedOnDay]||activeDate));
    }else{
      t.doneOnDay=di;
      resolvePendingTask(id);
    }
    saveDB();
  } else if(pt){
    // Task from a previous week - toggle done in pendingTasks
    if(pt.done){
      pt.done=false;
      delete pt.doneDate;
      savePendingTasks();
    } else {
      resolvePendingTask(id);
    }
  }
  renderTasks(di);updateProg(di);buildNav();buildOv();
}
function updateTaskText(el){
  const id=el.dataset.id;
  const t=(weekData.tasks||[]).find(t=>t.id===id);
  if(t&&el.textContent.trim()){t.text=el.textContent.trim();saveDB();}
}
function deleteTask(el){
  const id=el.dataset.id;const di=dayIdx();
  const t=(weekData.tasks||[]).find(t=>t.id===id);
  if(t){t.deletedOnDay=di;saveDB();}
  resolvePendingTask(id, true);
  renderTasks(di);updateProg(di);buildNav();buildOv();
}
function moveTask(id, dir){
  dir=parseInt(dir);
  const di=dayIdx();
  if(!weekData.tasks)weekData.tasks=[];
  const allTasks=weekData.tasks;
  const visible=tasksForDay(di).filter(t=>t.doneOnDay===undefined);
  const idx=visible.findIndex(t=>t.id===id);
  const ni=idx+dir;
  if(idx===-1||ni<0||ni>=visible.length)return;
  // Import prev-week tasks into weekData.tasks preserving their order
  const toImport=visible.filter(t=>t.fromPrevWeek&&!allTasks.find(wt=>wt.id===t.id));
  [...toImport].reverse().forEach(t=>allTasks.unshift({id:t.id,text:t.text,addedOnDay:-1}));
  // Swap
  const idxA=allTasks.findIndex(t=>t.id===visible[idx].id);
  const idxB=allTasks.findIndex(t=>t.id===visible[ni].id);
  if(idxA===-1||idxB===-1)return;
  [allTasks[idxA],allTasks[idxB]]=[allTasks[idxB],allTasks[idxA]];
  saveDB();
  renderTasks(di);
}

function flashInvalid(el){
  if(!el)return;
  el.style.borderColor='#c0392b';
  el.style.background='rgba(192,57,43,0.06)';
  el.focus();
  setTimeout(()=>{el.style.borderColor='';el.style.background='';},2000);
}

function addTask(){
  const inp=document.getElementById('task-in');const v=inp.value.trim();if(!v){flashInvalid(inp);return;}
  const di=dayIdx();if(!weekData.tasks)weekData.tasks=[];
  const id='t'+Date.now();
  weekData.tasks.push({id,text:v,addedOnDay:di});
  saveDB();
  addPendingTask(id, v, dk(activeDate));
  renderTasks(di);buildNav();inp.value='';
}

function renderFocus(di){
  [1,2,3].forEach(n=>{const s=document.getElementById('fs'+n);if(s)s.querySelector('input').value='';});
  renderBubbles(di);
}

function makeBubble(inp,num){
  const v=inp.value.trim();
  if(!v){flashInvalid(inp);return;}
  const di=dayIdx();
  if(!weekData.focus)weekData.focus={};
  if(!weekData.focus[di])weekData.focus[di]={};
  weekData.focus[di][num]=v;
  inp.value='';
  saveDB();
  renderBubbles(di);
  buildNav();
}

function editBubble(n,di){
  const f=focusForDay(di);
  const inp=document.createElement('input');
  inp.type='text';
  inp.value=f[n]||'';
  inp.className='finput';
  inp.style.cssText='flex:1;font-size:13px;';
  const bub=document.querySelector('.fbub[data-n="'+n+'"]');
  if(!bub)return;
  bub.innerHTML='';
  bub.appendChild(inp);
  bub.onclick=null;
  inp.focus();
  inp.select();
  inp.onblur=()=>{
    const v=inp.value.trim();
    if(v){
      if(!weekData.focus)weekData.focus={};
      if(!weekData.focus[di])weekData.focus[di]={};
      weekData.focus[di][n]=v;
      saveDB();
    }
    renderBubbles(di);
    buildOv();
  };
  inp.onkeydown=(e)=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.value=f[n]||'';inp.blur();}};
}

function renderBubbles(di){
  const c=document.getElementById('fbubb');c.innerHTML='';
  const f=focusForDay(di);
  [1,2,3].forEach(n=>{
    if(f[n]){
      const b=document.createElement('div');
      const isDone=!!(weekData.focusDone&&weekData.focusDone[String(di)+'_'+String(n)]!==undefined);
      b.className='fbub'+(isDone?' tachado':'');
      b.setAttribute('data-n',n);
      b.setAttribute('data-di',di);
      b.title=isEn()?'Click to edit, tap ✓ to complete':'Click para editar, toca ✓ para completar';
      b.innerHTML=
        '<span onclick="event.stopPropagation();toggleFdone('+n+','+di+')" style="margin-right:5px;opacity:0.5;font-size:11px;">'+(isDone?'↩':'✓')+'</span>'+
        '<span onclick="editBubble('+n+','+di+')" style="flex:1;cursor:text;">'+f[n]+'</span>'+
        '<span style="font-size:11px;margin-left:4px;opacity:0.5;" onclick="event.stopPropagation();delFocus(this)" data-n="'+n+'">✕</span>';
      b.style.cssText='display:flex;align-items:center;gap:2px;';
      c.appendChild(b);
      const s=document.getElementById('fs'+n);if(s)s.style.display='none';
    } else {
      const s=document.getElementById('fs'+n);if(s){s.style.display='block';s.querySelector('input').value='';}
    }
  });
}

function toggleFdone(num,di){
  if(!weekData.focusDone)weekData.focusDone={};
  const k=String(di)+'_'+String(num);
  if(weekData.focusDone[k]!==undefined){delete weekData.focusDone[k];}
  else{weekData.focusDone[k]=String(di);}
  saveDB();renderBubbles(di);
}

function delFocus(el){
  const num=parseInt(el.dataset.n);
  const di=dayIdx();
  if(!weekData.focus)weekData.focus={};
  if(!weekData.focus[di])weekData.focus[di]={};
  weekData.focus[di][num]='';
  saveDB();renderBubbles(di);buildNav();
}

function renderEvts(di){
  const list=document.getElementById('ev-list');
  const gcal=(gcalEvts[dk(weekDays[di])]||[]).map(e=>({...e,src:'gcal'}));
  const manual=dayEvts(di).map((e,i)=>({...e,src:'manual',idx:i}));
  const ts=t=>{if(!t||t==='Todo el día')return -1;const p=t.includes('PM');const pts=t.replace(/AM|PM/,'').trim().split(':');let h=parseInt(pts[0]);if(p&&h!==12)h+=12;if(!p&&h===12)h=0;return h*60+parseInt(pts[1]||0);};
  // Deduplicate: if same title exists in both gcal and manual, prefer gcal
  const gcalTitles=new Set(gcal.map(e=>e.title.toLowerCase()));
  const manualFiltered=manual.filter(e=>!gcalTitles.has(e.title.toLowerCase()));
  const all=[...gcal,...manualFiltered].sort((a,b)=>ts(a.time)-ts(b.time));
  list.innerHTML='';
  if(!all.length){list.innerHTML='<div class="ev-empty">'+(isEn()?'No events for this day':'Sin eventos para este día')+'</div>';return;}
  all.forEach(ev=>{
    const d=document.createElement('div');d.className='ev-item';
    let del='';
    if(ev.src==='manual')del='<button class="ev-del" data-idx="'+ev.idx+'" data-di="'+di+'" onclick="delManualEv(this)">×</button>';
    else if(ev.src==='gcal'&&ev.gcalId)del='<button class="ev-del" data-gid="'+ev.gcalId+'" onclick="delGCalEv(this)">×</button>';
    const isManual=ev.src==='manual';
    let timeDisplay=ev.time;
    if(ev.durMins>0&&ev.time&&ev.time!=='Todo el día'&&ev.time!=='All day'){
      const p=ev.time.includes('PM');const pts=ev.time.replace(/AM|PM/,'').trim().split(':');
      let sh=parseInt(pts[0]);const sm=parseInt(pts[1]||0);
      if(p&&sh!==12)sh+=12;if(!p&&sh===12)sh=0;
      const totalEnd=sh*60+sm+ev.durMins;
      const eh=Math.floor(totalEnd/60)%24;const em=totalEnd%60;
      const eap=eh>=12?'PM':'AM';const eh12=eh===0?12:eh>12?eh-12:eh;
      timeDisplay=ev.time+' – '+eh12+':'+String(em).padStart(2,'0')+' '+eap;
    }
    d.innerHTML='<div class="ev-time">'+timeDisplay+'</div><div class="ev-dot"></div><div class="ev-title"'+(isManual?' contenteditable="true" spellcheck="false" data-idx="'+ev.idx+'" onblur="updateEvText(this)"':'')+'>'+ev.title+'</div>'+del;
    list.appendChild(d);
  });
}

function updateEvText(el){
  const idx=parseInt(el.dataset.idx);
  const di=dayIdx();
  if(weekData.events&&weekData.events[di]&&weekData.events[di][idx]&&el.textContent.trim()){
    weekData.events[di][idx].title=el.textContent.trim();
    saveDB();
  }
}
function delManualEv(el){
  const idx=parseInt(el.dataset.idx);const di=parseInt(el.dataset.di);
  if(weekData.events&&weekData.events[di])weekData.events[di].splice(idx,1);
  saveDB();renderEvts(di);buildOv();
}

async function delGCalEv(el){
  const gid=el.dataset.gid;if(!gcalToken||!gid)return;
  if(!confirm('¿Eliminar este evento de Google Calendar?'))return;
  // Remove visually immediately
  const evItem=el.closest('.ev-item');
  if(evItem)evItem.remove();
  // Track as deleted so fetchGCal won't restore it
  deletedGCalIds.add(gid);
  // Remove from ALL days in gcalEvts cache
  Object.keys(gcalEvts).forEach(k=>{
    gcalEvts[k]=gcalEvts[k].filter(e=>e.gcalId!==gid);
  });
  buildOv(); // update weekly overview instantly
  try{
    const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/'+gid,{
      method:'DELETE',
      headers:{Authorization:'Bearer '+gcalToken}
    });
    if(r.status===401){gcalToken=null;localStorage.removeItem('gct');localStorage.removeItem('gct_exp');return;}
    if(r.ok||r.status===204){
      console.log('✅ GCal event deleted:', gid);
    } else {
      console.error('GCal delete failed:',r.status);
    }
  }catch(e){console.error('delGCalEv error:',e);}
}

function getEvDurMins(){
  const sel=document.getElementById('ev-dur');
  return sel?parseInt(sel.value)||60:60;
}

function addEv(){
  const dateIn=document.getElementById('ev-date');
  const h=document.getElementById('ev-h').value;
  const m=document.getElementById('ev-m').value;
  const ap=document.getElementById('ev-ap').value;
  const durMins=getEvDurMins();
  const titleIn=document.getElementById('ev-title');
  const evTitle=titleIn.value.trim();
  if(!evTitle){flashInvalid(titleIn);return;}
  const targetDate=dateIn.value||dk(activeDate);
  const tdi=weekDays.findIndex(d=>dk(d)===targetDate);
  if(tdi<0){
    // Date outside current week - save to that week's Firebase doc
    if(db){
      const targetWeekDays=getWeekDays(new Date(targetDate+'T12:00:00'));
      const targetWid='week_'+dk(targetWeekDays[0]);
      userCol().doc(targetWid).get().then(snap=>{
        const data=snap.exists?snap.data():{tasks:[],focus:{},events:{},workout:{},gastos:{}};
        const targetTdi=targetWeekDays.findIndex(d=>dk(d)===targetDate);
        if(!data.events)data.events={};
        if(!data.events[targetTdi])data.events[targetTdi]=[];
        data.events[targetTdi].push({time:h+':'+m+' '+ap,title:evTitle,durMins});
        return userCol().doc(targetWid).set(data);
      }).catch(e=>{console.error('Error saving event to other week:',e);showToast(isEn()?'Could not save event, try again':'No se pudo guardar el evento, intenta de nuevo');});
    }
    if(gcalToken)createGCalEv(evTitle,targetDate,h,m,ap,durMins);
    titleIn.value='';
    const evLng=isEn();
    const td=new Date(targetDate+'T12:00:00');
    document.getElementById('gcal-note').textContent=(evLng?'Saved for ':'Guardado para el ')+DIAS[td.getDay()]+' '+td.getDate();
    setTimeout(()=>document.getElementById('gcal-note').textContent='',3000);
    return;
  }
  if(!weekData.events)weekData.events={};
  if(!weekData.events[tdi])weekData.events[tdi]=[];
  weekData.events[tdi].push({time:h+':'+m+' '+ap,title:evTitle,durMins});
  saveDB();
  if(gcalToken&&targetDate){
    createGCalEv(evTitle,targetDate,h,m,ap,durMins);
  }
  const di=dayIdx();renderEvts(di);buildNav();buildOv();titleIn.value='';
  if(tdi!==di){
    document.getElementById('gcal-note').textContent=(isEn()?'Saved for ':'Guardado para el ')+DIAS[weekDays[tdi].getDay()]+' '+weekDays[tdi].getDate();
    setTimeout(()=>document.getElementById('gcal-note').textContent='',3000);
  }
}

function setSelectVal(id, val){
  const sel=document.getElementById(id);
  if(!sel)return;
  // If empty, reset to blank option
  if(!val){sel.value='';return;}
  // Try direct match first
  if([...sel.options].some(o=>o.value===val)){sel.value=val;return;}
  // Try translated match (ES->EN or EN->ES)
  const mapped=WORKOUT_MAP[val]||Object.keys(WORKOUT_MAP).find(k=>WORKOUT_MAP[k]===val);
  const hmapped=HABITO_MAP[val]||Object.keys(HABITO_MAP).find(k=>HABITO_MAP[k]===val);
  const alt=mapped||hmapped;
  if(alt&&[...sel.options].some(o=>o.value===alt)){sel.value=alt;}
  else sel.value=''; // Not found - reset to blank
  // Sync SmartSelect input
  const ssEl=document.getElementById(id+'_ss');
  if(ssEl)ssEl.value=sel.value;
}
function renderWo(di){
  const w=dayWo(di);
  setSelectVal('wo1',w.wo1);setSelectVal('wo2',w.wo2);
  setSelectVal('ha1',w.ha1);setSelectVal('ha2',w.ha2);
}
function saveWorkout(){
  const di=dayIdx();if(!weekData.workout)weekData.workout={};
  const _v=id=>{const ss=document.getElementById(id+'_ss');return ss?ss.value:(document.getElementById(id)?.value||'');};
  weekData.workout[di]={wo1:_v('wo1'),wo2:_v('wo2'),ha1:_v('ha1'),ha2:_v('ha2')};
  saveDB();buildOv();
}

