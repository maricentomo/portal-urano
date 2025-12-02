import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Obter URL do banco de dados das variáveis de ambiente
# No Railway, a variável geralmente é DATABASE_URL
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

# Fallback para SQLite local se não houver URL configurada (para testes locais)
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# Criar engine
# Para PostgreSQL (Railway), pode ser necessário substituir postgres:// por postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Criar sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Dependência para obter sessão do DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
