"""Local dev server — mirrors Vercel's cleanUrls + /sessions/:slug rewrite."""
import http.server
import os
import re
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0].rstrip("/") or "/"

        # /sessions/<slug>  →  session-detail.html
        if re.match(r"^/sessions/[^/]+$", path):
            self.path = "/session-detail.html"
            return super().do_GET()

        # clean URL → .html file  (e.g. /about → /about.html)
        candidate = os.path.join(ROOT, path.lstrip("/"))
        if not os.path.exists(candidate) and not path.endswith(".html"):
            html_candidate = candidate + ".html"
            if os.path.exists(html_candidate):
                self.path = path + ".html"
                return super().do_GET()

        return super().do_GET()

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()}  {fmt % args}")


if __name__ == "__main__":
    os.chdir(ROOT)
    with http.server.HTTPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}  (Ctrl+C to stop)")
        httpd.serve_forever()
