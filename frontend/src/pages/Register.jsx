import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_2d64ef58-c386-4e0e-a863-1ce75f20d54b/artifacts/p8omxwrl_image.png";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      setIsSuccess(true);
      toast.success("Kayıt başarılı! Öğretmen onayı bekleniyor.");
    } catch (error) {
      const msg = error.response?.data?.detail || "Kayıt başarısız";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F9F7] to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-[#1B5E3C] shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-[#1B5E3C]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A201C] mb-2">Kayıt Başarılı!</h2>
            <p className="text-[#52525B] mb-6">
              Hesabınız oluşturuldu ve öğretmen onayı bekliyor. 
              Onaylandığında giriş yapabileceksiniz.
            </p>
            <Button
              onClick={() => navigate("/panel/login")}
              className="bg-[#1B5E3C] hover:bg-[#0D3321] text-white rounded-full px-8"
              data-testid="go-to-login"
            >
              Giriş Sayfasına Git
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F9F7] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[#1B5E3C] hover:text-[#0D3321] mb-6 transition-colors"
          data-testid="back-to-home"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana Sayfaya Dön
        </Link>

        <Card className="border-2 border-[#E4E4E7] shadow-xl">
          <CardHeader className="text-center pb-2">
            <img src={LOGO_URL} alt="BulgarcaKolayca" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-[#1A201C]">Öğrenci Kaydı</CardTitle>
            <CardDescription>Yeni hesap oluşturun</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  required
                  minLength={2}
                  className="mt-1"
                  data-testid="register-name"
                />
              </div>

              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="mt-1"
                  data-testid="register-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    minLength={6}
                    data-testid="register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#1A201C]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  required
                  className="mt-1"
                  data-testid="register-confirm-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C41E3A] hover:bg-[#A01830] text-white rounded-full py-6"
                data-testid="register-submit"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Kayıt yapılıyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Kayıt Ol
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#52525B] text-sm">
                Zaten hesabınız var mı?{" "}
                <Link 
                  to="/panel/login" 
                  className="text-[#1B5E3C] hover:underline font-medium"
                  data-testid="login-link"
                >
                  Giriş Yapın
                </Link>
              </p>
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 bg-[#FFF8E6] border border-[#F5C518] rounded-lg text-sm">
              <p className="text-[#8B6914]">
                <strong>Not:</strong> Kayıt olduktan sonra hesabınızın öğretmen tarafından onaylanması gerekmektedir.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bulgarian flag colors decoration */}
        <div className="flex justify-center gap-1 mt-6">
          <div className="w-16 h-1 bg-white border border-[#E4E4E7] rounded-full" />
          <div className="w-16 h-1 bg-[#1B5E3C] rounded-full" />
          <div className="w-16 h-1 bg-[#C41E3A] rounded-full" />
        </div>
      </div>
    </div>
  );
}
