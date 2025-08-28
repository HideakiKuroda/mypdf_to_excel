from fastapi import APIRouter, File, UploadFile, HTTPException # type: ignore
from pydantic import BaseModel # type: ignore
import os
import shutil
import pdf_table2json.converter as converter # type: ignore
from typing import Optional, List, Dict, Any
import services.crud as crud

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Request model
class ConvertRequest(BaseModel):
    fileName: str

@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": f"Uploaded {file.filename} successfully."}

@router.post("/api/convert")
async def convert_pdf(req: ConvertRequest):
    file_path = os.path.join(UPLOAD_DIR, req.fileName)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        result = converter.main(file_path, json_file_out=False, image_file_out=False)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

# ======= Pydantic models for request/response =======
class OperatingVesselBase(BaseModel):
    name: str
    short_name: Optional[str] = None

class OperatingVesselCreate(OperatingVesselBase):
    created_by: str

class OperatingVesselUpdate(OperatingVesselBase):
    updated_by: str

class PortBase(BaseModel):
    name: str
    short_name: Optional[str] = None

class PortCreate(PortBase):
    created_by: str

class PortUpdate(PortBase):
    updated_by: str

class AgentBase(BaseModel):
    name: str
    short_name: Optional[str] = None

class AgentCreate(AgentBase):
    created_by: str

class AgentUpdate(AgentBase):
    updated_by: str

class EscortLocationBase(BaseModel):
    name: str
    short_name: Optional[str] = None

class EscortLocationCreate(EscortLocationBase):
    created_by: str

class EscortLocationUpdate(EscortLocationBase):
    updated_by: str

class LoadedCargoBase(BaseModel):
    name: str
    short_name: Optional[str] = None

class LoadedCargoCreate(LoadedCargoBase):
    created_by: str

class LoadedCargoUpdate(LoadedCargoBase):
    updated_by: str

class BerthBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    port_id: Optional[int] = None

class BerthCreate(BerthBase):
    created_by: str

class BerthUpdate(BerthBase):
    updated_by: str

class MasterTowingBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    t_name: Optional[str] = None
    ps: Optional[str] = None

class MasterTowingCreate(MasterTowingBase):
    created_by: str

class MasterTowingUpdate(MasterTowingBase):
    updated_by: str

class EmpCreate(BaseModel):
    ship_name: str
    dw: int
    loaded_cargo_name: str
    data_date: int
    created_by: str

class EmpUpdate(BaseModel):
    ship_name: str
    dw: int
    data_date: int
    loaded_cargo_name: str
    updated_by: str


# =======================
# OPERATING VESSELS ROUTES
# =======================
@router.post("/api/master/operating-vessels", response_model=Dict[str, Any])
async def create_operating_vessel(data: OperatingVesselCreate):
    return crud.get_operating_vessel(
        crud.create_operating_vessel(data.name, data.short_name, data.created_by)
    )

@router.get("/api/master/operating-vessels/{id}", response_model=Dict[str, Any])
async def get_operating_vessel(id: int):
    vessel = crud.get_operating_vessel(id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Operating vessel not found")
    return vessel

@router.put("/api/master/operating-vessels/{id}", response_model=bool)
async def update_operating_vessel(id: int, data: OperatingVesselUpdate):
    updated = crud.update_operating_vessel(id, data.name, data.short_name, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Operating vessel not found or already deleted")
    return updated

@router.delete("/api/master/operating-vessels/{id}", response_model=bool)
async def delete_operating_vessel(id: int, deleted_by: str):
    deleted = crud.delete_operating_vessel(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Operating vessel not found or already deleted")
    return deleted

@router.get("/api/master/operating-vessels", response_model=List[Dict[str, Any]])
async def list_operating_vessels():
    return crud.list_operating_vessels()


# ==============
# PORTS ROUTES
# ==============

@router.post("/api/master/ports", response_model=Dict[str, Any])
async def create_port(data: PortCreate):
    return crud.get_port(
        crud.create_port(data.name, data.short_name, data.created_by)
    )

@router.get("/api/master/ports/{id}", response_model=Dict[str, Any])
async def get_port(id: int):
    port = crud.get_port(id)
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    return port

@router.put("/api/master/ports/{id}", response_model=bool)
async def update_port(id: int, data: PortUpdate):
    updated = crud.update_port(id, data.name, data.short_name, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Port not found or already deleted")
    return updated

@router.delete("/api/master/ports/{id}", response_model=bool)
async def delete_port(id: int, deleted_by: str):
    deleted = crud.delete_port(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Port not found or already deleted")
    return deleted

@router.get("/api/master/ports", response_model=List[Dict[str, Any]])
async def list_ports():
    return crud.list_ports()


# ==============
# AGENTS ROUTES
# ==============

@router.post("/api/master/agents", response_model=Dict[str, Any])
async def create_agent(data: AgentCreate):
    return crud.get_agent(
        crud.create_agent(data.name, data.short_name, data.created_by)
    )

@router.get("/api/master/agents/{id}", response_model=Dict[str, Any])
async def get_agent(id: int):
    agent = crud.get_agent(id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/api/master/agents/{id}", response_model=bool)
async def update_agent(id: int, data: AgentUpdate):
    updated = crud.update_agent(id, data.name, data.short_name, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Agent not found or already deleted")
    return updated

@router.delete("/api/master/agents/{id}", response_model=bool)
async def delete_agent(id: int, deleted_by: str):
    deleted = crud.delete_agent(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agent not found or already deleted")
    return deleted

@router.get("/api/master/agents", response_model=List[Dict[str, Any]])
async def list_agents():
    return crud.list_agents()


# ===================
# ESCORT LOCATIONS ROUTES
# ===================

@router.post("/api/master/escort-locations", response_model=Dict[str, Any])
async def create_escort_location(data: EscortLocationCreate):
    return crud.get_escort_location(
        crud.create_escort_location(data.name, data.short_name, data.created_by)
    )

@router.get("/api/master/escort-locations/{id}", response_model=Dict[str, Any])
async def get_escort_location(id: int):
    loc = crud.get_escort_location(id)
    if not loc:
        raise HTTPException(status_code=404, detail="Escort location not found")
    return loc

@router.put("/api/master/escort-locations/{id}", response_model=bool)
async def update_escort_location(id: int, data: EscortLocationUpdate):
    updated = crud.update_escort_location(id, data.name, data.short_name, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Escort location not found or already deleted")
    return updated

@router.delete("/api/master/escort-locations/{id}", response_model=bool)
async def delete_escort_location(id: int, deleted_by: str):
    deleted = crud.delete_escort_location(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Escort location not found or already deleted")
    return deleted

@router.get("/api/master/escort-locations", response_model=List[Dict[str, Any]])
async def list_escort_locations():
    return crud.list_escort_locations()


# ===============
# LOADED CARGO ROUTES
# ===============

@router.post("/api/master/loaded-cargo", response_model=Dict[str, Any])
async def create_loaded_cargo(data: LoadedCargoCreate):
    return crud.get_loaded_cargo(
        crud.create_loaded_cargo(data.name, data.short_name, data.created_by)
    )

@router.get("/api/master/loaded-cargo/{id}", response_model=Dict[str, Any])
async def get_loaded_cargo(id: int):
    cargo = crud.get_loaded_cargo(id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Loaded cargo not found")
    return cargo

@router.put("/api/master/loaded-cargo/{id}", response_model=bool)
async def update_loaded_cargo(id: int, data: LoadedCargoUpdate):
    updated = crud.update_loaded_cargo(id, data.name, data.short_name, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Loaded cargo not found or already deleted")
    return updated

@router.delete("/api/master/loaded-cargo/{id}", response_model=bool)
async def delete_loaded_cargo(id: int, deleted_by: str):
    deleted = crud.delete_loaded_cargo(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Loaded cargo not found or already deleted")
    return deleted

@router.get("/api/master/loaded-cargo", response_model=List[Dict[str, Any]])
async def list_loaded_cargo():
    return crud.list_loaded_cargo()


# ============
# BERTHS ROUTES
# ============

@router.post("/api/master/berths", response_model=Dict[str, Any])
async def create_berth(data: BerthCreate):
    return crud.get_berth(
        crud.create_berth(data.name, data.short_name, data.port_id, data.created_by)
    )

@router.get("/api/master/berths/{id}", response_model=Dict[str, Any])
async def get_berth(id: int):
    berth = crud.get_berth(id)
    if not berth:
        raise HTTPException(status_code=404, detail="Berth not found")
    return berth

@router.put("/api/master/berths/{id}", response_model=bool)
async def update_berth(id: int, data: BerthUpdate):
    updated = crud.update_berth(id, data.name, data.short_name, data.port_id, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Berth not found or already deleted")
    return updated

@router.delete("/api/master/berths/{id}", response_model=bool)
async def delete_berth(id: int, deleted_by: str):
    deleted = crud.delete_berth(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Berth not found or already deleted")
    return deleted

@router.get("/api/master/berths", response_model=List[Dict[str, Any]])
async def list_berths():
    return crud.list_berths()


# =================
# MASTER TOWING ROUTES
# =================

@router.post("/api/master/master-towing", response_model=Dict[str, Any])
async def create_master_towing(data: MasterTowingCreate):
    return crud.get_master_towing(
        crud.create_master_towing(data.name, data.short_name, data.t_name, data.ps, data.created_by)
    )

@router.get("/api/master/master-towing/{id}", response_model=Dict[str, Any])
async def get_master_towing(id: int):
    mt = crud.get_master_towing(id)
    if not mt:
        raise HTTPException(status_code=404, detail="Master towing not found")
    return mt

@router.put("/api/master/master-towing/{id}", response_model=bool)
async def update_master_towing(id: int, data: MasterTowingUpdate):
    updated = crud.update_master_towing(id, data.name, data.short_name,  data.t_name, data.ps, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Master towing not found or already deleted")
    return updated

@router.delete("/api/master/master-towing/{id}", response_model=bool)
async def delete_master_towing(id: int, deleted_by: str):
    deleted = crud.delete_master_towing(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Master towing not found or already deleted")
    return deleted

# ----------------------------
# Routes for emps
# ----------------------------

@router.get("/api/master/master-towing", response_model=List[Dict[str, Any]])
async def list_master_towing():
    return crud.list_master_towing()

@router.post("/api/emps", response_model=Dict[str, Any])
async def create_emp(data: EmpCreate):
    emp_id = crud.create_emp(data.ship_name, data.dw, data.loaded_cargo_name, data.created_by)
    return crud.get_emp(emp_id)

@router.post("/api/emps/bulk", response_model=List[Dict[str, Any]])
async def create_multiple_emps(data: List[EmpCreate]):
    if not data:
        raise HTTPException(status_code=400, detail="Input list is empty")

    inserted_ids = crud.create_multiple_emps([e.dict() for e in data])
    
    results = []
    for emp_id in inserted_ids:
        emp = crud.get_emp(emp_id)
        if emp is None:
            raise HTTPException(status_code=500, detail=f"Employee with id={emp_id} not found after insertion")
        results.append(emp)

    return results


@router.get("/api/emps/{id}", response_model=Dict[str, Any])
async def get_emp(id: int):
    emp = crud.get_emp(id)
    if not emp:
        raise HTTPException(status_code=404, detail="Emp not found")
    return emp

@router.put("/api/emps/{id}", response_model=bool)
async def update_emp(id: int, data: EmpUpdate):
    updated = crud.update_emp(id, data.ship_name, data.dw, data.loaded_cargo_name, data.updated_by)
    if not updated:
        raise HTTPException(status_code=404, detail="Emp not found or already deleted")
    return updated

@router.delete("/api/emps/{id}", response_model=bool)
async def delete_emp(id: int, deleted_by: str):
    deleted = crud.delete_emp(id, deleted_by)
    if not deleted:
        raise HTTPException(status_code=404, detail="Emp not found or already deleted")
    return deleted

@router.get("/api/emps", response_model=List[Dict[str, Any]])
async def list_emps():
    return crud.list_emps()

