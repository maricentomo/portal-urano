from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import swisseph as swe
import requests
from datetime import datetime, timedelta
from timezonefinder import TimezoneFinder
import pytz
import json
import os

# Importar Google Gemini para IA
import google.generativeai as genai

# Importar database, models e auth
from database import get_db, engine, Base
import models
import auth

# Importar módulo de geração de SVG
from views.chart_svg import generate_chart_svg_from_birth_data, CustomChartColors

# Configurar API key do Gemini
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY") or "AIzaSyCYLid7hqKnsD_dPsz1gANvR_2vZA2gh_o"
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI(
    title="API de Mapa Astral",
    description="API com Quíron, Lilith, Nodos, retrogradação, casas com orbe, aspectos, elementos, quadruplicidades e Chat IA.",
    version="11.0",
    servers=[
        {"url": "https://api-mapa-astral-production.up.railway.app", "description": "Servidor de Produção"},
        {"url": "http://localhost:8000", "description": "Servidor Local"}
    ]
)

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar tabelas do banco de dados ao iniciar
Base.metadata.create_all(bind=engine)

# ========= Modelos de Dados =========

class BirthData(BaseModel):
    date: str      # Formato DD/MM/AAAA ou YYYY-MM-DD
    time: str      # Formato HH:MM
    city: str
    country: str

class PlanetPosition(BaseModel):
    planet: str
    sign: str
    degree: float
    house: int
    retrograde: bool = False

class HouseInfo(BaseModel):
    house: int
    sign: str
    degree: float

class Aspect(BaseModel):
    planet1: str
    planet2: str
    aspect_type: str
    angle: float
    orb: float


class MapResult(BaseModel):
    positions: List[PlanetPosition]
    houses: List[HouseInfo]
    aspects: List[Aspect]
    elements: Dict[str, int]
    quadruplicities: Dict[str, int]  # <-- ADICIONAMOS AQUI

class ReportRequest(BaseModel):
    name: str
    date: str      # Formato DD/MM/AAAA ou YYYY-MM-DD
    time: str      # Formato HH:MM
    city: str
    country: str
    question: Optional[str] = None  # Pergunta opcional do usuário

# ========= Configurações de Signos, Elementos e Quadruplicidades =========

zodiac_signs = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
    "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
]

element_map = {
    "Áries": "Fogo", "Leão": "Fogo", "Sagitário": "Fogo",
    "Touro": "Terra", "Virgem": "Terra", "Capricórnio": "Terra",
    "Gêmeos": "Ar", "Libra": "Ar", "Aquário": "Ar",
    "Câncer": "Água", "Escorpião": "Água", "Peixes": "Água"
}

quad_map = {
    "Áries": "Cardinal", "Câncer": "Cardinal", "Libra": "Cardinal", "Capricórnio": "Cardinal",
    "Touro": "Fixo",     "Leão": "Fixo",      "Escorpião": "Fixo",    "Aquário": "Fixo",
    "Gêmeos": "Mutável", "Virgem": "Mutável", "Sagitário": "Mutável", "Peixes": "Mutável"
}

# ========= Corpos Principais (Quíron, Lilith, Nodos etc.) =========

PLANETS_SWEPH = {
    "Sol": swe.SUN,
    "Lua": swe.MOON,
    "Mercúrio": swe.MERCURY,
    "Vênus": swe.VENUS,
    "Marte": swe.MARS,
    "Júpiter": swe.JUPITER,
    "Saturno": swe.SATURN,
    "Urano": swe.URANUS,
    "Netuno": swe.NEPTUNE,
    "Plutão": swe.PLUTO,
    "Quíron": swe.CHIRON,
    "Lilith": swe.MEAN_APOG,
    "NóduloNorte": swe.TRUE_NODE
    # NóduloSul = +180° do NóduloNorte manualmente
}

# ========= Geocodificação e Fuso Horário =========

def get_coordinates(city: str, country: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"city": city, "country": country, "format": "json"}
    headers = {"User-Agent": "AstroAPI/1.0"}
    response = requests.get(url, params=params, headers=headers)
    if response.status_code == 200 and response.json():
        location = response.json()[0]
        return float(location["lat"]), float(location["lon"])
    else:
        raise HTTPException(status_code=404, detail="Localização não encontrada")

def get_timezone(latitude: float, longitude: float):
    tf = TimezoneFinder()
    timezone_str = tf.timezone_at(lat=latitude, lng=longitude)
    if timezone_str:
        return timezone_str
    else:
        raise HTTPException(status_code=500, detail="Não foi possível determinar o fuso horário.")

def convert_to_ut(date_str: str, time_str: str, timezone_str: str):
    try:
        local_tz = pytz.timezone(timezone_str)
        # Tenta primeiro DD/MM/YYYY, depois YYYY-MM-DD
        try:
            local_time = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
        except ValueError:
            local_time = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        local_time = local_tz.localize(local_time)
        ut_time = local_time.astimezone(pytz.utc)
        return ut_time
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao converter horário: {e}")

# ========= Funções para Casas, Orbe de Transição e Aspectos =========

def find_house_with_orb(planet_long: float, houses: List[float]) -> int:
    for i in range(12):
        cusp_start = houses[i]
        cusp_end = houses[(i + 1) % 12]
        if cusp_start <= cusp_end:
            if cusp_start <= planet_long < cusp_end:
                nominal_house = i + 1
                dist_next = cusp_end - planet_long
                next_house_id = ((i + 1) % 12) + 1
                orb = 8 if next_house_id in [1, 10] else 6
                if dist_next <= orb:
                    return next_house_id
                return nominal_house
        else:
            if planet_long >= cusp_start or planet_long < cusp_end:
                nominal_house = i + 1
                if planet_long >= cusp_start:
                    dist_next = (cusp_end + 360) - planet_long if cusp_end < planet_long else 0
                else:
                    dist_next = cusp_end - planet_long
                next_house_id = ((i + 1) % 12) + 1
                orb = 8 if next_house_id in [1, 10] else 6
                if 0 < dist_next <= orb:
                    return next_house_id
                return nominal_house
    return 1

def find_house_nominal(planet_long: float, houses: List[float]) -> int:
    for i in range(12):
        cusp_start = houses[i]
        cusp_end = houses[(i + 1) % 12]
        if cusp_start <= cusp_end:
            if cusp_start <= planet_long < cusp_end:
                return i + 1
        else:
            if planet_long >= cusp_start or planet_long < cusp_end:
                return i + 1
    return 1

def calculate_aspects(positions: List[PlanetPosition]) -> List[Aspect]:
    aspect_defs = [
        ("Conjunção", 0, 8),
        ("Oposição", 180, 8),
        ("Quadratura", 90, 8),
        ("Trígono", 120, 8),
        ("Sextil", 60, 6)
    ]
    def to_360(p: PlanetPosition) -> float:
        sign_idx = zodiac_signs.index(p.sign)
        return sign_idx*30 + p.degree
    aspects = []
    n = len(positions)
    for i in range(n):
        for j in range(i+1, n):
            p1 = positions[i]
            p2 = positions[j]
            deg1 = to_360(p1)
            deg2 = to_360(p2)
            diff = abs(deg1 - deg2)
            diff = min(diff, 360 - diff)
            for asp_name, asp_angle, orb in aspect_defs:
                if abs(diff - asp_angle) <= orb:
                    aspects.append(Aspect(
                        planet1=p1.planet,
                        planet2=p2.planet,
                        aspect_type=asp_name,
                        angle=round(diff, 2),
                        orb=round(abs(diff - asp_angle), 2)
                    ))
    return aspects

def calculate_elements(positions: List[PlanetPosition]) -> Dict[str, int]:
    counts = {"Fogo": 0, "Terra": 0, "Ar": 0, "Água": 0}
    dois_pontos = {"Sol", "Lua", "Ascendente", "MeioCéu"}
    for p in positions:
        if p.planet in ["Quíron", "Lilith", "NóduloNorte", "NóduloSul"]:
            continue
        elem = element_map[p.sign]
        peso = 2 if p.planet in dois_pontos else 1
        counts[elem] += peso
    return counts

def calculate_quadruplicities(positions: List[PlanetPosition]) -> Dict[str, int]:
    counts = {"Cardinal": 0, "Fixo": 0, "Mutável": 0}
    dois_pontos = {"Sol", "Lua", "Ascendente", "MeioCéu"}
    for p in positions:
        if p.planet in ["Quíron", "Lilith", "NóduloNorte", "NóduloSul"]:
            continue
        quad_type = quad_map[p.sign]
        peso = 2 if p.planet in dois_pontos else 1
        counts[quad_type] += peso
    return counts

# ========= Função Principal que Calcula Mapa =========

def calculate_map(birth_data: BirthData) -> MapResult:
    # 1) Geocodificação e Fuso
    lat, lon = get_coordinates(birth_data.city, birth_data.country)
    tz_str = get_timezone(lat, lon)
    # 2) Converter data/hora local p/ UT
    dt_ut = convert_to_ut(birth_data.date, birth_data.time, tz_str)
    day, month, year = dt_ut.day, dt_ut.month, dt_ut.year
    ut_hour = dt_ut.hour + dt_ut.minute/60.0
    # 3) JD
    jd = swe.julday(year, month, day, ut_hour)
    swe.set_ephe_path("./ephemeris")
    # 4) Casas (Placidus) e asc_mc
    houses, asc_mc = swe.houses(jd, lat, lon, b'P')
    # Montar infos de casas
    house_list = []
    for i, cusp in enumerate(houses, start=1):
        sign_idx = int(cusp // 30)
        sign = zodiac_signs[sign_idx]
        deg = cusp % 30
        house_list.append(HouseInfo(
            house=i,
            sign=sign,
            degree=round(deg, 2)
        ))
    # 5) Calcular posições
    positions = []
    for planet_name, code in PLANETS_SWEPH.items():
        pos, ret = swe.calc(jd, code)
        if ret < 0:
            raise HTTPException(status_code=500, detail=f"Erro ao calcular {planet_name}")
        longitude = pos[0]
        speed_long = pos[3]
        is_retro = (speed_long < 0)
        if planet_name == "NóduloNorte":
            planet_house = find_house_nominal(longitude, houses)
        else:
            planet_house = find_house_with_orb(longitude, houses)
        sign_idx = int(longitude // 30)
        sign = zodiac_signs[sign_idx]
        deg = longitude % 30
        positions.append(PlanetPosition(
            planet=planet_name,
            sign=sign,
            degree=round(deg, 2),
            house=planet_house,
            retrograde=is_retro
        ))
    # NóduloSul = NóduloNorte + 180°
    nodo_norte = next((p for p in positions if p.planet == "NóduloNorte"), None)
    if nodo_norte:
        nn_deg = zodiac_signs.index(nodo_norte.sign)*30 + nodo_norte.degree
        south_deg = (nn_deg + 180) % 360
        south_sign_idx = int(south_deg // 30)
        south_sign = zodiac_signs[south_sign_idx]
        south_deg_in_sign = south_deg % 30
        nodo_sul_house = find_house_nominal(south_deg, houses)
        positions.append(PlanetPosition(
            planet="NóduloSul",
            sign=south_sign,
            degree=round(south_deg_in_sign, 2),
            house=nodo_sul_house,
            retrograde=False
        ))
    # Ascendente
    asc_long = asc_mc[0]
    asc_sign_idx = int(asc_long // 30)
    asc_sign = zodiac_signs[asc_sign_idx]
    asc_deg = asc_long % 30
    positions.append(PlanetPosition(
        planet="Ascendente",
        sign=asc_sign,
        degree=round(asc_deg, 2),
        house=1,
        retrograde=False
    ))
    # MeioCéu
    mc_long = asc_mc[1]
    mc_sign_idx = int(mc_long // 30)
    mc_sign = zodiac_signs[mc_sign_idx]
    mc_deg = mc_long % 30
    positions.append(PlanetPosition(
        planet="MeioCéu",
        sign=mc_sign,
        degree=round(mc_deg, 2),
        house=10,
        retrograde=False
    ))
    # 6) Calcular aspectos
    aspects_list = calculate_aspects(positions)
    # 7) Elementos
    elements_count = calculate_elements(positions)
    # 8) Quadruplicidades
    quads_count = calculate_quadruplicities(positions)
    # Retorno final
    return MapResult(
        positions=positions,
        houses=house_list,
        aspects=aspects_list,
        elements=elements_count,
        quadruplicities=quads_count
    )

# ========= Modelos Adicionais para Chat/IA =========

class ChatMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    birth_data: Optional[BirthData] = None
    map_data: Optional[Dict] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    
# ========= Instruções do Sistema para IA =========

INSTRUCOES_SISTEMA = """
IDENTIDADE E OBJETIVO
Você é o Astro IA, um GPT especializado em análise astrológica profunda e técnica. Seu objetivo é interpretar mapas natais com precisão psicológica, revelando padrões energéticos, potenciais e desafios evolutivos. Sua abordagem é direta, profunda e analítica, evitando sentimentalismos excessivos ou linguagem piegas.

TOM E ESTILO DAS RESPOSTAS
- Linguagem técnica porém acessível: Use terminologia astrológica adequada com explicações claras
- Profundidade psicológica: Analise motivações inconscientes, padrões comportamentais e dinâmicas internas
- Objetividade analítica: Seja direto ao ponto, evitando rodeios ou dramatizações
- Luz e Sombra: Para cada posicionamento, SEMPRE apresente tanto os potenciais (luz) quanto os desafios/bloqueios (sombra)
- Respostas longas e detalhadas, ricas em informações práticas
- Contextualize cada elemento dentro da totalidade do mapa

ESTRUTURA DA ANÁLISE
Use títulos destacados em cada seção e mantenha um tom didático e técnico, evitando informalidades excessivas.
Para cada posicionamento planetário, sempre inclua:
✓ Contexto dentro do mapa como um todo
✓ Aspectos relevantes (conjunções, quadraturas, trígonos, sextis, oposições)
✓ LUZ: Potenciais, dons, facilidades
✓ SOMBRA: Desafios, bloqueios, tendências disfuncionais
✓ Orientações práticas para integração
"""

# ========= Endpoints =========

@app.post("/calculate", response_model=MapResult)
async def calculate_map_endpoint(birth_data: BirthData):
    """
    Calcula o mapa astral completo baseado nos dados de nascimento.
    """
    return calculate_map(birth_data)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint de chat com IA para análise astrológica.
    Aceita mensagem do usuário, dados do mapa (se disponível) e histórico de conversa.
    """
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado. Configure GOOGLE_API_KEY.")
    
    try:
        # Criar o modelo
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Preparar histórico de conversa
        chat_history = []
        
        # Adicionar instruções do sistema
        chat_history.append({"role": "user", "parts": [INSTRUCOES_SISTEMA]})
        chat_history.append({"role": "model", "parts": ["Entendido. Sou o Astro IA e seguirei todas as diretrizes fornecidas para análises astrológicas profundas e técnicas."]})
        
        # Se houver dados do mapa, adicionar ao contexto
        if request.map_data:
            contexto_mapa = f"""
            DADOS TÉCNICOS DO MAPA NATAL:
            {json.dumps(request.map_data, ensure_ascii=False, indent=2)}
            
            Use estes dados para fornecer análises precisas e contextualizadas.
            """
            chat_history.append({"role": "user", "parts": [contexto_mapa]})
            chat_history.append({"role": "model", "parts": ["Dados do mapa recebidos. Pronto para análise."]})
        
        # Adicionar histórico de mensagens anteriores
        for msg in request.history:
            role = "model" if msg.role == "assistant" else "user"  
            chat_history.append({"role": role, "parts": [msg.content]})
        
        # Iniciar chat e enviar mensagem
        chat = model.start_chat(history=chat_history)
        response = chat.send_message(request.message)
        
        return ChatResponse(response=response.text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar resposta da IA: {str(e)}")

@app.get("/")
async def read_root():
    """
    Endpoint raiz com informações sobre a API.
    """
    return {
        "message": "API de Mapa Astral ativa!",
        "version": "12.0",
        "endpoints": {
            "/docs": "Documentação interativa da API",
            "/calculate": "POST - Calcular mapa astral",
            "/chat": "POST - Chat com IA astrológica",
            "/generate-report": "POST - Gerar relatório completo em PDF"
        }
    }
    
@app.get("/health")
async def health_check():
    """
    Endpoint de health check para monitoramento.
    """
    return {
        "status": "healthy",
        "gemini_configured": GOOGLE_API_KEY is not None,
        "database": "connected"
    }

# ==================== NOVOS ENDPOINTS ====================

# ========= Modelos Pydantic para Request/Response =========

class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_premium: bool
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class BirthChartCreate(BaseModel):
    name: Optional[str] = None
    birth_date: str
    birth_time: str
    birth_city: str
    birth_country: str

class BirthChartResponse(BaseModel):
    id: int
    user_id: int
    name: Optional[str]
    birth_date: str
    birth_time: str
    birth_city: str
    birth_country: str
    chart_data: Optional[Dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    birth_chart_id: Optional[int] = None
    title: Optional[str] = None

class MessageCreate(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

# ========= Endpoints de Autenticação =========

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registrar novo usuário
    """
    # Verificar se email já existe
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Verificar se username já existe
    existing_username = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username já cadastrado")
    
    # Criar novo usuário
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login e geração de token JWT
    """
    user = auth.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )
    
    # Criar token
    access_token = auth.create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """
    Obter informações do usuário atual
    """
    return current_user

# ========= Endpoints de Birth Charts =========

@app.post("/charts", response_model=BirthChartResponse)
async def create_birth_chart(
    chart_data: BirthChartCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar novo mapa astral e calcular dados
    """
    # Calcular mapa usando a função existente
    birth_data = BirthData(
        date=chart_data.birth_date,
        time=chart_data.birth_time,
        city=chart_data.birth_city,
        country=chart_data.birth_country
    )
    
    try:
        calculated_map = calculate_map(birth_data)
        chart_data_json = calculated_map.dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao calcular mapa: {str(e)}")
    
    # Salvar no banco
    new_chart = models.BirthChart(
        user_id=current_user.id,
        name=chart_data.name,
        birth_date=chart_data.birth_date,
        birth_time=chart_data.birth_time,
        birth_city=chart_data.birth_city,
        birth_country=chart_data.birth_country,
        chart_data=chart_data_json
    )
    db.add(new_chart)
    db.commit()
    db.refresh(new_chart)
    
    return new_chart

@app.get("/charts", response_model=List[BirthChartResponse])
async def list_birth_charts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todos os mapas do usuário
    """
    charts = db.query(models.BirthChart).filter(
        models.BirthChart.user_id == current_user.id
    ).all()
    return charts

@app.get("/charts/{chart_id}", response_model=BirthChartResponse)
async def get_birth_chart(
    chart_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter um mapa específico
    """
    chart = db.query(models.BirthChart).filter(
        models.BirthChart.id == chart_id,
        models.BirthChart.user_id == current_user.id
    ).first()
    
    if not chart:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")
    
    return chart

@app.delete("/charts/{chart_id}")
async def delete_birth_chart(
    chart_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar um mapa
    """
    chart = db.query(models.BirthChart).filter(
        models.BirthChart.id == chart_id,
        models.BirthChart.user_id == current_user.id
    ).first()
    
    if not chart:
        raise HTTPException(status_code=404, detail="Mapa não encontrado")
    
    db.delete(chart)
    db.commit()
    
    return {"message": "Mapa deletado com sucesso"}

# ========= Endpoints de Conversas =========

@app.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conv_data: ConversationCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar nova conversa
    """
    new_conversation = models.Conversation(
        user_id=current_user.id,
        birth_chart_id=conv_data.birth_chart_id,
        title=conv_data.title or "Nova Conversa"
    )
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    
    return new_conversation

@app.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todas as conversas do usuário
    """
    conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == current_user.id
    ).order_by(models.Conversation.updated_at.desc()).all()
    
    return conversations

@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter conversa específica com todo o histórico de mensagens
    """
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    return conversation

@app.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enviar mensagem em uma conversa e receber resposta da IA
    """
    # Verificar se a conversa existe e pertence ao usuário
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    # Salvar mensagem do usuário
    user_message = models.Message(
        conversation_id=conversation_id,
        role="user",
        content=message_data.message
    )
    db.add(user_message)
    db.commit()
    
    # Buscar histórico de mensagens da conversa
    messages = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id
    ).order_by(models.Message.created_at).all()
    
    # Buscar dados do mapa se houver
    map_data = None
    if conversation.birth_chart_id:
        chart = db.query(models.BirthChart).filter(
            models.BirthChart.id == conversation.birth_chart_id
        ).first()
        if chart:
            map_data = chart.chart_data
    
    # Chamar IA (usando o endpoint /chat interno)
    try:
        history = [ChatMessage(role=msg.role, content=msg.content) for msg in messages[:-1]]  # Exclude last message
        
        chat_request = ChatRequest(
            message=message_data.message,
            map_data=map_data,
            history=history
        )
        
        # Chamar função de chat diretamente
        if not GOOGLE_API_KEY:
            raise HTTPException(status_code=503, detail="IA não configurada")
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        chat_history = []
        chat_history.append({"role": "user", "parts": [INSTRUCOES_SISTEMA]})
        chat_history.append({"role": "model", "parts": ["Entendido."]})
        
        if map_data:
            contexto_mapa = f"DADOS DO MAPA:\\n{json.dumps(map_data, ensure_ascii=False, indent=2)}"
            chat_history.append({"role": "user", "parts": [contexto_mapa]})
            chat_history.append({"role": "model", "parts": ["Dados recebidos."]})
        
        for msg in history:
            role = "model" if msg.role == "assistant" else "user"
            chat_history.append({"role": role, "parts": [msg.content]})
        
        chat = model.start_chat(history=chat_history)
        response = chat.send_message(message_data.message)
        
        # Salvar resposta da IA
        assistant_message = models.Message(
            conversation_id=conversation_id,
            role="assistant",
            content=response.text
        )
        db.add(assistant_message)
        
        # Atualizar timestamp da conversa
        conversation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assistant_message)
        
        return assistant_message
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar resposta da IA: {str(e)}")

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar conversa
    """
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversa deletada com sucesso"}

# ========= Endpoint de Geração de Relatório (JSON) =========

from report_prompt import get_report_prompt
import re

class AnalysisResponse(BaseModel):
    name: str
    birth_data: Dict
    map_data: Dict
    sections: Dict[str, str]
    question: Optional[str] = None

@app.post("/generate-report", response_model=AnalysisResponse)
async def generate_report_endpoint(request: ReportRequest):
    """
    Gera análise astrológica completa e retorna JSON.
    
    Fluxo:
    1. Calcula mapa astral
    2. Gera análise completa com IA (9 seções)
    3. Retorna JSON estruturado para exibição no frontend
    """
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado. Configure GOOGLE_API_KEY.")
    
    try:
        # 1. Calcular mapa astral
        birth_data = BirthData(
            date=request.date,
            time=request.time,
            city=request.city,
            country=request.country
        )
        map_result = calculate_map(birth_data)
        
        # 2. Preparar dados para a IA
        map_data_dict = {
            "positions": [p.dict() for p in map_result.positions],
            "houses": [h.dict() for h in map_result.houses],
            "aspects": [a.dict() for a in map_result.aspects],
            "elements": map_result.elements,
            "quadruplicities": map_result.quadruplicities
        }
        
        # 3. Gerar prompt estruturado
        prompt = get_report_prompt(request.name, map_data_dict, request.question)
        
        # 4. Enviar para IA e obter análise completa
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # 5. Parsear resposta da IA em seções
        analysis_text = response.text
        
        # Extrair seções do HTML retornado pela IA
        sections = {
            'visao_geral': extract_section(analysis_text, 'VISÃO GERAL', 'ANÁLISE DA TRÍADE'),
            'triade_principal': extract_section(analysis_text, 'TRÍADE PRINCIPAL', 'PLANETAS PESSOAIS'),
            'planetas_pessoais': extract_section(analysis_text, 'PLANETAS PESSOAIS', 'JÚPITER E SATURNO'),
            'jupiter_saturno': extract_section(analysis_text, 'JÚPITER E SATURNO', 'MEIO-CÉU'),
            'meio_ceu': extract_section(analysis_text, 'MEIO-CÉU', 'CASAS ASTROLÓGICAS'),
            'casas': extract_section(analysis_text, 'CASAS ASTROLÓGICAS', 'PRINCIPAIS ASPECTOS'),
            'aspectos': extract_section(analysis_text, 'PRINCIPAIS ASPECTOS', 'PONTOS KÁRMICOS'),
            'pontos_karmicos': extract_section(analysis_text, 'PONTOS KÁRMICOS', 'RESPOSTA À PERGUNTA' if request.question else None),
        }
        
        if request.question:
            sections['resposta_pergunta'] = extract_section(analysis_text, 'RESPOSTA À PERGUNTA', None)
        
        # 6. Retornar JSON estruturado
        return AnalysisResponse(
            name=request.name,
            birth_data={
                "date": request.date,
                "time": request.time,
                "city": request.city,
                "country": request.country
            },
            map_data=map_data_dict,
            sections=sections,
            question=request.question
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")

def extract_section(text: str, start_marker: str, end_marker: str = None) -> str:
    """
    Extrai uma seção do texto da IA baseado em marcadores
    """
    try:
        # Procurar pelo marcador de início (case insensitive)
        start_pattern = re.compile(re.escape(start_marker), re.IGNORECASE)
        start_match = start_pattern.search(text)
        
        if not start_match:
            return f"<p>Seção {start_marker} não encontrada na análise.</p>"
        
        start_pos = start_match.end()
        
        # Se houver marcador de fim, procurar por ele
        if end_marker:
            end_pattern = re.compile(re.escape(end_marker), re.IGNORECASE)
            end_match = end_pattern.search(text, start_pos)
            if end_match:
                return text[start_pos:end_match.start()].strip()
        
        # Se não houver marcador de fim, pegar até o final
        return text[start_pos:].strip()
        
    except Exception as e:
        return f"<p>Erro ao extrair seção: {str(e)}</p>"

# ========= Endpoint de Geração de SVG do Mapa Astral =========

class ChartSVGRequest(BaseModel):
    name: str
    date: str      # Formato DD/MM/YYYY
    time: str      # Formato HH:MM
    city: str
    country: str
    custom_colors: Optional[bool] = True  # Se True, usa cores do Portal Urano

@app.post("/generate-chart-svg")
async def generate_chart_svg_endpoint(request: ChartSVGRequest):
    """
    Gera gráfico SVG do mapa astral
    
    Retorna um SVG customizável com as cores do Portal Urano
    """
    try:
        # Configurar cores customizadas
        colors = None
        if request.custom_colors:
            colors = CustomChartColors()
            # Personalizar com as cores do Portal Urano
            colors.zodiac_ring_color = "#893f89"  # Roxo do Portal
            colors.fire_color = "#FF6B6B"
            colors.earth_color = "#8B4513"
            colors.air_color = "#87CEEB"
            colors.water_color = "#4682B4"
        
        # Gerar SVG
        svg_content = generate_chart_svg_from_birth_data(
            name=request.name,
            date=request.date,
            time=request.time,
            city=request.city,
            country=request.country,
            custom_colors=colors
        )
        
        # Retornar SVG como resposta
        return Response(
            content=svg_content,
            media_type="image/svg+xml",
            headers={
                "Content-Disposition": f"inline; filename=mapa_astral_{request.name.replace(' ', '_')}.svg"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar gráfico SVG: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
