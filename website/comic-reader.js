(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const id = params.get('work');
  const catalog = Array.isArray(window.NARATIVA_READER_CATALOG) ? window.NARATIVA_READER_CATALOG : [];
  const work = catalog.find(item => item.id === id && Array.isArray(item.localPages) && item.localPages.length);
  const title = $('comicTitle'), page = $('comicPage'), status = $('pageStatus');
  const prev = [$('prevPage'), $('prevPageBottom')], next = [$('nextPage'), $('nextPageBottom')];
  let index = 0, full = false;
  if (!work) {
    title.textContent = 'Komik tidak ditemukan';
    page.hidden = true; $('loadError').hidden = false;
    $('rightsNote').textContent = 'Karya tidak tersedia di katalog lokal NARATIVA.';
    [...prev,...next,$('downloadPage'),$('viewToggle')].forEach(button => button.disabled = true);
    return;
  }
  title.textContent = work.title;
  document.title = work.title + ' — NARATIVA Comic Reader';
  $('rightsNote').textContent = (work.author || 'Kreator NARATIVA') + ' · ' + (work.rights || 'Lisensi belum ditentukan') + ' · Baca mandiri, terpisah dari katalog.';
  function render() {
    page.src = work.localPages[index];
    page.alt = work.title + ' — halaman ' + (index + 1);
    status.textContent = 'Halaman ' + (index + 1) + ' dari ' + work.localPages.length;
    prev.forEach(button => button.disabled = index === 0);
    next.forEach(button => button.disabled = index >= work.localPages.length - 1);
  }
  function move(delta) { index = Math.max(0, Math.min(work.localPages.length - 1, index + delta)); render(); }
  prev.forEach(button => button.addEventListener('click', () => move(-1)));
  next.forEach(button => button.addEventListener('click', () => move(1)));
  $('closeReader').addEventListener('click', () => window.close());
  $('viewToggle').addEventListener('click', async () => {
    full = !full;
    document.body.classList.toggle('is-fullscreen', full);
    $('viewToggle').textContent = full ? '▣ Setengah layar' : '⛶ Layar penuh';
    $('viewToggle').setAttribute('aria-pressed', String(full));
    try {
      if (full) {
        if (window.screen && window.resizeTo) { window.moveTo(0,0); window.resizeTo(screen.availWidth,screen.availHeight); }
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen();
      } else {
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
        if (window.screen && window.resizeTo) { window.resizeTo(Math.min(1000,Math.round(screen.availWidth*.62)),Math.min(900,Math.round(screen.availHeight*.88))); window.moveTo(Math.max(0,Math.round((screen.availWidth-window.outerWidth)/2)),Math.max(0,Math.round((screen.availHeight-window.outerHeight)/2))); }
      }
    } catch (_) { /* Browser window/fullscreen permissions vary; the standalone reader remains usable. */ }
  });
  $('downloadPage').addEventListener('click', async () => {
    if (work.license !== 'CC BY 4.0') { $('rightsNote').textContent = 'Unduhan tidak dibuka karena lisensi karya ini belum mengizinkan distribusi file.'; return; }
    try {
      const response = await fetch(work.localPages[index]);
      if (!response.ok) throw new Error('fetch failed');
      const blob = await response.blob(), url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = work.id + '-halaman-' + String(index+1).padStart(2,'0') + '.svg';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
      $('rightsNote').textContent = 'Halaman diunduh. Lisensi CC BY 4.0 mewajibkan atribusi ketika karya digunakan ulang.';
    } catch (_) { $('rightsNote').textContent = 'Unduhan gagal. Periksa koneksi lalu coba lagi.'; }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); move(1); }
    if (event.key === 'Escape') window.close();
  });
  let touchStart = null;
  $('comicPage').addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive:true});
  $('comicPage').addEventListener('touchend', event => {
    if (touchStart === null) return;
    const dx = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 55) move(dx > 0 ? -1 : 1);
    touchStart = null;
  }, {passive:true});
  page.addEventListener('error', () => { $('loadError').hidden = false; });
  page.addEventListener('load', () => { $('loadError').hidden = true; });
  render();
})();