// ===================== 记忆时间轴渲染 =====================
(function () {
  const body = document.getElementById("timeline-body");
  const filterBox = document.getElementById("year-filter");

  // 保留书写顺序，再按年份排序（同年内依旧按原顺序）
  const data = TIMELINE_DATA
    .map((d, i) => Object.assign({ _i: i }, d))
    .sort((a, b) => a.year - b.year || a._i - b._i);

  const years = [...new Set(data.map(d => d.year))];

  function makeEra(era) {
    const d = document.createElement("div");
    d.className = "tl-era";
    d.innerHTML = '<span class="tl-era-pill">' + era + "</span>";
    return d;
  }

  function makeItem(ev, side, showEra) {
    const item = document.createElement("div");
    item.className = "tl-item " + side + (ev.star ? " star" : "");

    let tags = "";
    if (ev.tag) tags += '<span class="tl-tag">' + ev.tag + "</span>";

    let link = "";
    if (ev.link && ev.link.url) {
      link = '<a class="tl-link" href="' + ev.link.url +
        '" target="_blank" rel="noopener">' + (ev.link.text || "查看 ↗") + "</a>";
    }

    item.innerHTML =
      '<span class="tl-dot"></span>' +
      '<div class="tl-date">' + ev.date + "</div>" +
      '<div class="tl-card"><h3>' + ev.title +
      (ev.star ? '<span class="badge">✦ 名场面</span>' : "") +
      "</h3>" +
      (tags ? '<div class="tl-tags">' + tags + "</div>" : "") +
      "<p>" + ev.desc + "</p>" +
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
      body.appendChild(makeItem(ev, side % 2 === 0 ? "left" : "right", year !== "all"));
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

  const allBtn = document.createElement("button");
  allBtn.textContent = "全部";
  allBtn.className = "on";
  allBtn.onclick = () => { setActive(allBtn); render("all"); };
  filterBox.appendChild(allBtn);

  years.forEach(y => {
    const b = document.createElement("button");
    b.textContent = y;
    b.onclick = () => { setActive(b); render(y); };
    filterBox.appendChild(b);
  });

  function setActive(btn) {
    filterBox.querySelectorAll("button").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
  }

  render("all");
})();
