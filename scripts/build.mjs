import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const pagesDir = path.join(srcDir, "pages");
const partialsDir = path.join(srcDir, "partials");
const STAR_RAIN_SCRIPT = '<script src="js/starrain.js?v=5"></script>';
const CACHE_VERSION = "32";

const pages = {
  "index.html": {
    title: "翔霖小站 · 时间与星光",
    description: "严浩翔 × 贺峻霖的粉丝纪念小站，收录照片、时间轴、舞台与生日祝福。",
    active: "index.html",
    pageStyles: "",
    preScripts: `
<script src="js/photos-data.js?v=5"></script>
<script src="js/quotes-data.js?v=5"></script>
<script src="js/changelog-data.js?v=5"></script>
<script src="js/wall-config.js?v=5"></script>
<script src="js/stats.js?v=5"></script>`,
    postScripts: `
<script src="js/home.js?v=5"></script>`
  },
  "timeline.html": {
    title: "记忆时间轴 · 翔霖小站",
    description: "从 2015 到现在的翔霖记忆时间轴，按年代与年份浏览同框、舞台与物料。",
    active: "timeline.html",
    pageStyles: "",
    preScripts: `
<script src="js/wall-config.js?v=5"></script>
<script src="js/timeline-data.js?v=5"></script>
<script src="js/timeline.js?v=5"></script>
<script src="js/site-auth.js?v=5"></script>
<script src="js/timeline-submit.js?v=5"></script>`,
    postScripts: ""
  },
  "review.html": {
    title: "投稿审核 · 翔霖小站",
    description: "审核时间轴与照片投稿，通过后自动加入对应板块。",
    active: "review.html",
    pageStyles: "",
    preScripts: `
<script src="js/wall-config.js?v=5"></script>
<script src="js/timeline-review.js?v=5"></script>`,
    postScripts: ""
  },
  "gallery.html": {
    title: "照片球 · 翔霖小站",
    description: "翔霖 3D 照片球，照片从四周汇聚后散开，可拖拽旋转与点选查看。",
    active: "gallery.html",
    pageStyles: '\n<link rel="stylesheet" href="css/gallery.css?v=5">',
    starRain: STAR_RAIN_SCRIPT,
    preScripts: `
<script src="js/wall-config.js?v=5"></script>
<script src="js/photos-data.js?v=5"></script>
<script src="js/birthday-data.js?v=5"></script>
<script src="js/gallery-extra-data.js?v=5"></script>
<script src="js/gallery-data.js?v=5"></script>
<script src="js/gallery.js?v=5"></script>
<script src="js/gallery-community.js?v=5"></script>`,
    postScripts: ""
  },
  "stages.html": {
    title: "舞台高光 · 翔霖小站",
    description: "翔霖合作舞台与经典演出视频，点击即可观看。",
    active: "stages.html",
    pageStyles: "",
    preScripts: `
<script src="js/videos-data.js?v=5"></script>
<script src="js/stages.js?v=5"></script>`,
    postScripts: ""
  },
  "birthday.html": {
    title: "岁岁年年 · 生日纪念 · 翔霖小站",
    description: "每年的生日祝福与写给彼此的话，按年份收藏。",
    active: "birthday.html",
    pageStyles: "",
    preScripts: `
<script src="js/birthday-data.js?v=5"></script>
<script src="js/birthday.js?v=5"></script>`,
    postScripts: ""
  },
  "wall.html": {
    title: "留言墙 · 翔霖小站",
    description: "写下你想对翔霖或同担说的话，贴在这面墙上。",
    active: "wall.html",
    pageStyles: "",
    preScripts: `
<script src="js/wall-config.js?v=5"></script>
<script src="js/wall-backend.js?v=5"></script>
<script src="js/wall.js?v=5"></script>`,
    postScripts: ""
  }
};

function generateGalleryExtraData() {
  const dir = path.join(root, "img/gallery/extra");
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir)
        .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    : [];
  const output =
    "// 由 scripts/build.mjs 自动生成，请勿手改。\n" +
    "window.GALLERY_EXTRA = " + JSON.stringify(files, null, 2) + ";\n";
  fs.writeFileSync(path.join(root, "js/gallery-extra-data.js"), output, "utf8");
  console.log("generated js/gallery-extra-data.js (" + files.length + " files)");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function renderHead(cfg) {
  return read(path.join(partialsDir, "head.html"))
    .replaceAll("{{title}}", cfg.title)
    .replaceAll("{{description}}", cfg.description)
    .replaceAll("{{pageStyles}}", cfg.pageStyles || "");
}

function renderNav(active) {
  let html = read(path.join(partialsDir, "nav.html"));
  const links = ["index", "timeline", "gallery", "stages", "birthday", "wall"];
  links.forEach((name) => {
    html = html.replaceAll(
      "{{" + name + "Class}}",
      (name + ".html") === active ? "on" : ""
    );
  });
  return html;
}

function renderScripts(cfg) {
  return read(path.join(partialsDir, "scripts.html"))
    .replaceAll("{{starRain}}", cfg.starRain == null ? STAR_RAIN_SCRIPT : cfg.starRain)
    .replaceAll("{{preScripts}}", cfg.preScripts || "")
    .replaceAll("{{postScripts}}", cfg.postScripts || "");
}

function validateAssets(html, pageName) {
  const missing = [];
  const re = /(?:src|href)="([^"]+)"/g;
  let match;
  while ((match = re.exec(html))) {
    const raw = match[1];
    if (/^(?:https?:|data:|mailto:|#|javascript:)/i.test(raw)) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    const file = path.join(root, clean);
    if (!fs.existsSync(file) && !pages[clean]) missing.push(clean);
  }
  if (missing.length) {
    throw new Error(pageName + " references missing assets:\n" + missing.join("\n"));
  }
}

generateGalleryExtraData();

for (const [name, cfg] of Object.entries(pages)) {
  let html = read(path.join(pagesDir, name));
  html = html
    .replaceAll("{{head}}", renderHead(cfg))
    .replaceAll("{{nav}}", renderNav(cfg.active))
    .replaceAll("{{footer}}", read(path.join(partialsDir, "footer.html")))
    .replaceAll("{{scripts}}", renderScripts(cfg));
  html = html.replaceAll("v=5", "v=" + CACHE_VERSION);
  validateAssets(html, name);
  fs.writeFileSync(path.join(root, name), html, "utf8");
  console.log("generated", name);
}

console.log("Build complete.");
