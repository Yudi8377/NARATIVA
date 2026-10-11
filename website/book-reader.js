(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const workId = params.get('work');
  const catalog = Array.isArray(window.NARATIVA_READER_CATALOG) ? window.NARATIVA_READER_CATALOG : [];
  const work = catalog.find(item => item.id === workId);
  const pageNode = $('bookPage'), turnLayer = $('turnLayer');
  const prevButtons = [$('previous'), $('previousBottom')], nextButtons = [$('next'), $('nextBottom')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pages = [], current = 0, turning = false, contentPages = [], downloadedPage = '';
  const categoryNames = {komik:'Komik',manga:'Manga',manhwa:'Manhwa',anime:'Animasi',fantasi:'Novel',misteri:'Cerita misteri'};
  const esc = value => String(value ?? '');
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function buildCover() {
    const root = element('div','cover-inner');
    root.append(element('div','cover-ornament',work.emoji || '✦'));
    root.append(element('div','cover-kicker','NARATIVA · '+(categoryNames[work.category] || work.category || 'Cerita')));
    root.append(element('h2','cover-title',work.title));
    root.append(element('div','cover-summary',work.description || 'Sebuah dunia menunggu untuk dibuka.'));
    root.append(element('div','cover-rule'));
    root.append(element('div','cover-author',work.author || 'Kreator NARATIVA'));
    return root;
  }
  function buildPaperPage(title, bodyNode, number, extraClass='') {
    const root = element('section','page-inner '+extraClass);
    const running = element('div','page-running-head');
    running.append(element('span', '', work.title), element('span','','NARATIVA EDITION'));
    root.append(running);
    if (title) root.append(element('h2','page-title',title));
    const body = element('div','page-copy');
    if (bodyNode) body.append(bodyNode);
    root.append(body);
    const foot = element('div','page-foot');
    foot.append(element('span','',work.author || 'NARATIVA'),element('span','',String(number).padStart(2,'0')));
    root.append(foot);
    return root;
  }
  function addContents() {
    const list = element('ol','contents-list');
    const entries = [];
    if (work.localPages?.length) work.localPages.forEach((_,i)=>entries.push({title:'Halaman ilustrasi '+(i+1),target:2+i}));
    else if (work.contentUrl) contentPages.forEach((_,i)=>entries.push({title:'Bagian '+(i+1),target:2+i}));
    else if (work.localPlayerUrl) entries.push({title:'Pemutaran animasi',target:2});
    if (!entries.length) entries.push({title:'Isi karya',target:2});
    entries.forEach(entry => {
      const li = element('li'); li.append(element('span','',String(entry.target+1).padStart(2,'0')),element('div','',entry.title));
      li.tabIndex=0; li.setAttribute('role','button'); li.setAttribute('aria-label','Buka '+entry.title);
      li.addEventListener('click',()=>goTo(entry.target));
      li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goTo(entry.target);}});
      list.append(li);
    });
    return list;
  }
  function makeCoverPage() {
    const root = element('section','book-page is-cover');
    root.append(buildCover());
    return {node:root,label:'Sampul',download:null};
  }
  function makeContentsPage() {
    const body = addContents();
    const node = buildPaperPage('Daftar Isi',body,2);
    const intro = element('p','','Pilih bagian untuk melompat, atau balik halaman satu per satu untuk menikmati karya ini seperti buku cetak.');
    node.querySelector('.page-copy').prepend(intro);
    return {node,label:'Daftar isi',download:null};
  }
  function makeTextPages(text) {
    const normalized = String(text || '').replace(/\r/g,'').trim();
    const paragraphs = normalized.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
    const chunks=[]; let page=[], chars=0;
    for(const p of paragraphs){
      const size=p.length;
      if(page.length && chars+size>1150){chunks.push(page);page=[];chars=0;}
      page.push(p);chars+=size;
    }
    if(page.length)chunks.push(page);
    return chunks.map((paragraphs,i)=>{
      const copy=element('div');
      paragraphs.forEach(p=>copy.append(element('p','',p)));
      return {node:buildPaperPage('Bagian '+(i+1),copy,i+3),label:'Bagian '+(i+1),download:paragraphs.join('\n\n')};
    });
  }
  function makeArtPages() {
    return work.localPages.map((src,i)=>{
      const holder=element('div','art-page');
      const img=element('img'); img.src=src; img.alt=work.title+' — halaman '+(i+1); img.draggable=false;
      holder.append(img);
      return {node:holder,label:'Ilustrasi '+(i+1),download:src,image:true};
    });
  }
  function makeMediaPage() {
    const holder=element('div','media-page');
    const frame=element('iframe'); frame.src=work.localPlayerUrl; frame.title=work.title+' — animasi'; frame.loading='lazy'; frame.allow='fullscreen';
    holder.append(frame,element('p','media-caption','Putar animasi · gunakan kontrol pemutar di dalam halaman.'));
    return {node:holder,label:'Animasi',download:null};
  }
  function makeClosingPage() {
    const root=element('section','page-inner closing-page');
    root.append(element('div','closing-mark','✦'),element('h2','', 'Sampai di halaman terakhir'),element('p','', 'Terima kasih telah memasuki dunia '+work.title+'. Temukan karya berikutnya di NARATIVA.'));
    const meta=element('div','page-foot');meta.style.width='100%';meta.append(element('span','',work.author||'NARATIVA'),element('span','','AKHIR'));
    root.append(meta);
    return {node:root,label:'Sampul belakang',download:null};
  }
  function render() {
    const entry=pages[current];
    pageNode.replaceChildren(entry.node.cloneNode(true));
    pageNode.classList.toggle('is-cover',current===0);
    $('pageLabel').textContent=entry.label+' · '+(current+1)+'/'+pages.length;
    $('progressBar').style.width=((current+1)/pages.length*100)+'%';
    prevButtons.forEach(b=>b.disabled=current===0||turning);
    nextButtons.forEach(b=>b.disabled=current===pages.length-1||turning);
    $('nextBottom').textContent=current===0?'Buka buku →':current===pages.length-1?'Selesai ✓':'Lanjut →';
    $('download').disabled=!entry.download;
    $('download').textContent=entry.image?'Unduh ilustrasi':'Unduh halaman';
    downloadedPage=entry.download || '';
  }
  function goTo(index) {
    if(turning || index<0 || index>=pages.length || index===current)return;
    const forward=index>current;
    if(reducedMotion){current=index;render();return;}
    turning=true;
    turnLayer.replaceChildren(pageNode.cloneNode(true));
    turnLayer.hidden=false;
    turnLayer.className='turn-layer '+(forward?'turn-forward':'turn-back');
    prevButtons.concat(nextButtons).forEach(b=>b.disabled=true);
    const finish=()=>{
      turnLayer.removeEventListener('animationend',finish);
      turnLayer.hidden=true;turnLayer.className='turn-layer';turnLayer.replaceChildren();
      current=index;turning=false;render();
    };
    turnLayer.addEventListener('animationend',finish,{once:true});
    window.setTimeout(()=>{if(turning)finish();},700);
  }
  function showMessage(message){$('readerNote').textContent=message;}
  async function init() {
    if(!work){
      $('bookTitle').textContent='Karya tidak ditemukan';
      pageNode.classList.add('is-cover');
      pageNode.textContent='Karya ini tidak ditemukan di katalog NARATIVA.';
      prevButtons.concat(nextButtons).forEach(b=>b.disabled=true);
      $('download').disabled=true;showMessage('Kembali ke katalog untuk memilih karya yang tersedia.');return;
    }
    $('bookTitle').textContent=work.title;
    document.title=work.title+' — Buku Interaktif NARATIVA';
    showMessage((work.author||'Kreator NARATIVA')+' · '+(work.rights||'Lisensi mengikuti ketentuan karya')+' · Gunakan panah kiri/kanan atau tombol untuk membalik halaman.');
    pages.push(makeCoverPage());
    pages.push(makeContentsPage());
    try {
      if(Array.isArray(work.localPages)&&work.localPages.length) pages.push(...makeArtPages());
      else if(work.contentUrl){
        showMessage('Membuka naskah lokal…');
        const response=await fetch(work.contentUrl);
        if(!response.ok)throw new Error('HTTP '+response.status);
        const text=await response.text();
        contentPages=makeTextPages(text);
        pages.push(...contentPages);
      } else if(work.localPlayerUrl) pages.push(makeMediaPage());
      else pages.push({node:buildPaperPage('Isi karya',element('p','',work.description||'Konten belum tersedia.'),3),label:'Isi karya',download:null});
    } catch(error) {
      const copy=element('div');copy.append(element('p','','Naskah belum dapat dimuat dari penyimpanan NARATIVA.'),element('p','','Periksa koneksi lalu muat ulang buku ini.'));
      pages.push({node:buildPaperPage('Naskah belum tersedia',copy,3),label:'Naskah belum tersedia',download:null});
    }
    pages.push(makeClosingPage());
    render();
    showMessage((work.author||'Kreator NARATIVA')+' · '+(work.rights||'Lisensi mengikuti ketentuan karya')+' · Buku interaktif siap dibaca.');
  }
  prevButtons.forEach(b=>b.addEventListener('click',()=>goTo(current-1)));
  nextButtons.forEach(b=>b.addEventListener('click',()=>goTo(current+1)));
  $('exitReader').addEventListener('click',()=>{if(window.opener&&!window.opener.closed)window.close();else location.href='reader.html';});
  $('screenMode').addEventListener('click',async()=>{
    const full=!document.body.classList.contains('is-fullscreen');
    document.body.classList.toggle('is-fullscreen',full);
    $('screenMode').setAttribute('aria-pressed',String(full));
    $('screenMode').textContent=full?'▣ Setengah layar':'⛶ Layar penuh';
    try{
      if(full){
        if(document.documentElement.requestFullscreen&&!document.fullscreenElement)await document.documentElement.requestFullscreen();
        else if(window.resizeTo&&screen?.availWidth){window.moveTo(0,0);window.resizeTo(screen.availWidth,screen.availHeight);}
      }else{
        if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();
        if(window.resizeTo&&screen?.availWidth){const w=Math.min(980,Math.round(screen.availWidth*.65)),h=Math.min(900,Math.round(screen.availHeight*.86));window.resizeTo(w,h);window.moveTo(Math.max(0,Math.round((screen.availWidth-w)/2)),Math.max(0,Math.round((screen.availHeight-h)/2)));}
      }
    }catch(_){showMessage('Ukuran layar penuh diatur oleh izin browser. Anda tetap dapat membaca dan membalik halaman.');}
  });
  $('download').addEventListener('click',async()=>{
    const entry=pages[current];
    if(!entry?.download){showMessage('Unduhan tidak tersedia untuk halaman ini. Hak unduh mengikuti lisensi karya.');return;}
    if(entry.image){
      if(work.license!=='CC BY 4.0'){showMessage('Lisensi karya belum mengizinkan unduhan halaman.');return;}
      try{const response=await fetch(entry.download);if(!response.ok)throw new Error('fetch');const blob=await response.blob(),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=work.id+'-halaman-'+String(current+1).padStart(2,'0')+'.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);showMessage('Halaman diunduh. Atribusi tetap diperlukan sesuai lisensi CC BY 4.0.');}catch(_){showMessage('Unduhan gagal. Coba lagi setelah halaman dimuat.');}
      return;
    }
    const blob=new Blob([entry.download],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=work.id+'-halaman-'+String(current+1).padStart(2,'0')+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);showMessage('Teks halaman ini diunduh sebagai file TXT.');
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();goTo(current-1);}
    if(event.key==='ArrowRight'||event.key===' '){if(event.target===document.body||event.target===pageNode){event.preventDefault();goTo(current+1);}}
    if(event.key==='Escape'&&window.opener&&!window.opener.closed)window.close();
  });
  let touchStart=null;
  $('bookFrame').addEventListener('touchstart',event=>{touchStart=event.changedTouches[0].clientX;},{passive:true});
  $('bookFrame').addEventListener('touchend',event=>{if(touchStart===null)return;const dx=event.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>55)goTo(current+(dx<0?1:-1));touchStart=null;},{passive:true});
  init();
})();