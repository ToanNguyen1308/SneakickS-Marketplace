import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyBids from "./pages/MyBids.jsx";
import MyAsks from "./pages/MyAsks.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import AdminVerifications from "./pages/AdminVerifications.jsx";

const App = () => (
  <div className="min-h-screen bg-slate-50">
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 py-6">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/me/bids"
          element={
            <ProtectedRoute>
              <MyBids />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/asks"
          element={
            <ProtectedRoute>
              <MyAsks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <ProtectedRoute adminOnly>
              <AdminVerifications />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </div>
);

export default App;
