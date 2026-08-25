"use client";

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./responsive-audit.css";
import { store } from "./store";
import { LanguageThemeProvider } from "./i18n/LanguageThemeContext";
import GlobalUiEnhancer from "./i18n/GlobalUiEnhancer";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./routes/PrivateRoute";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Brands from "./pages/Brands";
import SanoDistributor from "./pages/SanoDistributor";
import NewProducts from "./pages/NewProducts";
import Compare from "./pages/Compare";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import InfoPage from "./pages/InfoPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CheckoutConfirmation from "./pages/CheckoutConfirmation";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminBrands from "./pages/admin/Brands";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReports from "./pages/admin/Reports";
import InvoiceImport from "./pages/admin/InvoiceImport";

function App() {
  return (
    <Provider store={store}>
      <LanguageThemeProvider>
        <GlobalUiEnhancer />
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/store" element={<Products />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories/:categoryId" element={<Products />} />
              <Route path="/category/:categoryId" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/sano" element={<SanoDistributor />} />
              <Route path="/sano/:region" element={<SanoDistributor />} />
              <Route path="/sano-distributor" element={<Navigate to="/sano" replace />} />

              <Route
                path="/promotions"
                element={
                  <InfoPage
                    titleBg="Промоции"
                    titleEn="Promotions"
                    descriptionBg="Тук ще се показват активните промоции и намаления."
                    descriptionEn="Active promotions and discounts will be shown here."
                  />
                }
              />

              <Route path="/new-products" element={<NewProducts />} />

              <Route
                path="/best-sellers"
                element={
                  <InfoPage
                    titleBg="Най-продавани"
                    titleEn="Best sellers"
                    descriptionBg="Тук ще се показват най-продаваните продукти."
                    descriptionEn="The best-selling products will be shown here."
                  />
                }
              />

              <Route path="/brands" element={<Brands />} />
              <Route path="/brands/:brandSlug" element={<Brands />} />
              <Route path="/compare" element={<Compare />} />

              <Route
                path="/cart"
                element={
                  <PrivateRoute>
                    <Cart />
                  </PrivateRoute>
                }
              />

              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />

              <Route
                path="/checkout/confirmation"
                element={
                  <PrivateRoute>
                    <CheckoutConfirmation />
                  </PrivateRoute>
                }
              />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                path="/wishlist"
                element={
                  <PrivateRoute>
                    <Wishlist />
                  </PrivateRoute>
                }
              />

              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminPanel />
                  </PrivateRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="invoice-import" element={<InvoiceImport />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>

          <ToastContainer position="bottom-right" newestOnTop />
        </Router>
      </LanguageThemeProvider>
    </Provider>
  );
}

export default App;
