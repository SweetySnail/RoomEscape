import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReservationPage from './pages/ReservationPage';
import CalendarPage from './pages/CalendarPage';
import EventPage from './pages/EventPage';
import MyPage from './pages/MyPage';
import PrivacyPage from './pages/PrivacyPage';

// 임시 - 더미 데이터 생성 후 삭제
import { generateDummyData } from './generateDummyData';
generateDummyData();

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/admin" element={<AdminPage />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reserve" element={<ReservationPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/event" element={<EventPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </Router>
  );
}

export default App;