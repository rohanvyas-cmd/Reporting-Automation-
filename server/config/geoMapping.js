/**
 * Geography Mapping Configuration
 *
 * GEO_PROPERTY_NAME: The internal HubSpot property name for "Geography (New)".
 *   To verify: HubSpot Settings > Properties > search "Geography" > click the
 *   property > copy the "Internal name" value and update this constant.
 *
 * GEO_VALUE_MAP: Maps the raw property value to a display code.
 *   Values come from HubSpot exactly as-is (case-insensitive match).
 */

// TODO: Verify this internal property name in HubSpot Settings > Properties
export const GEO_PROPERTY_NAME = 'geography__cloned_';

export const GEO_VALUE_MAP = {
  us: 'US',
  sea: 'SEA',
  india: 'India',
  europe: 'Europe',
  mena: 'MENA',
  other: 'Other',
};

/**
 * Resolve a raw property value to a geography display code.
 * Returns one of: 'US' | 'SEA' | 'India' | 'Europe' | 'MENA' | 'Other' | 'Unknown'
 */
export function resolveGeo(rawValue) {
  if (!rawValue) return 'Unknown';
  const key = rawValue.trim().toLowerCase();
  return GEO_VALUE_MAP[key] ?? 'Unknown';
}
