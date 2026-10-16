// Learning tooltips: a small picture (what goes in, the part, what comes out) plus a line pitched at your level.
// Hover on desktop, tap on a phone. No numbers here on purpose: figures live next to their sources in the panels.
import { sprite } from './sprites.js';

// [inputs] -> part -> [outputs], drawn with the farm's own pixel sprites.
export function flowPic(ins, mid, outs, size = 26) {
  const row = (ks) => `<span class="pp">${ks.map((k) => sprite(k, size)).join('')}</span>`;
  return `<span class="fpic" dir="ltr">${ins.length ? row(ins) + '<span class="pa">→</span>' : ''}<span class="pm">${sprite(mid, size + 8)}</span>${outs.length ? '<span class="pa">→</span>' + row(outs) : ''}</span>`;
}

const PIC = {
  Water: [['Water'], 'tomato', ['Tomatoes']], Feed: [['Feed'], 'hen', ['Eggs']], 'Feed (dry matter)': [['Feed'], 'goat', ['Milk']],
  Manure: [['hen'], 'Manure', ['compost']], Compost: [['Manure'], 'compost', ['tomato']], Eggs: [['Feed', 'Water'], 'hen', ['Eggs']],
  Milk: [['Feed', 'Water'], 'cow', ['Milk']], Tomatoes: [['Water', 'Compost'], 'tomato', ['Tomatoes']], Lettuce: [['Water', 'Compost'], 'lettuce', ['Lettuce']],
  Corn: [['Water', 'Compost'], 'corn', ['Corn']], stock: [['Water'], 'pond', ['Water']], setting: [[], 'house', []], short: [['Water'], 'hen', []],
  lasts: [['Water'], 'corn', []], range: [[], 'hen', []], loop: [['Manure'], 'compost', ['Compost']],
};

// [kid, hobby, pro]
export const TIPS = {
  en: {
    Water: ['Every plant and animal drinks. No water, no farm.', 'Water is the input most farms run short of first, especially in heat.', 'Animals drink it; crops lose it to evapotranspiration, where 1 mm over 1 m² is 1 L. Heat raises both.'],
    Feed: ['Animals eat feed to stay alive and to make eggs or milk.', 'Feed is usually the biggest running cost with animals.', 'Layer feed is as fed; ruminants are rated in dry matter, so water content does not skew it.'],
    'Feed (dry matter)': ['Food for the animals, weighed without its water.', 'Dry matter lets you compare hay, grain and fresh grass fairly.', 'Intake scales with body weight and milk yield; the figure is a midpoint of the cited range.'],
    Manure: ['Animal poo. It goes to the compost heap, not the bin.', 'Fresh manure burns plants, so it is composted first.', 'Composting loses mass as water and carbon leave; only part of the weight comes out as compost.'],
    Compost: ['Rotted manure and plants. It feeds the soil.', 'Compost feeds the soil slowly and helps it hold water.', 'Applied once per season here and spread evenly over the days, a simplification.'],
    Eggs: ['What the hens give back every day.', 'Lay rate depends on feed, water, light and age.', 'Hen-housed eggs averaged over the laying cycle, so the early peak and late drop are flattened.'],
    Milk: ['What the cows and goats give back.', 'Milk falls fast when water or feed runs short.', 'Averaged across lactation; real yield peaks early and declines.'],
    Tomatoes: ['The harvest from the tomato plot.', 'Yield depends on water, soil food and heat.', 'Season yield spread over the season days; real harvests come in a window near the end.'],
    Lettuce: ['The harvest from the lettuce plot.', 'Lettuce is quick to grow and quick to wilt.', 'Short season and a shallow root zone, so it is the most drought-sensitive crop here.'],
    Corn: ['The harvest from the corn field.', 'Corn is thirsty but its deep roots hold on longer.', 'Grain yield over a medium maturity season; spread per day for the model.'],
    stock: ['A store, like a big bucket. It goes down when used and up when filled.', 'Stocks buy you time when a supply stops.', 'Level, capacity and refill rate set how many days of buffer you have.'],
    setting: ['This is your choice, not a fact. You can change it.', 'Settings are choices like how many hens or how big the tank is.', 'User-set parameters. Only rates from data/ carry sources.'],
    short: ['Something is missing, so this part slows down.', 'A part works only as hard as its scarcest input allows.', "Liebig's law of the minimum: pace = the lowest share across inputs."],
    lasts: ['How long it can go without this before it dies.', 'From studies; some are worst cases, some the longest seen.', 'Lethal, observed or derived; each limit names its basis and source.'],
    range: ['Real farms differ, so we show low to high.', 'The range is what the source reports; the model uses the middle.', 'Midpoint of the cited range; scaled with the same factor as the rate.'],
    loop: ['What one part gives, another part uses.', 'Closing loops means buying less from outside.', 'Routed outputs fill stocks; unrouted outputs leave the farm as sales.'],
  },
  ar: {
    Water: ['كل نبات وحيوان يشرب. بلا ماء لا توجد مزرعة.', 'الماء أول ما ينقص في أغلب المزارع، خاصة في الحر.', 'الحيوانات تشربه، والمحاصيل تفقده بالتبخر والنتح، و1 ملم على متر مربع = لتر. الحر يزيد الاثنين.'],
    Feed: ['الحيوانات تأكل العلف لتعيش وتعطي بيضًا أو حليبًا.', 'العلف عادة أكبر تكلفة يومية مع الحيوانات.', 'علف الدجاج يُحسب كما يُقدَّم؛ والمجترات تُحسب بالمادة الجافة حتى لا يخدعنا الماء فيه.'],
    'Feed (dry matter)': ['طعام الحيوانات موزونًا بلا ماء.', 'المادة الجافة تسمح بمقارنة التبن والحبوب والعشب بعدل.', 'الاستهلاك يتبع وزن الجسم وإنتاج الحليب؛ الرقم وسط المدى المذكور.'],
    Manure: ['فضلات الحيوانات. تذهب إلى كومة الكمبوست لا إلى القمامة.', 'السماد الطازج يحرق النبات، لذلك يُحوَّل إلى كمبوست أولًا.', 'التسميد يفقد وزنًا مع خروج الماء والكربون؛ جزء فقط من الوزن يصير كمبوست.'],
    Compost: ['سماد ونباتات متحللة. يغذّي التربة.', 'الكمبوست يغذّي التربة ببطء ويساعدها على حفظ الماء.', 'يُضاف مرة في الموسم هنا ويُوزَّع على الأيام بالتساوي، وهذا تبسيط.'],
    Eggs: ['ما يعطيه الدجاج كل يوم.', 'البيض يتبع العلف والماء والضوء والعمر.', 'متوسط البيض لكل دجاجة خلال دورة الإنتاج، فالذروة والهبوط مسطّحان.'],
    Milk: ['ما تعطيه الأبقار والماعز.', 'الحليب ينقص بسرعة إذا نقص الماء أو العلف.', 'متوسط على فترة الحلابة؛ الإنتاج الحقيقي يبلغ ذروته مبكرًا ثم ينخفض.'],
    Tomatoes: ['محصول قطعة الطماطم.', 'المحصول يتبع الماء وغذاء التربة والحرارة.', 'محصول الموسم موزّع على أيامه؛ الحصاد الحقيقي يأتي قرب النهاية.'],
    Lettuce: ['محصول قطعة الخس.', 'الخس يكبر بسرعة ويذبل بسرعة.', 'موسم قصير وجذور سطحية، لذلك هو الأكثر تأثرًا بالعطش هنا.'],
    Corn: ['محصول حقل الذرة.', 'الذرة تشرب كثيرًا لكن جذورها العميقة تصمد أطول.', 'محصول الحبوب لموسم متوسط الطول، موزّع يوميًا في النموذج.'],
    stock: ['مخزن، مثل دلو كبير. ينقص عند الاستعمال ويزيد عند التعبئة.', 'المخزون يعطيك وقتًا عندما يتوقف التوريد.', 'المستوى والسعة ومعدل التعبئة تحدد كم يومًا من الاحتياط لديك.'],
    setting: ['هذا اختيارك وليس حقيقة. يمكنك تغييره.', 'الإعدادات اختيارات مثل عدد الدجاج أو حجم الخزان.', 'قيم يحددها المستخدم. وحدها المعدلات في data/ لها مصادر.'],
    short: ['شيء ناقص، لذلك يتباطأ هذا الجزء.', 'كل جزء يعمل بقدر أشحّ ما يصله.', 'قانون ليبيغ للحد الأدنى: الوتيرة = أقل حصة بين المدخلات.'],
    lasts: ['كم يصمد بدون هذا قبل أن يموت.', 'من دراسات؛ بعضها أسوأ حالة وبعضها أطول ما شوهد.', 'قاتل أو ملاحظ أو مشتق؛ كل حد يذكر أساسه ومصدره.'],
    range: ['المزارع الحقيقية تختلف، لذلك نعرض من الأدنى إلى الأعلى.', 'المدى هو ما يذكره المصدر؛ والنموذج يأخذ الوسط.', 'وسط المدى المذكور؛ يُضرب بالمعامل نفسه مثل المعدل.'],
    loop: ['ما يعطيه جزء يستعمله جزء آخر.', 'إغلاق الحلقات يعني شراء أقل من الخارج.', 'المخرجات الموجّهة تملأ المخازن؛ وغير الموجّهة تخرج من المزرعة كمبيعات.'],
  },
};

const LV = { kid: 0, hobby: 1, pro: 2 };
export const tip = (key) => (TIPS.en[key] ? ` data-tip="${key}"` : '');

// ctx: { lang(), level(), sfx }
export function initTips(ctx) {
  const box = document.createElement('div');
  box.className = 'tipbox'; box.hidden = true; box.setAttribute('role', 'tooltip');
  document.body.appendChild(box);
  let cur = null;
  const show = (el) => {
    const k = el.dataset.tip, lang = ctx.lang(), lines = TIPS[lang][k];
    if (!lines) return;
    cur = el;
    const [ins, mid, outs] = PIC[k] || [[], 'house', []];
    box.dir = lang === 'ar' ? 'rtl' : 'ltr';
    box.innerHTML = `<div class="tpic">${flowPic(ins, mid, outs, 22)}</div><p>${lines[LV[ctx.level()] ?? 0]}</p>`;
    box.hidden = false;
    const r = el.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight;
    const left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2));
    const top = r.top - bh - 8 > 8 ? r.top - bh - 8 : r.bottom + 8;
    box.style.left = left + 'px'; box.style.top = top + 'px';
  };
  const hide = () => { box.hidden = true; cur = null; };
  document.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const el = e.target.closest('[data-tip]'); if (el) show(el); else if (cur) hide(); });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && el !== cur && !e.target.closest('button,a,input,summary')) { show(el); ctx.sfx.tap(); } else if (!el) hide();
  }, true);
  addEventListener('scroll', hide, true);
}
