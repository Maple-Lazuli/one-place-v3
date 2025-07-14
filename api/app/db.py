import psycopg2

DB_CONFIG = {
    "dbname": "mydatabase",
    "user": "myuser",
    "password": "mypassword",
    "host": "localhost",
    "port": "5432",
}


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)
