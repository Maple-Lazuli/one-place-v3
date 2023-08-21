import src.interactions.role_interactor as ri
import src.interactions.account_interactor as ai
import src.postgres_defaults as pod

from datetime import datetime


def test_defaults():
    interactor = ai.AccountInteractor()
    assert interactor.db_name == pod.db_name
    assert interactor.db_user == pod.db_user
    assert interactor.db_pass == pod.db_pass
    assert interactor.db_host == pod.db_host
    assert interactor.db_port == pod.db_port


def test_create_and_get():
    assert len(ai.AccountInteractor().get_accounts()) == 0

    role_name = "TempForAccount"
    ri.RoleInteractor().create_new_role(role_name)
    role = ri.RoleInteractor().get_roles()[-1]

    first_name = "Testname1"
    last_name = "Testname2"
    user_name = "Username"
    password = "123!@#"
    salt = 1
    locked = False
    log_ins = 0

    before_create = datetime.now()

    assert ai.AccountInteractor().create_account(role_id=role.role_id,
                                                 first_name=first_name,
                                                 last_name=last_name,
                                                 username=user_name,
                                                 password_hash=password,
                                                 salt=salt)

    fetched_account = ai.AccountInteractor().get_account_by_username(username=user_name)

    assert fetched_account.first_name == first_name
    assert fetched_account.last_name == last_name
    assert fetched_account.user_name == user_name
    assert fetched_account.password == password
    assert fetched_account.salt == salt
    assert fetched_account.locked == locked
    assert fetched_account.log_in_attempts == log_ins
    assert fetched_account.created_on > before_create
    assert fetched_account.created_on < datetime.now()

    assert len(ai.AccountInteractor().get_accounts()) == 1

    # should violate unique name
    assert not ai.AccountInteractor().create_account(role_id=role.role_id,
                                                     first_name=first_name,
                                                     last_name=last_name,
                                                     username=user_name,
                                                     password_hash=password,
                                                     salt=salt)

    fetched_account2 = ai.AccountInteractor().get_account_by_id(fetched_account.account_id)

    assert fetched_account.first_name == fetched_account2.first_name
    assert fetched_account.last_name == fetched_account2.last_name
    assert fetched_account.user_name == fetched_account2.user_name
    assert fetched_account.password == fetched_account2.password
    assert fetched_account.salt == fetched_account2.salt
    assert fetched_account.locked == fetched_account2.locked
    assert fetched_account.log_in_attempts == fetched_account2.log_in_attempts
    assert fetched_account.created_on == fetched_account2.created_on
