from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from fastapi import FastAPI, Request # type: ignore
from fastapi.responses import FileResponse # type: ignore
from fastapi.staticfiles import StaticFiles # type: ignore
import os
from db.db import initialize_database
from routes.routes import router

app = FastAPI()
initialize_database()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use your frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional API route
@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI backend!"}

app.include_router(router)

FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), "../frontend/out")
# Serve static folders explicitly
for static_dir in ["_next"]:
    path = os.path.join(FRONTEND_BUILD_DIR, static_dir)
    if os.path.isdir(path):
        app.mount(f"/{static_dir}", StaticFiles(directory=path), name=static_dir)

@app.get("/")
def serve_root():
    return FileResponse(os.path.join(FRONTEND_BUILD_DIR, "index.html"))

@app.get("/{full_path:path}")
def serve_static_routes(full_path: str):
    # Block /api/* from matching static route handler
    if full_path.startswith("api/") or full_path == "api":
        return {"detail": "Not Found"}  # or raise HTTPException(status_code=404)

    # 1. Raw file (e.g. _next/static/*, css, js, etc.)
    raw_file = os.path.join(FRONTEND_BUILD_DIR, full_path)
    if os.path.isfile(raw_file):
        return FileResponse(raw_file)

    # 2. Directory index (e.g. /master/agents/ -> /master/agents/index.html)
    dir_index = os.path.join(FRONTEND_BUILD_DIR, full_path, "index.html")
    if os.path.isfile(dir_index):
        return FileResponse(dir_index)

    # 3. HTML fallback
    html_fallback = os.path.join(FRONTEND_BUILD_DIR, f"{full_path}.html")
    if os.path.isfile(html_fallback):
        return FileResponse(html_fallback)

    # 4. fallback 404
    fallback_404 = os.path.join(FRONTEND_BUILD_DIR, "404.html")
    if os.path.isfile(fallback_404):
        return FileResponse(fallback_404, status_code=404)

    return {"detail": "Not Found"}
