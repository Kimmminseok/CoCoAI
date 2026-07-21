import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TheoryStudy from "./pages/TheoryStudy";
import ProblemSolving from "./pages/ProblemSolving";
import Profile from "./pages/Profile";
import LearningSettings from "./pages/LearningSettings";
import AccountSettings from "./pages/AccountSettings";
import MainLayout from "./components/MainLayout";

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
]);