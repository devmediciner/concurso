import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from scraper import VacancyScraper

app = FastAPI(title="MedConcursos - Vagas Médico & Distância Divinópolis")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(BASE_DIR, "data")
scraper = VacancyScraper(data_dir=data_dir)

# Ensure data is ready on start
cached = scraper.scrape(force_refresh=False)

# Mount data folder statically (so ./data/vagas.json works on local server too)
app.mount("/data", StaticFiles(directory=data_dir), name="data")

# Mount static folder if exists (for backwards compatibility)
static_dir = os.path.join(BASE_DIR, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/app.js")
def read_js():
    return FileResponse(os.path.join(BASE_DIR, "app.js"))

@app.get("/api/vagas")
def get_vagas(refresh: bool = False):
    try:
        data = scraper.scrape(force_refresh=refresh)
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/refresh")
def refresh_vagas():
    try:
        data = scraper.scrape(force_refresh=True)
        return {"status": "ok", "message": "Dados atualizados com sucesso!", "data": data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/stats")
def get_stats():
    try:
        data = scraper.scrape(force_refresh=False)
        return data.get("stats", {})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Iniciando servidor em http://localhost:{port} ...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
