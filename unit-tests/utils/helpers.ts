import { toBigIntBE, toBufferBE } from "bigint-buffer";

export function bigintToBuffer(
  value: bigint | number | string,
  byteLength: number,
): Buffer {
  switch (typeof value) {
    case "number":
    case "string":
      return toBufferBE(BigInt(value), byteLength);
    case "bigint":
      return toBufferBE(value, byteLength);
  }
}

export function bufferToHexString(bytes: Uint8Array) {
  return Array.from(bytes, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

export function bufferToBigint(bytes: Buffer): BigInt {
  return toBigIntBE(bytes);
}
