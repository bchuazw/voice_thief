"use client";

export function makeMockRecordingBlob(durationMs: number): Blob {
  const seconds = Math.max(0.6, durationMs / 1000);
  const sampleRate = 8000;
  const samples = Math.floor(seconds * sampleRate);
  const wavHeaderSize = 44;
  const buf = new ArrayBuffer(wavHeaderSize + samples * 2);
  const view = new DataView(buf);

  function writeStr(off: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const v = Math.floor((Math.random() - 0.5) * 200);
    view.setInt16(wavHeaderSize + i * 2, v, true);
  }

  return new Blob([buf], { type: "audio/wav" });
}
