(() => {
  const $ = (id) => document.getElementById(id);
  const notice = $('adminRuntimeNotice');
  const gate = $('access');
  const runtime = $('adminRuntime');
  const refresh = $('refreshAdminMetrics');
  const metricTargets = {
    worksTotal: 'adminMetricWorks',
    worksPublished: 'adminMetricPublished',
    worksInDraftOrReview: 'adminMetricDrafts',
    reportsOpen: 'adminMetricReports'
  };
  const setNotice = (message, kind = 'info') => {
    notice.textContent = message;
    notice.dataset.kind = kind;
  };
  const setMetric = (id, value) => {
    const node = $(id);
    if (node) node.textContent = Number.isFinite(Number(value)) ? Number(value).toLocaleString('id-ID') : '—';
  };

  async function loadMetrics() {
    if (!window.supabase?.createClient) {
      setNotice('Library Supabase belum termuat. Muat ulang halaman.', 'error');
      return;
    }
    refresh.disabled = true;
    refresh.textContent = 'Memeriksa akses…';
    try {
      const db = window.supabase.createClient(
        'https://hdsqwkydgruyfbqqwhdk.supabase.co',
        'sb_publishable_m24u_7V16Y-bq_B_YydL-w_dw_4bOb8'
      );
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw new Error('Sesi tidak dapat diverifikasi. Masuk kembali dan coba lagi.');
      if (!sessionData.session) {
        runtime.hidden = true;
        gate.hidden = false;
        setNotice('Masuk dengan akun yang telah diberi peran platform_admin untuk melihat ringkasan operasional.', 'info');
        return;
      }

      const { data, error } = await db.functions.invoke('admin-console', { body: {} });
      if (error || !data?.ok) {
        runtime.hidden = true;
        gate.hidden = false;
        const status = error?.context?.status;
        if (status === 403 || data?.error === 'platform_admin_role_required') {
          setNotice('Akun ini belum memiliki peran platform_admin. Konsol tetap terkunci.', 'error');
        } else if (status === 401 || data?.error === 'authentication_invalid') {
          setNotice('Sesi tidak valid atau kedaluwarsa. Masuk kembali.', 'error');
        } else {
          setNotice('Layanan admin belum siap atau audit tidak berhasil. Tidak ada data istimewa yang ditampilkan.', 'error');
        }
        return;
      }

      Object.entries(metricTargets).forEach(([key, id]) => setMetric(id, data.metrics?.[key]));
      gate.hidden = true;
      runtime.hidden = false;
      setNotice('Akses server terverifikasi. Mode baca-saja aktif; tindakan istimewa masih dinonaktifkan.', 'success');
    } catch (_) {
      runtime.hidden = true;
      gate.hidden = false;
      setNotice('Tidak dapat memverifikasi akses admin. Konsol tetap terkunci.', 'error');
    } finally {
      refresh.disabled = false;
      refresh.textContent = 'Muat ulang metrik';
    }
  }

  refresh?.addEventListener('click', loadMetrics);
  loadMetrics();
})();
