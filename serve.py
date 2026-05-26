"""Serveur local pour Quatre Piliers (refonte).

Gere les URLs propres comme /services -> services.html
et /blog -> blog/index.html, comme le ferait la prod via _redirects.
"""
import http.server, os, socketserver, sys, webbrowser
from urllib.parse import urlparse, unquote

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        # split off query/fragment
        parsed = urlparse(path)
        clean = unquote(parsed.path)
        fs_path = super().translate_path(clean)

        # already exists as a file -> serve it
        if os.path.isfile(fs_path):
            return fs_path

        # directory -> look for index.html
        if os.path.isdir(fs_path):
            idx = os.path.join(fs_path, "index.html")
            if os.path.isfile(idx):
                return idx

        # no extension -> try .html
        if not os.path.splitext(fs_path)[1]:
            html = fs_path + ".html"
            if os.path.isfile(html):
                return html
            idx = os.path.join(fs_path, "index.html")
            if os.path.isfile(idx):
                return idx

        return fs_path

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("  %s - %s\n" % (self.address_string(), fmt % args))


def main():
    os.chdir(ROOT)
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"  Quatre Piliers - refonte")
        print(f"  Dossier : {ROOT}")
        print(f"  URL     : {url}")
        print(f"  Ctrl+C pour arreter.\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Serveur arrete.")


if __name__ == "__main__":
    main()
