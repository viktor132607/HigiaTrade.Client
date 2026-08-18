import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Profile from '../pages/Profile';
import AdminPanel from '../pages/admin/AdminPanel';
import AdminProducts from '../pages/admin/Products';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminUsers from '../pages/admin/Users';
import Layout from '../components/layout/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'products/:id',
        element: <ProductDetails />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'admin',
        element: <AdminPanel />,
        children: [
          {
            path: 'products',
            element: <AdminProducts />,
          },
          {
            path: 'categories',
            element: <AdminCategories />,
          },
          {
            path: 'orders',
            element: <AdminOrders />,
          },
          {
            path: 'users',
            element: <AdminUsers />,
          },
        ],
      },
    ],
  },
]); 
