import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_2d64ef58-c386-4e0e-a863-1ce75f20d54b/artifacts/p8omxwrl_image.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(email, password);
      toast.success("Giriş başarılı!");
      navigate(user.role === "teacher" ? "/panel/teacher" : "/panel/student");
    } catch (error) {
      const msg = error.response?.data?.detail || "Giriş başarısız";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-bold text-[#1A201C]">Öğrenci Paneli</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  data-testid="login-email"
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
                    placeholder="••••••••"
                    required
                    data-testid="login-password"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1B5E3C] hover:bg-[#0D3321] text-white rounded-full py-6"
                data-testid="login-submit"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Giriş yapılıyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#52525B] text-sm">
                Hesabınız yok mu?{" "}
                <Link 
                  to="/panel/register" 
                  className="text-[#C41E3A] hover:underline font-medium"
                  data-testid="register-link"
                >
                  Kayıt Olun
                </Link>
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
