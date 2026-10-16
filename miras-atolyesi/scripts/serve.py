#!/usr/bin/env python3
"""Dependency-free local server. Run from any working directory."""
import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from build import build


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description='Miras Atölyesi yerel oyun sunucusu')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '4173')))
    parser.add_argument('--bind', '--host', dest='bind', default='0.0.0.0')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    build(root)
    server = ThreadingHTTPServer((args.bind, args.port), partial(Handler, directory=str(root)))
    print(f'Miras Atölyesi sunucusu hazır. Port: {args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
