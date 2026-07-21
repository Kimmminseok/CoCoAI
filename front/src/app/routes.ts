import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import FindId from "./pages/FindId";
import FindPassword from "./pages/FindPassword";
import Dashboard from "./pages/Dashboard";
import TheoryStudy from "./pages/TheoryStudy";
import ProblemSolving from "./pages/ProblemSolving";
import Profile from "./pages/Profile";
import LearningSettings from "./pages/LearningSettings";
import AccountSettings from "./pages/AccountSettings";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import SocialLoginSuccess from "./pages/SocialLoginSuccess";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/social-login-success",
    Component: SocialLoginSuccess,
  },
  {
    path: "/find-id",
    Component: FindId,
  },
  {
    path: "/find-password",
    Component: FindPassword,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/dashboard",
        Component: MainLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "theory", Component: TheoryStudy },
          { path: "problems", Component: ProblemSolving },
          { path: "profile", Component: Profile },
          { path: "learning-settings", Component: LearningSettings },
          { path: "account", Component: AccountSettings },
        ],
      },
    ],
  },
]);