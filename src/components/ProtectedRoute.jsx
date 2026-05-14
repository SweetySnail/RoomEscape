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

  // 매장관리자 첫 로그인 시 비밀번호 변경 강제
  if (
    role === 'store' &&
    user?.passwordChanged === false &&
    window.location.pathname !== '/change-password'
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === 'store') return <Navigate to="/admin" replace />;
    if (role === 'super') return <Navigate to="/super-admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;