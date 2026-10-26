import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Heart, MapPin, Pencil, ShieldCheck, Tag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { findDemoProduct } from "../data/demoProducts.js";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("Suspicious listing");
  const [reportDescription, setReportDescription] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get(`/products/${id}`).then((item) => { if (active) { setProduct(item); setIsDemo(false); } })
      .catch((err) => {
        if (!active) return;
        const sample = findDemoProduct(id);
        if ((!err.status || err.status === 503) && sample) {
          setProduct(sample);
          setIsDemo(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (isDemo || !user || !product || user._id === product.seller._id) {
      setSaved(false);
      return;
    }
    api.get("/wishlist")
      .then((items) => setSaved(items.some((item) => item._id === product._id)))
      .catch((err) => setActionError(err.message));
  }, [user, product, isDemo]);

  async function toggleSaved() {
    if (!user) return navigate("/login", { state: { from: { pathname: `/products/${product._id}` } } });
    setBusy(true);
    setActionMessage("");
    setActionError("");
    try {
      if (saved) await api.delete(`/wishlist/${product._id}`);
      else await api.post(`/wishlist/${product._id}`, {});
      setSaved(!saved);
      setActionMessage(saved ? "Removed from your saved finds." : "Saved to your wishlist.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendEnquiry(event) {
    event.preventDefault();
    setBusy(true);
    setActionMessage("");
    setActionError("");
    try {
      await api.post("/enquiries", { productId: product._id, message });
      setMessage("");
      setActionMessage("Your enquiry was sent privately to the seller. You can follow up from Enquiries.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      await api.post("/reports", { productId: product._id, reason, description: reportDescription });
      setActionMessage("Thanks. Your report was sent to the CampusCart moderation team.");
      setReportOpen(false);
      setReportDescription("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page-status">Opening this find…</div>;
  if (error) return <main className="section-shell"><div className="state-box"><h2>We can’t find that listing.</h2><p>{error}</p><Link className="button button-small" to="/">Back to the marketplace</Link></div></main>;
  const isOwner = user?._id === product.seller._id;
  return <main className="section-shell details-page">
    <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to finds</Link>
    <div className="details-layout">
      <div className={`details-image ${product.images?.[0] ? "" : "image-placeholder"}`}>
        {product.images?.[0] ? <img src={product.images[0]} alt={product.title} /> : <span>Ready for a new chapter</span>}
      </div>
      <section className="details-copy">
        {isDemo && <p className="demo-notice" role="status">Demo listing — this example is local only and is not saved in MongoDB.</p>}
        <span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span>
        <p className="product-category"><Tag size={14} /> {product.category} <span>·</span> {product.condition}</p>
        <h1>{product.title}</h1>
        <strong className="details-price">{money.format(product.price)}</strong>
        <p className="details-description">{product.description}</p>
        <div className="seller-card"><span className="seller-avatar">{product.seller.name.slice(0, 1).toUpperCase()}</span><div><strong>{product.seller.name}</strong><span><MapPin size={13} /> {product.collegeName}</span></div><ShieldCheck className="seller-shield" size={19} /></div>
        {isOwner ? <Link className="button details-action" to={`/products/${product._id}/edit`}><Pencil size={16} /> Edit your listing</Link> :
          product.status !== "Available" ? <button className="button details-action" disabled>This item is not available</button> :
            user ? <form className="details-enquiry" onSubmit={sendEnquiry}><label htmlFor="enquiry-message">Ask the seller a question</label><textarea id="enquiry-message" minLength="10" maxLength="1000" required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Hi! Is this still available? I’d like to know…" /><button className="button details-action" disabled={busy}>Send private enquiry</button></form> :
              <button className="button details-action" onClick={() => navigate("/login", { state: { from: { pathname: `/products/${product._id}` } } })}>Log in to contact seller</button>}
        {!isOwner && <>
          {isDemo ? <p className="safety-note">Saving, enquiries, and reporting require a connected MongoDB database.</p> : <>
            <button className="button button-outline details-action secondary-action" disabled={busy} onClick={toggleSaved}><Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved to wishlist" : "Save this find"}</button>
            {user && product.status !== "Removed" && <button className="report-trigger" onClick={() => setReportOpen(!reportOpen)}><Flag size={14} /> Report this listing</button>}
          </>}
        </>}
        {actionMessage && <p className="action-feedback" role="status">{actionMessage}</p>}
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
        {reportOpen && <form className="report-form" onSubmit={submitReport}>
          <label>What’s the concern?<select value={reason} onChange={(event) => setReason(event.target.value)}>{["Suspicious listing", "Prohibited item", "Misleading information", "Inappropriate content", "Other"].map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>More detail (optional)<textarea maxLength="1000" rows="3" value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="Help our moderators understand what happened." /></label>
          <div className="editor-actions"><button className="button-link" type="button" onClick={() => setReportOpen(false)}>Cancel</button><button className="button button-small" disabled={busy}>Send report</button></div>
        </form>}
        <p className="safety-note">Keep conversations and exchanges safe. Meet in a public campus space.</p>
      </section>
    </div>
  </main>;
}
