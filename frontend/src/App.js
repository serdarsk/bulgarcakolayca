import { useState, useEffect, createContext, useContext } from "react";
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
  ChevronRight
} from "lucide-react";
import { Toaster, toast } from "sonner";

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
    { href: "#pricing", label: t("nav.pricing") },
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

          {/* Language Switcher */}
          <div className="hidden md:flex items-center gap-2">
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

        {/* Stats Ribbon */}
        <StatsRibbon />
      </div>
    </section>
  );
};

// Stats Ribbon Component
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
                src="https://images.unsplash.com/photo-1597561030767-5ce58b1a2393?auto=format&fit=crop&q=80&w=600"
                alt="Instructor"
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
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A201C] mb-6">
              {t("about.sectionTitle")}
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
                {[t("about.credential1"), t("about.credential2"), t("about.credential3")].map((cred, i) => (
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
    {
      key: "a1",
      color: "green",
      icon: BookOpen,
    },
    {
      key: "a2",
      color: "red",
      icon: GraduationCap,
    },
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <CardHeader className={`${isGreen ? "bg-[#1B5E3C]" : "bg-[#C41E3A]"} text-white p-6`}>
                  <div className="flex items-center gap-4">
                    <course.icon className="h-10 w-10" />
                    <div>
                      <CardTitle className="text-2xl font-bold heading-serif">{courseData.title}</CardTitle>
                      <CardDescription className="text-white/80 body-sans">
                        {isGreen ? "Bulgarca" : "Türkçe"} - {course.key.toUpperCase()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Clock className={`h-5 w-5 ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                      <div>
                        <p className="text-xs text-[#52525B] body-sans">{t("courses.duration")}</p>
                        <p className="font-semibold text-[#1A201C]">{courseData.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className={`h-5 w-5 ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                      <div>
                        <p className="text-xs text-[#52525B] body-sans">{t("courses.weeklyHours")}</p>
                        <p className="font-semibold text-[#1A201C]">{courseData.hours}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-[#1A201C] mb-3 heading-serif">{t("courses.whatYouLearn")}</h4>
                    <ul className="space-y-2">
                      {courseData.features?.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#52525B] body-sans text-sm">
                          <CheckCircle2 className={`h-4 w-4 mt-0.5 ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-4 rounded-xl ${isGreen ? "bg-[#E8F5E9]" : "bg-[#FDE8EB]"}`}>
                    <p className="text-sm text-[#52525B] body-sans">{t("courses.price")}</p>
                    <p className={`text-3xl font-bold heading-serif ${isGreen ? "text-[#1B5E3C]" : "text-[#C41E3A]"}`}>
                      {courseData.price}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button 
                    asChild
                    className={`w-full rounded-full py-6 text-lg font-semibold ${
                      isGreen 
                        ? "bg-[#1B5E3C] hover:bg-[#0D3321]" 
                        : "bg-[#C41E3A] hover:bg-[#A01830]"
                    } text-white`}
                    data-testid={`enroll-btn-${course.key}`}
                  >
                    <a href="#contact">
                      {t("courses.enrollNow")}
                      <ArrowRight className="ml-2 h-5 w-5" />
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

// Why Choose Us Section
const WhyUsSection = () => {
  const { t } = useLanguage();

  const icons = [BookOpen, Users, MessageCircle, Award, Calendar, Monitor];

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

// Level Test Section
const LevelTestSection = () => {
  const { t, lang } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(0); // 0: form, 1+: questions
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuestions = async (language) => {
    try {
      const response = await axios.get(`${API}/quiz/questions/${language}`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error(t("common.error"));
    }
  };

  const handleStartTest = () => {
    if (!name || !email || !selectedLanguage) {
      toast.error("Lütfen tüm alanları doldurun / Please fill all fields");
      return;
    }
    fetchQuestions(selectedLanguage);
    setStep(1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const answersArray = Object.entries(answers).map(([qId, opt]) => ({
        question_id: parseInt(qId),
        selected_option: opt,
      }));

      const response = await axios.post(`${API}/quiz/submit`, {
        name,
        email,
        language_learning: selectedLanguage,
        answers: answersArray,
      });

      setResult(response.data);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setStep(0);
    setSelectedLanguage("");
    setName("");
    setEmail("");
    setQuestions([]);
    setAnswers({});
    setResult(null);
  };

  const currentQuestion = questions[step - 1];
  const progress = questions.length > 0 ? (step / questions.length) * 100 : 0;

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
        <DialogContent className="max-w-xl" data-testid="quiz-modal">
          <DialogHeader>
            <DialogTitle className="heading-serif text-2xl">
              {result ? t("levelTest.result") : t("levelTest.sectionTitle")}
            </DialogTitle>
            <DialogDescription className="body-sans">
              {!result && step === 0 && t("levelTest.selectLanguage")}
              {!result && step > 0 && `${t("levelTest.question")} ${step}${t("levelTest.of")}${questions.length}`}
            </DialogDescription>
          </DialogHeader>

          {/* Result */}
          {result ? (
            <div className="text-center py-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                <Award className="h-12 w-12 text-[#1B5E3C]" />
              </div>
              <h3 className="text-4xl font-bold text-[#1B5E3C] mb-2 heading-serif">
                {result.score}/{result.total_questions}
              </h3>
              <p className="text-[#52525B] mb-4 body-sans">
                {t("levelTest.score")}: {result.percentage.toFixed(0)}%
              </p>
              <div className="p-4 bg-[#F9F9F7] rounded-xl mb-6">
                <p className="text-sm text-[#52525B] body-sans">{t("levelTest.recommendedLevel")}</p>
                <p className="text-2xl font-bold text-[#C41E3A] heading-serif">{result.recommended_level}</p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => { resetQuiz(); }}
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
          ) : step === 0 ? (
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
            /* Questions */
            <div className="py-4">
              <Progress value={progress} className="mb-6 h-2" />
              
              {currentQuestion && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1A201C] heading-serif">
                    {currentQuestion.question}
                  </h3>
                  {currentQuestion.translation && currentQuestion.translation[lang === "bg" ? "en" : lang === "en" ? "tr" : "en"] && (
                    <p className="text-sm text-[#52525B] italic body-sans">
                      ({currentQuestion.translation[lang === "bg" ? "en" : lang === "en" ? "tr" : "en"]})
                    </p>
                  )}
                  
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() || ""}
                    onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: parseInt(value) })}
                  >
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, i) => (
                        <div 
                          key={i} 
                          className="flex items-center space-x-3 p-3 rounded-lg border border-[#E4E4E7] hover:border-[#1B5E3C] transition-colors"
                        >
                          <RadioGroupItem value={i.toString()} id={`option-${i}`} data-testid={`option-${i}`} />
                          <Label htmlFor={`option-${i}`} className="cursor-pointer body-sans flex-1">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="flex gap-4 mt-6">
                    {step > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                        className="flex-1 rounded-full"
                        data-testid="prev-btn"
                      >
                        {t("levelTest.previous")}
                      </Button>
                    )}
                    {step < questions.length ? (
                      <Button
                        onClick={() => setStep(step + 1)}
                        disabled={answers[currentQuestion.id] === undefined}
                        className="flex-1 bg-[#1B5E3C] hover:bg-[#0D3321] rounded-full"
                        data-testid="next-btn"
                      >
                        {t("levelTest.next")}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading || answers[currentQuestion.id] === undefined}
                        className="flex-1 bg-[#C41E3A] hover:bg-[#A01830] rounded-full"
                        data-testid="submit-quiz-btn"
                      >
                        {isLoading ? t("common.loading") : t("levelTest.submit")}
                      </Button>
                    )}
                  </div>
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

// Main App
function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <Toaster position="top-center" richColors />
        <Navigation />
        <main>
          <HeroSection />
          <AboutSection />
          <CoursesSection />
          <WhyUsSection />
          <PricingSection />
          <LevelTestSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

export default App;
