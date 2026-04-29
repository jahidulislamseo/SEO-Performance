import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import EmployeePortal from './pages/EmployeePortal';
import DeliveryTracker from './pages/DeliveryTracker';
import FinanceHub from './pages/FinanceHub';
import QueryTracker from './pages/QueryTracker';
import WorkExamples from './pages/WorkExamples';
import WorkExamplesAdmin from './pages/WorkExamplesAdmin';

// Import Global Styles
import './assets/css/colors_and_type.css';
import './assets/css/base.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/employee" element={<EmployeePortal />} />
        <Route path="/delivery-tracker" element={<DeliveryTracker />} />
        <Route path="/query-tracker" element={<QueryTracker />} />
        <Route path="/finance" element={<FinanceHub />} />
        <Route path="/work-examples" element={<WorkExamples />} />
        <Route path="/admin/work-examples" element={<WorkExamplesAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;
