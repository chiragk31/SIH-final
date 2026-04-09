import psycopg2
import os

DB_URL = "postgresql://postgres.uqptaoiaprmqxadngweg:ChiragVaaniPath@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
fallback_url = "postgresql://postgres.uqptaoiaprmqxadngweg:ChiragVaaniPath@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

def run():
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        with open('database/add_missing_columns2.sql', 'r') as f:
            sql = f.read()
        
        cursor.execute(sql)
        print("Success: added missing columns")
        
        # reload schema
        cursor.execute("NOTIFY pgrst, 'reload schema';")
        print("Success: reloaded schema")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        try:
            conn = psycopg2.connect(fallback_url)
            conn.autocommit = True
            cursor = conn.cursor()
            with open('database/add_missing_columns2.sql', 'r') as f:
                sql = f.read()
            cursor.execute(sql)
            print("Success (fallback): added missing columns")
            cursor.execute("NOTIFY pgrst, 'reload schema';")
            print("Success (fallback): reloaded schema")
        except Exception as e2:
            print(f"Fallback Error: {e2}")

if __name__ == '__main__':
    run()
