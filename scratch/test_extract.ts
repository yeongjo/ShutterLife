import { readFileSync } from 'fs';
import { extractMetadata } from '../src/lib/extract.ts';

const buffer = readFileSync('C:\\Users\\syj24\\Downloads\\IMG_0266.CR3');
const file = {
  size: buffer.byteLength,
  name: 'IMG_0266.CR3',
  slice: (start, end) => {
    const sliced = buffer.slice(start, end);
    return {
      arrayBuffer: async () => new Uint8Array(sliced).buffer
    };
  }
};
extractMetadata(file).then(r => console.log('Result:', r)).catch(e => console.error(e));
