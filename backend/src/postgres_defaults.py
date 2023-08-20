import random

from datetime import datetime
import hashlib

db_name = 'inventory_db'
db_user = 'postgres'
db_pass = 'postgres'
db_host = '0.0.0.0'  # postgres
db_port = '5432'


def generate_code():
    hasher = hashlib.sha512()
    hasher.update(f"{datetime.now()} {random.randint(1, 100000)}".encode())
    return hasher.hexdigest()
