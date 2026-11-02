// frontend/src/services/zipService.ts
//
// Dependency-free ZIP writer. Entries are "stored" (uncompressed), which is
// perfectly fine for a handful of small .rpy text files, and it avoids adding
// an npm package. File names and content are UTF-8 (flag bit 11 is set).

export interface ZipEntry {
    path: string; // e.g. "game/scene_1.rpy"
    content: string;
}

const encoder = new TextEncoder();

const CRC_TABLE: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

const crc32 = (data: Uint8Array): number => {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
};

export function buildZip(entries: ZipEntry[], now: Date = new Date()): Uint8Array {
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const UTF8_FLAG = 0x0800;

    const body: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    for (const entry of entries) {
        const name = encoder.encode(entry.path);
        const data = encoder.encode(entry.content);
        const crc = crc32(data);

        // Local file header + data
        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true); // version needed
        lv.setUint16(6, UTF8_FLAG, true);
        lv.setUint16(8, 0, true); // method 0 = stored
        lv.setUint16(10, dosTime, true);
        lv.setUint16(12, dosDate, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true); // compressed size
        lv.setUint32(22, data.length, true); // uncompressed size
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true); // extra length
        local.set(name, 30);

        // Central directory record
        const cen = new Uint8Array(46 + name.length);
        const cv = new DataView(cen.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true); // version made by
        cv.setUint16(6, 20, true); // version needed
        cv.setUint16(8, UTF8_FLAG, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, dosTime, true);
        cv.setUint16(14, dosDate, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint16(30, 0, true); // extra length
        cv.setUint16(32, 0, true); // comment length
        cv.setUint16(34, 0, true); // disk number
        cv.setUint16(36, 0, true); // internal attrs
        cv.setUint32(38, 0, true); // external attrs
        cv.setUint32(42, offset, true); // local header offset
        cen.set(name, 46);

        body.push(local, data);
        central.push(cen);
        offset += local.length + data.length;
    }

    const centralSize = central.reduce((n, c) => n + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    const parts = [...body, ...central, end];
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let pos = 0;
    for (const p of parts) {
        out.set(p, pos);
        pos += p.length;
    }
    return out;
}

export async function downloadZip(entries: ZipEntry[], zipName: string): Promise<void> {
    const blob = new Blob([buildZip(entries) as BlobPart], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before releasing the blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}