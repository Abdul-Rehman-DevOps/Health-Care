import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Layout, { type PageId } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Departments from './pages/Departments';
import Pharmacy from './pages/Pharmacy';
import Settings from './pages/Settings';

function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');

  if (!user) return <Login />;

  const content = {
    dashboard: <Dashboard onNavigate={setPage} />,
    patients: <Patients />,
    doctors: <Doctors />,
    appointments: <Appointments />,
    departments: <Departments />,
    pharmacy: <Pharmacy />,
    settings: <Settings />,
  }[page];

  return (
    <Layout page={page} onNavigate={setPage}>
      <div key={page} className="page-enter">
        {content}
      </div>
    </Layout>
  );
}

export default function App() {
  return <AppShell />;
}
