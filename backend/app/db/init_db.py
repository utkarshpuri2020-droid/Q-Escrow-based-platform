from app.db.session import engine, Base
import app.models  # Ensures all models are registered

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Creating all database tables...")
    init_db()
    print("Database tables created successfully!")
