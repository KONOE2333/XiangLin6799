// ===================== 记忆时间轴渲染 =====================
(function () {
  const body = document.getElementById("timeline-body");
  const filterBox = document.getElementById("year-filter");
  let activeYear = "all";

  // 保留书写顺序，再按年份排序（同年内依旧按原顺序）
  let data = TIMELINE_DATA
    .map((d, i) => Object.assign({ _i: i }, d))
    .sort((a, b) => a.year - b.year || a._i - b._i);

  const eraByYear = {};
  TIMELINE_DATA.forEach((d) => {
    if (d.era && eraByYear[d.year] === undefined) eraByYear[d.year] = d.era;
  });

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function makeEra(era) {
    const d = document.createElement("div");
    d.className = "tl-era";
    d.innerHTML = '<span class="tl-era-pill">' + esc(era) + "</span>";
    return d;
  }

  function makeItem(ev, side) {
    const item = document.createElement("div");
    item.className = "tl-item " + side;

    let tags = "";
    if (ev.tag) tags += '<span class="tl-tag">' + esc(ev.tag) + "</span>";

    let image = "";
    if (ev.image_url) {
      image = '<img class="tl-photo" src="' + esc(ev.image_url) + '" alt="' + esc(ev.title) +
        '" loading="lazy" decoding="async">';
    }

    let link = "";
    if (ev.link && ev.link.url) {
      link = '<a class="tl-link" href="' + esc(ev.link.url) +
        '" target="_blank" rel="noopener">' + esc(ev.link.text || "查看 ↗") + "</a>";
    }

    const badge = ev._community ? '<span class="tl-community-badge">小海盐投稿</span>' : "";

    item.innerHTML =
      '<span class="tl-dot"></span>' +
      '<div class="tl-date">' + esc(ev.date) + "</div>" +
      '<div class="tl-card"><h3>' + esc(ev.title) + badge + "</h3>" +
      (tags ? '<div class="tl-tags">' + tags + "</div>" : "") +
      "<p>" + esc(ev.desc) + "</p>" +
      image +
      (link ? '<div class="tl-link-wrap">' + link + "</div>" : "") +
      "</div>";
    return item;
  }

  function render(year) {
    body.innerHTML = "";
    const list = year === "all" ? data : data.filter(d => d.year === year);
    let lastEra = null;
    let side = 0;
    for (const ev of list) {
      if (year === "all" && ev.era && ev.era !== lastEra) {
        body.appendChild(makeEra(ev.era));
        lastEra = ev.era;
      }
      body.appendChild(makeItem(ev, side % 2 === 0 ? "left" : "right"));
      side++;
    }
    observeItems();
  }

  function observeItems() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".tl-item").forEach(el => io.observe(el));
  }

  function setActive(btn) {
    filterBox.querySelectorAll("button").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    activeYear = btn.dataset.year;
  }

  function buildFilters() {
    filterBox.innerHTML = "";
    const years = [...new Set(data.map(d => d.year))];
    const allBtn = document.createElement("button");
    allBtn.textContent = "全部";
    allBtn.dataset.year = "all";
    allBtn.className = activeYear === "all" ? "on" : "";
    allBtn.onclick = () => { setActive(allBtn); render("all"); };
    filterBox.appendChild(allBtn);

    years.forEach(y => {
      const b = document.createElement("button");
      b.textContent = y;
      b.dataset.year = String(y);
      b.className = Number(activeYear) === y ? "on" : "";
      b.onclick = () => { setActive(b); render(Number(b.dataset.year)); };
      filterBox.appendChild(b);
    });
  }

  function loadApproved() {
    const cfg = window.WALL_CONFIG || {};
    if (!cfg.supabase || !cfg.supabase.url || !cfg.supabase.anonKey) return;

    fetch(cfg.supabase.url +
      "/rest/v1/timeline_submissions?select=id,submitter_name,title,event_date,year,content,tag,image_url,link_url,link_text&status=eq.approved&order=year.asc,created_at.asc", {
        headers: {
          "apikey": cfg.supabase.anonKey,
          "Authorization": "Bearer " + cfg.supabase.anonKey
        }
      })
      .then(r => {
        if (!r.ok) throw new Error("load " + r.status);
        return r.json();
      })
      .then(rows => {
        const approved = (rows || []).map(r => ({
          date: r.event_date,
          year: r.year,
          era: eraByYear[r.year] || ("小海盐投稿 · " + r.year),
          tag: r.tag || "投稿",
          title: r.title,
          desc: r.content,
          image_url: r.image_url || "",
          link: r.link_url ? { text: r.link_text || "查看 ↗", url: r.link_url } : null,
          _community: true,
          _i: data.length
        }));
        if (!approved.length) return;
        data = data.concat(approved).sort((a, b) => a.year - b.year || a._i - b._i);
        buildFilters();
        render(activeYear);
      })
      .catch(e => console.warn("社区时间轴加载失败：", e));
  }

  buildFilters();
  render("all");
  loadApproved();
})();
