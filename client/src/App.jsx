import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Home from "./pages/Home.jsx";
import ListingForm from "./pages/ListingForm.jsx";
import MyListings from "./pages/MyListings.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Enquiries from "./pages/Enquiries.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user } = useAuth();
  return <><Navbar /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/products/:id" element={<ProductDetails />} />
    <Route path="/sell" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
    <Route path="/products/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
    <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
    <Route path="/enquiries" element={<ProtectedRoute><Enquiries /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute>{user?.role === "admin" ? <AdminDashboard /> : <NotFound />}</ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes></>;
}
