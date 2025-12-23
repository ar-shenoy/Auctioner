# Cricket Management Platform - Backend

Production-grade FastAPI backend for cricket management and auction system.

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with async SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (Phase 3)
- **Containerization**: Docker & Docker Compose
- **WebSockets**: For real-time auctions and matches (Phase 8)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Or: Python 3.11+, PostgreSQL 16

### Run with Docker

```bash
cd ..  # Go to project root
docker-compose up --build
```

Backend runs on `http://localhost:8000`

- Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`

### Run Locally (without Docker)

1. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start PostgreSQL and run migrations (Phase 2)

5. Start server:

```bash
uvicorn app.main:app --reload
```

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app initialization
│   ├── core/
│   │   └── config.py    # Configuration management
│   ├── db/
│   │   └── session.py   # Async SQLAlchemy setup
│   ├── api/             # API routes (Phase 3+)
│   ├── models/          # SQLAlchemy models (Phase 2+)
│   └── services/        # Business logic (Phase 3+)
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container image
└── .env.example         # Environment template
```

## Development Phases

- **PHASE 1** ✓: FastAPI + Async SQLAlchemy + Docker
- **PHASE 2**: Database models + Alembic migrations
- **PHASE 3**: JWT authentication + registration tokens
- **PHASE 4**: RBAC (Admin, Team Manager, Player)
- **PHASE 5**: Teams & Players services
- **PHASE 6**: Atomic auction engine
- **PHASE 7**: Event-sourced match scoring
- **PHASE 8**: WebSockets for live features
- **PHASE 9**: Production hardening

## API Documentation

Once running, visit `/docs` (Swagger UI) or `/redoc` (ReDoc) for interactive API documentation.

## Database Migrations (Phase 2+)

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Testing (Phase 9+)

```bash
pytest tests/ -v --cov
```

## Production Deployment

- Use proper secret key management (AWS Secrets Manager, HashiCorp Vault)
- Enable SSL/TLS
- Use managed PostgreSQL (RDS, Azure Database)
- Set `DEBUG=false`
- Use environment-specific configs
- Enable comprehensive logging
- Set up monitoring (DataDog, New Relic)
- Configure CORS appropriately

## Notes

- All database operations are async for scalability
- Transaction support for atomic operations (auctions, bidding)
- CORS pre-configured for Vite frontend on port 5173
- Health check endpoint for orchestration (K8s, etc.)
