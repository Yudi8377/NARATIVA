(() => {
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
  const safeStore = {
    get(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  };
  const page = document.body.dataset.page;

  if (page === 'reader') {
    const stories = {
      rain: { title:'Perpustakaan di Ujung Hujan', body:'Di kota yang selalu diguyur hujan, seorang penjaga perpustakaan menemukan buku tanpa judul. Setiap halaman berisi kenangan yang belum pernah terjadi. Pada halaman terakhir, ia melihat nama seseorang yang belum pernah ia temui—namanya sendiri, ditulis dengan tinta yang masih basah.' },
      cloud: { title:'Kota di Atas Awan', body:'Di atas kabut yang tak pernah surut, sebuah kota bergerak mengikuti arah angin. Seorang kurir muda menerima paket tanpa alamat. Satu-satunya petunjuk adalah peta yang berubah setiap kali ia berkedip.' },
      archive: { title:'Arsip Tengah Malam', body:'Setiap tengah malam, satu berkas baru muncul di ruang arsip yang telah dikunci selama dua puluh tahun. Detektif Mara menemukan bahwa semua berkas itu mencatat kejadian sehari sebelum terjadi.' }
    };
    let active = 'rain';
    const modal = $('readerModal');
    function openStory(id) {
      active = stories[id] ? id : 'rain';
      $('readerTitle').textContent = stories[active].title;
      $('readerBody').textContent = stories[active].body;
      $('readerNotice').textContent = 'Konten demo. Riwayat baca hanya disimpan di perangkat ini.';
      modal.hidden = false;
      $('closeReader').focus();
      safeStore.set('narativa-reader-last', { id: active, progress: 32, at: new Date().toISOString() });
    }
    document.querySelectorAll('[data-read]').forEach(btn => btn.addEventListener('click', () => openStory(btn.dataset.read)));
    $('closeReader').addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; } });
    $('saveStory').addEventListener('click', () => {
      const saved = safeStore.get('narativa-reader-saved', []);
      if (!saved.some(item => item.id === active)) saved.push({ id: active, title: stories[active].title });
      safeStore.set('narativa-reader-saved', saved);
      renderSaved();
      $('readerNotice').textContent = 'Tersimpan di perangkat ini.';
    });
    $('nextStory').addEventListener('click', () => openStory(active === 'rain' ? 'cloud' : active === 'cloud' ? 'archive' : 'rain'));
    function renderSaved() {
      const saved = safeStore.get('narativa-reader-saved', []);
      $('savedStatus').replaceChildren();
      if (!saved.length) { $('savedStatus').textContent = 'Belum ada cerita yang disimpan pada perangkat ini.'; return; }
      saved.forEach(item => { const row = document.createElement('p'); row.className = 'x-muted'; row.textContent = '▸ ' + item.title; $('savedStatus').appendChild(row); });
    }
    renderSaved();
    const search = $('readerSearch');
    let genre = 'all';
    function filterStories() {
      const query = search.value.trim().toLocaleLowerCase('id');
      document.querySelectorAll('.x-story-card').forEach(card => {
        const title = (card.dataset.title || '').toLocaleLowerCase('id');
        const genres = card.dataset.genre || '';
        card.hidden = !(title.includes(query) && (genre === 'all' || genres.split(' ').includes(genre)));
      });
    }
    search.addEventListener('input', filterStories);
    document.querySelectorAll('[data-genre]').forEach(btn => btn.addEventListener('click', () => {
      genre = btn.dataset.genre;
      document.querySelectorAll('[data-genre]').forEach(b => b.classList.toggle('is-selected', b === btn));
      filterStories();
    }));
  }

  if (page === 'creator') {
    let mode = 'writing';
    const draftKey = 'narativa-creator-drafts';
    const draftList = () => safeStore.get(draftKey, []);
    function updateCount() { $('projectCount').textContent = String(draftList().length); }
    function setMode(next) {
      mode = next;
      document.querySelectorAll('[data-studio]').forEach(btn => {
        const selected = btn.dataset.studio === mode;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', String(selected));
      });
      $('workTextLabel').textContent = mode === 'comic' ? 'Premis / ringkasan panel' : 'Benih cerita / naskah';
      $('workText').placeholder = mode === 'comic' ? 'Jelaskan panel, adegan, dialog, dan arah visual…' : 'Tulis ide, dialog, atau adegan…';
      $('creatorNotice').textContent = mode === 'comic' ? 'Workspace komik: susun premis dan outline panel secara lokal.' : 'Workspace naskah: tulis dan susun struktur cerita secara lokal.';
    }
    document.querySelectorAll('[data-studio]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.studio)));
    function saveDraft() {
      const title = $('workTitle').value.trim();
      const body = $('workText').value.trim();
      if (!title || !body) { $('creatorNotice').textContent = 'Isi judul dan materi karya sebelum menyimpan.'; return; }
      const drafts = draftList();
      const existing = drafts.findIndex(d => d.title === title && d.mode === mode);
      const item = { title, body, mode, format: $('workFormat').value, visibility: $('workVisibility').value, updatedAt: new Date().toISOString(), rightsOwner: $('rightsOwner').value.trim(), license: $('rightsLicense').value, aiPermission: $('aiPermission').checked };
      if (existing >= 0) drafts[existing] = item; else drafts.unshift(item);
      if (safeStore.set(draftKey, drafts.slice(0, 50))) $('creatorNotice').textContent = 'Draft "' + title + '" tersimpan di perangkat ini. Belum diunggah ke server.';
      else $('creatorNotice').textContent = 'Penyimpanan browser penuh. Ekspor atau salin naskah Anda sebelum menutup halaman.';
      updateCount();
    }
    $('saveDraft').addEventListener('click', saveDraft);
    function outline() {
      const raw = $('workText').value.trim();
      if (raw.length < 40) { $('creatorNotice').textContent = 'Tambahkan materi lebih panjang agar outline awal bisa disusun.'; return; }
      const sentences = raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [raw];
      const chunks = [];
      const count = Math.min(5, Math.max(2, sentences.length));
      for (let i = 0; i < count; i++) {
        const start = Math.floor(i * sentences.length / count);
        const end = Math.floor((i + 1) * sentences.length / count);
        const text = sentences.slice(start, Math.max(start + 1, end)).join(' ').trim();
        if (text) chunks.push(text);
      }
      const result = $('outlineResult'); result.replaceChildren();
      chunks.forEach((text, i) => { const article = document.createElement('article'); const h = document.createElement('h4'); h.textContent = (mode === 'comic' ? 'PANEL / BEAT ' : 'BAGIAN ') + String(i + 1).padStart(2, '0'); const p = document.createElement('p'); p.textContent = text; article.append(h,p); result.appendChild(article); });
      result.hidden = false;
      $('creatorNotice').textContent = 'Outline dibuat oleh aturan lokal sederhana, bukan hasil model AI.';
    }
    $('makeOutline').addEventListener('click', outline);
    $('newComic').addEventListener('click', () => { setMode('comic'); $('workTitle').value = 'Komik baru'; $('workText').value = ''; $('workFormat').value = 'comic'; $('create').scrollIntoView({behavior:'smooth'}); $('workText').focus(); });
    $('newWriting').addEventListener('click', () => { setMode('writing'); $('workTitle').value = 'Naskah baru'; $('workText').value = ''; $('workFormat').value = 'writing'; $('create').scrollIntoView({behavior:'smooth'}); $('workText').focus(); });
    $('assetUpload').addEventListener('change', () => {
      const box = $('assetPreview'); box.replaceChildren();
      const files = Array.from($('assetUpload').files || []);
      if (!files.length) { const p = document.createElement('p'); p.className = 'x-muted'; p.textContent = 'Belum ada berkas dipilih.'; box.appendChild(p); return; }
      files.slice(0, 12).forEach(file => {
        const card = document.createElement('div'); card.className = 'x-asset-item';
        if (file.type.startsWith('image/')) { const img = document.createElement('img'); img.alt = file.name; img.src = URL.createObjectURL(file); img.onload = () => URL.revokeObjectURL(img.src); card.appendChild(img); }
        const name = document.createElement('strong'); name.textContent = file.name; card.appendChild(name);
        const meta = document.createElement('div'); meta.textContent = (file.size / 1024).toFixed(1) + ' KB · preview lokal'; card.appendChild(meta);
        box.appendChild(card);
      });
      const note = document.createElement('p'); note.className = 'x-muted'; note.textContent = files.length > 12 ? 'Menampilkan 12 dari ' + files.length + ' berkas. Berkas tidak diunggah.' : 'Berkas hanya dibaca oleh browser ini; tidak dikirim ke server.'; box.appendChild(note);
    });
    updateCount();
  }

  if (page === 'commerce') {
    const key = 'narativa-commerce-products';
    const products = () => safeStore.get(key, []);
    const money = value => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value || 0));
    function renderProducts() {
      const list = $('productList'); list.replaceChildren();
      const data = products();
      $('commerceCount').textContent = String(data.length);
      if (!data.length) { const empty = document.createElement('div'); empty.className = 'x-empty'; const strong = document.createElement('strong'); strong.textContent = 'Katalog masih kosong'; const p = document.createElement('p'); p.textContent = 'Tambahkan karya untuk menyiapkan metadata awal. Produk akan tersimpan di browser ini saja.'; empty.append(strong,p); list.appendChild(empty); return; }
      data.forEach(item => { const row = document.createElement('article'); row.className = 'x-product-row'; const info = document.createElement('div'); const h = document.createElement('h3'); h.textContent = item.name; const p = document.createElement('p'); p.textContent = item.type + ' · ' + item.rights; info.append(h,p); const price = document.createElement('strong'); price.textContent = money(item.price); row.append(info,price); list.appendChild(row); });
    }
    $('addProduct').addEventListener('click', () => { $('productForm').hidden = !$('productForm').hidden; if (!$('productForm').hidden) $('productName').focus(); });
    $('cancelProduct').addEventListener('click', () => { $('productForm').reset(); $('productForm').hidden = true; });
    $('productForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('productName').value.trim();
      if (!name) return;
      const data = products(); data.unshift({ name, type:$('productType').value, price:Number($('productPrice').value || 0), rights:$('productRights').value, createdAt:new Date().toISOString() });
      if (!safeStore.set(key, data.slice(0,100))) { $('vendorNotice').textContent = 'Penyimpanan browser penuh; produk belum tersimpan.'; return; }
      $('productForm').reset(); $('productForm').hidden = true; renderProducts();
      $('vendorNotice').textContent = 'Produk ditambahkan ke katalog lokal. Belum ada listing vendor yang dibuat.';
    });
    document.querySelectorAll('[data-vendor]').forEach(btn => btn.addEventListener('click', () => {
      $('vendorNotice').textContent = btn.dataset.vendor + ': koneksi belum aktif. Integrasi memerlukan aplikasi vendor, OAuth/API resmi, kebijakan izin, serta penyimpanan token yang aman di server.';
      $('vendorNotice').scrollIntoView({behavior:'smooth',block:'nearest'});
    }));
    renderProducts();
  }
})();