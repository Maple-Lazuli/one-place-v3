from dataclasses import dataclass
import time

import psycopg2 as pg
from psycopg2.errorcodes import UNIQUE_VIOLATION
from psycopg2 import errors

import src.postgres_defaults as pod


@dataclass
class RoleInteractor:
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

    def create_new_role(self, role_name):
        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute("insert into roles (role_name) values (%(r)s);", {'r': role_name})

            return True

        except errors.lookup(UNIQUE_VIOLATION) as e:
            print(e)
            return False

        except Exception as e:
            print(e)
            return False

    def get_roles(self):
        fetched_roles = []
        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute(f"select * from roles;")
                fetched_roles = cur.fetchall()

            return [Role(*r) for r in fetched_roles]

        except Exception as e:
            print(e)
            return fetched_roles

    def get_role(self, role_id):

        try:
            with self.connection, self.connection.cursor() as cur:
                cur.execute(f"select * from roles where role_id = %(u)s;", {'u': role_id})
                result = cur.fetchone()
            return Role(*result) if result is not None else None

        except Exception as e:
            print(e)
            return None


@dataclass
class Role:
    role_id: int
    role_name: str
