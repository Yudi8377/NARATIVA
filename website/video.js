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

  // Official Blender-hosted open-movie samples. Each card links to its source/license.
  // The catalog deliberately contains no scraped third-party uploads.
  const catalog = [
    {id:"big-buck-bunny", title:"Big Buck Bunny", creator:"Blender Foundation", type:"open", genre:"Animasi · Komedi", description:"Film animasi pendek dari proyek open movie Blender. Periksa halaman resmi untuk lisensi dan ketentuan atribusi sebelum penggunaan ulang.", duration:"OPEN MOVIE", tone:"mint", url:"https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4", source:"https://peach.blender.org/", license:"Open movie · verifikasi lisensi sumber", kind:"video"},
    {id:"sintel-trailer", title:"Sintel — Official Trailer", creator:"Blender Foundation", type:"open", genre:"Animasi · Fantasi", description:"Trailer resmi dari proyek film terbuka Sintel. Ini adalah trailer, bukan film penuh; ikuti atribusi dan lisensi pada sumber resmi.", duration:"TRAILER", tone:"violet", url:"https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4", source:"https://durian.blender.org/", license:"Open movie · verifikasi lisensi sumber", kind:"video"},
    {id:"creator-spotlight", title:"Karya Kreator NARATIVA", creator:"Ruang kreator", type:"creator", genre:"Film pendek · Original", description:"Ruang untuk karya orisinal kreator NARATIVA. Katalog bersama akan aktif setelah upload, moderasi, dan penyimpanan media terhubung.", duration:"SEGERA HADIR", tone:"amber", url:"", source:"creator.html", license:"Karya kreator · perlu izin publikasi", kind:"placeholder"},
    {id:"living-comics", title:"Living Comics: Dari Panel ke Gerak", creator:"NARATIVA Studio", type:"creator", genre:"Animasi · Storytelling", description:"Format adaptasi komik bergerak yang menghubungkan panel, dialog, narasi, dan musik sesuai hak penggunaan.", duration:"FORMAT", tone:"blue", url:"", source:"creator.html", license:"Demo konsep · bukan video produksi", kind:"placeholder"},
    {id:"nature-documentary", title:"Dokumenter Alam Terbuka", creator:"Open Media Collection", type:"documentary", genre:"Alam · Dokumenter", description:"Koleksi dokumenter perlu ditambahkan setelah pemeriksaan lisensi pada tiap berkas. Gunakan direktori sumber untuk mencari item yang memenuhi syarat.", duration:"SOURCE GUIDE", tone:"mint", url:"", source:"https://commons.wikimedia.org/wiki/Category:Videos", license:"Lisensi tiap berkas berbeda", kind:"link"},
    {id:"classic-cinema", title:"Film Klasik & Domain Publik", creator:"Open Cinema", type:"open", genre:"Film klasik · Arsip", description:"Temukan film yang status domain publik atau lisensi penggunaannya sudah diverifikasi. Tahun produksi saja tidak cukup untuk menentukan status hak.", duration:"SOURCE GUIDE", tone:"rose", url:"", source:"https://archive.org/details/movies", license:"Periksa status hak item individual", kind:"link"}
  ];

  const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let activeFilter = "all";
  const searchInput = $("videoSearch");
  const grid = $("videoGrid");
  const empty = $("videoEmpty");
  const count = $("videoCount");
  const player = $("featuredPlayer");

  function visibleItems() {
    const query = (searchInput.value || "").trim().toLowerCase();
    return catalog.filter(item => {
      const filterMatch = activeFilter === "all" || item.type === activeFilter || (activeFilter === "open" && item.type === "documentary");
      const searchable = [item.title,item.creator,item.genre,item.description,item.license].join(" ").toLowerCase();
      return filterMatch && searchable.includes(query);
    });
  }

  function render() {
    const items = visibleItems();
    count.textContent = items.length + " pilihan";
    grid.innerHTML = items.map(item => `
      <article class="video-card">
        <button class="video-thumb" data-tone="${safeText(item.tone)}" data-play="${safeText(item.id)}" aria-label="Buka ${safeText(item.title)}">
          <span class="thumb-type">${item.type === "creator" ? "CREATOR" : item.type === "documentary" ? "DOCUMENTARY" : "OPEN CINEMA"}</span>
          <span class="thumb-play">${item.kind === "video" ? "▶" : "↗"}</span>
          <span class="thumb-duration">${safeText(item.duration)}</span>
        </button>
        <div class="video-card-body"><div class="video-card-top"><span>${safeText(item.genre)}</span><span>${item.kind === "video" ? "PLAYABLE" : "DISCOVER"}</span></div>
        <h4>${safeText(item.title)}</h4><p>${safeText(item.description)}</p>
        <div class="video-card-bottom"><span>${safeText(item.creator)}</span><button data-play="${safeText(item.id)}">${item.kind === "video" ? "Tonton sekarang →" : "Buka sumber →"}</button></div></div>
      </article>`).join("");
    empty.hidden = items.length !== 0;
  }

  function playItem(id) {
    const item = catalog.find(entry => entry.id === id);
    if (!item) return;
    if (item.kind !== "video" || !item.url) {
      player.innerHTML = `<div class="player-empty"><div class="player-symbol">↗</div><h3>${safeText(item.title)}</h3><p>${safeText(item.description)}</p><a class="source-action" href="${safeText(item.source)}" target="_blank" rel="noopener noreferrer">Buka sumber / ruang terkait ↗</a></div>`;
      player.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    player.innerHTML = `<div class="active-player"><div class="active-player-media"><video controls playsinline preload="metadata" src="${safeText(item.url)}" aria-label="${safeText(item.title)}">Browser Anda tidak mendukung pemutar video.</video></div><div class="active-player-info"><span class="license-label">${safeText(item.license)}</span><h3>${safeText(item.title)}</h3><p>${safeText(item.description)}</p><span class="player-meta">Sumber: ${safeText(item.creator)}</span><a class="source-action" href="${safeText(item.source)}" target="_blank" rel="noopener noreferrer">Buka halaman resmi & cek lisensi ↗</a></div></div>`;
    player.scrollIntoView({behavior:"smooth",block:"center"});
  }

  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(chip => chip.classList.toggle("active", chip === button));
    $("resultsTitle").textContent = activeFilter === "creator" ? "Karya kreator" : activeFilter === "open" ? "Open cinema" : activeFilter === "documentary" ? "Dokumenter" : "Pilihan untuk dijelajahi";
    render();
  }));
  searchInput.addEventListener("input", render);
  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-play]");
    if (button) playItem(button.dataset.play);
  });

  $("creatorVideoForm").addEventListener("submit", event => {
    event.preventDefault();
    const submission = {
      title: $("creatorVideoTitle").value.trim(),
      creator: $("creatorVideoName").value.trim(),
      url: $("creatorVideoUrl").value.trim(),
      rights: $("creatorVideoRights").value,
      description: $("creatorVideoDescription").value.trim(),
      submittedAt: new Date().toISOString(),
      status: "local-preview-only"
    };
    try {
      const existing = JSON.parse(localStorage.getItem("narativa.video.submissions") || "[]");
      existing.push(submission);
      localStorage.setItem("narativa.video.submissions", JSON.stringify(existing));
      $("creatorVideoFeedback").textContent = "Pengajuan tersimpan di browser ini saja. Belum terkirim ke NARATIVA dan belum dipublikasikan.";
      event.target.reset();
    } catch (error) {
      $("creatorVideoFeedback").textContent = "Browser tidak dapat menyimpan pengajuan lokal. Tidak ada data yang dikirim ke server.";
    }
  });

  render();
})();