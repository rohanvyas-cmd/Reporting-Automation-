/**
 * Stage Mapping Configuration
 * Maps HubSpot numeric stage IDs to lifecycle categories.
 */

export const STAGE_CATEGORY_MAP = {
  '244798989':  'MQL',         // Initial Interest
  '1047744293': 'SAL',         // SAL
  '244798990':  'SQL',         // SQL
  '249283938':  'Active',      // Solutioning
  '244798994':  'Active',      // Proposal
  '244798992':  'Active',      // Contract
  '1111696779': 'Active',      // Semi-Dormant
  '249323383':  'Active',      // Dormant
  '1099643979': 'Active',      // Revisit
  '1047744292': 'CLOSED_LOST', // Reject
  '244798995':  'CLOSED_WON',  // Deal Won
  '244798996':  'CLOSED_LOST', // Deal Lost
};

export const STAGE_IDS = Object.keys(STAGE_CATEGORY_MAP);

/**
 * Resolve a HubSpot stage ID to a lifecycle category.
 * Returns one of: 'MQL' | 'SAL' | 'SQL' | 'Active' | 'CLOSED_WON' | 'CLOSED_LOST'
 */
export function resolveCategory(stageId) {
  if (!stageId) return 'Active';
  return STAGE_CATEGORY_MAP[stageId] ?? 'Active';
}
