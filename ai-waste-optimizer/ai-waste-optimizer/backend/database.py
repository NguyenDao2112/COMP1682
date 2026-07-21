# database.py - Database configuration and connection
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./waste_optimizer.db"
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Determine absolute path for SQLite database so the file is consistent
# no matter which directory the app is started from.
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
default_sqlite_path = os.path.join(project_root, "waste_optimizer.db")

# Use SQLite by default for local development (no database required)
# Override by setting DATABASE_URL in .env to use PostgreSQL or a custom path.
database_url = settings.database_url
if database_url.startswith("sqlite:///"):
    sqlite_path = database_url.replace("sqlite:///", "")
    if not os.path.isabs(sqlite_path):
        abs_sqlite_path = os.path.normpath(os.path.join(project_root, sqlite_path))
        database_url = "sqlite:///" + abs_sqlite_path.replace("\\", "/")
elif database_url == "sqlite://" or database_url == "sqlite://./waste_optimizer.db":
    database_url = "sqlite:///" + default_sqlite_path.replace("\\", "/")

if "postgresql" in database_url or "postgres" in database_url:
    # Use PostgreSQL
    engine = create_engine(database_url, echo=False)
    # Test connection
    try:
        with engine.connect() as conn:
            conn.scalar("SELECT 1")
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        print("Falling back to SQLite for development...")
        database_url = "sqlite:///" + default_sqlite_path.replace("\\", "/")
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    # Use SQLite for development without PostgreSQL
    engine = create_engine(database_url, connect_args={"check_same_thread": False})

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
