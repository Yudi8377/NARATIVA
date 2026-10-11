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
    const cloudIds = new Set();
    let active = 'rain';
    const modal = $('readerModal');
    function openStory(id) {
      active = stories[id] ? id : 'rain';
      $('readerTitle').textContent = stories[active].title;
      $('readerBody').textContent = stories[active].body;
      $('readerNotice').textContent = cloudIds.has(active) ? 'Karya terbit dari katalog NARATIVA. Progres baca pada tahap ini disimpan di perangkat.' : 'Konten demo. Riwayat baca hanya disimpan di perangkat ini.';
      $('nextStory').hidden = cloudIds.has(active);
      modal.hidden = false;
      $('closeReader').focus();
      safeStore.set('narativa-reader-last', { id: active, progress: 0, at: new Date().toISOString() });
    }
    $('storyGrid').addEventListener('click', event => { const btn = event.target.closest('[data-read]'); if (btn) openStory(btn.dataset.read); });
    $('closeReader').addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) modal.hidden = true; });
    $('saveStory').addEventListener('click', () => {
      const saved = safeStore.get('narativa-reader-saved', []);
      if (!saved.some(item => item.id === active)) saved.push({ id: active, title: stories[active].title });
      safeStore.set('narativa-reader-saved', saved);
      renderSaved();
      $('readerNotice').textContent = 'Disimpan ke daftar pada perangkat ini.';
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

    const db = window.supabase?.createClient?.('https://hdsqwkydgruyfbqqwhdk.supabase.co', 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8');
    async function loadPublishedWorks() {
      const grid = $('storyGrid');
      if (!db) return;
      const { data, error } = await db.from('books').select('id,title,description,content_type,language_code,slug,updated_at').eq('status','published').order('updated_at',{ascending:false}).limit(60);
      if (error) {
        const note = document.createElement('p'); note.className = 'x-feedback'; note.textContent = 'Karya terbit belum dapat dimuat saat ini. Coba muat ulang halaman.';
        grid.prepend(note); return;
      }
      for (const book of (data || [])) {
        const { data: versions } = await db.from('book_versions').select('canonical_content,version_number').eq('book_id',book.id).order('version_number',{ascending:false}).limit(1);
        const canonical = versions?.[0]?.canonical_content || {};
        const body = typeof canonical.body === 'string' ? canonical.body : (book.description || 'Naskah ini belum memiliki isi yang dapat ditampilkan.');
        const id = 'cloud-' + book.id;
        stories[id] = { title: book.title, body };
        cloudIds.add(id);
        const card = document.createElement('article'); card.className = 'x-story-card'; card.dataset.title = book.title; card.dataset.genre = 'karya-kreator';
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
    function setMode(next) {
      mode = next;
      document.querySelectorAll('[data-studio]').forEach(btn => {
        const selected = btn.dataset.studio === mode;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-selected', String(selected));
      });
      $('workTextLabel').textContent = mode === 'comic' ? 'Premis / ringkasan panel' : 'Benih cerita / naskah';
      $('workText').placeholder = mode === 'comic' ? 'Jelaskan panel, adegan, dialog, dan arah visual…' : 'Tulis ide, dialog, atau adegan…';
      setNotice(mode === 'comic' ? 'Workspace komik siap. Simpan untuk menyimpan versi karya ke akun cloud.' : 'Workspace naskah siap. Simpan untuk menyimpan versi karya ke akun cloud.');
    }
    document.querySelectorAll('[data-studio]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.studio)));

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
      const bookFields = { owner_id:signedInUser.id, slug, title, description:body.slice(0,1200), language_code:'id', content_type:contentType(format), status, rights_metadata:rightsMetadata, metadata };
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
      if (raw.length < 80) { setNotice('Tambahkan minimal 80 karakter agar pipeline dapat memetakan adegan.', 'error'); return; }
      if (!db) { setNotice('Pipeline belum siap karena library Supabase belum termuat.', 'error'); return; }
      const { data: sessionData } = await db.auth.getSession();
      if (!sessionData.session) { setNotice('Masuk terlebih dahulu agar pipeline cerita dapat dijalankan.', 'error'); return; }
      const button = $('makeOutline'); button.disabled = true; button.textContent = 'Memetakan adegan…';
      try {
        const { data, error } = await db.functions.invoke('story-pipeline', { body: { title:$('workTitle').value.trim(), manuscript:raw, language:'id', targetFormat:$('workFormat').value } });
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
      const { data, error } = await db.from('book_assets').select('id,asset_type,alt_text,metadata,created_at').eq('book_id',activeBookId).order('created_at',{ascending:false}).limit(100);
      if (error) throw error;
      if (!data?.length) {
        const p = document.createElement('p'); p.className = 'x-muted'; p.textContent = 'Belum ada aset cloud untuk karya ini.'; box.appendChild(p); return;
      }
      data.forEach(asset => {
        const card = document.createElement('div'); card.className = 'x-asset-item';
        const name = document.createElement('strong'); name.textContent = asset.alt_text || asset.metadata?.original_name || 'Aset kreatif';
        const meta = document.createElement('div'); meta.textContent = (asset.asset_type || 'other') + ' · ' + Math.max(1,Math.round(Number(asset.metadata?.size_bytes || 0)/1024)) + ' KB · privat';
        card.append(name,meta); box.appendChild(card);
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
          if (recordError) throw recordError;
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
        commerceNote('Katalog kini memakai data akun. Masuk di halaman utama → Collective AI, lalu buka Creator Studio.', 'info'); return;
      }
      const { data, error } = await db.from('books').select('id,title,slug,status,description,content_type,metadata').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(100);
      if (error) { commerceNote('Karya akun gagal dimuat: ' + error.message, 'error'); return; }
      ownedBooks = data || [];
      const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Pilih karya milik Anda'; select.appendChild(placeholder);
      ownedBooks.forEach(book => { const option = document.createElement('option'); option.value = book.id; option.textContent = book.title + ' · ' + book.status; select.appendChild(option); });
      renderProducts();
      commerceNote('Katalog tersambung ke akun ' + (user.email || '') + '. Harga tersimpan sebagai metadata referensi; transaksi dan vendor belum terhubung.', 'success');
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
      commerceNote(btn.dataset.vendor + ': koneksi belum aktif. Integrasi memerlukan aplikasi vendor, OAuth/API resmi, kebijakan izin, serta penyimpanan token yang aman di server.');
      $('vendorNotice').scrollIntoView({behavior:'smooth',block:'nearest'});
    }));
    loadCommerceBooks();
    db?.auth.onAuthStateChange(() => loadCommerceBooks());
  }
})();