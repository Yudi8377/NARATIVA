(() => {
  const $ = id => document.getElementById(id);
  const supabaseUrl = 'https://hdsqwkydgruyfbqqwhdk.supabase.co';
  const publicKey = 'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8';
  const db = window.supabase?.createClient?.(supabaseUrl, publicKey);
  const vendors = [
    ['Etsy','Marketplace','Menunggu persetujuan API; OAuth backend tersedia, koneksi seller belum diverifikasi.'],
    ['Shopify','Toko','Adapter belum dibangun'],['WooCommerce','Toko','Adapter belum dibangun'],['BigCommerce','Toko','Adapter belum dibangun'],['Wix Stores','Toko','Adapter belum dibangun'],['Squarespace Commerce','Toko','Adapter belum dibangun'],
    ['eBay','Marketplace','Akses developer perlu disiapkan'],['Amazon Seller','Marketplace','SP-API; kelayakan dan akses diperlukan'],['TikTok Shop','Marketplace','Akses partner/wilayah perlu diverifikasi'],['Shopee','Marketplace','Persetujuan Open Platform diperlukan'],['Tokopedia','Marketplace','Akses seller/partner perlu diverifikasi'],['Lazada','Marketplace','Open Platform; akses perlu diverifikasi'],
    ['Gumroad','Digital','Adapter belum dibangun'],['Patreon','Membership','Adapter belum dibangun'],['Ko-fi','Membership','Adapter belum dibangun'],['Buy Me a Coffee','Membership','Adapter belum dibangun'],['Fourthwall','Kreator','Adapter belum dibangun'],
    ['Redbubble','Print-on-demand','Kanal manual; API seller perlu dikonfirmasi'],['Society6','Print-on-demand','Kanal manual; API seller perlu dikonfirmasi'],['Zazzle','Print-on-demand','Program developer perlu dikonfirmasi'],['TeePublic','Print-on-demand','Kanal manual; API perlu dikonfirmasi'],
    ['Printful','Fulfillment','Adapter belum dibangun'],['Printify','Fulfillment','Adapter belum dibangun'],['Gelato','Fulfillment','Adapter belum dibangun'],
    ['Adobe Stock','Stock media','Ikuti alur contributor resmi'],['Shutterstock Contributor','Stock media','Akses contributor perlu diverifikasi'],
    ['OpenSea','Web3','Akses resmi dan scope perlu ditinjau'],['itch.io','Game','Alur distribusi perlu ditentukan'],['Steamworks','Game','Akses partner perlu disiapkan'],['Google Play Books','Buku','Program partner/publisher perlu diverifikasi'],['Apple Books','Buku','Alur publisher resmi perlu diverifikasi']
  ];
  function renderRegister() {
    const q = ($('vendorFilter').value || '').trim().toLocaleLowerCase('id');
    const root = $('vendorRegister'); root.replaceChildren();
    vendors.filter(v => v.join(' ').toLocaleLowerCase('id').includes(q)).forEach(([name,category,note]) => {
      const row = document.createElement('article'); row.className = 'x-product-row';
      const info = document.createElement('div'); const h = document.createElement('h3'); h.textContent = name;
      const p = document.createElement('p'); p.textContent = category + ' · ' + note;
      const state = document.createElement('small'); state.textContent = name === 'Etsy' ? 'Menunggu persetujuan / verifikasi' : 'Belum dikonfigurasi · kanal rencana';
      info.append(h,p,state); row.append(info); root.append(row);
    });
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
        $('etsyState').textContent = 'OAuth aktif · status backend';
        $('etsyDetail').textContent = 'Backend melaporkan koneksi aktif. Verifikasi endpoint toko/listing masih merupakan gerbang terpisah sebelum operasi listing dianggap siap.';
        $('connectedCount').textContent = '1';
        $('connectEtsy').textContent = 'Periksa koneksi';
        notice('Backend melaporkan token OAuth aktif. Akses Etsy ke toko/listing belum diuji melalui panggilan API; operasi listing/pesanan belum aktif.', 'success');
      } else if (data?.status === 'action_required') {
        $('etsyState').textContent = 'Perlu tindakan · otorisasi ulang';
        $('etsyDetail').textContent = 'Koneksi tidak siap digunakan. Mulai OAuth kembali setelah akses aplikasi disetujui.';
        $('connectedCount').textContent = '0'; $('connectEtsy').textContent = 'Hubungkan ulang Etsy';
        notice('Koneksi Etsy memerlukan tindakan; tidak dihitung sebagai koneksi aktif.', 'error');
      } else {
        $('etsyState').textContent = 'Belum terhubung';
        $('etsyDetail').textContent = 'Otorisasi OAuth seller belum selesai.';
        $('connectedCount').textContent = '0'; $('connectEtsy').textContent = 'Hubungkan Etsy';
        notice('Belum ada koneksi Etsy terverifikasi untuk akun ini.', 'info');
      }
    } catch (e) {
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