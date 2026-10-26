import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Q-Escrow"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    SECRET_KEY: str = "development-secret-key-change-in-production-min-32-chars-long"
    SESSION_EXPIRE_MINUTES: int = 240
    CSRF_SECRET_KEY: str = "development-csrf-secret-key-min-32-chars-long"

    DATABASE_URL: str = "sqlite:///./q_escrow.db"
    DB_ECHO: bool = False

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    DEFAULT_ML_DSA_PARAMETER_SET: str = "ML-DSA-65"

    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    CHAIN_ID: int = 31337
    ALLOW_BLOCKCHAIN_SIMULATION: bool = True
    ESCROW_CONTRACT_ADDRESS: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    EMAIL_PROVIDER: str = "console"
    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "no-reply@q-escrow.example.com"

    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_REGISTER_PER_MINUTE: int = 10
    RATE_LIMIT_API_PER_MINUTE: int = 300

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10485760  # 10 MB
    ALLOWED_EVIDENCE_EXTENSIONS: str = ".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @computed_field
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @computed_field
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_EVIDENCE_EXTENSIONS.split(",") if ext.strip()]

settings = Settings()
