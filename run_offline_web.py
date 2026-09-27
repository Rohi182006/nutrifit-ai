import os
import sys
import time
import socket
import threading
import subprocess
import urllib.request
import urllib.error
import http.server
import socketserver
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable

def check_http_ok(url, timeout=1.5):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "NutriFitAI-OfflineCheck"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.getcode() == 200
    except Exception:
        return False

# Self-contained Threaded SPA Server with Full API Reverse-Proxy
class ThreadingSPAHandler(http.server.SimpleHTTPRequestHandler):
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
            msg = f'{{"detail": "Offline Backend proxy error: {str(e)}"}}'.encode('utf-8')
            self.send_header('Content-Length', str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def do_GET(self):
        if self.path.startswith('/api'):
            return self.proxy_api()
        full_path = self.translate_path(self.path)
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
        pass

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

def ensure_backend():
    if check_http_ok("http://127.0.0.1:8000/api/v1/health"):
        print("[Offline Launcher] Local backend is already running on port 8000.")
        return True

    print("[Offline Launcher] Starting offline FastAPI backend service...")
    cmd = [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"]
    subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    )

    for _ in range(25):
        time.sleep(0.4)
        if check_http_ok("http://127.0.0.1:8000/api/v1/health"):
            print("[Offline Launcher] Offline backend is active and healthy.")
            return True

    print("[Offline Launcher] Backend startup took longer than expected, continuing...")
    return False

def get_lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()

def ensure_frontend(port=3000):
    if check_http_ok(f"http://localhost:{port}"):
        print(f"[Offline Launcher] Frontend server is already active on port {port}.")
        return True

    print(f"[Offline Launcher] Starting self-contained offline SPA web server on port {port}...")
    try:
        server = ThreadedTCPServer(("0.0.0.0", port), ThreadingSPAHandler)
        t = threading.Thread(target=server.serve_forever)
        t.daemon = True
        t.start()
        print(f"[Offline Launcher] Offline web server ready on 0.0.0.0:{port}")
        return True
    except Exception as e:
        print(f"[Offline Launcher] Error starting internal web server: {e}")
        return False

def main():
    lan_ip = get_lan_ip()
    print("=" * 65)
    print("  NutriFit AI — Web Application Launcher")
    print("=" * 65)
    print("Initializing application services...")

    # 1. Start local backend with SQLite
    ensure_backend()

    # 2. Start local frontend server
    ensure_frontend(3000)

    url = "http://localhost:3000"
    lan_url = f"http://{lan_ip}:3000"
    admin_url = f"http://localhost:3000/admin/dashboard"

    print("\n" + "=" * 65)
    print("  NutriFit AI Access Links:")
    print("=" * 65)
    print(f"  👉 [Private Local URL]       : {url}")
    print(f"  👉 [Private LAN / Wi-Fi URL] : {lan_url}")
    print(f"  👉 [Admin Panel URL]         : {admin_url}")
    print("=" * 65)

    # 3. Open URL link in default browser
    webbrowser.open(url)

    # 4. Keep server running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down NutriFit AI server.")

if __name__ == "__main__":
    main()

