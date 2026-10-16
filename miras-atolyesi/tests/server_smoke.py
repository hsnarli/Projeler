"""A detached cloud log pipe must not turn HTTP responses into empty replies."""
from pathlib import Path
import socket
import subprocess
import time
from urllib.request import urlopen

with socket.socket() as probe:
    probe.bind(('127.0.0.1', 0))
    port = probe.getsockname()[1]
server = Path(__file__).resolve().parents[1] / 'scripts/serve.py'
process = subprocess.Popen(['python3', str(server), '--host', '127.0.0.1', '--port', str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
process.stderr.close()
try:
    for attempt in range(50):
        try:
            with urlopen(f'http://127.0.0.1:{port}/', timeout=2) as response:
                html = response.read().decode()
                assert response.status == 200 and 'id="game-styles"' in html and 'id="game-code"' in html
            break
        except OSError:
            time.sleep(.1)
    else:
        raise RuntimeError('Server did not respond after its log pipe was closed.')
    print('PASS server HTTP response after log reader disconnects')
finally:
    process.terminate()
    process.wait(timeout=10)
