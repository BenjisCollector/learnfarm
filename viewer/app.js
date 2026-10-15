// Open Farm viewer: polls a scene file and renders it as a pixel farm.
// Any agent that edits the scene JSON drives this view. No server code needed.
import { icon, ICON } from './pixel.js';
import { createMap } from './map.js';
import { createWeather } from './weather.js';

const SCENE_URL = new URLSearchParams(location.search).get('scene') || '../examples/farm.scene.json';
const ANIMAL_KINDS = new Set(['hen', 'cow', 'goat', 'sheep']);

const STR = {
  en: {
    overview: 'Overview', tap: 'Tap an area to explore', zones: 'zones', crops: 'crops', animals: 'animals',
    farm: 'Farm', weather: 'Weather', flows: 'Flows', day: 'Day', perDay: '/day', soFar: 'so far', in: 'IN', out: 'OUT',
    close: 'Close', inside: 'Inside', none: 'No inputs or outputs recorded for this area yet.',
    conditions: "Today's conditions", live: 'Live', offline: 'Offline', temp: 'Temperature', feels: 'Feels like',
    humidity: 'Humidity', dew: 'Dew point', wind: 'Wind', rain: 'Rain chance', source: 'Source',
    cond: { sunny: 'Sunny', cloudy: 'Cloudy', windy: 'Windy', rain: 'Rain', rainbow: 'After the rain' },
    line: { sunny: 'Clear skies over the fields.', cloudy: 'Grey skies, soft light on the crops.', windy: 'Strong wind, check the shade nets.', rain: 'Rain on the fields, irrigation paused.', rainbow: 'The rain has passed.' },
    lifetime: 'Watch the totals grow as the days pass.',
  },
  ar: {
    overview: 'نظرة عامة', tap: 'اضغط على منطقة لاستكشافها', zones: 'مناطق', crops: 'محاصيل', animals: 'حيوانات',
    farm: 'المزرعة', weather: 'الطقس', flows: 'المدخلات', day: 'اليوم', perDay: '/يوم', soFar: 'حتى الآن', in: 'داخل', out: 'خارج',
    close: 'إغلاق', inside: 'بداخلها', none: 'لا توجد مدخلات أو مخرجات مسجلة لهذه المنطقة بعد.',
    conditions: 'أحوال اليوم', live: 'مباشر', offline: 'غير متصل', temp: 'الحرارة', feels: 'الإحساس',
    humidity: 'الرطوبة', dew: 'نقطة الندى', wind: 'الرياح', rain: 'فرصة المطر', source: 'المصدر',
    cond: { sunny: 'مشمس', cloudy: 'غائم', windy: 'عاصف', rain: 'ممطر', rainbow: 'بعد المطر' },
    line: { sunny: 'سماء صافية فوق الحقول.', cloudy: 'سماء رمادية وضوء هادئ على المحاصيل.', windy: 'رياح قوية، تحقق من شبك التظليل.', rain: 'مطر على الحقول، الري متوقف.', rainbow: 'انتهى المطر.' },
    lifetime: 'شاهد المجاميع تكبر مع مرور الأيام.',
  },
};

const $ = (id) => document.getElementById(id);
const st = { scene: null, raw: '', lang: 'en', tab: 'farm', sel: null, day: null, playing: false, wxMode: null, online: true };
const map = createMap($('map'));
const wx = createWeather($('wx'));

const t = () => STR[st.lang];
const tx = (o) => (o && (o[st.lang] || o.en)) || '';
const fmt = (n) => new Intl.NumberFormat(st.lang === 'ar' ? 'ar-KW' : 'en', { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);
const ents = () => st.scene?.entities || [];
const day = () => st.day ?? st.scene?.clock?.day ?? 0;

async function poll() {
  try {
    const r = await fetch(SCENE_URL + '?t=' + Date.now(), { cache: 'no-store' });
    const raw = await r.text();
    st.online = r.ok;
    if (r.ok && raw !== st.raw) {
      st.raw = raw;
      st.scene = JSON.parse(raw);
      st.day = null; // a new scene from the agent resets the preview to its clock
      map.setScene(st.scene);
      render();
    }
  } catch { st.online = false; }
  document.querySelectorAll('.live').forEach(el => el.classList.toggle('off', !st.online));
}

function zoneMembers(id) {
  return ents().filter(e => e.id === id || e.props?.zone === id);
}

function flowRows(entsIn) {
  const ids = new Set(entsIn.map(e => e.id));
  return (st.scene.flows || []).filter(f => ids.has(f.entity)).map(f => `
    <div class="flow">
      <span><span class="tag ${f.direction}">${t()[f.direction]}</span>${tx(f.resource)}
        <div class="src">${fmt(f.per_day)} ${f.unit}${t().perDay} · ${f.source}</div></span>
      <b>${fmt(f.per_day * day())} ${f.unit}</b>
    </div>`).join('');
}

function renderHeader() {
  const s = st.scene;
  $('title').textContent = tx(s.title) || 'Open Farm';
  $('sub').innerHTML = '';
  $('sub').append(icon(ICON.pin, '#6f7a6c'));
  $('sub').insertAdjacentHTML('beforeend', `<span>${tx(s.location?.name)}</span><span class="chip-day">${t().day} ${fmt(day())}</span><span class="live"></span>`);
  $('lang').textContent = st.lang === 'en' ? 'ع' : 'EN';
  document.documentElement.lang = st.lang;
  document.documentElement.dir = st.lang === 'ar' ? 'rtl' : 'ltr';
}

function renderFarm() {
  const zones = ents().filter(e => e.props?.rect);
  $('tabs').innerHTML = [`<button data-z="" class="${st.sel ? '' : 'on'}">${t().overview}</button>`]
    .concat(zones.map(z => `<button data-z="${z.id}" class="${st.sel === z.id ? 'on' : ''}">${tx(z.name)}</button>`)).join('');
  $('labels').innerHTML = map.labels().map(l =>
    `<span class="label ${st.sel === l.id ? 'on' : ''}" style="left:${l.left}%;top:${l.top}%">${tx(l.name)}</span>`).join('');
  const info = $('info');
  if (!st.sel) {
    const crops = zones.filter(z => z.props.crop).length;
    const animals = ents().filter(e => ANIMAL_KINDS.has(e.kind)).reduce((n, e) => n + (e.props?.count || 1), 0);
    info.innerHTML = `<div class="row"><span id="hand"></span><div><h3>${t().tap}</h3>
      <p>${fmt(zones.length)} ${t().zones} · ${fmt(crops)} ${t().crops} · ${fmt(animals)} ${t().animals}</p></div></div>`;
    $('hand').append(icon(ICON.hand, '#2f5d3a', 3));
  } else {
    const z = ents().find(e => e.id === st.sel);
    const members = zoneMembers(st.sel);
    const herd = members.filter(e => ANIMAL_KINDS.has(e.kind)).map(e => `${fmt(e.props?.count || 1)} ${tx(e.name)}`).join(' · ');
    const rows = flowRows(members);
    info.innerHTML = `<div class="row"><div><h3>${tx(z?.name)}</h3>${herd ? `<p>${t().inside}: ${herd}</p>` : ''}</div>
      <button class="close px" id="close">${t().close}</button></div>
      <div style="margin-top:8px">${rows || `<p>${t().none}</p>`}</div>`;
    $('close').onclick = () => select(null);
  }
}

function spark(values, color) {
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 12; cv.className = 'spark';
  const c = cv.getContext('2d');
  c.fillStyle = color;
  values.forEach((v, i) => { const x = Math.round(i * 31 / (values.length - 1)); c.fillRect(x, 11 - Math.round(v * 10), 2, 1); });
  return cv;
}

function renderWeather() {
  const w = st.scene.weather || { condition: 'sunny', temp_c: 0, source: '' };
  const mode = st.wxMode || w.condition;
  wx.setMode(mode); wx.setWind(w.wind_kmh);
  $('wxloc').innerHTML = ''; $('wxloc').append(icon(ICON.pin, '#2f5d3a')); $('wxloc').insertAdjacentText('beforeend', tx(st.scene.location?.name));
  $('wxtemp').textContent = fmt(w.temp_c);
  $('wxcond').textContent = t().cond[mode];
  $('modes').innerHTML = '';
  for (const m of ['sunny', 'cloudy', 'windy', 'rain', 'rainbow']) {
    const b = document.createElement('button');
    b.className = m === mode ? 'on' : '';
    b.title = t().cond[m];
    b.append(icon(ICON[m], m === mode ? '#ffffff' : '#2f5d3a'));
    b.onclick = () => { st.wxMode = m; renderWeather(); };
    $('modes').append(b);
  }
  $('wxh').textContent = t().conditions;
  $('wxlive').textContent = st.online ? t().live : t().offline;
  const date = new Intl.DateTimeFormat(st.lang === 'ar' ? 'ar-KW' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  $('wxdate').textContent = `${date} · ${t().line[mode]}`;
  const tiles = [
    ['sunny', '#f2c94c', t().temp, `${fmt(w.temp_c)}°`, w.feels_c != null ? `${t().feels} ${fmt(w.feels_c)}°` : '', [.3, .5, .7, .9, .8, .6, .4]],
    ['rain', '#4aa3df', t().humidity, w.humidity != null ? `${fmt(w.humidity)}%` : '-', w.dew_c != null ? `${t().dew} ${fmt(w.dew_c)}°` : '', [.6, .5, .4, .4, .5, .6, .7]],
    ['windy', '#6cc04f', t().wind, w.wind_kmh != null ? `${fmt(w.wind_kmh)} km/h` : '-', '', [.4, .6, .5, .7, .6, .8, .5]],
    ['cloudy', '#8899a7', t().rain, w.rain_chance != null ? `${fmt(w.rain_chance)}%` : '-', '', [.1, .1, .2, .1, .1, .2, .1]],
  ];
  $('wxgrid').innerHTML = '';
  for (const [ic, col, label, val, sub, sp] of tiles) {
    const d = document.createElement('div');
    d.className = 'tile px-soft';
    d.innerHTML = `<span class="ic"></span><small>${label}</small><b>${val}</b><span>${sub}</span>`;
    d.querySelector('.ic').append(icon(ICON[ic], col, 3));
    d.append(spark(sp, col));
    $('wxgrid').append(d);
  }
  $('wxsrc').textContent = `${t().source}: ${w.source}`;
}

function renderFlows() {
  $('day').value = day();
  $('daylbl').textContent = `${t().day} ${fmt(day())}`;
  $('play').innerHTML = ''; $('play').append(icon(st.playing ? ICON.pause : ICON.play, '#2f5d3a'));
  const withFlows = ents().filter(e => (st.scene.flows || []).some(f => f.entity === e.id));
  $('groups').innerHTML = `<p class="src" style="margin:0 3px 12px">${t().lifetime}</p>` + withFlows.map(e => `
    <div class="group px-soft"><h3>${tx(e.name)}${e.props?.count ? ` · ${fmt(e.props.count)}` : ''}</h3>${flowRows([e])}</div>`).join('');
}

function renderNav() {
  $('nav').innerHTML = '';
  for (const [k, ic] of [['farm', ICON.farm], ['weather', ICON.sunny], ['flows', ICON.flows]]) {
    const b = document.createElement('button');
    b.className = st.tab === k ? 'on' : '';
    b.append(icon(ic, st.tab === k ? '#2f5d3a' : '#8a9487', 3));
    b.insertAdjacentText('beforeend', t()[k]);
    b.onclick = () => { st.tab = k; render(); };
    $('nav').append(b);
  }
}

function render() {
  if (!st.scene) return;
  renderHeader();
  $('hdr').hidden = st.tab === 'weather';
  for (const k of ['farm', 'weather', 'flows']) $('s-' + k).hidden = st.tab !== k;
  if (st.tab === 'farm') renderFarm();
  if (st.tab === 'weather') renderWeather();
  if (st.tab === 'flows') renderFlows();
  renderNav();
}

function select(id) { st.sel = id; map.select(id); render(); }

$('tabs').onclick = (e) => { const b = e.target.closest('button'); if (b) select(b.dataset.z || null); };
$('map').onclick = (e) => {
  const r = e.target.getBoundingClientRect(), [W, H] = map.size();
  select(map.hit((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H));
};
$('lang').onclick = () => { st.lang = st.lang === 'en' ? 'ar' : 'en'; render(); };
$('day').oninput = (e) => { st.day = +e.target.value; st.playing = false; render(); };
$('play').onclick = () => { st.playing = !st.playing; if (st.playing && day() >= 730) st.day = 0; render(); };

// 12 fps stepped animation keeps the pixel-art feel; play mode advances clock.speed days per second.
let tick = 0, last = 0;
function loop(now) {
  if (now - last >= 1000 / 12) {
    last = now; tick++;
    if (st.tab === 'farm') map.frame(tick);
    if (st.tab === 'weather') wx.frame(tick);
    if (st.playing && tick % 12 === 0) {
      st.day = Math.min(730, day() + (st.scene?.clock?.speed || 1));
      if (st.day >= 730) st.playing = false;
      render();
    }
  }
  requestAnimationFrame(loop);
}

poll();
setInterval(poll, 1000); // ponytail: polling; switches to the MCP server's WebSocket in Phase 1
requestAnimationFrame(loop);
