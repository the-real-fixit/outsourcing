import { useAuth } from '../context/AuthContext';
import EmployerDashboard from './EmployerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import { Navigate } from 'react-router-dom';

const HomePage = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'PROVIDER') {
        return <EmployeeDashboard />;
    }

    // Default to Employer (CLIENT) dashboard
    return <EmployerDashboard />;
};

export default HomePage;
