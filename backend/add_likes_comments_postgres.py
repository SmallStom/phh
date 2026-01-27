import psycopg2
from psycopg2 import sql
from app.config import settings

def add_likes_and_comments_tables():
    conn = psycopg2.connect(settings.DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                record_id UUID NOT NULL,
                user_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(record_id, user_id)
            )
        """)
        print("Created likes table")
        
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_likes_tenant_id ON likes(tenant_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_likes_record_id ON likes(record_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_likes_user_id ON likes(user_id)")
        print("Created indexes for likes table")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                record_id UUID NOT NULL,
                user_id UUID NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        print("Created comments table")
        
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_comments_tenant_id ON comments(tenant_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_comments_record_id ON comments(record_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_comments_user_id ON comments(user_id)")
        print("Created indexes for comments table")
        
        conn.commit()
        print("\nDatabase tables created successfully!")
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_likes_and_comments_tables()
