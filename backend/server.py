from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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
                    "translation": q.get("translation", {})
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
