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

// ── luna ─────────────────────────────────

const _GUIA_LUNA = {
  'Luna nueva':        { arquetipo: 'La Hechicera',  significado: 'Fin de un ciclo, comienzo de otro. Momento para retirarte al interior y sentir sin producir.', ritual: 'diario, meditación, baño con sales, descansar sin culpa' },
  'Luna creciente':    { arquetipo: 'La Doncella',   significado: 'Después de la quietud llega la renovación. Momento ideal para sembrar intenciones e iniciar proyectos.', ritual: 'escribir objetivos, comenzar nuevos hábitos, caminar en la naturaleza' },
  'Cuarto creciente':  { arquetipo: 'La Doncella',   significado: 'La energía sigue creciendo. Buen momento para dar forma a los proyectos que iniciaste y avanzar con determinación.', ritual: 'organizar metas, conectar con lo que quieres construir' },
  'Gibosa creciente':  { arquetipo: 'La Madre',      significado: 'La energía alcanza su plenitud. La Madre crea, cuida, enseña y comparte — más allá de la maternidad biológica.', ritual: 'reuniones con amigas, crear arte, expresar gratitud, conectar' },
  'Luna llena':        { arquetipo: 'La Madre',      significado: 'Máxima expansión. Momento para celebrar, crear, convivir y compartir lo que llevas cultivando.', ritual: 'círculos de luna, danza, música, agradecer lo que ha florecido' },
  'Gibosa menguante':  { arquetipo: 'La Sabia',      significado: 'La energía empieza a dirigirse hacia adentro. Momento de preguntarte: ¿qué quiero seguir cultivando?', ritual: 'limpiar espacios, ordenar, escribir lo que deseas soltar' },
  'Cuarto menguante':  { arquetipo: 'La Sabia',      significado: 'Tiempo de soltar lo que ya cumplió su ciclo. La Sabia no se aferra — sabe que dejar ir es parte del crecimiento.', ritual: 'ordenar la casa, cerrar ciclos, perdonar, compostar' },
  'Luna menguante':    { arquetipo: 'La Sabia',      significado: 'La Luna se acerca a su oscuridad. Prepárate para el descanso y la renovación que viene.', ritual: 'meditación, descanso, baño ritual, agradecer el ciclo que termina' },
};

function lunaFase() {
  const CICLO = 29.53058867;
  const REF = new Date('2025-01-29T12:36:00Z').getTime();
  const p = ((((Date.now() - REF) / 86400000) % CICLO) + CICLO) % CICLO;
  if (p < 1.85)  return { icon: '🌑', nombre: 'Luna nueva' };
  if (p < 7.38)  return { icon: '🌒', nombre: 'Luna creciente' };
  if (p < 9.22)  return { icon: '🌓', nombre: 'Cuarto creciente' };
  if (p < 14.76) return { icon: '🌔', nombre: 'Gibosa creciente' };
  if (p < 16.61) return { icon: '🌕', nombre: 'Luna llena' };
  if (p < 22.15) return { icon: '🌖', nombre: 'Gibosa menguante' };
  if (p < 23.99) return { icon: '🌗', nombre: 'Cuarto menguante' };
  return          { icon: '🌘', nombre: 'Luna menguante' };
}

// ── ciclo ────────────────────────────────

function calcularCiclo(ultimoInicio, duracionPromedio) {
  const dur = duracionPromedio || 28;
  const inicio = new Date(ultimoInicio + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diaCiclo = Math.floor((hoy - inicio) / 86400000) + 1;
  let fase;
  if      (diaCiclo <= 5)   fase = 'Menstrual';
  else if (diaCiclo <= 13)  fase = 'Folicular';
  else if (diaCiclo <= 16)  fase = 'Ovulación';
  else if (diaCiclo <= 23)  fase = 'Lútea Temprana';
  else if (diaCiclo <= dur) fase = 'Lútea Tardía';
  else                      fase = 'Lútea Tardía';
  return { diaCiclo, fase };
}

const _GUIA_CICLO = {
  'Menstrual': {
    kw:       'descanso · hierro · restauración',
    energia:  'Energía baja y hacia adentro. Tu cuerpo está liberando y renovando. No es flojera — es biología.',
    cuerpo:   'El útero se contrae, los niveles de estrógeno y progesterona están en su punto más bajo. Máxima sensibilidad al dolor y al estrés.',
    entreno:  'Yoga suave, caminata, movilidad, stretching. Nada de HIIT ni cargas máximas.',
    nutri:    'Hierro (carne roja, lentejas, espinaca), proteína, omega-3, vitamina C para absorber hierro. Comida caliente y cocida.',
    hacer:    'Descansar sin culpa, introspección, ritual de cuidado propio, delegar lo que puedas.',
    evitar:   'Presión por productividad, ejercicio intenso, cafeína en exceso, azúcar refinada.',
  },
  'Folicular': {
    kw:       'energía nueva · creatividad · inicio',
    energia:  'El estrógeno sube progresivamente. Claridad mental, optimismo, ganas de hacer. Mejor momento para aprender cosas nuevas.',
    cuerpo:   'Los folículos crecen, el endometrio se reconstruye. Aumento de dopamina y serotonina — buen humor natural.',
    entreno:  'Gym, fuerza, HIIT, cardio. Tu cuerpo responde muy bien al entrenamiento en esta fase.',
    nutri:    'Proteína para construir músculo, verduras crucíferas (brócoli, coliflor) para metabolizar estrógeno, carbos complejos.',
    hacer:    'Iniciar proyectos, planear la semana, tomar decisiones, socializar, probar cosas nuevas.',
    evitar:   'Sobrecargarte solo porque tienes energía — sigue siendo importante descansar bien.',
  },
  'Ovulación': {
    kw:       'pico de energía · conexión · fuerza',
    energia:  'Pico hormonal: estrógeno y testosterona en su máximo. Energía, atractivo, elocuencia y confianza en su punto más alto.',
    cuerpo:   'El óvulo se libera. Tu cerebro procesa lenguaje más rápido, tienes más fuerza física y mayor tolerancia al dolor.',
    entreno:  'Tu momento de máximo rendimiento. Levantamientos pesados, HIIT intenso, clases de alta demanda. Aprovéchalo.',
    nutri:    'Antioxidantes (berries, vegetales de color), zinc, fibra. Hidratación extra.',
    hacer:    'Presentaciones, conversaciones difíciles, trabajo en equipo, visibilidad, citas importantes.',
    evitar:   'Aislarte — tu energía social está en su mejor momento.',
  },
  'Lútea Temprana': {
    kw:       'enfoque · orden · profundidad',
    energia:  'La progesterona sube. Energía más hacia adentro, pero aún estable. Ideal para trabajo profundo y atención a los detalles.',
    cuerpo:   'La temperatura corporal sube ~0.5°C. Metabolismo más acelerado — puedes sentir más hambre. El cerebro en modo organización y cierre.',
    entreno:  'Fuerza moderada, yoga, natación, pilates. El cuerpo sigue respondiendo bien pero prefiere consistencia sobre intensidad.',
    nutri:    'Magnesio (reduce síntomas PMS), proteína, carbos complejos. Chocolate negro si hay antojos.',
    hacer:    'Completar proyectos, organizar, trabajo profundo individual, cerrar pendientes.',
    evitar:   'Iniciar demasiadas cosas nuevas — esta fase pide terminar, no empezar.',
  },
  'Lútea Tardía': {
    kw:       'soltar · cuidado · preparación',
    energia:  'Estrógeno y progesterona bajan. Puede haber sensibilidad emocional, fatiga o niebla mental. Tu sistema nervioso pide menos estímulos.',
    cuerpo:   'El cuerpo prepara la menstruación. Posibles síntomas PMS: retención de líquidos, sensibilidad en senos, cambios de humor.',
    entreno:  'Movimiento suave: caminata, yoga restaurativo, stretching. Escucha a tu cuerpo — si pide descanso, descansa.',
    nutri:    'Magnesio, vitamina B6, calcio. Reduce sodio y cafeína para minimizar retención. Comida cálida y reconfortante.',
    hacer:    'Ritual de cierre de semana, reflexión, limpiar espacios, reducir agenda social.',
    evitar:   'Tomar decisiones grandes, compararte, sobrecargarte de compromisos.',
  },
};

function cicloKeywords(fase) {
  return (_GUIA_CICLO[fase] || {}).kw || '';
}

// ── main render ──────────────────────────

async function renderBotHome() {
  const now = new Date();
  const hour = now.getHours();
  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const nombre = setupCfg?.name ? setupCfg.name.split(' ')[0] : '';

  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('bot-greeting').textContent = `${saludo}${nombre ? ', ' + nombre : ''}`;
  document.getElementById('bot-date').textContent = `${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]}`;

  const di = dayIdx();
  const wo = dayWo(di >= 0 ? di : 0);

  // Ciclo — doc solo tiene ultimoInicio y duracionPromedio, fase se calcula
  let cicloFase = '';
  try {
    const cicloDoc = await userCol().doc('ciclo').get();
    if (cicloDoc.exists) {
      const c = cicloDoc.data();
      if (c.ultimoInicio) {
        const { diaCiclo, fase } = calcularCiclo(c.ultimoInicio, c.duracionPromedio);
        cicloFase = fase;
        document.getElementById('bot-meta').textContent = `Día ${diaCiclo} del ciclo · ${fase}`;
        const kw = cicloKeywords(fase);
        const kwEl = document.getElementById('bot-ciclo-kw');
        if (kwEl && kw) kwEl.textContent = kw;
      }
    }
  } catch(e) { console.warn('ciclo:', e); }

  renderLuna();
  renderDynamicCard(cicloFase, wo.wo1 || '', wo.wo2 || '', hour);
  await renderSemanaPerfecta();
  renderCalStats();
  renderFinStats();
}

// ── secciones ────────────────────────────

function renderLuna() {
  const el = document.getElementById('bot-luna-row');
  if (!el) return;
  const luna = lunaFase();
  const guia = _GUIA_LUNA[luna.nombre] || {};
  el.innerHTML = `
    <span style="font-size:20px;line-height:1;flex-shrink:0;">${luna.icon}</span>
    <div style="flex:1;min-width:0;">
      <div style="font-size:12px;font-weight:600;color:var(--text);">${luna.nombre}${guia.arquetipo ? ' · <span style="font-weight:400;">' + guia.arquetipo + '</span>' : ''}</div>
      <div style="font-size:11px;color:var(--text2);margin-top:2px;line-height:1.4;">${guia.significado || ''}</div>
      ${guia.ritual ? `<div style="font-size:10px;color:var(--text3);margin-top:3px;">Ritual: ${guia.ritual}</div>` : ''}
    </div>
  `;
}

async function renderSemanaPerfecta() {
  const el = document.getElementById('bot-microacciones');
  if (!el) return;

  let semana = null;
  try {
    const doc = await userCol().doc('semana_perfecta').get();
    if (doc.exists) semana = doc.data();
  } catch(e) { console.warn('semana_perfecta:', e); }

  if (!semana || !semana.metaAncla) {
    el.innerHTML = `<div style="font-size:12px;color:var(--text3);padding:4px 0;">Sin Semana Perfecta activa esta semana.</div>`;
    return;
  }

  const ancla = semana.metaAncla?.nombre || semana.metaAncla || '';
  const secundarias = (semana.metasSecundarias || []).map(m => m.nombre || m);
  const semilla     = (semana.metasSemilla || []).map(m => m.nombre || m);
  const intencion   = semana.intencionSemanal || '';

  el.innerHTML = `
    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Semana Perfecta</div>
    ${intencion ? `<div style="font-size:12px;font-style:italic;color:var(--text2);margin-bottom:8px;line-height:1.4;">"${intencion}"</div>` : ''}
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;background:var(--mauve);border-radius:8px;">
        <span style="font-size:11px;color:rgba(255,255,255,.7);white-space:nowrap;padding-top:1px;">Ancla</span>
        <span style="font-size:12px;color:#fff;font-weight:600;flex:1;line-height:1.4;">${ancla}</span>
      </div>
      ${secundarias.map(n => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 8px;background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;">
          <span style="font-size:10px;color:var(--text3);white-space:nowrap;padding-top:2px;">2ª</span>
          <span style="font-size:12px;color:var(--text);flex:1;line-height:1.4;">${n}</span>
        </div>
      `).join('')}
      ${semilla.map(n => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:4px 8px;border-radius:8px;">
          <span style="font-size:10px;color:var(--text3);white-space:nowrap;padding-top:2px;">·</span>
          <span style="font-size:11px;color:var(--text2);flex:1;line-height:1.4;">${n}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDynamicCard(fase, wo1, wo2, hour) {
  const card = document.getElementById('bot-dynamic-card');
  const guia = _GUIA_CICLO[fase];

  if (guia) {
    // Reporte completo del ciclo
    const woHoy = [wo1, wo2].filter(Boolean).join(' + ');
    const entrenoBadge = woHoy
      ? `<div style="margin-top:8px;padding:5px 8px;background:var(--bg);border-radius:6px;font-size:11px;color:var(--text2);">🏋️ Hoy: <strong style="color:var(--text);">${woHoy}</strong></div>`
      : '';
    card.innerHTML = `
      <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Tu cuerpo hoy</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.55;margin-bottom:8px;">${guia.energia}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <div style="padding:7px 8px;background:var(--bg);border-radius:8px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Entreno</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${guia.entreno}</div>
        </div>
        <div style="padding:7px 8px;background:var(--bg);border-radius:8px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Nutrición</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${guia.nutri}</div>
        </div>
        <div style="padding:7px 8px;background:var(--bg);border-radius:8px;">
          <div style="font-size:9px;color:var(--mauve);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Haz esto</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${guia.hacer}</div>
        </div>
        <div style="padding:7px 8px;background:var(--bg);border-radius:8px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Evita</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${guia.evitar}</div>
        </div>
      </div>
      ${entrenoBadge}
    `;
  } else {
    // Sin ciclo: muestra info de entreno
    const woStr = [wo1, wo2].filter(Boolean).join(' + ');
    const titulo = woStr ? `Hoy: ${woStr}` : 'Sin entrenamiento planificado hoy';
    const subtitulo = woStr
      ? (hour < 12 ? 'Carbos + proteína antes del entreno.'
        : hour < 17 ? '¿Ya entrenaste? Proteína en los próximos 45 min.'
        : 'Cena ligera después del entreno nocturno.')
      : 'Dile al asistente qué vas a hacer para actualizar el planner.';
    card.innerHTML = `
      <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">${titulo}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.5;">${subtitulo}</div>
    `;
  }
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
