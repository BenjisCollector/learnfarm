// The farm teacher: LearnFarm as a wrapper around an LLM.
// The model never invents numbers: every turn carries the farm's own figures (from data/ via the engine),
// and it changes the farm only through five checked actions. Two ways to talk to it:
//   copy  - copy a ready prompt into any AI chat, paste the reply back; a ```json actions block is applied
//   claude - your own Anthropic API key, called straight from this browser (stored only here)
//   openai - any OpenAI-compatible chat endpoint: Ollama or LM Studio on your computer, OpenRouter, Groq, ...
const SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.131.0/+esm';
export const MODELS = [['claude-opus-5-5', 'Claude Opus 5.5'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5'], ['claude-haiku-5-5', 'Claude Haiku 5.5']];

const RULES = `You are the LearnFarm farm teacher. LearnFarm teaches farming from first principles: a farm is a system. Every part needs inputs and gives outputs, and the outputs of one part become the inputs of another.

Rules that never bend:
1. Never invent a number. Use only the figures in the [Farm now] block (they come from cited primary sources) and say where a figure comes from when you use it. If a figure is not there, say you do not have it.
2. Settings are not facts. Animal counts, plot size, crop split, tank size and pump rate are the learner's choices; say so when you mention them.
3. Teach at the learner's level. kid: short sentences, one idea at a time, everyday words, explain any farming word. hobby: practical, show the numbers. pro: full figures, ranges, sources and the model's simplifications.
4. Reply in the learner's language (en = English, ar = Arabic). No em dashes.
5. Keep replies short: a few sentences, then one question or one thing to try.
6. To change the farm, use the tools (set_animals, set_crops, set_supply, go_to_day, show_area). Change only what the learner asked for or agreed to. After a change, the next [Farm now] block shows the result; explain what changed and why.`;

const COPY_TAIL = `If the learner asked you to change the farm, end your reply with one fenced json block listing the changes, for example:
\`\`\`json
{"actions":[{"type":"set_animals","kind":"hen","count":12},{"type":"set_supply","stock":"tank","on":false},{"type":"go_to_day","day":30}]}
\`\`\`
Action types: set_animals {kind: hen|goat|cow, count 0-100}, set_crops {crops: 1-3 of tomato|lettuce|corn}, set_supply {stock id, on true|false}, go_to_day {day 0-730}, show_area {zone id}.`;

const obj = (props, req) => ({ type: 'object', properties: props, required: req, additionalProperties: false });
export const TOOLS = [
  { name: 'set_animals', description: 'Set how many of one animal kind the farm keeps (a setting). Rebuilds the farm from sourced rates.', strict: true,
    input_schema: obj({ kind: { type: 'string', enum: ['hen', 'goat', 'cow'] }, count: { type: 'integer', description: '0 to 100' } }, ['kind', 'count']) },
  { name: 'set_crops', description: 'Choose which crops share the plot equally (a setting). One to three crops.', strict: true,
    input_schema: obj({ crops: { type: 'array', items: { type: 'string', enum: ['tomato', 'lettuce', 'corn'] } } }, ['crops']) },
  { name: 'set_supply', description: 'Switch a supply on or off from the current day, e.g. the well pump that refills the tank.', strict: true,
    input_schema: obj({ stock: { type: 'string', description: 'stock id from [Farm now]' }, on: { type: 'boolean' } }, ['stock', 'on']) },
  { name: 'go_to_day', description: 'Move the farm clock to a day so the learner can see what has happened by then.', strict: true,
    input_schema: obj({ day: { type: 'integer', description: '0 to 730' } }, ['day']) },
  { name: 'show_area', description: 'Open one area of the farm on screen.', strict: true,
    input_schema: obj({ zone: { type: 'string', description: 'zone id from [Farm now]' } }, ['zone']) },
];

const T = {
  en: { title: 'Farm teacher', ph: 'Ask anything about your farm…', send: 'Send', how: 'How should I answer?', copy: 'Copy a prompt to your own AI (free)', claude: 'Use my Claude API key',
    key: 'Anthropic API key', keyNote: 'Stored only in this browser and sent only to api.anthropic.com. You pay Anthropic for what you use.', forget: 'Forget key', model: 'Model',
    copyBox: 'Copy the prompt in the box below into any AI, then paste the answer here.',
    copied: 'Prompt copied. Paste it into ChatGPT, Claude, Gemini or any AI, then paste the answer here.', paste: 'Paste the AI answer here', apply: 'Add answer',
    oa: 'Use any OpenAI-compatible AI (Ollama, LM Studio, OpenRouter…)', oaModel: 'Model name, e.g. llama3.2', oaKey: 'API key (leave empty for a local AI)',
    oaNote: 'Default address is Ollama on this computer. Pick a model that supports tools if you want it to change the farm.', oaNeed: 'Type the model name first.',
    oaNet: 'Could not reach that address. If it is Ollama on this computer, check it is running and allows this site (OLLAMA_ORIGINS).',
    clear: 'Clear chat', thinking: 'Thinking…', applied: 'Changed', badKey: 'That key was rejected. Check it and try again.', net: 'Could not reach Anthropic. Check your connection.',
    rate: 'Too many requests right now. Wait a moment and try again.', refused: 'The model declined to answer that.', hello: 'Ask me why something happened, what a word means, or tell me to change something, like "add 6 hens" or "turn the pump off and skip 10 days".' },
  ar: { title: 'معلّم المزرعة', ph: 'اسأل أي شيء عن مزرعتك…', send: 'أرسل', how: 'كيف أجيبك؟', copy: 'انسخ سؤالًا إلى أي ذكاء اصطناعي (مجانًا)', claude: 'استخدم مفتاح Claude الخاص بي',
    key: 'مفتاح Anthropic API', keyNote: 'يُحفظ في هذا المتصفح فقط ويُرسل إلى api.anthropic.com فقط. أنت تدفع لـAnthropic حسب استخدامك.', forget: 'احذف المفتاح', model: 'النموذج',
    copyBox: 'انسخ النص في المربع أدناه إلى أي ذكاء اصطناعي، ثم الصق الجواب هنا.',
    copied: 'تم نسخ السؤال. الصقه في ChatGPT أو Claude أو Gemini أو أي ذكاء اصطناعي، ثم الصق الجواب هنا.', paste: 'الصق جواب الذكاء الاصطناعي هنا', apply: 'أضف الجواب',
    oa: 'استخدم أي ذكاء اصطناعي متوافق مع OpenAI (Ollama أو LM Studio أو OpenRouter…)', oaModel: 'اسم النموذج، مثل llama3.2', oaKey: 'مفتاح API (اتركه فارغًا لذكاء اصطناعي محلي)',
    oaNote: 'العنوان الافتراضي هو Ollama على هذا الجهاز. اختر نموذجًا يدعم الأدوات إذا أردته أن يغيّر المزرعة.', oaNeed: 'اكتب اسم النموذج أولًا.',
    oaNet: 'تعذّر الوصول إلى هذا العنوان. إذا كان Ollama على هذا الجهاز، تأكد أنه يعمل ويسمح لهذا الموقع (OLLAMA_ORIGINS).',
    clear: 'امسح المحادثة', thinking: 'يفكّر…', applied: 'تم التغيير', badKey: 'المفتاح مرفوض. تحقّق منه وحاول مرة أخرى.', net: 'تعذّر الوصول إلى Anthropic. تحقّق من الاتصال.',
    rate: 'طلبات كثيرة الآن. انتظر قليلًا وحاول مرة أخرى.', refused: 'رفض النموذج الإجابة عن هذا.', hello: 'اسألني لماذا حدث شيء، أو ما معنى كلمة، أو اطلب تغييرًا مثل "أضف 6 دجاجات" أو "أوقف المضخة وتقدّم 10 أيام".' },
};

// Parse and check one action against the live farm. Returns {ok, text}.
export function checkAction(a, farm) {
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (a.type === 'set_animals') return ['hen', 'goat', 'cow'].includes(a.kind) && int(a.count, 0, 100) ? { ok: true } : { ok: false, text: 'kind must be hen, goat or cow and count 0-100' };
  if (a.type === 'set_crops') return Array.isArray(a.crops) && a.crops.length >= 1 && a.crops.length <= 3 && a.crops.every((c) => ['tomato', 'lettuce', 'corn'].includes(c)) && new Set(a.crops).size === a.crops.length
    ? { ok: true } : { ok: false, text: 'crops must be 1-3 distinct of tomato, lettuce, corn' };
  if (a.type === 'set_supply') return farm.stocks.includes(a.stock) && typeof a.on === 'boolean' ? { ok: true } : { ok: false, text: `stock must be one of ${farm.stocks.join(', ')}` };
  if (a.type === 'go_to_day') return int(a.day, 0, 730) ? { ok: true } : { ok: false, text: 'day must be 0-730' };
  if (a.type === 'show_area') return farm.zones.includes(a.zone) ? { ok: true } : { ok: false, text: `zone must be one of ${farm.zones.join(', ')}` };
  return { ok: false, text: 'unknown action' };
}

// Pull the actions out of a pasted reply (the last ```json block).
export function actionsFrom(text) {
  const m = [...String(text).matchAll(/```json\s*([\s\S]*?)```/g)].at(-1);
  if (!m) return [];
  try { const j = JSON.parse(m[1]); return Array.isArray(j.actions) ? j.actions : []; } catch { return []; }
}

// ctx: { el, lang(), level(), facts() -> {text, stocks, zones}, apply(action) -> string, sfx, store: {get(), set(v)} }
export function createTeacher(ctx) {
  const st = { open: false, busy: false, pasting: false, ...ctx.store.get() }; // chat: [{role, content}] in API shape; ui: [{who, text}]
  st.chat ||= []; st.ui ||= []; st.provider ||= 'copy'; st.model ||= MODELS[0][0];
  let key = '', oaKey = ''; try { key = localStorage.getItem('lf-key') || ''; oaKey = localStorage.getItem('lf-oakey') || ''; } catch {}
  const L = () => T[ctx.lang()], esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const save = () => ctx.store.set({ chat: st.chat, oa: st.oa, ui: st.ui, provider: st.provider, model: st.model, oaUrl: st.oaUrl, oaModel: st.oaModel });
  const say = (who, text) => { st.ui.push({ who, text }); save(); draw(); };
  const turn = (q) => { const f = ctx.facts(); return { f, text: `[Farm now]\nlearner level: ${ctx.level()}\nlanguage: ${ctx.lang()}\n${f.text}\n\n[Learner]\n${q}` }; };
  const run = (a) => { const f = ctx.facts(), c = checkAction(a, f); return c.ok ? ctx.apply(a) : 'error: ' + c.text; };
  const md = (s) => esc(s).replace(/\s*[—–]\s*/g, ', ').replace(/```json[\s\S]*?```/g, '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

  async function askClaude(q) {
    const mod = await import(SDK), Anthropic = mod.default;
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    const base = st.chat.length; // on failure, roll back to here so the history stays valid
    st.chat.push({ role: 'user', content: turn(q).text });
    for (let i = 0; i < 6; i++) {
      const fb = st.model === 'claude-haiku-5-5' ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }; // refusal fallback (not on Haiku)
      let r;
      try {
        r = await client.beta.messages.create({ model: st.model, max_tokens: 4000, system: RULES, tools: TOOLS, messages: st.chat, output_config: { effort: 'low' }, ...fb });
      } catch (e) {
        st.chat.length = base;
        if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new Error(L().badKey);
        if (e instanceof Anthropic.RateLimitError) throw new Error(L().rate);
        if (e instanceof Anthropic.APIConnectionError) throw new Error(L().net);
        throw new Error(e.message || String(e));
      }
      if (r.stop_reason === 'refusal') { st.chat.length = base; return say('ai', L().refused); }
      st.chat.push({ role: 'assistant', content: r.content }); // whole content, thinking blocks included, unchanged
      const text = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      if (text) say('ai', text);
      const uses = r.content.filter((b) => b.type === 'tool_use');
      if (r.stop_reason !== 'tool_use' || !uses.length) return save();
      const results = uses.map((u) => { const out = run({ type: u.name, ...u.input }); if (!out.startsWith('error')) say('act', out); return { type: 'tool_result', tool_use_id: u.id, content: out + '\n\n' + ctx.facts().text, is_error: out.startsWith('error') }; });
      st.chat.push({ role: 'user', content: results });
    }
    save();
  }

  // OpenAI-compatible /chat/completions with function tools. Own history (st.oa), same checked actions.
  async function askOpenAI(q) {
    st.oa ||= [];
    const base = st.oa.length, url = (st.oaUrl || 'http://localhost:11434/v1').replace(/\/+$/, '') + '/chat/completions';
    const tools = TOOLS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
    st.oa.push({ role: 'user', content: turn(q).text });
    for (let i = 0; i < 6; i++) {
      let r;
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...(oaKey ? { authorization: 'Bearer ' + oaKey } : {}) },
          body: JSON.stringify({ model: st.oaModel, messages: [{ role: 'system', content: RULES }, ...st.oa], tools }) });
        if (res.status === 401 || res.status === 403) throw new Error(L().badKey);
        if (res.status === 429) throw new Error(L().rate);
        if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
        r = (await res.json()).choices[0].message;
      } catch (e) { st.oa.length = base; throw e instanceof TypeError ? new Error(L().oaNet) : e; }
      st.oa.push({ role: 'assistant', content: r.content || '', ...(r.tool_calls?.length ? { tool_calls: r.tool_calls } : {}) });
      if (r.content?.trim()) say('ai', r.content.trim());
      if (!r.tool_calls?.length) return save();
      for (const c of r.tool_calls) {
        let args; try { args = typeof c.function.arguments === 'string' ? JSON.parse(c.function.arguments) : c.function.arguments; } catch { args = null; }
        const out = args ? run({ type: c.function.name, ...args }) : 'error: arguments were not valid JSON';
        if (!out.startsWith('error')) say('act', out);
        st.oa.push({ role: 'tool', tool_call_id: c.id, content: out + '\n\n' + ctx.facts().text });
      }
    }
    save();
  }

  async function send(q) {
    if (!q.trim() || st.busy) return;
    say('me', q); ctx.sfx.msg();
    if (st.provider === 'copy') {
      const prompt = `${RULES}\n\n${COPY_TAIL}\n\n${turn(q).text}`;
      try { await navigator.clipboard.writeText(prompt); } catch { st.manual = prompt; }
      st.pasting = true; say('sys', st.manual ? L().copyBox : L().copied); return;
    }
    if (st.provider === 'claude' && !key) { st.keyOpen = true; return draw(); }
    if (st.provider === 'openai' && !st.oaModel) { say('sys', L().oaNeed); return; }
    st.busy = true; draw();
    try { await (st.provider === 'openai' ? askOpenAI(q) : askClaude(q)); ctx.sfx.msg(); } catch (e) { say('sys', e.message); ctx.sfx.soft(); }
    st.busy = false; draw();
  }

  function pasteReply(text) {
    if (!text.trim()) return;
    st.pasting = false; st.manual = null;
    say('ai', text);
    for (const a of actionsFrom(text)) { const out = run(a); say(out.startsWith('error') ? 'sys' : 'act', out); }
    ctx.sfx.msg();
  }

  function draw() {
    const l = L(), el = ctx.el;
    el.hidden = !st.open;
    if (!st.open) return;
    el.dir = ctx.lang() === 'ar' ? 'rtl' : 'ltr';
    const msgs = st.ui.map((m) => `<div class="msg ${m.who}">${m.who === 'act' ? `<b>${l.applied}:</b> ` : ''}${md(m.text)}</div>`).join('');
    el.innerHTML = `<div class="thead"><b>${l.title}</b><button class="xbtn" data-t="close" aria-label="Close">✕</button></div>
      <div class="tprov"><span class="meta">${l.how}</span>
        <label><input type="radio" name="prov" value="copy" ${st.provider === 'copy' ? 'checked' : ''}> ${l.copy}</label>
        <label><input type="radio" name="prov" value="claude" ${st.provider === 'claude' ? 'checked' : ''}> ${l.claude}</label>
        ${st.provider === 'claude' ? `<div class="tkey">${key && !st.keyOpen ? `<span class="meta">••••${esc(key.slice(-4))}</span> <button class="btn sm" data-t="forget">${l.forget}</button>`
          : `<input type="password" id="tkey" placeholder="${l.key}" autocomplete="off"><button class="btn sm primary" data-t="savekey">OK</button>`}
          <label class="meta">${l.model} <select id="tmodel">${MODELS.map(([id, n]) => `<option value="${id}" ${st.model === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <p class="meta">${l.keyNote}</p></div>` : ''}
        <label><input type="radio" name="prov" value="openai" ${st.provider === 'openai' ? 'checked' : ''}> ${l.oa}</label>
        ${st.provider === 'openai' ? `<div class="tkey"><input id="oaurl" placeholder="http://localhost:11434/v1" value="${esc(st.oaUrl || '')}">
          <input id="oamodel" placeholder="${l.oaModel}" value="${esc(st.oaModel || '')}">
          <input type="password" id="oakey" placeholder="${l.oaKey}" value="${esc(oaKey)}" autocomplete="off">
          <p class="meta">${l.oaNote}</p></div>` : ''}</div>
      <div class="tmsgs" id="tmsgs">${msgs || `<div class="msg sys">${l.hello}</div>`}${st.busy ? `<div class="msg sys">${l.thinking}</div>` : ''}</div>
      ${st.pasting ? `${st.manual ? `<textarea class="tmanual" readonly>${esc(st.manual)}</textarea>` : ''}<textarea id="tpaste" placeholder="${l.paste}"></textarea><button class="btn primary" data-t="paste">${l.apply}</button>` : ''}
      <form class="tform" id="tform"><input id="tq" placeholder="${l.ph}" autocomplete="off" ${st.busy ? 'disabled' : ''}><button class="btn primary" ${st.busy ? 'disabled' : ''}>${l.send}</button></form>
      ${st.ui.length ? `<button class="linkbtn" data-t="clear">${l.clear}</button>` : ''}`;
    const box = el.querySelector('#tmsgs'); box.scrollTop = box.scrollHeight;
  }

  ctx.el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    if (t === 'close') { st.open = false; draw(); }
    if (t === 'forget') { key = ''; try { localStorage.removeItem('lf-key'); } catch {} draw(); }
    if (t === 'savekey') { key = ctx.el.querySelector('#tkey').value.trim(); st.keyOpen = false; try { localStorage.setItem('lf-key', key); } catch {} draw(); }
    if (t === 'paste') pasteReply(ctx.el.querySelector('#tpaste').value);
    if (t === 'clear') { st.chat = []; st.oa = []; st.ui = []; st.pasting = false; save(); draw(); }
  });
  ctx.el.addEventListener('change', (e) => {
    if (e.target.name === 'prov') { st.provider = e.target.value; save(); draw(); }
    if (e.target.id === 'tmodel') { st.model = e.target.value; save(); }
    if (e.target.id === 'oaurl') { st.oaUrl = e.target.value.trim(); save(); }
    if (e.target.id === 'oamodel') { st.oaModel = e.target.value.trim(); save(); }
    if (e.target.id === 'oakey') { oaKey = e.target.value.trim(); try { localStorage.setItem('lf-oakey', oaKey); } catch {} }
  });
  ctx.el.addEventListener('submit', (e) => { e.preventDefault(); const i = ctx.el.querySelector('#tq'); const q = i.value; i.value = ''; send(q); });
  return { toggle() { st.open = !st.open; draw(); if (st.open) ctx.el.querySelector('#tq')?.focus(); }, draw, ask: (q) => { st.open = true; draw(); send(q); } };
}
