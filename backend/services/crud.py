import mysql.connector
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "vessel_management")


def get_connection():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE
    )

# -----------------------
# Generic Helpers
# -----------------------

def fetch_all(cur) -> List[Dict[str, Any]]:
    columns = [col[0] for col in cur.description]
    return [dict(zip(columns, row)) for row in cur.fetchall()]

def fetch_one(cur) -> Optional[Dict[str, Any]]:
    row = cur.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cur.description]
    return dict(zip(columns, row))

# -----------------------
# Reusable CRUD Template
# -----------------------

def create_entity(table: str, name: str, short_name: Optional[str], created_by: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    query = f"""
        INSERT INTO {table} (name, short_name, created_at, created_by, updated_at, updated_by)
        VALUES (%s, %s, NOW(), %s, NOW(), %s)
    """
    cur.execute(query, (name, short_name, created_by, created_by))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id

def get_entity(table: str, id_: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table} WHERE id=%s AND deleted_at IS NULL", (id_,))
    result = fetch_one(cur)
    conn.close()
    return result

def update_entity(table: str, id_: int, name: str, short_name: Optional[str], updated_by: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    query = f"""
        UPDATE {table}
        SET name=%s, short_name=%s, updated_at=NOW(), updated_by=%s
        WHERE id=%s AND deleted_at IS NULL
    """
    cur.execute(query, (name, short_name, updated_by, id_))
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated

def delete_entity(table: str, id_: int, deleted_by: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {table} SET deleted_at=NOW(), deleted_by=%s
        WHERE id=%s AND deleted_at IS NULL
    """, (deleted_by, id_))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted

def list_entities(table: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table} WHERE deleted_at IS NULL ORDER BY updated_at DESC")
    results = fetch_all(cur)
    conn.close()
    return results

# -----------------------
# Specific Entities
# -----------------------

# Replace <entity_name> with actual table name below.

# Operating Vessels
create_operating_vessel = lambda name, sn, by: create_entity("operating_vessels", name, sn, by)
get_operating_vessel = lambda id_: get_entity("operating_vessels", id_)
update_operating_vessel = lambda id_, name, sn, by: update_entity("operating_vessels", id_, name, sn, by)
delete_operating_vessel = lambda id_, by: delete_entity("operating_vessels", id_, by)
list_operating_vessels = lambda: list_entities("operating_vessels")

# Ports
create_port = lambda name, sn, by: create_entity("ports", name, sn, by)
get_port = lambda id_: get_entity("ports", id_)
update_port = lambda id_, name, sn, by: update_entity("ports", id_, name, sn, by)
delete_port = lambda id_, by: delete_entity("ports", id_, by)
list_ports = lambda: list_entities("ports")

# Agents
create_agent = lambda name, sn, by: create_entity("agents", name, sn, by)
get_agent = lambda id_: get_entity("agents", id_)
update_agent = lambda id_, name, sn, by: update_entity("agents", id_, name, sn, by)
delete_agent = lambda id_, by: delete_entity("agents", id_, by)
list_agents = lambda: list_entities("agents")

# Escort Locations
create_escort_location = lambda name, sn, by: create_entity("escort_locations", name, sn, by)
get_escort_location = lambda id_: get_entity("escort_locations", id_)
update_escort_location = lambda id_, name, sn, by: update_entity("escort_locations", id_, name, sn, by)
delete_escort_location = lambda id_, by: delete_entity("escort_locations", id_, by)
list_escort_locations = lambda: list_entities("escort_locations")

# Loaded Cargo
create_loaded_cargo = lambda name, sn, by: create_entity("loaded_cargo", name, sn, by)
get_loaded_cargo = lambda id_: get_entity("loaded_cargo", id_)
update_loaded_cargo = lambda id_, name, sn, by: update_entity("loaded_cargo", id_, name, sn, by)
delete_loaded_cargo = lambda id_, by: delete_entity("loaded_cargo", id_, by)
list_loaded_cargo = lambda: list_entities("loaded_cargo")

# Berths (with port_id)
def create_berth(name: str, short_name: Optional[str], port_id: Optional[int], created_by: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO berths (name, short_name, port_id, created_at, created_by, updated_at, updated_by)
        VALUES (%s, %s, %s, NOW(), %s, NOW(), %s)
    """, (name, short_name, port_id, created_by, created_by))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id

def get_berth(id_: int): return get_entity("berths", id_)
def update_berth(id_: int, name: str, short_name: Optional[str], port_id: Optional[int], updated_by: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE berths SET name=%s, short_name=%s, port_id=%s, updated_at=NOW(), updated_by=%s
        WHERE id=%s AND deleted_at IS NULL
    """, (name, short_name, port_id, updated_by, id_))
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated

def delete_berth(id_: int, deleted_by: str) -> bool:
    return delete_entity("berths", id_, deleted_by)

def list_berths() -> List[Dict[str, Any]]:
    return list_entities("berths")

# Master Towing (with t_name and ps fields)
def create_master_towing(name: str, short_name: Optional[str], t_name: Optional[str], ps: Optional[str], created_by: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO master_towing (name, short_name, t_name, ps, created_at, created_by, updated_at, updated_by)
        VALUES (%s, %s, %s, %s, NOW(), %s, NOW(), %s)
    """, (name, short_name, t_name, ps, created_by, created_by))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id

def get_master_towing(id_: int): return get_entity("master_towing", id_)
def update_master_towing(id_: int, name: str, short_name: str, t_name: str, ps: Optional[str], updated_by: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE master_towing SET name=%s, short_name=%s, t_name=%s, ps=%s, updated_at=NOW(), updated_by=%s
        WHERE id=%s AND deleted_at IS NULL
    """, (name, short_name, t_name, ps, updated_by, id_))
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated

def delete_master_towing(id_: int, deleted_by: str) -> bool:
    return delete_entity("master_towing", id_, deleted_by)

def list_master_towing() -> List[Dict[str, Any]]:
    return list_entities("master_towing")

# -----------------------
# emps CRUD
# -----------------------

def create_emp(ship_name: str, dw: int, loaded_cargo_name: str, created_by: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO emps (ship_name, dw, loaded_cargo_name, created_at, created_by, updated_at, updated_by)
        VALUES (%s, %s, %s, NOW(), %s, NOW(), %s)
    """, (ship_name, dw, loaded_cargo_name, created_by, created_by))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id

def create_multiple_emps(emps: List[Dict[str, Any]]) -> List[int]:
    if not emps:
        return []

    conn = get_connection()
    cur = conn.cursor()

    # Generate unique session ID to find inserted records later
    session_id = str(uuid.uuid4())

    # Add session_id to each row
    for emp in emps:
        emp["session_id"] = session_id

    query = """
        INSERT INTO emps (ship_name, dw, loaded_cargo_name, data_date, created_at, created_by, updated_at, updated_by, session_id)
        VALUES (%s, %s, %s, %s, NOW(), %s, NOW(), %s, %s)
    """
    values = [
        (e["ship_name"], e["dw"], e["loaded_cargo_name"],  e['data_date'], e["created_by"],  e["created_by"], e["session_id"])
        for e in emps
    ]

    cur.executemany(query, values)
    conn.commit()

    # Retrieve inserted rows using session_id
    cur.execute("SELECT id FROM emps WHERE session_id = %s", (session_id,))
    ids = [row[0] for row in cur.fetchall()]

    conn.close()
    return ids


def get_emp(id_: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM emps WHERE id=%s AND deleted_at IS NULL", (id_,))
    result = fetch_one(cur)
    conn.close()
    return result

def update_emp(id_: int, ship_name: str, dw: str, loaded_cargo_name: str, updated_by: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE emps
        SET ship_name=%s, dw=%s, loaded_cargo_name=%s, updated_at=NOW(), updated_by=%s
        WHERE id=%s AND deleted_at IS NULL
    """, (ship_name, dw, loaded_cargo_name, updated_by, id_))
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated

def delete_emp(id_: int, deleted_by: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE emps
        SET deleted_at=NOW(), deleted_by=%s
        WHERE id=%s AND deleted_at IS NULL
    """, (deleted_by, id_))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted

def list_emps() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM emps WHERE deleted_at IS NULL ORDER BY updated_at DESC")
    results = fetch_all(cur)
    conn.close()
    return results
