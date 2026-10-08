import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import { GuestOnly, RequireAuth, RequirePasswordChanged, RequireSuperAdmin } from './components/RouteGuards.jsx'
import LoginPage from './pages/LoginPage.jsx'

// Pages are loaded when first opened, so the login screen does not wait for the chart library.
const ActivityPage = lazy(() => import('./pages/ActivityPage.jsx'))
const AdminAccountsPage = lazy(() => import('./pages/AdminAccountsPage.jsx'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage.jsx'))
const CropsPage = lazy(() => import('./pages/CropsPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const FarmHistoryPage = lazy(() => import('./pages/FarmHistoryPage.jsx'))
const FarmPage = lazy(() => import('./pages/FarmPage.jsx'))
const FarmsPage = lazy(() => import('./pages/FarmsPage.jsx'))
const ReadingFormPage = lazy(() => import('./pages/ReadingFormPage.jsx'))
const ReadingResultPage = lazy(() => import('./pages/ReadingResultPage.jsx'))
const WaterReportPage = lazy(() => import('./pages/WaterReportPage.jsx'))
const ZonePage = lazy(() => import('./pages/ZonePage.jsx'))

export default function App() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-stone-500">Loading…</p>}>
      <AppRoutes />
    </Suspense>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />

        <Route element={<RequirePasswordChanged />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms/:farmId" element={<FarmPage />} />
            <Route path="/farms/:farmId/history" element={<FarmHistoryPage />} />
            <Route path="/zones/:zoneId" element={<ZonePage />} />
            <Route path="/zones/:zoneId/readings/new" element={<ReadingFormPage />} />
            <Route path="/readings/:readingId" element={<ReadingResultPage />} />
            <Route path="/readings/:readingId/edit" element={<ReadingFormPage />} />
            <Route path="/reports/water" element={<WaterReportPage />} />

            <Route element={<RequireSuperAdmin />}>
              <Route path="/admin/accounts" element={<AdminAccountsPage />} />
              <Route path="/admin/crops" element={<CropsPage />} />
              <Route path="/admin/activity" element={<ActivityPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
