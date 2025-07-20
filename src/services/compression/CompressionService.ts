// Enhanced Compression Service for Phase 5
// Provides multiple compression algorithms and chunking support

export interface CompressionResult {
  compressed: Uint8Array | string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: string;
  metadata: {
    chunks?: number;
    chunkSize?: number;
    timestamp: string;
  };
}

export interface CompressionOptions {
  algorithm?: 'lz-string' | 'gzip-like' | 'base64' | 'json-pack';
  level?: 1 | 2 | 3 | 4 | 5; // 1 = fastest, 5 = best compression
  enableChunking?: boolean;
  chunkSize?: number; // bytes
  onProgress?: (progress: number, stage: string) => void;
}

// Simple LZ-String implementation for client-side compression
class LZString {
  private static keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  static compress(uncompressed: string): string {
    return this.compressToBase64(uncompressed);
  }

  static decompress(compressed: string): string {
    return this.decompressFromBase64(compressed);
  }

  private static compressToBase64(input: string): string {
    if (input == null) return "";
    const res = this._compress(input, 6, (a: number) => this.keyStr.charAt(a));
    switch (res.length % 4) {
      default:
      case 0: return res;
      case 1: return res + "===";
      case 2: return res + "==";
      case 3: return res + "=";
    }
  }

  private static decompressFromBase64(input: string): string {
    if (input == null) return "";
    if (input == "") return null as any;
    return this._decompress(input.length, 32, (index: number) => {
      return this.keyStr.indexOf(input.charAt(index));
    });
  }

  private static _compress(uncompressed: string, bitsPerChar: number, getCharFromInt: (a: number) => string): string {
    if (uncompressed == null) return "";
    
    let i: number, value: number;
    const context_dictionary: { [key: string]: number } = {};
    const context_dictionaryToCreate: { [key: string]: boolean } = {};
    let context_c = "";
    let context_wc = "";
    let context_w = "";
    let context_enlargeIn = 2;
    let context_dictSize = 3;
    let context_numBits = 2;
    let context_data: number[] = [];
    let context_data_val = 0;
    let context_data_position = 0;
    let ii: number;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    value = 2;
    for (i = 0; i < context_numBits; i++) {
      context_data_val = (context_data_val << 1) | (value & 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data.push(getCharFromInt(context_data_val).charCodeAt(0));
        break;
      } else context_data_position++;
    }

    return String.fromCharCode.apply(null, context_data as any);
  }

  private static _decompress(length: number, resetValue: number, getNextValue: (index: number) => number): string {
    const dictionary: string[] = [];
    let enlargeIn = 4;
    let dictSize = 4;
    let numBits = 3;
    let entry = "";
    let result = "";
    let i: number;
    let w: string;
    let bits: number, resb: number, maxpower: number, power: number;
    let c: string;
    const data = { val: getNextValue(0), position: resetValue, index: 1 };

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = String(i);
    }

    bits = 0;
    maxpower = Math.pow(2, 2);
    power = 1;
    while (power != maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (bits) {
      case 0:
        bits = 0;
        maxpower = Math.pow(2, 8);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = String.fromCharCode(bits);
        break;
      case 1:
        bits = 0;
        maxpower = Math.pow(2, 16);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = String.fromCharCode(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result = c;
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2, numBits);
      power = 1;
      while (power != maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = String(bits)) {
        case "0":
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = String.fromCharCode(bits);
          c = String(dictSize - 1);
          enlargeIn--;
          break;
        case "1":
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = String.fromCharCode(bits);
          c = String(dictSize - 1);
          enlargeIn--;
          break;
        case "2":
          return result;
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[Number(c)]) {
        entry = dictionary[Number(c)];
      } else {
        if (Number(c) === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null as any;
        }
      }

      result += entry;
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }
    }
  }
}

export class CompressionService {
  /**
   * Compress data with specified options
   */
  async compress(data: string, options: CompressionOptions = {}): Promise<CompressionResult> {
    const {
      algorithm = 'lz-string',
      level = 3,
      enableChunking = false,
      chunkSize = 64 * 1024, // 64KB chunks
      onProgress
    } = options;

    const originalSize = new Blob([data]).size;
    let compressed: string | Uint8Array;
    let compressionAlgorithm = algorithm;

    try {
      if (onProgress) onProgress(10, 'Starting compression...');

      if (enableChunking && originalSize > chunkSize) {
        compressed = await this.compressWithChunking(data, options);
        compressionAlgorithm = `${algorithm}-chunked`;
      } else {
        switch (algorithm) {
          case 'lz-string':
            compressed = this.compressLZString(data, level);
            break;
          case 'gzip-like':
            compressed = this.compressGzipLike(data, level);
            break;
          case 'base64':
            compressed = this.compressBase64(data);
            break;
          case 'json-pack':
            compressed = this.compressJsonPack(data, level);
            break;
          default:
            throw new Error(`Unknown compression algorithm: ${algorithm}`);
        }
      }

      if (onProgress) onProgress(90, 'Finalizing compression...');

      const compressedSize = typeof compressed === 'string' 
        ? new Blob([compressed]).size 
        : compressed.length;

      const result: CompressionResult = {
        compressed,
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
        algorithm: compressionAlgorithm,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      if (enableChunking && originalSize > chunkSize) {
        result.metadata.chunks = Math.ceil(originalSize / chunkSize);
        result.metadata.chunkSize = chunkSize;
      }

      if (onProgress) onProgress(100, 'Compression complete');

      console.log(`🗜️ Compressed ${originalSize} bytes to ${compressedSize} bytes (${(result.compressionRatio * 100).toFixed(1)}% of original)`);

      return result;
    } catch (error) {
      throw new Error(`Compression failed: ${error}`);
    }
  }

  /**
   * Decompress data
   */
  async decompress(compressedData: string | Uint8Array, algorithm: string): Promise<string> {
    try {
      const isChunked = algorithm.includes('-chunked');
      const baseAlgorithm = algorithm.replace('-chunked', '') as CompressionOptions['algorithm'];

      if (isChunked) {
        return this.decompressWithChunking(compressedData as string, baseAlgorithm);
      }

      switch (baseAlgorithm) {
        case 'lz-string':
          return this.decompressLZString(compressedData as string);
        case 'gzip-like':
          return this.decompressGzipLike(compressedData as string);
        case 'base64':
          return this.decompressBase64(compressedData as string);
        case 'json-pack':
          return this.decompressJsonPack(compressedData as string);
        default:
          throw new Error(`Unknown decompression algorithm: ${baseAlgorithm}`);
      }
    } catch (error) {
      throw new Error(`Decompression failed: ${error}`);
    }
  }

  // LZ-String compression
  private compressLZString(data: string, level: number): string {
    // Apply pre-processing based on compression level
    let processedData = data;
    if (level >= 3) {
      // Remove unnecessary whitespace for higher compression
      processedData = data.replace(/\s+/g, ' ').trim();
    }
    return LZString.compress(processedData);
  }

  private decompressLZString(data: string): string {
    return LZString.decompress(data);
  }

  // Simple gzip-like compression using run-length encoding + dictionary
  private compressGzipLike(data: string, level: number): string {
    // Run-length encoding for repeated characters
    let compressed = data.replace(/(.)\1{2,}/g, (match, char) => {
      return `${char}${String.fromCharCode(128 + match.length)}`;
    });

    // Simple dictionary compression for common words if level >= 4
    if (level >= 4) {
      const dictionary = this.buildDictionary(data);
      for (const [word, code] of dictionary) {
        compressed = compressed.replace(new RegExp('\\b' + word + '\\b', 'g'), code);
      }
    }

    return btoa(compressed);
  }

  private decompressGzipLike(data: string): string {
    let decompressed = atob(data);
    
    // Reverse run-length encoding
    decompressed = decompressed.replace(/(.)[\x80-\xFF]/g, (match, char) => {
      const length = match.charCodeAt(1) - 128;
      return char.repeat(length);
    });

    return decompressed;
  }

  // Base64 with JSON optimization
  private compressBase64(data: string): string {
    return btoa(data);
  }

  private decompressBase64(data: string): string {
    return atob(data);
  }

  // JSON-specific compression
  private compressJsonPack(data: string, level: number): string {
    try {
      const parsed = JSON.parse(data);
      const packed = this.packJson(parsed, level);
      return btoa(JSON.stringify(packed));
    } catch {
      // If not JSON, fall back to LZ-String
      return this.compressLZString(data, level);
    }
  }

  private decompressJsonPack(data: string): string {
    try {
      const packed = JSON.parse(atob(data));
      const unpacked = this.unpackJson(packed);
      return JSON.stringify(unpacked);
    } catch (error) {
      throw new Error(`JSON decompression failed: ${error}`);
    }
  }

  // Chunked compression for large files
  private async compressWithChunking(data: string, options: CompressionOptions): Promise<string> {
    const { chunkSize = 64 * 1024, algorithm = 'lz-string', onProgress } = options;
    const chunks: string[] = [];
    const totalChunks = Math.ceil(data.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);

      let compressedChunk: string;
      switch (algorithm) {
        case 'lz-string':
          compressedChunk = this.compressLZString(chunk, 3);
          break;
        default:
          compressedChunk = this.compressLZString(chunk, 3);
      }

      chunks.push(compressedChunk);

      if (onProgress) {
        const progress = 20 + (i / totalChunks) * 60;
        onProgress(progress, `Compressing chunk ${i + 1}/${totalChunks}`);
      }
    }

    return JSON.stringify({
      chunks,
      metadata: {
        totalChunks,
        chunkSize,
        originalLength: data.length
      }
    });
  }

  private async decompressWithChunking(data: string, algorithm: CompressionOptions['algorithm']): Promise<string> {
    const chunkedData = JSON.parse(data);
    const { chunks, metadata } = chunkedData;
    let result = '';

    for (let i = 0; i < chunks.length; i++) {
      let decompressedChunk: string;
      switch (algorithm) {
        case 'lz-string':
          decompressedChunk = this.decompressLZString(chunks[i]);
          break;
        default:
          decompressedChunk = this.decompressLZString(chunks[i]);
      }
      result += decompressedChunk;
    }

    return result;
  }

  // Helper methods
  private buildDictionary(data: string): Map<string, string> {
    const words = data.match(/\b\w{3,}\b/g) || [];
    const frequency = new Map<string, number>();
    
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    const dictionary = new Map<string, string>();
    let code = 0;
    
    Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100) // Top 100 most frequent words
      .forEach(([word]) => {
        dictionary.set(word, String.fromCharCode(0x1000 + code++));
      });

    return dictionary;
  }

  private packJson(obj: any, level: number): any {
    if (level < 3) return obj;

    // Remove null values and empty arrays/objects
    if (Array.isArray(obj)) {
      return obj.filter(item => item != null).map(item => this.packJson(item, level));
    } else if (typeof obj === 'object' && obj !== null) {
      const packed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value != null && !(Array.isArray(value) && value.length === 0) && 
            !(typeof value === 'object' && Object.keys(value).length === 0)) {
          packed[key] = this.packJson(value, level);
        }
      }
      return packed;
    }

    return obj;
  }

  private unpackJson(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.unpackJson(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const unpacked: any = {};
      for (const [key, value] of Object.entries(obj)) {
        unpacked[key] = this.unpackJson(value);
      }
      return unpacked;
    }
    return obj;
  }

  /**
   * Get compression statistics for different algorithms
   */
  async getCompressionStats(data: string): Promise<{
    algorithm: string;
    originalSize: number;
    compressedSize: number;
    ratio: number;
    time: number;
  }[]> {
    const algorithms: CompressionOptions['algorithm'][] = ['lz-string', 'gzip-like', 'base64', 'json-pack'];
    const stats = [];

    for (const algorithm of algorithms) {
      const startTime = Date.now();
      try {
        const result = await this.compress(data, { algorithm, level: 3 });
        stats.push({
          algorithm: algorithm!,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          ratio: result.compressionRatio,
          time: Date.now() - startTime
        });
      } catch (error) {
        console.warn(`Failed to test compression with ${algorithm}:`, error);
      }
    }

    return stats;
  }
}