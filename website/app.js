(() => {
  const byId = (id) => document.getElementById(id);
  const menu = byId('nav');
  const menuToggle = byId('menuToggle');
  const titleInput = byId('storyTitle');
  const storyInput = byId('storyText');
  const formatSelect = byId('formatSelect');
  const languageSelect = byId('languageSelect');
  const generateBtn = byId('generateBtn');
  const results = byId('results');
  const formNote = byId('formNote');
  byId('year').textContent = String(new Date().getFullYear());

  menuToggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    menuToggle.textContent = open ? '×' : '☰';
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  }));

  const labels = {
    id: {
      format: { comic: 'Living Comics', book: 'Buku digital', audio: 'Audio drama', video: 'Rencana AI Video' },
      errorTitle: 'Naskah masih terlalu pendek',
      errorBody: 'Tambahkan setidaknya 80 karakter agar draft adegan lebih bermakna.',
      noTitle: 'Tanpa judul',
      draft: 'Draft lokal • belum ditinjau',
      intro: 'Adegan awal yang disarikan dari teks Anda. Silakan edit dan tinjau sebelum digunakan.',
      source: 'Cuplikan sumber',
      visual: 'Arahan visual',
      continuity: 'Checklist kesinambungan',
      continuityText: 'Periksa nama tokoh, urutan waktu, lokasi, dan fakta kanon sebelum menyetujui adegan.',
      scene: 'ADEGAN',
      saveNote: 'Draft dibuat lokal di browser ini. Naskah tidak dikirim ke server.',
      words: 'kata',
      titles: ['Pembuka', 'Pemicu konflik', 'Perkembangan', 'Titik pilihan', 'Penutup sementara'],
      visualText: ['Tetapkan suasana dunia, pencahayaan, dan titik pandang pembuka.', 'Perjelas perubahan atau penemuan yang menggerakkan cerita.', 'Tampilkan respons tokoh dan konsekuensi awal.', 'Tonjolkan pilihan tokoh serta taruhan emosional.', 'Sisakan pertanyaan terbuka untuk adegan berikutnya.']
    },
    en: {
      format: { comic: 'Living Comics', book: 'Digital book', audio: 'Audio drama', video: 'AI Video plan' },
      errorTitle: 'The manuscript is too short',
      errorBody: 'Add at least 80 characters to create a useful scene draft.',
      noTitle: 'Untitled',
      draft: 'Local draft • not reviewed',
      intro: 'An initial scene outline derived from your text. Edit and review it before use.',
      source: 'Source excerpt',
      visual: 'Visual direction',
      continuity: 'Continuity checklist',
      continuityText: 'Check character names, timeline, locations, and canon facts before approving scenes.',
      scene: 'SCENE',
      saveNote: 'Draft created locally in this browser. Your manuscript is not sent to a server.',
      words: 'words',
      titles: ['Opening', 'Inciting event', 'Development', 'Point of choice', 'Provisional ending'],
      visualText: ['Establish the world mood, lighting, and opening point of view.', 'Clarify the discovery or change that moves the story forward.', 'Show the character response and initial consequences.', 'Highlight the character choice and emotional stakes.', 'Leave an open question for the next scene.']
    }
  };

  function splitSentences(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    return sentences.map(s => s.trim()).filter(Boolean);
  }
  function buildScenes(text) {
    const sentences = splitSentences(text);
    const groups = [];
    const targetCount = Math.min(5, Math.max(2, Math.ceil(sentences.length / 2)));
    const chunkSize = Math.max(1, Math.ceil(sentences.length / targetCount));
    for (let i = 0; i < sentences.length; i += chunkSize) {
      groups.push(sentences.slice(i, i + chunkSize).join(' '));
    }
    return groups.slice(0, 5);
  }
  function addText(parent, tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }
  function render() {
    const lang = labels[languageSelect.value];
    const title = titleInput.value.trim() || lang.noTitle;
    const text = storyInput.value.trim();
    if (text.length < 80) {
      results.hidden = false;
      results.replaceChildren();
      addText(results, 'h3', '', lang.errorTitle);
      addText(results, 'p', 'results-intro', lang.errorBody);
      formNote.textContent = lang.saveNote;
      return;
    }
    const scenes = buildScenes(text);
    const words = text.split(/\s+/).filter(Boolean).length;
    results.replaceChildren();
    addText(results, 'h3', '', title);
    addText(results, 'p', 'results-intro', lang.draft + ' · ' + lang.format[formatSelect.value] + ' · ' + words + ' ' + lang.words);
    scenes.forEach((excerpt, i) => {
      const card = document.createElement('article');
      card.className = 'scene';
      const top = document.createElement('div');
      top.className = 'scene-top';
      addText(top, 'span', '', lang.scene + ' ' + String(i + 1).padStart(2, '0'));
      addText(top, 'span', '', 'DRAFT');
      card.appendChild(top);
      addText(card, 'h4', '', lang.titles[Math.min(i, lang.titles.length - 1)]);
      addText(card, 'p', '', excerpt);
      addText(card, 'small', '', lang.source + ': ' + Math.min(100, Math.round((excerpt.length / text.length) * 100)) + '% of source sequence');
      addText(card, 'small', '', lang.visual + ': ' + lang.visualText[Math.min(i, lang.visualText.length - 1)]);
      results.appendChild(card);
    });
    const check = document.createElement('article');
    check.className = 'scene';
    addText(check, 'h4', '', lang.continuity);
    addText(check, 'p', '', lang.continuityText);
    results.appendChild(check);
    results.hidden = false;
    formNote.textContent = lang.saveNote;
    results.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  generateBtn.addEventListener('click', render);
  languageSelect.addEventListener('change', () => {
    formNote.textContent = labels[languageSelect.value].saveNote;
  });
})();