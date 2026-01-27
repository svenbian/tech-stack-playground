from fastapi import FastAPI, HTTPException
import sqlite3

app = FastAPI()

def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/users")
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()

    return [dict(user) for user in users]

@app.get("/users/{user.id}")
def get_user(user_id: int):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE     ID = ?", (user_id,)).fetchone()
    conn.close()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(user)