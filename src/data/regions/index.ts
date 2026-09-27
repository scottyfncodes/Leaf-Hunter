import type { Region } from '@/domain/types';
import { COLORADO } from './colorado';

/**
 * Region registry. Adding a state means adding a folder under regions/ and
 * listing it here; every screen reads from the active region.
 */
export const REGIONS: Region[] = [COLORADO];

export const DEFAULT_REGION_ID = COLORADO.id;

export function getRegion(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? COLORADO;
}
