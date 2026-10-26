import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { api } from "../services/api.js";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setProducts(await api.get("/wishlist"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(productId) {
    try {
      await api.delete(`/wishlist/${productId}`);
      setProducts((saved) => saved.filter((product) => product._id !== productId));
    } catch (err) {
      setError(err.message);
    }
  }

  return <main className="section-shell listings-page">
    <div className="listings-heading"><div><span className="eyebrow">THE ONES YOU’RE THINKING ABOUT</span><h1>Saved finds</h1><p>Keep good campus finds close by.</p></div></div>
    {error && <div className="form-error page-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
    {loading ? <div className="product-grid">{[1, 2, 3].map((n) => <div className="product-skeleton" key={n} />)}</div> :
      products.length ? <div className="my-product-grid">{products.map((product) => <div key={product._id} className="my-product">
        <ProductCard product={product} />
        <div className="my-product-actions"><span className="status-pill status-available">Available</span><button className="button-link danger-link" onClick={() => remove(product._id)}>Remove saved find</button></div>
      </div>)}</div> :
        <div className="state-box"><span className="empty-mark">♡</span><h2>Nothing saved just yet.</h2><p>When a listing catches your eye, save it here for later.</p><Link className="button button-small" to="/">Explore finds</Link></div>}
  </main>;
}
