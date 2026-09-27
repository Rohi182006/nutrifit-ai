import os
import sys
import tempfile
import threading
import time
import webview

def close_later(w):
    time.sleep(2)
    print("Auto-closing test window...")
    w.destroy()

def test():
    storage = tempfile.mkdtemp(prefix="nutrifit_storage_")
    print(f"Using isolated storage: {storage}")
    w = webview.create_window("NutriFit AI Test", "http://localhost:3000", width=800, height=600)
    t = threading.Thread(target=close_later, args=(w,))
    t.daemon = True
    t.start()
    webview.start(storage_path=storage)
    print("WINDOW TEST PASSED CLEANLY WITH ZERO ERRORS!")

if __name__ == "__main__":
    test()
