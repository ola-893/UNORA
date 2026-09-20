import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Web3Provider from '@/providers/Web3Provider';
import LandingPage from '@/pages/LandingPage';
import LendPage from '@/pages/LendPage';
import BorrowPage from '@/pages/BorrowPage';
import MarketDetailPage from '@/pages/MarketDetailPage';
import Dashboard from '@/pages/Dashboard';
import ActivityPage from '@/pages/ActivityPage';
import SponsorGraphPage from '@/pages/SponsorGraphPage';
import LoadingScreen from '@/components/LoadingScreen';
import { hasSeenIntro, markIntroSeen } from '@/lib/intro';

export default function App() {
  // The intro is a first-impression moment, not a loading state, so a returning visitor
  // starts with it already dismissed rather than watching it again on every reload.
  const [loading, setLoading] = useState(() => !hasSeenIntro());

  const handleComplete = useCallback(() => {
    markIntroSeen();
    setLoading(false);
  }, []);

  return (
    <ThemeProvider>
      <Web3Provider>
        <BrowserRouter>
          {loading && <LoadingScreen onComplete={handleComplete} />}
          <div className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
            <Routes>
              <Route path="/" element={<LandingPage ready={!loading} />} />
              <Route path="/lend" element={<LendPage />} />
              <Route path="/borrow" element={<BorrowPage />} />
              <Route path="/borrow/:symbol" element={<MarketDetailPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/activity" element={<ActivityPage />} />
              <Route path="/sponsor/graph" element={<SponsorGraphPage />} />
              {/* Anything unrouted falls back to the landing page rather than a blank screen. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </Web3Provider>
    </ThemeProvider>
  );
}
