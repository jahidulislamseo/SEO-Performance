import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import EmployeePortal from './pages/EmployeePortal';
import DeliveryTracker from './pages/DeliveryTracker';
import QueryTracker from './pages/QueryTracker';

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
      </Routes>
    </Router>
  );
}

export default App;
