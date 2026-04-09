import psycopg2
import os

DB_URL = "postgresql://postgres.uqptaoiaprmqxadngweg:ChiragVaaniPath@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

files = [
    "database/schema.sql",
    "database/quiz_doubts_schema.sql",
    "database/processing_jobs_table.sql",
    "database/add_users_insert_policy.sql",
    "database/fix_users_policies.sql",
    "migrations/001_create_courses_and_enrollments.sql",
    "migrations/003_add_missing_columns.sql",
    "database/migrations/add_content_type.sql",
    "database/migrations/FIX_SCHEMA_CACHE.sql",
    "database/migrations/FIX_TRANSLATIONS_SCHEMA.sql"
]

def run_migrations():
    try:
        # Try connection directly to 5432
        print(f"Connecting to {DB_URL}...")
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        for file in files:
            if os.path.exists(file):
                print(f"Executing {file}...")
                with open(file, 'r', encoding='utf-8') as f:
                    sql = f.read()
                try:
                    cursor.execute(sql)
                    print(f"Success: {file}")
                except Exception as e:
                    print(f"Error executing {file}:\n{e}")
            else:
                print(f"File {file} not found, skipping.")
                
        cursor.close()
        conn.close()
        print("Done.")
    except Exception as e:
        print(f"Connection failed: {e}")
        # Try alternate URL
        fallback_url = "postgresql://postgres.uqptaoiaprmqxadngweg:ChiragVaaniPath@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
        try:
            print(f"Trying fallback: {fallback_url}...")
            conn = psycopg2.connect(fallback_url)
            conn.autocommit = True
            cursor = conn.cursor()
            for file in files:
                if os.path.exists(file):
                    print(f"Executing {file}...")
                    with open(file, 'r', encoding='utf-8') as f:
                        sql = f.read()
                    try:
                        cursor.execute(sql)
                        print(f"Success: {file}")
                    except Exception as e:
                        print(f"Error executing {file}:\n{e}")
            cursor.close()
            conn.close()
            print("Done via fallback.")
        except Exception as fallback_e:
            print(f"Fallback connection failed: {fallback_e}")

if __name__ == "__main__":
    run_migrations()
