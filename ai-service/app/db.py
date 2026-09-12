from sqlalchemy import create_engine,text
from app.config import Settings
s=Settings(); engine=create_engine(s.database_url,pool_pre_ping=True,connect_args={'connect_timeout':5})
def ping():
    with engine.connect() as c:c.execute(text('SELECT 1'))
def execute(sql):
    with engine.connect() as c:
        c.execute(text(f'SET LOCAL statement_timeout = {s.ai_sql_timeout_seconds*1000}'))
        return [dict(r) for r in c.execute(text(sql)).mappings().fetchmany(s.ai_sql_max_rows)]
