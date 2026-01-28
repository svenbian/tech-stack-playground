from fastapi import FastAPI, HTTPException
import sqlite3

app = FastAPI()
DB_PATH = "database.db"

#def get_db_connection():
 #   conn = sqlite3.connect("database.db")
  #  conn.row_factory = sqlite3.Row
   # return conn

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)#
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        raise HHTPException(status_code=500, detail=f"Database connection error: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/users")
def get_users():
    try:
        conn = get_db_connection()
        users = conn.execute("SELECT * FROM users").fetchall()
        conn.close()
        return [dict(user) for user in users]
    except sqlite3.Error as e:
        raise HHTPException(status_code=500, detail=f"Database query error: {e}")

@app.get("/users/{user.id}")
def get_user(user_id: int):
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE     ID = ?", (user_id,)).fetchone()
        conn.close()
        if user is None:
           raise HTTPException(status_code=404, detail="User not found")
    
        return dict(user)

@app.get("/users/count")
def get_user_count():
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()
        conn.close()
        return {"count": row["count"]}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {e}")