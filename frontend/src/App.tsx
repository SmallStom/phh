import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          <Route path="records" element={<RecordsList />} />
          <Route path="records/new" element={<RecordEdit />} />
          <Route path="records/:id" element={<RecordDetail />} />
          <Route path="records/:id/edit" element={<RecordEdit />} />
          
          <Route path="experiences" element={<TimelineView />} />
          <Route path="experiences/new" element={<ExperienceEdit />} />
          <Route path="experiences/:id" element={<ExperienceDetail />} />
          <Route path="experiences/:id/edit" element={<ExperienceEdit />} />
          
          <Route path="collections" element={<CollectionsGrid />} />
          <Route path="collections/new" element={<CollectionEdit />} />
          <Route path="collections/:id" element={<CollectionDetail />} />
          <Route path="collections/record/:recordId" element={<CollectionEdit />} />
          <Route path="collections/experience/:experienceId" element={<CollectionEdit />} />
          
          <Route path="search" element={<Search />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
