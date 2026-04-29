import fs from 'fs';

function grabData(type, arr, pos, size, isLE) {
    if (pos + size > arr.length) return undefined;
    if (type === 3) {
        const count = size / 2;
        const res = [];
        for (let i = 0; i < count; i++) {
            res.push(isLE ? arr[pos + i*2 + 1] * 256 + arr[pos + i*2] : arr[pos + i*2] * 256 + arr[pos + i*2 + 1]);
        }
        return res;
    }
    return null;
}

function parseIFD(arr, offset, isLE, name) {
    if (offset === undefined || offset === null) return;
    let cA = offset;
    let entries = isLE ? arr[cA + 1] * 256 + arr[cA] : arr[cA] * 256 + arr[cA + 1];
    cA += 2;
    for (let i = 0; i < entries; i++) {
        const tag = isLE ? arr[cA + 1] * 256 + arr[cA] : arr[cA] * 256 + arr[cA + 1];
        const type = isLE ? arr[cA + 3] * 256 + arr[cA + 2] : arr[cA + 2] * 256 + arr[cA + 3];
        const count = isLE ? arr.readUInt32LE(cA + 4) : arr.readUInt32BE(cA + 4);
        
        let typeSize = 1;
        if (type === 3) typeSize = 2;
        if (type === 4) typeSize = 4;
        const totalSize = count * typeSize;
        
        let value;
        if (totalSize <= 4) {
            value = grabData(type, arr, cA + 8, totalSize, isLE);
        } else {
            const valOffset = isLE ? arr.readUInt32LE(cA + 8) : arr.readUInt32BE(cA + 8);
            value = grabData(type, arr, valOffset, totalSize, isLE);
        }
        
        if (tag === 0x8769) parseIFD(arr, value, isLE, 'Exif');
        if (tag === 0x927c) {
            const makernoteOffset = isLE ? arr.readUInt32LE(cA + 8) : arr.readUInt32BE(cA + 8);
            parseIFD(arr, makernoteOffset, isLE, 'MakerNote');
        }

        if (name === 'MakerNote' && (tag === 0x0001 || tag === 0x0004)) {
            console.log(`MakerNote Tag 0x${tag.toString(16).padStart(4, '0')}:`, value);
        }
        
        cA += 12;
    }
}

const b = fs.readFileSync('C:\\Users\\syj24\\Downloads\\canon_eos_200d_01.cr2');
parseIFD(b, b.readUInt32LE(4), true, 'IFD0');
