import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Heart, MapPin, MessageSquare, Pencil, ShieldCheck, Tag, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { findDemoProduct } from "../data/demoProducts.js";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  // Interaction states
  const [saved, setSaved] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Suspicious listing");
  const [reportDescription, setReportDescription] = useState("");

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch product data
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api.get(`/products/${id}`)
      .then((item) => {
        if (active) {
          setProduct(item);
          setIsDemo(false);
        }
      })
      .catch((err) => {
        if (!active) return;

        // Fallback to local mock data if offline or 503
        const sample = findDemoProduct(id);
        if ((!err.status || err.status === 503) && sample) {
          setProduct(sample);
          setIsDemo(true);
        } else {
          setError(err.message || "Failed to load product details.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Check if item is saved in user's wishlist
  useEffect(() => {
    if (isDemo || !user || !product || user._id === product.seller?._id) {
      setSaved(false);
      return;
    }

    api.get("/wishlist")
      .then((items) => {
        if (Array.isArray(items)) {
          setSaved(items.some((item) => item._id === product._id));
        }
      })
      .catch(() => {});
  }, [user, product, isDemo]);

  async function handleToggleWishlist() {
    if (!user) {
      return navigate("/login", { state: { from: { pathname: `/products/${product._id}` } } });
    }
    setSubmitting(true);
    setActionMessage("");
    setActionError("");

    try {
      if (saved) {
        await api.delete(`/wishlist/${product._id}`);
        setSaved(false);
        setActionMessage("Removed from your saved items.");
      } else {
        await api.post(`/wishlist/${product._id}`, {});
        setSaved(true);
        setActionMessage("Saved to your wishlist!");
      }
    } catch (err) {
      setActionError(err.message || "Could not update wishlist.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendEnquiry(e) {
    e.preventDefault();
    if (!user) {
      return navigate("/login", { state: { from: { pathname: `/products/${product._id}` } } });
    }

    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      await api.post("/enquiries", {
        productId: product._id,
        message: enquiryMessage
      });
      setEnquiryMessage("");
      setEnquiryModalOpen(false);
      setActionMessage("Enquiry sent privately to the seller! View replies under Enquiries.");
    } catch (err) {
      setActionError(err.message || "Failed to deliver enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReport(e) {
    e.preventDefault();
    if (!user) {
      return navigate("/login", { state: { from: { pathname: `/products/${product._id}` } } });
    }

    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      await api.post("/reports", {
        productId: product._id,
        reason: reportReason,
        description: reportDescription
      });
      setReportModalOpen(false);
      setReportDescription("");
      setActionMessage("Listing reported. CampusCart moderators will review this item.");
    } catch (err) {
      setActionError(err.message || "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. LOADING STATE
  if (loading) {
    return (
      <main className="section-shell" style={{ padding: "60px 0" }}>
        <div className="state-box" aria-busy="true">
          <h3>Loading listing details...</h3>
          <p>Connecting to campus inventory...</p>
        </div>
      </main>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <main className="section-shell" style={{ padding: "60px 0" }}>
        <div className="state-box state-error" role="alert">
          <h2>Listing Unavailable</h2>
          <p>{error}</p>
          <Link className="button button-small" to="/">
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  // 3. EMPTY STATE
  if (!product) {
    return (
      <main className="section-shell" style={{ padding: "60px 0" }}>
        <div className="state-box">
          <h2>Product Not Found</h2>
          <p>This item may have been sold or removed by the seller.</p>
          <Link className="button button-small" to="/">
            Explore Other Items
          </Link>
        </div>
      </main>
    );
  }

  // 4. SUCCESS STATE
  const isOwner = user?._id === product.seller?._id;
  const isAvailable = product.status === "Available";

  return (
    <main className="section-shell details-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Back to all listings
      </Link>

      <div className="details-layout">
        {/* Left Column: Image */}
        <div className={`details-image ${product.images?.[0] ? "" : "image-placeholder"}`}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} />
          ) : (
            <span>Ready for a new campus chapter</span>
          )}
        </div>

        {/* Right Column: Info & Actions */}
        <section className="details-copy">
          {isDemo && (
            <div className="demo-notice" role="status" style={{ marginBottom: "16px" }}>
              <strong>Demo Catalogue:</strong> This sample item is stored locally for preview.
              Interactive messaging and wishlists require live database connectivity.
            </div>
          )}

          <span className={`status-pill status-${product.status?.toLowerCase()}`}>
            {product.status}
          </span>

          <p className="product-category">
            <Tag size={14} /> {product.category} <span>·</span> Condition: {product.condition}
          </p>

          <h1>{product.title}</h1>
          <strong className="details-price">{money.format(product.price)}</strong>

          <p className="details-description">{product.description}</p>

          {/* Seller Profile Card */}
          <div className="seller-card">
            <span className="seller-avatar">
              {(product.seller?.name || "S").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{product.seller?.name || "Student Seller"}</strong>
              <span>
                <MapPin size={13} /> {product.collegeName}
              </span>
            </div>
            <ShieldCheck className="seller-shield" size={20} title="Campus Student Listing" />
          </div>

          {/* Action Feedback Alerts */}
          {actionMessage && <p className="action-feedback" role="status">{actionMessage}</p>}
          {actionError && <p className="form-error" role="alert">{actionError}</p>}

          {/* Action Buttons based on User Context */}
          {isOwner ? (
            <Link className="button details-action" to={`/products/${product._id}/edit`}>
              <Pencil size={16} /> Edit your listing
            </Link>
          ) : !isAvailable ? (
            <button className="button details-action" disabled>
              Item {product.status}
            </button>
          ) : user ? (
            <div style={{ display: "grid", gap: "10px" }}>
              <button
                className="button details-action"
                disabled={submitting}
                onClick={() => setEnquiryModalOpen(true)}
              >
                <MessageSquare size={16} /> Contact Seller Privately
              </button>

              {!isDemo && (
                <button
                  type="button"
                  className="button button-outline details-action"
                  disabled={submitting}
                  onClick={handleToggleWishlist}
                >
                  <Heart size={16} fill={saved ? "currentColor" : "none"} />
                  {saved ? "Saved in Wishlist" : "Save to Wishlist"}
                </button>
              )}
            </div>
          ) : (
            <button
              className="button details-action"
              onClick={() =>
                navigate("/login", {
                  state: { from: { pathname: `/products/${product._id}` } }
                })
              }
            >
              Log in to Contact Seller
            </button>
          )}

          {/* Report Listing link for non-owners */}
          {!isOwner && user && !isDemo && (
            <button
              type="button"
              className="report-trigger"
              onClick={() => setReportModalOpen(true)}
            >
              <Flag size={14} /> Report listing concerns
            </button>
          )}

          <p className="safety-note" style={{ marginTop: "20px" }}>
            Safety First: Arrange exchanges in public, well-lit campus areas (library, cafeteria, student center).
          </p>
        </section>
      </div>

      {/* MODAL: Send Enquiry */}
      {enquiryModalOpen && (
        <div className="modal-backdrop" style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "grid", placeItems: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", padding: "24px", borderRadius: "10px",
            maxWidth: "480px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Message {product.seller?.name || "Seller"}</h3>
              <button style={{ border: 0, background: "none", cursor: "pointer" }} onClick={() => setEnquiryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#666", margin: "8px 0 16px" }}>
              Ask questions regarding availability, condition, or pick-up location.
            </p>
            <form onSubmit={handleSendEnquiry}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>
                Your Message
              </label>
              <textarea
                rows="4"
                required
                minLength="10"
                maxLength="1000"
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                placeholder="Hi, is this item still available? Can we meet at the campus library?"
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button type="button" className="clear-button" onClick={() => setEnquiryModalOpen(false)}>
                  Cancel
                </button>
                <button className="button button-small" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Listing */}
      {reportModalOpen && (
        <div className="modal-backdrop" style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "grid", placeItems: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", padding: "24px", borderRadius: "10px",
            maxWidth: "480px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Report Listing</h3>
              <button style={{ border: 0, background: "none", cursor: "pointer" }} onClick={() => setReportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendReport} style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>
                Reason for report
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="Suspicious listing">Suspicious listing</option>
                  <option value="Prohibited item">Prohibited item</option>
                  <option value="Misleading information">Misleading information</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label style={{ fontSize: "12px", fontWeight: "bold" }}>
                Additional Details (Optional)
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Explain why this listing violates campus standards..."
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" className="clear-button" onClick={() => setReportModalOpen(false)}>
                  Cancel
                </button>
                <button className="button button-small" disabled={submitting}>
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
