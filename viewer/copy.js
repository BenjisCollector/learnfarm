// Beginner copy. Plain words, one idea per line, both languages.
export const UI = {
  en: {
    explore: 'Explore', system: 'System', method: 'How we know',
    startTitle: 'Start here: a farm is a system',
    start1: 'Every area <b>needs</b> things to work: water, feed, compost.',
    start2: 'Every area <b>gives</b> things back: eggs, milk, tomatoes, manure.',
    start3: 'What one area gives, another area needs. Follow the moving dots on the map.',
    tapHint: 'Tap any area on the map, or pick one below.',
    areas: 'Areas on this farm', connections: 'Show connections', legend: 'What the moving dots carry',
    needs: 'Needs every day', gives: 'Gives every day', from: 'from', to: 'to', market: 'Leaves the farm (sold)',
    outside: 'from outside the farm', notModelled: 'Nothing modelled here yet.',
    working: 'Working normally: getting everything it needs.',
    shortOf: (stock, pct) => `Short of ${stock}: working at ${pct}%.`,
    why: 'Why it matters', size: 'Size', sources: 'How we know these numbers', range: 'range',
    perDay: 'a day', day: 'Day', year: 'Year', play: 'Play', pause: 'Pause', speed: 'Speed', reset: 'Reset',
    timeHint: 'Press play to watch time pass. Stocks go down as they are used and up as they are refilled.',
    loopTitle: 'How everything connects', loopSub: 'Arrows show what moves each day. Thicker arrows carry more.',
    stocksTitle: 'What the farm has stored', stocksSub: 'Stores are your settings. Switch a supply off to see what happens.',
    supplyOn: 'On', supplyOff: 'Off', daysLeft: (n) => (n === Infinity ? 'refilled every day' : `lasts about ${n} more days`), empty: 'Empty',
    eventsTitle: 'What happened', noEvents: 'Nothing has gone wrong yet. Try switching a supply off.',
    evShort: (day, part, stock, pct) => `Day ${day}: ${part} ran short of ${stock} and works at ${pct}%.`,
    evOk: (day, part) => `Day ${day}: ${part} is back to normal.`,
    marketTitle: 'Sent to market so far', setting: 'your setting', fact: 'sourced',
    tour: 'Tour', tourNext: 'Next', tourDone: 'Got it',
    m2: 'm²', tennis: (n) => `about ${n} tennis courts`, head: 'animals',
    trustWeb: 'Cited source', trustAi: 'AI summary, re-verify',
  },
  ar: {
    explore: 'استكشف', system: 'النظام', method: 'من أين الأرقام',
    startTitle: 'ابدأ هنا: المزرعة نظام',
    start1: 'كل منطقة <b>تحتاج</b> أشياء لتعمل: ماء، علف، كمبوست.',
    start2: 'وكل منطقة <b>تعطي</b> أشياء بالمقابل: بيض، حليب، طماطم، سماد.',
    start3: 'ما تعطيه منطقة تحتاجه منطقة أخرى. تابع النقاط المتحركة على الخريطة.',
    tapHint: 'اضغط على أي منطقة في الخريطة، أو اخترها من القائمة.',
    areas: 'مناطق هذه المزرعة', connections: 'أظهر الروابط', legend: 'ماذا تحمل النقاط المتحركة',
    needs: 'تحتاج يوميًا', gives: 'تعطي يوميًا', from: 'من', to: 'إلى', market: 'يخرج من المزرعة (يُباع)',
    outside: 'من خارج المزرعة', notModelled: 'لا شيء محسوب هنا بعد.',
    working: 'تعمل بشكل طبيعي: تحصل على كل ما تحتاجه.',
    shortOf: (stock, pct) => `نقص في ${stock}: تعمل بنسبة ${pct}٪.`,
    why: 'لماذا يهم هذا', size: 'الحجم', sources: 'من أين هذه الأرقام', range: 'المدى',
    perDay: 'يوميًا', day: 'اليوم', year: 'السنة', play: 'تشغيل', pause: 'إيقاف', speed: 'السرعة', reset: 'إعادة',
    timeHint: 'اضغط تشغيل لترى الأيام تمضي. المخزون ينقص عند الاستهلاك ويزيد عند التعبئة.',
    loopTitle: 'كيف يرتبط كل شيء', loopSub: 'الأسهم تُظهر ما ينتقل كل يوم. السهم الأعرض يحمل كمية أكبر.',
    stocksTitle: 'ما تخزّنه المزرعة', stocksSub: 'المخازن من إعداداتك. أوقف أحد الإمدادات لترى ماذا يحدث.',
    supplyOn: 'يعمل', supplyOff: 'متوقف', daysLeft: (n) => (n === Infinity ? 'يُعبّأ كل يوم' : `يكفي نحو ${n} يومًا`), empty: 'فارغ',
    eventsTitle: 'ماذا حدث', noEvents: 'لم يحدث أي خلل بعد. جرّب إيقاف أحد الإمدادات.',
    evShort: (day, part, stock, pct) => `اليوم ${day}: نقص ${stock} في ${part}، فأصبحت تعمل بنسبة ${pct}٪.`,
    evOk: (day, part) => `اليوم ${day}: عادت ${part} إلى العمل الطبيعي.`,
    marketTitle: 'ما أُرسل إلى السوق حتى الآن', setting: 'إعدادك', fact: 'من مصدر',
    tour: 'جولة', tourNext: 'التالي', tourDone: 'فهمت',
    m2: 'م²', tennis: (n) => `نحو ${n} ملعب تنس`, head: 'رأس',
    trustWeb: 'مصدر موثّق', trustAi: 'ملخص آلي، يحتاج تحقق',
  },
};

// What each kind of area does, and the system lesson it teaches.
export const KIND = {
  en: {
    house: ['The farmhouse.', 'Where the farmer lives and plans. It makes no food, but every decision starts here.'],
    plot: ['A field.', 'Plants turn sunlight, water and nutrients into food. Compost from the animals feeds the soil.'],
    pen: ['The animal pen.', 'Animals turn feed and water into eggs and milk. Their manure goes to the compost heap, so nothing is wasted.'],
    pond: ['Water: well, pump and tank.', 'Water is pumped from the well into the tank, then sent to the animals and fields. If the pump stops, the tank empties.'],
    storage: ['The feed store.', 'Feed is bought from outside the farm and stored here. The animals eat from it every day.'],
    compost: ['The compost heap.', 'Manure from the animals rots down into compost, a natural fertiliser. The fields take compost from here.'],
  },
  ar: {
    house: ['بيت المزرعة.', 'هنا يعيش المزارع ويخطط. لا ينتج طعامًا، لكن كل قرار يبدأ من هنا.'],
    plot: ['حقل زراعي.', 'النباتات تحوّل ضوء الشمس والماء والمغذيات إلى طعام. والكمبوست القادم من الحيوانات يغذّي التربة.'],
    pen: ['حظيرة الحيوانات.', 'الحيوانات تحوّل العلف والماء إلى بيض وحليب. وسمادها يذهب إلى كومة الكمبوست، فلا يضيع شيء.'],
    pond: ['الماء: البئر والمضخة والخزان.', 'يُضخ الماء من البئر إلى الخزان، ثم يذهب إلى الحيوانات والحقول. إذا توقفت المضخة يفرغ الخزان.'],
    storage: ['مخزن العلف.', 'يُشترى العلف من خارج المزرعة ويُخزن هنا. والحيوانات تأكل منه كل يوم.'],
    compost: ['كومة الكمبوست.', 'سماد الحيوانات يتحلّل ليصبح كمبوست، وهو سماد طبيعي. والحقول تأخذ الكمبوست من هنا.'],
  },
};

// Terms a beginner may not know. Shown as tappable words.
export const GLOSSARY = {
  en: {
    'dry matter': 'Feed weighed after removing its water. Animal needs are measured this way because water content varies a lot between feeds.',
    compost: 'Manure and plant waste that has rotted down into a dark, crumbly fertiliser. It feeds the soil slowly.',
    manure: 'Animal droppings. Fresh manure is too strong for plants, so it is composted first.',
    stock: 'Anything the farm keeps in store, like water in a tank or feed in a store. Stocks go down when used and up when refilled.',
  },
  ar: {
    'dry matter': 'المادة الجافة: وزن العلف بعد إزالة الماء منه. تُقاس احتياجات الحيوان بها لأن نسبة الماء تختلف كثيرًا بين أنواع العلف.',
    compost: 'الكمبوست: سماد وبقايا نباتات تحلّلت حتى أصبحت سمادًا داكنًا مفتتًا. يغذّي التربة ببطء.',
    manure: 'السماد الحيواني: فضلات الحيوانات. السماد الطازج قوي جدًا على النبات، لذلك يُحوّل إلى كمبوست أولًا.',
    stock: 'المخزون: كل ما تحتفظ به المزرعة، كالماء في الخزان أو العلف في المخزن. ينقص عند الاستعمال ويزيد عند التعبئة.',
  },
};

// The first-visit tour: four steps, each pointing at one thing.
export const TOUR = {
  en: [
    ['This is a working farm', 'Each coloured area does one job. The labels show what it is and how big it is.'],
    ['Things move between areas', 'The moving dots are water, feed, manure and compost travelling across the farm. Manure from the animals becomes compost for the fields.'],
    ['Tap an area to look inside', 'You will see what it needs every day, where that comes from, what it gives back, and where that goes.'],
    ['Then break something', 'Open System, switch the well pump off and press play. Watch the tank empty and the whole farm slow down.'],
  ],
  ar: [
    ['هذه مزرعة تعمل', 'كل منطقة ملوّنة تقوم بعمل واحد. والملصقات تُظهر ما هي وكم حجمها.'],
    ['الأشياء تنتقل بين المناطق', 'النقاط المتحركة هي ماء وعلف وسماد وكمبوست تنتقل داخل المزرعة. سماد الحيوانات يصبح كمبوست للحقول.'],
    ['اضغط على منطقة لترى ما بداخلها', 'سترى ما تحتاجه كل يوم ومن أين يأتي، وما تعطيه وإلى أين يذهب.'],
    ['ثم جرّب أن تكسر شيئًا', 'افتح النظام، وأوقف مضخة البئر، واضغط تشغيل. شاهد الخزان يفرغ والمزرعة كلها تتباطأ.'],
  ],
};

// Colour and label for each resource that moves.
export const RES = {
  Water: { color: '#3b8fd6', ar: 'ماء' },
  Feed: { color: '#d4a24c', ar: 'علف' },
  'Feed (dry matter)': { color: '#d4a24c', ar: 'علف' },
  Manure: { color: '#8a5a33', ar: 'سماد' },
  Compost: { color: '#4a3020', ar: 'كمبوست' },
  Eggs: { color: '#f2dfa7', ar: 'بيض' },
  Milk: { color: '#ffffff', ar: 'حليب' },
  Tomatoes: { color: '#e2463c', ar: 'طماطم' },
  Lettuce: { color: '#6cc04f', ar: 'خس' },
  Corn: { color: '#f2c94c', ar: 'ذرة' },
};

const REPO = 'https://github.com/BenjisCollector/open-farm/tree/main';
const a = (href, text) => `<a href="${REPO}/${href}" target="_blank" rel="noopener">${text}</a>`;

export const METHOD = {
  en: `
    <h2>How we know</h2>
    <p class="lead">Open Farm is a learning simulator. It separates two kinds of numbers, and always tells you which is which.</p>
    <div class="card"><h3>Facts come from published sources</h3>
      <p>How much a hen eats, how much water tomatoes drink, how much compost a field needs: these come from primary sources such as the Hy-Line hen guide, USDA, FAO and university extension services. Sources give ranges, so you see the middle value and the full range, with a link. All of them are listed in the ${a('docs/research', 'research base')} and stored in ${a('data', 'data/')}.</p></div>
    <div class="card"><h3>Settings are your choices</h3>
      <p>How many hens, how big the tank, how much the well pumps a day: these are settings, not facts. Change them and the farm changes. They are marked as your settings wherever they appear.</p></div>
    <div class="card"><h3>How the farm runs</h3>
      <ul><li><b>Every day</b>, each area asks for what it needs from the stores (water tank, feed store, compost heap).</li>
      <li><b>If a store is short</b>, it is shared fairly, and each area works at the pace of its scarcest input. This is called the law of the minimum: a plant with plenty of water but too little compost grows only as fast as the compost allows.</li>
      <li><b>Outputs</b> either go into a store (manure goes to the compost heap, where only part of its weight remains as compost) or leave the farm to be sold.</li>
      <li>The ${a('engine/sim.js', 'simulator')} and the ${a('engine/build.py', 'rate engine')} are open. Anyone can check them.</li></ul></div>
    <div class="card"><h3>What is simplified</h3>
      <ul><li>Crops produce a steady share every day. Real crops grow, then are harvested.</li>
      <li>Heat, animal age, laying curves, disease and seasons are not modelled yet.</li>
      <li>Money is not modelled yet. Costs and prices come with the planner.</li></ul></div>
    <div class="card hint"><h3>Not professional advice</h3><p>These are estimates for learning. Before investing, talk to Kuwait's agriculture authority (PAAF), an agricultural extension office or a veterinarian.</p></div>`,
  ar: `
    <h2>من أين الأرقام</h2>
    <p class="lead">أوبن فارم محاكي تعليمي. يفصل بين نوعين من الأرقام، ويخبرك دائمًا بنوع كل رقم.</p>
    <div class="card"><h3>الحقائق من مصادر منشورة</h3>
      <p>كم تأكل الدجاجة، وكم تشرب الطماطم، وكم يحتاج الحقل من الكمبوست: كلها من مصادر أصلية مثل دليل Hy-Line للدجاج، ووزارة الزراعة الأمريكية، والفاو، ومكاتب الإرشاد الجامعية. المصادر تعطي مدى، فترى القيمة الوسطى والمدى الكامل مع الرابط. وكلها في ${a('docs/research', 'قاعدة البحث')} ومحفوظة في ${a('data', 'data/')}.</p></div>
    <div class="card"><h3>الإعدادات اختياراتك</h3>
      <p>عدد الدجاج، وحجم الخزان، وكم تضخ البئر يوميًا: هذه إعدادات وليست حقائق. غيّرها فتتغير المزرعة. وهي معلّمة بأنها إعداداتك أينما ظهرت.</p></div>
    <div class="card"><h3>كيف تعمل المزرعة</h3>
      <ul><li><b>كل يوم</b> تطلب كل منطقة ما تحتاجه من المخازن (خزان الماء، مخزن العلف، كومة الكمبوست).</li>
      <li><b>إذا نقص مخزن</b> يُوزَّع بعدل، وتعمل كل منطقة بسرعة أقل مدخلاتها توفرًا. وهذا يسمى قانون الحد الأدنى: نبتة لديها ماء كثير وكمبوست قليل تنمو بقدر ما يسمح به الكمبوست.</li>
      <li><b>المخرجات</b> إما تذهب إلى مخزن (السماد يذهب إلى كومة الكمبوست، ويبقى جزء من وزنه فقط كمبوستًا) أو تخرج من المزرعة لتُباع.</li>
      <li>${a('engine/sim.js', 'المحاكي')} و${a('engine/build.py', 'محرك المعدلات')} مفتوحان، ويستطيع أي أحد مراجعتهما.</li></ul></div>
    <div class="card"><h3>ما الذي بسّطناه</h3>
      <ul><li>المحاصيل تنتج حصة ثابتة كل يوم. المحاصيل الحقيقية تنمو ثم تُحصد.</li>
      <li>الحرارة، وعمر الحيوان، ومنحنيات وضع البيض، والأمراض، والمواسم لم تُحسب بعد.</li>
      <li>المال لم يُحسب بعد. التكاليف والأسعار تأتي مع المخطِّط.</li></ul></div>
    <div class="card hint"><h3>ليست استشارة مهنية</h3><p>هذه تقديرات للتعلّم. قبل أي استثمار، تواصل مع الهيئة العامة لشؤون الزراعة والثروة السمكية، أو مكتب إرشاد زراعي، أو طبيب بيطري.</p></div>`,
};
