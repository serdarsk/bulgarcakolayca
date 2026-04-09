import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  LogOut, Users, Calendar as CalendarIcon, FileText, Bell, 
  Plus, Check, X, Trash2, Edit, Video, Clock, User,
  BookOpen, CheckCircle2, AlertCircle, ChevronRight, Settings, Key
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_2d64ef58-c386-4e0e-a863-1ce75f20d54b/artifacts/p8omxwrl_image.png";

export default function TeacherDashboard() {
  const { user, logout, getAuthHeader, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [students, setStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Modal states
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Form states
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", date: new Date(), 
    start_time: "10:00", end_time: "11:00",
    lesson_type: "individual", student_ids: [], 
    zoom_link: "", level: "A1", max_students: 5
  });
  const [materialForm, setMaterialForm] = useState({
    title: "", description: "", link: "", 
    file_type: "document", visible_to: []
  });
  const [studentForm, setStudentForm] = useState({
    name: "", email: "", password: ""
  });
  const [settingsForm, setSettingsForm] = useState({
    name: "", email: "", currentPassword: "", newPassword: "", confirmPassword: ""
  });

  useEffect(() => {
    if (!isTeacher) {
      navigate("/panel/login");
      return;
    }
    fetchAllData();
  }, [isTeacher, navigate]);

  const fetchAllData = async () => {
    try {
      const headers = getAuthHeader();
      const [studentsRes, pendingRes, lessonsRes, materialsRes, notifsRes, rescheduleRes, unreadRes] = await Promise.all([
        axios.get(`${API}/teacher/students`, headers),
        axios.get(`${API}/teacher/pending-students`, headers),
        axios.get(`${API}/lessons`, headers),
        axios.get(`${API}/materials`, headers),
        axios.get(`${API}/notifications`, headers),
        axios.get(`${API}/reschedule-requests`, headers),
        axios.get(`${API}/notifications/unread-count`, headers)
      ]);
      
      setStudents(studentsRes.data);
      setPendingStudents(pendingRes.data);
      setLessons(lessonsRes.data);
      setMaterials(materialsRes.data);
      setNotifications(notifsRes.data);
      setRescheduleRequests(rescheduleRes.data.filter(r => r.status === "pending"));
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleApproveStudent = async (studentId, approved) => {
    try {
      await axios.post(`${API}/teacher/approve-student`, 
        { student_id: studentId, approved }, 
        getAuthHeader()
      );
      toast.success(approved ? "Öğrenci onaylandı" : "Öğrenci reddedildi");
      fetchAllData();
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/teacher/student/${studentId}`, getAuthHeader());
      toast.success("Öğrenci silindi");
      fetchAllData();
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...lessonForm,
        date: format(lessonForm.date, "yyyy-MM-dd")
      };
      await axios.post(`${API}/lessons`, data, getAuthHeader());
      toast.success("Ders oluşturuldu");
      setShowLessonModal(false);
      setLessonForm({
        title: "", description: "", date: new Date(), 
        start_time: "10:00", end_time: "11:00",
        lesson_type: "individual", student_ids: [], 
        zoom_link: "", level: "A1", max_students: 5
      });
      fetchAllData();
    } catch (error) {
      toast.error("Ders oluşturulamadı");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/lessons/${lessonId}`, getAuthHeader());
      toast.success("Ders silindi");
      fetchAllData();
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/materials`, materialForm, getAuthHeader());
      toast.success("Materyal eklendi");
      setShowMaterialModal(false);
      setMaterialForm({ title: "", description: "", link: "", file_type: "document", visible_to: [] });
      fetchAllData();
    } catch (error) {
      toast.error("Materyal eklenemedi");
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Bu materyali silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/materials/${materialId}`, getAuthHeader());
      toast.success("Materyal silindi");
      fetchAllData();
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/teacher/add-student`, studentForm, getAuthHeader());
      toast.success("Öğrenci eklendi");
      setShowStudentModal(false);
      setStudentForm({ name: "", email: "", password: "" });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Öğrenci eklenemedi");
    }
  };

  const handleRescheduleResponse = async (requestId, approved) => {
    try {
      await axios.post(`${API}/reschedule-requests/${requestId}/respond`, 
        { request_id: requestId, approved, message: "" },
        getAuthHeader()
      );
      toast.success(approved ? "Talep onaylandı" : "Talep reddedildi");
      fetchAllData();
    } catch (error) {
      toast.error("İşlem başarısız");
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (settingsForm.newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    try {
      await axios.put(`${API}/auth/change-password`, {
        current_password: settingsForm.currentPassword,
        new_password: settingsForm.newPassword
      }, getAuthHeader());
      toast.success("Şifre başarıyla değiştirildi");
      setSettingsForm({ ...settingsForm, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Şifre değiştirilemedi");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const updateData = {};
    if (settingsForm.name && settingsForm.name !== user?.name) updateData.name = settingsForm.name;
    if (settingsForm.email && settingsForm.email !== user?.email) updateData.email = settingsForm.email;
    
    if (Object.keys(updateData).length === 0) {
      toast.info("Değişiklik yok");
      return;
    }
    
    try {
      await axios.put(`${API}/auth/profile`, updateData, getAuthHeader());
      toast.success("Profil güncellendi. Yeniden giriş yapın.");
      logout();
      navigate("/panel/login");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Profil güncellenemedi");
    }
  };

  const openSettingsModal = () => {
    setSettingsForm({
      name: user?.name || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowSettingsModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/panel/login");
  };

  // Today's lessons
  const todayLessons = lessons.filter(l => l.date === format(new Date(), "yyyy-MM-dd"));
  const upcomingLessons = lessons
    .filter(l => new Date(l.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const tabs = [
    { id: "overview", label: "Genel Bakış", icon: BookOpen },
    { id: "students", label: "Öğrenciler", icon: Users, badge: pendingStudents.length },
    { id: "lessons", label: "Dersler", icon: CalendarIcon },
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
              <img src={LOGO_URL} alt="Logo" className="h-10" />
              <div>
                <h1 className="font-bold text-[#1A201C]">Öğretmen Paneli</h1>
                <p className="text-xs text-[#52525B]">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={openSettingsModal}
                className="border-[#1B5E3C] text-[#1B5E3C] hover:bg-[#1B5E3C] hover:text-white"
                data-testid="settings-btn"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ayarlar
              </Button>
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

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-[#1B5E3C]" />
                  <p className="text-2xl font-bold text-[#1A201C]">{students.length}</p>
                  <p className="text-sm text-[#52525B]">Toplam Öğrenci</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-[#C41E3A]" />
                  <p className="text-2xl font-bold text-[#1A201C]">{pendingStudents.length}</p>
                  <p className="text-sm text-[#52525B]">Onay Bekleyen</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-[#1B5E3C]" />
                  <p className="text-2xl font-bold text-[#1A201C]">{todayLessons.length}</p>
                  <p className="text-sm text-[#52525B]">Bugünkü Ders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-[#C41E3A]" />
                  <p className="text-2xl font-bold text-[#1A201C]">{materials.length}</p>
                  <p className="text-sm text-[#52525B]">Materyal</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Students */}
            {pendingStudents.length > 0 && (
              <Card className="border-[#C41E3A]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[#C41E3A]">
                    <AlertCircle className="h-5 w-5" />
                    Onay Bekleyen Öğrenciler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-[#FDE8EB] rounded-lg">
                        <div>
                          <p className="font-medium text-[#1A201C]">{student.name}</p>
                          <p className="text-sm text-[#52525B]">{student.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveStudent(student.id, true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleApproveStudent(student.id, false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reschedule Requests */}
            {rescheduleRequests.length > 0 && (
              <Card className="border-[#F5C518]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[#8B6914]">
                    <Clock className="h-5 w-5" />
                    Tarih Değişiklik Talepleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rescheduleRequests.map(req => (
                      <div key={req.id} className="p-3 bg-[#FFF8E6] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-[#1A201C]">{req.student_name}</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleRescheduleResponse(req.id, true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRescheduleResponse(req.id, false)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-[#52525B]">
                          {req.original_date} {req.original_time} → {req.requested_date} {req.requested_start_time}-{req.requested_end_time}
                        </p>
                        <p className="text-sm text-[#8B6914] mt-1">{req.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Lessons */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Yaklaşan Dersler</CardTitle>
                <Button size="sm" onClick={() => setShowLessonModal(true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                  <Plus className="h-4 w-4 mr-1" /> Ders Ekle
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingLessons.length === 0 ? (
                  <p className="text-[#52525B] text-center py-4">Henüz planlanmış ders yok</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingLessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#F9F9F7] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-12 rounded-full ${lesson.lesson_type === "group" ? "bg-[#C41E3A]" : "bg-[#1B5E3C]"}`} />
                          <div>
                            <p className="font-medium text-[#1A201C]">{lesson.title}</p>
                            <p className="text-sm text-[#52525B]">
                              {lesson.date} • {lesson.start_time} - {lesson.end_time}
                            </p>
                            <p className="text-xs text-[#52525B]">
                              {lesson.student_names?.join(", ") || "Öğrenci atanmadı"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.zoom_link && (
                            <a href={lesson.zoom_link} target="_blank" rel="noopener noreferrer" className="text-[#1B5E3C] hover:text-[#0D3321]">
                              <Video className="h-5 w-5" />
                            </a>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            lesson.level === "A1" || lesson.level === "B1" ? "bg-[#E8F5E9] text-[#1B5E3C]" : "bg-[#FDE8EB] text-[#C41E3A]"
                          }`}>
                            {lesson.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1A201C]">Öğrenci Yönetimi</h2>
              <Button onClick={() => setShowStudentModal(true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                <Plus className="h-4 w-4 mr-2" /> Öğrenci Ekle
              </Button>
            </div>

            {/* Pending */}
            {pendingStudents.length > 0 && (
              <Card className="border-[#C41E3A]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#C41E3A]">Onay Bekleyenler ({pendingStudents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {pendingStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-[#FDE8EB] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#C41E3A] rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A201C]">{student.name}</p>
                            <p className="text-sm text-[#52525B]">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleApproveStudent(student.id, true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                            <Check className="h-4 w-4 mr-1" /> Onayla
                          </Button>
                          <Button variant="destructive" onClick={() => handleApproveStudent(student.id, false)}>
                            <X className="h-4 w-4 mr-1" /> Reddet
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Students */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Aktif Öğrenciler ({students.filter(s => s.approved).length})</CardTitle>
              </CardHeader>
              <CardContent>
                {students.filter(s => s.approved).length === 0 ? (
                  <p className="text-[#52525B] text-center py-8">Henüz onaylanmış öğrenci yok</p>
                ) : (
                  <div className="grid gap-3">
                    {students.filter(s => s.approved).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-[#F9F9F7] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1B5E3C] rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A201C]">{student.name}</p>
                            <p className="text-sm text-[#52525B]">{student.email}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteStudent(student.id)} className="text-[#C41E3A] hover:bg-[#FDE8EB]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === "lessons" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1A201C]">Ders Takvimi</h2>
              <Button onClick={() => setShowLessonModal(true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                <Plus className="h-4 w-4 mr-2" /> Yeni Ders
              </Button>
            </div>

            {lessons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-[#E4E4E7]" />
                  <p className="text-[#52525B]">Henüz ders planlanmamış</p>
                  <Button onClick={() => setShowLessonModal(true)} className="mt-4 bg-[#1B5E3C] hover:bg-[#0D3321]">
                    İlk Dersi Ekle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.sort((a, b) => new Date(a.date) - new Date(b.date)).map(lesson => (
                  <Card key={lesson.id} className={`border-l-4 ${lesson.lesson_type === "group" ? "border-l-[#C41E3A]" : "border-l-[#1B5E3C]"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-[#1A201C]">{lesson.title}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              lesson.level === "A1" || lesson.level === "B1" ? "bg-[#E8F5E9] text-[#1B5E3C]" : "bg-[#FDE8EB] text-[#C41E3A]"
                            }`}>
                              {lesson.level}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              lesson.lesson_type === "group" ? "bg-[#FDE8EB] text-[#C41E3A]" : "bg-[#E8F5E9] text-[#1B5E3C]"
                            }`}>
                              {lesson.lesson_type === "group" ? "Grup" : "Bireysel"}
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
                          {lesson.description && (
                            <p className="text-sm text-[#52525B] mt-2">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-4 w-4 text-[#52525B]" />
                            <span className="text-sm text-[#52525B]">
                              {lesson.student_names?.join(", ") || "Öğrenci atanmadı"}
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
                            >
                              <Video className="h-5 w-5" />
                            </a>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)} className="text-[#C41E3A] hover:bg-[#FDE8EB]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1A201C]">Materyaller</h2>
              <Button onClick={() => setShowMaterialModal(true)} className="bg-[#1B5E3C] hover:bg-[#0D3321]">
                <Plus className="h-4 w-4 mr-2" /> Materyal Ekle
              </Button>
            </div>

            {materials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-[#E4E4E7]" />
                  <p className="text-[#52525B]">Henüz materyal eklenmemiş</p>
                  <Button onClick={() => setShowMaterialModal(true)} className="mt-4 bg-[#1B5E3C] hover:bg-[#0D3321]">
                    İlk Materyali Ekle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(material => (
                  <Card key={material.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${
                          material.file_type === "video" ? "bg-[#FDE8EB]" : 
                          material.file_type === "audio" ? "bg-[#FFF8E6]" : "bg-[#E8F5E9]"
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            material.file_type === "video" ? "text-[#C41E3A]" : 
                            material.file_type === "audio" ? "text-[#8B6914]" : "text-[#1B5E3C]"
                          }`} />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMaterial(material.id)} className="text-[#C41E3A] hover:bg-[#FDE8EB]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="font-bold text-[#1A201C] mb-1">{material.title}</h3>
                      {material.description && (
                        <p className="text-sm text-[#52525B] mb-3">{material.description}</p>
                      )}
                      <a 
                        href={material.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#1B5E3C] hover:underline"
                      >
                        Aç <ChevronRight className="h-4 w-4" />
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
              <h2 className="text-xl font-bold text-[#1A201C]">Bildirimler</h2>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllRead}>
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
                          notif.type === "reschedule" ? "bg-[#FFF8E6]" : "bg-[#F9F9F7]"
                        }`}>
                          <Bell className={`h-5 w-5 ${
                            notif.type === "warning" ? "text-[#C41E3A]" :
                            notif.type === "success" ? "text-[#1B5E3C]" :
                            notif.type === "reschedule" ? "text-[#8B6914]" : "text-[#52525B]"
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

      {/* Create Lesson Modal */}
      <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ders Oluştur</DialogTitle>
            <DialogDescription>Ders bilgilerini girin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4">
            <div>
              <Label>Ders Başlığı</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                placeholder="Bulgarca A1 - Ders 1"
                required
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                placeholder="Ders içeriği..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seviye</Label>
                <Select value={lessonForm.level} onValueChange={(v) => setLessonForm({...lessonForm, level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ders Tipi</Label>
                <Select value={lessonForm.lesson_type} onValueChange={(v) => setLessonForm({...lessonForm, lesson_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Bireysel</SelectItem>
                    <SelectItem value="group">Grup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(lessonForm.date, "PPP", { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={lessonForm.date}
                    onSelect={(date) => date && setLessonForm({...lessonForm, date})}
                    locale={tr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç</Label>
                <Input
                  type="time"
                  value={lessonForm.start_time}
                  onChange={(e) => setLessonForm({...lessonForm, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label>Bitiş</Label>
                <Input
                  type="time"
                  value={lessonForm.end_time}
                  onChange={(e) => setLessonForm({...lessonForm, end_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Öğrenciler</Label>
              <Select 
                value={lessonForm.student_ids[0] || ""} 
                onValueChange={(v) => setLessonForm({...lessonForm, student_ids: v ? [v] : []})}
              >
                <SelectTrigger><SelectValue placeholder="Öğrenci seçin" /></SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.approved).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zoom/Toplantı Linki</Label>
              <Input
                value={lessonForm.zoom_link}
                onChange={(e) => setLessonForm({...lessonForm, zoom_link: e.target.value})}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLessonModal(false)}>İptal</Button>
              <Button type="submit" className="bg-[#1B5E3C] hover:bg-[#0D3321]">Oluştur</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Material Modal */}
      <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Materyal Ekle</DialogTitle>
            <DialogDescription>Drive veya Dropbox linki ekleyin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMaterial} className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Input
                value={materialForm.title}
                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                placeholder="A1 Ders Notları"
                required
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={materialForm.description}
                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                placeholder="Materyal hakkında..."
              />
            </div>
            <div>
              <Label>Link (Drive/Dropbox)</Label>
              <Input
                value={materialForm.link}
                onChange={(e) => setMaterialForm({...materialForm, link: e.target.value})}
                placeholder="https://drive.google.com/..."
                required
              />
            </div>
            <div>
              <Label>Tür</Label>
              <Select value={materialForm.file_type} onValueChange={(v) => setMaterialForm({...materialForm, file_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Doküman</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Ses</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMaterialModal(false)}>İptal</Button>
              <Button type="submit" className="bg-[#1B5E3C] hover:bg-[#0D3321]">Ekle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Öğrenci Ekle</DialogTitle>
            <DialogDescription>Manuel olarak öğrenci hesabı oluşturun</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <Label>Ad Soyad</Label>
              <Input
                value={studentForm.name}
                onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                placeholder="Ahmet Yılmaz"
                required
              />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                placeholder="ahmet@email.com"
                required
              />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input
                type="text"
                value={studentForm.password}
                onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                placeholder="En az 6 karakter"
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowStudentModal(false)}>İptal</Button>
              <Button type="submit" className="bg-[#1B5E3C] hover:bg-[#0D3321]">Ekle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Hesap Ayarları
            </DialogTitle>
            <DialogDescription>Profil ve şifre ayarlarınızı yönetin</DialogDescription>
          </DialogHeader>
          
          {/* Profile Update */}
          <form onSubmit={handleUpdateProfile} className="space-y-4 border-b pb-6">
            <h3 className="font-semibold text-[#1A201C] flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil Bilgileri
            </h3>
            <div>
              <Label>Ad Soyad</Label>
              <Input
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                placeholder="Ad Soyad"
              />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                placeholder="E-posta"
              />
            </div>
            <Button type="submit" className="bg-[#1B5E3C] hover:bg-[#0D3321]">
              Profili Güncelle
            </Button>
          </form>

          {/* Password Change */}
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
            <h3 className="font-semibold text-[#1A201C] flex items-center gap-2">
              <Key className="h-4 w-4" />
              Şifre Değiştir
            </h3>
            <div>
              <Label>Mevcut Şifre</Label>
              <Input
                type="password"
                value={settingsForm.currentPassword}
                onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                placeholder="Mevcut şifreniz"
                required
              />
            </div>
            <div>
              <Label>Yeni Şifre</Label>
              <Input
                type="password"
                value={settingsForm.newPassword}
                onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                placeholder="En az 6 karakter"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>Yeni Şifre (Tekrar)</Label>
              <Input
                type="password"
                value={settingsForm.confirmPassword}
                onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                placeholder="Yeni şifreyi tekrar girin"
                required
              />
            </div>
            <Button type="submit" className="bg-[#C41E3A] hover:bg-[#A01830]">
              Şifreyi Değiştir
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
