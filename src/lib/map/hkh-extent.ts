import type Map from 'ol/Map';
import { getCenter, type Extent } from 'ol/extent';
import { transformExtent } from 'ol/proj';

/** Bounding box of the ICIMOD HKH Outline layer (EPSG:4326). */
export const HKH_OUTLINE_EXTENT_4326: Extent = [60.84948, 16.01055, 105.04409, 39.31221];

export const HKH_OUTLINE_EXTENT = transformExtent(
	HKH_OUTLINE_EXTENT_4326,
	'EPSG:4326',
	'EPSG:3857'
);

export const HKH_OUTLINE_CENTER = getCenter(HKH_OUTLINE_EXTENT);

export function fitMapToHkhOutline(map: Map | null, duration = 0) {
	if (!map) return;
	map.updateSize();
	const size = map.getSize();
	if (!size || size[0] < 2 || size[1] < 2) {
		map.once('change:size', () => fitMapToHkhOutline(map, duration));
		return;
	}
	map.getView().fit(HKH_OUTLINE_EXTENT, {
		size,
		padding: [32, 32, 32, 32],
		duration
	});
}
