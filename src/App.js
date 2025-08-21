import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ListPage from './pages/ListPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로 설정 */}
        <Route path="/" element={<HomePage />} />
        {/* 각 페이지 경로 설정 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </Router>
  );
}

export default App;