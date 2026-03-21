import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProgressProvider } from './context/ProgressContext';
import { PendingLinkProvider } from './context/PendingLinkContext';
import { ChatSessionsProvider } from './context/ChatSessionsContext';
import { MessagingProvider } from './context/MessagingContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { CreatorProfile } from './pages/CreatorProfile';
import { MyChatsHub } from './pages/MyChatsHub';
import { DMConversation } from './pages/DMConversation';
import { EditProfile } from './pages/EditProfile';
import { Pricing } from './pages/Pricing';
import { HowItWorks } from './pages/HowItWorks';
import { UseCases } from './pages/UseCases';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { HelpPage } from './pages/HelpPage';
import { ContactPage } from './pages/ContactPage';
import { ScrollToTop } from './components/ScrollToTop';
import { FollowerPairingMatch } from './pages/FollowerPairingMatch';
import { FollowerPairingMatching } from './pages/FollowerPairingMatching';
import { FollowerPairingChat } from './pages/FollowerPairingChat';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';

const AppLayout = ({ children, hideNav = false }: { children: ReactNode, hideNav?: boolean }) => (
  <>
    {!hideNav && <Navbar />}
    {children}
    <MobileBottomNav />
  </>
);

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const NotFound = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
    <h1 className="text-[80px] font-black tracking-tight text-brand leading-none mb-4 shadow-sm" style={{ textShadow: '0 4px 12px rgba(217, 119, 87, 0.15)' }}>404</h1>
    <p className="text-[20px] font-extrabold text-text mb-2">Oops, this link doesn't exist.</p>
    <p className="text-[14px] font-bold text-textMid mb-8 max-w-[300px]">The creator may have deleted this resource or the link is incorrect.</p>

    <div className="flex items-center gap-3 mb-12 flex-col sm:flex-row w-full sm:w-auto">
      <Link to="/" className="w-full sm:w-auto px-6 h-[44px] bg-brand text-white font-black text-[14px] rounded-[14px] flex items-center justify-center hover:bg-brand-hover shadow-sm">
        Go Home
      </Link>
    </div>

    <div className="flex items-center gap-1.5 opacity-60">
      <div className="w-5 h-5 rounded-[6px] bg-text text-white flex items-center justify-center font-black text-[9px] leading-none">
        UC
      </div>
      <span className="font-black text-[13px] tracking-tight text-text">UnlockTheContent</span>
    </div>
  </div>
);



import ResourceUnlockPage from './pages/ResourceUnlockPage';

const RootProfileRoute = () => {
  const { handle } = useParams();
  if (handle && handle.startsWith('@')) {
    return <CreatorProfile />;
  }
  return <NotFound />;
};

const AuthRedirect = ({ type }: { type: 'signIn' | 'signUp' | 'forgot' }) => {
  const { search } = useLocation();
  const param = type === 'signIn' ? 'signIn=true' : type === 'signUp' ? 'signUp=true' : 'forgot=true';
  return <Navigate to={`/?${param}${search.replace('?', '&')}`} replace />;
};

const AppRoutes = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#FAF9F7',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#21201C', marginBottom: '16px' }}>
            UnlockTheContent
          </div>
          <div style={{
            width: '36px', height: '36px', margin: '0 auto',
            border: '3px solid #E6E2D9', borderTopColor: '#D97757',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth callback routes */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/confirm" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Public routes */}
      <Route path="/pricing" element={<AppLayout><Pricing /></AppLayout>} />
      <Route path="/how-it-works" element={<AppLayout><HowItWorks /></AppLayout>} />
      <Route path="/use-cases" element={<AppLayout><UseCases /></AppLayout>} />
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <AppLayout>
              <Landing />
            </AppLayout>
          </PublicOnlyRoute>
        }
      />
      <Route path="/signin" element={<AuthRedirect type="signIn" />} />
      <Route path="/signup" element={<AuthRedirect type="signUp" />} />
      <Route path="/forgot-password" element={<AuthRedirect type="forgot" />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout hideNav>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Public routes */}
      <Route path="/r/:slug" element={<ResourceUnlockPage />} />
      <Route path="/r/:slug/match" element={<FollowerPairingMatch />} />
      <Route path="/r/:slug/matching" element={<FollowerPairingMatching />} />

      {/* Protected routes */}
      <Route path="/chats/:sessionId" element={<ProtectedRoute><AppLayout><FollowerPairingChat /></AppLayout></ProtectedRoute>} />
      <Route path="/messages/:conversationId" element={<ProtectedRoute><AppLayout><DMConversation /></AppLayout></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><AppLayout><MyChatsHub /></AppLayout></ProtectedRoute>} />
      <Route path="/my-chats" element={<Navigate to="/chats" replace />} />
      <Route path="/my-messages" element={<Navigate to="/chats" replace />} />

      {/* Public routes */}
      <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
      <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
      <Route path="/help" element={<AppLayout><HelpPage /></AppLayout>} />
      <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />

      {/* Protected routes */}
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/account/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

      {/* Dynamic routes */}
      <Route path="/:handle" element={<RootProfileRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <PendingLinkProvider>
            <ChatSessionsProvider>
              <MessagingProvider>
                <ProgressProvider>
                  <AppRoutes />
                </ProgressProvider>
              </MessagingProvider>
            </ChatSessionsProvider>
          </PendingLinkProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
