// Builds the static site into docs/ from site.json. Run: node build.mjs
import fs from 'node:fs';
import path from 'node:path';

const site = JSON.parse(fs.readFileSync('site.json', 'utf8'));
const OUT = 'docs';
const DOMAIN = 'https://alexcorndop.com';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const thumb = (id, w = 960) => `https://i.vimeocdn.com/video/${id}_${w}`;
const ver = Date.now().toString(36);

const pages = [
  ...site.sections.map((s, i) => ({ ...s, path: i === 0 ? '' : s.key + '/' })),
  { key: 'about', label: 'About', path: 'about/' }
];

function shell({ page, title, description, body, ogImage, extraHead = '' }) {
  const root = page.path ? '../' : './';
  const url = DOMAIN + '/' + page.path;
  const nav = pages.map(p => `<a href="${root}${p.path}"${p.key === page.key ? ' aria-current="page"' : ''}>${esc(p.label)}</a>`).join('\n      ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i.vimeocdn.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${root}assets/site.css?v=${ver}">
${extraHead}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
  <header>
    <a class="name" href="${root}">${esc(site.name)}</a>
    <nav aria-label="Sections">
      ${nav}
    </nav>
  </header>
  <main id="main">
${body}
  </main>
  <footer>
    <div><span class="dot"></span>Director · Cinematographer · Producer</div>
    <div><a href="mailto:${site.email}">${site.email}</a> &nbsp;·&nbsp; <a href="tel:+1${site.phone.replace(/\D/g, '')}">${site.phone}</a></div>
  </footer>
</div>
</body>
</html>
`;
}

const firstThumb = thumb(site.sections[0].projects[0].cuts[0].thumb, 1280);

for (const page of pages) {
  const dir = path.join(OUT, page.path);
  fs.mkdirSync(dir, { recursive: true });
  if (page.key === 'about') {
    const body = `    <div class="intro"><h1><b>About.</b></h1><div class="meta">New York</div></div>
    <div class="about">
      <div>${site.about.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="contact">
        <div><div class="k">Email</div><div class="v"><a href="mailto:${site.email}">${site.email}</a></div></div>
        <div><div class="k">Phone</div><div class="v"><a href="tel:+1${site.phone.replace(/\D/g, '')}">${site.phone}</a></div></div>
      </div>
    </div>`;
    fs.writeFileSync(path.join(dir, 'index.html'), shell({ page, title: `About · ${site.name}`, description: site.about[0], body, ogImage: firstThumb }));
    continue;
  }
  const role = page.role || page.label;
  const projects = page.projects.map(p => ({ ...p, slug: slug(p.title + '-' + p.client) }));
  const total = projects.reduce((a, p) => a + p.cuts.reduce((s, c) => s + c.seconds, 0), 0);
  const rows = projects.map((p, i) => `      <li><a class="row" href="#${p.slug}" data-i="${i}"><img class="thumb" src="${thumb(p.cuts[0].thumb, 320)}" alt="" loading="lazy"><span class="title">${esc(p.title)}</span><span class="client">${esc(p.client)}${p.cuts.length > 1 ? ' · ' + p.cuts.length + ' cuts' : ''}</span></a></li>`).join('\n');
  const title = page.path ? `${page.label} · ${site.name}` : `${site.name} · Director, Cinematographer, Producer`;
  const clients = [...new Set(projects.map(p => p.client))].slice(0, 6).join(', ');
  const description = `${site.name}, ${role.toLowerCase()}. ${page.intro.replace(/\.$/, '')} for ${clients} and more.`;
  const body = `    <div class="intro"><h1><b>${esc(role)}.</b> ${esc(page.intro)}</h1><div class="meta">${projects.length} films · ${Math.round(total / 60)} min</div></div>
    <ul class="list">
${rows}
    </ul>
    <div class="peek" id="peek" aria-hidden="true"><img alt=""></div>
    <div class="sheet" id="sheet" hidden role="dialog" aria-modal="true" aria-labelledby="sheetTitle"></div>
    <script type="application/json" id="projects" data-role="${esc(role)}" data-title="${esc(title)}">${JSON.stringify(projects).replace(/</g, '\\u003c')}</script>
    <script src="${page.path ? '../' : './'}assets/site.js?v=${ver}" defer></script>`;
  fs.writeFileSync(path.join(dir, 'index.html'), shell({ page, title, description, body, ogImage: thumb(projects[0].cuts[0].thumb, 1280) }));
}

// Old Squarespace addresses keep working
const redirects = { 'director-copy-1': 'cinematographer/', 'director-copy': 'producer/', 'about-ishimoto': 'about/', 'director': '' };
for (const [from, to] of Object.entries(redirects)) {
  fs.mkdirSync(path.join(OUT, from), { recursive: true });
  fs.writeFileSync(path.join(OUT, from, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Alex Corn</title><meta http-equiv="refresh" content="0; url=../${to}"><link rel="canonical" href="${DOMAIN}/${to}"><a href="../${to}">Continue</a>`);
}

fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found · Alex Corn</title><style>body{font:16px "Helvetica Neue",Arial,sans-serif;background:#f3f3f1;color:#121314;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}a{color:inherit}@media(prefers-color-scheme:dark){body{background:#0e0f10;color:#ecebe8}}</style></head><body><p>That page isn’t here. <a href="/">Go to the work</a>.</p></body></html>`);
fs.copyFileSync('src/site.css', path.join(OUT, 'assets/site.css'));
fs.copyFileSync('src/site.js', path.join(OUT, 'assets/site.js'));
fs.writeFileSync(path.join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#121314"/><circle cx="16" cy="16" r="4" fill="#c8742a"/></svg>`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'CNAME'), 'alexcorndop.com\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${DOMAIN}/${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('Built', pages.length, 'pages into', OUT);
