import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all 10 pages
import HomeSearch from '../pages/HomeSearch';
import ExploreCities from '../pages/ExploreCities';
import TripBuilder from '../pages/TripBuilder';
import DailyItinerary from '../pages/DailyItinerary';
import BudgetTracker from '../pages/BudgetTracker';
import PackingPage from '../pages/PackingPage';
import DocumentVault from '../pages/DocumentVault';
import CommunityTrips from '../pages/CommunityTrips';
import UserProfile from '../pages/UserProfile';
import SafetyTips from '../pages/SafetyTips';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Home / Search */}
      <Route path="/" element={<HomeSearch />} />
      
      {/* 2. Exploration */}
      <Route path="/explore" element={<ExploreCities />} />
      
      {/* 3. Trip Builder (The DnD Core) */}
      <Route path="/builder" element={<TripBuilder />} />
      
      {/* 4. Daily Itinerary */}
      <Route path="/itinerary" element={<DailyItinerary />} />
      
      {/* 5. Budget Tracker */}
      <Route path="/budget" element={<BudgetTracker />} />
      
      {/* 6. Packing List */}
      <Route path="/packing" element={<PackingPage />} />
      
      {/* 7. Document Vault */}
      <Route path="/vault" element={<DocumentVault />} />
      
      {/* 8. Community */}
      <Route path="/community" element={<CommunityTrips />} />
      
      {/* 9. Profile & Badges */}
      <Route path="/profile" element={<UserProfile />} />
      
      {/* 10. Safety & Local Tips */}
      <Route path="/safety" element={<SafetyTips />} />

      {/* Fallback - redirect 404s to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};