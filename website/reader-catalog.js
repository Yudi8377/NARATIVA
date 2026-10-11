/* NARATIVA reader catalogue seed: 60 records. Source links point to archives, not copies. Verify rights for each edition/asset and target jurisdiction before rehosting. */
(() => {
const comics = [
["little-nemo","Little Nemo in Slumberland","Winsor McCay","Fantasi · Petualangan · Surealis","1905–1914","Petualangan mimpi seorang anak melintasi negeri ajaib."],
["krazy-kat","Krazy Kat","George Herriman","Humor · Surealis","1913–1944","Komedi puitis tentang Krazy Kat, Ignatz Mouse, dan Officer Pupp."],
["dream-rarebit","Dream of the Rarebit Fiend","Winsor McCay","Fantasi · Mimpi buruk · Satire","1904–1911","Kisah mimpi aneh yang berakhir dengan kejutan satir."],
["buster-brown","Buster Brown","Richard F. Outcault","Humor · Keluarga · Anak","1902–1920-an","Kenakalan seorang anak dan anjingnya, Tige."],
["yellow-kid","The Yellow Kid","Richard F. Outcault","Satire sosial · Humor","1895–1898","Komik awal yang penting dalam sejarah komik koran."],
["katzenjammer-kids","The Katzenjammer Kids","Rudolph Dirks","Slapstick · Humor · Keluarga","1897–","Dua saudara pembuat onar dalam komedi slapstick."],
["happy-hooligan","Happy Hooligan","Frederick Burr Opper","Humor · Satire sosial","1900–1932","Kisah seorang gelandangan berhati baik yang kerap sial."],
["mutt-jeff","Mutt and Jeff","Bud Fisher","Humor · Buddy comedy","1907–","Duo kontras yang memicu kesalahpahaman dan lelucon."],
["bringing-up-father","Bringing Up Father","George McManus","Keluarga · Komedi sosial","1913–","Komedi tentang keluarga yang mendadak kaya dan kehidupan sosialnya."],
["polly-pals","Polly and Her Pals","Cliff Sterrett","Humor · Keluarga · Eksperimental","1912–","Kehidupan Polly dan keluarganya dengan gaya visual berani."],
["kin-der-kids","The Kin-der-Kids","Lyonel Feininger","Petualangan · Fantasi · Anak","1906","Petualangan fantastis anak-anak dengan eksperimen bentuk panel."],
["mr-twee-deedle","Mr. Twee Deedle","Johnny Gruelle","Fantasi · Anak · Dongeng","1910-an","Anak-anak bertemu makhluk ajaib dalam dunia dongeng."],
["upside-downs","The Upside Downs of Little Lady Lovekins and Old Man Muffaroo","Gustave Verbeek","Fantasi · Eksperimental · Teka-teki","1903–1905","Komik inovatif yang dibaca terbalik untuk membentuk gambar lanjutan."],
["baron-bean","Baron Bean","George Herriman","Humor · Petualangan","1916–1919","Kisah komikal bangsawan miskin yang berusaha menjalani hidup."],
["maud","And Her Name Was Maud","Frederick Burr Opper","Humor · Hewan · Slapstick","1904–","Komedi slapstick yang berpusat pada keledai bernama Maud."],
["captain-kids","The Captain and the Kids","Rudolph Dirks","Keluarga · Humor · Petualangan","1914–","Dua anak nakal dan keluarga mereka dalam komedi petualangan."],
["gumps","The Gumps","Sidney Smith","Keluarga · Drama · Humor","1917–","Komik keluarga dengan humor sehari-hari dan alur bersambung."],
["newlyweds","The Newlyweds","George McManus","Rumah tangga · Humor","1904–1910-an","Humor tentang pasangan muda dan dinamika rumah tangga."],
["smatter-pop","S'Matter, Pop?","Charles M. Payne","Humor · Keluarga","1920-an","Komedi percakapan keluarga dengan punchline singkat."],
["toonerville","The Toonerville Trolley","Fontaine Fox","Humor · Komunitas · Petualangan","1908–","Kisah lucu komunitas kecil dan trem uniknya."]
];
const fantasy = [
["alice","Alice's Adventures in Wonderland","Lewis Carroll","Fantasi · Sastra anak · Nonsense","1865","Alice mengikuti Kelinci Putih ke dunia yang menentang logika.",11],
["wizard-oz","The Wonderful Wizard of Oz","L. Frank Baum","Fantasi · Petualangan · Portal fantasy","1900","Dorothy dan teman-temannya menuju Kota Zamrud.",55],
["peter-pan","Peter Pan","J. M. Barrie","Fantasi · Anak · Petualangan","1911","Wendy, Peter Pan, dan Lost Boys berpetualang di Neverland.",16],
["princess-mars","A Princess of Mars","Edgar Rice Burroughs","Planetary romance · Fiksi ilmiah · Petualangan","1912","John Carter terlempar ke Mars dan terlibat konflik antarkelompok.",62],
["land-oz","The Marvelous Land of Oz","L. Frank Baum","Fantasi · Petualangan · Seri Oz","1904","Petualangan baru di negeri Oz dengan rahasia kerajaan.",54],
["time-machine","The Time Machine","H. G. Wells","Fiksi ilmiah · Perjalanan waktu · Distopia","1895","Seorang penjelajah waktu menyaksikan masa depan umat manusia.",35],
["lost-world","The Lost World","Arthur Conan Doyle","Petualangan · Dunia hilang · Fiksi ilmiah","1912","Ekspedisi mencari dataran terpencil berisi makhluk prasejarah.",139],
["frankenstein","Frankenstein","Mary Shelley","Gotik · Horor · Fiksi ilmiah","1818","Eksperimen Victor Frankenstein memunculkan pertanyaan tentang penciptaan.",84],
["jekyll-hyde","Strange Case of Dr Jekyll and Mr Hyde","Robert Louis Stevenson","Gotik · Psikologis · Horor","1886","Seorang dokter menghadapi sisi gelap dalam dirinya.",43],
["connecticut-yankee","A Connecticut Yankee in King Arthur's Court","Mark Twain","Fantasi · Satire · Perjalanan waktu","1889","Seorang pria modern terbangun di era Raja Arthur.",86],
["gulliver","Gulliver's Travels","Jonathan Swift","Satire · Petualangan · Dunia imajiner","1726","Perjalanan Gulliver ke negeri-negeri dengan masyarakat luar biasa.",829],
["jungle-book","The Jungle Book","Rudyard Kipling","Fantasi · Hewan · Petualangan","1894","Mowgli dan penghuni rimba menjalani kisah hukum dan persahabatan.",236],
["solomon-mines","King Solomon's Mines","H. Rider Haggard","Petualangan · Dunia hilang · Ekspedisi","1885","Ekspedisi mencari tambang legendaris di pedalaman Afrika.",2166],
["invisible-man","The Invisible Man","H. G. Wells","Fiksi ilmiah · Horor · Eksperimen","1897","Eksperimen yang membuat ilmuwan tak terlihat berujung kekacauan.",5230],
["dorian-gray","The Picture of Dorian Gray","Oscar Wilde","Gotik · Fantasi gelap · Filosofis","1890","Potret menyimpan jejak moral yang tak terlihat pada pemiliknya.",174],
["last-mohicans","The Last of the Mohicans","James Fenimore Cooper","Petualangan · Sejarah · Alam liar","1826","Petualangan di perbatasan Amerika Utara pada masa konflik kolonial.",940],
["scarlet-pimpernel","The Scarlet Pimpernel","Baroness Orczy","Petualangan · Identitas rahasia · Sejarah","1905","Sosok bertopeng menyelamatkan bangsawan pada Revolusi Prancis.",60],
["phantom-opera","The Phantom of the Opera","Gaston Leroux","Gotik · Romansa gelap · Misteri","1910","Rahasia di balik panggung opera Paris menyelimuti seorang penyanyi.",175],
["princess-goblin","The Princess and the Goblin","George MacDonald","Fantasi · Dongeng · Anak","1872","Putri Irene dan Curdie menghadapi makhluk bawah tanah.",708],
["blue-fairy","The Blue Fairy Book","Andrew Lang (editor)","Dongeng · Folklor · Fantasi","1889","Antologi dongeng lintas tradisi sebagai pintu masuk folklor.",503]
];
const mystery = [
["sherlock","The Adventures of Sherlock Holmes","Arthur Conan Doyle","Detektif · Investigasi · Kumpulan kasus","1892","Holmes dan Watson memecahkan kasus melalui observasi dan deduksi.",1661],
["study-scarlet","A Study in Scarlet","Arthur Conan Doyle","Detektif · Pembunuhan · Misteri klasik","1887","Kasus pembunuhan mempertemukan Holmes dan Watson.",244],
["sign-four","The Sign of the Four","Arthur Conan Doyle","Detektif · Harta hilang · Konspirasi","1890","Holmes menyelidiki harta hilang, pesan rahasia, dan persekongkolan.",2097],
["hound-baskervilles","The Hound of the Baskervilles","Arthur Conan Doyle","Detektif · Gotik · Legenda keluarga","1902","Legenda anjing gaib membayangi keluarga Baskerville.",2852],
["valley-fear","The Valley of Fear","Arthur Conan Doyle","Detektif · Pembunuhan · Konspirasi","1915","Pembunuhan di rumah terpencil membuka penyelidikan masa lalu.",3289],
["moonstone","The Moonstone","Wilkie Collins","Detektif awal · Harta hilang · Misteri rumah","1868","Berlian berharga menghilang dan setiap saksi menyimpan bagian cerita.",155],
["woman-white","The Woman in White","Wilkie Collins","Misteri gotik · Identitas · Intrik","1859","Guru seni terjerat misteri perempuan berpakaian putih.",583],
["edwin-drood","The Mystery of Edwin Drood","Charles Dickens","Misteri · Gotik · Belum selesai","1870","Hilangnya Edwin Drood menjadi teka-teki yang tak diselesaikan penulis.",564],
["poe-tales","Tales of Mystery and Imagination","Edgar Allan Poe","Misteri · Gotik · Horor psikologis","Abad ke-19","Kisah teka-teki, ketegangan, dan psikologi gelap.",2147],
["leavenworth","The Leavenworth Case","Anna Katharine Green","Detektif · Pembunuhan · Ruang terkunci","1878","Pengacara menyelidiki pembunuhan dalam keluarga kaya New York.",3076],
["hansom-cab","The Mystery of a Hansom Cab","Fergus Hume","Detektif · Pembunuhan · Kota","1886","Pembunuhan di kereta sewaan membuka rahasia di Melbourne.",3251],
["father-brown","The Innocence of Father Brown","G. K. Chesterton","Detektif · Logika · Misteri","1911","Pastor Brown memecahkan kasus dengan memahami sifat manusia.",204],
["trent-last-case","Trent's Last Case","E. C. Bentley","Detektif · Satire · Pembunuhan","1913","Pelukis sekaligus detektif Philip Trent menyelidiki kematian miliuner.",5723],
["circular-staircase","The Circular Staircase","Mary Roberts Rinehart","Misteri rumah · Suspense · Detektif","1908","Rumah musim panas menyimpan kejadian ganjil dan rahasia penghuni.",284],
["yellow-room","The Mystery of the Yellow Room","Gaston Leroux","Detektif · Ruang terkunci · Teka-teki","1907","Serangan di ruang terkunci menghadirkan teka-teki bagi reporter muda.",1695],
["arsene-lupin","The Extraordinary Adventures of Arsène Lupin, Gentleman-Burglar","Maurice Leblanc","Pencurian · Intrik · Detektif","1907","Pencuri gentleman Arsène Lupin memainkan permainan kecerdikan.",6133],
["big-bow","The Big Bow Mystery","Israel Zangwill","Detektif · Ruang terkunci · Pembunuhan","1892","Pembunuhan di kamar terkunci menantang para penyelidik.",1338],
["orcival","The Mystery of Orcival","Émile Gaboriau","Detektif · Kejahatan · Investigasi","1867","Penyelidikan pembunuhan pedesaan mengungkap rahasia keluarga.",1651],
["cloomber","The Mystery of Cloomber","Arthur Conan Doyle","Misteri · Balas dendam · Gotik","1889","Seorang pensiunan jenderal dihantui rahasia kelam masa lalunya.",7964],
["riddle-sands","The Riddle of the Sands","Erskine Childers","Misteri · Spionase · Petualangan maritim","1903","Pelayaran santai berubah menjadi penyelidikan konspirasi.",2360]
];
const commons = title => "https://commons.wikimedia.org/w/index.php?search=" + encodeURIComponent(title) + "&title=Special%3AMediaSearch&type=image";
const mapComic = r => ({id:"nr-"+r[0],title:r[1],author:r[2],category:"komik",genre:r[3],format:"Komik strip",year:r[4],language:"Inggris",rights:"Kandidat arsip strip klasik; verifikasi lisensi tiap gambar dan yurisdiksi",source:commons(r[1]),read:r[0]==="little-nemo"?"https://commons.wikimedia.org/wiki/File:Little_Nemo_1909-07-18.jpg":r[0]==="krazy-kat"?"https://commons.wikimedia.org/wiki/File:Krazy_Kat_1918-09-04.png":commons(r[1]),description:r[5],emoji:["🌙","🐈","🥧","🎩","🟡","🤹","🎪","👥","🏠","🎨","🧭","🍄","🔄","👑","🫏","⚓","👨‍👩‍👧","💍","💬","🚋"][comics.indexOf(r)],sourceLabel:"Buka arsip komik"});
const mapBook = (r,category) => ({id:"nr-"+r[0],title:r[1],author:r[2],category,genre:r[3],format:category==="fantasi"?"Novel / klasik":"Novel / cerita klasik",year:r[4],language:"Inggris",rights:"Project Gutenberg: umumnya domain publik AS; cek status negara dan edisi/terjemahan",source:"https://www.gutenberg.org/ebooks/"+r[6],read:"https://www.gutenberg.org/ebooks/"+r[6],description:r[5],emoji:category==="fantasi"?"✨":"🔎",sourceLabel:"Baca di Project Gutenberg",contentUrl:({"alice":"library/classics/alice-adventures-in-wonderland.txt","wizard-oz":"library/classics/wonderful-wizard-of-oz.txt","sherlock":"library/classics/adventures-of-sherlock-holmes.txt"})[r[0]] || null});
window.NARATIVA_READER_CATALOG = [...comics.map(mapComic),...fantasy.map(r=>mapBook(r,"fantasi")),...mystery.map(r=>mapBook(r,"misteri"))];
})();