import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return <Outlet />;
};

export default ProtectedRoute;
