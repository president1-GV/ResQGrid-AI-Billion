import subprocess
import sys
import time
import os

def run():
    print("=" * 60)
    print("  RESQGRID AI - INTELLIGENCE FOR EVERY RESPONSE.")
    print("  DETECT. VERIFY. PRIORITIZE. OPTIMIZE. RESPOND.")
    print("=" * 60)

    # 1. Verify dependencies
    print("\n[1/3] Verifying Python & OR-Tools Optimization Engine...")
    try:
        from ortools.linear_solver import pywraplp
        import fastapi
        import uvicorn
        print("      -> Google OR-Tools MIP & FastAPI online.")
    except ImportError as e:
        print(f"      [ERROR] Missing dependency: {e}")
        print("      Please run: pip install -r backend/requirements.txt")
        sys.exit(1)

    # 2. Launch Backend
    print("\n[2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.getcwd()
    )

    time.sleep(1.5)

    # 3. Launch Frontend
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    print(f"\n[3/3] Starting Vite React Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "=" * 60)
    print("  RESQGRID AI IS NOW RUNNING!")
    print("  - Command Center Dashboard: http://localhost:5173")
    print("  - REST API & Swagger Docs:   http://127.0.0.1:8000/docs")
    print("  - Press Ctrl+C to terminate both servers.")
    print("=" * 60 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down ResQGrid...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    run()
