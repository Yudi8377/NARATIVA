/* NARATIVA presentation catalogue.
 * Only works whose content is stored in the NARATIVA repository are shown here.
 * Do not add third-party links as substitute for hosted work. Review territorial
 * public-domain status before reusing classic texts outside the relevant jurisdiction.
 */
(() => {
  const localWorks = [
    {
      id: "local-sky-comic",
      title: "Kota di Atas Awan",
      author: "NARATIVA Studio · karya demo",
      category: "komik",
      genre: "Fantasi · Petualangan · Komik strip",
      format: "Komik strip · 6 halaman contoh",
      year: "2026",
      language: "Indonesia",
      rights: "Karya orisinal contoh NARATIVA · CC BY 4.0",
      description: "Contoh presentasi komik strip tentang kurir muda yang menemukan kota tersembunyi di atas awan.",
      emoji: "☁️",
      localPages: Array.from({length: 6}, (_, i) => "library/comics/kota-di-atas-awan/page-" + String(i + 1).padStart(2, "0") + ".svg"),
      license: "CC BY 4.0",
      hostedByNarativa: true
    },
    {
      id: "local-komet-manga",
      title: "Komet Terakhir",
      author: "NARATIVA Studio · karya demo",
      category: "manga",
      genre: "Fiksi ilmiah · Drama · Petualangan",
      format: "Manga original · 4 halaman contoh",
      year: "2026",
      language: "Indonesia",
      rights: "Karya orisinal contoh NARATIVA · CC BY 4.0",
      description: "Contoh presentasi manga hitam-putih tentang remaja yang mendengar pesan dari bintang jatuh.",
      emoji: "☄️",
      localPages: Array.from({length: 4}, (_, i) => "library/manga/komet-terakhir/page-" + String(i + 1).padStart(2, "0") + ".svg"),
      license: "CC BY 4.0",
      hostedByNarativa: true
    },
    {
      id: "local-manhwa-station",
      title: "Senja di Stasiun",
      author: "NARATIVA Studio · karya demo",
      category: "manhwa",
      genre: "Romantis · Fantasi · Drama",
      format: "Manhwa original · 4 halaman contoh",
      year: "2026",
      language: "Indonesia",
      rights: "Karya orisinal contoh NARATIVA · CC BY 4.0",
      description: "Contoh presentasi manhwa berwarna tentang Mina yang menemukan kereta menuju masa depan.",
      emoji: "🚉",
      localPages: Array.from({length: 4}, (_, i) => "library/manhwa/senja-di-stasiun/page-" + String(i + 1).padStart(2, "0") + ".svg"),
      license: "CC BY 4.0",
      hostedByNarativa: true
    },
    {
      id: "local-anime-star",
      title: "Satu Bintang Lagi",
      author: "NARATIVA Studio · karya demo",
      category: "anime",
      genre: "Fantasi · Drama · Fiksi ilmiah",
      format: "Animasi pendek interaktif · 5 adegan",
      year: "2026",
      language: "Indonesia",
      rights: "Animasi orisinal contoh NARATIVA · CC BY 4.0",
      description: "Contoh pengalaman menonton animasi yang diputar langsung di dalam NARATIVA.",
      emoji: "🌠",
      localPlayerUrl: "library/anime/satu-bintang-lagi.html",
      license: "CC BY 4.0",
      hostedByNarativa: true
    },
    {
      id: "local-alice",
      title: "Alice's Adventures in Wonderland",
      author: "Lewis Carroll",
      category: "fantasi",
      genre: "Fantasi · Sastra klasik · Petualangan",
      format: "Novel klasik · teks lokal",
      year: "1865",
      language: "Inggris",
      rights: "Teks klasik; status domain publik harus dinilai menurut negara dan edisi",
      description: "Teks klasik yang tersimpan di pustaka NARATIVA untuk contoh pembaca novel.",
      emoji: "🗝️",
      contentUrl: "library/classics/alice-adventures-in-wonderland.txt",
      hostedByNarativa: true
    },
    {
      id: "local-wizard-oz",
      title: "The Wonderful Wizard of Oz",
      author: "L. Frank Baum",
      category: "fantasi",
      genre: "Fantasi · Petualangan · Dunia ajaib",
      format: "Novel klasik · teks lokal",
      year: "1900",
      language: "Inggris",
      rights: "Teks klasik; status domain publik harus dinilai menurut negara dan edisi",
      description: "Teks klasik yang tersimpan di pustaka NARATIVA untuk contoh pembaca novel.",
      emoji: "🌪️",
      contentUrl: "library/classics/wonderful-wizard-of-oz.txt",
      hostedByNarativa: true
    },
    {
      id: "local-sherlock",
      title: "The Adventures of Sherlock Holmes",
      author: "Arthur Conan Doyle",
      category: "misteri",
      genre: "Misteri · Detektif · Investigasi",
      format: "Antologi cerita · teks lokal",
      year: "1892",
      language: "Inggris",
      rights: "Teks klasik; status domain publik harus dinilai menurut negara dan edisi",
      description: "Kumpulan cerita detektif yang tersimpan di pustaka NARATIVA untuk contoh pembaca antologi.",
      emoji: "🔎",
      contentUrl: "library/classics/adventures-of-sherlock-holmes.txt",
      hostedByNarativa: true
    }
  ];

  window.NARATIVA_READER_CATALOG = localWorks;
})();
