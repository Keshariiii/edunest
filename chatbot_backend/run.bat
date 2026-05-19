@echo off
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt
echo Starting FastAPI server...
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
