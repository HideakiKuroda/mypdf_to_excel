from dotenv import load_dotenv
import mysql.connector
import os

# Load .env variables
load_dotenv()

# MySQL configuration from environment
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")

# Optional: path to your schema file
SCHEMA_FILE = "schema.sql"

def get_connection():
    """Returns a MySQL database connection."""
    return mysql.connector.connect(
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        host=MYSQL_HOST,
        database=MYSQL_DATABASE,
    )

# List of expected table names (must match the schema.sql)
REQUIRED_TABLES = [
    "operating_vessels",
    "ports",
    "agents",
    "escort_locations",
    "loaded_cargo",
    "berths",
    "master_towing"
]

def table_exists(cursor, table_name):
    """Check if a table exists in the MySQL database."""
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = %s AND table_name = %s;
    """, (MYSQL_DATABASE, table_name))
    return cursor.fetchone() is not None

def initialize_database():
    """Initialize the database schema if required tables are missing."""
    conn = get_connection()
    cursor = conn.cursor()

    missing_tables = [table for table in REQUIRED_TABLES if not table_exists(cursor, table)]

    if missing_tables:
        print(f"Missing tables: {', '.join(missing_tables)}")
        print("Initializing schema from file...")

        try:
            with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            for stmt in schema_sql.split(";"):
                stmt = stmt.strip()
                if stmt:
                    cursor.execute(stmt)
            conn.commit()
            print("Tables created.")
        except Exception as e:
            print(f"Error loading schema.sql: {e}")
    else:
        print("All required tables already exist.")

    cursor.close()
    conn.close()
