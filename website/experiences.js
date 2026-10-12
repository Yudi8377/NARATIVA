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
      rain: { title:'Perpustakaan di Ujung Hujan', body:'Di kota yang selalu diguyur hujan, seorang penjaga perpustakaan menemukan buku tanpa judul. Setiap halaman berisi kenangan yang belum pernah terjadi. Pada halaman terakhir, ia melihat namanya sendiri, ditulis dengan tinta yang masih basah.' },
      cloud: { title:'Kota di Atas Awan', body:'Di atas kabut yang tak pernah surut, sebuah kota bergerak mengikuti arah angin. Seorang kurir muda menerima paket tanpa alamat. Satu-satunya petunjuk adalah peta yang berubah setiap kali ia berkedip.' },
      archive: { title:'Arsip Tengah Malam', body:'Setiap tengah malam, satu berkas baru muncul di ruang arsip yang telah dikunci selama dua puluh tahun. Detektif Mara menemukan bahwa semua berkas itu mencatat kejadian sehari sebelum terjadi.' }
    };
    const catalog = Array.isArray(window.NARATIVA_READER_CATALOG) ? window.NARATIVA_READER_CATALOG : [];
    const catalogById = new Map(catalog.map(item => [item.id, item]));
    const cloudIds = new Set();
    let active = 'rain';
    let activeItem = null;
    let readerPages = [];
    let readerPageIndex = 0;
    const readerPageSize = 9000;
    const modal = $('readerModal');
    const grid = $('storyGrid');
    const readerViewToggle = $('readerViewToggle');
    function setReaderView(full) {
      modal.classList.toggle('x-reader-modal--full', !!full);
      modal.classList.toggle('x-reader-modal--half', !full);
      readerViewToggle.setAttribute('aria-pressed', String(!!full));
      readerViewToggle.textContent = full ? '▣ Setengah layar' : '⛶ Layar penuh';
      safeStore.set('narativa-reader-view', full ? 'full' : 'half');
    }
    function closeReader() {
      modal.hidden = true;
      document.body.classList.remove('x-reader-open');
    }

    function openStory(id) {
      active = stories[id] || catalogById.has(id) || cloudIds.has(id) ? id : 'rain';
      const item = catalogById.get(active);
      activeItem = item || null;
      // Every catalog work opens in the same standalone interactive-book experience.
      // The catalogue stays separate; if a popup is blocked, navigate to the book reader in this tab.
      if (item) {
        const bookUrl = 'book-reader.html?work=' + encodeURIComponent(item.id);
        const popupWidth = Math.min(1000, Math.round((window.screen?.availWidth || 1440) * 0.66));
        const popupHeight = Math.min(920, Math.round((window.screen?.availHeight || 960) * 0.88));
        const popupLeft = Math.max(0, Math.round(((window.screen?.availWidth || popupWidth) - popupWidth) / 2));
        const popupTop = Math.max(0, Math.round(((window.screen?.availHeight || popupHeight) - popupHeight) / 2));
        const popupFeatures = 'popup=yes,width=' + popupWidth + ',height=' + popupHeight + ',left=' + popupLeft + ',top=' + popupTop + ',resizable=yes,scrollbars=no';
        const popup = window.open(bookUrl, 'narativa-book-' + item.id, popupFeatures);
        if (popup) {
          try { popup.focus(); } catch (_) {}
          return;
        }
        window.location.assign(bookUrl);
        return;
      }
      if (stories[active]) {
        const bookUrl = 'book-reader.html?story=' + encodeURIComponent(active);
        const popupWidth = Math.min(1000, Math.round((window.screen?.availWidth || 1440) * 0.66));
        const popupHeight = Math.min(920, Math.round((window.screen?.availHeight || 960) * 0.88));
        const popupLeft = Math.max(0, Math.round(((window.screen?.availWidth || popupWidth) - popupWidth) / 2));
        const popupTop = Math.max(0, Math.round(((window.screen?.availHeight || popupHeight) - popupHeight) / 2));
        const popupFeatures = 'popup=yes,width=' + popupWidth + ',height=' + popupHeight + ',left=' + popupLeft + ',top=' + popupTop + ',resizable=yes,scrollbars=no';
        const popup = window.open(bookUrl, 'narativa-story-' + active, popupFeatures);
        if (popup) {
          try { popup.focus(); } catch (_) {}
          return;
        }
        window.location.assign(bookUrl);
        return;
      }
      const story = stories[active] || {title:item?.title || 'Karya NARATIVA',body:item?.description || 'Karya terbit dari katalog NARATIVA.'};
      $('readerTitle').textContent = story.title;
      $('readerBody').textContent = story.body;
      $('readerLocalPanel').hidden = true;
      $('readerBody').hidden = false;
      $('readerPrevPage').disabled = true;
      $('readerNextPage').disabled = true;
      readerPages = []; readerPageIndex = 0;
      $('readerDetails').textContent = item ? [
        'Penulis: ' + item.author,
        'Kategori: ' + item.category.toUpperCase() + ' · Genre: ' + item.genre,
        'Jenis: ' + item.format + ' · Tahun: ' + item.year,
        'Bahasa: ' + item.language,
        'Hak penggunaan: ' + item.rights
      ].join('  |  ') : (cloudIds.has(active) ? 'Karya kreator NARATIVA · baca versi terbit' : 'Cerita demo orisinal NARATIVA · contoh pengalaman membaca');
      const source = $('readerSource');
      const sourceUrl = (item?.contentUrl || item?.localPages || item?.localPlayerUrl) ? null : (item?.read || item?.source || null);
      source.hidden = !sourceUrl;
      if (sourceUrl) {
        source.href = sourceUrl;
        source.textContent = item?.sourceLabel || (item?.category === 'komik' ? 'Buka arsip komik ↗' : 'Baca sumber asli ↗');
      }
      $('readerNotice').textContent = (item?.contentUrl || item?.localPages || item?.localPlayerUrl) ? 'Karya tersedia secara lokal di NARATIVA. Periksa catatan lisensi sebelum menggunakan ulang.' : item ? 'Tautan menuju arsip sumber. Status hak pada halaman sumber perlu diperiksa sebelum mengunduh atau menerbitkan ulang.' : (cloudIds.has(active) ? 'Karya terbit dari katalog NARATIVA. Progres baca disimpan di perangkat.' : 'Konten demo orisinal. Riwayat baca hanya disimpan di perangkat ini.');
      $('nextStory').hidden = !!item || cloudIds.has(active);
      modal.hidden = false;
      document.body.classList.add('x-reader-open');
      setReaderView(safeStore.get('narativa-reader-view', 'half') === 'full');
      $('closeReader').focus();
      safeStore.set('narativa-reader-last', { id: active, progress: 0, page: 0, at: new Date().toISOString() });
      if (item?.contentUrl || item?.localPages || item?.localPlayerUrl) loadLocalBook(item);
    }

    async function loadLocalBook(item) {
      const localPanel = $('readerLocalPanel');
      $('readerBody').hidden = true;
      localPanel.hidden = false;
      $('readerContent').replaceChildren();
      $('readerContent').textContent = 'Memuat konten lokal…';
      try {
        if (item.localPlayerUrl) {
          const frame = document.createElement('iframe');
          frame.src = item.localPlayerUrl; frame.title = item.title; frame.loading = 'lazy';
          frame.style.cssText = 'display:block;width:100%;height:min(70vh,620px);border:0;border-radius:10px;background:#10151d';
          $('readerContent').replaceChildren(frame);
          $('readerPageStatus').textContent = 'Animasi lokal · lima adegan';
          $('readerPrevPage').disabled = true; $('readerNextPage').disabled = true;
          return;
        }
        if (Array.isArray(item.localPages) && item.localPages.length) {
          readerPages = item.localPages.slice(); readerPageIndex = 0; renderLocalPage(); return;
        }
        const response = await fetch(item.contentUrl);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const text = await response.text();
        const normalized = text.replace(/\\r/g, '').trim();
        const paragraphs = normalized.split(/\\n{2,}/).map(part => part.trim()).filter(Boolean);
        readerPages = []; let pageText = '';
        for (const paragraph of paragraphs) {
          const next = pageText ? pageText + '\\n\\n' + paragraph : paragraph;
          if (next.length > readerPageSize && pageText) { readerPages.push(pageText); pageText = paragraph; }
          else pageText = next;
        }
        if (pageText) readerPages.push(pageText);
        if (!readerPages.length) readerPages = [normalized];
        readerPageIndex = 0; renderLocalPage();
      } catch (error) {
        $('readerContent').textContent = 'Naskah lokal belum dapat dimuat. Coba muat ulang halaman.';
      }
    }
    function renderLocalPage() {
      if (activeItem?.localPages) {
        const img = document.createElement('img');
        img.src = activeItem.localPages[readerPageIndex]; img.alt = activeItem.title + ' — halaman ' + (readerPageIndex + 1);
        img.loading = 'eager'; img.style.cssText = 'display:block;width:min(100%,640px);height:auto;margin:0 auto;border-radius:8px;background:#f5f1e8';
        $('readerContent').replaceChildren(img);
        $('readerPageStatus').textContent = 'Halaman ' + (readerPageIndex + 1) + ' dari ' + readerPages.length;
      } else {
        $('readerContent').textContent = readerPages[readerPageIndex] || '';
        $('readerPageStatus').textContent = 'Bagian ' + (readerPageIndex + 1) + ' dari ' + readerPages.length;
      }
      $('readerPrevPage').disabled = readerPageIndex <= 0;
      $('readerNextPage').disabled = readerPageIndex >= readerPages.length - 1;
      safeStore.set('narativa-reader-last', {id:active,progress:readerPages.length ? Math.round((readerPageIndex + 1) / readerPages.length * 100) : 0,page:readerPageIndex,at:new Date().toISOString()});
    }
    $('readerPrevPage').addEventListener('click', () => { if (readerPageIndex > 0) { readerPageIndex--; renderLocalPage(); $('readerContent').scrollIntoView({block:'start',behavior:'smooth'}); } });
    $('readerNextPage').addEventListener('click', () => { if (readerPageIndex < readerPages.length - 1) { readerPageIndex++; renderLocalPage(); $('readerContent').scrollIntoView({block:'start',behavior:'smooth'}); } });

    function renderCatalog() {
      grid.replaceChildren();
      catalog.forEach(item => {
        stories[item.id] = {title:item.title,body:item.description};
        const card = document.createElement('article');
        card.className = 'x-story-card';
        card.dataset.title = item.title;
        card.dataset.genre = item.category;
        const genreText = (item.genre + ' ' + item.title + ' ' + item.description).toLocaleLowerCase('id');
        const tags = [];
        if (item.category === 'fantasi' || /fantasi|fairy|wonderland|oz|mars|goblin/.test(genreText)) tags.push('fantasi');
        if (/aksi|action|petualangan|adventure/.test(genreText)) tags.push('action','petualangan');
        if (item.category === 'manga' || item.category === 'anime') tags.push('sci-fi','petualangan');
        if (item.category === 'misteri' || /misteri|mystery|detectif|detektif|investigasi|sherlock|pembunuhan|ruang terkunci/.test(genreText)) tags.push('detektif','thriller');
        if (/horor|horror|gotik|gothic|nightmare|frankenstein|invisible man|jekyll|poe/.test(genreText)) tags.push('horor','gotik');
        if (/romantis|romansa|romance|phantom of the opera|love|cinta/.test(genreText)) tags.push('romantis');
        if (/petualangan|adventure|ekspedisi|planetary|perjalanan waktu|konspirasi|pencurian/.test(genreText)) tags.push('action','petualangan');
        if (/humor|komedi|satire|nonsense|slapstick/.test(genreText)) tags.push('komedi');
        if (/fiksi ilmiah|science fiction|perjalanan waktu|planetary/.test(genreText)) tags.push('sci-fi');
        if (/anak|dongeng|fairy|jungle book|alice/.test(genreText)) tags.push('anak');
        if (/satire/.test(genreText)) tags.push('satire');
        if (/sejarah|historical/.test(genreText)) tags.push('sejarah');
        card.dataset.tags = [...new Set(tags)].join(' ');
        const type = ['komik','manga','manhwa','anime'].includes(item.category) ? item.category : (/cerpen/.test(item.format.toLocaleLowerCase('id')) ? 'cerpen' : (/kumpulan|antologi/.test(item.format.toLocaleLowerCase('id')) ? 'antologi' : 'novel'));
        card.dataset.type = type;
        card.dataset.search = [item.title,item.author,item.genre,item.format,item.year,item.language].join(' ').toLocaleLowerCase('id');
        const cover = document.createElement('div');
        cover.className = 'x-cover ' + (item.category === 'komik' ? 'cover-cloud' : item.category === 'fantasi' ? 'cover-rain' : 'cover-midnight');
        const emblem = document.createElement('span'); emblem.className = 'x-catalog-emoji'; emblem.textContent = item.emoji || '✦';
        const label = document.createElement('span'); label.textContent = item.category.toUpperCase() + ' · ' + item.year;
        const title = document.createElement('b'); title.textContent = item.title.toUpperCase();
        const footer = document.createElement('small'); footer.textContent = 'TERSIMPAN DI NARATIVA · ' + item.format.toUpperCase();
        cover.append(emblem,label,title,footer);
        const meta = document.createElement('div'); meta.className = 'x-story-meta';
        const category = document.createElement('span'); category.textContent = item.category.toUpperCase() + ' · ' + item.format.toUpperCase();
        const year = document.createElement('span'); year.textContent = item.year;
        meta.append(category,year);
        const heading = document.createElement('h3'); heading.textContent = item.title;
        const description = document.createElement('p'); description.textContent = item.description;
        const author = document.createElement('small'); author.className = 'x-story-author'; author.textContent = item.author + ' · ' + item.genre;
        const button = document.createElement('button'); button.type = 'button'; button.className = 'x-text-button'; button.dataset.read = item.id; button.textContent = 'Baca di NARATIVA →';
        card.append(cover,meta,heading,description,author,button);
        grid.appendChild(card);
      });
      $('catalogCount').textContent = catalog.length + ' karya contoh tersedia langsung di NARATIVA · media lokal, tanpa tautan baca pihak ketiga.';
    }

    $('storyGrid').addEventListener('click', event => {
      const btn = event.target.closest('[data-read]');
      if (btn) openStory(btn.dataset.read);
    });
    document.querySelectorAll('[data-read]').forEach(btn => {
      if (btn.closest('#storyGrid')) return;
      btn.addEventListener('click', () => openStory(btn.dataset.read));
    });
    $('closeReader').addEventListener('click', closeReader);
    $('readerExit').addEventListener('click', closeReader);
    readerViewToggle.addEventListener('click', () => setReaderView(!modal.classList.contains('x-reader-modal--full')));
    modal.addEventListener('click', event => { if (event.target === modal) closeReader(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeReader(); });
    $('readerDownload').addEventListener('click', async () => {
      const item = activeItem;
      if (!item) {
        $('readerNotice').textContent = 'Unduh belum tersedia untuk cerita demo ini. Pada layanan terbit, unduhan akan mengikuti lisensi dan syarat penggunaan karya.';
        return;
      }
      if (item.localPages?.length && item.license === 'CC BY 4.0') {
        try {
          const path = item.localPages[readerPageIndex] || item.localPages[0];
          const response = await fetch(path);
          if (!response.ok) throw new Error('File tidak tersedia');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a'); link.href = url;
          link.download = item.id + '-halaman-' + String(readerPageIndex + 1).padStart(2, '0') + '.svg';
          document.body.appendChild(link); link.click(); link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          $('readerNotice').textContent = 'Sampel halaman diunduh. Ini karya demo CC BY 4.0; atribusi tetap diperlukan. Pembayaran dan pembagian pendapatan belum diaktifkan pada prototipe.';
        } catch (_) {
          $('readerNotice').textContent = 'File sampel belum berhasil diunduh. Coba lagi setelah halaman selesai dimuat.';
        }
        return;
      }
      $('readerNotice').textContent = 'Unduhan untuk karya ini belum dibuka. Akses unduh berbayar nantinya memerlukan persetujuan kreator, harga, lisensi, syarat penggunaan, serta pembagian pendapatan yang jelas.';
    });
    $('saveStory').addEventListener('click', () => {
      const saved = safeStore.get('narativa-reader-saved', []);
      const title = stories[active]?.title || catalogById.get(active)?.title || 'Karya NARATIVA';
      if (!saved.some(item => item.id === active)) saved.push({id:active,title});
      safeStore.set('narativa-reader-saved', saved);
      renderSaved();
      $('readerNotice').textContent = 'Disimpan ke daftar pada perangkat ini.';
    });
    $('nextStory').addEventListener('click', () => openStory(active === 'rain' ? 'cloud' : active === 'cloud' ? 'archive' : 'rain'));
    function renderSaved() {
      const saved = safeStore.get('narativa-reader-saved', []);
      $('savedStatus').replaceChildren();
      if (!saved.length) { $('savedStatus').textContent = 'Belum ada cerita yang disimpan pada perangkat ini.'; return; }
      saved.forEach(item => {
        const row = document.createElement('p'); row.className = 'x-muted'; row.textContent = '▸ ' + item.title;
        $('savedStatus').appendChild(row);
      });
    }
    renderCatalog();
    renderSaved();
    const search = $('readerSearch');
    let category = 'all';
    const genreFilter = $('readerGenreFilter');
    function filterStories() {
      const query = search.value.trim().toLocaleLowerCase('id');
      let visibleCount = 0;
      document.querySelectorAll('.x-story-card').forEach(card => {
        const haystack = ((card.dataset.search || '') + ' ' + (card.dataset.title || '') + ' ' + (card.dataset.genre || '')).toLocaleLowerCase('id');
        const genres = (card.dataset.genre || '').split(' ');
        const tags = (card.dataset.tags || '').split(' ');
        const categoryMatch = category === 'all' || genres.includes(category) || card.dataset.type === category || (category === 'cerpen' && card.dataset.type === 'antologi');
        const genreMatch = genreFilter.value === 'all' || tags.includes(genreFilter.value);
        card.hidden = !(haystack.includes(query) && categoryMatch && genreMatch);
        if (!card.hidden) visibleCount++;
      });
      $('readerEmpty').hidden = visibleCount > 0;
      $('catalogCount').textContent = visibleCount + ' karya contoh ditampilkan · semua konten katalog presentasi dibaca dari NARATIVA.';
    }
    search.addEventListener('input', filterStories);
    genreFilter.addEventListener('change', filterStories);
    document.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => {
      category = btn.dataset.category;
      document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('is-selected', b === btn));
      filterStories();
    }));

    const db = window.supabase?.createClient?.('https://hdsqwkydgruyfbqqwhdk.supabase.co', 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8');
    async function loadPublishedWorks() {
      if (!db) return;
      const {data,error} = await db.from('books').select('id,title,description,content_type,language_code,slug,updated_at').eq('status','published').order('updated_at',{ascending:false}).limit(60);
      if (error) {
        const note = document.createElement('p'); note.className = 'x-feedback'; note.textContent = 'Karya kreator belum dapat dimuat; katalog klasik tetap tersedia.';
        grid.prepend(note); return;
      }
      for (const book of (data || [])) {
        const {data:versions} = await db.from('book_versions').select('canonical_content,version_number').eq('book_id',book.id).order('version_number',{ascending:false}).limit(1);
        const canonical = versions?.[0]?.canonical_content || {};
        const body = typeof canonical.body === 'string' ? canonical.body : (book.description || 'Naskah ini belum memiliki isi yang dapat ditampilkan.');
        const id = 'cloud-' + book.id;
        stories[id] = {title:book.title,body};
        cloudIds.add(id);
        const card = document.createElement('article'); card.className = 'x-story-card';
        card.dataset.title = book.title; card.dataset.genre = 'karya-kreator';
        card.dataset.search = [book.title,book.description,book.content_type,book.language_code].join(' ').toLocaleLowerCase('id');
        const cover = document.createElement('div'); cover.className = 'x-cover cover-cloud';
        const label = document.createElement('span'); label.textContent = String(book.content_type || 'KARYA').replaceAll('_',' ').toUpperCase();
        const name = document.createElement('b'); name.textContent = book.title.toUpperCase();
        const footer = document.createElement('small'); footer.textContent = 'NARATIVA · TERBIT';
        cover.append(label,name,footer);
        const meta = document.createElement('div'); meta.className = 'x-story-meta';
        const type = document.createElement('span'); type.textContent = book.language_code === 'id' ? 'BAHASA INDONESIA' : String(book.language_code || 'KARYA').toUpperCase();
        const status = document.createElement('span'); status.textContent = 'TERBIT';
        meta.append(type,status);
        const heading = document.createElement('h3'); heading.textContent = book.title;
        const desc = document.createElement('p'); desc.textContent = book.description || body.slice(0,160);
        const button = document.createElement('button'); button.className = 'x-text-button'; button.type = 'button'; button.dataset.read = id; button.textContent = 'Baca karya →';
        card.append(cover,meta,heading,desc,button); grid.prepend(card);
      }
      filterStories();
    }
    loadPublishedWorks();
  }

  if (page === 'creator') {
    let mode = 'writing';
    const draftKey = 'narativa-creator-drafts';
    const draftList = () => safeStore.get(draftKey, []);
    const db = window.supabase?.createClient?.('https://hdsqwkydgruyfbqqwhdk.supabase.co', 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8');
    let signedInUser = null;
    let cloudBooks = [];
    let activeBookId = null;
    let lastStoryboard = null;
    const slugify = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64) || 'karya';
    const contentType = value => ({writing:'novel',comic:'comic',audio:'audio_drama',photo:'other',illustration:'other',video:'other','3d':'other',other:'other'}[value] || 'other');
    function setNotice(message, kind) {
      $('creatorNotice').textContent = message;
      $('creatorNotice').dataset.kind = kind || 'info';
    }
    function updateCount() { $('projectCount').textContent = String(cloudBooks.length || draftList().length); }
    const studioSpecs = {
      writing: {format:'writing', eyebrow:'NOVEL & NASKAH', title:'Bangun cerita sampai siap disunting', description:'Susun premis, karakter, konflik, bab, lalu simpan naskah sebagai karya privat.', label:'Naskah / isi bab', placeholder:'Tulis premis, sinopsis, bab, dialog, atau narasi…', sample:'# Bab 1 — Pemantik\n\nPerkenalkan tokoh utama, keinginannya, dunia cerita, dan masalah yang mengganggu keseimbangan hidupnya.', goal:'Contoh: 8 bab, sudut pandang orang pertama', style:'Realistis dan natural', foot:'Alat tersedia: Wizard cerita, format teks, cari/ganti, riwayat edit, ekspor Markdown, cetak.'},
      comic: {format:'comic', eyebrow:'KOMIK & WEBTOON', title:'Ubah cerita menjadi halaman dan panel', description:'Tulis beat per panel: komposisi, ekspresi, latar, dialog, SFX, dan transisi halaman.', label:'Skenario panel / dialog', placeholder:'HALAMAN 1\nPanel 1 — establishing shot: ...\nVisual: ...\nDialog: ...\nSFX: ...', sample:'HALAMAN 1\nPanel 1 — Wide shot: kota saat hujan.\nVisual: lampu toko memantul di jalan basah.\nNarasi: “Hujan menyimpan rahasia yang tak pernah selesai.”\nPanel 2 — Close-up: tangan membuka buku tanpa judul.\nDialog: “Buku ini belum pernah ada kemarin.”', goal:'Contoh: 6 panel per halaman, gaya manga', style:'Stylized / ilustratif', foot:'Alat tersedia: outline/storyboard, skrip panel, aset gambar, metadata hak karya. Generasi gambar panel otomatis memerlukan provider gambar.'},
      video: {format:'video', eyebrow:'AI VIDEO STUDIO', title:'Rancang video dari naskah hingga shot list', description:'Susun logline, rasio, durasi, gaya visual, shot, gerak kamera, dialog, musik, dan kebutuhan kontinuitas.', label:'Skenario / treatment video', placeholder:'JUDUL: ...\nDURASI: 60 detik\nRASIO: 16:9\nSHOT 01 (0–5s): wide shot, lokasi, gerak kamera...\nVISUAL: ...\nDIALOG / VO: ...\nAUDIO: ...\nTRANSISI: ...', sample:'JUDUL: Perpustakaan di Ujung Hujan\nDURASI: 60 detik · RASIO: 16:9\nSHOT 01 (0–5s) — ESTABLISHING: kota malam, hujan di jalan, kamera dolly-in perlahan.\nSHOT 02 (5–12s) — MEDIUM: penjaga perpustakaan menemukan buku tanpa judul.\nSHOT 03 (12–20s) — INSERT: tinta bergerak sendiri di atas halaman.\nVO: “Ada kenangan yang datang sebelum waktunya.”\nAUDIO: hujan, ambience perpustakaan, piano minimal.\nTRANSISI: match cut dari tinta ke langit gelap.', goal:'Contoh: 60 detik, 16:9, 8 shot', style:'Sinematik', foot:'Pipeline storyboard dapat memetakan adegan bila backend story-pipeline aktif dan Anda memberi izin pemrosesan. Render video AI final belum aktif tanpa konektor model video.'},
      '3d': {format:'3d', eyebrow:'3D & WORLD BUILDER', title:'Spesifikasikan objek, karakter, atau dunia 3D', description:'Buat brief geometri, skala, topologi, material, rig, animasi, pencahayaan, kamera, dan format ekspor.', label:'Brief objek / scene 3D', placeholder:'OBJEK: ...\nSKALA: ...\nSILUET & GEOMETRI: ...\nMATERIAL / TEKSTUR: ...\nRIG / ANIMASI: ...\nLINGKUNGAN & CAHAYA: ...\nKAMERA: ...\nEKSPOR: GLB / GLTF / OBJ / STL', sample:'OBJEK: penjaga perpustakaan bergaya semi-realistis\nSKALA: tinggi 1,75 m\nGEOMETRI: mantel panjang, buku tua di tangan kanan, proporsi natural\nMATERIAL: kain matte, kulit, kertas usang, detail basah pada mantel\nRIG: humanoid, idle breathing, menoleh ke buku\nCAHAYA: key light hangat dari lampu meja, fill biru dari jendela hujan\nKAMERA: 50 mm, medium shot, eye level\nEKSPOR: GLB untuk web preview', goal:'Contoh: karakter 1,75 m, GLB, rig humanoid', style:'Realistis dan natural', foot:'Impor aset 3D tersedia melalui Asset Inbox. Generasi mesh, rigging, dan render 3D baru memerlukan engine/provider 3D; brief ini bukan file mesh otomatis.'},
      audio: {format:'audio', eyebrow:'AUDIO DRAMA & NARASI', title:'Rancang narasi, dialog, dan lanskap suara', description:'Tentukan narator, karakter suara, emosi, tempo, ambience, efek, dan cue musik per adegan.', label:'Naskah narasi / audio drama', placeholder:'NARATOR (hangat, pelan): ...\nTOKOH A (cemas): ...\nSFX: hujan di jendela\nMUSIK: piano minimal, fade in 3 detik\nJEDA: 1,5 detik', sample:'NARATOR (hangat, intim; tempo 0,9x): “Di kota yang selalu diguyur hujan...”\nSFX: hujan di kaca, halaman buku dibalik.\nTOKOH — MARA (berbisik, penasaran): “Siapa yang menulis namaku?”\nMUSIK: piano minimal masuk perlahan, berhenti pada kata terakhir.\nMIX: dialog di depan, ambience -18 LUFS, musik turun saat dialog.', goal:'Contoh: narator perempuan, drama misteri, 3 menit', style:'Misterius dan emosional', foot:'Naskah dan cue audio dapat disiapkan. Sintesis suara, cloning suara, dan mixing otomatis memerlukan provider audio yang tersambung.'},
      learning: {format:'other', eyebrow:'BUKU HIDUP & AR EDUKASI', title:'Ubah materi belajar menjadi pengalaman interaktif', description:'Rancang tujuan belajar, halaman pemicu, objek 3D, kalimat audio, interaksi, dan indikator pemahaman.', label:'Materi / skenario buku hidup', placeholder:'TUJUAN BELAJAR: ...\nHALAMAN CETAK: ...\nOBJEK PEMICU: ...\nANIMASI: ...\nAUDIO / KALIMAT: ...\nINTERAKSI SISWA: ...\nPENILAIAN: ...', sample:'TUJUAN BELAJAR: mengenal huruf A dan kosakata apple.\nHALAMAN CETAK: huruf A besar, gambar anak, gambar apel.\nOBJEK PEMICU: ilustrasi apel pada halaman.\nANIMASI: apel muncul dari halaman, berputar perlahan, lalu kembali ke posisi.\nAUDIO: suara ramah anak: “A untuk apple.”\nINTERAKSI: siswa mengetuk apel untuk mengulang suara.\nPENILAIAN: pilih gambar yang dimulai dengan bunyi A.', goal:'Contoh: kelas 1 SD, 1 halaman, 1 interaksi', style:'Untuk anak-anak', foot:'Modul menyiapkan desain pengalaman dan aset. Pelacakan marker kamera/AR real-time memerlukan runtime AR dan aset 3D yang belum dipasang.'}
    };
    function setMode(next) {
      mode = studioSpecs[next] ? next : 'writing';
      const spec = studioSpecs[mode];
      document.querySelectorAll('[data-studio]').forEach(btn => {
        const selected = btn.dataset.studio === mode;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', String(selected));
      });
      document.querySelectorAll('[data-launch-studio]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.launchStudio === mode));
      $('workFormat').value = spec.format;
      $('workTextLabel').textContent = spec.label;
      $('workText').placeholder = spec.placeholder;
      $('studioBriefEyebrow').textContent = spec.eyebrow;
      $('studioBriefTitle').textContent = spec.title;
      $('studioBriefDescription').textContent = spec.description;
      $('studioGoal').placeholder = spec.goal;
      $('studioStyle').value = spec.style;
      $('studioBriefFoot').textContent = spec.foot;
      const dedicated = ['comic','video','3d','audio','learning'].includes(mode);
      $('dedicatedWorkspace').hidden = !dedicated;
      document.querySelectorAll('.x-generic-only').forEach(el => { el.hidden = dedicated; });
      document.querySelectorAll('[data-special-form]').forEach(el => { el.hidden = el.dataset.specialForm !== mode; });
      document.querySelectorAll('[data-build-workspace]').forEach(el => { el.hidden = el.dataset.buildWorkspace !== mode; });
      $('openStoryWizard').hidden = dedicated;
      $('makeOutline').hidden = dedicated;
      $('makeOutline').textContent = mode === 'writing' ? 'Susun storyboard' : mode === 'comic' ? 'Susun storyboard panel' : mode === 'video' ? 'Susun shot list' : mode === '3d' ? 'Spesifikasi 3D' : mode === 'audio' ? 'Cue sheet audio' : 'Alur buku hidup';
      $('saveDraft').textContent = dedicated ? 'Simpan proyek & hasil' : 'Simpan ke cloud';
      $('publishWork').textContent = dedicated ? 'Pratinjau / ajukan terbit' : 'Pratinjau & terbitkan';
      document.querySelector('.x-format-block').hidden = dedicated;
      $('dedicatedOutput').hidden = true;
      if (!dedicated && (!editor.value.trim() || editor.dataset.lastStudioSample === 'true')) {
        editor.value = spec.sample;
        editor.dataset.lastStudioSample = 'true';
        updateEditorCount();
      }
      setNotice(dedicated ? 'Workspace khusus ' + spec.eyebrow + ' aktif. Isi parameter, buat hasil kerja, lalu simpan proyek.' : 'Modul ' + spec.eyebrow + ' aktif. Editor naskah dan Wizard tersedia untuk mode ini.', 'info');
    }
    document.querySelectorAll('[data-studio]').forEach(btn => btn.addEventListener('click', () => { setMode(btn.dataset.studio); $('create').scrollIntoView({behavior:'smooth',block:'start'}); }));
    document.querySelectorAll('[data-launch-studio]').forEach(btn => btn.addEventListener('click', () => { setMode(btn.dataset.launchStudio); $('create').scrollIntoView({behavior:'smooth',block:'start'}); }));

    // Creator editor: Markdown toolbar, local undo/redo, manuscript export and story wizard.
    const editor = $('workText');
    let editHistory = [editor.value];
    let editHistoryIndex = 0;
    let historyTimer = null;
    function rememberEdit() {
      if (editHistory[editHistoryIndex] !== editor.value) {
        editHistory = editHistory.slice(0, editHistoryIndex + 1);
        editHistory.push(editor.value);
        if (editHistory.length > 100) editHistory.shift();
        editHistoryIndex = editHistory.length - 1;
      }
      updateEditorCount();
    }
    function updateEditorCount() {
      const text = editor.value;
      const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
      $('editorWordCount').textContent = words.toLocaleString('id-ID') + ' kata · ' + text.length.toLocaleString('id-ID') + ' karakter';
    }
    function applyEdit(next, start, end) {
      editor.setRangeText(next, start, end, 'select');
      editor.focus();
      rememberEdit();
      lastStoryboard = null;
    }
    function formatSelection(format) {
      const start = editor.selectionStart, end = editor.selectionEnd;
      const selected = editor.value.slice(start, end);
      if (format === 'divider') { applyEdit((start && editor.value[start-1] !== '\n' ? '\n' : '') + '\n---\n', start, end); return; }
      if (['ul','ol','quote','heading'].includes(format)) {
        const lineStart = editor.value.lastIndexOf('\n', Math.max(0,start-1)) + 1;
        const lineEndRaw = editor.value.indexOf('\n', end);
        const lineEnd = lineEndRaw < 0 ? editor.value.length : lineEndRaw;
        const block = editor.value.slice(lineStart,lineEnd);
        const prefix = format === 'ul' ? '- ' : format === 'ol' ? '1. ' : format === 'quote' ? '> ' : '## ';
        const changed = block.split('\n').map((line,i) => {
          const clean = line.replace(/^(?:[-*+]\s+|\d+\.\s+|>\s+|#{1,6}\s+)/,'');
          return prefix + clean;
        }).join('\n');
        applyEdit(changed,lineStart,lineEnd); editor.setSelectionRange(lineStart,lineStart+changed.length); return;
      }
      const marker = format === 'bold' ? '**' : '*';
      if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length*2) {
        applyEdit(selected.slice(marker.length,-marker.length),start,end);
        editor.setSelectionRange(start,start+selected.length-marker.length*2);
      } else {
        applyEdit(marker + selected + marker,start,end);
        editor.setSelectionRange(start+marker.length,start+marker.length+selected.length);
      }
    }
    document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => formatSelection(button.dataset.format)));
    editor.addEventListener('input', () => {
      clearTimeout(historyTimer);
      historyTimer = setTimeout(rememberEdit, 120);
      updateEditorCount();
      lastStoryboard = null;
    });
    $('undoEdit').addEventListener('click', () => {
      clearTimeout(historyTimer);
      if (editHistory[editHistoryIndex] !== editor.value) rememberEdit();
      if (editHistoryIndex > 0) { editHistoryIndex--; editor.value = editHistory[editHistoryIndex]; editor.focus(); updateEditorCount(); lastStoryboard = null; }
    });
    $('redoEdit').addEventListener('click', () => {
      clearTimeout(historyTimer);
      if (editHistoryIndex < editHistory.length-1) { editHistoryIndex++; editor.value = editHistory[editHistoryIndex]; editor.focus(); updateEditorCount(); lastStoryboard = null; }
    });
    editor.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'b') { event.preventDefault(); formatSelection('bold'); }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'i') { event.preventDefault(); formatSelection('italic'); }
    });
    $('findReplaceToggle').addEventListener('click', () => { $('findReplacePanel').hidden = !$('findReplacePanel').hidden; if (!$('findReplacePanel').hidden) $('findText').focus(); });
    $('closeFindReplace').addEventListener('click', () => { $('findReplacePanel').hidden = true; });
    $('applyReplace').addEventListener('click', () => {
      const find = $('findText').value;
      if (!find) { setNotice('Masukkan teks yang ingin dicari.', 'error'); return; }
      const source = editor.value;
      const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      const matches = source.match(re)?.length || 0;
      if (!matches) { setNotice('Teks tidak ditemukan.', 'info'); return; }
      editor.value = source.replace(re, $('replaceText').value);
      rememberEdit(); lastStoryboard = null;
      setNotice(matches + ' kemunculan berhasil diganti. Periksa kembali hasilnya.', 'success');
    });
    $('toggleFocus').addEventListener('click', () => {
      $('create').classList.toggle('x-focus-mode');
      $('toggleFocus').textContent = $('create').classList.contains('x-focus-mode') ? '↙ Keluar fokus' : '⛶';
    });
    $('downloadManuscript').addEventListener('click', () => {
      const title = $('workTitle').value.trim() || 'naskah-narativa';
      const blob = new Blob(['# ' + title + '\n\n' + editor.value + '\n'], {type:'text/markdown;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = slugify(title) + '.md'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Naskah Markdown diunduh ke perangkat ini.', 'success');
    });
    $('printManuscript').addEventListener('click', () => {
      const popup = window.open('', '_blank', 'width=900,height=700');
      if (!popup) { setNotice('Jendela cetak diblokir browser. Izinkan pop-up untuk mencetak naskah.', 'error'); return; }
      popup.opener = null;
      const safeTitle = $('workTitle').value.trim() || 'Naskah NARATIVA';
      const escapedTitle = safeTitle.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      const escapedBody = editor.value.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      popup.document.write('<!doctype html><html lang="id"><head><meta charset="utf-8"><title>'+escapedTitle+'</title><style>body{font:12pt/1.7 Georgia,serif;max-width:760px;margin:48px auto;padding:0 24px;white-space:pre-wrap}h1{font-size:24pt} @media print{body{margin:0 auto}}</style></head><body><h1>'+escapedTitle+'</h1><main>'+escapedBody+'</main><script>window.onload=()=>window.print()<\/script></body></html>');
      popup.document.close();
    });
    const wizardModal = $('storyWizardModal');
    let wizardDraft = '';
    function closeWizard() { wizardModal.hidden = true; $('openStoryWizard').focus(); }
    $('openStoryWizard').addEventListener('click', () => {
      $('wizardIdea').value = editor.value.trim().slice(0,500);
      wizardModal.hidden = false; $('wizardIdea').focus();
    });
    $('closeStoryWizard').addEventListener('click', closeWizard);
    $('cancelStoryWizard').addEventListener('click', closeWizard);
    wizardModal.addEventListener('click', e => { if (e.target === wizardModal) closeWizard(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !wizardModal.hidden) closeWizard(); });
    $('generateStoryOutline').addEventListener('click', () => {
      const idea = $('wizardIdea').value.trim();
      if (!idea) { $('wizardIdea').focus(); $('wizardResultSummary').textContent = 'Isi premis terlebih dahulu.'; $('wizardResult').hidden = false; return; }
      const genre = $('wizardGenre').value, audience = $('wizardAudience').value, tone = $('wizardTone').value;
      const hero = $('wizardHero').value.trim() || 'tokoh utama';
      const goal = $('wizardGoal').value.trim() || 'menemukan jawaban atas persoalan yang mengusik hidupnya';
      const obstacle = $('wizardObstacle').value.trim() || 'rahasia yang mengubah pemahamannya tentang dunia';
      const count = Number($('wizardLength').value);
      const stages = [
        ['Pemantik','Sebuah kejadian ganjil mengusik keseimbangan hidup.','Perkenalkan dunia, kebutuhan tokoh, dan pertanyaan yang mendorong cerita.'],
        ['Panggilan','Tokoh memutuskan mencari tahu apa yang sebenarnya terjadi.','Tunjukkan tujuan yang jelas dan alasan pribadi untuk bertindak.'],
        ['Ujian pertama','Petunjuk awal membawa tokoh pada masalah yang lebih besar.','Hadirkan kegagalan kecil, sekutu, dan konsekuensi pilihan.'],
        ['Titik balik','Fakta baru membuat tujuan awal terasa tidak sesederhana dugaan.','Ungkap rahasia atau konflik batin yang mengubah arah cerita.'],
        ['Tekanan meningkat','Waktu, hubungan, atau risiko membuat pilihan makin mahal.','Bangun ketegangan dan paksa tokoh mengorbankan sesuatu.'],
        ['Krisis','Tokoh kehilangan pegangan dan harus menilai ulang keyakinannya.','Buat keputusan terberat muncul dari kelemahan tokoh sendiri.'],
        ['Klimaks','Tokoh menghadapi sumber konflik secara langsung.','Satukan tujuan, risiko, dan perubahan karakter dalam tindakan.'],
        ['Gema akhir','Keputusan tokoh meninggalkan dunia yang berbeda.','Tutup konflik utama dan sisakan gema emosional yang bermakna.']
      ];
      const lines = ['# ' + ($('workTitle').value.trim() || 'Judul sementara'), '', '**Genre:** ' + genre + '  ', '**Pembaca:** ' + audience + '  ', '**Nuansa:** ' + tone, '', '## Premis', idea, '', '## Tokoh utama', hero + ' ingin ' + goal + ', tetapi harus menghadapi ' + obstacle + '.', '', '## Pertanyaan pendorong', 'Apa yang harus dikorbankan ' + hero + ' untuk mencapai tujuannya tanpa kehilangan hal yang paling berarti?', '', '## Kerangka cerita'];
      stages.slice(0,count).forEach((stage,i) => {
        lines.push('', '### ' + (i+1) + '. ' + stage[0], stage[1], '', '**Arah pengembangan:** ' + stage[2], '', '**Adegan yang bisa ditulis:**', '- Pilihan konkret yang dibuat tokoh ' + hero + '.', '- Petunjuk atau benturan yang memperumit premis: ' + idea, '- Akibat yang mendorong bagian berikutnya.');
      });
      lines.push('', '## Catatan revisi', '- Apakah keinginan tokoh cukup spesifik?', '- Apakah konflik makin sulit dari satu bagian ke bagian berikutnya?', '- Apakah klimaks lahir dari keputusan tokoh, bukan kebetulan?', '- Apakah akhir memberi perubahan yang terasa?', '', '> Draf kerangka ini adalah titik awal. Ubah detail, karakter, dan alur agar menjadi suara kreatif Anda sendiri.');
      wizardDraft = lines.join('\n');
      $('wizardResultSummary').textContent = 'Kerangka ' + count + ' bagian siap. Anda dapat mengganti isi editor atau menambahkannya di akhir naskah.';
      $('wizardResult').hidden = false;
    });
    $('insertStoryReplace').addEventListener('click', () => {
      if (!wizardDraft) return;
      editor.value = wizardDraft.slice(0,12000); rememberEdit(); lastStoryboard = null; closeWizard(); $('create').scrollIntoView({behavior:'smooth'}); editor.focus();
      setNotice('Kerangka cerita dimasukkan ke editor. Tinjau dan kembangkan sebelum disimpan atau diterbitkan.', 'success');
    });
    $('insertStoryAppend').addEventListener('click', () => {
      if (!wizardDraft) return;
      const spacer = editor.value.trim() ? '\n\n' : '';
      editor.value = (editor.value + spacer + wizardDraft).slice(0,12000); rememberEdit(); lastStoryboard = null; closeWizard(); editor.focus();
      setNotice('Kerangka ditambahkan ke naskah. Periksa batas 12.000 karakter dan sesuaikan sebelum disimpan.', 'success');
    });
    updateEditorCount();


    function renderCloudProjects() {
      const box = $('cloudProjects');
      if (!box) return;
      box.replaceChildren();
      if (!cloudBooks.length) {
        const p = document.createElement('p'); p.className = 'x-muted';
        p.textContent = signedInUser ? 'Belum ada karya tersimpan di akun ini. Buat karya pertama di editor.' : 'Masuk melalui Collective Workspace untuk menyimpan dan menyinkronkan karya.';
        box.appendChild(p); return;
      }
      cloudBooks.forEach(book => {
        const row = document.createElement('article'); row.className = 'x-product-row';
        const info = document.createElement('div');
        const title = document.createElement('h3'); title.textContent = book.title;
        const meta = document.createElement('p'); meta.textContent = String(book.content_type || 'karya').replaceAll('_',' ') + ' · ' + book.status;
        info.append(title,meta);
        const edit = document.createElement('button'); edit.className = 'x-button x-secondary'; edit.type = 'button'; edit.textContent = 'Buka';
        edit.addEventListener('click', async () => {
          try {
            const { data, error } = await db.from('book_versions').select('canonical_content').eq('book_id',book.id).order('version_number',{ascending:false}).limit(1);
            if (error) throw error;
            const content = data?.[0]?.canonical_content || {};
            activeBookId = book.id;
            loadAssetsForBook().catch(e => setNotice('Karya dibuka, tetapi daftar aset belum termuat: ' + e.message, 'error'));
            $('workTitle').value = book.title;
            $('workText').value = content.body || book.description || '';
            setMode(content.mode || (book.content_type === 'comic' ? 'comic' : 'writing'));
            $('workFormat').value = content.format || (book.content_type === 'comic' ? 'comic' : 'writing');
            $('workVisibility').value = content.visibility || (book.status === 'published' ? 'public' : 'private');
            $('rightsOwner').value = content.rightsOwner || '';
            $('rightsLicense').value = content.license || 'All rights reserved';
            $('aiPermission').checked = !!content.aiPermission;
            $('create').scrollIntoView({behavior:'smooth'});
            setNotice('Karya dimuat dari cloud. Simpan untuk membuat versi berikutnya.');
          } catch (e) { setNotice('Gagal membuka karya: ' + (e.message || 'kesalahan tidak diketahui'), 'error'); }
        });
        row.append(info,edit); box.appendChild(row);
      });
    }
    async function refreshCloudProjects() {
      if (!db) { setNotice('Library Supabase belum termuat. Muat ulang halaman.', 'error'); return; }
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) { setNotice('Sesi akun tidak dapat diperiksa: ' + sessionError.message, 'error'); return; }
      signedInUser = sessionData.session?.user || null;
      if (!signedInUser) {
        cloudBooks = [];
        updateCount(); renderCloudProjects();
        setNotice('Untuk menyimpan karya ke cloud, masuk terlebih dahulu di halaman utama → Collective AI.', 'info');
        return;
      }
      const { data, error } = await db.from('books').select('id,owner_id,slug,title,description,content_type,status,metadata,updated_at').eq('owner_id',signedInUser.id).order('updated_at',{ascending:false}).limit(50);
      if (error) { setNotice('Gagal memuat karya cloud: ' + error.message, 'error'); return; }
      cloudBooks = data || [];
      updateCount(); renderCloudProjects();
      setNotice('Terhubung ke akun ' + (signedInUser.email || '') + '. Karya disimpan di cloud dan privat secara default.', 'success');
    }
    async function persistWork(status) {
      const title = $('workTitle').value.trim();
      const body = $('workText').value.trim();
      if (!title || !body) { setNotice('Isi judul dan materi karya sebelum menyimpan.', 'error'); return; }
      if (!db) { setNotice('Library Supabase belum termuat. Muat ulang halaman.', 'error'); return; }
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;
      signedInUser = sessionData.session?.user || null;
      if (!signedInUser && status === 'published') throw new Error('Masuk ke akun terlebih dahulu sebelum menerbitkan karya.');
      if (!signedInUser) {
        const local = draftList();
        const item = { title, body, mode, format:$('workFormat').value, visibility:$('workVisibility').value, updatedAt:new Date().toISOString(), rightsOwner:$('rightsOwner').value.trim(), license:$('rightsLicense').value, aiPermission:$('aiPermission').checked };
        const index = local.findIndex(d => d.title === title && d.mode === mode);
        if (index >= 0) local[index] = item; else local.unshift(item);
        safeStore.set(draftKey, local.slice(0,50));
        updateCount();
        setNotice('Draft hanya tersimpan lokal. Untuk sinkronisasi cloud, masuk melalui halaman utama → Collective AI.', 'info');
        return;
      }
      const format = $('workFormat').value;
      const visibility = status === 'published' ? 'public' : $('workVisibility').value;
      const slug = slugify(title) + '-' + signedInUser.id.slice(0,8);
      const metadata = { mode, format, visibility, rightsOwner:$('rightsOwner').value.trim(), license:$('rightsLicense').value, aiPermission:$('aiPermission').checked, savedAt:new Date().toISOString() };
      const rightsMetadata = { owner_name:metadata.rightsOwner, license:metadata.license, ai_processing_allowed:metadata.aiPermission, provenance:'creator-studio' };
      const bookFields = { owner_id:signedInUser.id, slug, title, description:body.slice(0,1200), language_code:'id', content_type:contentType(format), status:status === 'published' ? 'draft' : status, rights_metadata:rightsMetadata, metadata };
      let book = cloudBooks.find(b => b.id === activeBookId) || cloudBooks.find(b => b.slug === slug);
      if (book) {
        const { data, error } = await db.from('books').update(bookFields).eq('id',book.id).select('id,slug,title,status').single();
        if (error) throw error;
        book = data;
      } else {
        const { data, error } = await db.from('books').insert(bookFields).select('id,slug,title,status').single();
        if (error) throw error;
        book = data;
      }
      activeBookId = book.id;
      const { data: versions, error: versionError } = await db.from('book_versions').select('version_number').eq('book_id',book.id).order('version_number',{ascending:false}).limit(1);
      if (versionError) throw versionError;
      const versionNumber = (versions?.[0]?.version_number || 0) + 1;
      const canonical = { body, mode, format, visibility, rightsOwner:metadata.rightsOwner, license:metadata.license, aiPermission:metadata.aiPermission, savedAt:metadata.savedAt, storyboard:lastStoryboard?.storyboard || [], productionPlan:lastStoryboard?.productionPlan || [] };
      const { error: saveVersionError } = await db.from('book_versions').insert({ book_id:book.id, version_number:versionNumber, canonical_content:canonical, change_summary:status === 'published' ? 'Kreator menerbitkan karya' : 'Kreator menyimpan versi karya', created_by:signedInUser.id });
      if (saveVersionError) throw saveVersionError;
      if (status === 'published') {
        const { error: publishError } = await db.from('books').update({ status:'published' }).eq('id',book.id).eq('owner_id',signedInUser.id);
        if (publishError) throw publishError;
      }
      $('workVisibility').value = visibility;
      await refreshCloudProjects();
      setNotice(status === 'published' ? 'Karya diterbitkan. Karya kini dapat ditemukan di Ruang Pembaca.' : 'Draft dan versi ' + versionNumber + ' tersimpan di akun cloud.', 'success');
    }
    $('saveDraft').addEventListener('click', async () => {
      try { await persistWork('draft'); } catch (e) { setNotice('Penyimpanan gagal: ' + (e.message || 'periksa koneksi dan akses akun.'), 'error'); }
    });
    $('publishWork').addEventListener('click', async () => {
      if (!window.confirm('Terbitkan karya ini ke Ruang Pembaca publik? Pastikan Anda memiliki hak atas naskah dan asetnya.')) return;
      try { await persistWork('published'); } catch (e) { setNotice('Publikasi gagal: ' + (e.message || 'periksa koneksi dan akses akun.'), 'error'); }
    });
    async function outline() {
      const raw = $('workText').value.trim();
      if (raw.length < 80) { setNotice('Tambahkan minimal 80 karakter agar modul dapat menyusun hasil produksi.', 'error'); return; }
      if (['video','3d','audio','learning'].includes(mode)) {
        const result = $('outlineResult'); result.replaceChildren();
        const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
        const blocks = mode === 'video'
          ? lines.map((line,i) => ({title:'SHOT '+String(i+1).padStart(2,'0'), body:line, note:'Tentukan durasi, ukuran shot, gerak kamera, kontinuitas, dan audio sebelum render.'}))
          : mode === '3d'
          ? [
              {title:'GEOMETRI & SKALA',body:lines.find(line => /objek|geometri|siluet|skala/i.test(line)) || 'Lengkapi bentuk utama, proporsi, ukuran nyata, dan level detail.',note:'Keluaran saat ini adalah spesifikasi teks; belum menghasilkan mesh 3D.'},
              {title:'MATERIAL & PENCahayaan',body:lines.find(line => /material|tekstur|cahaya|lighting/i.test(line)) || 'Tentukan material, tekstur, roughness, sumber cahaya, dan lingkungan.',note:'Siapkan referensi visual dan lisensi tekstur.'},
              {title:'RIG / ANIMASI',body:lines.find(line => /rig|animasi|gerak/i.test(line)) || 'Tentukan kebutuhan rig, pose, loop gerak, dan titik pivot.',note:'Rigging otomatis belum tersedia tanpa engine 3D.'},
              {title:'EKSPOR',body:lines.find(line => /ekspor|glb|gltf|obj|stl/i.test(line)) || 'Pilih GLB/GLTF untuk web, OBJ untuk pertukaran mesh, atau STL untuk cetak 3D.',note:'Impor berkas model tersedia lewat Asset Inbox.'}
            ]
          : mode === 'audio'
          ? lines.map((line,i) => ({title:'CUE '+String(i+1).padStart(2,'0'),body:line,note:'Tentukan pembicara, emosi, tempo, level, dan titik masuk/keluar.'}))
          : lines.map((line,i) => ({title:'INTERAKSI '+String(i+1).padStart(2,'0'),body:line,note:'Tentukan pemicu, respons visual/audio, aksesibilitas, dan cara menguji pemahaman.'}));
        blocks.forEach(block => {
          const article = document.createElement('article');
          const h = document.createElement('h4'); h.textContent = block.title;
          const p = document.createElement('p'); p.textContent = block.body;
          const small = document.createElement('small'); small.textContent = block.note;
          article.append(h,p,small); result.appendChild(article);
        });
        const note = document.createElement('article');
        const h = document.createElement('h4'); h.textContent = 'BATASAN MODUL';
        const p = document.createElement('p');
        p.textContent = mode === 'video' ? 'Breakdown shot dibuat dari baris brief di browser. Video final belum dirender; sambungkan provider video AI untuk menghasilkan klip.' : mode === '3d' ? 'Spesifikasi 3D disusun sebagai checklist produksi. Mesh, rig, tekstur, dan render final memerlukan engine/provider 3D.' : mode === 'audio' ? 'Cue audio disusun dari naskah. File suara belum disintesis; sambungkan provider TTS/audio untuk hasil audio final.' : 'Rencana interaksi disusun sebagai brief. AR kamera langsung memerlukan runtime AR dan aset yang sesuai.';
        note.append(h,p); result.appendChild(note); result.hidden = false;
        setNotice('Brief ' + mode.toUpperCase() + ' dipecah menjadi ' + blocks.length + ' bagian. Ini alat perencanaan lokal, bukan render AI final.', 'success');
        return;
      }
      if (!$('aiPermission').checked) { setNotice('Naskah tidak dikirim. Centang izin pemrosesan AI terlebih dahulu jika Anda ingin mengirim naskah ke story pipeline.', 'error'); return; }
      if (!db) { setNotice('Pipeline belum siap karena library Supabase belum termuat.', 'error'); return; }
      const { data: sessionData } = await db.auth.getSession();
      if (!sessionData.session) { setNotice('Masuk terlebih dahulu agar pipeline cerita dapat dijalankan.', 'error'); return; }
      const button = $('makeOutline'); button.disabled = true; button.textContent = 'Memetakan adegan…';
      try {
        const { data, error } = await db.functions.invoke('story-pipeline', { body: { title:$('workTitle').value.trim(), manuscript:raw, language:'id', targetFormat:$('workFormat').value, manuscript_processing_consent:true } });
        if (error) { let detail = error.message || 'Pipeline gagal.'; try { if (error.context?.json) { const body = await error.context.json(); detail = body.message || body.error || detail; } } catch (_) {} throw new Error(detail); }
        if (data?.error) throw new Error(data.message || data.error);
        lastStoryboard = data;
        const result = $('outlineResult'); result.replaceChildren();
        (data.storyboard || []).forEach(scene => {
          const article = document.createElement('article');
          const h = document.createElement('h4'); h.textContent = String(scene.sceneNumber).padStart(2,'0') + ' · ' + scene.workingTitle;
          const p = document.createElement('p'); p.textContent = scene.sourceExcerpt || '';
          const small = document.createElement('small'); small.textContent = scene.visualDirection || 'Arahan visual menunggu tinjauan kreatif.';
          article.append(h,p,small); result.appendChild(article);
        });
        const plan = document.createElement('article');
        const ph = document.createElement('h4'); ph.textContent = 'LANGKAH PRODUKSI'; plan.appendChild(ph);
        const list = document.createElement('ul');
        (data.productionPlan || []).forEach(step => { const li = document.createElement('li'); li.textContent = step.label + ' — ' + step.status; list.appendChild(li); });
        plan.appendChild(list); result.appendChild(plan); result.hidden = false;
        setNotice((data.notice || 'Storyboard awal berhasil dibuat.') + ' Simpan karya untuk merekam hasil pipeline pada versi berikutnya.', 'success');
      } catch (e) { setNotice('Pipeline gagal: ' + (e.message || 'periksa koneksi dan sesi akun.'), 'error'); }
      finally { button.disabled = false; button.textContent = 'Susun storyboard'; }
    }
    $('workText').addEventListener('input', () => { lastStoryboard = null; });
    $('workTitle').addEventListener('input', () => { lastStoryboard = null; });
    $('workFormat').addEventListener('change', () => { lastStoryboard = null; });
    const workspaceCopy = (id) => ($(id)?.value || '').trim();
    function renderWorkspaceResult(title, sections, note) {
      const output=$('dedicatedOutputBody'); output.replaceChildren();
      sections.forEach((section,index)=>{
        const article=document.createElement('article'); article.className='x-production-card';
        const num=document.createElement('span'); num.className='x-production-number'; num.textContent=String(index+1).padStart(2,'0');
        const body=document.createElement('div'); const h=document.createElement('h4'); h.textContent=section.title;
        const p=document.createElement('p'); p.textContent=section.body || 'Belum diisi — lengkapi bagian ini sebelum produksi.';
        body.append(h,p); if(section.meta){const small=document.createElement('small');small.textContent=section.meta;body.append(small);}
        article.append(num,body); output.appendChild(article);
      });
      $('dedicatedOutputTitle').textContent=title; $('dedicatedOutputNote').textContent=note; $('dedicatedOutput').hidden=false;
      const markdown='# '+($('workTitle').value.trim()||title)+'\n\n'+sections.map((s,i)=>'## '+String(i+1).padStart(2,'0')+' — '+s.title+'\n\n'+(s.body||'')+(s.meta?'\n\nCatatan: '+s.meta:'')).join('\n\n');
      editor.value=markdown; editor.dataset.lastStudioSample='false'; updateEditorCount(); lastStoryboard=null;
      setNotice('Hasil workspace tersusun. Periksa panel hasil lalu pilih “Simpan proyek & hasil” untuk menyimpan.', 'success');
    }
    document.querySelectorAll('[data-build-workspace]').forEach(button=>button.addEventListener('click',()=>{
      const kind=button.dataset.buildWorkspace; const sections=[];
      if(kind==='3d'){
        const fields=[['TIPE ASET',workspaceCopy('modelKind')],['SKALA & FORMAT',workspaceCopy('modelScale')+' · '+workspaceCopy('modelExport')],['GEOMETRI / BENTUK',workspaceCopy('modelGeometry')],['MATERIAL & TEKSTUR',workspaceCopy('modelMaterial')],['RIG / ANIMASI',workspaceCopy('modelRig')],['PENCAHAYAAN / SCENE',workspaceCopy('modelLighting')],['LEVEL DETAIL',workspaceCopy('modelDetail')],['CATATAN TEKNIS',workspaceCopy('modelNotes')]];
        fields.forEach(([title,body])=>sections.push({title,body,meta:title==='SKALA & FORMAT'?'Target ekspor yang dipilih; konversi belum dilakukan.':title==='GEOMETRI / BENTUK'?'Spesifikasi teks, bukan mesh 3D aktual.':''}));
        renderWorkspaceResult('Spesifikasi aset 3D',sections,'Status: brief produksi. Mesh, UV, rig, tekstur, dan render tidak dibuat otomatis. Untuk preview, impor GLB/GLTF di Asset Inbox.');
      } else if(kind==='video'){
        const premise=workspaceCopy('videoPremise'); const duration=Number(workspaceCopy('videoDuration')||60); const count=Math.max(3,Math.min(12,Math.ceil(duration/7.5)));
        const beats=Array.from({length:count},(_,i)=>{const start=Math.round(i*duration/count),end=Math.round((i+1)*duration/count);return {title:'SHOT '+String(i+1).padStart(2,'0')+' · '+start+'–'+end+' dtk',body:i===0?'PEMBUKAAN: '+premise:i===count-1?'PENUTUP / PAYOFF: '+premise:'AKSI / PERUBAHAN: '+premise,meta:workspaceCopy('videoDirection')+' · '+workspaceCopy('videoLook')+' · '+workspaceCopy('videoRatio')};});
        sections.push({title:'MASTER BRIEF',body:premise,meta:duration+' detik · '+workspaceCopy('videoRatio')+' · '+workspaceCopy('videoLanguage')+' · '+workspaceCopy('videoLook')},...beats);
        renderWorkspaceResult('Timeline & shot list',sections,'Status: perencanaan produksi. Ini bukan file video hasil render; provider video AI perlu dihubungkan untuk menghasilkan klip.');
      } else if(kind==='comic'){
        const pages=Math.max(1,Math.min(100,Number(workspaceCopy('comicPages')||1))),panels=Math.max(1,Math.min(12,Number(workspaceCopy('comicPanels')||6)));
        const dialogue=workspaceCopy('comicDialogue').split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
        sections.push({title:'ART DIRECTION',body:workspaceCopy('comicScene'),meta:workspaceCopy('comicStyle')+' · '+pages+' halaman'});
        for(let p=1;p<=pages;p++)for(let n=1;n<=panels;n++){const index=(p-1)*panels+n;sections.push({title:'HALAMAN '+p+' · PANEL '+n,body:dialogue[(index-1)%Math.max(1,dialogue.length)]||'Tentukan aksi, ekspresi, latar, dan sudut pandang untuk panel ini.',meta:'Komposisi panel · balon dialog · SFX · kontinuitas visual'});}
        renderWorkspaceResult('Layout panel komik',sections,'Status: storyboard tekstual. Ilustrasi panel final memerlukan generator gambar atau aset gambar yang diunggah.');
      } else if(kind==='audio'){
        const cues=workspaceCopy('audioCues').split(/\n+/).filter(Boolean);
        sections.push({title:'KONSEP & FORMAT',body:workspaceCopy('audioConcept'),meta:workspaceCopy('audioType')+' · '+workspaceCopy('audioDuration')+' · '+workspaceCopy('audioVoice')});
        cues.forEach((cue,i)=>sections.push({title:'CUE '+String(i+1).padStart(2,'0'),body:cue,meta:'Tentukan timing, level, fade, dan posisi stereo.'}));
        if(!cues.length) sections.push({title:'CUE AWAL',body:'Tambahkan dialog, SFX, musik, dan jeda untuk setiap adegan.',meta:'Belum ada cue yang ditulis.'});
        renderWorkspaceResult('Cue sheet audio',sections,'Status: dokumen produksi audio. File suara belum disintesis; memerlukan provider TTS/audio.');
      } else {
        sections.push({title:'TUJUAN BELAJAR',body:workspaceCopy('eduGoal'),meta:workspaceCopy('eduAge')}, {title:'PEMICU & HALAMAN',body:workspaceCopy('eduTrigger')+' — '+workspaceCopy('eduObject'),meta:'Tentukan gambar/marker yang memulai pengalaman.'},{title:'NARASI & INTERAKSI',body:workspaceCopy('eduAudio'),meta:'Rancang alternatif tanpa audio untuk aksesibilitas.'},{title:'UJI PEMAHAMAN',body:'Siswa mengamati, berinteraksi, lalu menjawab satu pertanyaan atau memilih objek yang benar.',meta:'Tambahkan rubrik dan cara mengulang materi.'});
        renderWorkspaceResult('Alur buku hidup / AR',sections,'Status: rancangan interaksi edukasi. AR kamera langsung memerlukan runtime AR dan aset 3D yang sesuai.');
      }
    }));
    $('applyDedicatedOutput').addEventListener('click',()=>{ $('dedicatedOutput').scrollIntoView({behavior:'smooth',block:'nearest'}); setNotice('Hasil sudah dimasukkan ke isi proyek. Simpan proyek untuk merekam versi ini.', 'success'); });
    $('assetUpload').addEventListener('change',()=>{
      const file=Array.from($('assetUpload').files||[]).find(item=>/\\.(glb|gltf)$/i.test(item.name));
      if(!file) return;
      const stage=$('modelPreviewStage'); stage.replaceChildren();
      const viewer=document.createElement('model-viewer'); viewer.setAttribute('src',URL.createObjectURL(file)); viewer.setAttribute('alt','Preview model 3D '+file.name); viewer.setAttribute('camera-controls',''); viewer.setAttribute('auto-rotate',''); viewer.setAttribute('ar',''); viewer.style.cssText='width:100%;height:360px;background:#10151d';
      stage.appendChild(viewer);
      const info=document.createElement('small'); info.textContent=file.name+' · preview lokal, belum diunggah'; stage.appendChild(info);
    });
    $('makeOutline').addEventListener('click', outline);
    $('newComic').addEventListener('click', () => { activeBookId = null; lastStoryboard = null; setMode('comic'); $('workTitle').value = 'Komik baru'; $('workText').value = ''; $('workFormat').value = 'comic'; $('create').scrollIntoView({behavior:'smooth'}); $('workText').focus(); });
    $('newWriting').addEventListener('click', () => { activeBookId = null; lastStoryboard = null; setMode('writing'); $('workTitle').value = 'Naskah baru'; $('workText').value = ''; $('workFormat').value = 'writing'; $('create').scrollIntoView({behavior:'smooth'}); $('workText').focus(); });
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
    async function loadAssetsForBook() {
      const box = $('assetPreview');
      if (!box) return;
      box.replaceChildren();
      if (!db || !signedInUser || !activeBookId) {
        const p = document.createElement('p'); p.className = 'x-muted'; p.textContent = 'Simpan atau buka karya untuk melihat aset cloud.'; box.appendChild(p); return;
      }
      const { data, error } = await db.from('book_assets').select('id,asset_type,asset_url,alt_text,metadata,created_at').eq('book_id',activeBookId).order('created_at',{ascending:false}).limit(100);
      if (error) throw error;
      if (!data?.length) {
        const p = document.createElement('p'); p.className = 'x-muted'; p.textContent = 'Belum ada aset cloud untuk karya ini.'; box.appendChild(p); return;
      }
      data.forEach(asset => {
        const card = document.createElement('div'); card.className = 'x-asset-item';
        const name = document.createElement('strong'); name.textContent = asset.alt_text || asset.metadata?.original_name || 'Aset kreatif';
        const meta = document.createElement('div'); meta.textContent = (asset.asset_type || 'other') + ' · ' + Math.max(1,Math.round(Number(asset.metadata?.size_bytes || 0)/1024)) + ' KB · privat';
        const linkButton = document.createElement('button'); linkButton.type = 'button'; linkButton.className = 'x-button x-secondary'; linkButton.textContent = 'Buat tautan buka sementara';
        linkButton.addEventListener('click', async () => {
          linkButton.disabled = true; linkButton.textContent = 'Menyiapkan tautan…';
          try {
            const bucket = asset.metadata?.storage_bucket || 'narativa-assets';
            const { data: signed, error: signedError } = await db.storage.from(bucket).createSignedUrl(asset.asset_url, 60);
            if (signedError) throw signedError;
            const link = document.createElement('a'); link.href = signed.signedUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Buka / unduh (tautan berlaku 60 detik)';
            linkButton.replaceWith(link);
          } catch (e) {
            setNotice('Tautan aset belum dapat dibuat: ' + (e.message || 'periksa sesi dan izin akses.'), 'error');
            linkButton.disabled = false; linkButton.textContent = 'Coba buat tautan lagi';
          }
        });
        card.append(name,meta,linkButton); box.appendChild(card);
      });
    }
    $('uploadAssets').addEventListener('click', async () => {
      const files = Array.from($('assetUpload').files || []);
      if (!files.length) { setNotice('Pilih satu atau beberapa aset terlebih dahulu.', 'error'); return; }
      if (!db || !signedInUser) { setNotice('Masuk terlebih dahulu untuk mengunggah aset privat.', 'error'); return; }
      if (!activeBookId) { setNotice('Simpan atau buka karya dari daftar proyek sebelum mengunggah aset.', 'error'); return; }
      if (files.some(file => file.size > 50 * 1024 * 1024)) { setNotice('Setiap berkas harus berukuran 50 MB atau kurang.', 'error'); return; }
      const button = $('uploadAssets'); button.disabled = true; button.textContent = 'Mengunggah aset…';
      let uploaded = 0;
      try {
        const { data: sessionData } = await db.auth.getSession();
        signedInUser = sessionData.session?.user || null;
        if (!signedInUser) throw new Error('Sesi berakhir. Masuk kembali.');
        for (const file of files) {
          const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-120) || 'asset';
          const path = signedInUser.id + '/' + activeBookId + '/' + crypto.randomUUID() + '-' + safeName;
          const { error: uploadError } = await db.storage.from('narativa-assets').upload(path, file, { upsert:false, contentType:file.type || 'application/octet-stream', cacheControl:'3600' });
          if (uploadError) throw uploadError;
          const ext = (file.name.split('.').pop() || '').toLowerCase();
          const assetType = file.type.startsWith('image/') ? 'page_image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : ['glb','gltf','obj','stl','fbx','usd','usdz'].includes(ext) ? 'model_3d' : ['pdf','txt','md','doc','docx','rtf'].includes(ext) ? 'document' : 'other';
          const { error: recordError } = await db.from('book_assets').insert({
            book_id:activeBookId, asset_type:assetType, asset_url:path, alt_text:file.name,
            created_by:signedInUser.id,
            rights_metadata:{ owner_name:$('rightsOwner').value.trim(), license:$('rightsLicense').value, ai_processing_allowed:$('aiPermission').checked },
            metadata:{ original_name:file.name, mime_type:file.type || 'application/octet-stream', size_bytes:file.size, storage_bucket:'narativa-assets', visibility:'private' }
          });
          if (recordError) {
            // Best-effort cleanup prevents a private Storage object being orphaned if metadata fails.
            await db.storage.from('narativa-assets').remove([path]).catch(() => {});
            throw recordError;
          }
          uploaded++;
        }
        $('assetUpload').value = '';
        $('assetPreview').replaceChildren();
        const done = document.createElement('p'); done.className = 'x-muted'; done.textContent = uploaded + ' aset berhasil diunggah dan dicatat sebagai aset privat karya ini.'; $('assetPreview').appendChild(done);
        await loadAssetsForBook();
        setNotice('Upload selesai. Berkas tersimpan pada bucket privat dan memiliki metadata hak/provenance.', 'success');
      } catch (e) {
        setNotice('Upload terhenti setelah ' + uploaded + ' aset: ' + (e.message || 'periksa izin, tipe berkas, dan koneksi.'), 'error');
      } finally { button.disabled = false; button.textContent = 'Unggah aset ke cloud'; }
    });
    refreshCloudProjects().catch(e => setNotice('Gagal memeriksa akun: ' + e.message, 'error'));
    db?.auth.onAuthStateChange(() => refreshCloudProjects());
  }

  if (page === 'commerce') {
    const db = window.supabase?.createClient?.('https://hdsqwkydgruyfbqqwhdk.supabase.co', 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8');
    let user = null;
    let ownedBooks = [];
    const money = value => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value || 0));
    function commerceNote(message, kind) { $('vendorNotice').textContent = message; $('vendorNotice').dataset.kind = kind || 'info'; }
    const etsyButton = $('etsyConnectButton');
    const etsyStatus = $('etsyConnectionStatus');
    function setEtsyStatus(message, kind) {
      if (etsyStatus) { etsyStatus.textContent = 'Status Etsy: ' + message; etsyStatus.dataset.kind = kind || 'info'; }
      const connected = kind === 'success' && message.startsWith('terhubung');
      if ($('connectedVendorCount')) $('connectedVendorCount').textContent = connected ? '1' : '0';
      if ($('etsyVendorCardStatus')) $('etsyVendorCardStatus').textContent = connected ? 'Terhubung · OAuth resmi' : (kind === 'error' ? 'Belum terhubung · perlu konfigurasi' : 'Belum terhubung · Marketplace');
    }
    async function refreshEtsyStatus() {
      if (!etsyStatus) return;
      if (!db) { setEtsyStatus('library Supabase belum termuat', 'error'); return; }
      if (!user) { setEtsyStatus('belum terhubung · masuk melalui Akun / Masuk untuk mengotorisasi toko', 'info'); return; }
      try {
        const { data, error } = await db.functions.invoke('etsy-connect', { body: { action: 'status' } });
        if (error) throw error;
        if (data?.status === 'connected') {
          setEtsyStatus('terhubung · otorisasi aktif' + (data.updated_at ? ' · diperbarui ' + new Date(data.updated_at).toLocaleString('id-ID') : ''), 'success');
          if (etsyButton) etsyButton.textContent = 'Periksa koneksi Etsy';
        } else if (data?.status === 'action_required') {
          setEtsyStatus('perlu otorisasi ulang · hubungkan kembali toko', 'error');
          if (etsyButton) etsyButton.textContent = 'Hubungkan ulang Etsy';
        } else {
          setEtsyStatus('belum terhubung · otorisasi OAuth belum dilakukan', 'info');
          if (etsyButton) etsyButton.textContent = 'Hubungkan Etsy (OAuth)';
        }
      } catch (_) {
        setEtsyStatus('konfigurasi OAuth belum lengkap di Supabase; status koneksi belum dapat diverifikasi', 'error');
      }
    }
    if (etsyButton) etsyButton.addEventListener('click', async () => {
      if (!user) { setEtsyStatus('masuk terlebih dahulu melalui Akun / Masuk', 'error'); commerceNote('Otorisasi Etsy memerlukan akun NARATIVA yang masuk.', 'error'); return; }
      etsyButton.disabled = true;
      etsyButton.textContent = 'Menyiapkan OAuth…';
      try {
        const { data, error } = await db.functions.invoke('etsy-connect', { body: { action: 'start' } });
        if (error) throw error;
        if (!data?.authorization_url) throw new Error('Backend tidak mengembalikan URL otorisasi.');
        window.location.assign(data.authorization_url);
      } catch (_) {
        setEtsyStatus('belum aktif · backend OAuth belum tersedia atau konfigurasi Etsy belum lengkap', 'error');
        commerceNote('Koneksi Etsy belum bisa dimulai. Fungsi server etsy-connect dan rahasia ETSY_* harus dipasang di proyek Supabase NARATIVA terlebih dahulu. Jangan masukkan API key/token ke halaman ini.', 'error');
        etsyButton.disabled = false;
        etsyButton.textContent = 'Hubungkan Etsy (OAuth)';
      }
    });
    const etsyParams = new URLSearchParams(window.location.search);
    const etsyResult = etsyParams.get('etsy');
    const etsyReason = etsyParams.get('reason');
    const etsyCallbackMessages = {
      backend_not_configured: 'Backend OAuth belum lengkap. Periksa rahasia ETSY_CLIENT_ID dan ETSY_TOKEN_ENCRYPTION_KEY di Supabase.',
      missing_callback_parameters: 'Callback Etsy tidak menyertakan kode dan state yang diperlukan. Mulai ulang proses Hubungkan Etsy.',
      invalid_or_expired_state: 'Permintaan OAuth tidak valid, kedaluwarsa, atau sudah digunakan. Demi keamanan, mulai ulang Hubungkan Etsy.',
      etsy_token_exchange_failed: 'Etsy menolak pertukaran kode OAuth. Periksa persetujuan aplikasi dan callback URL yang terdaftar.',
      invalid_token_response: 'Etsy mengembalikan respons token yang tidak lengkap. Coba ulang setelah memeriksa akses aplikasi.',
      token_storage_failed: 'Otorisasi diterima tetapi token belum berhasil disimpan dengan aman. Periksa log fungsi Supabase.',
    };
    if (etsyResult === 'connected') {
      setEtsyStatus('terhubung · callback OAuth berhasil diterima', 'success');
      commerceNote('Callback OAuth Etsy berhasil. Status akun akan diverifikasi kembali melalui backend; fitur listing dan pesanan belum aktif.', 'success');
    } else if (etsyResult === 'error') {
      const message = etsyCallbackMessages[etsyReason] || 'Otorisasi gagal atau dibatalkan. Periksa status koneksi, lalu mulai ulang OAuth bila diperlukan.';
      setEtsyStatus('callback gagal · ' + (etsyReason || 'unknown'), 'error');
      commerceNote(message, 'error');
    }
    // Remove callback parameters from the visible address after recording the result in the UI.
    if (etsyResult) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('etsy');
      cleanUrl.searchParams.delete('reason');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
    function renderProducts() {
      const list = $('productList'); list.replaceChildren();
      const data = ownedBooks.filter(book => book.metadata && book.metadata.commerce);
      $('commerceCount').textContent = String(data.length);
      if (!data.length) {
        const empty = document.createElement('div'); empty.className = 'x-empty';
        const strong = document.createElement('strong'); strong.textContent = 'Belum ada produk di katalog cloud';
        const p = document.createElement('p'); p.textContent = user ? 'Pilih karya yang sudah tersimpan, lalu tambahkan metadata harga dan hak distribusinya.' : 'Masuk melalui halaman utama, lalu buat karya di Creator Studio untuk mengaktifkan katalog akun.';
        empty.append(strong,p); list.appendChild(empty); return;
      }
      data.forEach(book => {
        const product = book.metadata.commerce;
        const row = document.createElement('article'); row.className = 'x-product-row';
        const info = document.createElement('div');
        const h = document.createElement('h3'); h.textContent = book.title;
        const p = document.createElement('p'); p.textContent = (product.type || book.content_type || 'Karya') + ' · ' + (product.rights || 'Hak belum ditentukan') + ' · ' + book.status;
        info.append(h,p);
        const price = document.createElement('strong'); price.textContent = money(product.price_idr);
        row.append(info,price); list.appendChild(row);
      });
    }
    async function loadCommerceBooks() {
      if (!db) { commerceNote('Library Supabase belum termuat. Muat ulang halaman.', 'error'); return; }
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) { commerceNote('Sesi akun tidak dapat diperiksa: ' + sessionError.message, 'error'); return; }
      user = sessionData.session?.user || null;
      const select = $('productBook');
      select.replaceChildren();
      if (!user) {
        const option = document.createElement('option'); option.value = ''; option.textContent = 'Masuk untuk memuat karya'; select.appendChild(option);
        ownedBooks = []; renderProducts();
        commerceNote('Katalog kini memakai data akun. Masuk di halaman utama → Collective AI, lalu buka Creator Studio.', 'info'); refreshEtsyStatus(); return;
      }
      const { data, error } = await db.from('books').select('id,title,slug,status,description,content_type,metadata').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(100);
      if (error) { commerceNote('Karya akun gagal dimuat: ' + error.message, 'error'); return; }
      ownedBooks = data || [];
      const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Pilih karya milik Anda'; select.appendChild(placeholder);
      ownedBooks.forEach(book => { const option = document.createElement('option'); option.value = book.id; option.textContent = book.title + ' · ' + book.status; select.appendChild(option); });
      renderProducts();
      commerceNote('Katalog tersambung ke akun ' + (user.email || '') + '. Harga tersimpan sebagai metadata referensi; transaksi dan vendor belum terhubung.', 'success');
      refreshEtsyStatus();
    }
    $('productBook').addEventListener('change', () => {
      const book = ownedBooks.find(item => item.id === $('productBook').value);
      $('productName').value = book?.title || '';
      const product = book?.metadata?.commerce;
      if (product) {
        $('productType').value = product.type || $('productType').options[0].value;
        $('productPrice').value = product.price_idr ?? '';
        $('productRights').value = product.rights || $('productRights').options[0].value;
      } else {
        $('productPrice').value = '';
      }
    });
    $('addProduct').addEventListener('click', () => {
      $('productForm').hidden = !$('productForm').hidden;
      if (!$('productForm').hidden) { $('productBook').focus(); loadCommerceBooks(); }
    });
    $('cancelProduct').addEventListener('click', () => { $('productForm').reset(); $('productForm').hidden = true; });
    $('productForm').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        if (!db || !user) throw new Error('Masuk terlebih dahulu untuk menyimpan metadata produk.');
        const book = ownedBooks.find(item => item.id === $('productBook').value);
        if (!book) throw new Error('Pilih karya dari Creator Studio terlebih dahulu.');
        const metadata = { ...(book.metadata || {}), commerce: { type:$('productType').value, price_idr:Number($('productPrice').value || 0), rights:$('productRights').value, updated_at:new Date().toISOString(), listing_status:'prepared' } };
        const { error } = await db.from('books').update({ metadata }).eq('id',book.id).eq('owner_id',user.id);
        if (error) throw error;
        $('productForm').reset(); $('productForm').hidden = true;
        await loadCommerceBooks();
        commerceNote('Metadata katalog tersimpan di cloud. Belum ada listing vendor atau transaksi yang dibuat.', 'success');
      } catch (e) { commerceNote('Katalog belum tersimpan: ' + (e.message || 'periksa sesi dan akses akun.'), 'error'); }
    });
    document.querySelectorAll('[data-vendor]').forEach(btn => btn.addEventListener('click', () => {
      const name = btn.dataset.vendor;
      const url = btn.dataset.doc;
      commerceNote(name + ': dokumentasi resmi dibuka. Status tetap “belum terhubung” sampai OAuth/API dan backend diuji berhasil. Jangan masukkan API key atau token ke halaman ini.', 'info');
      if (url && /^https:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
      $('vendorNotice').scrollIntoView({behavior:'smooth',block:'nearest'});
    }));
    const vendorSearch = $('vendorSearch');
    if (vendorSearch) vendorSearch.addEventListener('input', () => {
      const q = vendorSearch.value.trim().toLocaleLowerCase('id');
      let visible = 0;
      document.querySelectorAll('[data-vendor-card]').forEach(card => {
        const show = !q || (card.dataset.name + ' ' + card.dataset.category + ' ' + card.textContent).toLocaleLowerCase('id').includes(q);
        card.hidden = !show;
        if (show) visible++;
      });
      $('vendorResults').textContent = visible + ' kanal ditemukan dari ' + document.querySelectorAll('[data-vendor-card]').length + ' kanal';
    });
    loadCommerceBooks();
    db?.auth.onAuthStateChange(() => loadCommerceBooks());
  }
})();