import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import HomePage from "./pages/HomePage.jsx";
import SquidProxyPage from "./pages/SquidProxyPage.jsx";
import SquidTopicPage from "./pages/SquidTopicPage.jsx";
import DataPage from "./pages/DataPage.jsx";
import FileServerPage from "./pages/FileServerPage.jsx";
import MailServerPage from "./pages/MailServerPage.jsx";
import MQTTPage from "./pages/MQTTPage.jsx";
import KeepalivedPage from "./pages/KeepalivedPage.jsx";
import LXDPage from "./pages/LXDPage.jsx";
import NextcloudPage from "./pages/NextcloudPage.jsx";
import { FORWARD_PROXY } from "./data/squid-forward.js";
import { REVERSE_PROXY } from "./data/squid-reverse.js";
import { TRANSPARENT_PROXY } from "./data/squid-transparent.js";
import { INTERCEPT_SSL_BUMP } from "./data/squid-intercept.js";
import { DOCKER_CONTAINERS } from "./data/docker-containers.js";
import SecureByDesignPage from "./pages/SecureByDesignPage.jsx";
import HighPerformancePage from "./pages/HighPerformancePage.jsx";
import FullControlPage from "./pages/FullControlPage.jsx";
import OpenSourcePage from "./pages/OpenSourcePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

function AdminOnlyRoute() {
  const { isLoggedIn, isAdmin, checking } = useAuth();
  if (checking) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/data" element={<DataPage />} />
      <Route path="/squid-proxy" element={<SquidProxyPage />} />
      <Route path="/squid-proxy/forward-proxy" element={<SquidTopicPage topic={FORWARD_PROXY} />} />
      <Route path="/squid-proxy/reverse-proxy" element={<SquidTopicPage topic={REVERSE_PROXY} />} />
      <Route path="/squid-proxy/transparent-proxy" element={<SquidTopicPage topic={TRANSPARENT_PROXY} />} />
      <Route path="/squid-proxy/intercept-ssl-bump" element={<SquidTopicPage topic={INTERCEPT_SSL_BUMP} />} />
      <Route path="/file-server" element={<FileServerPage />} />
      <Route path="/mail-server" element={<MailServerPage />} />
      <Route path="/docker-containers" element={<SquidTopicPage topic={DOCKER_CONTAINERS} />} />
      <Route path="/mqtt" element={<MQTTPage />} />
      <Route path="/keepalived" element={<KeepalivedPage />} />
      <Route path="/lxd" element={<LXDPage />} />
      <Route path="/nextcloud" element={<NextcloudPage />} />
      <Route path="/secure-by-design" element={<SecureByDesignPage />} />
      <Route path="/high-performance" element={<HighPerformancePage />} />
      <Route path="/full-control" element={<FullControlPage />} />
      <Route path="/open-source" element={<OpenSourcePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin area: requires login + role "admin". */}
      <Route element={<AdminOnlyRoute />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users" element={<AdminPage />} />
        <Route path="/admin/settings" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
