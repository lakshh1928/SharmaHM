import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from sqlalchemy.sql import func

DB_USER = os.getenv("DB_USER", "finance_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "finance_password")
DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "finance_app")

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:3306/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    tenant = Column(String(255))
    rent = Column(Integer)
    due_day = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())

    history = relationship("PropertyHistory", back_populates="property", cascade="all, delete-orphan")

class PropertyHistory(Base):
    __tablename__ = "property_history"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"))
    entry_type = Column(String(50))  # "Rent Received" or "Light Bill"
    amount = Column(Integer)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())

    property = relationship("Property", back_populates="history")

class Liability(Base):
    __tablename__ = "liabilities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    amount = Column(Integer)
    due_day = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class PropertyCreate(BaseModel):
    name: str
    tenant: str
    rent: int
    due_day: int = 1

class PropertyUpdate(BaseModel):
    name: str
    rent: int

class HistoryCreate(BaseModel):
    entry_type: str
    amount: int
    notes: str = ""

class LiabilityCreate(BaseModel):
    name: str
    amount: int
    due_day: int = 1

class LiabilityUpdate(BaseModel):
    name: str
    amount: int

# --- API Endpoints ---

@app.get("/api/properties")
def get_properties(db: Session = Depends(get_db)):
    return db.query(Property).all()

@app.post("/api/properties")
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    new_prop = Property(**property_data.model_dump())
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    return new_prop

@app.put("/api/properties/{prop_id}")
def update_property(prop_id: int, property_data: PropertyUpdate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.name = property_data.name
    prop.rent = property_data.rent
    db.commit()
    return prop

@app.delete("/api/properties/{prop_id}")
def delete_property(prop_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"status": "success"}

# Tenant History Endpoints
@app.get("/api/properties/{prop_id}/history")
def get_property_history(prop_id: int, db: Session = Depends(get_db)):
    return db.query(PropertyHistory).filter(PropertyHistory.property_id == prop_id).order_by(PropertyHistory.created_at.desc()).all()

@app.post("/api/properties/{prop_id}/history")
def add_property_history(prop_id: int, history_data: HistoryCreate, db: Session = Depends(get_db)):
    entry = PropertyHistory(
        property_id=prop_id,
        entry_type=history_data.entry_type,
        amount=history_data.amount,
        notes=history_data.notes
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

# Liabilities Endpoints
@app.get("/api/liabilities")
def get_liabilities(db: Session = Depends(get_db)):
    return db.query(Liability).all()

@app.post("/api/liabilities")
def create_liability(liability_data: LiabilityCreate, db: Session = Depends(get_db)):
    new_liab = Liability(**liability_data.model_dump())
    db.add(new_liab)
    db.commit()
    db.refresh(new_liab)
    return new_liab

@app.put("/api/liabilities/{liab_id}")
def update_liability(liab_id: int, liability_data: LiabilityUpdate, db: Session = Depends(get_db)):
    liab = db.query(Liability).filter(Liability.id == liab_id).first()
    if not liab:
        raise HTTPException(status_code=404, detail="Liability not found")
    liab.name = liability_data.name
    liab.amount = liability_data.amount
    db.commit()
    return liab

@app.delete("/api/liabilities/{liab_id}")
def delete_liability(liab_id: int, db: Session = Depends(get_db)):
    liab = db.query(Liability).filter(Liability.id == liab_id).first()
    if not liab:
        raise HTTPException(status_code=404, detail="Liability not found")
    db.delete(liab)
    db.commit()
    return {"status": "success"}

# Dashboard
@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    properties = db.query(Property).all()
    liabilities = db.query(Liability).all()
    total_rent = sum(p.rent for p in properties)
    total_emi = sum(l.amount for l in liabilities)
    return {"totalRent": total_rent, "totalEmi": total_emi}
