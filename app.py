from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
import sqlite3

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
def index():
    return FileResponse("static/index.html")
DB_PATH = "database.db"

#def get_db_connection():
 #   conn = sqlite3.connect("database.db")
  #  conn.row_factory = sqlite3.Row
   # return conn

class UserCreate(BaseModel):
    name: str
    email: EmailStr

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
    
@app.get("/users/search")
def search_user(email: EmailStr = Query(..., description="User email to search for")):
    try:
        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (str(email),)
        ).fetchone()
        conn.close()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        return dict(user)

    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database query error: {e}"
        )     

@app.get("/users/count")
def get_user_count():
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()
        conn.close()
        return {"count": row["count"]}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {e}")
       

@app.get("/users/{user_id}")
def get_user(user_id: int):
     try:
         conn = get_db_connection()
         user = conn.execute("SELECT * FROM users WHERE     ID = ?", (user_id,)).fetchone()
         conn.close()
         if user is None:
           raise HTTPException(status_code=404, detail="User not found")
    
         return dict(user)
     except sqlite3.Error as e:
         raise HTTPException(
             status_code=500,
             detail=f"Database query error: {e}"
         )

@app.post("/users", status_code=201)
def create_user(payload: UserCreate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            (payload.name, str(payload.email)),
        )
        conn.commit()

        user_id = cursor.lastrowid
        user = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        conn.close()

        return dict(user)
    
    except sqlite3.IntegrityError:
        #useful if you later add UNIQUE(email)
        raise HTTPException(status_code=409, detail="Email already exists")
    
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {e}")