from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import os
from dotenv import load_dotenv

# Load secrets from .env file
load_dotenv(dotenv_path="../.env")

app = FastAPI(title="FinanceOS API", version="1.0")

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

class Property(BaseModel): name: str; tenant: str; rent: int; due_day: int
class Liability(BaseModel): name: str; amount: int; due_day: int

@app.get("/api/dashboard")
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT SUM(rent) as totalRent FROM properties")
    rent = cursor.fetchone()['totalRent'] or 0
    cursor.execute("SELECT SUM(amount) as totalEmi FROM liabilities")
    emi = cursor.fetchone()['totalEmi'] or 0
    conn.close()
    return {"totalRent": int(rent), "totalEmi": int(emi)}

@app.get("/api/properties")
def get_props():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM properties")
    rows = cursor.fetchall()
    conn.close()
    return rows

@app.post("/api/properties")
def add_prop(p: Property):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO properties (name, tenant, rent, due_day) VALUES (%s, %s, %s, %s)",
        (p.name, p.tenant, p.rent, p.due_day)
    )
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/liabilities")
def get_libs():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM liabilities")
    rows = cursor.fetchall()
    conn.close()
    return rows

@app.post("/api/liabilities")
def add_lib(l: Liability):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO liabilities (name, amount, due_day) VALUES (%s, %s, %s)",
        (l.name, l.amount, l.due_day)
    )
    conn.commit()
    conn.close()
    return {"status": "success"}
