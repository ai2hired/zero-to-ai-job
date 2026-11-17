// Rebuilds README.md from the live curriculum at https://ai2hired.org/curriculum.json.
// Run by .github/workflows/update.yml every day; by hand: node tools/build-readme.mjs
// For a test from a local file: CURRICULUM_FILE=path/to/curriculum.json node tools/build-readme.mjs
// No dependencies (Node 20 or later). Writes nothing when the curriculum cannot be read.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_JSON = 'https://ai2hired.org/curriculum.json';

async function load() {
  if (process.env.CURRICULUM_FILE) return JSON.parse(fs.readFileSync(process.env.CURRICULUM_FILE, 'utf8'));
  const res = await fetch(URL_JSON, { headers: { 'user-agent': 'ai2hired-roadmap/1.0 (+https://github.com/ai2hired/zero-to-ai-job)' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${URL_JSON}: HTTP ${res.status}`);
  return res.json();
}

const md = (s) => String(s).replace(/\|/g, '\\|');

function readme(c) {
  const all = c.seasons.flatMap((s) => s.lessons);
  const done = all.filter((l) => l.published).length;
  const out = [];
  out.push('# Zero to an AI Job: the free roadmap');
  out.push('');
  out.push(`A free, step-by-step roadmap from zero technical background to a job in AI: **${all.length} lessons in ${c.seasons.length} seasons**, every one built from what real AI job ads ask for. Each lesson is a free video on [YouTube](${c.youtube}) with its own page on [ai2hired.org](${c.site}/).`);
  out.push('');
  out.push(`**Progress:** ${done} of ${all.length} lessons published. Lessons are released in order; this page updates itself every day.`);
  out.push('');
  out.push('## Start here');
  out.push('');
  out.push(`- **Not sure which AI job fits you?** Take the [7-question career quiz](${c.pages.careerQuiz}).`);
  out.push(`- **Have a job ad in mind?** Paste it into the [Job Ad Check](${c.pages.jobAdCheck}) to see the skills it asks for and the lessons that teach them.`);
  out.push(`- **Preparing for interviews?** [AI interview questions by role](${c.pages.interviewQuestions}), with what a strong answer covers.`);
  out.push(`- **New words everywhere?** The [AI Glossary](${c.pages.glossary}) explains the terms of AI job ads in plain English.`);
  out.push(`- **What does the market want?** The monthly [AI Job Skills Index](${c.pages.skillsIndex}), open data under CC BY 4.0.`);
  out.push('');
  out.push('## The 16 career paths');
  out.push('');
  out.push('Every path starts with the same Season 0, then takes the lessons its role needs.');
  out.push('');
  out.push('| Career path | What the job is | Lessons |');
  out.push('|---|---|---|');
  for (const p of c.careerPaths) out.push(`| [${md(p.role)}](${p.url}) | ${md(p.line)} | ${p.lessons} |`);
  out.push('');
  out.push('## The curriculum, season by season');
  out.push('');
  for (const s of c.seasons) {
    const published = s.lessons.filter((l) => l.published).length;
    const first = s.lessons[0]?.number;
    const last = s.lessons[s.lessons.length - 1]?.number;
    out.push(`### Season ${s.number}: ${s.title} (lessons ${first} to ${last})`);
    out.push('');
    out.push(`${s.outcome}${s.playlist ? ` [Watch the playlist](${s.playlist}).` : ''}`);
    out.push('');
    for (const l of s.lessons) {
      out.push(l.published ? `- [x] ${l.number}. [${md(l.title)}](${l.url})` : `- [ ] ${l.number}. ${md(l.title)}`);
    }
    out.push('');
    if (published === 0) out.push('_Coming soon._', '');
  }
  out.push('## About');
  out.push('');
  out.push(`ai2hired is a free course that takes people from zero to a job offer in AI, with a strong focus on AI in pharma and life sciences. Every lesson exists because real job descriptions ask for that skill. Website: [ai2hired.org](${c.site}/). YouTube: [@ai2hired](${c.youtube}).`);
  out.push('');
  out.push('## License');
  out.push('');
  out.push(`This roadmap is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (see [LICENSE](LICENSE)). You may copy, share and adapt it, even commercially, as long as you credit ai2hired with a link to [ai2hired.org](${c.site}/). The lesson videos and pages on ai2hired.org are not covered by this license.`);
  out.push('');
  out.push(`_This README is rebuilt every day from [the live curriculum](${URL_JSON}). Please suggest changes on the website rather than editing it here._`);
  out.push('');
  return out.join('\n');
}

const c = await load();
if (!Array.isArray(c.seasons) || c.seasons.length < 10) throw new Error('The curriculum looks incomplete: README not changed.');
fs.writeFileSync(path.join(ROOT, 'README.md'), readme(c));
console.log('README.md rebuilt.');
