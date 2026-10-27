import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle, Clock, Heart, Inbox, List, MessageSquare, Pencil, PlusCircle, RefreshCw, Trash2, User } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function DashboardPage() {
  const { user, setUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeTab = params.get("tab") || "listings";

  // Data states
  const [listings, setListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [sentEnquiries, setSentEnquiries] = useState([]);
  const [receivedEnquiries, setReceivedEnquiries] = useState([]);

  // Profile edit states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    collegeName: user?.collegeName || ""
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Status & UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  function setTab(tabName) {
    setParams({ tab: tabName });
    setError("");
  }

  // Load dashboard data based on active tab
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    async function loadData() {
      try {
        if (activeTab === "listings") {
          const res = await api.get("/products/mine?limit=40");
          if (active) setListings(res.products || []);
        } else if (activeTab === "wishlist") {
          const res = await api.get("/wishlist");
          if (active) setWishlist(res || []);
        } else if (activeTab === "enquiries") {
          const [sent, received] = await Promise.all([
            api.get("/enquiries/sent"),
            api.get("/enquiries/received")
          ]);
          if (active) {
            setSentEnquiries(sent || []);
            setReceivedEnquiries(received || []);
          }
        } else if (activeTab === "profile") {
          if (active && user) {
            setProfileForm({ name: user.name, collegeName: user.collegeName });
          }
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load dashboard section.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [activeTab, refreshKey, user]);

  // Listing status change handler
  async function handleUpdateListingStatus(product, status) {
    setBusyId(product._id);
    try {
      const updated = await api.patch(`/products/${product._id}/status`, { status });
      setListings((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      setError(err.message || "Failed to update listing status.");
    } finally {
      setBusyId("");
    }
  }

  // Listing soft delete handler
  async function handleDeleteListing(product) {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"?`)) return;
    setBusyId(product._id);
    try {
      await api.delete(`/products/${product._id}`);
      setListings((prev) => prev.filter((item) => item._id !== product._id));
    } catch (err) {
      setError(err.message || "Could not delete listing.");
    } finally {
      setBusyId("");
    }
  }

  // Remove from Wishlist handler
  async function handleRemoveWishlist(productId) {
    setBusyId(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      setError(err.message || "Could not remove item from saved list.");
    } finally {
      setBusyId("");
    }
  }

  // Enquiry status update by seller
  async function handleEnquiryStatus(enquiryId, status) {
    setBusyId(enquiryId);
    try {
      const updated = await api.patch(`/enquiries/${enquiryId}/status`, { status });
      setReceivedEnquiries((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (err) {
      setError(err.message || "Could not update enquiry status.");
    } finally {
      setBusyId("");
    }
  }

  // Profile update submit
  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaved(false);
    setError("");
    setBusyId("profile");
    try {
      const updated = await api.patch("/auth/me", profileForm);
      setUser(updated);
      setProfileSaved(true);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="section-shell listings-page">
      <div className="listings-heading">
        <div>
          <span className="eyebrow">STUDENT CONTROL CENTER</span>
          <h1>My Campus Dashboard</h1>
          <p>Manage your active listings, saved books, inquiries, and student profile.</p>
        </div>
        <Link className="button" to="/sell">
          <PlusCircle size={16} /> Post New Item
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="tab-switch" role="tablist">
        <button
          className={activeTab === "listings" ? "tab-active" : ""}
          onClick={() => setTab("listings")}
        >
          <List size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          My Listings ({listings.length})
        </button>
        <button
          className={activeTab === "wishlist" ? "tab-active" : ""}
          onClick={() => setTab("wishlist")}
        >
          <Heart size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Saved Items
        </button>
        <button
          className={activeTab === "enquiries" ? "tab-active" : ""}
          onClick={() => setTab("enquiries")}
        >
          <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Enquiries ({receivedEnquiries.length + sentEnquiries.length})
        </button>
        <button
          className={activeTab === "profile" ? "tab-active" : ""}
          onClick={() => setTab("profile")}
        >
          <User size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Profile Settings
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="form-error page-error" role="alert">
          {error}
          <button onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* TAB 1: MY LISTINGS */}
      {activeTab === "listings" && (
        <>
          {/* 1. LOADING */}
          {loading && (
            <div className="product-grid" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <div className="product-skeleton" key={n} />
              ))}
            </div>
          )}

          {/* 2. ERROR */}
          {!loading && error && (
            <div className="state-box state-error">
              <p>Unable to load your listings: {error}</p>
            </div>
          )}

          {/* 3. EMPTY */}
          {!loading && !error && listings.length === 0 && (
            <div className="state-box">
              <span className="empty-mark">📦</span>
              <h2>No items listed yet</h2>
              <p>Have old textbooks, drafters, or hostel appliances? Start listing them today.</p>
              <Link className="button button-small" to="/sell">
                Sell an item
              </Link>
            </div>
          )}

          {/* 4. SUCCESS */}
          {!loading && !error && listings.length > 0 && (
            <div className="my-product-grid">
              {listings.map((product) => (
                <div className="my-product" key={product._id}>
                  <ProductCard product={product} />
                  <div className="my-product-actions">
                    <span className={`status-pill status-${product.status?.toLowerCase()}`}>
                      {product.status}
                    </span>
                    <div>
                      <Link className="button-link" to={`/products/${product._id}/edit`}>
                        <Pencil size={12} /> Edit
                      </Link>

                      {product.status !== "Sold" && (
                        <button
                          className="button-link"
                          disabled={busyId === product._id}
                          onClick={() => handleUpdateListingStatus(product, "Sold")}
                        >
                          Mark Sold
                        </button>
                      )}

                      {product.status === "Sold" && (
                        <button
                          className="button-link"
                          disabled={busyId === product._id}
                          onClick={() => handleUpdateListingStatus(product, "Available")}
                        >
                          Relist
                        </button>
                      )}

                      <button
                        className="button-link danger-link"
                        disabled={busyId === product._id}
                        onClick={() => handleDeleteListing(product)}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: WISHLIST / SAVED FINDS */}
      {activeTab === "wishlist" && (
        <>
          {loading && (
            <div className="product-grid" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <div className="product-skeleton" key={n} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="state-box state-error">
              <p>Failed to retrieve saved items: {error}</p>
            </div>
          )}

          {!loading && !error && wishlist.length === 0 && (
            <div className="state-box">
              <span className="empty-mark">♡</span>
              <h2>Your wishlist is empty</h2>
              <p>Found something interesting while browsing? Click the heart icon to save it here.</p>
              <Link className="button button-small" to="/">
                Browse Marketplace
              </Link>
            </div>
          )}

          {!loading && !error && wishlist.length > 0 && (
            <div className="product-grid">
              {wishlist.map((item) => (
                <div key={item._id} style={{ display: "grid", gap: "8px" }}>
                  <ProductCard product={item} />
                  <button
                    className="button-link danger-link"
                    style={{ justifySelf: "center", fontSize: "11px" }}
                    disabled={busyId === item._id}
                    onClick={() => handleRemoveWishlist(item._id)}
                  >
                    Remove from saved
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 3: ENQUIRIES */}
      {activeTab === "enquiries" && (
        <div style={{ display: "grid", gap: "30px" }}>
          {loading && (
            <div className="state-box" aria-busy="true">
              <p>Loading your enquiries and conversations...</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Received Enquiries Section */}
              <section>
                <h3 style={{ fontSize: "18px", margin: "0 0 14px" }}>
                  <Inbox size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                  Received Inquiries (Buyers contacting you)
                </h3>

                {receivedEnquiries.length === 0 ? (
                  <div className="state-box" style={{ padding: "30px" }}>
                    <p style={{ margin: 0 }}>No received buyer inquiries yet.</p>
                  </div>
                ) : (
                  <div className="enquiry-list">
                    {receivedEnquiries.map((enq) => (
                      <article key={enq._id} className="enquiry-card">
                        <div className="enquiry-card-head">
                          <div>
                            <h2>{enq.product?.title || "Item Listing"}</h2>
                            <p>
                              From: <strong>{enq.buyer?.name}</strong> ({enq.buyer?.collegeName})
                            </p>
                          </div>
                          <span className={`status-pill status-${enq.status?.toLowerCase()}`}>
                            {enq.status}
                          </span>
                        </div>

                        <p className="enquiry-message">{enq.message}</p>

                        <div className="enquiry-card-foot">
                          <span>Received on {new Date(enq.createdAt).toLocaleDateString("en-IN")}</span>
                          <div>
                            {enq.status === "Pending" && (
                              <>
                                <button
                                  className="button-link"
                                  disabled={busyId === enq._id}
                                  onClick={() => handleEnquiryStatus(enq._id, "Accepted")}
                                >
                                  Accept & Connect
                                </button>
                                <button
                                  className="button-link danger-link"
                                  disabled={busyId === enq._id}
                                  onClick={() => handleEnquiryStatus(enq._id, "Declined")}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {enq.status !== "Closed" && (
                              <button
                                className="button-link"
                                disabled={busyId === enq._id}
                                onClick={() => handleEnquiryStatus(enq._id, "Closed")}
                              >
                                Mark Closed
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Sent Enquiries Section */}
              <section>
                <h3 style={{ fontSize: "18px", margin: "0 0 14px" }}>
                  <MessageSquare size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                  Sent Inquiries (Your messages to sellers)
                </h3>

                {sentEnquiries.length === 0 ? (
                  <div className="state-box" style={{ padding: "30px" }}>
                    <p style={{ margin: 0 }}>You haven't sent any inquiries to sellers yet.</p>
                  </div>
                ) : (
                  <div className="enquiry-list">
                    {sentEnquiries.map((enq) => (
                      <article key={enq._id} className="enquiry-card">
                        <div className="enquiry-card-head">
                          <div>
                            <h2>{enq.product?.title || "Item"}</h2>
                            <p>
                              Seller: <strong>{enq.seller?.name}</strong> ({enq.seller?.collegeName})
                            </p>
                          </div>
                          <span className={`status-pill status-${enq.status?.toLowerCase()}`}>
                            {enq.status}
                          </span>
                        </div>

                        <p className="enquiry-message">{enq.message}</p>

                        <div className="enquiry-card-foot">
                          <span>Sent on {new Date(enq.createdAt).toLocaleDateString("en-IN")}</span>
                          <Link to={`/products/${enq.product?._id}`} className="button-link">
                            View Listing <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === "profile" && (
        <section style={{ maxWidth: "600px" }}>
          <form className="editor-card" onSubmit={handleSaveProfile}>
            <div style={{ display: "grid", gap: "6px" }}>
              <span className="eyebrow">STUDENT ACCOUNT DETAILS</span>
              <h2 style={{ margin: "4px 0" }}>Profile & Campus Affiliation</h2>
            </div>

            {profileSaved && (
              <div className="action-feedback" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={16} /> Profile changes saved successfully!
              </div>
            )}

            <label>
              Full Name
              <input
                required
                minLength={2}
                maxLength={80}
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </label>

            <label>
              College / University
              <input
                required
                minLength={2}
                maxLength={120}
                value={profileForm.collegeName}
                onChange={(e) => setProfileForm({ ...profileForm, collegeName: e.target.value })}
              />
            </label>

            <label>
              Email Address
              <input value={user?.email || ""} disabled style={{ opacity: 0.65, cursor: "not-allowed" }} />
              <small className="field-hint">Registered email is linked to your campus profile.</small>
            </label>

            <label>
              Account Role
              <input value={user?.role || "student"} disabled style={{ opacity: 0.65, cursor: "not-allowed" }} />
            </label>

            <div className="editor-actions">
              <button className="button" type="submit" disabled={busyId === "profile"}>
                {busyId === "profile" ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
