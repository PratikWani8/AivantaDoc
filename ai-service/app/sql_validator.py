import re,sqlglot
from sqlglot import exp
from app.schema_registry import TABLES
FORBIDDEN={'INSERT','UPDATE','DELETE','DROP','ALTER','TRUNCATE','CREATE','GRANT','REVOKE','MERGE','CALL','EXEC','COPY','DO'}
def validate(sql):
    if not isinstance(sql,str) or not re.match(r'^SELECT\b',sql.strip(),re.I): raise ValueError('Only SELECT statements are allowed')
    sql=sql.strip()
    if ';' in sql or '--' in sql or '/*' in sql or '*/' in sql: raise ValueError('Multiple statements/comments are not allowed')
    if any(re.search(rf'\b{x}\b',sql,re.I) for x in FORBIDDEN): raise ValueError('Forbidden SQL operation')
    try: tree=sqlglot.parse_one(sql,read='postgres')
    except Exception as e: raise ValueError('SQL could not be parsed') from e
    if not isinstance(tree,exp.Select): raise ValueError('Only SELECT statements are allowed')
    cols=set(c for v in TABLES.values() for c in v)
    for t in tree.find_all(exp.Table):
        if t.name not in TABLES: raise ValueError(f'Unknown table: {t.name}')
    for c in tree.find_all(exp.Column):
        if c.name!='*' and c.name not in cols: raise ValueError(f'Unknown column: {c.name}')
    return sql
