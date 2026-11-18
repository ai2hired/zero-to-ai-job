// Rebuilds README.md from the live curriculum at https://ai2hired.org/curriculum.json.
// Run by .github/workflows/update.yml twice a day; by hand: node tools/build-readme.mjs
// For a test from a local file: CURRICULUM_FILE=path/to/curriculum.json node tools/build-readme.mjs
// No dependencies (Node 20 or later). Writes nothing when the curriculum cannot be read.
//
// Since 2026-11-18 (Website chat, Sahar: "make it complete automatically and keep it updated") the
// README shows the whole free site: the roadmap, the latest lessons with their videos, the free
// tools, the skills AI companies ask for (latest AI Job Skills Index), the 16 career paths with
// their interview questions, the job comparisons, every lesson season by season, the free
// credentials and the other resources. Every part comes from curriculum.json; a part whose data
// is missing (an older curriculum.json) is left out, never invented. Links to ai2hired.org carry
// ?from=github so the site's scoreboard can count visits from this page.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_JSON = 'https://ai2hired.org/curriculum.json';

async function load() {
  if (process.env.CURRICULUM_FILE) return JSON.parse(fs.readFileSync(process.env.CURRICULUM_FILE, 'utf8'));
  const res = await fetch(URL_JSON, { headers: { 'user-agent': 'ai2hired-roadmap/1.1 (+https://github.com/ai2hired/zero-to-ai-job)' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${URL_JSON}: HTTP ${res.status}`);
  return res.json();
}

const md = (s) => String(s).replace(/\|/g, '\\|');
/** A link to ai2hired.org, tagged so the site can count visits from this page. */
const tag = (url) => {
  if (!url || !/^https:\/\/ai2hired\.org/.test(url)) return url;
  const [base, hash] = url.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}from=github${hash ? `#${hash}` : ''}`;
};
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const badge = (label, value, color, link) => `[![${label}: ${value}](https://img.shields.io/badge/${encodeURIComponent(label.replace(/-/g, '--'))}-${encodeURIComponent(String(value).replace(/-/g, '--'))}-${color})](${link})`;
const bar = (done, total, width = 20) => {
  const full = Math.round((done / total) * width);
  return `${'█'.repeat(full)}${'░'.repeat(width - full)}`;
};

function readme(c) {
  const all = c.seasons.flatMap((s) => s.lessons);
  const live = all.filter((l) => l.published);
  const done = live.length;
  const pct = Math.round((done / all.length) * 100);
  const p = c.pages ?? {};
  const out = [];
  const push = (...lines) => out.push(...lines);

  // Title, badges and the promise.
  push('# Zero to an AI Job: the free roadmap', '');
  push(
    [
      badge('lessons', `${done} of ${all.length} live`, '2f6fde', tag(p.lessons ?? `${c.site}/lessons/`)),
      badge('price', 'free', '2e9e6a', tag(`${c.site}/`)),
      badge('YouTube', '@ai2hired', 'ff0000', c.youtube),
      badge('license', 'CC BY 4.0', 'f2c14e', 'LICENSE'),
      badge('updated', 'twice a day', '0f2a4a', URL_JSON),
    ].join(' '),
    '',
  );
  push(
    `A free, step-by-step roadmap from zero technical background to a job in AI: **${all.length} lessons in ${c.seasons.length} seasons**, every one built from what real AI job ads ask for. Each lesson is a free video on [YouTube](${c.youtube}) with its own page, sources and workbook on [ai2hired.org](${tag(`${c.site}/`)}).`,
    '',
  );
  push(`**Progress:** \`${bar(done, all.length)}\` ${done} of ${all.length} lessons published (${pct}%). Lessons are released in order; this page updates itself twice a day.`, '');

  // Contents.
  const sections = [
    ['Start here', 'start-here'],
    live.length ? ['Latest lessons', 'latest-lessons'] : null,
    ['Free tools', 'free-tools'],
    c.topSkills ? ['What AI employers ask for', 'what-ai-employers-ask-for'] : null,
    ['The 16 career paths', 'the-16-career-paths'],
    c.comparisons?.length ? ['Compare AI jobs', 'compare-ai-jobs'] : null,
    ['The curriculum, season by season', 'the-curriculum-season-by-season'],
    c.credentials?.length ? ['Free credentials', 'free-credentials'] : null,
    ['More free resources', 'more-free-resources'],
    ['About', 'about'],
  ].filter(Boolean);
  push('**Contents:** ' + sections.map(([t, a]) => `[${t}](#${a})`).join(' · '), '');

  // Start here.
  const first = all[0];
  push('## Start here', '');
  if (p.learnAi) push(`1. **Read the roadmap in 5 minutes:** [How to learn AI from scratch](${tag(p.learnAi)}), the whole path in 8 stages, with the skills employers ask for most.`);
  if (first?.published) push(`${p.learnAi ? '2' : '1'}. **Watch the first lesson:** [${md(first.title)}](${tag(first.url)})${first.video ? ` ([video](${first.video})${first.duration ? `, ${first.duration}` : ''})` : ''}: the map of the course and the AI job market.`);
  push(`${(p.learnAi ? 1 : 0) + (first?.published ? 1 : 0) + 1}. **Pick your target job:** take the [7-question career quiz](${tag(p.careerQuiz)})${p.careers ? ` or read [what each AI job really does](${tag(p.careers)})` : ''}, then follow that path's lessons below.`);
  push('');

  // Latest lessons.
  if (live.length) {
    const latest = [...live].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || b.number - a.number).slice(0, 3);
    push('## Latest lessons', '');
    push('| Lesson | Watch | Length |', '|---|---|---|');
    for (const l of latest) push(`| ${l.number}. [${md(l.title)}](${tag(l.url)})${l.workbook ? ' (free workbook)' : ''} | ${l.video ? `[YouTube](${l.video})` : ''} | ${l.duration ?? ''} |`);
    push('');
  }

  // Free tools.
  push('## Free tools', '');
  push('All free, no account needed.', '');
  push(`- **[Career Quiz](${tag(p.careerQuiz)}):** 7 questions to find the AI job that fits you.`);
  if (p.cvCheck) push(`- **[CV Check](${tag(p.cvCheck)}):** see which of the 16 AI roles your CV fits, and which skills would raise your match. Read on your device, never stored.`);
  push(`- **[Job Ad Check](${tag(p.jobAdCheck)}):** paste any AI job ad to see the skills it asks for and the free lessons that teach them.`);
  push(`- **[AI Hiring Trends](${tag(p.skillsIndex)}):** which skills AI and pharma companies ask for, counted every month (open data, CC BY 4.0).`);
  push('');

  // Top skills.
  const t = c.topSkills;
  if (t?.skills?.length) {
    push('## What AI employers ask for', '');
    push(`The ${t.skills.length} skills named most in ${Number(t.ads).toLocaleString('en-US')} technical job ads at ${t.companies} AI companies, ${t.month} ([AI Job Skills Index](${tag(t.url)}), CC BY 4.0). Each links to its page: who asks for it, how deep to go and the free lesson.`, '');
    push('| # | Skill | Share of job ads |', '|---|---|---|');
    for (const k of t.skills) push(`| ${k.rank} | [${md(k.name)}](${tag(k.url)}) | ${fmt(k.share)}% |`);
    if (p.skills) push('', `[All skills, one by one](${tag(p.skills)})`);
    push('');
  }

  // Career paths.
  push('## The 16 career paths', '');
  push('Every path starts with the same Season 0, then takes only the lessons its role needs.', '');
  const hasExtra = c.careerPaths.some((x) => x.interviewQuestions);
  push(hasExtra ? '| Career path | What the job is | Lessons | Interview prep |' : '| Career path | What the job is | Lessons |', hasExtra ? '|---|---|---|---|' : '|---|---|---|');
  const paths = [...c.careerPaths].sort((a, b) => String(a.shortName ?? a.role).localeCompare(String(b.shortName ?? b.role)));
  for (const x of paths) {
    const name = x.shortName && x.shortName !== x.role ? `[${md(x.shortName)}](${tag(x.url)})<br><sub>${md(x.role)}</sub>` : `[${md(x.role)}](${tag(x.url)})`;
    push(hasExtra ? `| ${name} | ${md(x.line)} | ${x.lessons} | ${x.interviewQuestions ? `[Questions](${tag(x.interviewQuestions)})` : ''} |` : `| ${name} | ${md(x.line)} | ${x.lessons} |`);
  }
  push('');
  if (p.careers) push(`What each job really does, and which ones AI companies hire for most: [AI Careers](${tag(p.careers)}).`, '');

  // Comparisons.
  if (c.comparisons?.length) {
    push('## Compare AI jobs', '');
    for (const x of c.comparisons) push(`- **[${md(x.title)}](${tag(x.url)}):** ${x.tagline}`);
    push('');
  }

  // Curriculum.
  push('## The curriculum, season by season', '');
  push('Ticked lessons are live: the title opens the lesson page (summary, sources, workbook), ▶ opens the video.', '');
  for (const s of c.seasons) {
    const published = s.lessons.filter((l) => l.published).length;
    const firstN = s.lessons[0]?.number;
    const lastN = s.lessons[s.lessons.length - 1]?.number;
    push(`### Season ${s.number}: ${s.title} (lessons ${firstN} to ${lastN})`, '');
    push(`${s.outcome}${s.playlist ? ` [Watch the playlist](${s.playlist}).` : ''}${published ? ` **${published} of ${s.lessons.length} live.**` : ''}`, '');
    for (const l of s.lessons) {
      push(l.published ? `- [x] ${l.number}. [${md(l.title)}](${tag(l.url)})${l.video ? ` [▶](${l.video})` : ''}` : `- [ ] ${l.number}. ${md(l.title)}`);
    }
    push('');
    if (published === 0) push('_Coming soon._', '');
  }

  // Credentials.
  if (c.credentials?.length) {
    push('## Free credentials', '');
    push(`Prove what you learned with a free badge you can add to LinkedIn: lessons, season quizzes, a final exam and, above the first level, a real project checked automatically. [See the credentials](${tag(p.credentials ?? `${c.site}/credentials/`)}).`, '');
    push('| Credential | Level | What it proves |', '|---|---|---|');
    for (const x of c.credentials) push(`| [${md(x.name)}](${tag(x.url)}) | ${x.level} | ${md(x.line)} |`);
    push('');
  }

  // Resources.
  push('## More free resources', '');
  push(`- [AI Glossary](${tag(p.glossary)}): the terms of AI job ads in plain English, each with a pharma example.`);
  push(`- [AI interview questions by role](${tag(p.interviewQuestions)}): what a strong answer covers.`);
  if (p.library) push(`- [Reference library](${tag(p.library)}): the books and official texts behind every lesson.`);
  if (p.news) push(`- [AI news and AI in pharma news](${tag(p.news)}), updated every day.`);
  push(`- [The full curriculum](${tag(p.curriculum)}) on the website.`);
  push('');

  // About and license.
  push('## About', '');
  push(`ai2hired is a free course that takes people from zero to a job offer in AI, with a strong focus on AI in pharma and life sciences. Every lesson exists because real job descriptions ask for that skill. Website: [ai2hired.org](${tag(`${c.site}/`)}). YouTube: [@ai2hired](${c.youtube}).`, '');
  push('If this roadmap helps you, star the repository so others find it, and share it with someone starting out.', '');
  push('## License', '');
  push(`This roadmap is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (see [LICENSE](LICENSE)). You may copy, share and adapt it, even commercially, as long as you credit ai2hired with a link to [ai2hired.org](${c.site}/). The lesson videos and pages on ai2hired.org are not covered by this license.`, '');
  push(`_This README is rebuilt twice a day from [the live curriculum](${URL_JSON}). Please suggest changes on the website rather than editing it here._`, '');
  return out.join('\n');
}

const c = await load();
if (!Array.isArray(c.seasons) || c.seasons.length < 10) throw new Error('The curriculum looks incomplete: README not changed.');
if (!Array.isArray(c.careerPaths) || c.careerPaths.length === 0) throw new Error('No career paths in the curriculum: README not changed.');
fs.writeFileSync(path.join(ROOT, 'README.md'), readme(c));
console.log('README.md rebuilt.');
