import { CodeAnalysis } from 'jitterbit-script';

/**
 * Code analysis map keyed with file URIs.
 */
export type FileMap = Map<string, CodeAnalysis>;

/**
 * Creates an empty file map.
 * @returns 
 */
export function initFileMap(): FileMap {
	return new Map<string, CodeAnalysis>();
}
