import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// ---------- PNG 编码 ----------
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([head, body, tail]);
}

function encodePNG(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixels[y * size + x];
      const offset = rowStart + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ---------- 绘制 ----------
function inRoundRect(px, py, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const hw = (x1 - x0) / 2 - r;
  const hh = (y1 - y0) / 2 - r;
  const dx = Math.max(Math.abs(px - cx) - hw, 0);
  const dy = Math.max(Math.abs(py - cy) - hh, 0);
  return dx * dx + dy * dy <= r * r;
}

function inCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

const COLORS = {
  top: [78, 140, 255],
  bottom: [36, 83, 198],
  white: [255, 255, 255],
  band: [214, 230, 255],
  ring: [176, 201, 246],
  cell: [234, 242, 255],
  dot: [255, 91, 95]
};

function paintIcon(size) {
  const u = size / 512;
  const shape = (v) => v * u;
  // 以 512 画布坐标定义的形状
  const card = [118, 142, 394, 420];
  const ears = [
    [150, 98, 202, 146],
    [310, 98, 362, 146]
  ];
  const bandBottom = 214;
  const ringCenters = [
    [172, 180],
    [340, 180]
  ];
  const gridX = 136;
  const gridY = 240;
  const gridEndX = 376;
  const gridEndY = 396;
  const gap = 9;
  const colW = (gridEndX - gridX - gap * 3) / 4;
  const rowH = (gridEndY - gridY - gap * 2) / 3;
  const dotRow = 1;
  const dotCol = 2;

  const px = new Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = y / size;
      let color = [
        lerp(COLORS.top[0], COLORS.bottom[0], t),
        lerp(COLORS.top[1], COLORS.bottom[1], t),
        lerp(COLORS.top[2], COLORS.bottom[2], t),
        255
      ];

      const cx = x / u;
      const cy = y / u;

      const inLeftEar = inRoundRect(cx, cy, ...ears[0].map(shape), shape(14));
      const inRightEar = inRoundRect(cx, cy, ...ears[1].map(shape), shape(14));
      const inCard = inRoundRect(cx, cy, ...card.map(shape), shape(26));
      if (inLeftEar || inRightEar || inCard) {
        color = [...COLORS.white, 255];
      }
      if (inCard && cy <= bandBottom * u) {
        color = [...COLORS.band, 255];
      }
      for (const [rcx, rcy] of ringCenters) {
        if (inCircle(cx, cy, shape(rcx), shape(rcy), shape(13))) {
          color = [...COLORS.ring, 255];
        }
      }

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const cx0 = (gridX + c * (colW + gap)) * u;
          const cy0 = (gridY + r * (rowH + gap)) * u;
          if (inRoundRect(x, y, cx0, cy0, cx0 + colW * u, cy0 + rowH * u, shape(10))) {
            color = [...COLORS.cell, 255];
          }
        }
      }

      const dotCx = (gridX + dotCol * (colW + gap) + colW / 2) * u;
      const dotCy = (gridY + dotRow * (rowH + gap) + rowH / 2) * u;
      if (inCircle(x, y, dotCx, dotCy, shape(15))) {
        color = [...COLORS.dot, 255];
        const s1 = segDist(x, y, dotCx - shape(5.5), dotCy - shape(0.5), dotCx - shape(0.5), dotCy + shape(4.5));
        const s2 = segDist(x, y, dotCx - shape(0.5), dotCy + shape(4.5), dotCx + shape(6), dotCy - shape(5.5));
        if (s1 < shape(2.2) || s2 < shape(2.2)) {
          color = [...COLORS.white, 255];
        }
      }

      px[y * size + x] = color;
    }
  }
  return px;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  writeFileSync(join(OUT_DIR, name), encodePNG(size, paintIcon(size)));
  console.log(`生成 public/${name}`);
}
