import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');

  const getRole = (user) => {
    if (!user) return 'anonymous';
    if (user.adminRole === 'super') return 'super';
    if (user.adminRole === 'store') return 'store';
    return 'user';
  };

  const role = getRole(user);

  if (!allowedRoles.includes(role)) {
    // 관리자는 각자 페이지로
    if (role === 'store') return <Navigate to="/admin" replace />;
    if (role === 'super') return <Navigate to="/super-admin" replace />;
    // 비로그인이 로그인 필요 페이지 접근 시
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;