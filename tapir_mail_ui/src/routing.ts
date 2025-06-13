import { lazy } from "react";
import DummyTapirUserEdit from "./pages/dummy_accounts/DummyTapirUserEdit";
import DummyPickupLocationEdit from "./pages/dummy_accounts/DummyPickupLocationEdit";

const Dashboard = lazy(() => import("./pages/dashboard"));
const EmailConfigurationEditor = lazy(
  () => import("./pages/email-configuration/editor"),
);
const MediaLibrary = lazy(() => import("./pages/media_library"));
const TemplateEditor = lazy(() => import("./pages/template-editor"));
const DummyAccountsOverview = lazy(
  () => import("./pages/dummy_accounts/DummyAccountsOverview"),
);

const Paths = {
  dashboard: "/tapirmail/",
  emailConfigurationCreate: "/tapirmail/emailconfiguration/new",
  emailConfigurationEdit: "/tapirmail/emailconfiguration/edit/:id",
  templateEditorCreate: "/tapirmail/editor",
  templateEditorEdit: "/tapirmail/editor/:templateId",
  mediaLibrary: "/tapirmail/media_library",
  dummyAccounts: "/tapirmail/dummy_accounts",
  dummyTapirUserCreate: "/tapirmail/dummy_accounts/dummy_tapir_user/new",
  dummyTapirUserEdit: "/tapirmail/dummy_accounts/dummy_tapir_user/edit/:id",
  dummyPickupLocationCreate: "/tapirmail/dummy_accounts/dummy_pickup_location/new",
  dummyPickupLocationEdit: "/tapirmail/dummy_accounts/dummy_pickup_location/edit/:id",
};


const routes = [
  {
    path: Paths.dashboard,
    element: Dashboard,
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
    path: Paths.dummyTapirUserCreate,
    element: DummyTapirUserEdit,
  },
  {
    path: Paths.dummyTapirUserEdit,
    element: DummyTapirUserEdit,
  },
  {
    path: Paths.dummyPickupLocationCreate,
    element: DummyPickupLocationEdit,
  },
  {
    path: Paths.dummyPickupLocationEdit,
    element: DummyPickupLocationEdit,
  },
];

export default Paths;
export { routes };
