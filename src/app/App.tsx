import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from '@/state/AppState';
import { ToastProvider } from '@/components/Toast';
import { BottomNav } from '@/components/BottomNav';
import { ExploreScreen } from '@/screens/Explore';

const LocationDetailScreen = lazy(() => import('@/screens/LocationDetail').then((m) => ({ default: m.LocationDetailScreen })));
const HuntScreen = lazy(() => import('@/screens/Hunt').then((m) => ({ default: m.HuntScreen })));
const WatchlistScreen = lazy(() => import('@/screens/Watchlist').then((m) => ({ default: m.WatchlistScreen })));
const MoreScreen = lazy(() => import('@/screens/More').then((m) => ({ default: m.MoreScreen })));
const ReportScreen = lazy(() => import('@/screens/Report').then((m) => ({ default: m.ReportScreen })));
const WaveScreen = lazy(() => import('@/screens/Wave').then((m) => ({ default: m.WaveScreen })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <HashRouter>
      <AppProvider>
        <ToastProvider>
          <ScrollToTop />
          <div className="app">
            <BottomNav />
            <main id="main">
              <Suspense fallback={<div className="screen" style={{ paddingTop: 40 }} aria-busy="true"><p className="muted">Loading…</p></div>}>
                <Routes>
                  <Route path="/" element={<ExploreScreen />} />
                  <Route path="/spot/:id" element={<LocationDetailScreen />} />
                  <Route path="/hunt" element={<HuntScreen />} />
                  <Route path="/chase" element={<HuntScreen />} />
                  <Route path="/watch" element={<WatchlistScreen />} />
                  <Route path="/more" element={<MoreScreen />} />
                  <Route path="/report" element={<ReportScreen />} />
                  <Route path="/wave" element={<WaveScreen />} />
                  <Route path="*" element={<ExploreScreen />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </ToastProvider>
      </AppProvider>
    </HashRouter>
  );
}
