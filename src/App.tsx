import { Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import { LanguageProvider } from '@/components/language-provider';
import { CommunityClientPage, DownloadClientPage, ForksClientPage, ModsClientPage, PublishVersionClientPage, RulesClientPage, VersionsClientPage } from '@/components/client-pages';
import HomePage from '@/pages/home-page';
import PlayPage from '@/pages/play-page';

function AppLayout() {
  return (
    <LanguageProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="play" element={<PlayPage />} />
        <Route path="download" element={<DownloadClientPage />} />
        <Route path="versions" element={<VersionsClientPage />} />
        <Route path="versions/publish" element={<PublishVersionClientPage />} />
        <Route path="mods" element={<ModsClientPage />} />
        <Route path="forks" element={<ForksClientPage />} />
        <Route path="community" element={<CommunityClientPage />} />
        <Route path="rules" element={<RulesClientPage />} />
      </Route>
    </Routes>
  );
}
