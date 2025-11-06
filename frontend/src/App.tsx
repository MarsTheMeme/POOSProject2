import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CalendarPage from "./pages/CalendarPage";
import VerifyEmailPage from './pages/VerifyEmailPage';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
    </Routes>
    </BrowserRouter>
  );
}
export default App;
