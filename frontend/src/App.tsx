import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { FoodDiscoveryPage } from './pages/FoodDiscoveryPage';
import { FoodComparisonPage } from './pages/FoodComparisonPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { NutritionPage } from './pages/NutritionPage';
import { GoalsPage } from './pages/GoalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AssistantPage } from './pages/AssistantPage';
import { CoachDashboard } from './pages/CoachDashboard';
import { CoachClientsPage } from './pages/CoachClientsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminFoodsPage } from './pages/AdminFoodsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminRecommendationRulesPage } from './pages/AdminRecommendationRulesPage';
import { PortfolioHeroPage } from './pages/PortfolioHeroPage';
import { DietPlanPage } from './pages/DietPlanPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes with standard Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/foods" element={<FoodDiscoveryPage />} />
          <Route path="/food-comparison" element={<FoodComparisonPage />} />
          <Route path="/diet-plans" element={<DietPlanPage />} />
          <Route path="/diet-plan" element={<Navigate to="/diet-plans" replace />} />

          {/* Client Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <RecommendationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <WorkoutsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nutrition"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <NutritionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <GoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <AssistantPage />
              </ProtectedRoute>
            }
          />

          {/* Coach Routes */}
          <Route
            path="/coach/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/clients"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachClientsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/foods"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFoodsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/recommendation-rules"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRecommendationRulesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 3D Developer Portfolio Lab Hero Page */}
        <Route path="/portfolio" element={<PortfolioHeroPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
