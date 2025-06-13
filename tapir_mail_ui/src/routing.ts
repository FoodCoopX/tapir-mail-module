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
  dashboard: "/",
  emailConfigurationCreate: "/emailconfiguration/new",
  emailConfigurationEdit: "/emailconfiguration/edit/:id",
  templateEditorCreate: "/editor",
  templateEditorEdit: "/editor/:templateId",
  mediaLibrary: "/media_library",
  dummyAccounts: "/dummy_accounts",
  dummyTapirUserCreate: "/dummy_accounts/dummy_tapir_user/new",
  dummyTapirUserEdit: "/dummy_accounts/dummy_tapir_user/edit/:id",
  dummyPickupLocationCreate: "/dummy_accounts/dummy_pickup_location/new",
  dummyPickupLocationEdit: "/dummy_accounts/dummy_pickup_location/edit/:id",
};

console.log("THEO TEST ROUTES")
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
