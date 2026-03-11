export const LEAD_SOURCE_PROPERTY = 'lead_source_1';

const LEAD_SOURCE_LABELS = {
  'Internal SDR': 'Internal SDR',
  'External SDR': 'External SDR',
  'Event SDRs': 'Event SDRs',
  'LinkedIn Ad': 'Organic Marketing - Website/SEO',
  'Organic Marketing - ABM Channel': 'Organic Marketing - ABM Channel',
  'SEO': 'Digital Marketing - Paid',
  'Partnership': 'Partnership',
  'Referral': 'Client Referral',
  'Event Marketing': 'Event Marketing',
  'Event Sales': 'Event Sales',
  'Sales/AE': 'Sales',
  'Consultants': 'Consultants',
};

export function resolveLeadSource(raw) {
  if (!raw) return null;
  return LEAD_SOURCE_LABELS[raw] ?? raw;
}

// Maps display label → acquisition channel
const CHANNEL_MAP = {
  'Organic Marketing - Website/SEO': 'Inbound',
  'Organic Marketing - ABM Channel': 'Inbound',
  'Digital Marketing - Paid': 'Inbound',
  'Internal SDR': 'Outbound',
  'External SDR': 'Outbound',
  'Event SDRs': 'Outbound',
  'Event Marketing': 'Events',
  'Event Sales': 'Events',
  'Sales': 'Sales',
  'Client Referral': 'Other',
  'Consultants': 'Other',
};

export function resolveChannel(displayLabel) {
  if (!displayLabel) return null;
  return CHANNEL_MAP[displayLabel] ?? null;
}
