import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import CreateJobPost from './pages/CreateJobPost';
import JobPostDetail from './pages/JobPostDetail';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import CategoryPage from './pages/CategoryPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas protegidas / Dashboard (Futuro) */}
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="public-profile/:id" element={<PublicProfilePage />} />
            <Route path="job-posts/:id" element={<JobPostDetail />} />
            <Route path="category/:categoryId" element={<CategoryPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="create-job" element={<CreateJobPost />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="chats" element={<ChatPage />} />
              <Route path="chats/:peerId" element={<ChatPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
