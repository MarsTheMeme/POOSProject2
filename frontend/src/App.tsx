import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CardPage from './pages/CardPage';
import CalendarPage from "./pages/CalendarPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/cards" element={<CardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;