import { Client } from '@hubspot/api-client';
import { GEO_PROPERTY_NAME, resolveGeo } from '../config/geoMapping.js';
import { resolveCategory, STAGE_IDS } from '../config/stageMapping.js';
import { LEAD_SOURCE_PROPERTY, resolveLeadSource, resolveChannel } from '../config/leadSourceMapping.js';

const DEAL_PROPERTIES = [
  'dealname',
  'dealstage',
  'pipeline',
  'amount',
  'createdate',
  'closedate',
  'hs_lastmodifieddate',
  'hubspot_owner_id',
  GEO_PROPERTY_NAME,
  LEAD_SOURCE_PROPERTY,
];

const STAGE_DATE_PROPERTIES = STAGE_IDS.flatMap((id) => [
  `hs_date_entered_${id}`,
  `hs_date_exited_${id}`,
]);

// Deduplicate in case GEO_PROPERTY_NAME overlaps with defaults
const PROPERTIES = [...new Set([...DEAL_PROPERTIES, ...STAGE_DATE_PROPERTIES])];

const PAGE_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageWithRetry(client, after, retries = 0) {
  try {
    const response = await client.crm.deals.basicApi.getPage(
      PAGE_SIZE,
      after,
      PROPERTIES,
      undefined,
      undefined,
      false
    );
    return response;
  } catch (err) {
    const status = err?.response?.status ?? err?.statusCode;
    if ((status === 429 || status >= 500) && retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      console.warn(`HubSpot API ${status}, retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchPageWithRetry(client, after, retries + 1);
    }
    throw err;
  }
}

export async function fetchOwners(accessToken) {
  const client = new Client({ accessToken });
  const ownerMap = {};
  let after = undefined;

  do {
    const response = await client.crm.owners.ownersApi.getPage(undefined, after, 100, true);
    for (const owner of response.results ?? []) {
      const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email || String(owner.id);
      if (owner.id != null) ownerMap[String(owner.id)] = name;
      if (owner.userId != null) ownerMap[String(owner.userId)] = name;
    }
    after = response.paging?.next?.after ?? null;
  } while (after);

  return ownerMap;
}

export async function fetchOwnersByIds(accessToken, ownerIds = []) {
  const client = new Client({ accessToken });
  const ownerMap = {};

  for (const ownerId of ownerIds) {
    const id = Number(ownerId);
    if (!Number.isFinite(id)) continue;
    try {
      const owner = await client.crm.owners.ownersApi.getById(id, 'id', true);
      const name =
        [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
        owner.email ||
        String(owner.id);
      if (owner.id != null) ownerMap[String(owner.id)] = name;
      if (owner.userId != null) ownerMap[String(owner.userId)] = name;
    } catch (err) {
      // Skip missing/inaccessible owners without failing the whole request.
      continue;
    }
  }

  return ownerMap;
}

export async function fetchAllDeals(accessToken, ownerMap = {}) {
  const client = new Client({ accessToken });
  const allDeals = [];
  let after = undefined;

  do {
    const response = await fetchPageWithRetry(client, after);
    const results = response.results ?? [];

    for (const deal of results) {
      const props = deal.properties ?? {};
      const geoRaw = props[GEO_PROPERTY_NAME] ?? null;
      const geo = resolveGeo(geoRaw);
      const category = resolveCategory(props.dealstage);
      const stageHistory = STAGE_IDS.reduce((acc, id) => {
        const entered = props[`hs_date_entered_${id}`] ?? null;
        const exited = props[`hs_date_exited_${id}`] ?? null;
        if (entered || exited) {
          acc[id] = { entered, exited };
        }
        return acc;
      }, {});

      allDeals.push({
        id: deal.id,
        dealname: props.dealname ?? '',
        dealstage: props.dealstage ?? '',
        pipeline: props.pipeline ?? '',
        amount: props.amount ? parseFloat(props.amount) : null,
        createdate: props.createdate ?? null,
        closedate: props.closedate ?? null,
        hs_lastmodifieddate: props.hs_lastmodifieddate ?? null,
        hubspot_owner_id: props.hubspot_owner_id ?? null,
        ownerName: ownerMap[props.hubspot_owner_id] ?? props.hubspot_owner_id ?? '—',
        geoRaw,
        geography: geo,
        category,
        leadSource: resolveLeadSource(props[LEAD_SOURCE_PROPERTY]),
        acquisitionChannel: resolveChannel(resolveLeadSource(props[LEAD_SOURCE_PROPERTY])),
        stageHistory,
      });
    }

    const paging = response.paging;
    after = paging?.next?.after ?? null;
  } while (after);

  return allDeals;
}
