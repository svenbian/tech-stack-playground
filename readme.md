# Tech Stack Playground (Python + SQL)

Small backend fundamentals project to stay sharp on:
- Python backend logic
- SQL querying (SELECT, WHERE, COUNT)
- JOINs across related tables
- API-style thinking (request → logic → database → response)

## What it does
- Creates a SQLite database locally
- Stores users and orders
- Queries:
  - all users
  - users filtered by email
  - user count
  - users joined with their orders

## Why I built this
To practice the core building blocks behind technical support and developer-facing troubleshooting: understanding data flow, querying databases, and explaining results clearly.


## Project overview
A small backend API built with FastAPI and SQLite to practise core backend concepts.The service exposes REST endpoints  to retrieve users, fetch users by ID, search users via query parameters and return aggregate data such as user count. The project focuses on clean API design, properr HTTP status codes and real-world debugging scenarios(e.g. route resolution)

## Endpoints
GET /users
GET /users/{user_id}
GET /users/search?email=
GET /users/count
GET /health

## Key learnings
Path vs query parameters
HTTP status codes (200, 404, 422, 500)
Error handling
Route ordering in FastAPI