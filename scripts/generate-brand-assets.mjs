import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(scriptDirectory);
const outputDirectory = path.join(projectDirectory, "assets", "images");
const colors = {
  forest: [40, 82, 67, 255],
  white: [255, 255, 255, 255],
  coral: [216, 102, 77, 255],
};

const targets = [
  { filename: "icon.png", size: 1024, background: colors.forest },
  { filename: "android-icon-foreground.png", size: 432 },
  { filename: "android-icon-monochrome.png", size: 432, monochrome: true },
  { filename: "splash-icon.png", size: 512 },
  { filename: "favicon.png", size: 64, background: colors.forest },
];

fs.mkdirSync(outputDirectory, { recursive: true });
for (const target of targets) {
  const pixels = render(target.size, target.background, target.monochrome);
  fs.writeFileSync(
    path.join(outputDirectory, target.filename),
    encodePng(target.size, target.size, pixels),
  );
}

function render(size, background, monochrome = false) {
  const supersample = 2;
  const highSize = size * supersample;
  const pixels = new Uint8Array(highSize * highSize * 4);
  if (background) {
    for (let index = 0; index < pixels.length; index += 4) {
      pixels.set(background, index);
    }
  }

  const point = (value) => value * highSize;
  const paint = (x, y, color) => {
    const pixelX = Math.round(x);
    const pixelY = Math.round(y);
    if (pixelX < 0 || pixelX >= highSize || pixelY < 0 || pixelY >= highSize) {
      return;
    }
    const index = (pixelY * highSize + pixelX) * 4;
    const sourceAlpha = color[3] / 255;
    const destinationAlpha = pixels[index + 3] / 255;
    const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
    if (outputAlpha === 0) {
      return;
    }
    for (let channel = 0; channel < 3; channel += 1) {
      pixels[index + channel] = Math.round(
        (color[channel] * sourceAlpha +
          pixels[index + channel] * destinationAlpha * (1 - sourceAlpha)) /
          outputAlpha,
      );
    }
    pixels[index + 3] = Math.round(outputAlpha * 255);
  };

  const disc = (x, y, radius, color) => {
    const minX = Math.floor(x - radius);
    const maxX = Math.ceil(x + radius);
    const minY = Math.floor(y - radius);
    const maxY = Math.ceil(y + radius);
    const radiusSquared = radius * radius;
    for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
      for (let pixelX = minX; pixelX <= maxX; pixelX += 1) {
        const deltaX = pixelX - x;
        const deltaY = pixelY - y;
        if (deltaX * deltaX + deltaY * deltaY <= radiusSquared) {
          paint(pixelX, pixelY, color);
        }
      }
    }
  };

  const line = (x1, y1, x2, y2, width, color) => {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(distance / (highSize / 80)));
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      disc(
        x1 + (x2 - x1) * progress,
        y1 + (y2 - y1) * progress,
        width / 2,
        color,
      );
    }
  };

  const arc = (centerX, centerY, radius, start, end, width, color) => {
    const steps = Math.max(24, Math.ceil(Math.abs(end - start) * 100));
    for (let step = 0; step <= steps; step += 1) {
      const angle = start + ((end - start) * step) / steps;
      disc(
        point(centerX + Math.cos(angle) * radius),
        point(centerY + Math.sin(angle) * radius),
        point(width) / 2,
        color,
      );
    }
  };

  const polygon = (points, color) => {
    const scaled = points.map(([x, y]) => [point(x), point(y)]);
    const minY = Math.max(0, Math.floor(Math.min(...scaled.map(([, y]) => y))));
    const maxY = Math.min(
      highSize - 1,
      Math.ceil(Math.max(...scaled.map(([, y]) => y))),
    );
    for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
      const intersections = [];
      for (let index = 0; index < scaled.length; index += 1) {
        const [x1, y1] = scaled[index];
        const [x2, y2] = scaled[(index + 1) % scaled.length];
        if ((y1 <= pixelY && y2 > pixelY) || (y2 <= pixelY && y1 > pixelY)) {
          intersections.push(x1 + ((pixelY - y1) * (x2 - x1)) / (y2 - y1));
        }
      }
      intersections.sort((left, right) => left - right);
      for (let index = 0; index + 1 < intersections.length; index += 2) {
        for (
          let pixelX = Math.floor(intersections[index]);
          pixelX <= Math.ceil(intersections[index + 1]);
          pixelX += 1
        ) {
          paint(pixelX, pixelY, color);
        }
      }
    }
  };

  const roundedRectangle = (x, y, width, height, radius, color) => {
    for (let pixelY = point(y); pixelY <= point(y + height); pixelY += 1) {
      for (let pixelX = point(x); pixelX <= point(x + width); pixelX += 1) {
        const distanceX =
          pixelX < point(x + radius)
            ? point(x + radius) - pixelX
            : pixelX > point(x + width - radius)
              ? pixelX - point(x + width - radius)
              : 0;
        const distanceY =
          pixelY < point(y + radius)
            ? point(y + radius) - pixelY
            : pixelY > point(y + height - radius)
              ? pixelY - point(y + height - radius)
              : 0;
        if (
          distanceX * distanceX + distanceY * distanceY <=
          point(radius) ** 2
        ) {
          paint(pixelX, pixelY, color);
        }
      }
    }
  };

  const white = colors.white;
  const accent = monochrome ? white : colors.coral;
  arc(0.5, 0.5, 0.33, -0.8, 5.4, 0.07, white);
  const arrowAngle = 5.4;
  const arrowX = 0.5 + Math.cos(arrowAngle) * 0.33;
  const arrowY = 0.5 + Math.sin(arrowAngle) * 0.33;
  const tangentX = -Math.sin(arrowAngle);
  const tangentY = Math.cos(arrowAngle);
  const radialX = Math.cos(arrowAngle);
  const radialY = Math.sin(arrowAngle);
  polygon(
    [
      [arrowX + tangentX * 0.08, arrowY + tangentY * 0.08],
      [
        arrowX - tangentX * 0.06 + radialX * 0.07,
        arrowY - tangentY * 0.06 + radialY * 0.07,
      ],
      [
        arrowX - tangentX * 0.06 - radialX * 0.07,
        arrowY - tangentY * 0.06 - radialY * 0.07,
      ],
    ],
    white,
  );
  arc(0.5, 0.42, 0.07, Math.PI, Math.PI * 2, 0.035, white);
  roundedRectangle(0.36, 0.42, 0.28, 0.24, 0.035, white);
  polygon(
    [
      [0.5, 0.48],
      [0.535, 0.45],
      [0.57, 0.48],
      [0.555, 0.525],
      [0.5, 0.565],
      [0.445, 0.525],
      [0.43, 0.48],
      [0.465, 0.45],
    ],
    accent,
  );

  return downsample(pixels, highSize, size);
}

function downsample(source, sourceSize, targetSize) {
  const result = new Uint8Array(targetSize * targetSize * 4);
  const ratio = sourceSize / targetSize;
  for (let targetY = 0; targetY < targetSize; targetY += 1) {
    for (let targetX = 0; targetX < targetSize; targetX += 1) {
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      for (
        let sourceY = targetY * ratio;
        sourceY < (targetY + 1) * ratio;
        sourceY += 1
      ) {
        for (
          let sourceX = targetX * ratio;
          sourceX < (targetX + 1) * ratio;
          sourceX += 1
        ) {
          const sourceIndex =
            (Math.floor(sourceY) * sourceSize + Math.floor(sourceX)) * 4;
          const sourceAlpha = source[sourceIndex + 3] / 255;
          alpha += sourceAlpha;
          red += source[sourceIndex] * sourceAlpha;
          green += source[sourceIndex + 1] * sourceAlpha;
          blue += source[sourceIndex + 2] * sourceAlpha;
        }
      }
      const sampleCount = ratio * ratio;
      const resultIndex = (targetY * targetSize + targetX) * 4;
      const outputAlpha = alpha / sampleCount;
      result[resultIndex] = outputAlpha ? Math.round(red / alpha) : 0;
      result[resultIndex + 1] = outputAlpha ? Math.round(green / alpha) : 0;
      result[resultIndex + 2] = outputAlpha ? Math.round(blue / alpha) : 0;
      result[resultIndex + 3] = Math.round(outputAlpha * 255);
    }
  }
  return result;
}

function encodePng(width, height, pixels) {
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const rowOffset = row * (width * 4 + 1);
    rows[rowOffset] = 0;
    Buffer.from(
      pixels.buffer,
      pixels.byteOffset + row * width * 4,
      width * 4,
    ).copy(rows, rowOffset + 1);
  }
  const chunks = [
    pngChunk("IHDR", makeIhdr(width, height)),
    pngChunk("IDAT", zlib.deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0)),
  ];
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ...chunks,
  ]);
}

function makeIhdr(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return header;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuffer, data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), body.length + 4);
  return chunk;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
