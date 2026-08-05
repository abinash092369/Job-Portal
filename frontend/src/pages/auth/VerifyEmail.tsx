import React from 'react';
import { Navigate } from 'react-router-dom';

export const VerifyEmail: React.FC = () => {
  return <Navigate to="/login" replace />;
};

export default VerifyEmail;
