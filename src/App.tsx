import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Departments from './pages/Departments';
import Pharmacy from './pages/Pharmacy';
import Settings from './pages/Settings';
import About from './pages/About';
import { pageToPath, pathToPage, type PageId } from './lib/routes';

function AppShell() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useSessionTimeout(!!user, () => {
    logout();
    toast('Session expired after 1 hour of inactivity. Please sign in again.', 'error');
    navigate('/login', { replace: true });
  });

  if (!user) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return <Login />;
  }

  if (location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  const routePage = pathToPage(location.pathname);
  if (!routePage) {
    return <Navigate to="/dashboard" replace />;
  }

  const navigateTo = (next: PageId) => {
    navigate(pageToPath(next));
  };

  const content = {
    dashboard: <Dashboard onNavigate={navigateTo} />,
    patients: <Patients />,
    doctors: <Doctors />,
    appointments: <Appointments />,
    departments: <Departments />,
    pharmacy: <Pharmacy />,
    settings: <Settings />,
    about: <About />,
  }[routePage];

  return (
    <Layout page={routePage} onNavigate={navigateTo}>
      <div key={routePage} className="page-enter">
        {content}
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
