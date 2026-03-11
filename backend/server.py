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

# Quiz Questions Data - Updated from official test document
QUIZ_QUESTIONS = {
    "bulgarian": [
        {
            "id": 1,
            "question": "Как се казваш?",
            "options": ["Добър ден.", "Приятно ми е.", "Казвам се Али.", "Да."],
            "correct": 2,
            "level": "A1",
            "translation": {"tr": "Adın ne?", "en": "What is your name?"}
        },
        {
            "id": 2,
            "question": "Ти … от Турция.",
            "options": ["си", "е", "сте", "съм"],
            "correct": 0,
            "level": "A1",
            "translation": {"tr": "Sen Türkiye'densin. (Boşluğu doldurun)", "en": "You are from Turkey. (Fill in the blank)"}
        },
        {
            "id": 3,
            "question": "Избери правилното изречение.",
            "options": ["Тя е лекар.", "Тя си лекарка.", "Тя е лекарка.", "Тя сте лекар."],
            "correct": 2,
            "level": "A1",
            "translation": {"tr": "Doğru cümleyi seçin.", "en": "Choose the correct sentence."}
        },
        {
            "id": 4,
            "question": "На колко години си?",
            "options": ["На 26 години съм.", "От 26 години си.", "В 26 години сте.", "На 26 година съм."],
            "correct": 0,
            "level": "A1",
            "translation": {"tr": "Kaç yaşındasın?", "en": "How old are you?"}
        },
        {
            "id": 5,
            "question": "Къде живееш? - Живея … Бургас.",
            "options": ["от", "на", "за", "в"],
            "correct": 3,
            "level": "A1",
            "translation": {"tr": "Nerede yaşıyorsun? - Burgaz'da yaşıyorum.", "en": "Where do you live? - I live in Burgas."}
        },
        {
            "id": 6,
            "question": "Колко е часът?",
            "options": ["Два.", "Семейство.", "Да.", "Хляб."],
            "correct": 0,
            "level": "A1",
            "translation": {"tr": "Saat kaç?", "en": "What time is it?"}
        },
        {
            "id": 7,
            "question": "Вчера … на работа.",
            "options": ["бях", "ще бъда", "няма да бъда", "бъди"],
            "correct": 0,
            "level": "A2",
            "translation": {"tr": "Dün işteydim. (Boşluğu doldurun)", "en": "Yesterday I was at work. (Fill in the blank)"}
        },
        {
            "id": 8,
            "question": "Сега … книга.",
            "options": ["изчетох", "чета", "чел", "четял"],
            "correct": 1,
            "level": "A2",
            "translation": {"tr": "Şimdi kitap okuyorum. (Boşluğu doldurun)", "en": "Now I'm reading a book. (Fill in the blank)"}
        },
        {
            "id": 9,
            "question": "Коя дума е прилагателно име?",
            "options": ["къща", "ученик", "голям", "стол"],
            "correct": 2,
            "level": "A2",
            "translation": {"tr": "Hangi kelime sıfattır?", "en": "Which word is an adjective?"}
        },
        {
            "id": 10,
            "question": "Не … да пиша сега.",
            "options": ["правя", "мога", "нямам", "готвя"],
            "correct": 1,
            "level": "A2",
            "translation": {"tr": "Şimdi yazamıyorum. (Boşluğu doldurun)", "en": "I can't write now. (Fill in the blank)"}
        }
    ],
    "turkish": [
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
            "question": "'Ben Türkiye'denim' cümlesini tamamlayın: 'Ben ___'",
            "options": ["geliyorum", "gidiyorum", "Türkiye'denim", "istiyorum"],
            "correct": 2,
            "translation": {"bg": "Попълнете изречението: 'Ben ___'", "en": "Complete the sentence: 'Ben ___'"}
        },
        {
            "id": 4,
            "question": "Türkçe'de günler hangi harfle başlar?",
            "options": ["Büyük harf", "Küçük harf", "Farketmez", "Hiçbiri"],
            "correct": 1,
            "translation": {"bg": "С каква буква започват дните на турски?", "en": "What letter do days start with in Turkish?"}
        },
        {
            "id": 5,
            "question": "'Nasılsınız?' sorusunun cevabı hangisidir?",
            "options": ["İyiyim, teşekkürler", "Adım Ali", "Türkiye'denim", "Memnun oldum"],
            "correct": 0,
            "translation": {"bg": "Кой е отговорът на 'Nasılsınız?'?", "en": "What is the answer to 'Nasılsınız?'?"}
        },
        {
            "id": 6,
            "question": "'Bir, iki, üç' sayıları kaçtır?",
            "options": ["4, 5, 6", "1, 2, 3", "7, 8, 9", "10, 11, 12"],
            "correct": 1,
            "translation": {"bg": "Кои числа са 'Bir, iki, üç'?", "en": "What numbers are 'Bir, iki, üç'?"}
        },
        {
            "id": 7,
            "question": "'Günaydın' ne zaman kullanılır?",
            "options": ["Akşam", "Gece", "Sabah", "Öğlen"],
            "correct": 2,
            "translation": {"bg": "Кога се използва 'Günaydın'?", "en": "When is 'Günaydın' used?"}
        },
        {
            "id": 8,
            "question": "Türkçe'de 'Hayır' nasıl söylenir?",
            "options": ["Evet", "Hayır", "Belki", "Tamam"],
            "correct": 1,
            "translation": {"bg": "Как се казва 'Не' на турски?", "en": "How do you say 'No' in Turkish?"}
        },
        {
            "id": 9,
            "question": "'Pazartesi' hangi gündür?",
            "options": ["Monday", "Tuesday", "Wednesday", "Thursday"],
            "correct": 0,
            "translation": {"bg": "Кой ден е 'Pazartesi'?", "en": "What day is 'Pazartesi'?"}
        },
        {
            "id": 10,
            "question": "'Hoşça kalın' ne anlama gelir?",
            "options": ["Hello", "Thank you", "Goodbye", "Please"],
            "correct": 2,
            "translation": {"bg": "Какво означава 'Hoşça kalın'?", "en": "What does 'Hoşça kalın' mean?"}
        }
    ]
}

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

# Level Test Endpoints
@api_router.get("/quiz/questions/{language}")
async def get_quiz_questions(language: str):
    if language not in QUIZ_QUESTIONS:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Return questions without correct answers
    questions = []
    for q in QUIZ_QUESTIONS[language]:
        questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "translation": q.get("translation", {})
        })
    return {"language": language, "questions": questions}

@api_router.post("/quiz/submit", response_model=LevelTestResult)
async def submit_level_test(submission: LevelTestSubmit):
    if submission.language_learning not in QUIZ_QUESTIONS:
        raise HTTPException(status_code=404, detail="Language not found")
    
    questions = QUIZ_QUESTIONS[submission.language_learning]
    score = 0
    total = len(questions)
    
    for answer in submission.answers:
        question = next((q for q in questions if q["id"] == answer.question_id), None)
        if question and answer.selected_option == question["correct"]:
            score += 1
    
    percentage = (score / total) * 100 if total > 0 else 0
    
    # Determine recommended level
    if percentage >= 80:
        recommended_level = "A2"
    elif percentage >= 50:
        recommended_level = "A1+"
    else:
        recommended_level = "A1"
    
    result = LevelTestResult(
        name=submission.name,
        email=submission.email,
        language_learning=submission.language_learning,
        score=score,
        total_questions=total,
        percentage=percentage,
        recommended_level=recommended_level
    )
    
    doc = result.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.level_tests.insert_one(doc)
    
    return result

@api_router.get("/quiz/results", response_model=List[LevelTestResult])
async def get_level_test_results():
    results = await db.level_tests.find({}, {"_id": 0}).to_list(1000)
    for result in results:
        if isinstance(result['created_at'], str):
            result['created_at'] = datetime.fromisoformat(result['created_at'])
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
