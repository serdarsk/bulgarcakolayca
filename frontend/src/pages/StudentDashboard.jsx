import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  LogOut, Calendar as CalendarIcon, FileText, Bell, 
  Video, Clock, BookOpen, ChevronRight, ArrowLeft,
  RefreshCw, ExternalLink
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_2d64ef58-c386-4e0e-a863-1ce75f20d54b/artifacts/p8omxwrl_image.png";

export default function StudentDashboard() {
  const { user, logout, getAuthHeader, isStudent, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lessons");
  
  // Data states
  const [lessons, setLessons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  // Form states
  const [rescheduleForm, setRescheduleForm] = useState({
    date: new Date(),
    start_time: "10:00",
    end_time: "11:00",
    reason: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/panel/login");
      return;
    }
    if (!isStudent) {
      navigate("/panel/teacher");
      return;
    }
    fetchAllData();
  }, [isAuthenticated, isStudent, navigate]);

  const fetchAllData = async () => {
    try {
      const headers = getAuthHeader();
      const [lessonsRes, materialsRes, notifsRes, rescheduleRes, unreadRes] = await Promise.all([
        axios.get(`${API}/lessons`, headers),
        axios.get(`${API}/materials`, headers),
        axios.get(`${API}/notifications`, headers),
        axios.get(`${API}/reschedule-requests`, headers),
        axios.get(`${API}/notifications/unread-count`, headers)
      ]);
      
      setLessons(lessonsRes.data);
      setMaterials(materialsRes.data);
      setNotifications(notifsRes.data);
      setRescheduleRequests(rescheduleRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleRescheduleRequest = async (e) => {
    e.preventDefault();
    if (!selectedLesson) return;
    
    try {
      await axios.post(`${API}/reschedule-request`, {
        lesson_id: selectedLesson.id,
        requested_date: format(rescheduleForm.date, "yyyy-MM-dd"),
        requested_start_time: rescheduleForm.start_time,
        requested_end_time: rescheduleForm.end_time,
        reason: rescheduleForm.reason
      }, getAuthHeader());
      
      toast.success("Talep gönderildi!");
      setShowRescheduleModal(false);
      setSelectedLesson(null);
      setRescheduleForm({ date: new Date(), start_time: "10:00", end_time: "11:00", reason: "" });
      fetchAllData();
    } catch (error) {
      toast.error("Talep gönderilemedi");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, getAuthHeader());
      setUnreadCount(0);
      fetchAllData();
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/panel/login");
  };

  const openRescheduleModal = (lesson) => {
    setSelectedLesson(lesson);
    setRescheduleForm({
      date: new Date(lesson.date),
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      reason: ""
    });
    setShowRescheduleModal(true);
  };

  // Categorize lessons
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLessons = lessons.filter(l => l.date === today);
  const upcomingLessons = lessons
    .filter(l => l.date > today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastLessons = lessons
    .filter(l => l.date < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const tabs = [
    { id: "lessons", label: "Derslerim", icon: CalendarIcon },
    { id: "materials", label: "Materyaller", icon: FileText },
    { id: "notifications", label: "Bildirimler", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E4E4E7] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img src={LOGO_URL} alt="Logo" className="h-10" />
              </Link>
              <div>
                <h1 className="font-bold text-[#1A201C]">Öğrenci Paneli</h1>
                <p className="text-xs text-[#52525B]">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-[#52525B] hover:text-[#1B5E3C] text-sm flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Ana Sayfa
              </Link>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-[#C41E3A] text-[#C41E3A] hover:bg-[#C41E3A] hover:text-white"
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Card */}
        <Card className="mb-6 bg-gradient-to-r from-[#1B5E3C] to-[#2D8B5E] text-white">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">Hoş Geldin, {user?.name}! 👋</h2>
            <p className="opacity-90">
              {todayLessons.length > 0 
                ? `Bugün ${todayLessons.length} dersin var!` 
                : "Bugün dersin yok. Yaklaşan derslerini kontrol et."}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-[#1B5E3C] text-white" 
                  : "bg-white text-[#52525B] hover:bg-[#E4E4E7]"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? "bg-white text-[#1B5E3C]" : "bg-[#C41E3A] text-white"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lessons Tab */}
        {activeTab === "lessons" && (
          <div className="space-y-6">
            {/* Today's Lessons */}
            {todayLessons.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#1A201C] mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#1B5E3C] rounded-full animate-pulse" />
                  Bugünkü Dersler
                </h3>
                <div className="space-y-3">
                  {todayLessons.map(lesson => (
                    <Card key={lesson.id} className="border-2 border-[#1B5E3C]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-[#1A201C]">{lesson.title}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                lesson.level === "A1" || lesson.level === "B1" ? "bg-[#E8F5E9] text-[#1B5E3C]" : "bg-[#FDE8EB] text-[#C41E3A]"
                              }`}>
                                {lesson.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[#52525B]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {lesson.start_time} - {lesson.end_time}
                              </span>
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-[#52525B] mt-2">{lesson.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {lesson.zoom_link && (
                              <a 
                                href={lesson.zoom_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] text-white rounded-full hover:bg-[#0D3321] transition-colors"
                              >
                                <Video className="h-4 w-4" />
                                Derse Katıl
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Lessons */}
            <div>
              <h3 className="text-lg font-bold text-[#1A201C] mb-3">Yaklaşan Dersler</h3>
              {upcomingLessons.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-[#E4E4E7]" />
                    <p className="text-[#52525B]">Yaklaşan ders bulunmuyor</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingLessons.map(lesson => (
                    <Card key={lesson.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-[#1A201C]">{lesson.title}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                lesson.level === "A1" || lesson.level === "B1" ? "bg-[#E8F5E9] text-[#1B5E3C]" : "bg-[#FDE8EB] text-[#C41E3A]"
                              }`}>
                                {lesson.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[#52525B]">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {lesson.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {lesson.start_time} - {lesson.end_time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.zoom_link && (
                              <a 
                                href={lesson.zoom_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-[#E8F5E9] rounded-lg text-[#1B5E3C] hover:bg-[#1B5E3C] hover:text-white transition-colors"
                                title="Zoom Linki"
                              >
                                <Video className="h-5 w-5" />
                              </a>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openRescheduleModal(lesson)}
                              className="text-[#52525B]"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Tarih Değiştir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Reschedule Requests Status */}
            {rescheduleRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#1A201C] mb-3">Tarih Değişiklik Taleplerim</h3>
                <div className="space-y-2">
                  {rescheduleRequests.map(req => (
                    <Card key={req.id} className={
                      req.status === "approved" ? "border-[#1B5E3C]" :
                      req.status === "rejected" ? "border-[#C41E3A]" : "border-[#F5C518]"
                    }>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#52525B]">
                              {req.original_date} → {req.requested_date}
                            </p>
                            <p className="text-xs text-[#A1A1AA]">{req.reason}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            req.status === "approved" ? "bg-[#E8F5E9] text-[#1B5E3C]" :
                            req.status === "rejected" ? "bg-[#FDE8EB] text-[#C41E3A]" : 
                            "bg-[#FFF8E6] text-[#8B6914]"
                          }`}>
                            {req.status === "approved" ? "Onaylandı" :
                             req.status === "rejected" ? "Reddedildi" : "Bekliyor"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Lessons */}
            {pastLessons.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#1A201C] mb-3">Geçmiş Dersler</h3>
                <div className="space-y-2">
                  {pastLessons.slice(0, 5).map(lesson => (
                    <Card key={lesson.id} className="opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-[#1A201C]">{lesson.title}</h4>
                            <p className="text-sm text-[#52525B]">{lesson.date} • {lesson.start_time}</p>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-[#E4E4E7] text-[#52525B]">
                            Tamamlandı
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#1A201C]">Ders Materyalleri</h3>
            
            {materials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-[#E4E4E7]" />
                  <p className="text-[#52525B]">Henüz materyal paylaşılmadı</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(material => (
                  <Card key={material.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className={`p-3 rounded-lg inline-block mb-3 ${
                        material.file_type === "video" ? "bg-[#FDE8EB]" : 
                        material.file_type === "audio" ? "bg-[#FFF8E6]" : "bg-[#E8F5E9]"
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          material.file_type === "video" ? "text-[#C41E3A]" : 
                          material.file_type === "audio" ? "text-[#8B6914]" : "text-[#1B5E3C]"
                        }`} />
                      </div>
                      <h4 className="font-bold text-[#1A201C] mb-1">{material.title}</h4>
                      {material.description && (
                        <p className="text-sm text-[#52525B] mb-3">{material.description}</p>
                      )}
                      <a 
                        href={material.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] text-white rounded-full text-sm hover:bg-[#0D3321] transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Aç
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A201C]">Bildirimler</h3>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  Tümünü Okundu İşaretle
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-[#E4E4E7]" />
                  <p className="text-[#52525B]">Bildirim yok</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => (
                  <Card key={notif.id} className={!notif.read ? "border-l-4 border-l-[#1B5E3C]" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notif.type === "warning" ? "bg-[#FDE8EB]" :
                          notif.type === "success" ? "bg-[#E8F5E9]" :
                          notif.type === "lesson" ? "bg-[#E8F5E9]" : "bg-[#F9F9F7]"
                        }`}>
                          <Bell className={`h-5 w-5 ${
                            notif.type === "warning" ? "text-[#C41E3A]" :
                            notif.type === "success" ? "text-[#1B5E3C]" :
                            notif.type === "lesson" ? "text-[#1B5E3C]" : "text-[#52525B]"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-[#1A201C]">{notif.title}</h4>
                          <p className="text-sm text-[#52525B]">{notif.message}</p>
                          <p className="text-xs text-[#A1A1AA] mt-1">
                            {new Date(notif.created_at).toLocaleString("tr-TR")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarih Değişiklik Talebi</DialogTitle>
            <DialogDescription>
              {selectedLesson?.title} dersi için yeni tarih/saat önerin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRescheduleRequest} className="space-y-4">
            <div>
              <Label>Yeni Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(rescheduleForm.date, "PPP", { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={rescheduleForm.date}
                    onSelect={(date) => date && setRescheduleForm({...rescheduleForm, date})}
                    locale={tr}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç Saati</Label>
                <Input
                  type="time"
                  value={rescheduleForm.start_time}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label>Bitiş Saati</Label>
                <Input
                  type="time"
                  value={rescheduleForm.end_time}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, end_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Sebep</Label>
              <Textarea
                value={rescheduleForm.reason}
                onChange={(e) => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                placeholder="Tarih değişikliği sebebinizi yazın..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRescheduleModal(false)}>İptal</Button>
              <Button type="submit" className="bg-[#1B5E3C] hover:bg-[#0D3321]">Talep Gönder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
