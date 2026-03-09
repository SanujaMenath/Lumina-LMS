from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration."""

    model_config = SettingsConfigDict(env_prefix="LECTUREAI_", env_file=".env", extra="ignore")

    ollama_base_url: str = "http://localhost:11434"
    planner_model_name: str = "gemma3:4b"
    embedding_model_name: str = "nomic-embed-text:latest"

    assessment_llm_timeout_seconds: float = 60.0
    assessment_critic_timeout_seconds: float = 45.0
    assessment_max_attempt_multiplier: int = 4

    base_data_dir: Path = Path("data")
    chroma_db_dir: Path = base_data_dir / "chroma"
    uploads_dir: Path = base_data_dir / "uploads"


settings = Settings()

settings.base_data_dir.mkdir(parents=True, exist_ok=True)
settings.chroma_db_dir.mkdir(parents=True, exist_ok=True)
settings.uploads_dir.mkdir(parents=True, exist_ok=True)

