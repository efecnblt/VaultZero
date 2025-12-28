# VaultZero - Yerel-Öncelikli Şifre Yöneticisi

## Proje Genel Bakış

VaultZero, modern teknolojilerle geliştirilmiş güvenli, yerel-öncelikli bir şifre yöneticisidir. Kimlik bilgilerini yönetmek için bir masaüstü uygulaması ve sorunsuz otomatik doldurma işlevselliği için bir tarayıcı uzantısı içerir, tüm bunları askeri düzeyde şifreleme ve sıfır ağ maruziyeti ile sağlar.

---

## Kullanılan Teknolojiler

### Backend
- **Go 1.21** - Şifreleme ve veri yönetimi için yüksek performanslı backend
- **Wails v2.8** - Go backend'i web frontend ile birleştiren modern masaüstü uygulama çerçevesi
- **AES-256-GCM** - Askeri düzeyde simetrik şifreleme
- **Argon2id** - Bellek-yoğun anahtar türetme fonksiyonu (64MB bellek, 4 iş parçacığı)
- **Windows Named Pipes** - Tarayıcı uzantısı iletişimi için güvenli IPC

### Frontend (Masaüstü Uygulama)
- **React 18.2** - Hook'lar ile modern UI kütüphanesi
- **TypeScript 5.3** - Tip-güvenli geliştirme
- **Vite 5.0** - Hot module replacement ile hızlı build aracı
- **Tailwind CSS 3.3** - Hızlı UI geliştirme için utility-first CSS çerçevesi
- **Lucide React** - Güzel, tutarlı ikon kütüphanesi

### Tarayıcı Uzantısı
- **Chrome Extension Manifest V3** - En güncel uzantı standardı
- **Native Messaging API** - Güvenli tarayıcı-masaüstü iletişimi
- **Service Workers** - Uzantı için arka plan işleme
- **Content Scripts** - Otomatik doldurma için DOM manipülasyonu
- **go-winio** - Go için Windows named pipe desteği

### Güvenlik & Kriptografi
- **crypto/rand** - Kriptografik olarak güvenli rastgele sayı üretimi
- **golang.org/x/crypto/argon2** - Şifre hashleme
- **Base64 encoding** - Güvenli veri serileştirme
- **JSON encryption** - Yapılandırılmış şifreli veri depolama

---

## Geliştirme Süreci

### Mimari Tasarım
1. **Masaüstü Uygulaması (Wails)**
   - Go backend tüm kriptografik işlemleri ve veri kalıcılığını yönetir
   - React frontend sezgisel, duyarlı UI sağlar
   - İş mantığı ve sunum katmanı arasında net ayrım

2. **Tarayıcı Uzantısı**
   - Native Messaging köprüsü tarayıcıyı masaüstü uygulamasına bağlar
   - Content script'ler giriş formlarını tespit eder ve otomatik doldurma sağlar
   - Service worker uzantı yaşam döngüsünü ve mesajlaşmayı yönetir

3. **IPC İletişimi**
   - Güvenli süreçler arası iletişim için Windows named pipes
   - Bileşenler arası JSON tabanlı mesaj protokolü
   - Ağ maruziyeti yok - tüm iletişim sadece localhost

### Uygulanan Temel Özellikler

**Masaüstü Uygulaması:**
- Ana şifre ile şifreli vault depolama
- Kimlik bilgileri için CRUD işlemleri
- Özelleştirilebilir seçeneklerle şifre üretici
- Büyük tarayıcılardan CSV içe aktarma (Chrome, Firefox, Edge, Safari)
- Kategori tabanlı organizasyon
- Arama ve filtreleme işlevselliği
- Kimlik bilgileri eklendiğinde gerçek zamanlı otomatik yenileme

**Tarayıcı Uzantısı:**
- Akıllı form algılama (kullanıcı adı, e-posta, telefon, kimlik numaraları)
- Giriş alanlarında tıkla-doldur açılır menü
- Başarılı girişten sonra yeni kimlik bilgilerini otomatik kaydetme
- Tekrar kaydı önlemek için kopya algılama
- Dark mode desteği ile native görünümlü UI
- Chrome, Edge ve Brave tarayıcıları desteği

---

## Güvenlik Uygulaması

### Şifreleme & Anahtar Türetme
- **Ana Şifre Koruması**: Tüm vault verileri kullanıcının ana şifresi ile şifrelenir
- **Argon2id Anahtar Türetme**:
  - Bellek: 64MB
  - İterasyon: 1
  - Paralellik: 4 iş parçacığı
  - Çıktı: 32-byte anahtar
- **AES-256-GCM Şifreleme**:
  - 256-bit anahtar boyutu
  - Kimlik doğrulamalı şifreleme için Galois/Counter Mode
  - Şifreleme başına 12-byte rastgele nonce
  - Kurcalamayı önler ve gizliliği sağlar

### Veri Depolama
- **Ayrı Salt Depolama**: Dairesel bağımlılığı önlemek için salt, vault'tan ayrı depolanır
- **Sadece Yerel Depolama**: Tüm veriler `~/.vaultzero/` içinde saklanır (bulut senkronizasyonu yok)
- **Dosya İzinleri**: Vault dosyaları sadece kullanıcı erişimi ile kısıtlanmış (0600)
- **Dinlenimdeyken Şifreli**: Kimlik bilgileri asla düz metin olarak saklanmaz

### Tarayıcı Uzantısı Güvenliği
- **Named Pipe IPC**: Ağ portları açılmaz, sadece localhost iletişimi
- **Origin Doğrulama**: Native messaging manifest'inde uzantı ID'si beyaz listeye alınmış
- **Uzak Kod Yok**: Tüm kod uzantı ile paketlenmiş (CDN bağımlılığı yok)
- **Minimal İzinler**: Sadece gerekli tarayıcı izinleri istenir
- **Sandbox Yürütme**: Tarayıcının güvenlik modeli uzantıyı izole eder

### En İyi Uygulamalar
- **Zero-Trust Mimarisi**: İşlemlerden önce her zaman vault'un açık olduğunu doğrular
- **Pano Güvenliği**: 30 saniye sonra panoyu otomatik temizler
- **Girdi Doğrulama**: Injection saldırılarını önlemek için tüm kullanıcı girdilerini temizler
- **Hata İşleme**: Hassas veri sızdırmayan güvenli hata mesajları
- **Oturum Yönetimi**: Uygulama kapandığında vault'u kilitler

---

## Çözülen Teknik Zorluklar

1. **Windows Named Pipe Uygulaması**
   - Windows kernel32.dll'ye düşük seviye syscall'lar uygulandı
   - Eşzamanlı tarayıcı istekleri için bağlantı havuzu oluşturuldu
   - Uygun temizleme ve bağlantı kesme işlendi

2. **Form Algılama Zekası**
   - Çeşitli girdi türlerini algılamak için esnek seçiciler oluşturuldu (email, text, number, tel)
   - Uluslararası alanlar için destek eklendi (Türkiye için TC Kimlik No)
   - SPA uyumluluğu için DOM mutation observer'ları uygulandı

3. **Tekrar Önleme**
   - Durum yönetimi ile tekrar kaydetme istemlerini önlendi
   - Bekleme süreleri ve akıllı sıfırlama mantığı eklendi
   - İstem göstermeden önce mevcut kimlik bilgileri kontrol edildi

4. **Gerçek Zamanlı Senkronizasyon**
   - Go backend'den olay yayınlama uygulandı
   - React frontend'i bilgilendirmek için Wails runtime olayları kullanıldı
   - Tarayıcı kimlik bilgilerini kaydettiğinde anında UI güncellemeleri sağlandı

---

## CV İçin - Proje Açıklaması

**VaultZero - Güvenli Yerel-Öncelikli Şifre Yöneticisi**

- **AES-256-GCM şifreleme** ve **Argon2** anahtar türetme ile **Wails (Go + React + TypeScript)** kullanarak çapraz platform masaüstü şifre yöneticisi geliştirdim; şifre üretimi, CSV içe aktarma ve kategori yönetimi özellikleriyle
- Ağ maruziyeti olmadan güvenli IPC için **Windows named pipes** kullanarak, sorunsuz otomatik doldurma ve otomatik kaydetme işlevselliği ile **Chrome uzantısı** geliştirdim; **Native Messaging API** ile
- Yerel-sadece depolama, şifreli vault kalıcılığı ve masaüstü uygulaması ile tarayıcı uzantısı arasında gerçek zamanlı senkronizasyon ile askeri düzeyde güvenlik mimarisi uyguladım

---

## CV İçin - Teknik Beceriler Bölümü

### Programlama Dilleri
- **Go** - Backend geliştirme, kriptografi, IPC sistemleri, Windows syscall'ları
- **TypeScript/JavaScript** - Frontend geliştirme, tarayıcı uzantıları, React uygulamaları

### Framework'ler & Kütüphaneler
- **Wails** - Go ve React ile masaüstü uygulama geliştirme
- **React** - Hook'lar ve bileşen mimarisi ile modern frontend geliştirme
- **Tailwind CSS** - Hızlı UI geliştirme için utility-first CSS

### Güvenlik & Kriptografi
- **AES-256-GCM** - Simetrik şifreleme uygulaması
- **Argon2** - Şifre hashleme ve anahtar türetme
- **Kriptografik En İyi Uygulamalar** - Salt üretimi, nonce işleme, güvenli rastgele üretim

### Tarayıcı Teknolojileri
- **Chrome Uzantıları (Manifest V3)** - Service worker'lar, content script'ler, native messaging
- **Native Messaging API** - Tarayıcı-masaüstü iletişimi
- **DOM Manipülasyonu** - Dinamik form algılama ve otomatik doldurma

### Sistem Programlama
- **Windows Named Pipes** - Syscall'lar kullanarak süreçler arası iletişim
- **Dosya I/O** - Uygun izinlerle güvenli dosya işleme
- **Süreç Yönetimi** - Eşzamanlı bağlantı yönetimi

### Geliştirme Araçları
- **Vite** - HMR ile modern build aracı
- **Git** - Sürüm kontrolü
- **PowerShell** - Windows için otomasyon scriptleme
- **WSL** - Çapraz platform geliştirme ortamı

### Yazılım Mimarisi
- **Masaüstü Uygulama Mimarisi** - Backend/frontend arasında sorumlulukların ayrılması
- **IPC Tasarımı** - Mesaj tabanlı iletişim protokolleri
- **Güvenlik-Öncelikli Tasarım** - Zero-trust mimarisi, yerel-öncelikli veri depolama
- **Olay-Güdümlü Programlama** - Gerçek zamanlı UI güncellemeleri ve durum yönetimi

---

## Proje İstatistikleri

- **Kod Satırı**: ~7,000+ satır
- **Oluşturulan Dosyalar**: 30+ dosya
- **Teknolojiler**: 15+ teknoloji ve framework
- **Geliştirme Süresi**: Sıfırdan tam özellikli uygulama
- **Desteklenen Platformlar**: Windows (Masaüstü Uygulaması + Chrome/Edge/Brave için Uzantı)

---

## Gelecek Geliştirmeler (Opsiyonel)

- [ ] Çapraz platform desteği (macOS, Linux)
- [ ] Biyometrik kimlik doğrulama (Windows Hello, parmak izi)
- [ ] Şifre güç analizörü ve ihlal tespiti
- [ ] Güvenli notlar ve dosya ekleri
- [ ] İki faktörlü kimlik doğrulama (TOTP) desteği
- [ ] Şifreli yedekleme dışa aktarma
- [ ] Firefox uzantı desteği
- [ ] Hareketsizlik sonrası otomatik kilitleme

---

## Lisans

Portfolyo gösterimi için geliştirilmiş kişisel proje.

---

## İletişim

Geliştiren: [Adınız]
GitHub: [GitHub Profiliniz]
LinkedIn: [LinkedIn Profiliniz]
E-posta: [E-postanız]
