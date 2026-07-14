// === BOT DASHBOARD ===

function openBotDashboard() {
  document.getElementById('bot-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderBotHome();
}

function closeBotDashboard() {
  document.getElementById('bot-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function openBotModule(mod) {
  showToast('Próximamente: ' + { sp: 'Semana Perfecta', cuerpo: 'Mi Cuerpo', hogar: 'Mi Hogar', fin: 'Finanzas' }[mod]);
}

async function renderBotHome() {
  const now = new Date();
  const hour = now.getHours();
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const nombre = setupCfg?.name ? setupCfg.name.split(' ')[0] : '';

  // Greeting según hora
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('bot-greeting').textContent = `${saludo}${nombre ? ', ' + nombre : ''} 👋`;
  document.getElementById('bot-date').textContent = `${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]}`;

  // Workout de hoy
  const di = dayIdx();
  const wo = dayWo(di >= 0 ? di : 0);
  const workout1 = wo.wo1 || '';
  const workout2 = wo.wo2 || '';
  const tieneWorkout = workout1 || workout2;

  // Ciclo (si está disponible)
  let cicloMeta = '';
  try {
    const cicloDoc = await wpUser().doc('ciclo').get();
    if (cicloDoc.exists) {
      const c = cicloDoc.data();
      if (c.fase) cicloMeta = c.fase;
      if (c.dia_ciclo) {
        document.getElementById('bot-meta').textContent = `Día ${c.dia_ciclo} del ciclo · ${c.fase || ''}`;
      }
    }
  } catch(e) {}

  // Tarjeta dinámica según contexto
  renderDynamicCard(cicloMeta, workout1, workout2, hour);

  // Stats: calorías (desde bot Firebase si está disponible, si no placeholder)
  renderCalStats();

  // Stats: finanzas del mes
  renderFinStats();
}

function renderDynamicCard(fase, wo1, wo2, hour) {
  const card = document.getElementById('bot-dynamic-card');
  const faseL = (fase || '').toLowerCase();

  let emoji, titulo, subtitulo, color;

  if (faseL.includes('menstrual') || faseL.includes('mens')) {
    emoji = '❤️'; titulo = 'Hoy toca descanso activo';
    subtitulo = 'Prioriza descanso, hierro y movilidad suave. No pasa nada si bajas la intensidad hoy.';
    color = 'var(--mauve-l)';
  } else if (faseL.includes('ovula')) {
    emoji = '🔥'; titulo = 'Energía alta — buen día para fuerza';
    subtitulo = 'Tu energía probablemente está en su punto más alto. Aprovéchalo.';
    color = '#fff8e8';
  } else if (wo1 || wo2) {
    const woStr = [wo1, wo2].filter(Boolean).join(' + ');
    emoji = '💪'; titulo = `Hoy: ${woStr}`;
    subtitulo = hour < 12
      ? 'Recuerda nutrición pre-entreno. Carbos + proteína antes.'
      : hour < 17
        ? '¿Ya entrenaste? Recuperación: proteína en los próximos 45 min.'
        : 'Noche de entrenamiento. Cena ligera después.';
    color = 'var(--teal-l)';
  } else if (faseL.includes('lútea')) {
    emoji = '🌙'; titulo = 'Fase lútea — energía hacia adentro';
    subtitulo = 'Buen momento para trabajo profundo, orden y proyectos creativos.';
    color = 'var(--bg2)';
  } else {
    emoji = '✨'; titulo = 'Hoy no hay entrenamiento planificado';
    subtitulo = '¿Lo agregamos al planner? Dile al asistente qué vas a hacer.';
    color = 'var(--bg2)';
  }

  card.style.background = color;
  card.innerHTML = `
    <div style="font-size:22px;margin-bottom:6px;">${emoji}</div>
    <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;">${titulo}</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.5;">${subtitulo}</div>
  `;
}

function renderCalStats() {
  // Por ahora muestra placeholder — se conectará al Firebase del bot
  document.getElementById('bot-cal-val').textContent = '—';
  document.getElementById('bot-cal-sub').textContent = 'Registra desde el asistente';
  document.getElementById('bot-cal-fill').style.width = '0%';
}

function renderFinStats() {
  try {
    // Usa el presupuesto del mes actual si está disponible en weekData o budget
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
