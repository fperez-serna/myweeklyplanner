// ── GOOGLE CALENDAR ────────────────────────
let _gcalInitRetries=0;
let _pendingGCalEvent=null;
let _gcalRefreshTimer=null;
function initGCal(){
  if(typeof google==='undefined'){
    if(_gcalInitRetries++ < 20){setTimeout(initGCal,500);}
    else{
      const note=document.getElementById('gcal-note');
      if(note)note.textContent='No se pudo cargar Google Calendar. Toca el botón para reconectar.';
    }
    return;
  }
  tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:GCAL_ID,
    scope:'https://www.googleapis.com/auth/calendar',
    prompt:'',
    callback:(res)=>{
      if(res.error){
        // Silent refresh failed — clear token so user can reconnect manually
        if(res.error==='interaction_required'||res.error==='consent_required'){
          gcalToken=null;
          localStorage.removeItem('gct');
          
          const btn=document.getElementById('gcal-btn');
          if(btn){btn.textContent='Conectar Google Calendar';btn.classList.remove('connected');}
        }
        return;
      }
      gcalToken=res.access_token;
      localStorage.setItem('gct',gcalToken);
      setGCalConnected();
      fetchGCal();
      // Reintentar evento pendiente si había uno cuando expiró el token
      if(_pendingGCalEvent){
        const p=_pendingGCalEvent;_pendingGCalEvent=null;
        createGCalEv(p.title,p.date,p.hour,p.min,p.ampm,p.durMins).then(id=>{
          if(id&&p.evObj){p.evObj.gcalId=id;saveDB();}
          if(id)showToast(isEn()?'Event synced to Google Calendar ✓':'Evento sincronizado con Google Calendar ✓');
        });
      }
      // Programar refresh silencioso usando expires_in de Google (no el reloj local)
      const expiresIn=(res.expires_in||3600)*1000;
      const refreshIn=Math.max(0,expiresIn-5*60*1000);
      if(_gcalRefreshTimer)clearTimeout(_gcalRefreshTimer);
      _gcalRefreshTimer=setTimeout(()=>tokenClient.requestAccessToken({prompt:''}),refreshIn);
    }
  });
  // Al cargar: usar token guardado — si expiró la API devolverá 401 y se refrescará
  const saved=localStorage.getItem('gct');
  if(saved){
    gcalToken=saved;
    setGCalConnected();
    fetchGCal();
  }
}

function setGCalConnected(){
  const btn=document.getElementById('gcal-btn');
  btn.textContent='✓ Google Calendar';btn.classList.add('connected');
  const dis=document.getElementById('gcal-disconnect-btn');
  if(dis)dis.style.display='block';
  const hint=document.getElementById('gcal-pin-hint');
  if(hint)hint.style.display='';
}

function disconnectGCal(){
  gcalToken=null;
  if(_gcalRefreshTimer){clearTimeout(_gcalRefreshTimer);_gcalRefreshTimer=null;}
  const hint=document.getElementById('gcal-pin-hint');
  if(hint)hint.style.display='none';
  localStorage.removeItem('gct');
  gcalEvts={};
  deletedGCalIds.clear();
  _pendingGCalEvent=null;
  const btn=document.getElementById('gcal-btn');
  btn.textContent=isEn()?'Connect Google Calendar':'Conectar Google Calendar';
  btn.classList.remove('connected');
  const dis=document.getElementById('gcal-disconnect-btn');
  if(dis)dis.style.display='none';
  renderEvts(dayIdx());buildOv();buildNav();
  document.getElementById('gcal-note').textContent=isEn()?'Disconnected':'Desconectado';
  setTimeout(()=>document.getElementById('gcal-note').textContent='',2000);
}

function handleGCal(){
  if(gcalToken){fetchGCal();}
  else if(tokenClient){tokenClient.requestAccessToken({prompt:'consent'});}
}

async function fetchGCal(){
  if(!gcalToken)return;
  try{
    const s=new Date(weekDays[0]);s.setHours(0,0,0,0);
    const e=new Date(weekDays[6]);e.setHours(23,59,59,999);
    const url='https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+s.toISOString()+'&timeMax='+e.toISOString()+'&singleEvents=true&orderBy=startTime';
    const r=await fetch(url,{headers:{Authorization:'Bearer '+gcalToken}});
    console.log('[GCal] fetch status:',r.status);
    if(r.status===401){gcalToken=null;localStorage.removeItem('gct');if(tokenClient)tokenClient.requestAccessToken({prompt:''});return;}
    if(!r.ok){const err=await r.json();console.error('[GCal] API error:',err);throw new Error('API '+r.status);}
    const data=await r.json();
    gcalEvts={};
    (data.items||[]).forEach(ev=>{
      const start=ev.start.dateTime||ev.start.date;
      const isAll=!ev.start.dateTime;
      let jd;
      if(isAll){const p=start.split('-');jd=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));}
      else{jd=new Date(start);}
      const key=dk(jd);
      const h=jd.getHours();const mn=String(jd.getMinutes()).padStart(2,'0');
      const ap=h>=12?'PM':'AM';const h12=h===0?12:h>12?h-12:h;
      const ts=isAll?'Todo el día':h12+':'+mn+' '+ap;
      let dur='';let mins=0;
      if(ev.start.dateTime&&ev.end&&ev.end.dateTime){
        mins=Math.round((new Date(ev.end.dateTime)-jd)/60000);
        if(mins>0){const h=Math.floor(mins/60);const m=mins%60;dur=h&&m?h+'h '+m+'m':h?h+'h':m+'m';}
      }
      if(!gcalEvts[key])gcalEvts[key]=[];
      if(!deletedGCalIds.has(ev.id)) gcalEvts[key].push({time:ts,title:ev.summary||'(sin título)',gcalId:ev.id,sort:jd.getTime(),durMins:mins});
    });
    Object.keys(gcalEvts).forEach(k=>gcalEvts[k].sort((a,b)=>a.sort-b.sort));
    renderEvts(dayIdx());buildOv();buildNav();
    document.getElementById('gcal-note').textContent='Google Calendar sincronizado ✓';
  }catch(e){
    console.error(e);
    gcalToken=null;
    localStorage.removeItem('gct');
    document.getElementById('gcal-note').textContent='Error al cargar — toca Desconectar e intenta de nuevo';
    const btn=document.getElementById('gcal-btn');
    if(btn){btn.textContent='Conectar Google Calendar';btn.classList.remove('connected');}
    const dis=document.getElementById('gcal-disconnect-btn');
    if(dis)dis.style.display='block';
  }
}

async function createGCalEv(title,date,hour,min,ampm,durMins=60,evObj=null){
  if(!gcalToken)return;
  let h=parseInt(hour);
  if(ampm==='PM'&&h!==12)h+=12;if(ampm==='AM'&&h===12)h=0;
  const s=new Date(date+'T'+String(h).padStart(2,'0')+':'+min+':00');
  const userTZ=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ev={summary:title,start:{dateTime:s.toISOString(),timeZone:userTZ},end:{dateTime:new Date(s.getTime()+durMins*60000).toISOString(),timeZone:userTZ}};
  try{
    const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',{
      method:'POST',
      headers:{Authorization:'Bearer '+gcalToken,'Content-Type':'application/json'},
      body:JSON.stringify(ev)
    });
    if(r.status===401){
      // Token expirado — guardar evento pendiente y refrescar token
      gcalToken=null;
      localStorage.removeItem('gct');
      _pendingGCalEvent={title,date,hour,min,ampm,durMins,evObj};
      if(tokenClient){
        tokenClient.requestAccessToken({prompt:''});
        showToast(isEn()?'Reconnecting — event will sync automatically':'Reconectando — el evento se sincronizará automáticamente');
      }
      return;
    }
    if(!r.ok){console.error('GCal create failed:',r.status,await r.text());return null;}
    const created=await r.json();
    setTimeout(()=>fetchGCal(),1000);
    return created.id||null;
  }catch(e){console.error('createGCalEv error:',e);return null;}
}

function pinGCalEvent(dayIndex, ev){
  if(!weekData.events)weekData.events={};
  if(!weekData.events[dayIndex])weekData.events[dayIndex]=[];
  // Si ya está anclado, desanclar
  const existing=weekData.events[dayIndex].findIndex(e=>e.pinned&&e.title.toLowerCase()===ev.title.toLowerCase());
  if(existing>=0){
    weekData.events[dayIndex].splice(existing,1);
    saveDB();buildOv();
    return;
  }
  // Anclar: copiar evento GCal a eventos locales con flag pinned
  weekData.events[dayIndex].push({time:ev.time,title:ev.title,durMins:ev.durMins||0,pinned:true,sort:ev.sort||null});
  saveDB();buildOv();
}

// ── WEATHER ────────────────────────────────
let _lastWeather=null;
function renderWeatherDesc(code,temp,pre,feelsLike){
  const en=isEn();
  const ds=en
    ?{0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Foggy',51:'Drizzle',61:'Light rain',63:'Moderate rain',65:'Heavy rain',80:'Showers',95:'Thunderstorm'}
    :{0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Neblina',51:'Llovizna',61:'Lluvia ligera',63:'Lluvia moderada',65:'Lluvia fuerte',80:'Chubascos',95:'Tormenta'};
  const wdesc=document.getElementById('wdesc');
  const fl=feelsLike!==undefined?feelsLike:(temp+4);
  if(wdesc)wdesc.textContent=(ds[code]||'Variable')+(en?' — feels like ':' — se siente ')+fl+'°C';
  const rain=pre>40||[51,53,55,61,63,65,80,81,95].includes(code);
  const rainEl=document.getElementById('rain');
  if(rainEl)rainEl.textContent=rain?(en?'Rain likely ('+pre+'%)':'Lluvia probable ('+pre+'%)'):(en?'No rain today':'Sin lluvia hoy');
}
async function fetchWeatherCoords(lat,lon){
  try{
    const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,apparent_temperature,precipitation_probability,weathercode&timezone='+encodeURIComponent(tz));
    const d=await r.json();
    const temp=Math.round(d.current.temperature_2m);
    const feelsLike=Math.round(d.current.apparent_temperature);
    const pre=d.current.precipitation_probability;
    const code=d.current.weathercode;
    _lastWeather={code,temp,pre,feelsLike};
    document.getElementById('temp').textContent=temp+'°C';
    renderWeatherDesc(code,temp,pre,feelsLike);
    fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json')
      .then(r=>r.json())
      .then(geo=>{
        const city=geo.address.city||geo.address.town||geo.address.village||geo.address.county||'';
        const state=geo.address.state||'';
        if(city)document.getElementById('location-lbl').textContent=city+(state?', '+state:'');
      }).catch(()=>{});
  }catch(e){
    const en=isEn();
    document.getElementById('temp').textContent='--°C';
    document.getElementById('wdesc').textContent=en?'Could not load weather':'No se pudo cargar el clima';
    document.getElementById('rain').textContent='';
  }
}

async function fetchWeather(){
  // Check if user already saved a manual city
  const savedLat=localStorage.getItem('weather_lat');
  const savedLon=localStorage.getItem('weather_lon');
  const savedCity=localStorage.getItem('weather_city');
  if(savedLat&&savedLon){
    if(savedCity)document.getElementById('location-lbl').textContent=savedCity;
    fetchWeatherCoords(parseFloat(savedLat),parseFloat(savedLon));
    return;
  }
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      pos=>fetchWeatherCoords(pos.coords.latitude,pos.coords.longitude),
      ()=>showLocationInput() // show manual input on denial
    );
  } else {
    showLocationInput();
  }
}

function resetLocation(){
  localStorage.removeItem('weather_lat');
  localStorage.removeItem('weather_lon');
  localStorage.removeItem('weather_city');
  showLocationInput();
  document.getElementById('location-input')?.focus();
}
function showLocationInput(){
  document.getElementById('location-lbl').textContent='¿Dónde estás?';
  document.getElementById('location-input-wrap').style.display='block';
  document.getElementById('temp').textContent='--°C';
  document.getElementById('wdesc').textContent='Ingresa tu ciudad para ver el clima';
  document.getElementById('rain').textContent='';
}

async function searchCity(){
  const q=document.getElementById('location-input').value.trim();
  if(!q)return;
  try{
    const r=await fetch('https://nominatim.openstreetmap.org/search?q='+encodeURIComponent(q)+'&format=json&limit=1');
    const data=await r.json();
    if(!data.length){
      document.getElementById('wdesc').textContent='Ciudad no encontrada, intenta de nuevo';
      return;
    }
    const lat=parseFloat(data[0].lat);
    const lon=parseFloat(data[0].lon);
    const city=data[0].display_name.split(',')[0];
    localStorage.setItem('weather_lat',lat);
    localStorage.setItem('weather_lon',lon);
    localStorage.setItem('weather_city',city);
    document.getElementById('location-input-wrap').style.display='none';
    document.getElementById('location-lbl').textContent=city;
    fetchWeatherCoords(lat,lon);
  }catch(e){
    document.getElementById('wdesc').textContent='Error buscando ciudad';
  }
}

// ── QUOTES ─────────────────────────────────
const QS_ES=[
  {t:"Tengo el defecto de tomar en serio las cosas que me importan.",a:"Alejandra Pizarnik"},
  {t:"Y sobre todo, no olvidar que la vida no tiene sentido — hay que dárselo.",a:"Alejandra Pizarnik"},
  {t:"No podemos dirigir el viento, pero sí podemos ajustar las velas.",a:"Dolly Parton"},
  {t:"Puedes encontrarte con muchas derrotas, pero no debes ser derrotada.",a:"Maya Angelou"},
  {t:"Haz cada día algo que te asuste.",a:"Eleanor Roosevelt"},
  {t:"El futuro pertenece a quienes creen en la belleza de sus sueños.",a:"Eleanor Roosevelt"},
  {t:"Una mujer que sabe lo que quiere ya tiene ventaja.",a:"Coco Chanel"},
  {t:"La disciplina es el puente entre metas y logros.",a:"Brené Brown"},
  {t:"Haz de cada día tu obra maestra.",a:"Maya Angelou"},
  {t:"Nada en la vida debe ser temido, solo comprendido.",a:"Marie Curie"},
  {t:"No hay barrera que detenga una mente libre.",a:"Virginia Woolf"},
  {t:"No nacemos valientes, nos volvemos valientes.",a:"Brené Brown"},
  {t:"Tu historia es tu poder.",a:"Chimamanda Ngozi Adichie"},
  {t:"El conocimiento es la base de toda fuerza.",a:"Hypatia"},
  {t:"Nunca limites tu mente.",a:"Rosalind Franklin"},
  {t:"La disciplina crea libertad.",a:"Jocko Willink"},
  {t:"El coraje cambia todo.",a:"Amelia Earhart"},
  {t:"No hay crecimiento sin incomodidad.",a:"Angela Duckworth"},
  {t:"La mente que se abre no vuelve atrás.",a:"Simone de Beauvoir"},
  {t:"La excelencia es un hábito diario.",a:"Toni Morrison"},
  {t:"La curiosidad impulsa el progreso.",a:"Ada Lovelace"},
  {t:"Ser tú misma es tu mayor ventaja.",a:"Clarice Lispector"},
  {t:"El silencio también es una forma de fuerza.",a:"Emily Dickinson"},
  {t:"La educación transforma destinos.",a:"Malala Yousafzai"},
  {t:"Pensar es el acto más revolucionario.",a:"Hannah Arendt"},
  {t:"La constancia construye resultados.",a:"Rita Levi-Montalcini"},
  {t:"El futuro pertenece a quienes se preparan.",a:"Katherine Johnson"},
  {t:"La disciplina es amor propio en acción.",a:"Carolina Herrera"},
  {t:"Somos lo que hacemos repetidamente.",a:"Aristóteles"},
  {t:"El que tiene un porqué puede soportar cualquier cómo.",a:"Friedrich Nietzsche"},
  {t:"El éxito es preparación encontrando oportunidad.",a:"Louis Pasteur"},
  {t:"La simplicidad es la máxima sofisticación.",a:"Leonardo da Vinci"},
  {t:"La disciplina supera al talento.",a:"Stephen Hawking"},
  {t:"La imaginación es más importante que el conocimiento.",a:"Albert Einstein"},
  {t:"El hábito forma el carácter.",a:"William James"},
  {t:"La persistencia es el camino del éxito.",a:"Charles Darwin"},
  {t:"La acción elimina la duda.",a:"Dale Carnegie"},
  {t:"Un objetivo sin plan es un deseo.",a:"Antoine de Saint-Exupéry"},
  {t:"La excelencia no es un acto, es un hábito.",a:"Aristóteles"},
  {t:"El progreso nace de la duda.",a:"René Descartes"},
  {t:"El conocimiento crece cuando se comparte.",a:"Carl Sagan"},
  {t:"La mente es todo.",a:"Buda"},
];
const QS_EN=[
  {t:"I have the defect of taking seriously the things that matter to me.",a:"Alejandra Pizarnik"},
  {t:"Above all, don't forget that life has no meaning — you have to give it one.",a:"Alejandra Pizarnik"},
  {t:"We can't direct the wind, but we can adjust the sails.",a:"Dolly Parton"},
  {t:"You may encounter many defeats, but you must not be defeated.",a:"Maya Angelou"},
  {t:"Do one thing every day that scares you.",a:"Eleanor Roosevelt"},
  {t:"The future belongs to those who believe in the beauty of their dreams.",a:"Eleanor Roosevelt"},
  {t:"A woman who knows what she wants already has an advantage.",a:"Coco Chanel"},
  {t:"Discipline is the bridge between goals and accomplishment.",a:"Brené Brown"},
  {t:"You are braver than you believe, stronger than you seem.",a:"A.A. Milne"},
  {t:"Take care of yourself first. You can't pour from an empty cup.",a:"Eleanor Brownn"},
  {t:"It's not about perfection. It's about effort.",a:"Jillian Michaels"},
  {t:"Success is not final, failure is not fatal.",a:"Winston Churchill"},
  {t:"I am not free of prejudice, but I work on it every day.",a:"Gloria Steinem"},
  {t:"Make each day your masterpiece.",a:"Maya Angelou"},
  {t:"Well-behaved women seldom make history.",a:"Laurel Thatcher Ulrich"},
];
function shuffleArr(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
let QS=shuffleArr([...QS_ES]);
let qcur=Math.floor(Math.random()*QS.length);
function showQ(q){
  const txt='\u201C'+q.t+'\u201D';
  const auth='\u2014 '+q.a;
  ['qt','qt-m'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=txt;});
  ['qa','qa-m'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=auth;});
}
function newQ(){qcur=(qcur+1)%QS.length;showQ(QS[qcur]);}
showQ(QS[qcur]);

