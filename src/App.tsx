import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Intelligence } from './pages/Intelligence';
import { Interceptions } from './pages/Interceptions';
import { Cases } from './pages/Cases';
import { Ledger } from './pages/Ledger';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotFoundState } from './components/ui/StateContainers';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="intelligence" element={<Intelligence />} />
            <Route path="interceptions" element={<Interceptions />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:caseId" element={<Cases />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="*" element={<NotFoundState />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
