import os
import sys
import time
import socket
import tempfile
import threading
import subprocess
import urllib.request
import http.server
import socketserver
import webview

# 1. Determine Project Root Directory
if getattr(sys, 'frozen', False):
    exe_dir = os.path.dirname(sys.executable)
    if os.path.exists(os.path.join(exe_dir, "frontend")):
        ROOT_DIR = exe_dir
    elif os.path.exists(os.path.join(exe_dir, "..", "..", "frontend")):
        ROOT_DIR = os.path.abspath(os.path.join(exe_dir, "..", ".."))
    elif os.path.exists(os.path.join(exe_dir, "..", "frontend")):
        ROOT_DIR = os.path.abspath(os.path.join(exe_dir, ".."))
    else:
        ROOT_DIR = exe_dir
else:
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable

def is_port_in_use(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def check_http_ok(url, timeout=1.5):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "NutriFitAI-HealthCheck"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.getcode() == 200
    except Exception:
        return False

# 2. Self-contained SPA server for Frontend with API reverse proxy
class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIST, **kwargs)

    def proxy_api(self):
        backend_url = f"http://127.0.0.1:8000{self.path}"
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None

            headers = {}
            for k, v in self.headers.items():
                if k.lower() not in ('host', 'content-length'):
                    headers[k] = v

            req = urllib.request.Request(backend_url, data=body, headers=headers, method=self.command)
            with urllib.request.urlopen(req) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ('transfer-encoding', 'content-length', 'connection'):
                        self.send_header(k, v)
                resp_body = resp.read()
                self.send_header('Content-Length', str(len(resp_body)))
                self.end_headers()
                self.wfile.write(resp_body)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ('transfer-encoding', 'content-length', 'connection'):
                    self.send_header(k, v)
            err_body = e.read()
            self.send_header('Content-Length', str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            msg = f'{{"detail": "Backend proxy error: {str(e)}"}}'.encode('utf-8')
            self.send_header('Content-Length', str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def do_GET(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        full_path = self.translate_path(self.path)
        # If requested asset does not exist or is a client-side route, serve index.html
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        self.send_error(404, "Not Found")

    def do_PUT(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        self.send_error(404, "Not Found")

    def do_DELETE(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        self.send_error(404, "Not Found")

    def do_PATCH(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Quiet logs

def start_internal_frontend_server(port=3000):
    try:
        server = socketserver.TCPServer(("127.0.0.1", port), SPAHandler)
        t = threading.Thread(target=server.serve_forever)
        t.daemon = True
        t.start()
        print(f"[Desktop App] Internal SPA frontend server active on http://127.0.0.1:{port}")
        return True
    except Exception as e:
        print(f"[Desktop App] Could not start internal frontend on {port}: {e}")
        return False

# 3. Ensure Backend is Running
def ensure_backend():
    if check_http_ok("http://127.0.0.1:8000/api/v1/health"):
        print("[Desktop App] Backend service is already healthy on http://127.0.0.1:8000")
        return True

    print("[Desktop App] Launching backend service...")
    cmd = [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    )
    
    # Wait up to 10 seconds for backend to become ready
    for _ in range(20):
        time.sleep(0.5)
        if check_http_ok("http://127.0.0.1:8000/api/v1/health"):
            print("[Desktop App] Backend service is now active and healthy!")
            return True
            
    print("[Desktop App] Warning: Backend startup timed out, proceeding anyway...")
    return False

# 4. Ensure Frontend is Running
def ensure_frontend():
    if check_http_ok("http://localhost:3000"):
        print("[Desktop App] Frontend server is already active on http://localhost:3000")
        return "http://localhost:3000"
    
    # Start self-contained internal server
    if os.path.exists(FRONTEND_DIST):
        start_internal_frontend_server(3000)
        return "http://127.0.0.1:3000"
    else:
        # Fallback to direct backend docs or url
        return "http://127.0.0.1:8000/docs"

# 5. Launch Native Window
def main():
    print("=" * 60)
    print("  NutriFit AI — Intelligent Fitness & Nutrition Platform")
    print("=" * 60)

    # Step 1: Health check & auto-start backend
    ensure_backend()

    # Step 2: Health check & auto-start frontend
    app_url = ensure_frontend()

    # Step 3: Configure isolated user data directory to prevent 0x800700AA lock conflicts
    local_app_data = os.environ.get("LOCALAPPDATA", tempfile.gettempdir())
    storage_dir = os.path.join(local_app_data, "NutriFitAI", "WebViewStorage")
    os.makedirs(storage_dir, exist_ok=True)

    print(f"[Desktop App] Target application UI: {app_url}")
    print(f"[Desktop App] Dedicated WebView2 Storage: {storage_dir}")
    print("[Desktop App] Opening native application window...")

    # Create native window
    window = webview.create_window(
        title="NutriFit AI — Intelligent Fitness & Nutrition Recommendation Platform",
        url=app_url,
        width=1380,
        height=880,
        min_size=(1080, 700),
        resizable=True,
        background_color="#0F172A",
        confirm_close=False,
        text_select=True
    )

    # Start native event loop with dedicated isolated storage
    webview.start(storage_path=storage_dir, private_mode=False, debug=False)

if __name__ == "__main__":
    main()
