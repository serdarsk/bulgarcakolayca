import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import axios from "axios";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  GraduationCap, 
  Globe, 
  Languages, 
  CheckCircle2, 
  Star, 
  PlayCircle, 
  ArrowRight,
  Menu,
  X,
  Clock,
  Users,
  Award,
  Calendar,
  Monitor,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  LogIn
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Logo URL
const LOGO_URL = "https://customer-assets.emergentagent.com/job_2d64ef58-c386-4e0e-a863-1ce75f20d54b/artifacts/p8omxwrl_image.png";

// Language Context
const LanguageContext = createContext();

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("tr");
  const t = (path) => {
    const keys = path.split(".");
    let result = translations[lang];
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { lang, setLang, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#about", label: t("nav.about") },
    { href: "#courses", label: t("nav.courses") },
    { href: "#flashcards", label: t("nav.flashcards") || "Kelime Kartları" },
    { href: "#level-test", label: t("nav.levelTest") },
    { href: "#contact", label: t("nav.contact") },
  ];

  return (
    <nav 
      data-testid="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3" data-testid="logo-link">
            <img src={LOGO_URL} alt="BulgarcaKolayca" className="h-14 w-auto" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#1A201C] hover:text-[#1B5E3C] font-medium transition-colors body-sans"
                data-testid={`nav-${link.href.replace('#', '')}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Language Switcher + Panel Button */}
          <div className="hidden md:flex items-center gap-3">
            {["tr", "en", "bg"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                data-testid={`lang-${l}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  lang === l
                    ? "bg-[#1B5E3C] text-white"
                    : "text-[#1A201C] hover:bg-[#1B5E3C]/10"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
            <a 
              href="/panel/login" 
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-[#C41E3A] text-white rounded-full text-sm font-medium hover:bg-[#A01830] transition-colors"
              data-testid="panel-login-btn"
            >
              <LogIn className="h-4 w-4" />
              {t("nav.panel") || "Öğrenci Girişi"}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4" data-testid="mobile-menu">
            <div className="flex flex-col gap-4 px-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[#1A201C] hover:text-[#1B5E3C] font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 pt-4 border-t">
                {["tr", "en", "bg"].map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setIsMobileMenuOpen(false); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      lang === l
                        ? "bg-[#1B5E3C] text-white"
                        : "text-[#1A201C] bg-gray-100"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Hero Section
const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section 
      id="hero" 
      data-testid="hero-section"
      className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-[#F9F9F7] to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <h1 
              className="heading-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A201C] leading-tight mb-6"
              data-testid="hero-title"
            >
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-[#52525B] mb-8 body-sans leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                className="bg-[#C41E3A] hover:bg-[#A01830] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                data-testid="view-courses-btn"
              >
                <a href="#courses">
                  {t("hero.viewCourses")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-[#1B5E3C] text-[#1B5E3C] hover:bg-[#1B5E3C]/5 rounded-full px-8 py-6 text-lg font-medium"
                data-testid="contact-btn"
              >
                <a href="#contact">
                  {t("hero.contactUs")}
                </a>
              </Button>
            </div>
          </div>

          {/* Right Content - Video */}
          <div className="relative">
            <div className="video-container rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/t1SiYOdMrM0"
                title="BulgarcaKolayca Tanıtım"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="hero-video"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#1B5E3C]/10 rounded-full blur-2xl" />
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#C41E3A]/10 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Stats Ribbon removed */}
      </div>
    </section>
  );
};

// Stats Ribbon Component - Disabled
/*
const StatsRibbon = () => {
  const { lang } = useLanguage();
  const stats = [
    { icon: Users, value: "500+", label: { tr: "Başarılı Öğrenci", en: "Successful Students", bg: "Успешни ученици" } },
    { icon: Star, value: "98%", label: { tr: "Memnuniyet", en: "Satisfaction", bg: "Удовлетворение" } },
    { icon: Award, value: "10+", label: { tr: "Yıl Deneyim", en: "Years Experience", bg: "Години опит" } },
    { icon: Globe, value: "2", label: { tr: "Dil Seçeneği", en: "Languages", bg: "Езика" } },
  ];

  return (
    <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="text-center p-6 bg-white rounded-2xl shadow-sm border border-[#E4E4E7]"
          data-testid={`stat-${index}`}
        >
          <stat.icon className="h-8 w-8 mx-auto mb-3 text-[#1B5E3C]" />
          <div className="text-3xl font-bold text-[#1A201C] heading-serif">{stat.value}</div>
          <div className="text-sm text-[#52525B] body-sans">{stat.label[lang]}</div>
        </div>
      ))}
    </div>
  );
};
*/

// Who Is This For Section
const WhoIsThisForSection = () => {
  const { t, lang } = useLanguage();
  
  const targetAudience = {
    tr: [
      { icon: GraduationCap, text: "Bulgarca öğrenmeye yeni başlayanlar" },
      { icon: Globe, text: "Bulgaristan'da eğitim veya iş hedefleyenler" },
      { icon: MapPin, text: "Bulgaristan'a taşınmayı planlayanlar" },
      { icon: BookOpen, text: "Mevcut seviyelerini geliştirmek ve pratik yapmak isteyenler" },
      { icon: Languages, text: "Balkan kültürüne merak duyanlar" },
    ],
    en: [
      { icon: GraduationCap, text: "Beginners in learning Bulgarian" },
      { icon: Globe, text: "Those aiming for education or work in Bulgaria" },
      { icon: MapPin, text: "Those planning to move to Bulgaria" },
      { icon: BookOpen, text: "Those who want to improve their current level and practice" },
      { icon: Languages, text: "Those curious about Balkan culture" },
    ],
    bg: [
      { icon: GraduationCap, text: "Начинаещи в изучаването на български" },
      { icon: Globe, text: "Тези, които се стремят към образование или работа в България" },
      { icon: MapPin, text: "Тези, които планират да се преместят в България" },
      { icon: BookOpen, text: "Тези, които искат да подобрят нивото си и да практикуват" },
      { icon: Languages, text: "Тези, които се интересуват от балканската култура" },
    ],
  };

  const titles = {
    tr: "Bu Kurs Kimler İçin?",
    en: "Who Is This Course For?",
    bg: "За кого е този курс?",
  };

  return (
    <section 
      id="who-is-this-for" 
      data-testid="who-is-this-for-section"
      className="py-16 md:py-24 bg-[#1B5E3C]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="heading-serif text-3xl md:text-4xl font-bold text-white text-center mb-12">
          {titles[lang]}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {targetAudience[lang].map((item, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all"
              data-testid={`target-audience-${index}`}
            >
              <item.icon className="h-10 w-10 mx-auto mb-4 text-white" />
              <p className="text-white body-sans text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const { t } = useLanguage();

  return (
    <section 
      id="about" 
      data-testid="about-section"
      className="py-20 md:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Image */}
          <div className="lg:col-span-5">
            <div className="relative">
              <img
                src="https://customer-assets.emergentagent.com/job_kolayca-courses/artifacts/l4a5pvrq_image.png"
                alt="Fatma Uslu Özşeker"
                className="rounded-2xl shadow-xl w-full object-cover aspect-[4/5]"
                data-testid="instructor-photo"
              />
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#1B5E3C]/10 rounded-full blur-3xl -z-10" />
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-7">
            <p className="text-sm font-medium tracking-wide uppercase text-[#C41E3A] mb-4 body-sans">
              {t("about.sectionTitle")}
            </p>
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-2">
              {t("about.teacherName") || "Fatma Uslu Özşeker"}
            </h2>
            <p className="text-lg text-[#52525B] mb-8 body-sans leading-relaxed">
              {t("about.bio")}
            </p>

            {/* Credentials */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1A201C] mb-4 heading-serif">
                {t("about.credentials")}
              </h3>
              <div className="flex flex-wrap gap-3">
                {[t("about.credential1")].map((cred, i) => (
                  <span 
                    key={i}
                    className="credential-badge inline-flex items-center gap-2 px-4 py-2 bg-[#E8F5E9] text-[#1B5E3C] rounded-full text-sm font-medium"
                    data-testid={`credential-${i}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {cred}
                  </span>
                ))}
              </div>
            </div>

            {/* Why Different */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A201C] mb-4 heading-serif">
                {t("about.whyDifferent")}
              </h3>
              <ul className="space-y-3">
                {[t("about.different1"), t("about.different2"), t("about.different3")].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#52525B] body-sans">
                    <ChevronRight className="h-5 w-5 text-[#1B5E3C]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Courses Section
const CoursesSection = () => {
  const { t, lang } = useLanguage();

  const courses = [
    { key: "a1", color: "green", icon: BookOpen },
    { key: "a2", color: "red", icon: GraduationCap },
    { key: "b1", color: "green", icon: BookOpen },
    { key: "b2", color: "red", icon: GraduationCap },
  ];

  return (
    <section 
      id="courses" 
      data-testid="courses-section"
      className="py-20 md:py-32 bg-[#F9F9F7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-wide uppercase text-[#C41E3A] mb-4 body-sans">
            {t("courses.sectionTitle")}
          </p>
          <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
            {t("courses.sectionTitle")}
          </h2>
          <p className="text-lg text-[#52525B] body-sans max-w-2xl mx-auto">
            {t("courses.sectionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => {
            const courseData = t(`courses.${course.key}`);
            const isGreen = course.color === "green";
            
            return (
              <Card 
                key={course.key}
                className={`course-card overflow-hidden border-2 transition-all duration-300 ${
                  isGreen ? "border-[#1B5E3C]/20 hover:border-[#1B5E3C]" : "border-[#C41E3A]/20 hover:border-[#C41E3A]"
                }`}
                data-testid={`course-card-${course.key}`}
              >
                <CardHeader className={`${isGreen ? "bg-[#1B5E3C]" : "bg-[#C41E3A]"} text-white p-4`}>
                  <div className="flex items-center gap-3">
                    <course.icon className="h-8 w-8" />
                    <div>
                      <CardTitle className="text-lg font-bold heading-serif">{courseData.title}</CardTitle>
                      <CardDescription className="text-white/80 body-sans text-xs">
                        Bulgarca - {course.key.toUpperCase()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                      <span className="text-xs text-[#1A201C] font-medium">{courseData.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                      <span className="text-xs text-[#1A201C] font-medium">{courseData.hours}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#1A201C] mb-2 heading-serif text-sm">{t("courses.whatYouLearn")}</h4>
                    <ul className="space-y-1">
                      {courseData.features?.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#52525B] body-sans text-xs">
                          <CheckCircle2 className={`h-3 w-3 mt-0.5 ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button 
                    asChild
                    className={`w-full rounded-full py-4 text-sm font-semibold ${
                      isGreen 
                        ? "bg-[#1B5E3C] hover:bg-[#0D3321]" 
                        : "bg-[#C41E3A] hover:bg-[#A01830]"
                    } text-white`}
                    data-testid={`enroll-btn-${course.key}`}
                  >
                    <a href="#contact">
                      {t("courses.enrollNow")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Curriculum Section
const CurriculumSection = () => {
  const { lang } = useLanguage();
  const [activeLevel, setActiveLevel] = useState("a1");

  const titles = {
    tr: "Müfredat İçeriği",
    en: "Curriculum Content",
    bg: "Съдържание на учебната програма",
  };

  const subtitles = {
    tr: "Her seviyede neler öğreneceksiniz",
    en: "What you will learn at each level",
    bg: "Какво ще научите на всяко ниво",
  };

  const grammarTitle = { tr: "Gramer Konuları", en: "Grammar Topics", bg: "Граматика" };
  const skillsTitle = { tr: "İletişim Becerileri", en: "Communication Skills", bg: "Комуникативни умения" };

  const curriculum = {
    a1: {
      grammar: [
        "Alfabe (Азбука)",
        "Kişi Zamirleri (Лични местоимения)",
        "Olmak Fiili - Şimdiki Zaman (Сегашно време на глагола съм)",
        "Soru Kelimeleri (Въпросителни думи)",
        "İsimlerin Cinsiyeti (Род на съществителните)",
        "Çoğul Yapısı (Множествено число)",
        "Belirli Artikel (Определителен член)",
        "İyelik Zamirleri (Притежателни местоимения)",
        "Sıfatların Cinsiyeti ve Çoğulu",
        "Karşılaştırma ve Üstünlük Dereceleri",
        "Zaman Edatları (Предлози за време)",
        "Yer Edatları (Предлози за място)",
        "Hareket Edatları (Предлози за движение)",
        "Sıklık Zarfları (Наречия за честота)",
      ],
      skills: [
        "Selamlaşma ve vedalaşma",
        "Kendini ve başkalarını tanıtma",
        "Milliyet hakkında soru sorma ve cevaplama",
        "Odaları ve mobilyaları adlandırma",
        "Aile üyeleri hakkında konuşma",
        "Hava durumu hakkında konuşma",
        "Günler ve ayları söyleme",
        "Saati sorma ve söyleme",
        "Günlük aktiviteleri anlatma",
        "Kıyafetleri ve renkleri adlandırma",
        "Toplu taşıma kullanma",
        "Yol tarifi sorma ve verme",
        "Yiyecek ürünlerini adlandırma",
        "Restoranda sipariş verme",
      ],
    },
    a2: {
      grammar: [
        "Kişi Zamirlerinin İsmin -i Hali (Винителни форми)",
        "Kişi Zamirlerinin İsmin -e Hali (Дателни форми)",
        "Olmak Fiili - Gelecek Zaman (Бъдеще време)",
        "Fiil Görünüşü (Вид на глагола)",
        "Tamamlanmamış Fiillerin Gelecek Zamanı",
        "Modal Fiiller (Модални глаголи)",
        "Geçmiş Zaman (-АХ/-ЯХ grubu)",
        "Geçmiş Zaman (-ИХ grubu)",
        "Geçmiş Zaman (-ОХ grubu)",
        "Bağlaçlar (Съюзи)",
        "Emir Kipi (Повелително наклонение)",
        "Belirsiz Geçmiş Zaman (Минало неопределено време)",
      ],
      skills: [
        "Telefon görüşmeleri yapma",
        "Randevu ayarlama",
        "Davet etme ve kabul etme",
        "Vücut bölümlerini adlandırma",
        "Fiziksel durum hakkında konuşma",
        "Gelecek planlar hakkında konuşma",
        "İnsanları tarif etme",
        "Çeşitli hizmetleri kullanma (banka, taksi, otel)",
        "Rezervasyon yapma",
        "Geçmişteki olayları anlatma",
        "Meslekleri adlandırma",
        "Eğitim ve iş deneyimi hakkında konuşma",
        "Hobiler ve ilgi alanları hakkında konuşma",
        "Komut verme",
      ],
    },
    b1: {
      grammar: [
        "İsimlerin cinsiyeti, sayısı ve belirli artikel tekrarı",
        "Sıfatların cinsiyeti, sayısı ve derecelendirme tekrarı",
        "Zarfların derecelendirmesi tekrarı",
        "İyelik zamirlerinin tam formu (Пълна форма на притежателните местоимения)",
        "Kısa dönüşlü iyelik zamiri (Кратко възвратно притежателно местоимение)",
        "Şimdiki zaman tekrarı",
        "Gelecek zaman tekrarı",
        "Emir kipi tekrarı",
        "Tamamlanmamış fiillerle gelecek zaman",
        "Geçmiş sürekli zaman (Минало несвършено време)",
        "Geçmiş belirli zaman tekrarı",
        "Belirsiz geçmiş zaman tekrarı",
        "Dönüşlü fiiller (Възвратни глаголи)",
        "Kısa ismin -i ve -e halleri tekrarı",
        "Belirsiz, olumsuz ve genelleyici zamirler",
        "Bağlaçlar tekrarı",
        "Geçmişte gelecek zaman (Бъдеще време в миналото)",
        "Koşul yapıları (Условни конструкции)",
        "Edilgen çatı (Страдателен залог)",
        "Kelime türetme (Словообразуване)",
        "Doğrudan ve dolaylı anlatım (Пряка и непряка реч)",
      ],
      skills: [
        "İnsanları, nesneleri ve yerleri tarif etme",
        "Favori ünlüler hakkında konuşma",
        "Günlük yaşam hakkında konuşma",
        "Gelecek planlar hakkında konuşma",
        "Çocukluk hakkında konuşma",
        "Geçmiş deneyimler hakkında konuşma",
        "Arkadaşlar hakkında konuşma",
        "Tatil planları hakkında konuşma",
        "Yerleri tarif etme",
        "Gerçekleşmemiş planlar hakkında konuşma",
        "Anlaşma ve anlaşmazlık ifade etme",
        "Kişisel görüş ifade etme",
        "Çeşitli belge ve formları doldurma",
        "Başkalarının sözlerini aktarma",
        "Bulgaristan'ın coğrafyası ve tarihi hakkında konuşma",
      ],
    },
    b2: {
      grammar: [
        "Bağlaçlar ve bağlaç kelimeleri (Съюзи и съюзни думи)",
        "Birleşik cümleler (Сложни изречения)",
        "Küçültme isimleri (Умалителни съществителни)",
        "Şimdiki zaman etken ortaç (Сегашно деятелно причастие)",
        "Geçmiş belirli etken ortaç (Минало свършено деятелно причастие)",
        "Geçmiş edilgen ortaç (Минало страдателно причастие)",
        "Emir kipi basit formlar",
        "Emir kipi birleşik formlar",
        "Edatlar (Предлози)",
        "Nesne çiftlemesi (Удвояване на допълнението)",
        "Dönüşlü fiiller",
        "Dönüşlü iyelik zamiri kısa ve tam form",
        "Dönüşlü edilgen çatı (Възвратно страдателен залог)",
        "İsim türetme (Словообразуване на съществителни)",
        "Belirsiz geçmiş zaman",
        "Geçmiş mükemmel zaman (Минало предварително време)",
        "Gelecek zaman",
        "Geçmişte gelecek zaman",
        "ТРЯБВА fiilinin kişili formları",
        "Sıfat türetme (Словообразуване на прилагателните)",
        "Geçmiş belirli zaman",
        "Geçmiş sürekli zaman",
        "Şimdiki ve geçmiş planda zaman uyumu",
        "Koşul cümleleri (Условни изречения)",
        "Koşul kipi (Условно наклонение)",
        "Şimdiki tarihsel zaman",
        "Fiil türetme (Словообразуване на глаголите)",
      ],
      skills: [
        "Bulgaristan ve kendi ülkelerinin doğası hakkında konuşma",
        "Tercihleri karşılaştırma ve gerekçelendirme",
        "Geleneksel Bulgar mutfağı hakkında konuşma",
        "Yemek hazırlama yöntemlerini karşılaştırma ve anlatma",
        "Yemek tarifleri önerme",
        "Farklı insan tiplerini karakter ve görünüş olarak tarif etme",
        "İletişim kurdukları insanlar ve ilişkileri hakkında konuşma",
        "Eğitim ve profesyonel deneyim hakkında konuşma",
        "İş arkadaşlarıyla ilişkiler hakkında konuşma",
        "Farklı iş yerlerini tarif etme ve karşılaştırma",
        "İdeal işi ve beklentileri tanımlama",
        "Arkadaşlarla çeşitli konularda sohbet etme",
        "Farklı arkadaşları tarif etme ve karşılaştırma",
        "Geçmişte planlanan ama gerçekleşmeyen olaylar hakkında konuşma",
        "Politik, ekonomik ve kültürel olaylar hakkında konuşma",
        "Güncel olayları tarif etme, karşılaştırma ve görüş bildirme",
        "Tatil ve eğlenceler hakkında konuşma",
        "Hayalleri ve gerçekleşmemiş hayalleri anlatma",
        "Bulgaristan tarihi hakkında konuşma",
        "Tarihi olayları tarif etme ve karşılaştırma",
      ],
    },
  };

  return (
    <section 
      id="curriculum" 
      data-testid="curriculum-section"
      className="py-20 md:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-wide uppercase text-[#C41E3A] mb-4 body-sans">
            {titles[lang]}
          </p>
          <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
            {titles[lang]}
          </h2>
          <p className="text-lg text-[#52525B] body-sans">
            {subtitles[lang]}
          </p>
        </div>

        {/* Level Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveLevel("a1")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeLevel === "a1"
                ? "bg-[#1B5E3C] text-white shadow-lg"
                : "bg-white text-[#1A201C] border-2 border-[#E4E4E7] hover:border-[#1B5E3C]"
            }`}
            data-testid="curriculum-a1-tab"
          >
            A1 - Başlangıç
          </button>
          <button
            onClick={() => setActiveLevel("a2")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeLevel === "a2"
                ? "bg-[#C41E3A] text-white shadow-lg"
                : "bg-white text-[#1A201C] border-2 border-[#E4E4E7] hover:border-[#C41E3A]"
            }`}
            data-testid="curriculum-a2-tab"
          >
            A2 - Temel
          </button>
          <button
            onClick={() => setActiveLevel("b1")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeLevel === "b1"
                ? "bg-[#1B5E3C] text-white shadow-lg"
                : "bg-white text-[#1A201C] border-2 border-[#E4E4E7] hover:border-[#1B5E3C]"
            }`}
            data-testid="curriculum-b1-tab"
          >
            B1 - Orta
          </button>
          <button
            onClick={() => setActiveLevel("b2")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeLevel === "b2"
                ? "bg-[#C41E3A] text-white shadow-lg"
                : "bg-white text-[#1A201C] border-2 border-[#E4E4E7] hover:border-[#C41E3A]"
            }`}
            data-testid="curriculum-b2-tab"
          >
            B2 - İleri
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grammar */}
          <Card className="border-2 border-[#E4E4E7]">
            <CardHeader className={`${activeLevel === "a1" || activeLevel === "b1" ? "bg-[#1B5E3C]" : "bg-[#C41E3A]"} text-white rounded-t-lg`}>
              <CardTitle className="flex items-center gap-3 text-xl">
                <BookOpen className="h-6 w-6" />
                {grammarTitle[lang]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-2">
                {curriculum[activeLevel].grammar.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#52525B] body-sans text-sm">
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${activeLevel === "a1" || activeLevel === "b1" ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border-2 border-[#E4E4E7]">
            <CardHeader className={`${activeLevel === "a1" || activeLevel === "b1" ? "bg-[#1B5E3C]" : "bg-[#C41E3A]"} text-white rounded-t-lg`}>
              <CardTitle className="flex items-center gap-3 text-xl">
                <MessageCircle className="h-6 w-6" />
                {skillsTitle[lang]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-2">
                {curriculum[activeLevel].skills.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#52525B] body-sans text-sm">
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${activeLevel === "a1" || activeLevel === "b1" ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// Flashcards Section
const FlashcardsSection = () => {
  const { t, lang } = useLanguage();
  const [activeLanguage, setActiveLanguage] = useState("bulgarian");
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCards(activeLanguage);
  }, [activeLanguage]);

  const fetchCards = async (language) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/flashcards/${language}`);
      setCards(response.data.cards.slice(0, 12)); // Show 12 cards
      setFlippedCards({});
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlip = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section 
      id="flashcards" 
      data-testid="flashcards-section"
      className="py-20 md:py-32 bg-[#F9F9F7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-wide uppercase text-[#C41E3A] mb-4 body-sans">
            {t("flashcards.sectionTitle")}
          </p>
          <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
            {t("flashcards.sectionTitle")}
          </h2>
          <p className="text-lg text-[#52525B] body-sans">
            {t("flashcards.sectionSubtitle")}
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveLanguage("bulgarian")}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeLanguage === "bulgarian"
                ? "bg-[#1B5E3C] text-white shadow-lg"
                : "bg-white text-[#1A201C] border border-[#E4E4E7] hover:border-[#1B5E3C]"
            }`}
            data-testid="flashcards-bulgarian-tab"
          >
            {t("flashcards.bulgarian")}
          </button>
          <button
            onClick={() => setActiveLanguage("turkish")}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeLanguage === "turkish"
                ? "bg-[#C41E3A] text-white shadow-lg"
                : "bg-white text-[#1A201C] border border-[#E4E4E7] hover:border-[#C41E3A]"
            }`}
            data-testid="flashcards-turkish-tab"
          >
            {t("flashcards.turkish")}
          </button>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B5E3C]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => toggleFlip(card.id)}
                className="cursor-pointer perspective-1000"
                data-testid={`flashcard-${card.id}`}
              >
                <div
                  className={`relative w-full h-40 transition-transform duration-500 transform-style-3d ${
                    flippedCards[card.id] ? "rotate-y-180" : ""
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flippedCards[card.id] ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front */}
                  <div
                    className={`absolute inset-0 rounded-xl p-4 flex flex-col items-center justify-center text-center backface-hidden ${
                      activeLanguage === "bulgarian"
                        ? "bg-[#1B5E3C] text-white"
                        : "bg-[#C41E3A] text-white"
                    }`}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-xl font-bold heading-serif mb-2">{card.word}</span>
                    <span className="text-xs opacity-75 body-sans">{t("flashcards.flipToSee")}</span>
                  </div>
                  
                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white border-2 border-[#E4E4E7] shadow-lg"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span className="text-lg font-bold text-[#1A201C] heading-serif mb-1">{card.translation}</span>
                    <span className="text-xs text-[#52525B] body-sans mb-2">/{card.pronunciation}/</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeLanguage === "bulgarian" ? "bg-[#E8F5E9] text-[#1B5E3C]" : "bg-[#FDE8EB] text-[#C41E3A]"
                    }`}>
                      {card.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Practice More Button */}
        <div className="text-center mt-12">
          <Button
            asChild
            className="bg-[#1B5E3C] hover:bg-[#0D3321] text-white rounded-full px-8 py-6 text-lg font-semibold"
            data-testid="practice-more-btn"
          >
            <a href="#courses">
              {t("flashcards.practiceMore")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

// Why Choose Us Section
const WhyUsSection = () => {
  const { t } = useLanguage();

  const icons = [BookOpen, Users, MessageCircle, Calendar, Monitor];

  return (
    <section 
      id="why-us" 
      data-testid="why-us-section"
      className="py-20 md:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
            {t("whyUs.sectionTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t("whyUs.items")?.map((item, i) => {
            const Icon = icons[i];
            return (
              <div 
                key={i}
                className="feature-card p-6 bg-[#F9F9F7] rounded-2xl border border-[#E4E4E7] hover:border-[#1B5E3C] transition-all"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-12 h-12 bg-[#1B5E3C] rounded-xl flex items-center justify-center mb-4 feature-icon">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A201C] mb-2 heading-serif">{item.title}</h3>
                <p className="text-[#52525B] body-sans text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Pricing Table Section
const PricingSection = () => {
  const { t, lang } = useLanguage();

  const pricingData = {
    tr: [
      { feature: "Fiyat", a1: "2.500 ₺", a2: "3.200 ₺" },
      { feature: "Süre", a1: "8 Hafta", a2: "10 Hafta" },
      { feature: "Sertifika", a1: "Evet", a2: "Evet" },
      { feature: "Erişim Türü", a1: "Online + Yüz Yüze", a2: "Online + Yüz Yüze" },
    ],
    en: [
      { feature: "Price", a1: "€150", a2: "€200" },
      { feature: "Duration", a1: "8 Weeks", a2: "10 Weeks" },
      { feature: "Certificate", a1: "Yes", a2: "Yes" },
      { feature: "Access Type", a1: "Online + In-person", a2: "Online + In-person" },
    ],
    bg: [
      { feature: "Цена", a1: "300 лв", a2: "400 лв" },
      { feature: "Продължителност", a1: "8 седмици", a2: "10 седмици" },
      { feature: "Сертификат", a1: "Да", a2: "Да" },
      { feature: "Тип достъп", a1: "Онлайн + Присъствено", a2: "Онлайн + Присъствено" },
    ],
  };

  return (
    <section 
      id="pricing" 
      data-testid="pricing-section"
      className="py-20 md:py-32 bg-[#F9F9F7]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
            {t("pricing.sectionTitle")}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E4E4E7]">
          <table className="w-full" data-testid="pricing-table">
            <thead>
              <tr className="bg-[#1B5E3C] text-white">
                <th className="px-6 py-4 text-left font-semibold body-sans">{t("pricing.feature")}</th>
                <th className="px-6 py-4 text-center font-semibold body-sans">A1</th>
                <th className="px-6 py-4 text-center font-semibold body-sans">A2</th>
              </tr>
            </thead>
            <tbody>
              {pricingData[lang]?.map((row, i) => (
                <tr 
                  key={i} 
                  className="pricing-row border-b border-[#E4E4E7] last:border-0 hover:bg-[#F9F9F7] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-[#1A201C] body-sans">{row.feature}</td>
                  <td className="px-6 py-4 text-center text-[#52525B] body-sans">{row.a1}</td>
                  <td className="px-6 py-4 text-center text-[#52525B] body-sans">{row.a2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// Level Test Section - Adaptive System
const LevelTestSection = () => {
  const { t, lang } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState("form"); // form, testing, result
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [allQuestions, setAllQuestions] = useState({});
  const [currentLevel, setCurrentLevel] = useState("A1");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [levelAnswers, setLevelAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [levels] = useState(["A1", "A2", "B1", "B2", "C1"]);

  const [wrongCountPerLevel, setWrongCountPerLevel] = useState({});

  const fetchAllQuestions = async (language) => {
    try {
      const response = await axios.get(`${API}/quiz/all-questions/${language}`);
      setAllQuestions(response.data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error(t("common.error"));
    }
  };

  const handleStartTest = () => {
    if (!name || !email || !selectedLanguage) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    fetchAllQuestions(selectedLanguage);
    setCurrentLevel("A1");
    setCurrentQuestionIndex(0);
    setLevelAnswers({});
    setPhase("testing");
  };

  const getCurrentQuestions = () => allQuestions[currentLevel] || [];
  const currentQuestion = getCurrentQuestions()[currentQuestionIndex];

  const handleAnswer = (optionIndex) => {
    const qId = currentQuestion.id;
    const questions = getCurrentQuestions();
    const correctAnswer = currentQuestion.correct;
    
    // Check if answer is wrong
    const isWrong = optionIndex !== correctAnswer;
    
    // Update wrong count for current level
    const currentWrongCount = wrongCountPerLevel[currentLevel] || 0;
    const newWrongCount = isWrong ? currentWrongCount + 1 : currentWrongCount;
    
    const newWrongCountPerLevel = {
      ...wrongCountPerLevel,
      [currentLevel]: newWrongCount
    };
    setWrongCountPerLevel(newWrongCountPerLevel);
    
    const newLevelAnswers = {
      ...levelAnswers,
      [currentLevel]: [
        ...(levelAnswers[currentLevel] || []),
        { question_id: qId, selected_option: optionIndex }
      ]
    };
    setLevelAnswers(newLevelAnswers);

    // If 3 wrong answers in this level, stop and submit
    if (newWrongCount >= 3) {
      handleSubmitWithAnswers(newLevelAnswers);
      return;
    }

    // Move to next question or level
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Level completed - check if should move to next level
      const levelIndex = levels.indexOf(currentLevel);
      if (levelIndex + 1 < levels.length && allQuestions[levels[levelIndex + 1]]) {
        setCurrentLevel(levels[levelIndex + 1]);
        setCurrentQuestionIndex(0);
      } else {
        // All levels completed - submit with updated answers
        handleSubmitWithAnswers(newLevelAnswers);
      }
    }
  };

  const handleSubmitWithAnswers = async (answers) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/quiz/submit-adaptive`, {
        name,
        email,
        language_learning: selectedLanguage,
        level_answers: answers,
      });
      setResult(response.data);
      setPhase("result");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setPhase("form");
    setSelectedLanguage("");
    setName("");
    setEmail("");
    setAllQuestions({});
    setCurrentLevel("A1");
    setCurrentQuestionIndex(0);
    setLevelAnswers({});
    setWrongCountPerLevel({});
    setResult(null);
  };

  // Calculate progress
  const getTotalProgress = () => {
    let totalAnswered = 0;
    let totalQuestions = 0;
    
    levels.forEach(level => {
      if (allQuestions[level]) {
        totalQuestions += allQuestions[level].length;
        if (levelAnswers[level]) {
          totalAnswered += levelAnswers[level].length;
        }
      }
    });
    
    return totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
  };

  const levelLabels = {
    tr: { A1: "A1 - Başlangıç", A2: "A2 - Temel", B1: "B1 - Orta", B2: "B2 - İleri", C1: "C1 - İleri Üst" },
    en: { A1: "A1 - Beginner", A2: "A2 - Elementary", B1: "B1 - Intermediate", B2: "B2 - Upper Intermediate", C1: "C1 - Advanced" },
    bg: { A1: "A1 - Начинаещ", A2: "A2 - Елементарен", B1: "B1 - Среден", B2: "B2 - Напреднал", C1: "C1 - Професионален" },
  };

  return (
    <section 
      id="level-test" 
      data-testid="level-test-section"
      className="py-20 md:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium tracking-wide uppercase text-[#C41E3A] mb-4 body-sans">
              {t("levelTest.sectionTitle")}
            </p>
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
              {t("levelTest.sectionTitle")}
            </h2>
            <p className="text-lg text-[#52525B] body-sans mb-8">
              {t("levelTest.sectionSubtitle")}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#C41E3A] hover:bg-[#A01830] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
              data-testid="start-test-btn"
            >
              {t("levelTest.startTest")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="relative">
            <img
              src="https://images.pexels.com/photos/6283211/pexels-photo-6283211.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Students"
              className="rounded-2xl shadow-xl"
              data-testid="level-test-image"
            />
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="quiz-modal">
          <DialogHeader>
            <DialogTitle className="heading-serif text-2xl">
              {phase === "result" ? t("levelTest.result") : t("levelTest.sectionTitle")}
            </DialogTitle>
            <DialogDescription className="body-sans">
              {phase === "form" && t("levelTest.selectLanguage")}
              {phase === "testing" && (
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${currentLevel === "A1" || currentLevel === "B1" ? "bg-[#1B5E3C] text-white" : "bg-[#C41E3A] text-white"}`}>
                    {currentLevel}
                  </span>
                  <span>{levelLabels[lang]?.[currentLevel] || currentLevel}</span>
                  <span className="text-[#52525B]">• Soru {currentQuestionIndex + 1}/{getCurrentQuestions().length}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Result Screen */}
          {phase === "result" && result ? (
            <div className="py-4">
              {/* Summary Card */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                  <Award className="h-10 w-10 text-[#1B5E3C]" />
                </div>
                <h3 className="text-3xl font-bold text-[#1B5E3C] heading-serif">
                  {result.total_score}/{result.total_questions}
                </h3>
                <p className="text-[#52525B] body-sans">%{result.overall_percentage} Başarı</p>
              </div>

              {/* Recommended Level */}
              <div className="p-4 bg-gradient-to-r from-[#1B5E3C] to-[#2D8B5E] rounded-xl mb-6 text-center text-white">
                <p className="text-sm opacity-80">{t("levelTest.recommendedLevel")}</p>
                <p className="text-3xl font-bold heading-serif">{result.recommended_level}</p>
              </div>

              {/* Level Breakdown */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#1A201C] mb-3 heading-serif">Seviye Detayları</h4>
                <div className="space-y-3">
                  {result.level_scores?.map((score, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border ${score.passed ? "bg-[#E8F5E9] border-[#1B5E3C]" : "bg-[#FDE8EB] border-[#C41E3A]"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${score.passed ? "bg-[#1B5E3C] text-white" : "bg-[#C41E3A] text-white"}`}>
                            {score.level}
                          </span>
                          <span className="font-medium">{levelLabels[lang]?.[score.level] || score.level}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm body-sans">
                            {score.correct}/{score.total} (%{score.percentage})
                          </span>
                          {score.passed ? (
                            <CheckCircle2 className="h-5 w-5 text-[#1B5E3C]" />
                          ) : (
                            <X className="h-5 w-5 text-[#C41E3A]" />
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={score.percentage} 
                        className={`h-2 mt-2 ${score.passed ? "[&>div]:bg-[#1B5E3C]" : "[&>div]:bg-[#C41E3A]"}`} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Highest Passed */}
              {result.highest_passed_level && result.highest_passed_level !== "Yok" && (
                <div className="p-3 bg-[#F9F9F7] rounded-lg mb-6 text-center">
                  <p className="text-sm text-[#52525B]">En Yüksek Geçilen Seviye</p>
                  <p className="text-xl font-bold text-[#1B5E3C] heading-serif">{result.highest_passed_level}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={resetQuiz}
                  className="flex-1 rounded-full"
                  data-testid="start-over-btn"
                >
                  {t("levelTest.startOver")}
                </Button>
                <Button
                  onClick={() => { setIsModalOpen(false); resetQuiz(); }}
                  className="flex-1 bg-[#1B5E3C] hover:bg-[#0D3321] rounded-full"
                  data-testid="close-result-btn"
                >
                  {t("levelTest.close")}
                </Button>
              </div>
            </div>
          ) : phase === "form" ? (
            /* Initial Form */
            <div className="space-y-4 py-4">
              <div>
                <Label className="body-sans">{t("levelTest.name")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("levelTest.name")}
                  className="mt-1"
                  data-testid="quiz-name-input"
                />
              </div>
              <div>
                <Label className="body-sans">{t("levelTest.email")}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("levelTest.email")}
                  className="mt-1"
                  data-testid="quiz-email-input"
                />
              </div>
              <div>
                <Label className="body-sans mb-3 block">{t("levelTest.selectLanguage")}</Label>
                <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bulgarian" id="bulgarian" data-testid="lang-bulgarian" />
                      <Label htmlFor="bulgarian" className="cursor-pointer body-sans">
                        {t("levelTest.bulgarian")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="turkish" id="turkish" data-testid="lang-turkish" />
                      <Label htmlFor="turkish" className="cursor-pointer body-sans">
                        {t("levelTest.turkish")}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Test Info */}
              <div className="p-4 bg-[#F9F9F7] rounded-xl mt-4">
                <h4 className="font-semibold text-[#1A201C] mb-2">Test Hakkında</h4>
                <ul className="text-sm text-[#52525B] space-y-1">
                  <li>• A1'den C1'e kadar 5 seviye</li>
                  <li>• Her seviyede 5-6 soru</li>
                  <li>• 3 yanlış cevapda test sonlanır</li>
                  <li>• Seviye geçiş için %67 başarı gerekli</li>
                </ul>
              </div>

              <Button
                onClick={handleStartTest}
                className="w-full bg-[#C41E3A] hover:bg-[#A01830] rounded-full mt-4"
                data-testid="begin-quiz-btn"
              >
                {t("levelTest.startTest")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            /* Questions - Testing Phase */
            <div className="py-4">
              {/* Overall Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-[#52525B] mb-1">
                  <span>Genel İlerleme</span>
                  <span>%{Math.round(getTotalProgress())}</span>
                </div>
                <Progress value={getTotalProgress()} className="h-2" />
              </div>

              {/* Level Progress Dots */}
              <div className="flex justify-center gap-2 mb-6">
                {levels.map((level, i) => {
                  const hasQuestions = allQuestions[level];
                  const isActive = level === currentLevel;
                  const isPassed = levelAnswers[level]?.length === allQuestions[level]?.length;
                  
                  if (!hasQuestions) return null;
                  
                  return (
                    <div 
                      key={level}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive 
                          ? "bg-[#1B5E3C] text-white scale-110" 
                          : isPassed 
                            ? "bg-[#E8F5E9] text-[#1B5E3C] border-2 border-[#1B5E3C]" 
                            : "bg-[#E4E4E7] text-[#52525B]"
                      }`}
                    >
                      {level}
                    </div>
                  );
                })}
              </div>

              {currentQuestion && !isLoading && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1A201C] heading-serif">
                    {currentQuestion.question}
                  </h3>
                  
                  {/* Wrong answers indicator */}
                  {wrongCountPerLevel[currentLevel] > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#C41E3A]">Yanlış: {wrongCountPerLevel[currentLevel]}/3</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className="w-full text-left p-4 rounded-lg border border-[#E4E4E7] hover:border-[#1B5E3C] hover:bg-[#E8F5E9] transition-all body-sans"
                        data-testid={`option-${i}`}
                      >
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B5E3C] mx-auto mb-4"></div>
                  <p className="text-[#52525B]">Sonuçlar hesaplanıyor...</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, {
        ...formData,
        language: lang,
      });
      toast.success(t("contact.success"));
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t("contact.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="contact" 
      data-testid="contact-section"
      className="py-20 md:py-32 bg-[#F9F9F7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-4">
            {t("contact.sectionTitle")}
          </h2>
          <p className="text-lg text-[#52525B] body-sans">
            {t("contact.sectionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 shadow-xl" data-testid="contact-form-card">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="body-sans">{t("contact.name")}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("contact.name")}
                    required
                    className="mt-1"
                    data-testid="contact-name-input"
                  />
                </div>
                <div>
                  <Label className="body-sans">{t("contact.email")}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t("contact.email")}
                    required
                    className="mt-1"
                    data-testid="contact-email-input"
                  />
                </div>
                <div>
                  <Label className="body-sans">{t("contact.message")}</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t("contact.message")}
                    required
                    rows={5}
                    className="mt-1"
                    data-testid="contact-message-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#C41E3A] hover:bg-[#A01830] text-white rounded-full py-6 text-lg font-semibold"
                  data-testid="contact-submit-btn"
                >
                  {isSubmitting ? t("contact.sending") : t("contact.send")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border border-[#E4E4E7]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A201C] heading-serif">{t("contact.whatsapp")}</h3>
                  <p className="text-[#52525B] body-sans">+90 XXX XXX XX XX</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E4E4E7]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1B5E3C] rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A201C] heading-serif">{t("contact.emailUs")}</h3>
                  <p className="text-[#52525B] body-sans">info@bulgarcakolayca.com</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E4E4E7]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C41E3A] rounded-xl flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A201C] heading-serif">{t("contact.address")}</h3>
                  <p className="text-[#52525B] body-sans">İstanbul, Türkiye</p>
                </div>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <div className="rounded-xl overflow-hidden h-48 bg-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1736299298182-f90904857d49?auto=format&fit=crop&q=80&w=800&h=400"
                alt="Istanbul"
                className="w-full h-full object-cover"
                data-testid="contact-map-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  const { t } = useLanguage();

  const navLinks = [
    { href: "#about", label: t("nav.about") },
    { href: "#courses", label: t("nav.courses") },
    { href: "#pricing", label: t("nav.pricing") },
    { href: "#level-test", label: t("nav.levelTest") },
    { href: "#contact", label: t("nav.contact") },
  ];

  return (
    <footer 
      data-testid="footer"
      className="bg-[#1B5E3C] text-white py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <img src={LOGO_URL} alt="BulgarcaKolayca" className="h-16 mb-4 brightness-0 invert" />
            <p className="text-white/80 body-sans text-sm leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 heading-serif">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href}
                    className="footer-link text-white/80 hover:text-white transition-colors body-sans text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4 heading-serif">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-white/80 body-sans text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@bulgarcakolayca.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +90 XXX XXX XX XX
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                İstanbul, Türkiye
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-white/60 body-sans text-sm">
            © {new Date().getFullYear()} BulgarcaKolayca - {t("footer.academy")}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

// Landing Page Component
const LandingPage = () => {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <WhoIsThisForSection />
        <AboutSection />
        <CoursesSection />
        <CurriculumSection />
        <FlashcardsSection />
        <WhyUsSection />
        <LevelTestSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <div className="App">
            <Toaster position="top-center" richColors />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/panel/login" element={<Login />} />
              <Route path="/panel/register" element={<Register />} />
              <Route path="/panel/teacher" element={<TeacherDashboard />} />
              <Route path="/panel/student" element={<StudentDashboard />} />
            </Routes>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
