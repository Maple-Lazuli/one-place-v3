import src.interactions.role_interactor as ri
import src.postgres_defaults as pod


def test_defaults():
    interactor = ri.RoleInteractor()
    assert interactor.db_name == pod.db_name
    assert interactor.db_user == pod.db_user
    assert interactor.db_pass == pod.db_pass
    assert interactor.db_host == pod.db_host
    assert interactor.db_port == pod.db_port


def test_create():
    assert len(ri.RoleInteractor().get_roles()) == 0
    assert ri.RoleInteractor().create_new_role("Temp")
    assert len(ri.RoleInteractor().get_roles()) == 1


def test_get():
    first_result = ri.RoleInteractor().get_roles()[0]
    assert first_result.role_name == 'Temp'
    by_id = ri.RoleInteractor().get_role(first_result.role_id)
    assert first_result.role_id == by_id.role_id
    assert first_result.role_name == by_id.role_name
