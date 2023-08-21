from dataclasses import dataclass
from datetime import datetime
import time

import psycopg2 as pg
from psycopg2.errorcodes import UNIQUE_VIOLATION
from psycopg2 import errors

import src.postgres_defaults as pod


@dataclass
class AccountInteractor:
    db_name: str = pod.db_name
    db_user: str = pod.db_user
    db_pass: str = pod.db_pass
    db_host: str = pod.db_host
    db_port: str = pod.db_port

    def __post_init__(self):
        attempts = 0
        while True:
            try:
                self.connection = pg.connect(database=self.db_name,
                                             user=self.db_user,
                                             password=self.db_pass,
                                             host=self.db_host,
                                             port=self.db_port)
                break
            except:
                print("Could not connect... Trying again in one second")
                time.sleep(1)
                attempts += 1
                if attempts == 10:
                    Exception("Could Not Connect")

    def create_account(self, role_id, first_name, last_name, username, password_hash, salt):
        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute("""
                insert into accounts (role_id, first_name, last_name, created_on, username, password, salt, locked,
                log_in_attempts) values (%(role_id)s, %(first_name)s, %(last_name)s, %(created_on)s, %(username)s,
                 %(password)s, %(salt)s, %(locked)s, %(log_in_attempts)s);""", {'role_id': role_id,
                                                                                'first_name': first_name,
                                                                                'last_name': last_name,
                                                                                'created_on': datetime.now(),
                                                                                'username': username,
                                                                                'password': password_hash,
                                                                                'salt': salt,
                                                                                'locked': False,
                                                                                'log_in_attempts': 0,
                                                                                })
                return True
        except Exception as e:
            print(e)
            return False

    def get_account_by_username(self, username):
        result = None
        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute(f"select * from accounts where username = %(username)s;", {'username': username})
                result = cur.fetchone()

            return Account(*result) if result is not None else None

        except Exception as e:
            print(e)
            return result

    def get_accounts(self):
        fetched_accounts = []
        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute(f"select * from accounts;")
                fetched_accounts = cur.fetchall()

                return [Account(*a) for a in fetched_accounts]

        except Exception as e:
            print(e)
            return fetched_accounts

    def get_account_by_id(self, id):
        result = None
        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute(f"select * from accounts where account_id = %(id)s;", {'id': id})
                result = cur.fetchone()

            return Account(*result) if result is not None else None

        except Exception as e:
            print(e)
            return result


@dataclass
class Account:
    account_id: int
    role_id: int
    first_name: str
    last_name: str
    created_on: datetime
    user_name: str
    password: str
    salt: int
    locked: bool
    log_in_attempts: int
