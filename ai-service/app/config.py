from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str
    port: int

    groq_api_key: str
    groq_model: str

    database_url: str

    ai_sql_max_rows: int
    ai_sql_timeout_seconds: int
    max_upload_mb: int

    ocr_languages: str
    tesseract_cmd: str
    pdf_dpi: int

    mistral_base_model: str
    mistral_adapter_path: str
    mistral_device: str

    cors_origins: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()