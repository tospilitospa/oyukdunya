document.addEventListener('DOMContentLoaded', () => {
    const bolumlerKlasoru = 'bolumler';
    const maxBolumCheck = 50;

    // Element Referansları
    const body = document.body;
    const temaToggleButon = document.getElementById('tema-toggle');
    const bolumListesiAlani = document.getElementById('bolum-listesi-alani');
    const bolumListesiUL = document.getElementById('bolum-listesi');
    const bolumIcerikAlani = document.getElementById('bolum-icerik-alani');
    const bolumBaslik = document.getElementById('bolum-baslik'); // Kaydırma hedefi
    const bolumIcerikDiv = document.getElementById('bolum-icerik');
    const geriButon = document.getElementById('geri-buton');
    const anasayfaButon = document.getElementById('anasayfa-buton');
    const ileriButon = document.getElementById('ileri-buton');

    let mevcutBolumler = [];
    let gosterilenBolumNo = null;

    // --- Tema Yönetimi ---
    const temaTercihiniUygula = (tema) => {
        if (tema === 'dark') {
            body.classList.add('dark-mode');
            temaToggleButon.textContent = '☀️'; // Karanlık modda, güneşe (açık tema) geçişi göster
            temaToggleButon.setAttribute('aria-label', 'Açık Temaya Geç');
        } else {
            body.classList.remove('dark-mode');
            temaToggleButon.textContent = '🌙'; // Açık modda, aya (karanlık tema) geçişi göster
            temaToggleButon.setAttribute('aria-label', 'Karanlık Temaya Geç');
        }
    };

    // Sayfa yüklendiğinde kaydedilmiş temayı kontrol et ve uygula
    const kayitliTema = localStorage.getItem('theme') || 'light'; // Varsayılan açık tema
    temaTercihiniUygula(kayitliTema);

    // Tema değiştirme butonuna tıklama olayı
    temaToggleButon.addEventListener('click', () => {
        const mevcutTema = body.classList.contains('dark-mode') ? 'dark' : 'light';
        const yeniTema = mevcutTema === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', yeniTema); // Yeni tercihi kaydet
        temaTercihiniUygula(yeniTema); // Yeni temayı uygula
    });
    // --- Tema Yönetimi Sonu ---


    async function checkBolumVarmi(bolumNo) {
        try {
            const response = await fetch(`${bolumlerKlasoru}/bolum${bolumNo}.txt`, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error(`Bölüm ${bolumNo} kontrol hatası:`, error);
            return false;
        }
    }

    async function bolumleriTespitEtVeListele() {
        bolumListesiUL.innerHTML = '<li>Bölümler taranıyor...</li>';
        mevcutBolumler = [];
        for (let i = 1; i <= maxBolumCheck; i++) {
            if (await checkBolumVarmi(i)) {
                mevcutBolumler.push(i);
            } else {
                break;
            }
        }

        bolumListesiUL.innerHTML = '';

        if (mevcutBolumler.length === 0) {
             bolumListesiUL.innerHTML = '<li>Hiç bölüm bulunamadı.</li>';
             return;
        }

        mevcutBolumler.forEach(bolumNo => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = `Bölüm ${bolumNo}`;
            a.href = `#bolum${bolumNo}`;
            a.dataset.bolum = bolumNo;
            a.addEventListener('click', (event) => {
                event.preventDefault();
                bolumYukle(bolumNo); // Tıklanınca bölümü yükle, ama kaydırma yapma
            });
            li.appendChild(a);
            bolumListesiUL.appendChild(li);
        });
    }

    async function bolumYukle(bolumNo) {
        if (!mevcutBolumler.includes(bolumNo)) {
            console.error("Geçersiz bölüm numarası:", bolumNo);
            alert("Bu bölüm mevcut değil!");
            return false; // Yükleme başarısız oldu
        }

        // Başlık ve içerik alanını temizle/hazırla
        bolumBaslik.textContent = `Bölüm ${bolumNo} Yükleniyor...`;
        bolumIcerikDiv.textContent = '';
        bolumListesiAlani.classList.add('hidden');
        bolumIcerikAlani.classList.remove('hidden');
        // Butonları geçici olarak devre dışı bırakabiliriz
        geriButon.disabled = true;
        ileriButon.disabled = true;

        try {
            const response = await fetch(`${bolumlerKlasoru}/bolum${bolumNo}.txt`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const icerik = await response.text();

            gosterilenBolumNo = bolumNo;
            bolumBaslik.textContent = `Bölüm ${bolumNo}`; // Başlığı güncelle
            bolumIcerikDiv.textContent = icerik;

            navigasyonGuncelle(); // İçerik yüklendikten sonra butonları güncelle
            return true; // Yükleme başarılı

        } catch (error) {
            console.error(`Bölüm ${bolumNo} yüklenirken hata:`, error);
            bolumBaslik.textContent = `Bölüm ${bolumNo} Yüklenemedi`;
            bolumIcerikDiv.textContent = 'Bölüm içeriği yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
            gosterilenBolumNo = null;
            navigasyonGuncelle(); // Butonları hata durumuna göre güncelle
            return false; // Yükleme başarısız oldu
        }
    }

    function navigasyonGuncelle() {
        if (gosterilenBolumNo === null) {
            geriButon.disabled = true;
            ileriButon.disabled = true;
            return;
        }
        const currentIndex = mevcutBolumler.indexOf(gosterilenBolumNo);
        geriButon.disabled = (currentIndex <= 0);
        ileriButon.disabled = (currentIndex >= mevcutBolumler.length - 1);
    }

    // --- Olay Dinleyicileri (Kaydırma Eklendi) ---
    // Geri Butonu (async yapıldı)
    geriButon.addEventListener('click', async () => {
        if (gosterilenBolumNo !== null) {
            const currentIndex = mevcutBolumler.indexOf(gosterilenBolumNo);
            if (currentIndex > 0) {
                const hedefBolumNo = mevcutBolumler[currentIndex - 1];
                const yuklendi = await bolumYukle(hedefBolumNo); // Yüklemenin bitmesini bekle
                if (yuklendi) {
                    // Başarılıysa bölüm başlığına yumuşakça kaydır
                    bolumBaslik.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    });

    // İleri Butonu (async yapıldı)
    ileriButon.addEventListener('click', async () => {
         if (gosterilenBolumNo !== null) {
            const currentIndex = mevcutBolumler.indexOf(gosterilenBolumNo);
            if (currentIndex < mevcutBolumler.length - 1) {
                const hedefBolumNo = mevcutBolumler[currentIndex + 1];
                const yuklendi = await bolumYukle(hedefBolumNo); // Yüklemenin bitmesini bekle
                 if (yuklendi) {
                    // Başarılıysa bölüm başlığına yumuşakça kaydır
                    bolumBaslik.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }
            }
        }
    });

    // Ana Sayfa Butonu
    anasayfaButon.addEventListener('click', () => {
        bolumIcerikAlani.classList.add('hidden');
        bolumListesiAlani.classList.remove('hidden');
        gosterilenBolumNo = null;
        // Ana sayfaya dönünce sayfanın en başına gidebiliriz (isteğe bağlı)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
	document.addEventListener('DOMContentLoaded', () => {
    // ... (Mevcut kodun başı)

    const body = document.body;
    const temaToggleButon = document.getElementById('tema-toggle');
    // ... (Diğer element referansları)
    const bolumIcerikDiv = document.getElementById('bolum-icerik'); // Bu zaten vardı
    // ... (Mevcut kodun geri kalanı)


    // --- Tema Yönetimi ---
    // ... (Mevcut tema kodu)
    // --- Tema Yönetimi Sonu ---


    // ... (checkBolumVarmi, bolumleriTespitEtVeListele, bolumYukle, navigasyonGuncelle fonksiyonları)


    // --- Olay Dinleyicileri (Kaydırma Eklendi) ---
    // ... (geriButon, ileriButon, anasayfaButon olay dinleyicileri)
    // --- Olay Dinleyicileri Sonu ---


    // --- Tıklayarak Kaydırma İşlevi ---
    bolumIcerikDiv.addEventListener('click', (event) => {
        // Hedefin kendisi içerik alanı mı diye kontrol et
        // (İçerikte başka tıklanabilir link vb. varsa onları engellemek için)
        // Şimdilik en basit haliyle, doğrudan dive tıklanınca çalışsın.
        if (event.target === bolumIcerikDiv) {
            // Ekran yüksekliğinin yaklaşık %80'i kadar aşağı kaydır
            const scrollAmount = window.innerHeight * 0.80;
            window.scrollBy({
                top: scrollAmount,
                left: 0,
                behavior: 'smooth' // Yumuşak kaydırma efekti
            });
        }
    });
    // --- Tıklayarak Kaydırma İşlevi Sonu ---


    // --- Başlangıç ---
    bolumleriTespitEtVeListele();
    // --- Başlangıç Sonu ---
}); // DOMContentLoaded sonu
    // --- Olay Dinleyicileri Sonu ---


    // --- Başlangıç ---
    bolumleriTespitEtVeListele();
    // --- Başlangıç Sonu ---
});