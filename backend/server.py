from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'bulgarcakolayca-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_teacher(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user

async def require_approved_student(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "teacher":
        return current_user
    if current_user.get("role") == "student" and current_user.get("approved"):
        return current_user
    raise HTTPException(status_code=403, detail="Approved student or teacher access required")

# ==================== USER MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    approved: bool
    created_at: str

class StudentApprove(BaseModel):
    student_id: str
    approved: bool

class StudentCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2, max_length=100)

# ==================== LESSON MODELS ====================

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    lesson_type: str = "individual"  # individual or group
    student_ids: List[str] = []  # for individual or group assignment
    max_students: Optional[int] = 1  # for group lessons
    recurring: bool = False
    recurring_weeks: Optional[int] = 0
    zoom_link: Optional[str] = ""  # Zoom/meeting link
    level: Optional[str] = "A1"  # A1, A2, B1, B2

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    student_ids: Optional[List[str]] = None
    status: Optional[str] = None
    zoom_link: Optional[str] = None
    level: Optional[str] = None

class RescheduleRequest(BaseModel):
    lesson_id: str
    requested_date: str
    requested_start_time: str
    requested_end_time: str
    reason: str

class RescheduleResponse(BaseModel):
    request_id: str
    approved: bool
    message: Optional[str] = ""

# ==================== MATERIAL MODELS ====================

class MaterialCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    link: str
    file_type: str = "document"  # document, video, audio, other
    visible_to: List[str] = []  # student IDs, empty = all students

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    visible_to: Optional[List[str]] = None

# ==================== NOTIFICATION MODELS ====================

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, warning, success, lesson, reschedule

# Status Check Models
class StatusCheckCreate(BaseModel):
    client_name: str

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Contact Form Models
class ContactFormCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=2000)
    language: str = Field(default="tr")

class ContactForm(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    message: str
    language: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default="new")

# Level Test Models
class QuizAnswer(BaseModel):
    question_id: int
    selected_option: int

class LevelTestSubmit(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    language_learning: str  # "bulgarian" or "turkish"
    answers: List[QuizAnswer]

class LevelTestResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    language_learning: str
    score: int
    total_questions: int
    percentage: float
    recommended_level: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Quiz Questions Data - Updated from official test document with ALL levels
QUIZ_QUESTIONS_BY_LEVEL = {
    "bulgarian": {
        "A1": [
            {
                "id": 1,
                "question": "Как се казваш?",
                "options": ["Добър ден.", "Приятно ми е.", "Казвам се Али.", "Да."],
                "correct": 2,
                "translation": {"tr": "Adın ne?", "en": "What is your name?"}
            },
            {
                "id": 2,
                "question": "Ти … от Турция.",
                "options": ["си", "е", "сте", "съм"],
                "correct": 0,
                "translation": {"tr": "Sen Türkiye'densin. (Boşluğu doldurun)", "en": "You are from Turkey."}
            },
            {
                "id": 3,
                "question": "Избери правилното изречение.",
                "options": ["Тя е лекар.", "Тя си лекарка.", "Тя е лекарка.", "Тя сте лекар."],
                "correct": 2,
                "translation": {"tr": "Doğru cümleyi seçin.", "en": "Choose the correct sentence."}
            },
            {
                "id": 4,
                "question": "На колко години си?",
                "options": ["На 26 години съм.", "От 26 години си.", "В 26 години сте.", "На 26 година съм."],
                "correct": 0,
                "translation": {"tr": "Kaç yaşındasın?", "en": "How old are you?"}
            },
            {
                "id": 5,
                "question": "Къде живееш? - Живея … Бургас.",
                "options": ["от", "на", "за", "в"],
                "correct": 3,
                "translation": {"tr": "Nerede yaşıyorsun?", "en": "Where do you live?"}
            },
            {
                "id": 6,
                "question": "Колко е часът?",
                "options": ["Два.", "Семейство.", "Да.", "Хляб."],
                "correct": 0,
                "translation": {"tr": "Saat kaç?", "en": "What time is it?"}
            },
        ],
        "A2": [
            {
                "id": 7,
                "question": "Вчера … на работа.",
                "options": ["бях", "ще бъда", "няма да бъда", "бъди"],
                "correct": 0,
                "translation": {"tr": "Dün işteydim.", "en": "Yesterday I was at work."}
            },
            {
                "id": 8,
                "question": "Сега … книга.",
                "options": ["изчетох", "чета", "чел", "четял"],
                "correct": 1,
                "translation": {"tr": "Şimdi kitap okuyorum.", "en": "Now I'm reading a book."}
            },
            {
                "id": 9,
                "question": "____ седмицата работя ____ сутрин ____ вечер.",
                "options": ["През, от, до", "След, около, преди", "През, на, в", "На, от, до"],
                "correct": 0,
                "translation": {"tr": "Hafta boyunca sabahtan akşama çalışıyorum.", "en": "During the week I work from morning to evening."}
            },
            {
                "id": 10,
                "question": "Коя дума е прилагателно име?",
                "options": ["къща", "ученик", "голям", "стол"],
                "correct": 2,
                "translation": {"tr": "Hangi kelime sıfattır?", "en": "Which word is an adjective?"}
            },
            {
                "id": 11,
                "question": "Не … да пиша сега.",
                "options": ["правя", "мога", "нямам", "готвя"],
                "correct": 1,
                "translation": {"tr": "Şimdi yazamıyorum.", "en": "I can't write now."}
            },
            {
                "id": 12,
                "question": "… да спираме на знак 'СТОП'.",
                "options": ["Мога", "Искам", "Трябва", "Обичам"],
                "correct": 2,
                "translation": {"tr": "STOP işaretinde durmalıyız.", "en": "We must stop at the STOP sign."}
            },
        ],
        "B1": [
            {
                "id": 13,
                "question": "Познавам я … пет години.",
                "options": ["от", "за", "при", "със"],
                "correct": 0,
                "translation": {"tr": "Onu beş yıldır tanıyorum.", "en": "I've known her for five years."}
            },
            {
                "id": 14,
                "question": "Не съм свикнал … ставам толкова рано.",
                "options": ["на", "от", "за", "да"],
                "correct": 3,
                "translation": {"tr": "Bu kadar erken kalkmaya alışık değilim.", "en": "I'm not used to getting up so early."}
            },
            {
                "id": 15,
                "question": "Книгата беше толкова … , че заспах.",
                "options": ["скучна", "скучен", "скучни", "скучая"],
                "correct": 0,
                "translation": {"tr": "Kitap o kadar sıkıcıydı ki uyudum.", "en": "The book was so boring that I fell asleep."}
            },
            {
                "id": 16,
                "question": "– Мария сготви ли за обяд? – Не, още не е ...",
                "options": ["готвя", "сготвила", "сготвил", "готви"],
                "correct": 1,
                "translation": {"tr": "Maria öğle yemeği pişirdi mi? - Hayır, henüz pişirmedi.", "en": "Did Maria cook for lunch? - No, she hasn't cooked yet."}
            },
            {
                "id": 17,
                "question": "– Можеш ли да се обадиш на Йордан? – Да, мога да … се обадя.",
                "options": ["му", "я", "ѝ", "им"],
                "correct": 0,
                "translation": {"tr": "Yordan'ı arayabilir misin? - Evet, onu arayabilirim.", "en": "Can you call Yordan? - Yes, I can call him."}
            },
        ],
        "B2": [
            {
                "id": 18,
                "question": "Ако … повече време, бих научил друг език.",
                "options": ["имам", "имах", "да имам", "ще имам"],
                "correct": 1,
                "translation": {"tr": "Daha fazla zamanım olsaydı, başka bir dil öğrenirdim.", "en": "If I had more time, I would learn another language."}
            },
            {
                "id": 19,
                "question": "Ще отидем на море през септември, … тогава не е много горещо.",
                "options": ["защото", "ако", "но", "дори"],
                "correct": 0,
                "translation": {"tr": "Eylül'de denize gideceğiz çünkü o zaman çok sıcak değil.", "en": "We'll go to the sea in September because it's not very hot then."}
            },
            {
                "id": 20,
                "question": "Той отрече … чашата.",
                "options": ["че е счупил", "счупи", "да счупи", "счупване"],
                "correct": 0,
                "translation": {"tr": "Bardağı kırdığını reddetti.", "en": "He denied breaking the glass."}
            },
            {
                "id": 21,
                "question": "Щом като … новината, започна да танцува.",
                "options": ["чува", "чуеше", "чу", "ще чуе"],
                "correct": 2,
                "translation": {"tr": "Haberi duyar duymaz dans etmeye başladı.", "en": "As soon as he heard the news, he started dancing."}
            },
            {
                "id": 22,
                "question": "Ако … говорил български, щях да имам много приятели.",
                "options": ["беше", "бяхме", "бяха", "бях"],
                "correct": 3,
                "translation": {"tr": "Bulgarca konuşsaydım, çok arkadaşım olurdu.", "en": "If I had spoken Bulgarian, I would have had many friends."}
            },
        ],
        "C1": [
            {
                "id": 23,
                "question": 'Извинете, господине, ... ли ми казали къде е метростанция "Сердика"?',
                "options": ["бихте", "беше", "бях", "ще"],
                "correct": 0,
                "translation": {"tr": "Affedersiniz bayım, Serdika metro istasyonunun nerede olduğunu söyler misiniz?", "en": "Excuse me sir, could you tell me where Serdika metro station is?"}
            },
            {
                "id": 24,
                "question": "Новата политика се очаква да има сериозни … върху образованието.",
                "options": ["влияние", "влия", "последици", "ефективен"],
                "correct": 2,
                "translation": {"tr": "Yeni politikanın eğitim üzerinde ciddi sonuçları olması bekleniyor.", "en": "The new policy is expected to have serious consequences on education."}
            },
            {
                "id": 25,
                "question": "Щом като … срещата, разбра грешката си.",
                "options": ["напусна", "напуска", "ще напусне", "беше напуснала"],
                "correct": 0,
                "translation": {"tr": "Toplantıdan ayrılır ayrılmaz hatasını anladı.", "en": "As soon as he left the meeting, he understood his mistake."}
            },
            {
                "id": 26,
                "question": "Директорката изиска всички доклади … до сряда.",
                "options": ["бяха предадени", "да бъдат предадени", "се предава", "да предаваш"],
                "correct": 1,
                "translation": {"tr": "Müdür tüm raporların Çarşamba gününe kadar teslim edilmesini istedi.", "en": "The director demanded all reports to be submitted by Wednesday."}
            },
            {
                "id": 27,
                "question": "Той говореше по толкова … начин, че никой не посмя да му възрази.",
                "options": ["високомерен", "мил", "несъществен", "щедър"],
                "correct": 0,
                "translation": {"tr": "O kadar kibirli bir şekilde konuştu ki kimse ona itiraz etmeye cesaret edemedi.", "en": "He spoke in such an arrogant way that no one dared to object."}
            },
        ],
    },
    "turkish": {
        "A1": [
            {
                "id": 1,
                "question": "'Merhaba' nasıl yazılır Kiril alfabesiyle?",
                "options": ["Здравей", "Добър ден", "Благодаря", "Довиждане"],
                "correct": 0,
                "translation": {"bg": "Как се пише 'Merhaba' на кирилица?", "en": "How is 'Merhaba' written in Cyrillic?"}
            },
            {
                "id": 2,
                "question": "'Teşekkür ederim' ne anlama gelir?",
                "options": ["Lütfen", "Özür dilerim", "Thank you", "Goodbye"],
                "correct": 2,
                "translation": {"bg": "Какво означава 'Teşekkür ederim'?", "en": "What does 'Teşekkür ederim' mean?"}
            },
            {
                "id": 3,
                "question": "'Nasılsınız?' sorusunun cevabı hangisidir?",
                "options": ["İyiyim, teşekkürler", "Adım Ali", "Türkiye'denim", "Memnun oldum"],
                "correct": 0,
                "translation": {"bg": "Кой е отговорът на 'Nasılsınız?'?", "en": "What is the answer to 'Nasılsınız?'?"}
            },
            {
                "id": 4,
                "question": "'Bir, iki, üç' sayıları kaçtır?",
                "options": ["4, 5, 6", "1, 2, 3", "7, 8, 9", "10, 11, 12"],
                "correct": 1,
                "translation": {"bg": "Кои числа са 'Bir, iki, üç'?", "en": "What numbers are 'Bir, iki, üç'?"}
            },
            {
                "id": 5,
                "question": "'Günaydın' ne zaman kullanılır?",
                "options": ["Akşam", "Gece", "Sabah", "Öğlen"],
                "correct": 2,
                "translation": {"bg": "Кога се използва 'Günaydın'?", "en": "When is 'Günaydın' used?"}
            },
        ],
        "A2": [
            {
                "id": 6,
                "question": "Türkçe'de 'Hayır' nasıl söylenir?",
                "options": ["Evet", "Hayır", "Belki", "Tamam"],
                "correct": 1,
                "translation": {"bg": "Как се казва 'Не' на турски?", "en": "How do you say 'No' in Turkish?"}
            },
            {
                "id": 7,
                "question": "'Pazartesi' hangi gündür?",
                "options": ["Monday", "Tuesday", "Wednesday", "Thursday"],
                "correct": 0,
                "translation": {"bg": "Кой ден е 'Pazartesi'?", "en": "What day is 'Pazartesi'?"}
            },
            {
                "id": 8,
                "question": "'Hoşça kalın' ne anlama gelir?",
                "options": ["Hello", "Thank you", "Goodbye", "Please"],
                "correct": 2,
                "translation": {"bg": "Какво означава 'Hoşça kalın'?", "en": "What does 'Hoşça kalın' mean?"}
            },
            {
                "id": 9,
                "question": "'Ben Türkiye'den geliyorum' cümlesinde fiil hangisi?",
                "options": ["Ben", "Türkiye'den", "geliyorum", "den"],
                "correct": 2,
                "translation": {"bg": "Кой е глаголът в 'Ben Türkiye'den geliyorum'?", "en": "What is the verb in 'I come from Turkey'?"}
            },
            {
                "id": 10,
                "question": "'Saat kaç?' sorusuna doğru cevap hangisi?",
                "options": ["Saat beş.", "İyiyim.", "Evet.", "Merhaba."],
                "correct": 0,
                "translation": {"bg": "Кой е правилният отговор на 'Saat kaç?'?", "en": "What is the correct answer to 'What time is it?'?"}
            },
        ],
        "B1": [
            {
                "id": 11,
                "question": "'Yarın hava nasıl olacak?' sorusunda zaman hangisi?",
                "options": ["Geçmiş", "Şimdiki", "Gelecek", "Geniş"],
                "correct": 2,
                "translation": {"bg": "Какво време е във въпроса?", "en": "What tense is in the question?"}
            },
            {
                "id": 12,
                "question": "'Okula gidiyordum' cümlesindeki zaman hangisi?",
                "options": ["Şimdiki zaman", "Geçmiş sürekli", "Gelecek zaman", "Geniş zaman"],
                "correct": 1,
                "translation": {"bg": "Какво време е в изречението?", "en": "What tense is in the sentence?"}
            },
            {
                "id": 13,
                "question": "'Eğer param olsaydı, araba alırdım' cümlesi ne ifade eder?",
                "options": ["Kesinlik", "Koşul", "Emir", "Rica"],
                "correct": 1,
                "translation": {"bg": "Какво изразява изречението?", "en": "What does the sentence express?"}
            },
            {
                "id": 14,
                "question": "'ile' edatı hangi anlama gelir?",
                "options": ["with", "from", "to", "for"],
                "correct": 0,
                "translation": {"bg": "Какво означава 'ile'?", "en": "What does 'ile' mean?"}
            },
            {
                "id": 15,
                "question": "'-mış' eki neyi ifade eder?",
                "options": ["Kesinlik", "Duyulan geçmiş", "Gelecek", "Emir"],
                "correct": 1,
                "translation": {"bg": "Какво изразява наставката '-mış'?", "en": "What does the suffix '-mış' express?"}
            },
        ],
        "B2": [
            {
                "id": 16,
                "question": "'Kitap okumayı seviyorum' cümlesindeki isim-fiil hangisi?",
                "options": ["kitap", "okumayı", "seviyorum", "okuma"],
                "correct": 1,
                "translation": {"bg": "Кое е отглаголното съществително?", "en": "Which is the verbal noun?"}
            },
            {
                "id": 17,
                "question": "'Görüşmek üzere' ne zaman kullanılır?",
                "options": ["Tanışırken", "Vedalaşırken", "Teşekkür ederken", "Özür dilerken"],
                "correct": 1,
                "translation": {"bg": "Кога се използва 'Görüşmek üzere'?", "en": "When is 'Görüşmek üzere' used?"}
            },
            {
                "id": 18,
                "question": "'Sanki yağmur yağacakmış gibi görünüyor' cümlesinde ne ifade ediliyor?",
                "options": ["Kesinlik", "Tahmin/olasılık", "Emir", "Rica"],
                "correct": 1,
                "translation": {"bg": "Какво се изразява в изречението?", "en": "What is expressed in the sentence?"}
            },
            {
                "id": 19,
                "question": "'Hem ... hem de ...' bağlacı neyi ifade eder?",
                "options": ["Zıtlık", "Neden-sonuç", "Hem birini hem diğerini", "Ya birini ya diğerini"],
                "correct": 2,
                "translation": {"bg": "Какво изразява съюзът?", "en": "What does the conjunction express?"}
            },
            {
                "id": 20,
                "question": "Türkçe'de edilgen çatı nasıl yapılır?",
                "options": ["-yor eki ile", "-ecek eki ile", "-il/-in/-ül/-un eki ile", "-miş eki ile"],
                "correct": 2,
                "translation": {"bg": "Как се образува страдателен залог на турски?", "en": "How is passive voice formed in Turkish?"}
            },
        ],
        "C1": [
            {
                "id": 21,
                "question": "'Her ne kadar ... -se de' yapısı neyi ifade eder?",
                "options": ["Neden-sonuç", "Zıtlık/taviz", "Koşul", "Amaç"],
                "correct": 1,
                "translation": {"bg": "Какво изразява конструкцията?", "en": "What does the structure express?"}
            },
            {
                "id": 22,
                "question": "'Önermek' kelimesinin eş anlamlısı hangisi?",
                "options": ["Reddetmek", "Teklif etmek", "İstemek", "Almak"],
                "correct": 1,
                "translation": {"bg": "Кой е синонимът на 'önermek'?", "en": "What is the synonym of 'önermek'?"}
            },
            {
                "id": 23,
                "question": "'Deyim' ne demektir?",
                "options": ["Tek kelime", "Mecazi anlam taşıyan kalıp ifade", "Fiil", "İsim"],
                "correct": 1,
                "translation": {"bg": "Какво означава 'deyim'?", "en": "What does 'deyim' mean?"}
            },
            {
                "id": 24,
                "question": "'Göz yummak' deyimi ne anlama gelir?",
                "options": ["Görmemek", "Hoşgörmek/tolerans göstermek", "Uyumak", "Bakmak"],
                "correct": 1,
                "translation": {"bg": "Какво означава идиомът 'göz yummak'?", "en": "What does the idiom 'göz yummak' mean?"}
            },
            {
                "id": 25,
                "question": "'-DIkçA' eki hangi anlama gelir?",
                "options": ["Her zaman", "Asla", "... yaptıkça/oldukça", "Önce"],
                "correct": 2,
                "translation": {"bg": "Какво означава наставката '-DIkçA'?", "en": "What does the suffix '-DIkçA' mean?"}
            },
        ],
    }
}

# Level order for adaptive test
LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"]
PASS_THRESHOLD = 0.67  # Need 67% (4/6 or 3/5) to advance to next level

# Flashcards Data - Kelime Kartları
FLASHCARDS = {
    "bulgarian": [
        {"id": 1, "word": "Здравей", "translation": "Merhaba", "pronunciation": "Zdra-vey", "category": "Selamlaşma"},
        {"id": 2, "word": "Благодаря", "translation": "Teşekkür ederim", "pronunciation": "Bla-go-da-rya", "category": "Günlük"},
        {"id": 3, "word": "Да", "translation": "Evet", "pronunciation": "Da", "category": "Temel"},
        {"id": 4, "word": "Не", "translation": "Hayır", "pronunciation": "Ne", "category": "Temel"},
        {"id": 5, "word": "Моля", "translation": "Lütfen / Rica ederim", "pronunciation": "Mo-lya", "category": "Günlük"},
        {"id": 6, "word": "Добро утро", "translation": "Günaydın", "pronunciation": "Dob-ro ut-ro", "category": "Selamlaşma"},
        {"id": 7, "word": "Лека нощ", "translation": "İyi geceler", "pronunciation": "Le-ka nosht", "category": "Selamlaşma"},
        {"id": 8, "word": "Как се казваш?", "translation": "Adın ne?", "pronunciation": "Kak se kaz-vash", "category": "Tanışma"},
        {"id": 9, "word": "Аз съм", "translation": "Ben ...-im", "pronunciation": "Az sam", "category": "Temel"},
        {"id": 10, "word": "Довиждане", "translation": "Hoşça kal", "pronunciation": "Do-vizh-da-ne", "category": "Selamlaşma"},
        {"id": 11, "word": "Извинете", "translation": "Özür dilerim", "pronunciation": "Iz-vi-ne-te", "category": "Günlük"},
        {"id": 12, "word": "Колко струва?", "translation": "Ne kadar?", "pronunciation": "Kol-ko stru-va", "category": "Alışveriş"},
        {"id": 13, "word": "Един", "translation": "Bir", "pronunciation": "E-din", "category": "Sayılar"},
        {"id": 14, "word": "Два", "translation": "İki", "pronunciation": "Dva", "category": "Sayılar"},
        {"id": 15, "word": "Три", "translation": "Üç", "pronunciation": "Tri", "category": "Sayılar"},
        {"id": 16, "word": "Вода", "translation": "Su", "pronunciation": "Vo-da", "category": "Yiyecek"},
        {"id": 17, "word": "Хляб", "translation": "Ekmek", "pronunciation": "Hlyab", "category": "Yiyecek"},
        {"id": 18, "word": "Къде е...?", "translation": "... nerede?", "pronunciation": "Ka-de e", "category": "Yön"},
        {"id": 19, "word": "Обичам те", "translation": "Seni seviyorum", "pronunciation": "O-bi-cham te", "category": "Duygular"},
        {"id": 20, "word": "Приятно ми е", "translation": "Memnun oldum", "pronunciation": "Pri-yat-no mi e", "category": "Tanışma"},
    ],
    "turkish": [
        {"id": 1, "word": "Merhaba", "translation": "Здравей", "pronunciation": "Mer-ha-ba", "category": "Selamlaşma"},
        {"id": 2, "word": "Teşekkürler", "translation": "Благодаря", "pronunciation": "Te-shek-kür-ler", "category": "Günlük"},
        {"id": 3, "word": "Evet", "translation": "Да", "pronunciation": "E-vet", "category": "Temel"},
        {"id": 4, "word": "Hayır", "translation": "Не", "pronunciation": "Ha-yır", "category": "Temel"},
        {"id": 5, "word": "Lütfen", "translation": "Моля", "pronunciation": "Lüt-fen", "category": "Günlük"},
        {"id": 6, "word": "Günaydın", "translation": "Добро утро", "pronunciation": "Gü-nay-dın", "category": "Selamlaşma"},
        {"id": 7, "word": "İyi geceler", "translation": "Лека нощ", "pronunciation": "İ-yi ge-ce-ler", "category": "Selamlaşma"},
        {"id": 8, "word": "Adınız ne?", "translation": "Как се казвате?", "pronunciation": "A-dı-nız ne", "category": "Tanışma"},
        {"id": 9, "word": "Ben", "translation": "Аз", "pronunciation": "Ben", "category": "Temel"},
        {"id": 10, "word": "Hoşça kal", "translation": "Довиждане", "pronunciation": "Hosh-cha kal", "category": "Selamlaşma"},
        {"id": 11, "word": "Özür dilerim", "translation": "Извинете", "pronunciation": "Ö-zür di-le-rim", "category": "Günlük"},
        {"id": 12, "word": "Ne kadar?", "translation": "Колко струва?", "pronunciation": "Ne ka-dar", "category": "Alışveriş"},
        {"id": 13, "word": "Bir", "translation": "Един", "pronunciation": "Bir", "category": "Sayılar"},
        {"id": 14, "word": "İki", "translation": "Два", "pronunciation": "İ-ki", "category": "Sayılar"},
        {"id": 15, "word": "Üç", "translation": "Три", "pronunciation": "Üch", "category": "Sayılar"},
        {"id": 16, "word": "Su", "translation": "Вода", "pronunciation": "Su", "category": "Yiyecek"},
        {"id": 17, "word": "Ekmek", "translation": "Хляб", "pronunciation": "Ek-mek", "category": "Yiyecek"},
        {"id": 18, "word": "Nerede?", "translation": "Къде?", "pronunciation": "Ne-re-de", "category": "Yön"},
        {"id": 19, "word": "Seni seviyorum", "translation": "Обичам те", "pronunciation": "Se-ni se-vi-yo-rum", "category": "Duygular"},
        {"id": 20, "word": "Memnun oldum", "translation": "Приятно ми е", "pronunciation": "Mem-nun ol-dum", "category": "Tanışma"},
    ]
}

# Flashcard Endpoints
@api_router.get("/flashcards/{language}")
async def get_flashcards(language: str, category: Optional[str] = None):
    if language not in FLASHCARDS:
        raise HTTPException(status_code=404, detail="Language not found")
    
    cards = FLASHCARDS[language]
    if category:
        cards = [c for c in cards if c["category"].lower() == category.lower()]
    
    return {"language": language, "cards": cards, "total": len(cards)}

# Routes
@api_router.get("/")
async def root():
    return {"message": "BulgarcaKolayca API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Contact Form Endpoints
@api_router.post("/contact", response_model=ContactForm)
async def submit_contact_form(form_data: ContactFormCreate):
    contact_obj = ContactForm(
        name=form_data.name,
        email=form_data.email,
        message=form_data.message,
        language=form_data.language
    )
    doc = contact_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_forms.insert_one(doc)
    return contact_obj

@api_router.get("/contact", response_model=List[ContactForm])
async def get_contact_forms():
    forms = await db.contact_forms.find({}, {"_id": 0}).to_list(1000)
    for form in forms:
        if isinstance(form['created_at'], str):
            form['created_at'] = datetime.fromisoformat(form['created_at'])
    return forms

# New Models for Adaptive Quiz
class AdaptiveLevelTestSubmit(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    language_learning: str  # "bulgarian" or "turkish"
    level_answers: dict  # {"A1": [answers], "A2": [answers], ...}

class LevelScore(BaseModel):
    level: str
    correct: int
    total: int
    percentage: float
    passed: bool

class AdaptiveLevelTestResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    language_learning: str
    level_scores: List[dict]  # Score breakdown per level
    highest_passed_level: str
    recommended_level: str
    total_score: int
    total_questions: int
    overall_percentage: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Level Test Endpoints - Adaptive System
@api_router.get("/quiz/questions/{language}/{level}")
async def get_quiz_questions_by_level(language: str, level: str):
    """Get questions for a specific level"""
    if language not in QUIZ_QUESTIONS_BY_LEVEL:
        raise HTTPException(status_code=404, detail="Language not found")
    if level not in QUIZ_QUESTIONS_BY_LEVEL[language]:
        raise HTTPException(status_code=404, detail="Level not found")
    
    questions = []
    for q in QUIZ_QUESTIONS_BY_LEVEL[language][level]:
        questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "translation": q.get("translation", {})
        })
    return {"language": language, "level": level, "questions": questions}

@api_router.get("/quiz/all-questions/{language}")
async def get_all_quiz_questions(language: str):
    """Get all questions for all levels - for adaptive test"""
    if language not in QUIZ_QUESTIONS_BY_LEVEL:
        raise HTTPException(status_code=404, detail="Language not found")
    
    all_questions = {}
    for level in LEVEL_ORDER:
        if level in QUIZ_QUESTIONS_BY_LEVEL[language]:
            questions = []
            for q in QUIZ_QUESTIONS_BY_LEVEL[language][level]:
                questions.append({
                    "id": q["id"],
                    "question": q["question"],
                    "options": q["options"],
                    "correct": q["correct"]  # Include correct answer for client-side 3-wrong check
                })
            all_questions[level] = questions
    
    return {"language": language, "levels": LEVEL_ORDER, "questions": all_questions}

@api_router.post("/quiz/submit-adaptive")
async def submit_adaptive_level_test(submission: AdaptiveLevelTestSubmit):
    """Submit adaptive level test and get detailed results"""
    if submission.language_learning not in QUIZ_QUESTIONS_BY_LEVEL:
        raise HTTPException(status_code=404, detail="Language not found")
    
    level_scores = []
    total_score = 0
    total_questions = 0
    highest_passed_level = None
    
    for level in LEVEL_ORDER:
        if level not in QUIZ_QUESTIONS_BY_LEVEL[submission.language_learning]:
            continue
        if level not in submission.level_answers:
            continue
            
        questions = QUIZ_QUESTIONS_BY_LEVEL[submission.language_learning][level]
        answers = submission.level_answers[level]
        
        correct = 0
        for ans in answers:
            q_id = ans.get("question_id")
            selected = ans.get("selected_option")
            question = next((q for q in questions if q["id"] == q_id), None)
            if question and selected == question["correct"]:
                correct += 1
        
        level_total = len(questions)
        percentage = (correct / level_total * 100) if level_total > 0 else 0
        passed = percentage >= (PASS_THRESHOLD * 100)
        
        level_scores.append({
            "level": level,
            "correct": correct,
            "total": level_total,
            "percentage": round(percentage, 1),
            "passed": passed
        })
        
        total_score += correct
        total_questions += level_total
        
        if passed:
            highest_passed_level = level
    
    # Determine recommended level
    if highest_passed_level:
        level_index = LEVEL_ORDER.index(highest_passed_level)
        if level_index + 1 < len(LEVEL_ORDER):
            recommended_level = LEVEL_ORDER[level_index + 1]
        else:
            recommended_level = highest_passed_level + "+"
    else:
        recommended_level = "A1"
    
    overall_percentage = (total_score / total_questions * 100) if total_questions > 0 else 0
    
    result = {
        "id": str(uuid.uuid4()),
        "name": submission.name,
        "email": submission.email,
        "language_learning": submission.language_learning,
        "level_scores": level_scores,
        "highest_passed_level": highest_passed_level or "Yok",
        "recommended_level": recommended_level,
        "total_score": total_score,
        "total_questions": total_questions,
        "overall_percentage": round(overall_percentage, 1),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Save to database (don't return the modified dict with _id)
    db_doc = result.copy()
    await db.level_tests.insert_one(db_doc)
    
    return result

# Legacy endpoint for backward compatibility
@api_router.get("/quiz/questions/{language}")
async def get_quiz_questions(language: str):
    if language not in QUIZ_QUESTIONS_BY_LEVEL:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Return A1 questions for legacy endpoint
    questions = []
    for q in QUIZ_QUESTIONS_BY_LEVEL[language].get("A1", []):
        questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "translation": q.get("translation", {})
        })
    return {"language": language, "questions": questions}

@api_router.get("/quiz/results")
async def get_level_test_results():
    results = await db.level_tests.find({}, {"_id": 0}).to_list(1000)
    return results

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register_student(user: UserCreate):
    """Register a new student (requires approval)"""
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": "student",
        "approved": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create notification for teacher
    teacher = await db.users.find_one({"role": "teacher"})
    if teacher:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": teacher["id"],
            "title": "Yeni Öğrenci Kaydı",
            "message": f"{user.name} ({user.email}) kayıt oldu ve onay bekliyor.",
            "type": "info",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    return {"message": "Registration successful. Waiting for teacher approval.", "user_id": user_doc["id"]}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login for both teachers and students"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["role"] == "student" and not user.get("approved"):
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "approved": current_user.get("approved", True)
    }

# ==================== TEACHER: STUDENT MANAGEMENT ====================

@api_router.get("/teacher/students")
async def get_students(current_user: dict = Depends(require_teacher)):
    """Get all students"""
    students = await db.users.find({"role": "student"}, {"_id": 0, "password": 0}).to_list(1000)
    return students

@api_router.get("/teacher/pending-students")
async def get_pending_students(current_user: dict = Depends(require_teacher)):
    """Get students waiting for approval"""
    students = await db.users.find({"role": "student", "approved": False}, {"_id": 0, "password": 0}).to_list(1000)
    return students

@api_router.post("/teacher/approve-student")
async def approve_student(data: StudentApprove, current_user: dict = Depends(require_teacher)):
    """Approve or reject a student"""
    result = await db.users.update_one(
        {"id": data.student_id, "role": "student"},
        {"$set": {"approved": data.approved}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Notify student
    student = await db.users.find_one({"id": data.student_id})
    if student:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": data.student_id,
            "title": "Hesap Durumu",
            "message": "Hesabınız onaylandı! Artık giriş yapabilirsiniz." if data.approved else "Hesabınız reddedildi.",
            "type": "success" if data.approved else "warning",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    return {"message": "Student approved" if data.approved else "Student rejected"}

@api_router.post("/teacher/add-student")
async def add_student_manually(student: StudentCreate, current_user: dict = Depends(require_teacher)):
    """Teacher adds a student manually (auto-approved)"""
    existing = await db.users.find_one({"email": student.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": student.email,
        "password": hash_password(student.password),
        "name": student.name,
        "role": "student",
        "approved": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return {"message": "Student added successfully", "user_id": user_doc["id"]}

@api_router.delete("/teacher/student/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(require_teacher)):
    """Delete a student"""
    result = await db.users.delete_one({"id": student_id, "role": "student"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted"}

# ==================== LESSONS ====================

@api_router.post("/lessons")
async def create_lesson(lesson: LessonCreate, current_user: dict = Depends(require_teacher)):
    """Create a new lesson"""
    lesson_doc = {
        "id": str(uuid.uuid4()),
        "title": lesson.title,
        "description": lesson.description,
        "date": lesson.date,
        "start_time": lesson.start_time,
        "end_time": lesson.end_time,
        "lesson_type": lesson.lesson_type,
        "student_ids": lesson.student_ids,
        "max_students": lesson.max_students if lesson.lesson_type == "group" else 1,
        "zoom_link": lesson.zoom_link or "",
        "level": lesson.level or "A1",
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.lessons.insert_one(lesson_doc)
    
    # Notify students
    for student_id in lesson.student_ids:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": "Yeni Ders",
            "message": f"{lesson.date} tarihinde {lesson.start_time} - {lesson.end_time} saatleri arasında '{lesson.title}' dersiniz eklendi.",
            "type": "lesson",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    # Handle recurring lessons
    if lesson.recurring and lesson.recurring_weeks > 0:
        base_date = datetime.strptime(lesson.date, "%Y-%m-%d")
        for week in range(1, lesson.recurring_weeks + 1):
            new_date = base_date + timedelta(weeks=week)
            recurring_lesson = lesson_doc.copy()
            recurring_lesson["id"] = str(uuid.uuid4())
            recurring_lesson["date"] = new_date.strftime("%Y-%m-%d")
            await db.lessons.insert_one(recurring_lesson)
    
    return {"message": "Lesson created", "lesson_id": lesson_doc["id"]}

@api_router.get("/lessons")
async def get_lessons(current_user: dict = Depends(require_approved_student)):
    """Get lessons - teachers see all, students see their own"""
    if current_user["role"] == "teacher":
        lessons = await db.lessons.find({}, {"_id": 0}).to_list(1000)
    else:
        lessons = await db.lessons.find(
            {"student_ids": current_user["id"]}, 
            {"_id": 0}
        ).to_list(1000)
    
    # Add student names to lessons
    for lesson in lessons:
        student_names = []
        for sid in lesson.get("student_ids", []):
            student = await db.users.find_one({"id": sid}, {"name": 1})
            if student:
                student_names.append(student["name"])
        lesson["student_names"] = student_names
    
    return lessons

@api_router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, update: LessonUpdate, current_user: dict = Depends(require_teacher)):
    """Update a lesson"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    
    result = await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Notify students if date/time changed
    if update.date or update.start_time or update.end_time:
        lesson = await db.lessons.find_one({"id": lesson_id})
        if lesson:
            for student_id in lesson.get("student_ids", []):
                notif = {
                    "id": str(uuid.uuid4()),
                    "user_id": student_id,
                    "title": "Ders Güncellendi",
                    "message": f"'{lesson['title']}' dersiniz güncellendi. Yeni tarih/saat: {lesson['date']} {lesson['start_time']}",
                    "type": "lesson",
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.notifications.insert_one(notif)
    
    return {"message": "Lesson updated"}

@api_router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, current_user: dict = Depends(require_teacher)):
    """Delete a lesson"""
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Notify students
    for student_id in lesson.get("student_ids", []):
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": "Ders İptal Edildi",
            "message": f"'{lesson['title']}' ({lesson['date']}) dersiniz iptal edildi.",
            "type": "warning",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    await db.lessons.delete_one({"id": lesson_id})
    return {"message": "Lesson deleted"}

# ==================== RESCHEDULE REQUESTS ====================

@api_router.post("/reschedule-request")
async def create_reschedule_request(request: RescheduleRequest, current_user: dict = Depends(require_approved_student)):
    """Student requests to reschedule a lesson"""
    lesson = await db.lessons.find_one({"id": request.lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if current_user["role"] == "student" and current_user["id"] not in lesson.get("student_ids", []):
        raise HTTPException(status_code=403, detail="Not your lesson")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "lesson_id": request.lesson_id,
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "original_date": lesson["date"],
        "original_time": f"{lesson['start_time']} - {lesson['end_time']}",
        "requested_date": request.requested_date,
        "requested_start_time": request.requested_start_time,
        "requested_end_time": request.requested_end_time,
        "reason": request.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reschedule_requests.insert_one(request_doc)
    
    # Notify teacher
    teacher = await db.users.find_one({"role": "teacher"})
    if teacher:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": teacher["id"],
            "title": "Ders Değişiklik Talebi",
            "message": f"{current_user['name']} '{lesson['title']}' dersi için tarih değişikliği talep etti.",
            "type": "reschedule",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    return {"message": "Reschedule request submitted", "request_id": request_doc["id"]}

@api_router.get("/reschedule-requests")
async def get_reschedule_requests(current_user: dict = Depends(require_approved_student)):
    """Get reschedule requests"""
    if current_user["role"] == "teacher":
        requests = await db.reschedule_requests.find({}, {"_id": 0}).to_list(1000)
    else:
        requests = await db.reschedule_requests.find(
            {"student_id": current_user["id"]}, 
            {"_id": 0}
        ).to_list(1000)
    return requests

@api_router.post("/reschedule-requests/{request_id}/respond")
async def respond_reschedule_request(request_id: str, response: RescheduleResponse, current_user: dict = Depends(require_teacher)):
    """Teacher approves or rejects reschedule request"""
    req = await db.reschedule_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    status = "approved" if response.approved else "rejected"
    await db.reschedule_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status, "response_message": response.message}}
    )
    
    # If approved, update the lesson
    if response.approved:
        await db.lessons.update_one(
            {"id": req["lesson_id"]},
            {"$set": {
                "date": req["requested_date"],
                "start_time": req["requested_start_time"],
                "end_time": req["requested_end_time"]
            }}
        )
    
    # Notify student
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": req["student_id"],
        "title": "Talep Yanıtlandı",
        "message": f"Ders değişiklik talebiniz {'onaylandı' if response.approved else 'reddedildi'}. {response.message or ''}",
        "type": "success" if response.approved else "warning",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif)
    
    return {"message": "Response sent"}

# ==================== MATERIALS ====================

@api_router.post("/materials")
async def create_material(material: MaterialCreate, current_user: dict = Depends(require_teacher)):
    """Create a new material/resource"""
    material_doc = {
        "id": str(uuid.uuid4()),
        "title": material.title,
        "description": material.description,
        "link": material.link,
        "file_type": material.file_type,
        "visible_to": material.visible_to,  # empty = all students
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.materials.insert_one(material_doc)
    
    # Notify students
    if material.visible_to:
        student_ids = material.visible_to
    else:
        students = await db.users.find({"role": "student", "approved": True}, {"id": 1}).to_list(1000)
        student_ids = [s["id"] for s in students]
    
    for student_id in student_ids:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": "Yeni Materyal",
            "message": f"'{material.title}' materyali eklendi.",
            "type": "info",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    return {"message": "Material created", "material_id": material_doc["id"]}

@api_router.get("/materials")
async def get_materials(current_user: dict = Depends(require_approved_student)):
    """Get materials"""
    if current_user["role"] == "teacher":
        materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    else:
        # Students see materials visible to them or all
        materials = await db.materials.find(
            {"$or": [
                {"visible_to": {"$size": 0}},
                {"visible_to": current_user["id"]}
            ]},
            {"_id": 0}
        ).to_list(1000)
    return materials

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, current_user: dict = Depends(require_teacher)):
    """Delete a material"""
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted"}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get user's notifications"""
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return notifications

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await db.notifications.count_documents({"user_id": current_user["id"], "read": False})
    return {"count": count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

# ==================== INIT TEACHER ====================

@api_router.post("/init-teacher")
async def init_teacher():
    """Initialize teacher account (only works if no teacher exists)"""
    existing = await db.users.find_one({"role": "teacher"})
    if existing:
        raise HTTPException(status_code=400, detail="Teacher already exists")
    
    teacher_doc = {
        "id": str(uuid.uuid4()),
        "email": "teacher@bulgarcakolayca.com",
        "password": hash_password("teacher123"),
        "name": "Fatma Uslu Özşeker",
        "role": "teacher",
        "approved": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(teacher_doc)
    return {"message": "Teacher account created", "email": "teacher@bulgarcakolayca.com", "password": "teacher123"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
