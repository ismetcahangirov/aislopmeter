// Questions that get real, specific facts out of the site owner, so the rewrite has substance.
const t = (en, tr) => ({ en, tr });

export const PAGE_TYPES = {
  saas: t('software / SaaS', 'yazılım / SaaS'),
  local: t('local business', 'yerel işletme'),
  shop: t('online shop', 'online mağaza'),
  portfolio: t('portfolio / freelancer', 'portfolyo / serbest çalışan'),
  blog: t('blog / publication', 'blog / yayın'),
  general: t('general', 'genel'),
};

export function guessPageType(text) {
  const s = String(text || '').toLowerCase();
  const score = {
    shop: (s.match(/add to cart|sepete ekle|sepet|checkout|ücretsiz kargo|free shipping|kargo|stokta|in stock|iade|returns/g) || []).length,
    local: (s.match(/opening hours|çalışma saatleri|rezervasyon|reservation|randevu|appointment|menü|menu|adres|address|directions|yol tarifi|cad\.|sok\.|mah\./g) || []).length,
    saas: (s.match(/pricing|fiyatlandırma|free trial|ücretsiz dene|dashboard|integration|entegrasyon|api|workflow|iş akışı|sign up|kayıt ol|per month|\/ay|\/mo|plan/g) || []).length,
    portfolio: (s.match(/portfolio|portfolyo|case stud|projelerim|my work|çalışmalarım|hire me|freelance|serbest|selected work/g) || []).length,
    blog: (s.match(/min read|dk okuma|okuma süresi|read more|devamını oku|posted|yayınlandı|author|yazar|blog/g) || []).length,
  };
  const [best, n] = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return n >= 2 ? best : 'general';
}

export const INTERVIEW = {
  core: [
    t('In one sentence: who is this for, and what do they get that they cannot get elsewhere?', 'Tek cümleyle: bu kimin için ve başka yerde bulamayacağı neyi alıyor?'),
    t('What do customers actually say when they recommend you? Their words, not marketing words.', 'Müşteriler sizi tavsiye ederken gerçekte ne diyor? Pazarlama dili değil, onların kelimeleri.'),
    t('Give three concrete facts with numbers you can stand behind (time saved, price, years, volume, response time) and where each number comes from.', 'Arkasında durabileceğiniz rakamlı üç somut bilgi verin (kazanılan süre, fiyat, yıl, hacim, cevap süresi) ve her rakamın nereden geldiğini.'),
    t('Who is behind it? Names and roles we can show, and how a visitor can reach a person.', 'Arkasında kim var? Gösterebileceğimiz isimler ve roller, ziyaretçinin bir insana nasıl ulaşabileceği.'),
    t('What should stay exactly as it is (logo, colours, tone, sections)?', 'Olduğu gibi kalması gereken ne var (logo, renkler, ton, bölümler)?'),
  ],
  saas: [
    t('Walk me through the first 10 minutes of a new user: what do they click, what do they see?', 'Yeni bir kullanıcının ilk 10 dakikasını anlatın: neye tıklıyor, ne görüyor?'),
    t('Name one customer (with permission) and the before/after for them.', 'İzin verirseniz bir müşterinin adı ve onun için önce/sonra durumu.'),
    t('Real pricing and what each plan includes. Is there a free tier or trial, and its limits?', 'Gerçek fiyatlar ve her planın içeriği. Ücretsiz katman ya da deneme var mı, sınırları ne?'),
    t('Which tools does it integrate with today (not planned)?', 'Bugün hangi araçlarla entegre çalışıyor (planlananlar değil)?'),
    t('What does it deliberately not do?', 'Bilerek neyi yapmıyor?'),
  ],
  local: [
    t('Address, opening hours, phone, and how to get there.', 'Adres, çalışma saatleri, telefon ve nasıl gelinir.'),
    t('Your three best-selling items or services with prices.', 'En çok satan üç ürün ya da hizmet ve fiyatları.'),
    t('Since when, and who does the work? A detail of the process only you would mention.', 'Ne zamandan beri ve işi kim yapıyor? Sürecinizden sadece sizin bahsedeceğiniz bir detay.'),
    t('Do you have photos of the place, team or products we can use?', 'Kullanabileceğimiz mekân, ekip ya da ürün fotoğrafları var mı?'),
  ],
  shop: [
    t('What is the product made of, where, and by whom?', 'Ürün neyden, nerede ve kim tarafından yapılıyor?'),
    t('Shipping times, costs and return policy, exactly.', 'Kargo süreleri, ücretleri ve iade koşulları, net olarak.'),
    t('Sizes, dimensions, weights, care instructions.', 'Beden, ölçü, ağırlık, bakım talimatları.'),
    t('Real reviews you can quote with the buyer\'s first name and city?', 'Alıcının adı ve şehriyle alıntılayabileceğiniz gerçek yorumlar var mı?'),
  ],
  portfolio: [
    t('Three projects: client, problem, what you did, result, year.', 'Üç proje: müşteri, sorun, ne yaptınız, sonuç, yıl.'),
    t('Your tools and the kind of work you turn down.', 'Kullandığınız araçlar ve geri çevirdiğiniz iş türü.'),
    t('Availability, rates or a starting price, and how to book.', 'Müsaitlik, ücret ya da başlangıç fiyatı ve nasıl iş verilir.'),
  ],
  blog: [
    t('Who writes here and why should a reader trust them on this topic?', 'Burada kim yazıyor ve okuyucu bu konuda ona neden güvenmeli?'),
    t('For the key posts: what did you test, measure or experience first-hand?', 'Önemli yazılar için: neyi bizzat test ettiniz, ölçtünüz ya da yaşadınız?'),
    t('Publication and update dates, and sources for the factual claims.', 'Yayın ve güncelleme tarihleri, olgusal iddiaların kaynakları.'),
  ],
  general: [],
  byFinding: {
    vanity: (f) => t(`Which of these numbers can you source, and how: ${(f.evidence[0] || '').slice(0, 120)}? The rest will be removed.`, `Bu rakamlardan hangilerinin kaynağını gösterebilirsiniz ve nasıl: ${(f.evidence[0] || '').slice(0, 120)}? Diğerleri kaldırılacak.`),
    'fake-proof': () => t('Can you share 2-3 real testimonials with full name, role and company, and permission to publish them?', 'Tam isim, unvan ve şirketle, yayınlama izniyle 2-3 gerçek yorum paylaşabilir misiniz?'),
    placeholder: (f) => t(`These placeholders need real content: ${f.evidence.join(', ')}. What should replace each, or should the block go?`, `Bu yer tutucuların gerçek içeriğe ihtiyacı var: ${f.evidence.join(', ')}. Her birinin yerine ne gelsin, yoksa blok kaldırılsın mı?`),
    'dead-links': (f) => t(`Where should these go: ${f.evidence.join(', ')}?`, `Bunlar nereye gitmeli: ${f.evidence.join(', ')}?`),
    inflation: () => t('For each "crucial / game-changing" claim: what happened, for whom, when?', 'Her "kritik / çığır açan" iddiası için: ne oldu, kimin için, ne zaman?'),
  },
  trustItems: [
    { id: 'person', text: t('Add the people behind it: names, roles, a photo, a short line on their experience.', 'Arkasındaki insanları ekleyin: isim, rol, fotoğraf, deneyimlerine dair kısa bir satır.') },
    { id: 'email', text: t('Add a direct contact: a real email or a contact page that reaches a person.', 'Doğrudan iletişim ekleyin: gerçek bir e-posta ya da bir insana ulaşan iletişim sayfası.') },
    { id: 'address', text: t('Show the address or the city you operate from.', 'Adresi ya da faaliyet gösterdiğiniz şehri gösterin.'), types: ['local', 'shop', 'general'] },
    { id: 'price', text: t('Publish prices or a clear starting price.', 'Fiyatları ya da net bir başlangıç fiyatını yayınlayın.'), types: ['saas', 'local', 'shop', 'portfolio'] },
    { id: 'legal', text: t('Add the legal entity in the footer (company name, registration or tax number where customary).', 'Altbilgiye yasal unvanı ekleyin (şirket adı, gerekiyorsa sicil ya da vergi no).'), types: ['saas', 'shop'] },
    { id: 'dated', text: t('Date your content and show when it was last updated.', 'İçeriğe tarih koyun ve son güncellemeyi gösterin.'), types: ['blog', 'saas'] },
  ],
};
