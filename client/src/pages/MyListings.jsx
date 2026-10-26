import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function MyListings() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/products/mine?limit=40");
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setStatus(product, status) {
    setBusyId(product._id);
    try {
      const updated = await api.patch(`/products/${product._id}/status`, { status });
      setProducts((items) => items.map((item) => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function remove(product) {
    if (!window.confirm(`Remove "${product.title}" from the marketplace?`)) return;
    setBusyId(product._id);
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((items) => items.filter((item) => item._id !== product._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  return <main className="section-shell listings-page">
    <div className="listings-heading"><div><span className="eyebrow">YOUR LITTLE CORNER OF THE MARKETPLACE</span><h1>My listings</h1><p>Keep your listings up to date, and pass things along.</p></div><Link className="button" to="/sell">＋ Sell an item</Link></div>
    {error && <div className="form-error page-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
    {loading ? <div className="product-grid">{[1, 2, 3].map((n) => <div className="product-skeleton" key={n} />)}</div> :
      products.length ? <div className="my-product-grid">{products.map((product) => <div className="my-product" key={product._id}>
        <ProductCard product={product} />
        <div className="my-product-actions"><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span>
          <div><Link className="button-link" to={`/products/${product._id}/edit`}>Edit</Link>
            {product.status !== "Sold" && product.status !== "Removed" && <button className="button-link" disabled={busyId === product._id} onClick={() => setStatus(product, "Sold")}>Mark sold</button>}
            {product.status === "Sold" && <button className="button-link" disabled={busyId === product._id} onClick={() => setStatus(product, "Available")}>Relist</button>}
            <button className="button-link danger-link" disabled={busyId === product._id} onClick={() => remove(product)}>Remove</button></div>
        </div>
      </div>)}</div> :
        <div className="state-box"><span className="empty-mark">↗</span><h2>Your first listing starts here.</h2><p>Find a new home for something you no longer need.</p><Link className="button button-small" to="/sell">Create a listing</Link></div>}
  </main>;
}
