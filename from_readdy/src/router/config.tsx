import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import PrivacyPolicy from "../pages/privacy-policy/page";
import TermsOfService from "../pages/terms-of-service/page";
import AssistantGuidelines from "../pages/assistant-guidelines/page";
import Success from "../pages/success/page";
import Schedule from "../pages/schedule/page";
import AssistantDashboard from "../pages/assistant-dashboard/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/success",
    element: <Success />,
  },
  {
    path: "/schedule",
    element: <Schedule />,
  },
  {
    path: "/assistant",
    element: <AssistantDashboard />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfService />,
  },
  {
    path: "/assistant-guidelines",
    element: <AssistantGuidelines />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
