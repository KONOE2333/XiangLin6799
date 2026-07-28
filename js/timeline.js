// ===================== 记忆时间轴渲染 =====================
(function () {
  const body = document.getElementById("timeline-body");
  const filterBox = document.getElementById("year-filter");
  const data = TIMELINE_DATA.slice().sort((a, b) => a.year - b.year);
  const years = [...new Set(data.map(d => d.year))];

  function render(year) {
    body.innerHTML = "";
    const list = year === "all" ? data : data.filter(d => d.year === year);
    for (const ev of list) {
      const item = document.createElement("div");
      item.className = "tl-item" + (ev.star ? " star" : "");
      item.innerHTML =
        '<span class="tl-dot"></span>' +
        '<div class="tl-date">' + ev.date + "</div>" +
        '<div class="tl-card"><h3>' + ev.title +
        (ev.star ? '<span class="badge">✦ 名场面</span>' : "") +
        "</h3><p>" + ev.desc + "</p></div>";
      body.appendChild(item);
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
