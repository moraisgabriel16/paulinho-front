import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'professor' | 'coordenador';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, token, isLoading } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  useEffect(() => {
    // Se não está carregando, pode parar de verificar
    setIsCheckingAuth(isLoading);
  }, [isLoading, token, user]);

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full mb-4 animate-pulse">
            <span className="text-3xl">🏃</span>
          </div>
          <p className="text-gray-600 font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-5xl mb-4">🚫</div>
          <p className="text-red-600 font-semibold text-lg">Acesso Negado</p>
          <p className="text-gray-600 text-sm mt-2">Esta página é restrita para {requiredRole === 'professor' ? 'Professores' : 'Coordenadores'}.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
