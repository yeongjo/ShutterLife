// Utility to extract shutter count and camera model from a File (RAW or JPEG)
// Supports Sony and Fujifilm
// Returns { shutterCount, cameraModel, date } or nulls if not found

import { sonyModels, sonySeries } from './constants';

// Decipher table for encrypted Sony shutter count
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

	if (type === 7 && totalSize > 4) {
		value = grabData(4, arr, pos + 8, 4, isLE);
	}

	return { tag, format: type, value, size: totalSize };
}

// Main extraction function
export async function extractMetadata(
	file: File
): Promise<{ shutterCount: number | null; cameraModel: string | null; date: Date | null }> {
	// Read first 2MB for TIFF/EXIF/RAF parsing
	const bufferSize = Math.min(file.size, 2 * 1024 * 1024);
	const header = await file.slice(0, bufferSize).arrayBuffer();
	const fullView = new Uint8Array(header);

	let tiffOffset = 0;

	// 1. Detect format
	if (fullView[0] === 0xff && fullView[1] === 0xd8) {
		// JPEG - find APP1 Exif
		let pos = 2;
		while (pos + 10 < fullView.length) {
			const marker = (fullView[pos] << 8) | fullView[pos + 1];
			const length = (fullView[pos + 2] << 8) | fullView[pos + 3];
			if (marker === 0xffe1) {
				const segment = fullView.subarray(pos + 4, pos + 4 + length);
				for (let i = 0; i < segment.length - 6; i++) {
					if (
						segment[i] === 0x45 &&
						segment[i + 1] === 0x78 &&
						segment[i + 2] === 0x69 &&
						segment[i + 3] === 0x66 &&
						segment[i + 4] === 0x00 &&
						segment[i + 5] === 0x00
					) {
						tiffOffset = pos + 4 + i + 6;
						break;
					}
				}
				if (tiffOffset > 0) break;
			} else if (marker === 0xffda) break;
			pos += length + 2;
		}
	} else if (
		fullView[0] === 0x46 &&
		fullView[1] === 0x55 &&
		fullView[2] === 0x4a &&
		fullView[3] === 0x49
	) {
		// Fujifilm RAF - Search for Exif marker in the RAF file
		for (let i = 0; i < fullView.length - 10; i++) {
			if (
				fullView[i] === 0x45 &&
				fullView[i + 1] === 0x78 &&
				fullView[i + 2] === 0x69 &&
				fullView[i + 3] === 0x66 &&
				fullView[i + 4] === 0x00 &&
				fullView[i + 5] === 0x00
			) {
				tiffOffset = i + 6;
				break;
			}
		}
	}

	const view = tiffOffset > 0 ? fullView.subarray(tiffOffset) : fullView;

	// 2. Detect endianness from TIFF header
	let isLE: boolean | null = null;
	if (view[0] === 0x49 && view[1] === 0x49) isLE = true;
	if (view[0] === 0x4d && view[1] === 0x4d) isLE = false;
	if (isLE == null) return { shutterCount: null, cameraModel: null, date: null };

	// 3. Parse IFD chain
	let model = '';
	let make = '';
	let exifAddr: number | null = null;
	let nextIfdOffset = isLE
		? view[7] * 16777216 + view[6] * 65536 + view[5] * 256 + view[4]
		: view[4] * 16777216 + view[5] * 65536 + view[6] * 256 + view[7];

	if (nextIfdOffset === 0 || nextIfdOffset >= view.length) nextIfdOffset = 8;

	let loopGuard = 0;
	while (nextIfdOffset > 0 && nextIfdOffset + 2 <= view.length && loopGuard < 5) {
		let cA = nextIfdOffset;
		let ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
		cA += 2;

		while (ifdEntries > 0 && cA + 12 <= view.length) {
			const tag = parseTag(view, cA, isLE);
			if (tag.tag === 0x8769 && typeof tag.value === 'number') exifAddr = tag.value;
			if (tag.tag === 0x0110 && typeof tag.value === 'string' && !model) {
				model = tag.value.trim().replace(/\0+$/, '');
			}
			if (tag.tag === 0x010f && typeof tag.value === 'string' && !make) {
				make = tag.value.trim().replace(/\0+$/, '');
			}
			cA += 12;
			ifdEntries--;
		}

		if (cA + 4 <= view.length) {
			nextIfdOffset = isLE
				? view[cA + 3] * 16777216 + view[cA + 2] * 65536 + view[cA + 1] * 256 + view[cA]
				: view[cA] * 16777216 + view[cA + 1] * 65536 + view[cA + 2] * 256 + view[cA + 3];
		} else {
			nextIfdOffset = 0;
		}
		loopGuard++;
	}

	if (!exifAddr || exifAddr >= view.length)
		return { shutterCount: null, cameraModel: model || null, date: null };

	// 4. Parse EXIF IFD
	let cA = exifAddr;
	let ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
	cA += 2;
	let makernoteAddr: number | null = null;
	let dateOriginal: string | null = null;

	while (ifdEntries > 0 && cA + 12 <= view.length) {
		const tag = parseTag(view, cA, isLE);
		if (tag.tag === 0x927c && typeof tag.value === 'number') makernoteAddr = tag.value;
		if ((tag.tag === 0x9003 || tag.tag === 0x9004) && typeof tag.value === 'string')
			dateOriginal = tag.value;
		cA += 12;
		ifdEntries--;
	}

	let date: Date | null = null;
	if (dateOriginal) {
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

	if (!makernoteAddr || makernoteAddr >= view.length)
		return { shutterCount: null, cameraModel: model || null, date };

	// 5. Parse MakerNote
	cA = makernoteAddr;
	let shutterCount: number | null = null;

	// Detect MakerNote type
	if (
		view[makernoteAddr] === 83 &&
		view[makernoteAddr + 1] === 79 &&
		view[makernoteAddr + 2] === 78 &&
		view[makernoteAddr + 3] === 89
	) {
		// SONY MakerNote
		cA = makernoteAddr + 12;

		let wantedTag: number | null = null;
		let wantedAddr: number | null = null;
		let decipher = false;

		let matchedModel = sonyModels[model];
		if (!matchedModel) {
			const cleanModel = model.replace(/^Sony\s+/i, '').trim();
			matchedModel = sonyModels[cleanModel];
		}

		if (matchedModel) {
			const cameraType = matchedModel.type;
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
			wantedTag = 0x9050;
			decipher = true;
		}

		if (cA + 2 <= view.length) {
			ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
			cA += 2;
			while (ifdEntries > 0 && cA + 12 <= view.length) {
				const tag = parseTag(view, cA, isLE);
				if (tag.tag === wantedTag && typeof tag.value === 'number') {
					if (wantedAddr !== null) {
						const countPos = tag.value + wantedAddr;
						if (countPos + 3 <= view.length) {
							if (decipher) {
								shutterCount =
									doB(view[countPos]) + doB(view[countPos + 1]) * 256 + doB(view[countPos + 2]) * 65536;
							} else {
								shutterCount = view[countPos] + view[countPos + 1] * 256 + view[countPos + 2] * 65536;
							}
						}
					} else if (tag.tag === 0x9050) {
						for (const addr of [58, 50, 10]) {
							const countPos = tag.value + addr;
							if (countPos + 3 <= view.length) {
								const val =
									doB(view[countPos]) +
									doB(view[countPos + 1]) * 256 +
									doB(view[countPos + 2]) * 65536;
								if (val > 0 && val < 2000000) {
									shutterCount = val;
									break;
								}
							}
						}
					}
					if (shutterCount !== null) break;
				}
				cA += 12;
				ifdEntries--;
			}
		}
	} else if (
		view[makernoteAddr] === 0x46 &&
		view[makernoteAddr + 1] === 0x55 &&
		view[makernoteAddr + 2] === 0x4a &&
		view[makernoteAddr + 3] === 0x49 &&
		view[makernoteAddr + 4] === 0x46 &&
		view[makernoteAddr + 5] === 0x49 &&
		view[makernoteAddr + 6] === 0x4c &&
		view[makernoteAddr + 7] === 0x4d
	) {
		// FUJIFILM MakerNote
		// Header is "FUJIFILM" (8 bytes), then 4 bytes offset (usually 12)
		const fujiOffset = isLE
			? view[makernoteAddr + 11] * 16777216 +
				view[makernoteAddr + 10] * 65536 +
				view[makernoteAddr + 9] * 256 +
				view[makernoteAddr + 8]
			: view[makernoteAddr + 8] * 16777216 +
				view[makernoteAddr + 9] * 65536 +
				view[makernoteAddr + 10] * 256 +
				view[makernoteAddr + 11];

		cA = makernoteAddr + fujiOffset;
		if (cA + 2 <= view.length) {
			ifdEntries = isLE ? view[cA + 1] * 256 + view[cA] : view[cA] * 256 + view[cA + 1];
			cA += 2;
			while (ifdEntries > 0 && cA + 12 <= view.length) {
				const tag = parseTag(view, cA, isLE);
				// Tag 0x1438 or 0x1011 is ImageCount for Fujifilm
				if ((tag.tag === 0x1438 || tag.tag === 0x1011) && typeof tag.value === 'number') {
					shutterCount = tag.value;
					break;
				}
				cA += 12;
				ifdEntries--;
			}
		}
	}

	return {
		shutterCount,
		cameraModel: model ? (make && !model.startsWith(make) ? `${make} ${model}` : model) : null,
		date
	};
}

// Alias for backward compatibility
export const extractSonyShutterCount = extractMetadata;
