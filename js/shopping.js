// ── SHOPPING ───────────────────────────────
function renderSh(){
  const shAll=document.getElementById('sh-all');
  if(!shAll)return;
  const cats=(setupCfg.shopCats&&setupCfg.shopCats.length)?setupCfg.shopCats:DEFAULT_SHOP;
  // Rebuild entire shopping DOM every time for reliability
  shAll.innerHTML='';
  cats.forEach((catName,idx)=>{
    const key='cat'+idx;
    if(!shoppingItems[key])shoppingItems[key]=[];
    const emoji=SHOP_EMOJI[catName]||'';
    const col=document.createElement('div');
    const items=shoppingItems[key]||[];
    let itemsHtml=items.map((item,i)=>`
      <div class="sh-item">
        <div class="cb${item.done?' done':''}" onclick="togShCat('${key}',${i})">
          <svg class="ck" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="white" stroke-width="1.5"/></svg>
        </div>
        <div class="sh-text${item.done?' bought':''}" contenteditable="true" spellcheck="false" 
          data-cat="${key}" data-idx="${i}" onblur="updateShCat(this)">${item.text}</div>
        <button class="dx" onclick="delShCat('${key}',${i})">×</button>
      </div>`).join('');
    col.innerHTML=`
      <div style="font-size:11px;font-weight:500;color:var(--mauve);margin-bottom:6px;">${emoji} ${catName}</div>
      <div id="sh-${key}">${itemsHtml}</div>
      <div class="add-row" style="margin-top:6px;">
        <input type="text" id="sh-${key}-in" placeholder="${isEn()?'Add...':'Agregar...'}" 
          onkeydown="if(event.key==='Enter')addShCat('${key}')">
        <button onclick="addShCat('${key}')">+</button>
      </div>`;
    shAll.appendChild(col);
  });
}

function togShCat(cat,i){
  if(!shoppingItems[cat])return;
  shoppingItems[cat][i].done=!shoppingItems[cat][i].done;
  shoppingItems[cat].sort((a,b)=>(a.done?1:0)-(b.done?1:0));
  saveShoppingDB();renderSh();
}
function delShCat(cat,i){
  if(!shoppingItems[cat])return;
  shoppingItems[cat]=shoppingItems[cat].filter((_,idx)=>idx!==i);
  saveShoppingDB();renderSh();
}
function addShCat(cat){
  const inp=document.getElementById('sh-'+cat+'-in');
  const v=inp.value.trim();if(!v){flashInvalid(inp);return;}
  if(!shoppingItems[cat])shoppingItems[cat]=[];
  shoppingItems[cat].push({text:v,done:false});
  saveShoppingDB();
  renderSh();
  // Refocus the input after render rebuilds DOM
  setTimeout(()=>{
    const newInp=document.getElementById('sh-'+cat+'-in');
    if(newInp){newInp.focus();newInp.scrollIntoView({behavior:'smooth',block:'center'});}
  },100);
}
function updateShCat(el){
  const cat=el.dataset.cat;
  const i=parseInt(el.dataset.idx);
  if(shoppingItems[cat]&&shoppingItems[cat][i]&&el.textContent.trim()){
    shoppingItems[cat][i].text=el.textContent.trim();
    saveShoppingDB();
  }
}
function clearCheckedSh(){
  Object.keys(shoppingItems).forEach(cat=>{
    shoppingItems[cat]=shoppingItems[cat].filter(item=>!item.done);
  });
  saveShoppingDB();renderSh();
}

const GASTO_COLORS = {
  'Restaurante':    {bg:'#e8f0ef',color:'#2c5f5c',icon:'utensils'},
  'Entretenimiento':{bg:'#f5e8eb',color:'#8f4652',icon:'film'},
  'Gasolina':       {bg:'#fef3e2',color:'#8a5a00',icon:'fuel'},
  'Suscripción':    {bg:'#e8f0fe',color:'#1a56a0',icon:'smartphone'},
  'Ejercicio':      {bg:'#e8f5e9',color:'#2e7d32',icon:'dumbbell'},
  'Pago a servicio':{bg:'#f3e5f5',color:'#6a1b9a',icon:'wrench'},
  'Negocio':        {bg:'#e8f0ef',color:'#2c5f5c',icon:'briefcase'},
  'Casa':           {bg:'#f7f0ec',color:'#414535',icon:'home'},
  'Préstamo':       {bg:'#fce4ec',color:'#880e4f',icon:'credit-card'},
  'Viaje':          {bg:'#e3f2fd',color:'#0d47a1',icon:'plane'},
  'Otro':           {bg:'#f0f0f0',color:'#666',icon:'tag'},
};

function gastosForDay(di){return (weekData.gastos&&weekData.gastos[di])||[];}

function renderGastos(di){
  const items=gastosForDay(di);
  const body=document.getElementById('gastos-body');
  if(!body)return;
  const title=document.getElementById('gastos-title');
  if(title&&weekDays[di]){
    
    title.textContent=isEn()
      ?'Daily expenses — '+DIAS[weekDays[di].getDay()]+' '+weekDays[di].getDate()
      :'Gastos del día — '+DS[di]+' '+weekDays[di].getDate();
  }
  body.innerHTML='';
  items.forEach((g,i)=>{
    const c=GASTO_COLORS[g.cat]||GASTO_COLORS['Otro'];
    const tr=document.createElement('tr');
    tr.innerHTML=
      '<td style="padding:6px;border-bottom:0.5px solid var(--border);"><span contenteditable="true" spellcheck="false" data-idx="'+i+'" onblur="updateGastoDesc(this)" style="color:var(--text);outline:none;">'+g.desc+'</span>'+(g.pagoCon?'<br><span style="font-size:9px;color:var(--text3);">'+g.pagoCon+'</span>':'')+'</td>'+
      '<td style="padding:6px;border-bottom:0.5px solid var(--border);"><span style="font-size:10px;padding:2px 7px;border-radius:99px;background:'+c.bg+';color:'+c.color+';cursor:pointer;" onclick="editGastoCat(this,'+i+')" title="'+(isEn()?'Click to edit':'Click para editar')+'">'+g.cat+'</span></td>'+
      '<td style="padding:6px;border-bottom:0.5px solid var(--border);text-align:right;"><span contenteditable="true" spellcheck="false" data-idx="'+i+'" onblur="updateGastoMonto(this)" style="color:var(--text);outline:none;">$'+g.monto.toLocaleString()+'</span></td>'+
      '<td style="padding:6px;border-bottom:0.5px solid var(--border);"><button style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;" onclick="delGasto('+i+')">×</button></td>';
    body.appendChild(tr);
  });
  renderGastosTotals(di);
}

function renderGastosTotals(di){
  let total=0;
  const bycat={};
  // Sum up to TODAY's index, not active day
  // Find today's index - if viewing current week use today, else use last day (di)
  const todayDi=weekDays.findIndex(d=>dk(d)===dk(today));
  const isCurrentWeek=todayDi>=0;
  const maxDi=isCurrentWeek?todayDi:6; // if past week show full week, current week show up to today
  for(let d=0;d<=maxDi;d++){
    gastosForDay(d).forEach(g=>{
      total+=g.monto;
      bycat[g.cat]=(bycat[g.cat]||0)+g.monto;
    });
  }
  const tel=document.getElementById('gastos-total');
  if(tel)tel.textContent='$'+total.toLocaleString();
  const lbl=document.getElementById('gastos-total-lbl');
  // Label: always Mon to today
  
  const monLabel=isEn()?'Mon':'Lun';
  if(lbl){
    if(maxDi===0)lbl.textContent='Total '+DS[weekDays[0].getDay()];
    else lbl.textContent='Total '+monLabel+'–'+DS[weekDays[maxDi].getDay()];
  }
  const rubros=document.getElementById('gastos-rubros');
  if(!rubros)return;
  rubros.innerHTML='';
  Object.entries(bycat).sort((a,b)=>b[1]-a[1]).forEach(([cat,amt])=>{
    const c=GASTO_COLORS[cat]||GASTO_COLORS['Otro'];
    const div=document.createElement('div');
    div.style.cssText='background:var(--bg2);border-radius:7px;padding:7px 10px;display:flex;justify-content:space-between;align-items:center;';
    div.innerHTML='<span style="font-size:11px;color:var(--text2);">'+cat+'</span>'+
      '<span style="font-size:12px;font-weight:500;color:var(--text);">$'+amt.toLocaleString()+'</span>';
    rubros.appendChild(div);
  });
}

function addGasto(){
  const desc=document.getElementById('gasto-desc').value.trim();
  const cat=document.getElementById('gasto-cat').value;
  const pagoCon=document.getElementById('gasto-pago')?.value||'Efectivo';
  const monto=parseFloat(document.getElementById('gasto-monto').value);
  if(!desc||!monto||monto<=0){
    const descEl=document.getElementById('gasto-desc');
    const montoEl=document.getElementById('gasto-monto');
    if(!desc)flashInvalid(descEl);
    if(!monto||monto<=0)flashInvalid(montoEl);
    return;
  }
  const di=dayIdx();
  if(!weekData.gastos)weekData.gastos={};
  if(!weekData.gastos[di])weekData.gastos[di]=[];
  weekData.gastos[di].push({desc,cat,monto,pagoCon});
  saveDB();renderGastos(di);
  document.getElementById('gasto-desc').value='';
  document.getElementById('gasto-monto').value='';
}

function delGasto(i){
  const di=dayIdx();
  if(weekData.gastos&&weekData.gastos[di]){
    weekData.gastos[di].splice(i,1);
    saveDB();renderGastos(di);
  }
}
function editGastoCat(span, idx){
  const di=dayIdx();
  const g=(weekData.gastos&&weekData.gastos[di])?weekData.gastos[di][idx]:null;
  if(!g)return;
  const cats=setupCfg.gastoCats||DEFAULT_GASTOS;
  const sel=document.createElement('select');
  sel.style.cssText='font-size:11px;padding:2px 4px;border-radius:6px;border:0.5px solid var(--border);background:var(--bg2);color:var(--text);';
  cats.forEach(c=>{
    const opt=document.createElement('option');
    opt.value=c;opt.textContent=c;
    if(c===g.cat)opt.selected=true;
    sel.appendChild(opt);
  });
  span.replaceWith(sel);
  sel.focus();
  const save=()=>{
    g.cat=sel.value;
    saveDB();
    renderGastos(di);
  };
  sel.onchange=save;
  sel.onblur=save;
}

function updateGastoDesc(el){
  const di=dayIdx();
  const i=parseInt(el.dataset.idx);
  if(weekData.gastos&&weekData.gastos[di]&&weekData.gastos[di][i]&&el.textContent.trim()){
    weekData.gastos[di][i].desc=el.textContent.trim();
    saveDB();
  }
}
function updateGastoMonto(el){
  const di=dayIdx();
  const i=parseInt(el.dataset.idx);
  const val=parseFloat(el.textContent.replace(/[$,]/g,''));
  if(weekData.gastos&&weekData.gastos[di]&&weekData.gastos[di][i]&&!isNaN(val)&&val>0){
    weekData.gastos[di][i].monto=val;
    saveDB();renderGastosTotals(di);
  }
}

// ── MINI CALENDAR ────────────────────────────
let calYear=today.getFullYear();
let calMonth=today.getMonth();

const CAL_DIAS_ES=['L','M','M','J','V','S','D'];
const CAL_DIAS_EN=['M','T','W','T','F','S','S'];
const CAL_MESES_ES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CAL_MESES_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
let CAL_DIAS=CAL_DIAS_ES;
let CAL_MESES=CAL_MESES_ES;

function buildCalendar(){
  const lbl=document.getElementById('cal-month-lbl');
  const body=document.getElementById('cal-body');
  if(!lbl||!body)return;
  lbl.textContent=CAL_MESES[calMonth]+' '+calYear;

  const firstDay=new Date(calYear,calMonth,1).getDay();
  const offset=firstDay===0?6:firstDay-1;
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const daysInPrev=new Date(calYear,calMonth,0).getDate();
  const todayStr=dk(today);
  const activeStr=dk(activeDate);

  let h='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;margin-bottom:2px;">';
  CAL_DIAS.forEach(d=>{h+='<div style="font-size:9px;color:var(--text3);font-weight:500;padding:2px 0;">'+d+'</div>';});
  h+='</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;">';

  // Prev month filler
  for(let i=offset-1;i>=0;i--){
    h+='<div style="font-size:11px;color:var(--border);padding:3px 0;">'+(daysInPrev-i)+'</div>';
  }

  // Current month
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isToday=dateStr===todayStr;
    const isActive=dateStr===activeStr;
    let st='font-size:11px;padding:3px 0;border-radius:6px;cursor:pointer;display:block;width:100%;';
    if(isActive)st+='background:var(--mauve);color:#fff;font-weight:500;';
    else if(isToday)st+='background:var(--mauve-l);color:var(--mauve-d);font-weight:500;';
    else st+='color:var(--text2);';
    h+='<div style="'+st+'" onclick="calGoTo('+calYear+','+calMonth+','+d+')">'+d+'</div>';
  }

  // Next month filler
  const total=offset+daysInMonth;
  const remaining=total%7===0?0:7-(total%7);
  for(let d=1;d<=remaining;d++){
    h+='<div style="font-size:11px;color:var(--border);padding:3px 0;">'+d+'</div>';
  }
  h+='</div>';
  body.innerHTML=h;
  // Also update mobile cal if exists
  const lblM=document.getElementById('cal-month-lbl-m');
  const bodyM=document.getElementById('cal-body-m');
  if(lblM)lblM.textContent=CAL_MESES[calMonth]+' '+calYear;
  if(bodyM)bodyM.innerHTML=h;
}

async function calGoTo(y,m,d){
  activeDate=new Date(y,m,d);
  weekDays=getWeekDays(activeDate);
  weekData={tasks:[],focus:{},focusDone:{},focusDeleted:{},events:{},workout:{},gastos:{}};
  if(document.getElementById('ev-date'))document.getElementById('ev-date').value=dk(activeDate);
  try{
    if(db){
      const snap=await userCol().doc(wid()).get();
      if(snap.exists)weekData=snap.data();
      await loadPendingTasks();
    }
  }catch(e){}
  renderDay();
}

function calPrevMonth(){
  calMonth--;
  if(calMonth<0){calMonth=11;calYear--;}
  buildCalendar();
}

function calNextMonth(){
  calMonth++;
  if(calMonth>11){calMonth=0;calYear++;}
  buildCalendar();
}

let calOpen=true;
function toggleCal(){
  calOpen=!calOpen;
  const body=document.getElementById('cal-body');
  const btn=document.getElementById('cal-toggle-btn');
  if(body)body.style.display=calOpen?'':'none';
  if(btn)btn.textContent=calOpen?'▴':'▾';
}

function initCalResponsive(){
  const isMobile=window.innerWidth<=600;
  const btn=document.getElementById('cal-toggle-btn');
  const body=document.getElementById('cal-body');
  if(btn)btn.style.display=isMobile?'block':'none';
  if(isMobile&&calOpen===true){
    calOpen=false;
    if(body)body.style.display='none';
    if(btn)btn.textContent='▾';
  }
}

window.addEventListener('resize',initCalResponsive);

