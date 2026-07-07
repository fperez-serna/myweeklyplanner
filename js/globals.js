// ── CONSTANTS ──────────────────────────────
const DIAS_ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_EN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DS_ES=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DS_EN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let DIAS=DIAS_ES;
let DS=DS_ES;
const MES_ES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MES_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
let MES=MES_ES;
const ICAL_URL='https://calendar.google.com/calendar/ical/f.perezserna%40gmail.com/private-00450f29f66ba6d8112c19e9435f65b5/basic.ics';
const WE={Tennis:'','E. Club':'',Swimming:'',Pilates:'',Gym:'',Yoga:'',Box:'','Free Diving':'',Climbing:'',Rest:'',Otro:''};
const HE={Meditar:'',Leer:'',Stretching:'',Escribir:'',Otro:''};
const DW={0:{wo1:'',wo2:'',ha1:'',ha2:''},1:{wo1:'',wo2:'',ha1:'',ha2:''},2:{wo1:'',wo2:'',ha1:'',ha2:''},3:{wo1:'',wo2:'',ha1:'',ha2:''},4:{wo1:'',wo2:'',ha1:'',ha2:''},5:{wo1:'',wo2:'',ha1:'',ha2:''},6:{wo1:'',wo2:'',ha1:'',ha2:''}};
const GCAL_ID='768734489364-vtacuutjbop0h19kj85qgoeodgd4dseq.apps.googleusercontent.com';

// ── FLAGS ──────────────────────────────────
let _suppressSSReset=false;

// ── CATEGORIES ─────────────────────────────
const CATS={personal:{label:'Personal',color:'#222'},familia:{label:'Familia',color:'#484848'},casa:{label:'Casa',color:'#6e6e6e'},trabajo:{label:'Trabajo',color:'#888'},social:{label:'Social',color:'#a0a0a0'},otro:{label:'Otro',color:'#b8b8b8'}};
let taskCatFilter='all';
let taskNewCat='';

// ── STATE ──────────────────────────────────
const today=new Date();today.setHours(0,0,0,0);
let activeDate=new Date(today);
let weekDays=getWeekDays(today);
let weekData={tasks:[],focus:{},focusDone:{},focusDeleted:{},events:{},workout:{}};
let gcalEvts={};
const deletedGCalIds=new Set(); // track locally deleted events so fetchGCal doesn't restore them
let gcalToken=null;
let shoppingItems={};
let _shoppingLoaded=false;
function initShoppingItems(){
  const cats=(setupCfg.shopCats&&setupCfg.shopCats.length)?setupCfg.shopCats:DEFAULT_SHOP;
  cats.forEach((cat,idx)=>{
    const key='cat'+idx;
    if(!shoppingItems[key])shoppingItems[key]=[];
  });
}
let tokenClient=null;
let db=null;
let auth=null;
let currentUser=null;
function userCol(){if(!db||!currentUser)throw new Error('Not authenticated');return db.collection('users').doc(currentUser.uid).collection('data');}
let unsub=null;

// ── HELPERS ────────────────────────────────
function dk(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function getWeekDays(ref){
  const d=new Date(ref);const diff=d.getDay()===0?-6:1-d.getDay();d.setDate(d.getDate()+diff);
  const days=[];for(let i=0;i<7;i++){const x=new Date(d);x.setDate(d.getDate()+i);days.push(x);}return days;
}
function wid(){return'week_'+dk(weekDays[0]);}
function emoji(n,m){if(!n)return'';const e=m[n];return e?e+' '+n:n;}
function dayIdx(){return weekDays.findIndex(d=>dk(d)===dk(activeDate));}
function showSync(){const s=document.getElementById('sync-badge');s.classList.add('show');setTimeout(()=>s.classList.remove('show'),2000);}

// ── TASKS LOGIC ────────────────────────────
function tasksForDay(di){
  const weekTasks=(weekData.tasks||[]).filter(t=>{
    if(t.addedOnDay>di)return false;
    if(t.deletedOnDay!==undefined&&t.deletedOnDay<=di)return false;
    if(t.doneOnDay!==undefined&&t.doneOnDay<di)return false;
    return true;
  });
  // Add undone tasks from previous weeks
  const currentWeekIds=new Set((weekData.tasks||[]).map(t=>t.id));
  const dayDate=weekDays[di];
  const carryTasks=pendingTasks
    .filter(p=>!currentWeekIds.has(p.id)&&p.addedDate<=dk(dayDate)&&!p.deleted&&!p.done)
    .map(p=>({id:p.id,text:p.text,addedOnDay:-1,fromPrevWeek:true,doneOnDay:p.done?0:undefined,...(p.cat?{cat:p.cat}:{})}));
  return [...carryTasks,...weekTasks];
}
function focusForDay(di){
  // Each day has its own independent focus - no carry forward
  const focus=weekData.focus||{};
  const f=focus[di]||focus[String(di)]||{};
  return {
    1: f[1]||f['1']||'',
    2: f[2]||f['2']||'',
    3: f[3]||f['3']||''
  };
}
function dayEvts(di){return((weekData.events||{})[di])||[];}
function dayWo(di){
  if(weekData.workout&&weekData.workout[di]!==undefined)return weekData.workout[di];
  return {wo1:'',wo2:'',ha1:'',ha2:''};
}

