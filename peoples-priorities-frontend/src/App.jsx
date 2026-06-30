import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import SubmitPage from './pages/SubmitPage';
import ConfirmationPage from './pages/ConfirmationPage';
import PublicBoardPage from './pages/PublicBoardPage';
import MPLoginPage from './pages/MPLoginPage';
import MPDashboardPage from './pages/MPDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast configurations */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#333',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px'
          },
          success: {
            style: {
              background: '#1D9E75'
            }
          }
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/submit/confirm" element={<ConfirmationPage />} />
        <Route path="/board/:constituencyId" element={<PublicBoardPage />} />
        <Route path="/mp/login" element={<MPLoginPage />} />
        <Route path="/mp/dashboard" element={<MPDashboardPage />} />
        {/* Wildcard redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
