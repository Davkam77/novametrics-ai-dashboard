import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AIUsage from "./pages/AIUsage/AIUsage";
import Automations from "./pages/Automations/Automations";
import APIAnalytics from "./pages/APIAnalytics/APIAnalytics";
import Users from "./pages/Users/Users";
import Settings from "./pages/Settings/Settings";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ai-usage" element={<AIUsage />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/api-analytics" element={<APIAnalytics />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/error-404" element={<NotFound />} />
        </Route>

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
