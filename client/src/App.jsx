import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Summary from './pages/Summary.jsx';
import DealDetails from './pages/DealDetails.jsx';
import DemandGenTracker from './pages/DemandGenTracker.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Spinner from './components/Spinner.jsx';
import { useDeals } from './hooks/useDeals.js';
import { useAuth } from './hooks/useAuth.js';
import logoImage from './assets/image.png';
import { useState } from 'react';

const TABS = ['Pipeline Summary', 'Deals', 'Demand Gen Tracker'];
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('Pipeline Summary');
  const [geo, setGeo] = useState('All');
  const { deals, loading, error, fetchedAt, fetchDeals } = useDeals();
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchDeals(false);
  }, [fetchDeals]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] font-sans text-slate-900">
      {/* Top nav */}
      <header className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
                <img src={logoImage} alt="GTM Dashboard" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Nurix</p>
                <span className="text-xl font-semibold tracking-tight text-slate-900">GTM Dashboard</span>
              </div>
            </div>

            <nav className="flex flex-wrap justify-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-1 md:justify-center md:place-self-center">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-blue-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-end min-w-0">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm whitespace-nowrap">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Data</p>
                <p className="mt-1 font-medium text-slate-700">
                  {fetchedAt && !loading ? `Refreshed ${fetchedAt.toLocaleTimeString()}` : 'Waiting for refresh'}
                </p>
              </div>
              <button
                onClick={() => fetchDeals(true)}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? <Spinner size="sm" /> : null}
                Refresh Data
              </button>

              {user && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm min-w-0">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-9 w-9 rounded-2xl border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="hidden sm:block min-w-0">
                    <p className="text-sm font-semibold leading-tight text-slate-800 truncate max-w-[140px] md:max-w-[160px]">
                      {user.name}
                    </p>
                    <p className="text-xs leading-tight text-slate-400 truncate max-w-[160px] md:max-w-[200px]">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-400 text-sm">Fetching deals from HubSpot…</p>
          </div>
        ) : (
          <>
            {activeTab === 'Pipeline Summary' && (
              <Summary deals={deals} geo={geo} onGeoChange={setGeo} fetchedAt={fetchedAt} />
            )}
            {activeTab === 'Deals' && (
              <DealDetails deals={deals} />
            )}
            {activeTab === 'Demand Gen Tracker' && (
              <DemandGenTracker deals={deals} fetchedAt={fetchedAt} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {user ? <Dashboard /> : <LoginPage onSignIn={signIn} />}
    </GoogleOAuthProvider>
  );
}
