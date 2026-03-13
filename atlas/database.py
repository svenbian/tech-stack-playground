"""
Atlas database setup — extends the existing database.db with
tables for goals, progress logs, financial entries, and learning sessions.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database.db")


def init_atlas_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS atlas_goals (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            category    TEXT    NOT NULL,   -- career | finance | learning | personal
            goal        TEXT    NOT NULL,
            deadline    TEXT,
            status      TEXT    NOT NULL DEFAULT 'active',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS atlas_progress (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id     INTEGER NOT NULL,
            notes       TEXT    NOT NULL,
            logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (goal_id) REFERENCES atlas_goals(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS atlas_finances (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            type        TEXT    NOT NULL,   -- income | expense | savings
            amount      REAL    NOT NULL,
            category    TEXT    NOT NULL,   -- e.g. salary, rent, course, tools
            description TEXT    NOT NULL,
            logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS atlas_learning (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            topic           TEXT    NOT NULL,
            duration_mins   INTEGER NOT NULL,
            resource        TEXT,           -- book, course, docs, project
            notes           TEXT,
            logged_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print(f"Atlas DB ready at {DB_PATH}")


if __name__ == "__main__":
    init_atlas_db()
