import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import PrivacyPolicy from "../pages/privacy-policy/page";
import TermsOfService from "../pages/terms-of-service/page";
import AssistantGuidelines from "../pages/assistant-guidelines/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
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
