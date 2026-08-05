/** Hikayemiz sayfasının metinleri. Bölüm sırası sayfadaki akışla aynıdır. */

export const storyHero = {
  label: "1959’dan Bugüne",
  title: "Bir tatlı hafızanın hikâyesi.",
  description:
    "Funda 1959’un hikâyesi yalnızca bir pastanenin değil; kuşaklar boyunca aktarılan ustalığın, emeğin ve insanları aynı masa etrafında buluşturan bir geleneğin hikâyesidir.",
};

export type StoryChapterContent = {
  id: string;
  label: string;
  title: string;
  paragraphs: string[];
  emphasis: string;
};

export const storyChaptersContent: StoryChapterContent[] = [
  {
    id: "kokler",
    label: "Kökler",
    title: "Çamlıhemşin’den Moskova’ya",
    paragraphs: [
      "1800’lü yıllarda Çamlıhemşin’in zorlu coğrafyası, bölge halkının bir bölümünü geçimini sağlamak için farklı ülkelere yöneltti. Abdulhamit Tarakçı ve oğlu Hurşit Tarakçı da bu yolculuğa çıkarak Moskova’ya gitti.",
      "Burada fırıncılıkla tanışan aile, ticari hayatına ilk adımını attı. Zaman içinde kazanılan ustalık, yalnızca bir meslek olarak değil; babadan oğula aktarılan güçlü bir aile geleneği olarak yaşamaya devam etti.",
    ],
    emphasis: "Her şey, yeni bir hayat kurmak için çıkılan uzun bir yolculukla başladı.",
  },
  {
    id: "ustalik",
    label: "Ustalığın Yolculuğu",
    title: "Fırından pastaneye",
    paragraphs: [
      "Yıllar içinde İsmail ve Yunus Tarakçı kardeşlerin sürdürdüğü yolculuğa Tevfik ve Mehmet Ali Tarakçı da katıldı. Aile, Moskova’dan ayrılarak Karadeniz sahilindeki Yalta’ya geçti ve burada fırıncılıktan pastacılığa uzanan yeni bir dönemin kapısını açtı.",
      "Yalta’da kurulan Vatan Pastanesi, ailenin pastacılık alanındaki ilk önemli adımlarından biri oldu. Gelen ilgi ve taleple birlikte açılan Dilber Pastanesi ise bu geleneğin büyümesini sağladı.",
    ],
    emphasis: "Fırıncılıkla başlayan ustalık, zamanla pastacılığın inceliğiyle buluştu.",
  },
  {
    id: "donus",
    label: "Türkiye’ye Dönüş",
    title: "Samsun’dan Ankara’ya",
    paragraphs: [
      "Rusya’daki siyasi gelişmeler ve değişen şartlar, ailenin Türkiye’ye dönüş yolculuğunu başlattı. İsmail Tarakçı Samsun’a yerleşerek Ulus Pastanesi’ni açtı; daha sonra kardeşi Mehmet Ali Tarakçı da kendisine katıldı.",
      "Mehmet Ali ve Tevfik Tarakçı, pastacılık alanında yeni yöntemler ve yeni işletmelerle aile mesleğini sürdürdü. Sonraki kuşaklar ise bu birikimi Ankara’ya taşıyarak ailenin pastacılık hikâyesinde yeni bir dönem başlattı.",
    ],
    emphasis: "Değişen şehirler oldu; değişmeyen ise mesleğe duyulan bağlılıktı.",
  },
];

export const foundingChapter = {
  year: "1959",
  label: "Funda Adı Doğuyor",
  title: "Akay’da açılan ilk vitrin",
  paragraphs: [
    "1948 yılında İbrahim Tarakçı’nın Ankara’da açtığı Meram Pastanesi, ailenin Ankara’daki yolculuğunun önemli duraklarından biri oldu. Ardından kardeşi Bülent Tarakçı da bu pastacılık serüvenine katıldı.",
    "1959 yılında Bülent Tarakçı, kardeşi Günhan Tarakçı ile Hüseyin ve Bekir Kutlu’nun bir araya gelmesiyle Akay’da Funda Pastanesi açıldı.",
    "Funda adı, o günden itibaren yalnızca lezzetlerle değil; Ankara’nın buluşmaları, kutlamaları, misafirlikleri ve günlük küçük mutluluklarıyla birlikte anılmaya başladı.",
  ],
  emphasis:
    "Bir pastanenin ötesinde, kuşaklar boyunca yaşayacak bir tatlı hafıza doğdu.",
};

export const growthChapter = {
  label: "Ankara’da Büyüyen Bir Pastane Kültürü",
  title: "Şehrin farklı noktalarında aynı sofra",
  paragraphs: [
    "Akay’da başlayan Funda yolculuğu, ilerleyen yıllarda Çankaya ve Gaziosmanpaşa şubeleriyle genişledi. Marka, Ankara’nın farklı noktalarında insanların özel günlerine, aile sofralarına ve günlük buluşmalarına eşlik etti.",
    "Yıllar içinde AŞTİ, Yaşamkent, Ümitköy Galleria, Angora ve Panora gibi farklı lokasyonlarda hizmet veren Funda; geçmişten gelen üretim kültürünü değişen şehir hayatıyla birlikte geliştirmeye devam etti.",
    "Bu büyümenin merkezinde yalnızca yeni şubeler değil; kuşaktan kuşağa aktarılan ustalık, güven ve misafirperverlik anlayışı yer aldı.",
  ],
  emphasis: "Şehir değişti, alışkanlıklar değişti; Funda’nın sıcaklığı aynı kaldı.",
};

export const todayChapter = {
  label: "Geçmişten Bugüne",
  title: "Aynı hikâyenin yeni dönemi",
  paragraphs: [
    "2024 yılında Emine Tarakçı ve ailesinin GOP ve Panora şubelerini devralmasıyla Funda’nın hikâyesinde yeni bir dönem başladı. 2025 yılında açılan İncek TONA Residence şubesiyle marka, geçmişten gelen lezzet geleneğini yeni müşterilerle buluşturmaya devam etti.",
    "Bugün Funda 1959; köklü geçmişini korurken, pastane kültürünü günümüzün buluşma, paylaşma ve sosyalleşme alışkanlıklarıyla yeniden yorumlamaktadır.",
    "Her kahve molasında, her kutlamada ve sevdiklerinize götürülen her kutuda bu uzun hikâyenin küçük bir parçası yaşamaya devam eder.",
  ],
  emphasis:
    "Geçmişten gelen bir lezzet, bugünün küçük mutluluklarında yaşamaya devam ediyor.",
};

export const storyCta = {
  title: "Hikâyemiz devam ediyor.",
  description:
    "Kuşaklar boyunca aktarılan ustalığı, sıcaklığı ve pastane kültürünü gelecek nesillere taşımaya devam ediyoruz.",
  primary: { href: "/lezzetler", label: "Lezzetlerimizi Keşfedin" },
  secondary: { href: "/subeler", label: "Funda’da Buluşalım" },
};
