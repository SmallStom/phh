import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { RecordsList } from './pages/RecordsList';
import { RecordDetail } from './pages/RecordDetail';
import { RecordEdit } from './pages/RecordEdit';
import { TimelineView } from './pages/TimelineView';
import { ExperienceEdit } from './pages/ExperienceEdit';
import { ExperienceDetail } from './pages/ExperienceDetail';
import { CollectionsGrid } from './pages/CollectionsGrid';
import { CollectionEdit } from './pages/CollectionEdit';
import { CollectionDetail } from './pages/CollectionDetail';
import { Search } from './pages/Search';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { FollowingList } from './pages/FollowingList';
import { FollowersList } from './pages/FollowersList';
import { NotificationSettings } from './pages/NotificationSettings';
import { PageTransition } from './components/animation/PageTransition';
import { KeyboardShortcuts } from './components/keyboard/KeyboardShortcuts';

// 包装路由组件以支持动画
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Layout />}>
          <Route index element={
            <PageTransition>
              <Home />
            </PageTransition>
          } />

          <Route path="records" element={
            <PageTransition>
              <RecordsList />
            </PageTransition>
          } />
          <Route path="records/new" element={
            <PageTransition>
              <RecordEdit />
            </PageTransition>
          } />
          <Route path="records/:id" element={
            <PageTransition>
              <RecordDetail />
            </PageTransition>
          } />
          <Route path="records/:id/edit" element={
            <PageTransition>
              <RecordEdit />
            </PageTransition>
          } />

          <Route path="experiences" element={
            <PageTransition>
              <TimelineView />
            </PageTransition>
          } />
          <Route path="experiences/new" element={
            <PageTransition>
              <ExperienceEdit />
            </PageTransition>
          } />
          <Route path="experiences/:id" element={
            <PageTransition>
              <ExperienceDetail />
            </PageTransition>
          } />
          <Route path="experiences/:id/edit" element={
            <PageTransition>
              <ExperienceEdit />
            </PageTransition>
          } />

          <Route path="collections" element={
            <PageTransition>
              <CollectionsGrid />
            </PageTransition>
          } />
          <Route path="collections/new" element={
            <PageTransition>
              <CollectionEdit />
            </PageTransition>
          } />
          <Route path="collections/:id" element={
            <PageTransition>
              <CollectionDetail />
            </PageTransition>
          } />
          <Route path="collections/record/:recordId" element={
            <PageTransition>
              <CollectionEdit />
            </PageTransition>
          } />
          <Route path="collections/experience/:experienceId" element={
            <PageTransition>
              <CollectionEdit />
            </PageTransition>
          } />

          <Route path="search" element={
            <PageTransition>
              <Search />
            </PageTransition>
          } />
          <Route path="profile" element={
            <PageTransition>
              <Profile />
            </PageTransition>
          } />
          <Route path="profile/followers" element={
            <PageTransition>
              <FollowersList />
            </PageTransition>
          } />
          <Route path="profile/following" element={
            <PageTransition>
              <FollowingList />
            </PageTransition>
          } />
          <Route path="users/:id" element={
            <PageTransition>
              <UserProfile />
            </PageTransition>
          } />
          <Route path="users/by-username/:username" element={
            <PageTransition>
              <UserProfile />
            </PageTransition>
          } />
          <Route path="users/:id/following" element={
            <PageTransition>
              <FollowingList />
            </PageTransition>
          } />
          <Route path="users/:id/followers" element={
            <PageTransition>
              <FollowersList />
            </PageTransition>
          } />
          <Route path="settings/notifications" element={
            <PageTransition>
              <NotificationSettings />
            </PageTransition>
          } />
        </Route>
      </Routes>
      <KeyboardShortcuts />
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
