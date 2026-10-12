(() => {
  const $ = (id) => document.getElementById(id);
  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  const menuToggle = $("menuToggle");
  const nav = $("nav");
  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  const catalog = [
    {id:"big-buck-bunny",title:"Big Buck Bunny",creator:"Blender Foundation",type:"open",genre:"Animasi · Komedi",description:"Film animasi pendek dari proyek open movie Blender. Periksa halaman resmi untuk lisensi dan ketentuan atribusi sebelum penggunaan ulang.",duration:"OPEN MOVIE",tone:"mint",url:"https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",source:"https://peach.blender.org/",license:"Open movie · verifikasi lisensi sumber",kind:"video"},
    {id:"sintel-trailer",title:"Sintel — Official Trailer",creator:"Blender Foundation",type:"open",genre:"Animasi · Fantasi",description:"Trailer resmi dari proyek film terbuka Sintel. Ini adalah trailer, bukan film penuh; ikuti atribusi dan lisensi pada sumber resmi.",duration:"TRAILER",tone:"violet",url:"https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4",source:"https://durian.blender.org/",license:"Open movie · verifikasi lisensi sumber",kind:"video"},
    {id:"creator-spotlight",title:"Karya Kreator NARATIVA",creator:"Ruang kreator",type:"creator",genre:"Film pendek · Original",description:"Ruang untuk karya orisinal kreator NARATIVA. Katalog bersama akan aktif setelah upload, moderasi, dan penyimpanan media terhubung.",duration:"SEGERA HADIR",tone:"amber",url:"",source:"creator.html",license:"Karya kreator · perlu izin publikasi",kind:"placeholder"},
    {id:"living-comics",title:"Living Comics: Dari Panel ke Gerak",creator:"NARATIVA Studio",type:"creator",genre:"Animasi · Storytelling",description:"Format adaptasi komik bergerak yang menghubungkan panel, dialog, narasi, dan musik sesuai hak penggunaan.",duration:"FORMAT",tone:"blue",url:"",source:"creator.html",license:"Demo konsep · bukan video produksi",kind:"placeholder"},
    {id:"nature-documentary",title:"Dokumenter Alam Terbuka",creator:"Open Media Collection",type:"documentary",genre:"Alam · Dokumenter",description:"Koleksi dokumenter perlu ditambahkan setelah pemeriksaan lisensi pada tiap berkas. Gunakan direktori sumber untuk mencari item yang memenuhi syarat.",duration:"SOURCE GUIDE",tone:"mint",url:"",source:"https://commons.wikimedia.org/wiki/Category:Videos",license:"Lisensi tiap berkas berbeda",kind:"link"},
    {id:"classic-cinema",title:"Film Klasik & Domain Publik",creator:"Open Cinema",type:"open",genre:"Film klasik · Arsip",description:"Temukan film yang status domain publik atau lisensi penggunaannya sudah diverifikasi. Tahun produksi saja tidak cukup untuk menentukan status hak.",duration:"SOURCE GUIDE",tone:"rose",url:"",source:"https://archive.org/details/movies",license:"Periksa status hak item individual",kind:"link"}
  ];

  const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const isHttpUrl = (value) => { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } };
  const externalStorageKey = "narativa.video.external-sources";
  const providerFor = (url) => {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./,"");
    if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com") return "youtube";
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    if (host === "melolo.com" || host.endsWith(".melolo.com") || host.endsWith(".melolo.net") || host.endsWith(".melolo.app")) return "melolo";
    return "web";
  };
  const getEmbed = (url, provider) => {
    try {
      const parsed = new URL(url);
      if (provider === "youtube") {
        let id = "";
        if (parsed.hostname === "youtu.be") id = parsed.pathname.split("/").filter(Boolean)[0] || "";
        else if (parsed.pathname === "/watch") id = parsed.searchParams.get("v") || "";
        else if (/^\/(embed|shorts|live)\//.test(parsed.pathname)) id = parsed.pathname.split("/")[2] || "";
        if (/^[A-Za-z0-9_-]{11}$/.test(id)) return "https://www.youtube-nocookie.com/embed/" + id;
      }
      if (provider === "tiktok") {
        const match = parsed.pathname.match(/\/video\/(\d{8,25})/);
        if (match) return "https://www.tiktok.com/embed/v2/" + match[1];
      }
    } catch {}
    return "";
  };
  const hostLabel = (url) => { try { return new URL(url).hostname.replace(/^www\./,""); } catch { return "Sumber eksternal"; } };
  const titleFromUrl = (url) => {
    const host = hostLabel(url);
    const provider = providerFor(url);
    if (provider === "youtube") return "Video YouTube";
    if (provider === "tiktok") return "Video TikTok";
    if (provider === "melolo") return "Tontonan Melolo";
    return "Tontonan dari " + host;
  };
  const loadExternal = () => {
    try {
      const items = JSON.parse(localStorage.getItem(externalStorageKey) || "[]");
      return Array.isArray(items) ? items.filter(item => item && typeof item.url === "string" && isHttpUrl(item.url)) : [];
    } catch { return []; }
  };
  const saveExternal = (items) => localStorage.setItem(externalStorageKey, JSON.stringify(items.slice(0,100)));
  let externalItems = loadExternal();
  const asCatalogItem = (item) => ({...item, type:"external", kind:"external", creator:item.providerLabel, genre:"Sumber eksternal · "+item.providerLabel, tone:item.provider === "tiktok" ? "rose" : item.provider === "youtube" ? "blue" : item.provider === "melolo" ? "violet" : "amber", duration:"EXTERNAL", license:"Tautan eksternal · hak mengikuti sumber"});
  let activeFilter = "all";
  const searchInput = $("videoSearch");
  const grid = $("videoGrid");
  const empty = $("videoEmpty");
  const count = $("videoCount");
  const player = $("featuredPlayer");

  function allItems() { return [...catalog, ...externalItems.map(asCatalogItem)]; }
  function visibleItems() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    return allItems().filter(item => {
      const filterMatch = activeFilter === "all" || item.type === activeFilter || (activeFilter === "open" && item.type === "documentary");
      const searchable = [item.title,item.creator,item.genre,item.description,item.license,item.url,item.providerLabel].join(" ").toLowerCase();
      return filterMatch && searchable.includes(query);
    });
  }
  function render() {
    const items = visibleItems();
    if (count) count.textContent = items.length + " pilihan";
    if (grid) grid.innerHTML = items.map(item => {
      const action = item.kind === "video" ? "Tonton sekarang →" : item.kind === "external" ? "Tonton / buka →" : "Buka sumber →";
      const typeLabel = item.type === "creator" ? "CREATOR" : item.type === "documentary" ? "DOCUMENTARY" : item.type === "external" ? safeText(item.providerLabel).toUpperCase() : "OPEN CINEMA";
      return `<article class="video-card">
        <button class="video-thumb" data-tone="${safeText(item.tone)}" data-play="${safeText(item.id)}" aria-label="Buka ${safeText(item.title)}">
          <span class="thumb-type">${typeLabel}</span><span class="thumb-play">${item.kind === "video" || item.kind === "external" ? "▶" : "↗"}</span><span class="thumb-duration">${safeText(item.duration)}</span>
        </button>
        <div class="video-card-body"><div class="video-card-top"><span>${safeText(item.genre)}</span><span class="provider-tag">${item.kind === "external" ? "TAUTAN ANDA" : item.kind === "video" ? "PLAYABLE" : "DISCOVER"}</span></div>
        <h4>${safeText(item.title)}</h4><p>${safeText(item.description)}</p>
        <div class="video-card-bottom"><span>${safeText(item.creator)}</span><button data-play="${safeText(item.id)}">${action}</button></div></div>
      </article>`;
    }).join("");
    if (empty) empty.hidden = items.length !== 0;
  }
  function playItem(id) {
    const item = allItems().find(entry => entry.id === id);
    if (!item || !player) return;
    if (item.kind === "external") {
      const embedUrl = getEmbed(item.url, item.provider);
      if (embedUrl) {
        const allow = item.provider === "youtube" ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" : "encrypted-media; picture-in-picture; web-share";
        player.innerHTML = `<div class="active-player"><div class="active-player-media"><iframe src="${safeText(embedUrl)}" title="${safeText(item.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="${safeText(allow)}" allowfullscreen></iframe></div><div class="active-player-info"><span class="license-label">PEMUTAR RESMI · ${safeText(item.providerLabel)}</span><h3>${safeText(item.title)}</h3><p>${safeText(item.description)} Pemutaran dan ketersediaan tetap dikendalikan oleh platform sumber.</p><span class="player-meta">Sumber: ${safeText(hostLabel(item.url))}</span><a class="source-action" href="${safeText(item.url)}" target="_blank" rel="noopener noreferrer">Buka video asli ↗</a></div></div>`;
      } else {
        player.innerHTML = `<div class="external-player-notice"><span class="license-label">BUKA SUMBER ASLI · ${safeText(item.providerLabel)}</span><h3>${safeText(item.title)}</h3><p>${safeText(item.description)} Platform ini belum memiliki embed yang didukung untuk tautan tersebut. Gunakan sumber aslinya; NARATIVA tidak mengunduh atau menyalin video.</p><a class="source-action" href="${safeText(item.url)}" target="_blank" rel="noopener noreferrer">Tonton di ${safeText(hostLabel(item.url))} ↗</a></div>`;
      }
    } else if (item.kind !== "video" || !item.url) {
      player.innerHTML = `<div class="player-empty"><div class="player-symbol">↗</div><h3>${safeText(item.title)}</h3><p>${safeText(item.description)}</p><a class="source-action" href="${safeText(item.source)}" target="_blank" rel="noopener noreferrer">Buka sumber / ruang terkait ↗</a></div>`;
    } else {
      player.innerHTML = `<div class="active-player"><div class="active-player-media"><video controls playsinline preload="metadata" src="${safeText(item.url)}" aria-label="${safeText(item.title)}">Browser Anda tidak mendukung pemutar video.</video></div><div class="active-player-info"><span class="license-label">${safeText(item.license)}</span><h3>${safeText(item.title)}</h3><p>${safeText(item.description)}</p><span class="player-meta">Sumber: ${safeText(item.creator)}</span><a class="source-action" href="${safeText(item.source)}" target="_blank" rel="noopener noreferrer">Buka halaman resmi & cek lisensi ↗</a></div></div>`;
    }
    player.scrollIntoView({behavior:"smooth",block:"center"});
  }

  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(chip => chip.classList.toggle("active", chip === button));
    const titles = {creator:"Karya kreator",open:"Open cinema",documentary:"Dokumenter",external:"Platform eksternal",all:"Pilihan untuk dijelajahi"};
    $("resultsTitle").textContent = titles[activeFilter] || titles.all;
    render();
  }));
  searchInput?.addEventListener("input", render);
  grid?.addEventListener("click", event => {
    const button = event.target.closest("[data-play]");
    if (button) playItem(button.dataset.play);
  });

  $("watchSourceForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const feedback = $("watchSourceFeedback");
    const rawUrl = $("watchSourceUrl").value.trim();
    const suppliedTitle = $("watchSourceTitle").value.trim();
    if (!isHttpUrl(rawUrl)) { feedback.textContent = "Masukkan tautan http:// atau https:// yang valid."; return; }
    const parsed = new URL(rawUrl);
    if (parsed.username || parsed.password) { feedback.textContent = "Tautan dengan kredensial di dalam URL tidak diizinkan."; return; }
    const provider = providerFor(rawUrl);
    const item = {
      id:"external-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7),
      title:suppliedTitle || titleFromUrl(rawUrl), creator:hostLabel(rawUrl), provider,
      providerLabel:provider === "youtube" ? "YouTube" : provider === "tiktok" ? "TikTok" : provider === "melolo" ? "Melolo" : "Situs eksternal",
      description:provider === "youtube" || provider === "tiktok" ? "Video eksternal. Jika tautan mendukung pemutar resmi, video dapat disematkan; jika tidak, buka sumber asli." : "Tautan menuju sumber asli. Pemutaran tetap mengikuti dukungan, aturan, dan ketersediaan platform sumber.",
      url:parsed.href, addedAt:new Date().toISOString()
    };
    try {
      const key = item.url.replace(/#.*$/,"");
      if (externalItems.some(existing => existing.url.replace(/#.*$/,"") === key)) {
        feedback.textContent = "Tautan ini sudah ada di daftar sumber tontonan Anda.";
        return;
      }
      externalItems.unshift(item);
      saveExternal(externalItems);
      activeFilter = "external";
      document.querySelectorAll("[data-filter]").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === "external"));
      $("resultsTitle").textContent = "Platform eksternal";
      $("watchSourceForm").reset();
      feedback.textContent = "Tautan ditambahkan ke ruang tontonan pada browser ini.";
      render();
      playItem(item.id);
    } catch {
      externalItems = externalItems.filter(existing => existing.id !== item.id);
      feedback.textContent = "Browser tidak mengizinkan penyimpanan lokal. Periksa pengaturan privasi browser.";
    }
  });

  $("creatorVideoForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const submission = {
      title:$("creatorVideoTitle").value.trim(), creator:$("creatorVideoName").value.trim(),
      url:$("creatorVideoUrl").value.trim(), rights:$("creatorVideoRights").value,
      description:$("creatorVideoDescription").value.trim(), submittedAt:new Date().toISOString(),
      status:"local-preview-only"
    };
    try {
      const existing = JSON.parse(localStorage.getItem("narativa.video.submissions") || "[]");
      existing.push(submission);
      localStorage.setItem("narativa.video.submissions", JSON.stringify(existing));
      $("creatorVideoFeedback").textContent = "Pengajuan tersimpan di browser ini saja. Belum terkirim ke NARATIVA dan belum dipublikasikan.";
      event.target.reset();
    } catch {
      $("creatorVideoFeedback").textContent = "Browser tidak dapat menyimpan pengajuan lokal. Tidak ada data yang dikirim ke server.";
    }
  });
  render();
})();