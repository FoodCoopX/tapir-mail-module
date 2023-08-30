import { lazy } from "react";
const Dashboard = lazy(() => import("./pages/dashboard"));
const EmailConfigurationEditor = lazy(
  () => import("./pages/email-configuration/editor"),
);
const MailPlanningOverview = lazy(
  () => import("./pages/email-configuration/overview"),
);
const MediaLibrary = lazy(() => import("./pages/media_library"));
const TemplateEditor = lazy(() => import("./pages/template-editor"));

const Paths = {
  dashboard: "/",
  emailConfiguration: "/emailconfiguration",
  emailConfigurationCreate: "/emailconfiguration/new",
  emailConfigurationEdit: "/emailconfiguration/edit/:id",
  templateEditorCreate: "/editor",
  templateEditorEdit: "/editor/:templateId",
  mediaLibrary: "/media_library",
  // add new paths here
};

const routes = [
  {
    path: Paths.dashboard,
    element: Dashboard,
  },
  {
    path: Paths.emailConfiguration,
    element: MailPlanningOverview,
  },
  {
    path: Paths.emailConfigurationCreate,
    element: EmailConfigurationEditor,
  },
  {
    path: Paths.emailConfigurationEdit,
    element: EmailConfigurationEditor,
  },
  {
    path: Paths.templateEditorCreate,
    element: TemplateEditor,
  },
  {
    path: Paths.templateEditorEdit,
    element: TemplateEditor,
  },
  {
    path: Paths.mediaLibrary,
    element: MediaLibrary,
  },
  // add new routes here
];

export default Paths;
export { routes };
