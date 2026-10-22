"""Download only the tomato colour images from the PlantVillage data.zip on Hugging Face.

The archive (2.2 GB) holds colour, grayscale and segmented copies of all 38 classes. HTTP range
requests let us read its central directory and then fetch just the members under
raw/color/Tomato___*/ (about a ninth of the file). Standard library only.

usage: python -I fetch_tomato.py <out_dir>
"""

import io
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

URL = "https://huggingface.co/datasets/mohanty/PlantVillage/resolve/main/data.zip"
MEMBER = re.compile(r"^raw/color/(Tomato___[^/]+)/([^/]+\.(?:jpe?g|png))$", re.I)
BLOCK = 8 * 1024 * 1024


class HTTPRangeFile(io.RawIOBase):
    """Seekable read-only view of a remote file, fetched in 8 MB blocks with a small cache."""

    def __init__(self, url: str):
        self.url = url
        self.pos = 0
        self.cache: dict[int, bytes] = {}
        self.fetched = 0
        self.size = self._resolve()

    def _resolve(self) -> int:
        req = urllib.request.Request(self.url, headers={"Range": "bytes=0-0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            self.cdn = r.geturl()
            total = r.headers["Content-Range"].split("/")[-1]
        return int(total)

    def _get(self, start: int, end: int) -> bytes:
        for attempt in range(6):
            try:
                req = urllib.request.Request(self.cdn, headers={"Range": f"bytes={start}-{end}"})
                with urllib.request.urlopen(req, timeout=120) as r:
                    data = r.read()
                if len(data) != end - start + 1:
                    raise IOError(f"short read {len(data)} for {start}-{end}")
                self.fetched += len(data)
                return data
            except (urllib.error.URLError, IOError, TimeoutError) as e:
                print(f"  retry {attempt + 1} ({e})", flush=True)
                time.sleep(2 * (attempt + 1))
                self.size = self._resolve()  # signed CDN URLs expire
        raise IOError(f"failed to fetch {start}-{end}")

    def _block(self, n: int) -> bytes:
        if n not in self.cache:
            if len(self.cache) > 6:
                self.cache.pop(next(iter(self.cache)))
            start = n * BLOCK
            self.cache[n] = self._get(start, min(start + BLOCK, self.size) - 1)
        return self.cache[n]

    def readable(self):
        return True

    def seekable(self):
        return True

    def seek(self, offset, whence=0):
        self.pos = {0: offset, 1: self.pos + offset, 2: self.size + offset}[whence]
        return self.pos

    def tell(self):
        return self.pos

    def read(self, n=-1):
        if n is None or n < 0:
            n = self.size - self.pos
        n = max(0, min(n, self.size - self.pos))
        out = bytearray()
        while n > 0:
            blk, off = divmod(self.pos, BLOCK)
            chunk = self._block(blk)[off : off + n]
            out += chunk
            self.pos += len(chunk)
            n -= len(chunk)
        return bytes(out)

    def readinto(self, b):
        data = self.read(len(b))
        b[: len(data)] = data
        return len(data)


def main() -> None:
    out = Path(sys.argv[1]).resolve()
    out.mkdir(parents=True, exist_ok=True)
    f = HTTPRangeFile(URL)
    print(f"archive: {f.size / 1e9:.2f} GB", flush=True)
    t0 = time.time()
    zf = zipfile.ZipFile(f)
    infos = [i for i in zf.infolist() if MEMBER.match(i.filename)]
    infos.sort(key=lambda i: i.header_offset)
    print(f"central directory: {len(zf.infolist())} entries, {len(infos)} tomato colour images, "
          f"{f.fetched / 1e6:.1f} MB read in {time.time() - t0:.1f}s", flush=True)
    if infos:
        span = infos[-1].header_offset + infos[-1].compress_size - infos[0].header_offset
        print(f"tomato span: {span / 1e6:.1f} MB from offset {infos[0].header_offset}", flush=True)
    f.cache.clear()
    done = 0
    for info in infos:
        cls, name = MEMBER.match(info.filename).groups()
        dest = out / cls / name
        if dest.parent.resolve().parent != out:  # path safety: exactly <out>/<class>/<file>
            raise SystemExit(f"unsafe member name: {info.filename!r}")
        dest.parent.mkdir(exist_ok=True)
        if not (dest.exists() and dest.stat().st_size == info.file_size):
            dest.write_bytes(zf.read(info))
        done += 1
        if done % 2000 == 0:
            rate = f.fetched / 1e6 / max(1e-6, time.time() - t0)
            print(f"  {done}/{len(infos)} files, {f.fetched / 1e6:.0f} MB fetched, {rate:.1f} MB/s", flush=True)
    print(f"done: {done} files, {f.fetched / 1e6:.0f} MB fetched in {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
