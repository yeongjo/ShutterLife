// Utility to extract Sony shutter count and camera model from a File (RAW or JPEG)
// Returns { shutterCount, cameraModel, date } or nulls if not found

import { sonyModels, sonySeries } from './constants';

// Decipher table for encrypted shutter count
const dTable: number[] = [];
(function fillDecipherTable() {
	let i = 0;
	while (i < 249) {
		dTable.push((i * i * i) % 249);
		i++;
	}
	while (i < 256) {
		dTable.push(i);
		i++;
	}
})();
function doB(b: number) {
	return dTable.indexOf(b);
}

// Helper to read bytes as various types with endianness support
function grabData(
	type: number,
	arr: Uint8Array,
	pos: number,
	size: number,
	isLE: boolean
): number | string | Uint8Array | undefined {
	if (pos + size > arr.length) return undefined;

	if (type === 1) return arr[pos]; // UI8
	if (type === 2) {
		let rt = '';
		for (let i = 0; i < size; i++) {
			const charCode = arr[pos + i];
			if (charCode === 0) break;
			rt += String.fromCharCode(charCode);
		}
		return rt;
	}
	if (type === 3) {
		// UI16
		return isLE ? arr[pos + 1] * 256 + arr[pos] : arr[pos] * 256 + arr[pos + 1];
	}
	if (type === 4) {
		// UI32
		return isLE
			? arr[pos + 3] * 16777216 + arr[pos + 2] * 65536 + arr[pos + 1] * 256 + arr[pos]
			: arr[pos] * 16777216 + arr[pos + 1] * 65536 + arr[pos + 2] * 256 + arr[pos + 3];
	}
	if (type === 7) return arr.slice(pos, pos + size); // UND
}

type TagValue = number | string | Uint8Array | undefined;
function parseTag(
	arr: Uint8Array,
	pos: number,
	isLE: boolean
): { tag: number; format: number; value: TagValue; size: number } {
	const tag = isLE ? arr[pos + 1] * 256 + arr[pos] : arr[pos] * 256 + arr[pos + 1];
	// Format is usually in the first 2 bytes of the format field depending on endianness? Actually TIFF format is 2 bytes.
	// In TIFF, Tag is 2 bytes, Type is 2 bytes, Count is 4 bytes, Value/Offset is 4 bytes.
	const type = isLE ? arr[pos + 3] * 256 + arr[pos + 2] : arr[pos + 2] * 256 + arr[pos + 3];
	const count = isLE
		? arr[pos + 7] * 16777216 + arr[pos + 6] * 65536 + arr[pos + 5] * 256 + arr[pos + 4]
		: arr[pos + 4] * 16777216 + arr[pos + 5] * 65536 + arr[pos + 6] * 256 + arr[pos + 7];

	let value: TagValue = undefined;
	// Calculate size based on type
	let typeSize = 1;
	if (type === 3) typeSize = 2;
	if (type === 4 || type === 9) typeSize = 4;
	if (type === 5 || type === 10) typeSize = 8;
	const totalSize = count * typeSize;

	if (totalSize <= 4) {
		value = grabData(type, arr, pos + 8, totalSize, isLE);
	} else {
		const offset = grabData(4, arr, pos + 8, 4, isLE);
		if (typeof offset === 'number' && offset + totalSize <= arr.length) {
			value = grabData(type, arr, offset, totalSize, isLE);
		}
	}

	// Special case for some tags that might return offset even if format is 7
	if (type === 7 && totalSize > 4) {
		value = grabData(4, arr, pos + 8, 4, isLE);
	}

	return { tag, format: type, value, size: totalSize };
}

// Main extraction function
export async function extractSonyShutterCount(
	file: File
): Promise<{ shutterCount: number | null; cameraModel: string | null; date: Date | null }> {
	// Read first 1MB for TIFF/EXIF parsing (increased from 100KB)
	const bufferSize = Math.min(file.size, 1024 * 1024);
	const header = await file.slice(0, bufferSize).arrayBuffer();
	const view = new Uint8Array(header);

	// Detect endianness
	let isLE: boolean | null = null;
	if (view[0] === 0x49 && view[1] === 0x49) isLE = true;
	if (view[0] === 0x4d && view[1] === 0x4d) isLE = false;
	if (isLE == null) return { shutterCount: null, cameraModel: null, date: null };

	// Find IFD0 offset
	let cA = isLE
		? view[7] * 16777216 + view[6] * 65536 + view[5] * 256 + view[4]
		: view[4] * 16777216 + view[5] * 65536 + view[6] * 256 + view[7];

	if (cA === 0 || cA >= view.length) cA = 8; // Fallback

	let ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
	cA += 2;
	let exifAddr: number | null = null;
	let model = '';

	while (ifdEntries > 0 && cA + 12 <= view.length) {
		const tag = parseTag(view, cA, isLE);
		if (tag.tag === 0x8769 && typeof tag.value === 'number') exifAddr = tag.value;
		if (tag.tag === 0x0110 && typeof tag.value === 'string')
			model = tag.value.trim().replace(/\0+$/, '');
		cA += 12;
		ifdEntries--;
	}

	if (!exifAddr || exifAddr >= view.length)
		return { shutterCount: null, cameraModel: model || null, date: null };

	// Find makernote and DateTimeOriginal in EXIF
	cA = exifAddr;
	ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
	cA += 2;
	let sonyAddr: number | null = null;
	let dateOriginal: string | null = null;

	while (ifdEntries > 0 && cA + 12 <= view.length) {
		const tag = parseTag(view, cA, isLE);
		if (tag.tag === 0x927c && typeof tag.value === 'number') sonyAddr = tag.value;
		if ((tag.tag === 0x9003 || tag.tag === 0x9004) && typeof tag.value === 'string')
			dateOriginal = tag.value;
		cA += 12;
		ifdEntries--;
	}

	let date: Date | null = null;
	if (dateOriginal) {
		// Format: "YYYY:MM:DD HH:MM:SS"
		const parts = dateOriginal.split(/[: ]/);
		if (parts.length >= 6) {
			const d = new Date(
				Number(parts[0]),
				Number(parts[1]) - 1,
				Number(parts[2]),
				Number(parts[3]),
				Number(parts[4]),
				Number(parts[5])
			);
			if (!isNaN(d.getTime())) date = d;
		}
	}

	if (!sonyAddr || sonyAddr >= view.length)
		return { shutterCount: null, cameraModel: model || null, date };

	// Offset for SONY makernote
	cA = sonyAddr;
	if (
		view[sonyAddr] === 83 &&
		view[sonyAddr + 1] === 79 &&
		view[sonyAddr + 2] === 78 &&
		view[sonyAddr + 3] === 89
	)
		cA = sonyAddr + 12;

	// Find shutter count tag/offset for this model
	let wantedTag: number | null = null;
	let wantedAddr: number | null = null;
	let decipher = false;
	if (model in sonyModels) {
		const cameraType = sonyModels[model].type;
		if (cameraType === sonySeries.DSLR) {
			wantedTag = 32;
			wantedAddr = 2118;
		} else if (cameraType === sonySeries.ILC1) {
			wantedTag = 0x9050;
			wantedAddr = 50;
			decipher = true;
		} else if (cameraType === sonySeries.ILC2) {
			wantedTag = 0x9050;
			wantedAddr = 58;
			decipher = true;
		} else if (cameraType === sonySeries.ILC3) {
			wantedTag = 0x9050;
			wantedAddr = 10;
			decipher = true;
		} else if (cameraType === sonySeries.DSL5) {
			wantedTag = 32;
			wantedAddr = 330;
		} else if (cameraType === sonySeries.DSLT) {
			wantedTag = 32;
			wantedAddr = 283;
		}
	} else {
		return { shutterCount: null, cameraModel: model || null, date };
	}

	// Find the tag and extract the count
	if (cA + 2 > view.length) return { shutterCount: null, cameraModel: model || null, date };
	ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
	cA += 2;

	let shutterCount: number | null = null;
	while (ifdEntries > 0 && cA + 12 <= view.length) {
		const tag = parseTag(view, cA, isLE);
		if (tag.tag === wantedTag && wantedAddr != null && typeof tag.value === 'number') {
			const countPos = tag.value + wantedAddr;
			if (countPos + 3 <= view.length) {
				if (decipher) {
					shutterCount =
						doB(view[countPos]) + doB(view[countPos + 1]) * 256 + doB(view[countPos + 2]) * 65536;
				} else {
					shutterCount = view[countPos] + view[countPos + 1] * 256 + view[countPos + 2] * 65536;
				}
			}
			break;
		}
		cA += 12;
		ifdEntries--;
	}
	return { shutterCount, cameraModel: model || null, date };
}
