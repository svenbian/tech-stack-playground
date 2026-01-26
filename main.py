import sqlite3

def setup_orders_table():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         user_id INTEGER NOT NULL,
         item TEXT NOT NULL,
         total REAL NOT NULL,
         FOREIGN KEY (user_id) REFERENCES users(id)
    )               
    """)
    
    conn.commit()
    conn.close()
    print("Orders table ready")

def get_all_users():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email FROM users")
    users = cursor.fetchall()

    conn.close()
    return users

def get_user_user_by_email(email):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    conn.close()
    return user

def get_user_user_count():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]

    conn.close()
    return count

def insert_sample_orders():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO orders (user_id, item, total) VALUES (?, ?, ?)", (1, "Shoes", 79.99))
    cursor.execute("INSERT INTO orders (user_id, item, total) VALUES (?, ?, ?)", (1, "T-shirt", 24.99))
    cursor.execute("INSERT INTO orders (user_id, item, total) VALUES (?, ?, ?)", (2, "Jacket", 129.99))

    conn.commit()
    conn.close()
    print("Sample orders inserted")

def get_users_with_orders():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
    SELECT users.name, users.email, orders.item, orders.total
    FROM users
    INNER JOIN orders
    ON users.id = orders.user_id                                             
    """)

    rows = cursor.fetchall()
    conn.close()
    return rows

print("Users with orders:", get_users_with_orders())
