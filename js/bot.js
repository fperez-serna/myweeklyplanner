// === BOT DASHBOARD ===

function openBotDashboard() {
  document.getElementById('bot-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderBotHome();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeBotDashboard() {
  document.getElementById('bot-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function openBotModule(mod) {
  showToast('Próximamente: ' + { sp: 'Semana Perfecta', cuerpo: 'Mi Cuerpo', hogar: 'Mi Hogar', fin: 'Finanzas' }[mod]);
}

// ── helpers ──────────────────────────────

function lunaFase() {
  const CICLO = 29.53058867;
  const REF = new Date('2025-01-29T12:36:00Z').getTime();
  const p = ((((Date.now() - REF) / 86400000) % CICLO) + CICLO) % CICLO;
  if (p < 1.85)  return { icon: '🌑', nombre: 'Luna nueva',        energia: 'intención · silencio · inicio' };
  if (p < 7.38)  return { icon: '🌒', nombre: 'Luna creciente',    energia: 'arranque · acción · visibilidad' };
  if (p < 9.22)  return { icon: '🌓', nombre: 'Cuarto creciente',  energia: 'decisión · movimiento · claridad' };
  if (p < 14.76) return { icon: '🌔', nombre: 'Gibosa creciente',  energia: 'refinamiento · ajuste · impulso' };
  if (p < 16.61) return { icon: '🌕', nombre: 'Luna llena',        energia: 'pico · revelación · celebración' };
  if (p < 22.15) return { icon: '🌖', nombre: 'Gibosa menguante',  energia: 'gratitud · compartir · cosecha' };
  if (p < 23.99) return { icon: '🌗', nombre: 'Cuarto menguante',  energia: 'soltar · integrar · revisión' };
  return          { icon: '🌘', nombre: 'Luna menguante',           energia: 'descanso · vaciado · preparación' };
}

function cicloKeywords(fase) {
  const f = (fase || '').toLowerCase();
  if (f.includes('menstrual') || f.includes('regla')) return 'descanso · hierro · restauración';
  if (f.includes('folicular'))                         return 'energía nueva · creatividad · inicio';
  if (f.includes('ovul'))                              return 'pico de energía · conexión · fuerza';
  if (f.includes('lútea') || f.includes('lutea'))      return 'enfoque · orden · profundidad';
  return '';
}

// ── main render ──────────────────────────

async function renderBotHome() {
  const now = new Date();
  const hour = now.getHours();
  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const nombre = setupCfg?.name ? setupCfg.name.split(' ')[0] : '';

  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('bot-greeting').textContent = `${saludo}${nombre ? ', ' + nombre : ''} 👋`;
  document.getElementById('bot-date').textContent = `${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]}`;

  const di = dayIdx();
  const wo = dayWo(di >= 0 ? di : 0);

  // Ciclo
  let cicloFase = '';
  try {
    const cicloDoc = await wpUser().doc('ciclo').get();
    if (cicloDoc.exists) {
      const c = cicloDoc.data();
      cicloFase = c.fase || '';
      if (c.dia_ciclo) {
        document.getElementById('bot-meta').textContent = `Día ${c.dia_ciclo} del ciclo · ${cicloFase}`;
        const kw = cicloKeywords(cicloFase);
        const kwEl = document.getElementById('bot-ciclo-kw');
        if (kwEl && kw) kwEl.textContent = kw;
      }
    }
  } catch(e) {}

  renderLuna();
  renderDynamicCard(cicloFase, wo.wo1 || '', wo.wo2 || '', hour);
  renderMicroacciones(di);
  renderCalStats();
  renderFinStats();
}

// ── secciones ────────────────────────────

function renderLuna() {
  const el = document.getElementById('bot-luna-row');
  if (!el) return;
  const luna = lunaFase();
  el.innerHTML = `
    <span style="font-size:18px;line-height:1;">${luna.icon}</span>
    <div style="flex:1;">
      <div style="font-size:12px;font-weight:500;color:var(--text);">${luna.nombre}</div>
      <div style="font-size:10px;color:var(--text3);">${luna.energia}</div>
    </div>
  `;
}

function renderMicroacciones(di) {
  const el = document.getElementById('bot-microacciones');
  if (!el) return;
  const idx = di >= 0 ? di : 0;
  const focus = focusForDay(idx);
  const wo    = dayWo(idx);

  const items = [];
  if (focus[1]) items.push({ text: focus[1], tipo: 'focus' });
  if (focus[2]) items.push({ text: focus[2], tipo: 'focus' });
  if (focus[3]) items.push({ text: focus[3], tipo: 'focus' });
  if (wo.ha1)   items.push({ text: wo.ha1,   tipo: 'habito' });
  if (wo.ha2)   items.push({ text: wo.ha2,   tipo: 'habito' });

  if (!items.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Microacciones de hoy</div>
    ${items.map(i => `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:0.5px solid var(--border);">
        <span style="font-size:13px;opacity:.7;">${i.tipo === 'focus' ? '◎' : '⚡'}</span>
        <span style="font-size:12px;color:var(--text);flex:1;line-height:1.4;">${i.text}</span>
      </div>
    `).join('')}
  `;
}

function renderDynamicCard(fase, wo1, wo2, hour) {
  const card = document.getElementById('bot-dynamic-card');
  const faseL = (fase || '').toLowerCase();
  let titulo, subtitulo;

  if (faseL.includes('menstrual') || faseL.includes('regla')) {
    titulo = 'Hoy toca descanso activo';
    subtitulo = 'Prioriza descanso, hierro y movilidad suave. No pasa nada si bajas la intensidad.';
  } else if (faseL.includes('ovul')) {
    titulo = 'Energía alta — buen día para fuerza';
    subtitulo = 'Tu energía probablemente está en su punto más alto. Aprovéchalo.';
  } else if (wo1 || wo2) {
    const woStr = [wo1, wo2].filter(Boolean).join(' + ');
    titulo = `Hoy: ${woStr}`;
    subtitulo = hour < 12
      ? 'Recuerda nutrición pre-entreno. Carbos + proteína antes.'
      : hour < 17
        ? '¿Ya entrenaste? Recuperación: proteína en los próximos 45 min.'
        : 'Noche de entrenamiento. Cena ligera después.';
  } else if (faseL.includes('lútea') || faseL.includes('lutea')) {
    titulo = 'Fase lútea — energía hacia adentro';
    subtitulo = 'Buen momento para trabajo profundo, orden y proyectos creativos.';
  } else {
    titulo = 'Sin entrenamiento planificado hoy';
    subtitulo = 'Dile al asistente qué vas a hacer para actualizar el planner.';
  }

  card.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">${titulo}</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.5;">${subtitulo}</div>
  `;
}

function renderCalStats() {
  document.getElementById('bot-cal-val').textContent = '—';
  document.getElementById('bot-cal-sub').textContent = 'Registra desde el asistente';
  document.getElementById('bot-cal-fill').style.width = '0%';
}

function renderFinStats() {
  try {
    const gastosData = typeof getGastosResumenMes === 'function' ? getGastosResumenMes() : null;
    if (gastosData && gastosData.total != null) {
      const pct = gastosData.presupuesto > 0 ? Math.min(100, Math.round(gastosData.total / gastosData.presupuesto * 100)) : 0;
      const fmt = n => '$' + Number(n).toLocaleString('es-MX', { maximumFractionDigits: 0 });
      document.getElementById('bot-fin-val').textContent = fmt(gastosData.total);
      document.getElementById('bot-fin-sub').textContent = `de ${fmt(gastosData.presupuesto)} · ${pct}%`;
      document.getElementById('bot-fin-fill').style.width = pct + '%';
      if (pct > 85) document.getElementById('bot-fin-fill').style.background = 'var(--mauve)';
    } else {
      document.getElementById('bot-fin-val').textContent = '—';
      document.getElementById('bot-fin-sub').textContent = 'Abre Presupuesto para ver';
    }
  } catch(e) {
    document.getElementById('bot-fin-val').textContent = '—';
    document.getElementById('bot-fin-sub').textContent = 'Ver en Presupuesto';
  }
}
