// First-visit setup: name your farm, five questions that set your level, then plot, crops and animals.
// Every figure on these screens comes from data/ through engine/rates.js, or is a choice labelled as a setting.
import { build } from '../engine/rates.js';
import { sprite } from './sprites.js';
import { flowPic } from './tips.js';

export const PLOTS = [100, 500];
export const CROPS = ['tomato', 'lettuce', 'corn'];
export const HERD = { hen: [0, 6, 12, 24], goat: [0, 2, 4], cow: [0, 1, 2] }; // settings, not advice
const LEVELS = ['kid', 'kid', 'hobby', 'hobby', 'pro', 'pro'];
export const levelFrom = (answers) => LEVELS[answers.filter((a, i) => a === QUIZ.answer[i]).length];

const NAMES = {
  tomato: { en: 'Tomatoes', ar: 'طماطم' }, lettuce: { en: 'Lettuce', ar: 'خس' }, corn: { en: 'Corn', ar: 'ذرة' },
  hen: { en: 'Laying hens', ar: 'دجاج بيّاض' }, goat: { en: 'Dairy goats', ar: 'ماعز حلوب' }, cow: { en: 'Dairy cows', ar: 'أبقار حلوب' },
};

// ---------- the five questions ----------
// answer = index of the right option. The last option is always "not sure", which is fine: it just means we start gentler.
export const QUIZ = {
  answer: [0, 1, 2, 0, 1],
  pics: [[['Feed', 'Water'], 'hen', ['Eggs', 'Manure']], [['Manure'], 'compost', ['Compost']], [['Water'], 'tomato', ['Tomatoes']], [['Water'], 'hen', []], [['Water'], 'cow', ['Milk']]],
  en: [
    ['What does one laying hen need every day?', ['Feed and water', 'Only sunshine and grass', 'Nothing, hens look after themselves', 'Not sure'],
      'About 113 g of feed and 165 to 236 mL of water a day (Hy-Line Brown guide, 2025). Give her less and she lays fewer eggs.'],
    ['What happens to animal manure on a well-run farm?', ['It is thrown away', 'It is composted and goes back on the fields', 'It is fed back to the animals', 'Not sure'],
      'It rots down into compost, and only 20 to 50% of the weight is left at the end (Penn State study of dairy manure). That is the loop: animals feed the soil, the soil feeds the crops.'],
    ['Roughly how much water does 1 m² of tomatoes use in one season?', ['About 6 litres', 'About 60 litres', 'About 600 litres', 'Not sure'],
      'FAO puts it at 400 to 800 mm from planting to harvest. 1 mm of water on 1 m² is 1 litre, so 400 to 800 litres. That is why the tank matters so much.'],
    ['The water runs out. Who is in trouble first?', ['The hens', 'The corn', 'Both at exactly the same time', 'Not sure'],
      'More than 36 hours without water sharply raises deaths in adult poultry (Merck Veterinary Manual). Corn lives on water stored in the soil, about 18 to 34 days by our reading of FAO Paper 56.'],
    ['Milking cows went 48 hours with no water. What happened to their milk?', ['No change', 'It fell by about 30%', 'It went up', 'Not sure'],
      'Milk fell by about 30% and the cows lost about 12% of their weight (PMID 8946484). Every part of a farm works only as hard as its scarcest input allows. LearnFarm uses that rule.'],
  ],
  ar: [
    ['ماذا تحتاج الدجاجة البيّاضة كل يوم؟', ['علف وماء', 'شمس وعشب فقط', 'لا شيء، الدجاج يدبّر نفسه', 'لست متأكدًا'],
      'نحو 113 غرامًا من العلف و165 إلى 236 مل من الماء يوميًا (دليل Hy-Line Brown، 2025). إذا قلّ ما تأخذه، قلّ بيضها.'],
    ['ماذا يحدث لسماد الحيوانات في مزرعة تُدار جيدًا؟', ['يُرمى', 'يتحول إلى كمبوست ويعود إلى الحقول', 'يُعطى للحيوانات مرة أخرى', 'لست متأكدًا'],
      'يتحلل ويصبح كمبوست، ويبقى منه 20 إلى 50% فقط من وزنه (دراسة جامعة بنسلفانيا على سماد الأبقار). هذه هي الحلقة: الحيوانات تغذّي التربة، والتربة تغذّي المحاصيل.'],
    ['كم لترًا من الماء يحتاج متر مربع واحد من الطماطم في الموسم تقريبًا؟', ['نحو 6 لترات', 'نحو 60 لترًا', 'نحو 600 لتر', 'لست متأكدًا'],
      'تقدّرها الفاو بـ400 إلى 800 ملم من الزراعة حتى الحصاد. 1 ملم من الماء على متر مربع يساوي لترًا واحدًا، أي 400 إلى 800 لتر. لهذا الخزان مهم جدًا.'],
    ['نفد الماء. من يقع في الخطر أولًا؟', ['الدجاج', 'الذرة', 'كلاهما في الوقت نفسه تمامًا', 'لست متأكدًا'],
      'أكثر من 36 ساعة بلا ماء ترفع نفوق الدواجن البالغة بشدة (دليل ميرك البيطري). أما الذرة فتعيش على الماء المخزّن في التربة، نحو 18 إلى 34 يومًا بحسب قراءتنا لورقة الفاو رقم 56.'],
    ['أبقار حلوب بقيت 48 ساعة بلا ماء. ماذا حدث لحليبها؟', ['لم يتغير', 'نقص بنحو 30%', 'زاد', 'لست متأكدًا'],
      'نقص الحليب بنحو 30% وخسرت الأبقار نحو 12% من وزنها (PMID 8946484). كل جزء في المزرعة يعمل بقدر أشحّ ما يصله. وهذه هي القاعدة التي تستخدمها ليرن فارم.'],
  ],
};

export const LEVEL_NAME = {
  en: { kid: 'New to farming', hobby: 'Some experience', pro: 'Experienced' },
  ar: { kid: 'جديد على الزراعة', hobby: 'عندك بعض الخبرة', pro: 'خبير' },
};

const W = {
  en: {
    hello: 'Build your own farm', helloP: 'Five quick questions to see what you already know, then you choose your land, your crops and your animals. Takes about two minutes. Everything stays in this browser.',
    begin: 'Start', resume: 'Continue my farm', name: 'What is your farm called?', namePh: 'For example: Green Valley', nameP: 'You can change it later.',
    q: (n) => `Question ${n} of 5`, check: 'Check', next: 'Next', back: 'Back', right: 'Right', notQuite: 'Not quite', fine: 'No problem, that is what this is for',
    levelT: 'Your starting level', levelP: { kid: 'We will explain every word and go step by step.', hobby: 'We will skip the very basics and show you the numbers.', pro: 'We will show the full figures, ranges and sources.' },
    score: (n) => `${n} of 5 right`,
    plotT: 'How much land do you have?', plotP: 'Pick one. This is a setting, not a recommendation.',
    plotSize: (n) => `About ${n} doubles tennis courts`,
    cropT: 'What do you want to grow?', cropP: (m) => `Pick one to three crops. Your ${m} m² is split equally between them (a setting).`,
    perDay: 'per day', water: 'Water', makes: 'Makes', season: (d) => `${d}-day season`,
    animT: 'Any animals?', animP: 'Optional. Animals give eggs or milk and manure, which becomes compost for your crops. Pen space is not modelled yet.',
    none: 'None', sumT: 'Ready to build', build: 'Build my farm', youGet: 'Every day your farm needs', tankNote: 'Tank, pump and stores are sized for you from these needs. They are settings you can change.',
  },
  ar: {
    hello: 'ابنِ مزرعتك', helloP: 'خمسة أسئلة سريعة لنعرف ما تعرفه، ثم تختار أرضك ومحاصيلك وحيواناتك. يستغرق الأمر دقيقتين تقريبًا. كل شيء يبقى في هذا المتصفح.',
    begin: 'ابدأ', resume: 'أكمل مزرعتي', name: 'ما اسم مزرعتك؟', namePh: 'مثلًا: الوادي الأخضر', nameP: 'يمكنك تغييره لاحقًا.',
    q: (n) => `السؤال ${n} من 5`, check: 'تحقّق', next: 'التالي', back: 'رجوع', right: 'صحيح', notQuite: 'ليس تمامًا', fine: 'لا مشكلة، لهذا نحن هنا',
    levelT: 'مستواك في البداية', levelP: { kid: 'سنشرح كل كلمة ونمشي خطوة بخطوة.', hobby: 'سنتجاوز الأساسيات جدًا ونريك الأرقام.', pro: 'سنريك الأرقام كاملة مع مداها ومصادرها.' },
    score: (n) => `${n} من 5 صحيحة`,
    plotT: 'كم مساحة أرضك؟', plotP: 'اختر واحدة. هذا إعداد، وليس توصية.',
    plotSize: (n) => `بمساحة ${n} ملعب تنس زوجي تقريبًا`,
    cropT: 'ماذا تريد أن تزرع؟', cropP: (m) => `اختر من محصول إلى ثلاثة. تُقسم مساحتك ${m} م² بينها بالتساوي (إعداد).`,
    perDay: 'يوميًا', water: 'ماء', makes: 'ينتج', season: (d) => `موسم ${d} يومًا`,
    animT: 'هل تريد حيوانات؟', animP: 'اختياري. الحيوانات تعطي بيضًا أو حليبًا وسمادًا يصبح كمبوست لمحاصيلك. مساحة الحظيرة غير محسوبة بعد.',
    none: 'لا شيء', sumT: 'جاهز للبناء', build: 'ابنِ مزرعتي', youGet: 'تحتاج مزرعتك كل يوم', tankNote: 'الخزان والمضخة والمخازن تُحسب لك من هذه الاحتياجات. وهي إعدادات يمكنك تغييرها.',
  },
};

// ---------- scene from setup ----------
const up = (x) => { if (x <= 0) return 0; const p = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1); return Math.ceil(x / p) * p; }; // 2 significant digits, rounded up
const sum = (flows, dir, res) => flows.filter((f) => f.direction === dir && res.includes(f.resource.en)).reduce((a, f) => a + f.per_day, 0);
const HEAP_CONVERT = { convert: 0.35, convert_range: [0.2, 0.5], convert_urls: ['https://pure.psu.edu/en/publications/mass-and-nutrient-losses-during-the-composting-of-dairy-manure-am/'],
  convert_source: 'Penn State study of composting dairy manure: weight and volume fall by 50-80%, so 20-50% remains (0.35 used)' };

export function makeScene(s, data) {
  const crops = s.crops.length ? s.crops : ['tomato'], animals = Object.entries(s.animals || {}).filter(([, n]) => n > 0);
  const h = s.plot >= 500 ? 10 : 6, ents = [{ id: 'house', kind: 'house', name: { en: 'House', ar: 'البيت' }, props: { rect: [1, 1, 6, 6] } }];
  let x = 8, left = s.plot;
  crops.forEach((c, i) => {
    const area = i === crops.length - 1 ? left : Math.round(s.plot / crops.length);
    left -= area;
    const w = Math.max(3, Math.round(area / 2.5 / h)); // ponytail: tiles are a picture, the area_m2 is what counts
    ents.push({ id: c, kind: 'plot', name: NAMES[c], props: { rect: [x, 1, w, h], crop: c, area_m2: area } });
    x += w + 1;
  });
  const y = h + 2;
  if (animals.length) {
    ents.push({ id: 'animals', kind: 'pen', name: { en: 'Animals', ar: 'الحيوانات' }, props: { rect: [1, y, 9, 8] } });
    animals.forEach(([k, n]) => ents.push({ id: k + 's', kind: k, name: NAMES[k], props: { zone: 'animals', count: n } }));
  }
  const sx = animals.length ? 11 : 1;
  ents.push({ id: 'water', kind: 'pond', name: { en: 'Well and tank', ar: 'البئر والخزان' }, props: { rect: [sx, y, 7, 3] } });
  if (animals.length) ents.push({ id: 'storage', kind: 'storage', name: { en: 'Feed store', ar: 'مخزن العلف' }, props: { rect: [sx, y + 4, 7, 3] } });
  ents.push({ id: 'compost', kind: 'compost', name: { en: 'Compost heap', ar: 'كومة الكمبوست' }, props: { rect: [sx + 8, y, 6, 3] } });

  const pen = ents.find((e) => e.id === 'animals')?.props.rect;
  for (const e of ents) { const [rx, ry, rw, rh] = e.props.rect || pen; e.pos = [Math.round(rx + rw / 2), Math.round(ry + rh / 2), 0]; }
  const scene = build({ version: '0', title: { en: s.name || 'My Farm', ar: s.name || 'مزرعتي' }, clock: { day: 0 }, entities: ents, flows: [] }, data);
  const fl = scene.flows, water = sum(fl, 'in', ['Water']), feed = sum(fl, 'in', ['Feed', 'Feed (dry matter)']);
  const compost = sum(fl, 'in', ['Compost']), fromManure = sum(fl, 'out', ['Manure']) * HEAP_CONVERT.convert;
  // Settings: two weeks of water in the tank, a pump a little above the daily need, a month of feed, two months of compost room.
  scene.stocks = [{ id: 'tank', name: { en: 'Water tank', ar: 'خزان الماء' }, unit: 'L', level: up(water * 14), capacity: up(water * 14), refill_per_day: up(water * 1.1), zone: 'water', supply: { en: 'Well pump', ar: 'مضخة البئر' } }];
  if (feed) scene.stocks.push({ id: 'feedstore', name: { en: 'Feed store', ar: 'مخزن العلف' }, unit: 'kg', level: up(feed * 30), capacity: up(feed * 30), refill_per_day: up(feed * 1.05), zone: 'storage', supply: { en: 'Feed deliveries', ar: 'توريد العلف' } });
  const bought = up(Math.max(0, compost - fromManure) * 1.05);
  scene.stocks.push({ id: 'heap', name: { en: 'Compost heap', ar: 'كومة الكمبوست' }, unit: 'kg', level: up(compost * 30), capacity: up(compost * 60), zone: 'compost', ...HEAP_CONVERT,
    ...(bought ? { refill_per_day: bought, supply: { en: 'Compost deliveries', ar: 'توريد الكمبوست' } } : {}) });
  scene.routes = [{ resource: 'Water', direction: 'in', stock: 'tank' }, { resource: 'Feed', direction: 'in', stock: 'feedstore' }, { resource: 'Feed (dry matter)', direction: 'in', stock: 'feedstore' },
    { resource: 'Manure', direction: 'out', stock: 'heap' }, { resource: 'Compost', direction: 'in', stock: 'heap' }].filter((r) => scene.stocks.some((s) => s.id === r.stock));
  return scene;
}

// ---------- the wizard ----------
// ctx: { lang(), data, fmt, unit, sfx, onDone(setup), saved }
export function wizard(el, ctx) {
  const s = { step: ctx.saved ? -1 : 0, name: '', answers: [], picked: null, plot: 100, crops: ['tomato'], animals: { hen: 0, goat: 0, cow: 0 } };
  const L = () => W[ctx.lang()], esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const crate = (c, res) => ctx.data.crops[c].rates.find((r) => r.direction === (res === 'Water' ? 'in' : 'out') && (res === 'Water' ? r.resource.en === 'Water' : r.resource.en !== 'Compost'));
  const dots = () => `<div class="wdots">${[...Array(12)].map((_, i) => `<i class="${i <= s.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const nav = (next, ok = true) => `<div class="wnav">${s.step > 0 ? `<button class="btn" data-w="back">${L().back}</button>` : ''}<button class="btn primary" data-w="${next}" ${ok ? '' : 'disabled'}>${L()[next] || next}</button></div>`;

  function screen() {
    const l = L(), q = s.step - 2;
    if (s.step === -1) return `<h2>${l.hello}</h2><p>${l.helloP}</p><div class="wnav"><button class="btn" data-w="fresh">${l.begin}</button><button class="btn primary" data-w="resume">${l.resume}</button></div>`;
    if (s.step === 0) return `<div class="wpic">${flowPic(['Water', 'Feed'], 'house', ['Eggs', 'Tomatoes'], 34)}</div><h2>${l.hello}</h2><p>${l.helloP}</p>${nav('begin')}`;
    if (s.step === 1) return `<h2>${l.name}</h2><p class="meta">${l.nameP}</p><input class="winput" id="wname" maxlength="40" placeholder="${l.namePh}" value="${esc(s.name)}">${nav('next', s.name.trim())}`;
    if (q >= 0 && q < 5) {
      const [text, opts, why] = QUIZ[ctx.lang()][q], done = s.answers[q] != null, right = s.answers[q] === QUIZ.answer[q];
      const [ins, mid, outs] = QUIZ.pics[q];
      return `<p class="meta">${l.q(q + 1)}</p><div class="wpic">${flowPic(ins, mid, outs, 30)}</div><h2>${text}</h2><div class="wopts">${opts.map((o, i) =>
        `<button class="wopt ${s.picked === i ? 'on' : ''} ${done && i === QUIZ.answer[q] ? 'good' : ''} ${done && i === s.answers[q] && !right && i !== 3 ? 'bad' : ''}" data-opt="${i}" ${done ? 'disabled' : ''}>${o}</button>`).join('')}</div>
        ${done ? `<div class="wwhy ${right ? 'good' : ''}"><b>${right ? l.right : s.answers[q] === 3 ? l.fine : l.notQuite}.</b> ${why}</div>${nav('next')}` : nav('check', s.picked != null)}`;
    }
    if (s.step === 7) {
      const lv = levelFrom(s.answers), n = s.answers.filter((a, i) => a === QUIZ.answer[i]).length;
      return `<p class="meta">${l.score(ctx.fmt(n))}</p><h2>${l.levelT}: ${LEVEL_NAME[ctx.lang()][lv]}</h2><p>${l.levelP[lv]}</p>${nav('next')}`;
    }
    if (s.step === 8) return `<h2>${l.plotT}</h2><p class="meta">${l.plotP}</p><div class="wopts two">${PLOTS.map((p) =>
      `<button class="wopt big ${s.plot === p ? 'on' : ''}" data-plot="${p}"><b class="num">${ctx.fmt(p)} m²</b><span>${l.plotSize(ctx.fmt(p / 260.9, 1))}</span><span class="plotbox" style="--a:${Math.sqrt(p / 500)}"></span></button>`).join('')}</div>${nav('next')}`;
    if (s.step === 9) {
      const each = s.plot / Math.max(1, s.crops.length);
      return `<h2>${l.cropT}</h2><p class="meta">${l.cropP(ctx.fmt(s.plot))}</p><div class="wopts">${CROPS.map((c) => {
        const d = ctx.data.crops[c], wr = crate(c, 'Water'), yr = crate(c);
        const on = s.crops.includes(c), area = on ? each : s.plot / (s.crops.length + 1);
        return `<button class="wopt crop ${on ? 'on' : ''}" data-crop="${c}">${sprite(c, 30)}<span><b>${NAMES[c][ctx.lang()]}</b>
          <small class="num">${l.season(ctx.fmt(d.season_days))} · ${l.water} ${ctx.fmt(wr.per_m2_season * area / d.season_days)} ${ctx.unit('L')} ${l.perDay} · ${l.makes} ${ctx.fmt(yr.per_m2_season * area / d.season_days, 1)} ${ctx.unit(yr.unit)} ${l.perDay}</small>
          <small class="src1">${esc(wr.source.split(':')[0])}</small></span></button>`;
      }).join('')}</div>${nav('next', s.crops.length)}`;
    }
    if (s.step === 10) return `<h2>${l.animT}</h2><p class="meta">${l.animP}</p><div class="wanim">${Object.entries(HERD).map(([k, opts]) =>
      `<div class="arow">${sprite(k, 30)}<b>${NAMES[k][ctx.lang()]}</b><div class="seg">${opts.map((n) => `<button class="${s.animals[k] === n ? 'on' : ''}" data-anim="${k}:${n}">${n ? ctx.fmt(n) : l.none}</button>`).join('')}</div></div>`).join('')}</div>${nav('next')}`;
    if (s.step === 11) {
      const scene = makeScene(setup(), ctx.data), need = {};
      for (const f of scene.flows) if (f.direction === 'in') { const k = f.resource.en === 'Feed (dry matter)' ? 'Feed' : f.resource.en; need[k] = need[k] || { amt: 0, unit: f.unit, name: f.resource }; need[k].amt += f.per_day; }
      return `<h2>${l.sumT}: ${esc(s.name)}</h2><p class="meta num">${ctx.fmt(s.plot)} m² · ${s.crops.map((c) => NAMES[c][ctx.lang()]).join(' · ')}</p>
        <h3>${l.youGet}</h3><div class="market">${Object.entries(need).map(([k, v]) => `<div>${sprite(k, 22)}<b class="num">${ctx.fmt(v.amt)}</b><span>${ctx.unit(v.unit)} · ${v.name[ctx.lang()]}</span></div>`).join('')}</div>
        <p class="meta">${l.tankNote}</p>${nav('build')}`;
    }
    return '';
  }
  const setup = () => ({ name: s.name.trim(), answers: s.answers, level: levelFrom(s.answers), plot: s.plot, crops: s.crops, animals: s.animals });
  const draw = () => { el.dir = ctx.lang() === 'ar' ? 'rtl' : 'ltr'; el.innerHTML = `<div class="wcard"><button class="wlang" data-w="lang">${ctx.lang() === 'ar' ? 'English' : 'عربي'}</button>${s.step >= 0 ? dots() : ''}${screen()}</div>`; el.querySelector('#wname')?.focus(); };

  el.onclick = (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const w = b.dataset.w, q = s.step - 2;
    if (w === 'lang') { ctx.toggleLang(); return draw(); }
    if (w === 'resume') return ctx.onDone(null);
    if (w === 'fresh') s.step = 0;
    else if (w === 'back') { s.step--; s.picked = null; ctx.sfx.page(); }
    else if (w === 'check') { s.answers[q] = s.picked; s.answers[q] === QUIZ.answer[q] ? ctx.sfx.good() : ctx.sfx.soft(); }
    else if (w === 'begin' || w === 'next') { s.step++; s.picked = null; ctx.sfx.page(); }
    else if (w === 'build') { ctx.sfx.build(); return ctx.onDone(setup()); }
    else if (b.dataset.opt) { s.picked = +b.dataset.opt; ctx.sfx.tap(); }
    else if (b.dataset.plot) { s.plot = +b.dataset.plot; ctx.sfx.tap(); }
    else if (b.dataset.crop) {
      const c = b.dataset.crop;
      s.crops = s.crops.includes(c) ? s.crops.filter((x) => x !== c) : [...s.crops, c].sort((a, b) => CROPS.indexOf(a) - CROPS.indexOf(b));
      ctx.sfx.tap();
    } else if (b.dataset.anim) { const [k, n] = b.dataset.anim.split(':'); s.animals[k] = +n; ctx.sfx.tap(); }
    draw();
  };
  el.oninput = (e) => { if (e.target.id === 'wname') { s.name = e.target.value; el.querySelector('[data-w=next]').disabled = !s.name.trim(); } };
  el.onkeydown = (e) => { if (e.key === 'Enter' && e.target.id === 'wname' && s.name.trim()) { s.step++; ctx.sfx.page(); draw(); } };
  return { draw };
}
