import { Router } from 'express';
import { fetchAllDeals, fetchOwners, fetchOwnersByIds } from '../utils/hubspot.js';
import { getHubSpotAccessToken } from '../utils/env.js';

const router = Router();

const OWNER_NAME_FALLBACKS = {
  '76296915': 'Chirag Patel',
  '77496705': 'Mike Sorisi',
  '78934545': 'Sakshi Batavia',
  '79631649': 'Kushagra singh',
  '80420705': 'Parambir Singh',
  '80943253': 'Prashant Kumar Tiwari',
  '81184822': 'Arnab Das',
  '81313553': 'Pratyush Sharma',
  '82747345': 'Yashvi Agarwal',
  '83517269': 'Steve Urquhart',
  '83521586': 'Babitto Johnson',
  '83522592': 'Rohan Vyas',
  '86326941': 'Abhishek Jain',
  '161050654': 'Zhash Mehta',
  '161619476': 'Mohit Ranjan',
  '162274607': 'Debaroti Dutta',
  '162384382': 'Jatin Tewari',
  '162584682': 'Swapnil dubey',
  '162614372': "Rishabh D'souza",
  '378610794': 'Anantika Jain',
  '1318763908': 'Abhishek Asawa',
  '1805309824': 'Abhimanyu Shekhawat',
  '1892163109': 'LITON DAS',
};

// In-memory cache to avoid hammering HubSpot on every page load.
// The client's "Refresh" button bypasses this via ?refresh=true.
let cache = null;
let cacheTime = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function mapHubSpotError(err) {
  const rawMessage = err?.message ?? 'Failed to fetch deals from HubSpot.';

  if (rawMessage.includes('EXPIRED_AUTHENTICATION')) {
    return 'HubSpot rejected the configured access token as expired or invalid. If you just changed `.env`, restart the backend so it reloads the new token. Confirm HUBSPOT_ACCESS_TOKEN is a HubSpot private app token that starts with `pat-`.';
  }

  if (rawMessage.includes('401') || rawMessage.includes('Unauthorized')) {
    return 'HubSpot returned 401 Unauthorized. Confirm HUBSPOT_ACCESS_TOKEN is valid and has the required CRM read scopes.';
  }

  return rawMessage;
}

router.get('/', async (req, res) => {
  const accessToken = getHubSpotAccessToken();

  if (!accessToken) {
    return res.status(500).json({
      error: 'HUBSPOT_ACCESS_TOKEN is not set. Please configure your .env file.',
    });
  }

  const forceRefresh = req.query.refresh === 'true';
  const cacheValid = cache && cacheTime && Date.now() - cacheTime < CACHE_TTL_MS;

  if (!forceRefresh && cacheValid) {
    return res.json({ deals: cache, fetchedAt: cacheTime, fromCache: true });
  }

  try {
    const [ownerMap, deals] = await Promise.all([
      fetchOwners(accessToken),
      fetchAllDeals(accessToken, {}),
    ]);
    const missingOwnerIds = Array.from(
      new Set(
        deals
          .map((deal) => deal.hubspot_owner_id)
          .filter((id) => id != null && !(String(id) in ownerMap))
      )
    );
    if (missingOwnerIds.length > 0) {
      const missingOwners = await fetchOwnersByIds(accessToken, missingOwnerIds);
      Object.assign(ownerMap, missingOwners);
    }
    for (const [id, name] of Object.entries(OWNER_NAME_FALLBACKS)) {
      if (!ownerMap[id]) ownerMap[id] = name;
    }
    // Re-resolve owner names now that we have the map
    for (const deal of deals) {
      deal.ownerName = ownerMap[deal.hubspot_owner_id] ?? deal.hubspot_owner_id ?? '—';
    }
    cache = deals;
    cacheTime = Date.now();
    return res.json({ deals, fetchedAt: cacheTime, fromCache: false });
  } catch (err) {
    console.error('HubSpot fetch error:', err?.message ?? err);
    const status = err?.response?.status ?? err?.statusCode ?? 500;
    return res.status(status).json({
      error: mapHubSpotError(err),
    });
  }
});

export default router;
