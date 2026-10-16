// Use your Claude subscription as the farm teacher's AI.
// Runs a tiny OpenAI-compatible endpoint on this computer that answers through the `claude` command (Claude Code).
//
//   node scripts/claude-bridge.mjs            # then in the teacher: "Use any OpenAI-compatible AI",
//                                             # address http://localhost:8787/v1, model name: claude
//
// The farm changes come back as a ```json actions block (the teacher checks each one before applying it).
// ponytail: one request at a time, no streaming; each turn sends the whole conversation as text.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { COPY_TAIL } from '../viewer/teacher.js';

const PORT = +(process.env.PORT || 8787);
const text = (c) => (typeof c === 'string' ? c : (c || []).map((p) => p.text || '').join(''));

function ask(prompt) {
  return new Promise((ok, fail) => {
    const p = spawn('claude', ['-p', '--output-format', 'text'], { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('error', fail);
    p.on('close', (code) => (code === 0 ? ok(out.trim()) : fail(new Error(err.trim() || `claude exited ${code}`))));
    p.stdin.end(prompt);
  });
}

createServer(async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) { res.statusCode = 404; return res.end(); }
  let body = '';
  for await (const ch of req) body += ch;
  try {
    const { messages = [] } = JSON.parse(body);
    const sys = messages.filter((m) => m.role === 'system').map((m) => text(m.content)).join('\n\n');
    const convo = messages.filter((m) => m.role !== 'system').map((m) => `${m.role === 'assistant' ? 'Teacher' : m.role === 'tool' ? 'Farm' : 'Learner turn'}:\n${text(m.content)}`).join('\n\n');
    const answer = await ask(`${sys}\n\n${COPY_TAIL}\n\nConversation so far (reply as the Teacher to the last Learner turn):\n\n${convo}`);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: answer } }] }));
  } catch (e) {
    res.statusCode = 500; res.end(String(e.message || e));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Claude bridge on http://localhost:${PORT}/v1 (model name: anything)`));
