(() => {
  const $ = id => document.getElementById(id);
  const gate = $('access'), runtime = $('adminRuntime'), notice = $('adminRuntimeNotice');
  const loginNotice = $('adminLoginNotice'), form = $('adminLoginForm'), loginButton = $('adminLoginButton'), logoutButton = $('adminLogoutButton'), refresh = $('refreshAdminMetrics');
  const ids = {worksTotal:'adminMetricWorks',worksPublished:'adminMetricPublished',worksInDraftOrReview:'adminMetricDrafts',reportsOpen:'adminMetricReports'};
  const db = window.supabase?.createClient?.('https://hdsqwkydgruyfbqqwhdk.supabase.co','sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8');
  const message = (text,kind='info') => { if(loginNotice){loginNotice.textContent=text;loginNotice.dataset.kind=kind;} };
  const locked = (text,kind='info') => {runtime.hidden=true;gate.hidden=false;message(text,kind);};
  async function check() {
    if(!db){locked('Komponen autentikasi belum termuat. Muat ulang halaman.','error');return;}
    if(refresh){refresh.disabled=true;refresh.textContent='Memeriksa akses…';}
    try {
      const {data:s,error:sError}=await db.auth.getSession();
      if(sError) throw sError;
      if(!s.session){locked('Masuk dengan akun NARATIVA yang memiliki peran platform_admin.');return;}
      const {data,error}=await db.functions.invoke('admin-console',{body:{}});
      if(error||!data?.ok){
        const status=error?.context?.status;
        locked(status===403||data?.error==='platform_admin_role_required'?'Login berhasil, tetapi peran platform_admin tidak aktif pada akun ini.':'Server belum dapat memverifikasi akses atau mencatat audit. Data operasional tetap disembunyikan.','error');return;
      }
      Object.entries(ids).forEach(([key,id])=>{const node=$(id);if(node)node.textContent=Number(data.metrics?.[key]??0).toLocaleString('id-ID');});
      gate.hidden=true;runtime.hidden=false;
      if(notice){notice.textContent='Akses server terverifikasi. Mode baca-saja aktif; tindakan istimewa tetap dinonaktifkan.';notice.dataset.kind='success';}
      if(logoutButton)logoutButton.hidden=false;
      message('Akun terautentikasi dan peran admin terverifikasi oleh server.','success');
    } catch(_){locked('Tidak dapat memverifikasi akses admin. Periksa koneksi lalu coba lagi.','error');}
    finally{if(refresh){refresh.disabled=false;refresh.textContent='Muat ulang metrik';}}
  }
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!db){message('Komponen autentikasi belum termuat. Muat ulang halaman.','error');return;}
    loginButton.disabled=true;loginButton.textContent='Memverifikasi…';
    try{
      const {error}=await db.auth.signInWithPassword({email:$('adminEmail').value.trim(),password:$('adminPassword').value});
      if(error)throw error;
      $('adminPassword').value='';
      message('Login berhasil. Memeriksa peran admin di server…');
      await check();
    }catch(_){message('Login gagal. Periksa email, kata sandi, dan status akun lalu coba lagi.','error');}
    finally{loginButton.disabled=false;loginButton.textContent='Masuk dan verifikasi';}
  });
  logoutButton?.addEventListener('click',async()=>{if(db)await db.auth.signOut();locked('Anda telah keluar. Masuk kembali untuk memverifikasi akses.');logoutButton.hidden=true;});
  refresh?.addEventListener('click',check);
  db?.auth.onAuthStateChange((_event,session)=>{if(!session)locked('Belum ada sesi login. Masuk menggunakan akun admin yang terdaftar.');else check();});
  check();
})();