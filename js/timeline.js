// ===================== 记忆时间轴渲染 =====================
(function () {
  const body = document.getElementById("timeline-body");
  const filterBox = document.getElementById("year-filter");
  let activeYear = "all";
  let adminMode = false;
  let adminCode = "";

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
        '" loading="eager" decoding="async">';
    }

    let link = "";
    if (ev.link && ev.link.url) {
      link = '<a class="tl-link" href="' + esc(ev.link.url) +
        '" target="_blank" rel="noopener">' + esc(ev.link.text || "查看 ↗") + "</a>";
    }

    const badge = ev._community ? '<span class="tl-community-badge">小海盐投稿</span>' : "";
    const adminDelete = (ev._community && ev.id && adminMode)
      ? '<button class="tl-delete-btn" type="button" data-id="' + esc(ev.id) + '">删除</button>'
      : "";

    item.innerHTML =
      '<span class="tl-dot"></span>' +
      '<div class="tl-date">' + esc(ev.date) + "</div>" +
      '<div class="tl-card"><h3>' + esc(ev.title) + badge + "</h3>" +
      (tags ? '<div class="tl-tags">' + tags + "</div>" : "") +
      "<p>" + esc(ev.desc) + "</p>" +
      image +
      (link ? '<div class="tl-link-wrap">' + link + "</div>" : "") +
      adminDelete +
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
          id: r.id,
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

  const adminToggle = document.getElementById("timeline-admin-toggle");
  if (adminToggle) adminToggle.addEventListener("click", () => {
    if (adminMode) {
      adminMode = false;
      adminCode = "";
      adminToggle.textContent = "站长模式";
      render(activeYear);
      return;
    }
    const code = window.prompt("请输入站长口令", "");
    if (code === null) return;
    if (code.trim() !== ((window.WALL_CONFIG || {}).adminCode || "")) {
      window.alert("口令错误");
      return;
    }
    adminMode = true;
    adminCode = code.trim();
    adminToggle.textContent = "退出站长模式";
    render(activeYear);
  });

  body.addEventListener("click", async (e) => {
    const del = e.target.closest(".tl-delete-btn");
    if (!del || !adminMode) return;
    if (!window.confirm("确定删除这条投稿吗？删除后所有人不可见。")) return;
    const cfg = window.WALL_CONFIG || {};
    if (!cfg.supabase || !cfg.supabase.url) return;
    try {
      const r = await fetch(cfg.supabase.url + "/rest/v1/rpc/delete_timeline_submission", {
        method: "POST",
        headers: {
          "apikey": cfg.supabase.anonKey,
          "Authorization": "Bearer " + cfg.supabase.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_target_id: del.dataset.id, p_admin_code: adminCode })
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || "删除失败");
      }
      data = data.filter(x => x.id !== del.dataset.id);
      render(activeYear);
    } catch (err) {
      window.alert(err && err.message ? err.message : "删除失败");
    }
  });
})();
