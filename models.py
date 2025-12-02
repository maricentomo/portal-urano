from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    birth_charts = relationship("BirthChart", back_populates="owner")
    conversations = relationship("Conversation", back_populates="owner")

class BirthChart(Base):
    __tablename__ = "birth_charts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=True)
    birth_date = Column(String) # YYYY-MM-DD
    birth_time = Column(String) # HH:MM
    birth_city = Column(String)
    birth_country = Column(String)
    chart_data = Column(JSON) # Armazena o resultado do cálculo completo
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="birth_charts")
    conversations = relationship("Conversation", back_populates="birth_chart")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    birth_chart_id = Column(Integer, ForeignKey("birth_charts.id"), nullable=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="conversations")
    birth_chart = relationship("BirthChart", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role = Column(String) # 'user' ou 'assistant' (ou 'model')
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
