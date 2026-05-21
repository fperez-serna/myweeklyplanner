// ── FIREBASE ───────────────────────────────
function initFirebase(){
  const cfg={apiKey:"AIzaSyBd-3kY7E_fOfhwrCP91I-SohUfBz4hkeo",authDomain:"mi-dashboard-25d4c.firebaseapp.com",projectId:"mi-dashboard-25d4c",storageBucket:"mi-dashboard-25d4c.firebasestorage.app",messagingSenderId:"768734489364",appId:"1:768734489364:web:65633f976f94575d9fb001"};
  firebase.initializeApp(cfg);
  auth=firebase.auth();
  db=firebase.firestore();
  // Initialize Functions with correct region
  if(firebase.functions){
    window.fbFunctions=firebase.app().functions('us-central1');
  }
}

async function saveDB(){
  if(!db)return;
  // Safety: only skip if weekData is null/undefined (not just empty)
  if(weekData===null||weekData===undefined){console.warn('saveDB: skipped null data');return;}
  try{await userCol().doc(wid()).set(weekData);showSync();}
  catch(e){console.error('Save error:',e);}
}

let _shSaving=false;
async function saveShoppingDB(){
  if(!db)return;
  // Safety: don't save if shoppingItems is empty
  const hasItems=Object.values(shoppingItems||{}).some(arr=>(arr||[]).length>0);
  const hasKeys=Object.keys(shoppingItems||{}).length>0;
  if(!hasKeys){console.warn('saveShoppingDB: skipped empty data');_shSaving=false;return;}
  _shSaving=true;
  try{await userCol().doc('shopping').set({cats:shoppingItems});}
  catch(e){console.error('Shopping save:',e);}
  setTimeout(()=>{_shSaving=false;},1500);
}

async function loadShoppingDB(){
  if(!db)return;
  try{
    const snap=await userCol().doc('shopping').get();
    const cats=setupCfg.shopCats||DEFAULT_SHOP;
    cats.forEach((_,i)=>{if(!shoppingItems['cat'+i])shoppingItems['cat'+i]=[];});
    if(snap.exists){
      const data=snap.data();
      if(data.cats){
        Object.keys(data.cats).forEach(k=>{shoppingItems[k]=data.cats[k]||[];});
      }
      // Migrate old keys
      const oldMap={super:'cat0',casa:'cat1',pers:'cat2',mama:'cat3',neg:'cat4',supermercado:'cat0'};
      Object.keys(oldMap).forEach(old=>{
        if(shoppingItems[old]&&shoppingItems[old].length){
          shoppingItems[oldMap[old]]=[...(shoppingItems[oldMap[old]]||[]),...shoppingItems[old]];
          delete shoppingItems[old];
        }
      });
      // Clear bought if new week
      const lastWeek=localStorage.getItem('fp_last_shopping_week');
      const thisWeek=wid();
      if(lastWeek&&lastWeek!==thisWeek){
        Object.keys(shoppingItems).forEach(k=>{
          shoppingItems[k]=(shoppingItems[k]||[]).filter(i=>!i.done);
        });
      }
      localStorage.setItem('fp_last_shopping_week',thisWeek);
    }
  }catch(e){console.log('Shopping fresh');}
}

function subscribeShoppingDB(){
  if(!db)return;
  userCol().doc('shopping').onSnapshot(snap=>{
    try{
      if(_shSaving)return;
      if(snap.exists){
        const data=snap.data();
        const oldMap={super:'cat0',casa:'cat1',pers:'cat2',mama:'cat3',neg:'cat4',supermercado:'cat0'};
        Object.keys(data.cats||{}).forEach(k=>{
          shoppingItems[oldMap[k]||k]=data.cats[k]||[];
        });
        renderSh();
      }
    }catch(e){console.error('subscribeShoppingDB handler error:',e);}
  });
}

let unsubConfig=null;

function subscribeConfig(){
  if(unsubConfig)unsubConfig();
  if(!db)return;
  unsubConfig=userCol().doc('config').onSnapshot(snap=>{
    try{
      if(snap.exists){
        const remoteCfg=snap.data().cfg;
        if(remoteCfg){
          setupCfg={...setupCfg,...remoteCfg};
          localStorage.setItem('wp_config',JSON.stringify(setupCfg));
          applyConfig(setupCfg);
        }
      }
    }catch(e){console.error('subscribeConfig handler error:',e);}
  });
}

function subscribeDB(){
  if(unsub)unsub();
  if(!db)return;
  unsub=userCol().doc(wid()).onSnapshot(async snap=>{
    try{
      if(snap.exists){
        weekData=snap.data();
        await loadPendingTasks();
        renderDay();
      }
    }catch(e){console.error('onSnapshot week handler error:',e);}
  });
}

// ── PERSISTENT TASKS ──────────────────────
let pendingTasks=[];

async function loadPendingTasks(){
  if(!db)return;
  try{
    const snap=await userCol().doc('pending_tasks').get();
    if(snap.exists){
      pendingTasks=(snap.data().tasks||[]).filter(t=>!t.doneDate&&!t.deletedDate);
    }
  }catch(e){console.log('No pending tasks');}
}

async function savePendingTasks(){
  if(!db)return;
  if(!pendingTasks){console.warn('savePendingTasks: skipped null data');return;}
  try{await userCol().doc('pending_tasks').set({tasks:pendingTasks});}
  catch(e){console.error('Pending save:',e);}
}

function addPendingTask(id, text, dateStr){
  pendingTasks=pendingTasks.filter(t=>t.id!==id);
  pendingTasks.push({id, text, addedDate:dateStr});
  savePendingTasks();
}

function resolvePendingTask(id, deleted=false){
  const pt=pendingTasks.find(t=>t.id===id);
  if(pt){
    if(deleted){
      pt.deleted=true;
    } else {
      pt.done=true;
      pt.doneDate=dk(activeDate);
    }
  }
  savePendingTasks();
}

async function loadDB(){
  if(!db)return;
  try{
    const snap=await userCol().doc(wid()).get();
    if(snap.exists)weekData=snap.data();
  }catch(e){console.log('Fresh start');}
}

