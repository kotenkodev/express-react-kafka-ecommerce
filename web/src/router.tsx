import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ShopPage from "./pages/ShopPage";
import OrdersPage from "./pages/OrdersPage";
import RoleRoute from "./components/guards/RoleRoute";
import SearchPage from "./pages/SearchPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProductSearchPage from "./pages/ProductSearchPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <ShopPage />,
      },
      {
        path: "/orders",
        element: <OrdersPage />,
      },
      {
        element: <RoleRoute roles={["user"]} />,
        children: [
          {
            path: "/product-search",
            element: <ProductSearchPage />,
          },
        ],
      },
      {
        element: <RoleRoute roles={["admin"]} />,
        children: [
          {
            path: "/analytics",
            element: <AnalyticsPage />,
          },
          {
            path: "/search",
            element: <SearchPage />,
          },
          {
            path: "/products",
            element: <AdminProductsPage />,
          },
        ],
      },
    ],
  },
]);
