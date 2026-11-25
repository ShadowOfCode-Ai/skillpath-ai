/**
 * @file App.tsx
 * Application root and router definition for SkillPath AI.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider, ErrorBoundary } from './components/common/Feedback';
import { AppShell } from './components/layout/AppShell';

import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { HowScoringWorksPage } from './pages/HowScoringWorksPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResumePage } from './pages/ResumePage';
import { SkillsPage } from './pages/SkillsPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { CareersPage } from './pages/CareersPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/how-scoring-works" element={<HowScoringWorksPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Journey & Application Shell Routes */}
              <Route
                path="/dashboard"
                element={
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                }
              />
              <Route
                path="/profile"
                element={
                  <AppShell>
                    <ProfilePage />
                  </AppShell>
                }
              />
              <Route
                path="/resume"
                element={
                  <AppShell>
                    <ResumePage />
                  </AppShell>
                }
              />
              <Route
                path="/skills"
                element={
                  <AppShell>
                    <SkillsPage />
                  </AppShell>
                }
              />
              <Route
                path="/assessment"
                element={
                  <AppShell>
                    <AssessmentPage />
                  </AppShell>
                }
              />
              <Route
                path="/careers"
                element={
                  <AppShell>
                    <CareersPage />
                  </AppShell>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <AppShell>
                    <RoadmapPage />
                  </AppShell>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <AppShell>
                    <OpportunitiesPage />
                  </AppShell>
                }
              />
              <Route
                path="/report"
                element={
                  <AppShell>
                    <ReportPage />
                  </AppShell>
                }
              />
              <Route
                path="/settings"
                element={
                  <AppShell>
                    <SettingsPage />
                  </AppShell>
                }
              />
              <Route
                path="/admin"
                element={
                  <AppShell>
                    <AdminPage />
                  </AppShell>
                }
              />
              <Route
                path="/admin/system-check"
                element={
                  <AppShell>
                    <AdminPage />
                  </AppShell>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
