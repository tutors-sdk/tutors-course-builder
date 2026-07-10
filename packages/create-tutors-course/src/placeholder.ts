import { PNG } from "pngjs";

interface Color {
  r: number;
  g: number;
  b: number;
}

const COLORS: Record<string, Color> = {
  course: { r: 100, g: 149, b: 237 },
  topic: { r: 144, g: 238, b: 144 },
  talk: { r: 255, g: 218, b: 185 },
  lab: { r: 221, g: 160, b: 221 },
  note: { r: 255, g: 255, b: 224 },
};

export function createPlaceholderPng(type: string): Buffer {
  const color = COLORS[type] || COLORS.course;
  const width = 300;
  const height = 170;
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

export const PLACEHOLDER_PDF = Buffer.from(
  "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n" +
    "0000000058 00000 n \n0000000115 00000 n \n" +
    "trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
);
