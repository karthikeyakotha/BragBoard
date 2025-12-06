import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bragboard_db_whbd_user:rXOiIWao0pRg0HMRUuoGHdsaMJUMnv2o@dpg-d4pv2avdiees73900hbg-a/bragboard_db_whbd")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        logger.info("Database connection successful")
        yield db
    finally:
        db.close()
        logger.info("Database connection closed")
