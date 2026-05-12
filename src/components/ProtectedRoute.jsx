import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');

  // 역할 판단
  const getRole = (user) => {
    if (!user) return 'anonymous';
    if (user.adminRole === 'super') return 'super';
    if (user.adminRole === 'store') return 'store';
    return 'user';
  };

  const role = getRole(user);

  if (!allowedRoles.includes(role)) {
    // 매장 관리자는 admin으로
    if (role === 'store') return <Navigate to="/admin" replace />;
    // 총괄 관리자는 super-admin으로
    if (role === 'super') return <Navigate to="/super-admin" replace />;
    // 비로그인은 로그인으로
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;