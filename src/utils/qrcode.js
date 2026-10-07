/**
 * Pure JavaScript QR Code Generator and Validator Utility
 * Supports Error Correction Levels (L, M, Q, H), dynamic sizing, validation, and vector SVG output.
 */

// Error Correction Levels
export const ERROR_CORRECTION_LEVELS = {
  L: { level: 'L', name: 'Low (7%)', value: 1 },
  M: { level: 'M', name: 'Medium (15%)', value: 0 },
  Q: { level: 'Q', name: 'Quartile (25%)', value: 3 },
  H: { level: 'H', name: 'High (30%)', value: 2 }
};

/**
 * Validates content for QR code generation.
 * @param {string} content - URL or text input to validate.
 * @returns {{ valid: boolean, error?: string, sanitizedContent?: string }}
 */
export function validateQrContent(content) {
  if (content === null || content === undefined) {
    return { valid: false, error: 'QR Code content is missing.' };
  }

  const sanitizedContent = String(content).trim();
  if (!sanitizedContent) {
    return { valid: false, error: 'QR Code content cannot be empty.' };
  }

  if (sanitizedContent.length > 1000) {
    return { valid: false, error: 'QR Code content exceeds maximum allowed character length (1000).' };
  }

  // If starts with http:// or https://, validate URL structure
  if (/^https?:\/\//i.test(sanitizedContent)) {
    try {
      const parsedUrl = new URL(sanitizedContent);
      if (!parsedUrl.hostname) {
        return { valid: false, error: 'Invalid URL hostname.' };
      }
    } catch {
      return { valid: false, error: 'Invalid URL format. Please enter a valid Web address.' };
    }
  }

  return { valid: true, sanitizedContent };
}

// GF(256) math precomputations
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 285; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 256; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function gfPolyMul(p1, p2) {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getRSRemainder(data, ecCount) {
  let gen = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    gen = gfPolyMul(gen, new Uint8Array([1, EXP_TABLE[i]]));
  }

  const msg = new Uint8Array(data.length + ecCount);
  msg.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return msg.subarray(data.length);
}

// QR Code Specifications Table for Versions 1-10 (capacity, EC codewords per block, block counts)
// Format: [totalDataCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsPerBlockGroup1, numBlocksGroup2, dataCodewordsPerBlockGroup2]
const QR_SPECS = {
  // Version: { L, M, Q, H }
  1: {
    L: [19, 7, 1, 19, 0, 0],
    M: [16, 10, 1, 16, 0, 0],
    Q: [13, 13, 1, 13, 0, 0],
    H: [9, 17, 1, 9, 0, 0]
  },
  2: {
    L: [34, 10, 1, 34, 0, 0],
    M: [28, 16, 1, 28, 0, 0],
    Q: [22, 22, 1, 22, 0, 0],
    H: [16, 28, 1, 16, 0, 0]
  },
  3: {
    L: [55, 15, 1, 55, 0, 0],
    M: [44, 26, 1, 44, 0, 0],
    Q: [34, 18, 2, 17, 0, 0],
    H: [26, 22, 2, 13, 0, 0]
  },
  4: {
    L: [80, 20, 1, 80, 0, 0],
    M: [64, 18, 2, 32, 0, 0],
    Q: [48, 26, 2, 24, 0, 0],
    H: [36, 16, 4, 9, 0, 0]
  },
  5: {
    L: [108, 26, 1, 108, 0, 0],
    M: [86, 24, 2, 43, 0, 0],
    Q: [62, 18, 2, 15, 2, 16],
    H: [46, 22, 2, 11, 2, 12]
  },
  6: {
    L: [136, 18, 2, 68, 0, 0],
    M: [108, 16, 4, 27, 0, 0],
    Q: [76, 24, 4, 19, 0, 0],
    H: [60, 28, 4, 15, 0, 0]
  },
  7: {
    L: [156, 20, 2, 78, 0, 0],
    M: [124, 18, 4, 31, 0, 0],
    Q: [88, 18, 2, 14, 4, 15],
    H: [66, 26, 4, 13, 1, 14]
  },
  8: {
    L: [194, 24, 2, 97, 0, 0],
    M: [154, 22, 2, 38, 2, 39],
    Q: [110, 22, 4, 18, 2, 19],
    H: [86, 26, 4, 14, 2, 15]
  },
  9: {
    L: [232, 30, 2, 116, 0, 0],
    M: [182, 22, 3, 36, 2, 37],
    Q: [132, 20, 4, 16, 4, 17],
    H: [100, 24, 4, 12, 4, 13]
  },
  10: {
    L: [274, 18, 2, 68, 2, 69],
    M: [216, 26, 4, 43, 1, 44],
    Q: [154, 24, 6, 19, 2, 20],
    H: [122, 28, 6, 15, 2, 16]
  }
};

const ALIGNMENT_PATTERNS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50]
};

/**
 * Converts text into UTF-8 bytes array.
 */
function toUtf8Bytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      // surrogate pair
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
}

/**
 * Encodes text into QR matrix.
 */
export function generateQrMatrix(content, ecl = 'M') {
  const validCheck = validateQrContent(content);
  if (!validCheck.valid) {
    throw new Error(validCheck.error);
  }

  const text = validCheck.sanitizedContent;
  const eclUpper = (ecl || 'M').toUpperCase();
  const eclConfig = ERROR_CORRECTION_LEVELS[eclUpper] || ERROR_CORRECTION_LEVELS.M;
  const levelKey = eclConfig.level;

  const dataBytes = toUtf8Bytes(text);

  // Find minimum version (1-10) that fits dataBytes
  let version = 1;
  while (version <= 10) {
    const spec = QR_SPECS[version][levelKey];
    if (spec[0] >= dataBytes.length + 3) {
      break;
    }
    version++;
  }

  if (version > 10) {
    version = 10; // Fallback to max supported V10
  }

  const spec = QR_SPECS[version][levelKey];
  const totalDataCodewords = spec[0];
  const ecPerBlock = spec[1];
  const numBlocksG1 = spec[2];
  const dataPerBlockG1 = spec[3];
  const numBlocksG2 = spec[4];
  const dataPerBlockG2 = spec[5];

  // Bit Buffer construction (Byte mode 0100)
  class BitBuffer {
    constructor() {
      this.bits = [];
    }
    put(val, length) {
      for (let i = length - 1; i >= 0; i--) {
        this.bits.push((val >> i) & 1);
      }
    }
    getByteData() {
      const bytes = new Uint8Array(Math.ceil(this.bits.length / 8));
      for (let i = 0; i < this.bits.length; i++) {
        if (this.bits[i]) {
          bytes[i >> 3] |= 1 << (7 - (i % 8));
        }
      }
      return bytes;
    }
  }

  const bb = new BitBuffer();
  bb.put(0x4, 4); // Byte mode indicator
  bb.put(dataBytes.length, version < 10 ? 8 : 16); // Character count indicator

  for (let i = 0; i < dataBytes.length; i++) {
    bb.put(dataBytes[i], 8);
  }

  // Terminator
  const totalBitsNeeded = totalDataCodewords * 8;
  const remainingBits = totalBitsNeeded - bb.bits.length;
  if (remainingBits > 0) {
    bb.put(0, Math.min(4, remainingBits));
  }

  // Pad to byte boundary
  while (bb.bits.length % 8 !== 0) {
    bb.bits.push(0);
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.bits.length < totalBitsNeeded) {
    bb.put(padBytes[padIdx], 8);
    padIdx = (padIdx + 1) % 2;
  }

  const encodedData = bb.getByteData();

  // Divide into blocks & compute RS error correction
  const blocks = [];
  let byteOffset = 0;

  for (let b = 0; b < numBlocksG1; b++) {
    const raw = encodedData.subarray(byteOffset, byteOffset + dataPerBlockG1);
    byteOffset += dataPerBlockG1;
    const ec = getRSRemainder(raw, ecPerBlock);
    blocks.push({ data: raw, ec });
  }

  for (let b = 0; b < numBlocksG2; b++) {
    const raw = encodedData.subarray(byteOffset, byteOffset + dataPerBlockG2);
    byteOffset += dataPerBlockG2;
    const ec = getRSRemainder(raw, ecPerBlock);
    blocks.push({ data: raw, ec });
  }

  // Interleave data & EC bytes
  const finalCodewords = new Uint8Array(totalDataCodewords + (numBlocksG1 + numBlocksG2) * ecPerBlock);
  let writeIdx = 0;

  const maxDataLen = Math.max(dataPerBlockG1, dataPerBlockG2);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < blocks.length; b++) {
      if (i < blocks[b].data.length) {
        finalCodewords[writeIdx++] = blocks[b].data[i];
      }
    }
  }

  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < blocks.length; b++) {
      finalCodewords[writeIdx++] = blocks[b].ec[i];
    }
  }

  // Matrix Creation
  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1)); // -1 unassigned

  const setModule = (r, c, val) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val ? 1 : 0;
    }
  };

  // 1. Finder patterns
  const drawFinder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
          if (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)) {
            setModule(nr, nc, 1);
          } else {
            setModule(nr, nc, 0);
          }
        } else {
          setModule(nr, nc, 0); // Separator
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment patterns
  const alignCoords = ALIGNMENT_PATTERNS[version] || [];
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      const r = alignCoords[i];
      const c = alignCoords[j];
      if (matrix[r][c] !== -1) continue; // Skip overlap with finders

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) {
            setModule(r + dr, c + dc, 1);
          } else {
            setModule(r + dr, c + dc, 0);
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === -1) setModule(6, i, i % 2 === 0 ? 1 : 0);
    if (matrix[i][6] === -1) setModule(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // 4. Dark Module
  setModule(4 * version + 9, 8, 1);

  // 5. Reserve Format Info areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = -2;
    if (matrix[i][8] === -1) matrix[i][8] = -2;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = -2;
    if (matrix[size - (size - i)][8] === -1) matrix[size - (size - i)][8] = -2;
  }

  // 6. Place Data Bits
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;

  let direction = -1; // up
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column

    for (let rowStep = 0; rowStep < size; rowStep++) {
      const row = direction === -1 ? size - 1 - rowStep : rowStep;

      for (let c = col; c > col - 2; c--) {
        if (matrix[row][c] === -1) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const bytePos = bitIdx >> 3;
            const bitPos = 7 - (bitIdx % 8);
            bit = (finalCodewords[bytePos] >> bitPos) & 1;
            bitIdx++;
          }
          matrix[row][c] = bit;
        }
      }
    }
    direction = -direction;
  }

  // Masking & Format Info (Mask 0 default for clean robust matrix)
  const maskPattern = 0;
  const eclBits = eclConfig.value; // L:1, M:0, Q:3, H:2
  const formatData = (eclBits << 3) | maskPattern;

  // BCH (15,5) format info calculation
  let formatPoly = formatData << 10;
  const genPoly = 0x537; // x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
  for (let i = 14; i >= 10; i--) {
    if ((formatPoly >> i) & 1) {
      formatPoly ^= genPoly << (i - 10);
    }
  }

  const formatBch = (formatData << 10) | formatPoly;
  const finalFormatBits = formatBch ^ 0x5372;

  // Write format info bits into reserved area
  const getFormatBit = (i) => (finalFormatBits >> i) & 1;

  // Top-Left Format Info
  matrix[8][0] = getFormatBit(14);
  matrix[8][1] = getFormatBit(13);
  matrix[8][2] = getFormatBit(12);
  matrix[8][3] = getFormatBit(11);
  matrix[8][4] = getFormatBit(10);
  matrix[8][5] = getFormatBit(9);
  matrix[8][7] = getFormatBit(8);
  matrix[8][8] = getFormatBit(7);
  matrix[7][8] = getFormatBit(6);
  matrix[5][8] = getFormatBit(5);
  matrix[4][8] = getFormatBit(4);
  matrix[3][8] = getFormatBit(3);
  matrix[2][8] = getFormatBit(2);
  matrix[1][8] = getFormatBit(1);
  matrix[0][8] = getFormatBit(0);

  // Bottom-Left & Top-Right Format Info
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = getFormatBit(i);
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = getFormatBit(14 - i);
  }

  // Convert matrix values to binary 0/1 array
  const finalMatrix = matrix.map((row) =>
    Array.from(row).map((v) => (v === 1 ? 1 : 0))
  );

  return finalMatrix;
}

/**
 * Generates an SVG vector representation string for a QR code.
 * @param {string} content - URL or text input.
 * @param {Object} options - Customization options.
 * @param {string} [options.errorCorrectionLevel='M'] - 'L' | 'M' | 'Q' | 'H'
 * @param {number} [options.size=100] - Output dimensions in pixels.
 * @param {string} [options.label=''] - Optional caption text underneath.
 * @param {string} [options.fgColor='#000000'] - Foreground module color.
 * @param {string} [options.bgColor='#ffffff'] - Background color.
 * @param {number} [options.margin=2] - Quiet zone margin size in modules.
 * @returns {{ valid: boolean, svg?: string, error?: string, matrix?: number[][] }}
 */
export function generateQrSvg(content, options = {}) {
  const validation = validateQrContent(content);
  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  const {
    errorCorrectionLevel = 'M',
    size = 100,
    label = '',
    fgColor = '#000000',
    bgColor = '#ffffff',
    margin = 2
  } = options;

  try {
    const matrix = generateQrMatrix(validation.sanitizedContent, errorCorrectionLevel);
    const modCount = matrix.length;
    const totalModules = modCount + margin * 2;

    let pathD = '';
    for (let r = 0; r < modCount; r++) {
      for (let c = 0; c < modCount; c++) {
        if (matrix[r][c] === 1) {
          const x = c + margin;
          const y = r + margin;
          pathD += `M${x},${y}h1v1h-1z `;
        }
      }
    }

    const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <path d="${pathD}" fill="${fgColor}" />
</svg>`.trim();

    return {
      valid: true,
      svg: svgString,
      matrix,
      sanitizedContent: validation.sanitizedContent,
      label: String(label || '').trim()
    };
  } catch (err) {
    return { valid: false, error: err.message || 'Failed to generate QR code matrix.' };
  }
}
