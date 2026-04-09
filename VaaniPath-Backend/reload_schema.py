import psycopg2
import os

fallback_url = "postgresql://postgres.uqptaoiaprmqxadngweg:ChiragVaaniPath@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

def run():
    try:
        conn = psycopg2.connect(fallback_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # reload schema
        cursor.execute("NOTIFY pgrst, 'reload schema';")
        print("Success: reloaded schema")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    run()
