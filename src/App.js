import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReservationPage from './pages/ReservationPage';
import CalendarPage from './pages/CalendarPage';
import ListPage from './pages/ListPage';
import EventPage from './pages/EventPage';
import MyPage from './pages/MyPage';
import AdminPage from './pages/AdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import PrivacyPage from './pages/PrivacyPage';
import PasswordChangePage from './pages/PasswordChangePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 누구나 접근 가능 */}
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* 첫 로그인 비밀번호 변경 (매장관리자 전용) */}
        <Route path="/change-password" element={
          <ProtectedRoute allowedRoles={['store']}>
            <PasswordChangePage />
          </ProtectedRoute>
        } />

        {/* 비회원 + 회원 접근 가능 */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['anonymous', 'user']}>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/reserve" element={
          <ProtectedRoute allowedRoles={['anonymous', 'user']}>
            <ReservationPage />
          </ProtectedRoute>
        } />
        <Route path="/event" element={
          <ProtectedRoute allowedRoles={['anonymous', 'user']}>
            <EventPage />
          </ProtectedRoute>
        } />

        {/* 로그인한 회원만 */}
        <Route path="/calendar" element={
          <ProtectedRoute allowedRoles={['user']}>
            <CalendarPage />
          </ProtectedRoute>
        } />
        <Route path="/mypage" element={
          <ProtectedRoute allowedRoles={['user']}>
            <MyPage />
          </ProtectedRoute>
        } />
        <Route path="/list" element={
          <ProtectedRoute allowedRoles={['user']}>
            <ListPage />
          </ProtectedRoute>
        } />

        {/* 매장 관리자 전용 */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['store']}>
            <AdminPage />
          </ProtectedRoute>
        } />

        {/* 총괄 관리자 전용 */}
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['super']}>
            <SuperAdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;