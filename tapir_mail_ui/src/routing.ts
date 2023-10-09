import { lazy } from "react";
import DummyTapirUserEdit from "./pages/dummy_accounts/DummyTapirUserEdit";
import DummyTapirUserCreate from "./pages/dummy_accounts/DummyTapirUserCreate";

const Dashboard = lazy(() => import("./pages/dashboard"));
const EmailConfigurationEditor = lazy(
  () => import("./pages/email-configuration/editor"),
);
const MailPlanningOverview = lazy(
  () => import("./pages/email-configuration/overview"),
);
const MediaLibrary = lazy(() => import("./pages/media_library"));
const TemplateEditor = lazy(() => import("./pages/template-editor"));
const DummyAccountsOverview = lazy(
  () => import("./pages/dummy_accounts/dummy_accounts_overview"),
);

const Paths = {
  dashboard: "/",
  emailConfiguration: "/emailconfiguration",
  emailConfigurationCreate: "/emailconfiguration/new",
  emailConfigurationEdit: "/emailconfiguration/edit/:id",
  templateEditorCreate: "/editor",
  templateEditorEdit: "/editor/:templateId",
  mediaLibrary: "/media_library",
  dummyAccounts: "/dummy_accounts",
  dummyTapirUserEdit: "/dummy_accounts/dummy_tapir_user/edit/:id",
  dummyTapirUserCreate: "/dummy_accounts/dummy_tapir_user/create",
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
  {
    path: Paths.dummyAccounts,
    element: DummyAccountsOverview,
  },
  {
    path: Paths.dummyTapirUserEdit,
    element: DummyTapirUserEdit,
  },
  {
    path: Paths.dummyTapirUserCreate,
    element: DummyTapirUserCreate,
  },
  // add new routes here
];

export default Paths;
export { routes };
