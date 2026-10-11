(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const workId = params.get('work');
  const storyId = params.get('story');
  const catalog = Array.isArray(window.NARATIVA_READER_CATALOG) ? window.NARATIVA_READER_CATALOG : [];
  const demoStories = {
    rain:{id:'demo-rain',title:'Perpustakaan di Ujung Hujan',author:'NARATIVA Studio · cerita demo',category:'fantasi',genre:'Fantasi · Misteri',emoji:'🌧️',description:'Sebuah buku menyimpan kenangan yang belum pernah terjadi.',demoText:'Di kota yang selalu diguyur hujan, seorang penjaga perpustakaan menemukan buku tanpa judul. Setiap halaman berisi kenangan yang belum pernah terjadi. Pada halaman terakhir, ia melihat namanya sendiri, ditulis dengan tinta yang masih basah.\n\nMalam itu, bunyi lonceng terdengar dari lantai yang sudah lama ditutup. Ia membuka buku itu sekali lagi dan menemukan satu kalimat baru: “Jangan biarkan hujan berhenti sebelum fajar.”'},
    cloud:{id:'demo-cloud',title:'Kota di Atas Awan',author:'NARATIVA Studio · cerita demo',category:'komik',genre:'Fantasi · Petualangan',emoji:'☁️',description:'Seorang kurir menemukan jalan menuju kota yang hilang.',demoText:'Di atas kabut yang tak pernah surut, sebuah kota bergerak mengikuti arah angin. Seorang kurir muda menerima paket tanpa alamat. Satu-satunya petunjuk adalah peta yang berubah setiap kali ia berkedip.\n\nKetika ia membuka paket itu, langit berderak seperti kaca. Sebuah tangga cahaya turun dari kota yang selama ini hanya tampak dalam mimpi.'},
    archive:{id:'demo-archive',title:'Arsip Tengah Malam',author:'NARATIVA Studio · cerita demo',category:'misteri',genre:'Misteri · Detektif',emoji:'🔎',description:'Catatan yang hilang membawa detektif ke sebuah rahasia.',demoText:'Setiap tengah malam, satu berkas baru muncul di ruang arsip yang telah dikunci selama dua puluh tahun. Detektif Mara menemukan bahwa semua berkas itu mencatat kejadian sehari sebelum terjadi.\n\nBerkas malam ini hanya berisi foto ruang arsip. Di belakang foto, dengan tulisan tangan Mara sendiri, tertulis: “Jangan masuk setelah pukul dua belas.”'}
  };
  let work = catalog.find(item => item.id === workId);
  if (!work && demoStories[storyId]) work = demoStories[storyId];
  const pageNode = $('bookPage'), turnLayer = $('turnLayer'), curlLayer = $('pageCurl'), bookFrame = $('bookFrame');
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
    else if (work.contentUrl || work.demoText) contentPages.forEach((_,i)=>entries.push({title:'Bagian '+(i+1),target:2+i}));
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
    return {node:buildCover(),label:'Sampul',download:null};
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
    let interiorPages = [];
    try {
      if(Array.isArray(work.localPages)&&work.localPages.length) interiorPages = makeArtPages();
      else if(work.demoText){
        contentPages=makeTextPages(work.demoText);
        interiorPages=contentPages;
      } else if(work.contentUrl){
        showMessage('Membuka naskah lokal…');
        const response=await fetch(work.contentUrl);
        if(!response.ok)throw new Error('HTTP '+response.status);
        const text=await response.text();
        contentPages=makeTextPages(text);
        interiorPages=contentPages;
      } else if(work.localPlayerUrl) interiorPages = [makeMediaPage()];
      else interiorPages = [{node:buildPaperPage('Isi karya',element('p','',work.description||'Konten belum tersedia.'),3),label:'Isi karya',download:null}];
    } catch(error) {
      const copy=element('div');copy.append(element('p','','Naskah belum dapat dimuat dari penyimpanan NARATIVA.'),element('p','','Periksa koneksi lalu muat ulang buku ini.'));
      interiorPages=[{node:buildPaperPage('Naskah belum tersedia',copy,3),label:'Naskah belum tersedia',download:null}];
    }
    pages.push(makeContentsPage());
    pages.push(...interiorPages);
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
    if(work.license!=='CC BY 4.0'){showMessage('Unduhan untuk karya ini belum dibuka karena izin distribusi file belum dikonfirmasi.');return;}
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
  // Corner drag/curl: hover near a corner to lift paper, drag inward to turn it.
  let curlGesture = null;
  const cornerSize = () => Math.max(54, Math.min(100, bookFrame.clientWidth * .16));
  function clearCurl() {
    curlGesture = null;
    bookFrame.classList.remove('is-curling','is-dragging');
    curlLayer.className = 'page-curl';
    curlLayer.style.opacity = '0';
    ['curlDropShadow','curlPaperShape','curlPaperShade','curlCrease'].forEach(id=>$(id)?.setAttribute('d',''));
  }
  function paintCurl(clientX, clientY, side, bottom, dragging) {
    const rect = bookFrame.getBoundingClientRect();
    const w = Math.max(1,rect.width), h = Math.max(1,rect.height);
    const x = Math.max(0,Math.min(w,clientX-rect.left));
    const y = Math.max(0,Math.min(h,clientY-rect.top));
    curlLayer.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const right = side==='right', ax = right?w:0, ay = bottom?h:0;
    const depth = Math.max(28,Math.min(w,h)*.34);
    let ex, ey, fx, fy, cx1, cy1, cx2, cy2;
    if(right && !bottom){
      ex=w; ey=Math.max(0,Math.min(h,y+depth*.58)); fx=Math.max(0,Math.min(w,x+depth*.58)); fy=0;
      cx1=w-depth*.1; cy1=y+depth*.22; cx2=x+depth*.22; cy2=depth*.08;
    } else if(right && bottom){
      ex=w; ey=Math.min(h,Math.max(0,y-depth*.58)); fx=Math.max(0,Math.min(w,x+depth*.58)); fy=h;
      cx1=w-depth*.1; cy1=y-depth*.22; cx2=x+depth*.22; cy2=h-depth*.08;
    } else if(!right && !bottom){
      ex=0; ey=Math.max(0,Math.min(h,y+depth*.58)); fx=Math.min(w,Math.max(0,x-depth*.58)); fy=0;
      cx1=depth*.1; cy1=y+depth*.22; cx2=x-depth*.22; cy2=depth*.08;
    } else {
      ex=0; ey=Math.min(h,Math.max(0,y-depth*.58)); fx=Math.min(w,Math.max(0,x-depth*.58)); fy=h;
      cx1=depth*.1; cy1=y-depth*.22; cx2=x-depth*.22; cy2=h-depth*.08;
    }
    const n = v => Number(v).toFixed(1);
    const path = `M ${n(ax)} ${n(ay)} L ${n(ex)} ${n(ey)} Q ${n(cx1)} ${n(cy1)} ${n(x)} ${n(y)} Q ${n(cx2)} ${n(cy2)} ${n(fx)} ${n(fy)} L ${n(ax)} ${n(ay)} Z`;
    const crease = `M ${n(ex)} ${n(ey)} Q ${n(cx1)} ${n(cy1)} ${n(x)} ${n(y)} Q ${n(cx2)} ${n(cy2)} ${n(fx)} ${n(fy)}`;
    $('curlPaperShape').setAttribute('d',path);
    $('curlPaperShade').setAttribute('d',path);
    $('curlDropShadow').setAttribute('d',path);
    $('curlCrease').setAttribute('d',crease);
    curlLayer.className = 'page-curl is-visible' + (side==='left'?' is-left':'') + (bottom?' is-bottom':'');
    curlLayer.style.opacity = String(dragging ? .98 : .72);
    bookFrame.classList.add('is-curling');
    bookFrame.classList.toggle('is-dragging',!!dragging);
  }
  function cornerAt(event) {
    const rect = bookFrame.getBoundingClientRect(), size = cornerSize();
    const localX=event.clientX-rect.left, localY=event.clientY-rect.top;
    if(localX > rect.width-size && localY < size && current < pages.length-1) return {side:'right',bottom:false};
    if(localX > rect.width-size && localY > rect.height-size && current < pages.length-1) return {side:'right',bottom:true};
    if(localX < size && localY < size && current > 0) return {side:'left',bottom:false};
    if(localX < size && localY > rect.height-size && current > 0) return {side:'left',bottom:true};
    // The lower edge itself is draggable, not just its two corners.
    if(localY > rect.height-size && localX >= rect.width*.5 && current < pages.length-1) return {side:'right',bottom:true};
    if(localY > rect.height-size && localX < rect.width*.5 && current > 0) return {side:'left',bottom:true};
    return null;
  }
  bookFrame.addEventListener('pointermove', event => {
    if(turning) return;
    if(curlGesture && curlGesture.pointerId===event.pointerId) {
      curlGesture.lastX=event.clientX;curlGesture.lastY=event.clientY;
      paintCurl(event.clientX,event.clientY,curlGesture.side,curlGesture.bottom,true);
      return;
    }
    if(event.pointerType==='touch') return;
    const corner=cornerAt(event);
    if(corner) paintCurl(event.clientX,event.clientY,corner.side,corner.bottom,false);
    else if(!curlGesture) clearCurl();
  });
  bookFrame.addEventListener('pointerdown', event => {
    if(turning) return;
    const corner=cornerAt(event);
    if(!corner) return;
    event.preventDefault();
    curlGesture={...corner,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY};
    try{bookFrame.setPointerCapture(event.pointerId)}catch(_){}
    paintCurl(event.clientX,event.clientY,corner.side,corner.bottom,true);
  });
  bookFrame.addEventListener('pointerup', event => {
    if(!curlGesture || curlGesture.pointerId!==event.pointerId) return;
    const gesture=curlGesture;
    const dx=event.clientX-gesture.startX, dy=event.clientY-gesture.startY;
    const moved=Math.hypot(dx,dy);
    clearCurl();
    // Drag the right corner inward to go forward; drag the left corner inward to go back.
    const pulledInward = gesture.bottom ? dy < -18 : (gesture.side==='right' ? dx < -18 : dx > 18);
    if(moved>24 && pulledInward) {
      goTo(current+(gesture.side==='right'?1:-1));
    } else if(moved<10 && gesture.side==='right') {
      goTo(current+1);
    } else if(moved<10 && gesture.side==='left') {
      goTo(current-1);
    }
  });
  bookFrame.addEventListener('pointercancel',clearCurl);
  bookFrame.addEventListener('lostpointercapture',()=>{if(curlGesture)clearCurl()});
  bookFrame.addEventListener('pointerleave',()=>{if(!curlGesture)clearCurl()});
  // Clear stale curl geometry whenever a new page is committed.
  const originalRender = render;
  render = function(){ clearCurl(); originalRender(); };
  init();
})();