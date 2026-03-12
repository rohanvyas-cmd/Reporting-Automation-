/**
 * Industry Mapping Configuration
 *
 * INDUSTRY_PROPERTY_NAME: The internal HubSpot property name for the deal industry field.
 *   To verify: HubSpot Settings > Properties > search your "Industry" property > click it
 *   and copy the "Internal name" value.
 *
 * INDUSTRY_VALUE_MAP: Optional normalization map (case-insensitive). If empty, raw values
 *   will be used as-is (trimmed).
 */

// TODO: Verify this internal property name in HubSpot Settings > Properties
export const INDUSTRY_PROPERTY_NAME = 'industry';

export const INDUSTRY_VALUE_MAP = {};

/**
 * Resolve a raw industry value to a display label.
 * Returns a non-empty string or 'Unknown'.
 */
export function resolveIndustry(rawValue) {
  if (rawValue == null) return 'Unknown';
  const trimmed = String(rawValue).trim();
  if (!trimmed) return 'Unknown';
  const key = trimmed.toLowerCase();
  return INDUSTRY_VALUE_MAP[key] ?? trimmed;
}

