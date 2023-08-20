import src.postgres_defaults as pod


def test_defaults():
    assert pod.db_name == 'inventory_db'
    assert pod.db_user == 'postgres'
    assert pod.db_pass == 'postgres'
    assert pod.db_host == '0.0.0.0'
    assert pod.db_port == '5432'


def test_generate_code():
    assert len(pod.generate_code()) == 128
    assert pod.generate_code() != pod.generate_code()
