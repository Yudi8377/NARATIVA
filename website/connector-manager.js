(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const supabaseUrl = 'https://hdsqwkydgruyfbqqwhdk.supabase.co';
  const publicKey = 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8';
  const db = window.supabase?.createClient?.(supabaseUrl, publicKey);

  // Register entries are implementation metadata, not proof of a live connection.
  const vendors = [
    {name:'Etsy',category:'Marketplace',stage:'approval',summary:'OAuth backend tersedia; menunggu persetujuan API dan verifikasi seller.',docs:'https://developer.etsy.com/documentation/',requirements:['Persetujuan aplikasi/key Etsy dan client ID resmi','ETSY_TOKEN_ENCRYPTION_KEY 32 byte di Supabase Edge Function secrets','Callback terdaftar persis: https://hdsqwkydgruyfbqqwhdk.supabase.co/functions/v1/etsy-connect'],steps:['Tunggu hasil review Etsy; jangan membuat key tambahan untuk menghindari review.','Setel secret server melalui dashboard Supabase, bukan di browser/GitHub/chat.','Masuk ke NARATIVA lalu mulai OAuth seller.','Setelah OAuth, jalankan verifikasi read-only shops/listings sebelum menganggap konektor operasional.'],docsLabel:'Dokumentasi API Etsy'},
    {name:'Shopify',category:'Toko',stage:'adapter',summary:'Adapter belum dibangun; jalur integrasi resmi tersedia melalui Shopify app/OAuth.',docs:'https://shopify.dev/docs/apps/build/authentication-authorization',requirements:['Akses Shopify Partner/developer dan app yang sesuai','Client ID/secret disimpan sebagai Supabase secrets','Redirect URL terdaftar dan scope minimum'],steps:['Buat/siapkan app resmi untuk toko yang akan dihubungkan.','Implementasikan OAuth server-side dan penyimpanan token terenkripsi.','Verifikasi toko dengan endpoint read-only; baru setelah itu tampilkan status terhubung.'],docsLabel:'Shopify app authentication'},
    {name:'WooCommerce',category:'Toko',stage:'adapter',summary:'Adapter belum dibangun; memerlukan akses REST API toko WordPress milik pengguna.',docs:'https://woocommerce.github.io/woocommerce-rest-api-docs/',requirements:['URL toko HTTPS dan izin pemilik/admin','REST API key dengan read-only scope pada tahap verifikasi','Secret disimpan server-side'],steps:['Pemilik toko membuat REST API key khusus NARATIVA dengan izin minimum.','Simpan key di secret store backend; jangan di localStorage atau kode frontend.','Uji endpoint produk read-only dan validasi domain toko.'],docsLabel:'WooCommerce REST API'},
    {name:'BigCommerce',category:'Toko',stage:'adapter',summary:'Adapter belum dibangun; perlu app credentials dan store context resmi.',docs:'https://developer.bigcommerce.com/docs',requirements:['Akun developer dan store yang berwenang','OAuth/client credentials sesuai tipe integrasi','Scopes dan callback terdaftar'],steps:['Tentukan app type dan model instalasi untuk tiap merchant.','Bangun OAuth/token storage di backend.','Uji endpoint store/catalog read-only.'],docsLabel:'BigCommerce developer docs'},
    {name:'Wix Stores',category:'Toko',stage:'adapter',summary:'Adapter belum dibangun; perlu app Wix dan izin terhadap situs merchant.',docs:'https://dev.wix.com/docs',requirements:['Akun developer Wix dan situs yang berwenang','App permissions dan OAuth resmi','Token disimpan di backend'],steps:['Daftarkan app dan tentukan permission yang dibutuhkan.','Implementasikan OAuth serta callback yang tervalidasi.','Uji akses katalog secara read-only.'],docsLabel:'Wix developer docs'},
    {name:'Squarespace Commerce',category:'Toko',stage:'adapter',summary:'Adapter belum dibangun; cek kelayakan API dan scope untuk kebutuhan merchant.',docs:'https://developers.squarespace.com/',requirements:['Akun situs dan akses developer yang sesuai','API key/OAuth yang didukung untuk use case','Secret backend dan batas rate'],steps:['Pastikan endpoint dan model otorisasi mendukung katalog yang diperlukan.','Simpan kredensial di backend dan batasi scope.','Uji endpoint read-only sebelum mengaktifkan sinkronisasi.'],docsLabel:'Squarespace developer docs'},
    {name:'eBay',category:'Marketplace',stage:'access',summary:'Perlu aplikasi developer, OAuth, dan persetujuan scope sesuai akun seller.',docs:'https://developer.ebay.com/api-docs/static/overview.html',requirements:['Akun eBay Developers Program','OAuth app credentials dan redirect URI','Marketplace/account eligibility dan scopes'],steps:['Buat aplikasi resmi dan gunakan sandbox untuk tes awal.','Implementasikan OAuth backend dan verifikasi identitas seller.','Uji Inventory/Offer API hanya sesuai izin dan kebijakan akun.'],docsLabel:'eBay API overview'},
    {name:'Amazon Seller',category:'Marketplace',stage:'access',summary:'SP-API memerlukan kelayakan, registrasi developer, role dan authorization seller.',docs:'https://developer-docs.amazon.com/sp-api/',requirements:['Kelayakan akun dan developer profile','SP-API role, app registration, seller authorization','LWA credentials dan AWS/IAM setup bila diwajibkan'],steps:['Konfirmasi kelayakan program serta role API yang dibutuhkan.','Daftarkan aplikasi SP-API dan alur otorisasi seller.','Mulai dengan endpoint read-only yang disetujui; jangan menganggap akses otomatis tersedia.'],docsLabel:'Amazon SP-API docs'},
    {name:'TikTok Shop',category:'Marketplace',stage:'access',summary:'Akses bergantung negara, tipe partner, dan persetujuan aplikasi.',docs:'https://partner.tiktokshop.com/docv2',requirements:['Akun partner/developer yang memenuhi syarat wilayah','App review dan seller authorization','Scopes, callback, dan kebijakan TikTok Shop'],steps:['Periksa dukungan Indonesia dan eligibility akun di portal resmi.','Ajukan/siapkan app serta permission yang relevan.','Bangun adapter hanya setelah API access disetujui.'],docsLabel:'TikTok Shop Partner docs'},
    {name:'Shopee',category:'Marketplace',stage:'access',summary:'Memerlukan akses Open Platform dan otorisasi partner/seller.',docs:'https://open.shopee.com/',requirements:['Akun Open Platform/developer','Partner ID/key dan redirect yang terdaftar','Shop authorization serta sign request sesuai spesifikasi'],steps:['Pastikan aplikasi diterima di Open Platform.','Simpan partner secret di backend dan implementasikan signature server-side.','Uji shop/profile read-only sebelum katalog/pesanan.'],docsLabel:'Shopee Open Platform'},
    {name:'Tokopedia',category:'Marketplace',stage:'access',summary:'Ketersediaan akses seller/partner harus dikonfirmasi melalui jalur resmi yang berlaku.',docs:'https://developer.tokopedia.com/',requirements:['Akun seller/partner dan akses developer yang disetujui','Dokumentasi API aktif untuk use case','Kredensial resmi dan callback'],steps:['Konfirmasi portal/API yang berlaku untuk akun dan model bisnis.','Jangan memakai endpoint privat atau scraping jika akses resmi tidak tersedia.','Bangun adapter setelah akses dan kontrak API tervalidasi.'],docsLabel:'Tokopedia developer portal'},
    {name:'Lazada',category:'Marketplace',stage:'access',summary:'Memerlukan aplikasi Open Platform, seller authorization, dan akses yang disetujui.',docs:'https://open.lazada.com/',requirements:['Akun developer/Open Platform','App key/secret dan callback resmi','Seller authorization dan scope'],steps:['Daftarkan aplikasi dan periksa status approval.','Implementasikan token/signature di backend.','Verifikasi seller dan katalog secara read-only.'],docsLabel:'Lazada Open Platform'},
    {name:'Gumroad',category:'Digital',stage:'adapter',summary:'Adapter belum dibangun; periksa API dan permission untuk produk/penjualan.',docs:'https://gumroad.com/api',requirements:['Akun kreator Gumroad','API token yang sesuai dengan fitur yang didukung','Webhook secret bila menggunakan webhook'],steps:['Tentukan apakah kebutuhan hanya membaca produk atau juga transaksi.','Simpan token di backend dan verifikasi akun.','Uji API read-only sebelum sinkronisasi.'],docsLabel:'Gumroad API'},
    {name:'Patreon',category:'Membership',stage:'adapter',summary:'Adapter belum dibangun; akses bergantung aplikasi dan permission Patreon.',docs:'https://docs.patreon.com/',requirements:['Aplikasi developer Patreon','OAuth client credentials dan redirect','Scope minimum untuk campaign/membership'],steps:['Daftarkan app dan scope yang diperlukan.','Implementasikan OAuth server-side dan consent member/campaign.','Uji data minimum serta aturan privasi sebelum sinkronisasi.'],docsLabel:'Patreon API docs'},
    {name:'Ko-fi',category:'Membership',stage:'access',summary:'Belum ada adapter; gunakan hanya webhook/API resmi yang tersedia untuk akun.',docs:'https://ko-fi.com/manage/integrations',requirements:['Akun Ko-fi kreator','Konfirmasi dukungan integrasi/webhook untuk use case','Verifikasi signature webhook bila tersedia'],steps:['Periksa opsi integrasi resmi di pengaturan Ko-fi.','Jika memakai webhook, verifikasi signature dan cegah replay.','Jangan mengasumsikan API listing/pesanan umum tersedia.'],docsLabel:'Ko-fi integrations'},
    {name:'Buy Me a Coffee',category:'Membership',stage:'adapter',summary:'Adapter belum dibangun; cek API dan fitur yang tersedia untuk akun.',docs:'https://developers.buymeacoffee.com/',requirements:['Akun developer dan aplikasi resmi','API credentials atau webhook yang didukung','Endpoint/capability terverifikasi'],steps:['Konfirmasi fitur API yang diperlukan tersedia untuk akun.','Simpan kredensial di backend.','Tes callback/webhook dan deduplikasi event sebelum aktivasi.'],docsLabel:'Developer docs'},
    {name:'Fourthwall',category:'Kreator',stage:'access',summary:'Adapter belum dibangun; kemampuan integrasi resmi perlu dikonfirmasi untuk use case.',docs:'https://docs.fourthwall.com/',requirements:['Akun creator/store','Akses API atau integrasi resmi untuk kebutuhan yang dipilih','Token/webhook sesuai dokumentasi'],steps:['Konfirmasi akses dan API yang berlaku untuk toko.','Pilih sinkronisasi katalog atau fulfillment yang didukung.','Implementasikan hanya capability yang dapat diuji.'],docsLabel:'Fourthwall docs'},
    {name:'Redbubble',category:'Print-on-demand',stage:'manual',summary:'Tetap manual sampai API seller resmi yang sesuai terkonfirmasi.',docs:'https://www.redbubble.com/',requirements:['Konfirmasi kanal API seller resmi','Hak penggunaan dan alur upload yang diizinkan'],steps:['Gunakan alur contributor resmi yang tersedia.','Jangan meminta password akun atau memakai scraping/endpoint privat.','Pertahankan status manual bila API seller tidak tersedia.'],docsLabel:'Situs resmi Redbubble'},
    {name:'Society6',category:'Print-on-demand',stage:'manual',summary:'Tetap manual sampai API seller resmi yang sesuai terkonfirmasi.',docs:'https://society6.com/',requirements:['Konfirmasi integrasi/API seller yang tersedia','Akses contributor dan hak karya'],steps:['Periksa dokumentasi dan opsi contributor resmi.','Jika tidak ada API yang disetujui, gunakan alur manual.','Jangan menandai koneksi aktif tanpa endpoint yang dapat diuji.'],docsLabel:'Situs resmi Society6'},
    {name:'Zazzle',category:'Print-on-demand',stage:'access',summary:'Program developer dan izin integrasi perlu dikonfirmasi.',docs:'https://www.zazzle.com/',requirements:['Konfirmasi program developer/API yang masih tersedia','Akun dan izin sesuai ketentuan'],steps:['Cari konfirmasi akses API dari kanal resmi Zazzle.','Jika akses seller tidak tersedia, dokumentasikan sebagai manual.','Jangan membangun otomasi sebelum syarat akses jelas.'],docsLabel:'Situs resmi Zazzle'},
    {name:'TeePublic',category:'Print-on-demand',stage:'manual',summary:'Tetap manual sampai API seller resmi dan diizinkan terkonfirmasi.',docs:'https://www.teepublic.com/',requirements:['Konfirmasi API seller resmi','Akun artist dan hak distribusi'],steps:['Gunakan workflow artist resmi.','Hindari scraping dan otomasi berbasis login/password.','Biarkan kanal berstatus manual sampai integrasi resmi dapat diuji.'],docsLabel:'Situs resmi TeePublic'},
    {name:'Printful',category:'Fulfillment',stage:'adapter',summary:'Adapter belum dibangun; API resmi mendukung alur katalog/fulfillment sesuai scope.',docs:'https://developers.printful.com/docs/',requirements:['Akun Printful dan API token','Store/product mapping','Webhook secret bila diperlukan'],steps:['Buat token API dengan akses minimum.','Implementasikan token storage dan verifikasi akun/store.','Uji produk/sample order di lingkungan aman sebelum fulfillment produksi.'],docsLabel:'Printful API docs'},
    {name:'Printify',category:'Fulfillment',stage:'adapter',summary:'Adapter belum dibangun; perlu API access dan pemetaan toko/produk.',docs:'https://developers.printify.com/',requirements:['Akun Printify dan API token','Store ID dan product mapping','Webhook/event handling bila digunakan'],steps:['Buat kredensial API melalui akun resmi.','Verifikasi store dan katalog tanpa membuat order berbayar.','Aktifkan order/fulfillment hanya dengan persetujuan eksplisit.'],docsLabel:'Printify developer docs'},
    {name:'Gelato',category:'Fulfillment',stage:'adapter',summary:'Adapter belum dibangun; API access dan alur fulfillment harus ditetapkan.',docs:'https://dashboard.gelato.com/docs/',requirements:['Akun Gelato dan API key yang sesuai','Product/print specification mapping','Shipping/fulfillment settings'],steps:['Konfirmasi API plan dan akses yang sesuai.','Simpan key di backend dan tes produk/quote yang tidak menimbulkan biaya.','Pisahkan uji katalog dari pembuatan order berbayar.'],docsLabel:'Gelato API docs'},
    {name:'Adobe Stock',category:'Stock media',stage:'manual',summary:'Gunakan alur contributor resmi; upload/payout API tidak diasumsikan tersedia.',docs:'https://contributor.stock.adobe.com/',requirements:['Akun contributor dan persetujuan konten','Kepatuhan lisensi, metadata, dan model release'],steps:['Kelola pengiriman melalui portal contributor resmi.','Siapkan metadata dan checklist hak cipta di NARATIVA.','Jangan menampilkan status API terhubung tanpa program resmi yang teruji.'],docsLabel:'Adobe Stock Contributor'},
    {name:'Shutterstock Contributor',category:'Stock media',stage:'access',summary:'Akses API contributor perlu diverifikasi; alur manual tetap tersedia.',docs:'https://submit.shutterstock.com/',requirements:['Akun contributor','Konfirmasi API/program partner resmi bila dibutuhkan','Kepatuhan lisensi dan metadata'],steps:['Gunakan portal contributor untuk workflow standar.','Konfirmasi akses integrasi khusus sebelum membangun adapter.','Siapkan metadata lokal tanpa mengklaim upload otomatis.'],docsLabel:'Shutterstock Contributor'},
    {name:'OpenSea',category:'Web3',stage:'access',summary:'Akses resmi, model marketplace, dan scope harus ditinjau sebelum adapter dibuat.',docs:'https://docs.opensea.io/',requirements:['Wallet/collection yang dikuasai pengguna','API access sesuai kebijakan dan kebutuhan','Review risiko transaksi dan signing'],steps:['Tentukan apakah kebutuhan hanya membaca data publik atau mengelola aset.','Jangan pernah meminta seed phrase/private key di NARATIVA.','Pisahkan read-only API dari transaksi on-chain yang memerlukan persetujuan eksplisit.'],docsLabel:'OpenSea developer docs'},
    {name:'itch.io',category:'Game',stage:'manual',summary:'Alur distribusi perlu ditentukan; tidak diasumsikan tersedia API publik untuk semua operasi.',docs:'https://itch.io/docs/creators/',requirements:['Akun kreator dan halaman proyek','Build, harga, dan metadata yang siap','Konfirmasi kemampuan API/upload resmi'],steps:['Siapkan metadata dan file rilis di Creator Studio.','Gunakan alur upload/publish resmi bila API tidak tersedia.','Catat link proyek setelah publikasi; jangan mengklaim sinkronisasi otomatis.'],docsLabel:'itch.io creator docs'},
    {name:'Steamworks',category:'Game',stage:'access',summary:'Memerlukan akun Steamworks partner dan akses API yang sesuai.',docs:'https://partner.steamgames.com/doc/home',requirements:['Steamworks partner onboarding','AppID dan hak akses yang relevan','Steam Web API key bila diperlukan'],steps:['Selesaikan onboarding partner dan app access.','Tentukan API yang diizinkan untuk use case.','Uji pada app/test environment sebelum mengotomasi rilis.'],docsLabel:'Steamworks documentation'},
    {name:'Google Play Books',category:'Buku',stage:'access',summary:'Program publisher/partner dan dukungan API perlu diverifikasi untuk wilayah/akun.',docs:'https://play.google.com/books/publish/',requirements:['Akun publisher dan eligibility','Konfirmasi API/partner access','Metadata, ISBN, dan hak distribusi'],steps:['Periksa eligibility dan workflow publisher yang tersedia.','Jika API publishing tidak tersedia untuk akun, gunakan portal resmi/manual.','Jangan menyamakan Google Books API publik dengan hak menerbitkan buku.'],docsLabel:'Google Play Books Partner Center'},
    {name:'Apple Books',category:'Buku',stage:'manual',summary:'Gunakan alur publisher resmi; integrasi publikasi otomatis belum diklaim.',docs:'https://authors.apple.com/',requirements:['Akun publisher dan kontrak/kelayakan','Metadata buku, file, wilayah, dan hak distribusi'],steps:['Siapkan EPUB, metadata, dan hak distribusi.','Gunakan Apple Books for Authors atau distributor resmi.','Adapter baru dibangun jika program API resmi untuk kebutuhan ini terkonfirmasi.'],docsLabel:'Apple Books for Authors'}
  ];

  const stageLabel = {
    approval:'Menunggu persetujuan / verifikasi',
    adapter:'Adapter belum dibangun',
    access:'Akses resmi perlu disiapkan',
    manual:'Alur manual / API belum terkonfirmasi'
  };
  function safeLink(url, label) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label;
    return a;
  }
  function renderRegister() {
    const q = ($('vendorFilter').value || '').trim().toLocaleLowerCase('id');
    const root = $('vendorRegister'); root.replaceChildren();
    const filtered = vendors.filter(v => [v.name,v.category,v.summary,...v.requirements,...v.steps].join(' ').toLocaleLowerCase('id').includes(q));
    filtered.forEach(v => {
      const row = document.createElement('article'); row.className = 'x-product-row';
      const info = document.createElement('div'); info.className = 'x-connector-info';
      const h = document.createElement('h3'); h.textContent = v.name;
      const p = document.createElement('p'); p.textContent = v.category + ' · ' + v.summary;
      const state = document.createElement('small'); state.className = 'x-connector-state'; state.textContent = stageLabel[v.stage] || 'Belum dikonfigurasi';
      const details = document.createElement('details'); details.className = 'x-connector-setup';
      const summary = document.createElement('summary'); summary.textContent = 'Lihat kebutuhan dan langkah konfigurasi';
      const requirementsTitle = document.createElement('strong'); requirementsTitle.textContent = 'Yang diperlukan';
      const reqList = document.createElement('ul');
      v.requirements.forEach(item => { const li = document.createElement('li'); li.textContent = item; reqList.append(li); });
      const stepsTitle = document.createElement('strong'); stepsTitle.textContent = 'Langkah berikutnya';
      const stepList = document.createElement('ol');
      v.steps.forEach(item => { const li = document.createElement('li'); li.textContent = item; stepList.append(li); });
      details.append(summary,requirementsTitle,reqList,stepsTitle,stepList);
      const link = safeLink(v.docs, v.docsLabel || 'Dokumentasi resmi');
      link.className = 'x-connector-doc';
      info.append(h,p,state,details,link);
      row.append(info); root.append(row);
    });
    const result = $('vendorResults');
    if (result) result.textContent = filtered.length + ' dari ' + vendors.length + ' kanal ditampilkan';
  }
  function notice(message, kind='info') { $('managerNotice').textContent = message; $('managerNotice').dataset.kind = kind; }
  async function refresh() {
    $('refreshStatuses').disabled = true;
    try {
      if (!db) throw new Error('Library Supabase belum termuat.');
      const {data: sessionData,error:sessionError} = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.user) {
        $('etsyState').textContent = 'Belum masuk ke akun NARATIVA';
        $('etsyDetail').textContent = 'Masuk melalui Akun / Masuk, lalu buka halaman ini kembali untuk memeriksa koneksi privat akun.';
        $('connectEtsy').disabled = true;
        $('connectedCount').textContent = '0';
        notice('Status privat belum dapat diperiksa karena sesi akun belum aktif. Tidak ada koneksi yang dihitung.', 'info');
        return;
      }
      $('connectEtsy').disabled = false;
      const {data,error} = await db.functions.invoke('etsy-connect',{body:{action:'status'}});
      if (error) throw error;
      if (data?.status === 'connected') {
        $('etsyState').textContent = 'OAuth aktif · token tersimpan';
        $('etsyDetail').textContent = 'Backend melaporkan token OAuth aktif. Verifikasi endpoint toko/listing belum dilakukan; konektor belum dinyatakan operasional.';
        $('connectedCount').textContent = '1';
        $('connectEtsy').textContent = 'Mulai ulang / periksa OAuth';
        notice('OAuth Etsy aktif di backend, tetapi panggilan verifikasi toko/listing belum berhasil dibuktikan. Hitungan ini menunjukkan token OAuth tersimpan, bukan integrasi operasional.', 'success');
      } else if (data?.status === 'action_required') {
        $('etsyState').textContent = 'Perlu tindakan · otorisasi ulang';
        $('etsyDetail').textContent = 'Koneksi tidak siap digunakan. Mulai OAuth kembali setelah akses aplikasi disetujui.';
        $('connectedCount').textContent = '0'; $('connectEtsy').textContent = 'Hubungkan ulang Etsy';
        notice('Koneksi Etsy memerlukan tindakan; tidak dihitung sebagai koneksi aktif.', 'error');
      } else {
        $('etsyState').textContent = 'Belum terhubung';
        $('etsyDetail').textContent = 'Otorisasi OAuth seller belum selesai.';
        $('connectedCount').textContent = '0'; $('connectEtsy').textContent = 'Hubungkan Etsy';
        notice('Belum ada koneksi Etsy untuk akun ini. Setelah persetujuan dan secret tersedia, jalankan OAuth lalu verifikasi API read-only.', 'info');
      }
    } catch (_) {
      $('etsyState').textContent = 'Belum dapat diverifikasi';
      $('etsyDetail').textContent = 'Periksa konfigurasi OAuth, status fungsi Supabase, dan sesi akun. Rahasia tidak ditampilkan di halaman.';
      $('connectedCount').textContent = '0';
      notice('Pemeriksaan status gagal atau konfigurasi belum lengkap. Koneksi tidak dihitung sebagai aktif.', 'error');
    } finally { $('refreshStatuses').disabled = false; }
  }
  $('connectEtsy').addEventListener('click', async () => {
    if (!db) { notice('Library Supabase belum termuat.', 'error'); return; }
    $('connectEtsy').disabled = true; $('connectEtsy').textContent = 'Menyiapkan OAuth…';
    try {
      const {data:sessionData} = await db.auth.getSession();
      if (!sessionData.session?.user) throw new Error('Masuk ke akun NARATIVA terlebih dahulu.');
      const {data,error} = await db.functions.invoke('etsy-connect',{body:{action:'start'}});
      if (error) throw error;
      if (!data?.authorization_url) throw new Error('Backend belum mengembalikan URL otorisasi.');
      window.location.assign(data.authorization_url);
    } catch (e) { notice(e.message || 'OAuth belum dapat dimulai. Periksa konfigurasi backend.', 'error'); $('connectEtsy').disabled = false; $('connectEtsy').textContent = 'Hubungkan Etsy'; }
  });
  $('refreshStatuses').addEventListener('click', refresh);
  $('vendorFilter').addEventListener('input', renderRegister);
  renderRegister();
  db?.auth.onAuthStateChange(() => refresh());
  refresh();
})();