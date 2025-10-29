import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CardPage from './pages/CardPage';
import CalendarPage from "./pages/CalendarPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/cards",
    element: <CardPage />,
  },
  {
    path: "/calendar",
    element: <CalendarPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;