import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Flag, Package, RefreshCw, Search, Shield, Users } from "lucide-react";
import { api } from "../services/api.js";

const tabs = ["Overview", "Listings", "Reports", "Users"];

export default function AdminPage() {
  const [tab, setTab] = useState("Overview");

  // Operational states
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);

  // Pagination & Filtering
  const [listingPage, setListingPage] = useState(1);
  const [listingPages, setListingPages] = useState(1);
  const [listingSearch, setListingSearch] = useState("");
  const [listingSearchInput, setListingSearchInput] = useState("");

  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");

  const [reportPage, setReportPage] = useState(1);
  const [reportPages, setReportPages] = useState(1);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const [summary, listingData, reportData, userData] = await Promise.all([
        api.get("/admin/stats"),
        api.get(`/admin/products?limit=20&page=${listingPage}&search=${encodeURIComponent(listingSearch)}`),
        api.get(`/admin/reports?limit=20&page=${reportPage}`),
        api.get(`/admin/users?limit=20&page=${userPage}&search=${encodeURIComponent(userSearch)}`)
      ]);

      setStats(summary);
      setProducts(listingData.products || []);
      setListingPages(listingData.pages || 1);
      setReports(reportData.reports || []);
      setReportPages(reportData.pages || 1);
      setUsers(userData.users || []);
      setUserPages(userData.pages || 1);
    } catch (err) {
      setError(err.message || "Failed to load admin moderation data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [listingPage, listingSearch, reportPage, userPage, userSearch]);

  // Moderate Product Listing
  async function handleModerateProduct(product, status) {
    if (status === "Removed" && !window.confirm(`Remove "${product.title}" from public marketplace results?`)) {
      return;
    }
    setBusyAction(`product-${product._id}`);
    try {
      const updated = await api.patch(`/admin/products/${product._id}/moderation`, { status });
      setProducts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      setError(err.message || "Could not moderate product.");
    } finally {
      setBusyAction("");
    }
  }

  // Review & Resolve User Report
  async function handleReviewReport(report, status) {
    setBusyAction(`report-${report._id}`);
    try {
      const updated = await api.patch(`/admin/reports/${report._id}`, { status });
      setReports((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      setError(err.message || "Failed to update report status.");
    } finally {
      setBusyAction("");
    }
  }

  // Suspend or Reactivate Student Account
  async function handleToggleUserStatus(user, accountStatus) {
    if (accountStatus === "suspended" && !window.confirm(`Suspend account for ${user.name} (${user.email})?`)) {
      return;
    }
    setBusyAction(`user-${user._id}`);
    try {
      const updated = await api.patch(`/admin/users/${user._id}/status`, { accountStatus });
      setUsers((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      setError(err.message || "Failed to change user account status.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main className="section-shell admin-page">
      <div className="listings-heading">
        <div>
          <span className="eyebrow">
            <Shield size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            CAMPUSCART GOVERNANCE & MODERATION
          </span>
          <h1>Administrator Portal</h1>
          <p>Review system stats, moderate listings, investigate flags, and manage accounts.</p>
        </div>
        <button className="button button-outline" onClick={loadAdminData}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="form-error page-error" role="alert">
          <strong>Administration Error:</strong> {error}
          <button onClick={loadAdminData}>Retry</button>
        </div>
      )}

      {/* 1. LOADING STATE */}
      {loading && (
        <div className="page-status" aria-busy="true">
          <h3>Loading administrator workspace...</h3>
        </div>
      )}

      {/* SUCCESS STATE */}
      {!loading && (
        <>
          {/* Top KPI Metrics Bar */}
          <section className="admin-stats">
            <article className="admin-stat">
              <span>Registered Students</span>
              <strong>{stats?.users ?? "—"}</strong>
            </article>
            <article className="admin-stat">
              <span>Active Listings</span>
              <strong>{stats?.activeListings ?? "—"}</strong>
            </article>
            <article className="admin-stat">
              <span>Items Sold</span>
              <strong>{stats?.soldListings ?? "—"}</strong>
            </article>
            <article className="admin-stat">
              <span>Pending Flags</span>
              <strong>{stats?.pendingReports ?? "—"}</strong>
            </article>
          </section>

          {/* Tab Navigation */}
          <div className="tab-switch admin-tabs" role="tablist">
            {tabs.map((name) => (
              <button
                key={name}
                className={tab === name ? "tab-active" : ""}
                role="tab"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {tab === "Overview" && (
            <section className="admin-overview-grid">
              <article className="admin-overview-card">
                <span className="eyebrow">ACTION REQUIRED</span>
                <h2>{stats?.pendingReports || 0} Reports Awaiting Review</h2>
                <p>Students have flagged suspicious items or policy violations.</p>
                <button className="button button-small" onClick={() => setTab("Reports")}>
                  Investigate Flags
                </button>
              </article>
              <article className="admin-overview-card">
                <span className="eyebrow">STUDENT ACTIVITY</span>
                <h2>{stats?.pendingEnquiries || 0} Active Private Messages</h2>
                <p>Peer-to-peer inquiries are encrypted and protected by ownership rules.</p>
              </article>
            </section>
          )}

          {/* TAB 2: LISTINGS MODERATION */}
          {tab === "Listings" && (
            <>
              <form
                className="admin-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setListingPage(1);
                  setListingSearch(listingSearchInput);
                }}
              >
                <input
                  value={listingSearchInput}
                  onChange={(e) => setListingSearchInput(e.target.value)}
                  placeholder="Search listings by title, description, or college..."
                />
                <button className="button button-small" type="submit">
                  <Search size={14} /> Search
                </button>
              </form>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title & Details</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Seller & Campus</th>
                      <th>Status</th>
                      <th>Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.title}</strong>
                          <small>{item.condition}</small>
                        </td>
                        <td>{item.category}</td>
                        <td>₹{item.price?.toLocaleString("en-IN")}</td>
                        <td>
                          {item.seller?.name || "Student"}
                          <small>{item.collegeName}</small>
                        </td>
                        <td>
                          <span className={`status-pill status-${item.status?.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === "Removed" ? (
                            <button
                              className="button-link"
                              disabled={busyAction === `product-${item._id}`}
                              onClick={() => handleModerateProduct(item, "Available")}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              className="button-link danger-link"
                              disabled={busyAction === `product-${item._id}`}
                              onClick={() => handleModerateProduct(item, "Removed")}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                          No listings found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {listingPages > 1 && (
                <div className="admin-pagination">
                  <button disabled={listingPage <= 1} onClick={() => setListingPage(listingPage - 1)}>
                    ← Previous
                  </button>
                  <span>
                    Page {listingPage} of {listingPages}
                  </span>
                  <button disabled={listingPage >= listingPages} onClick={() => setListingPage(listingPage + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 3: USER REPORTS */}
          {tab === "Reports" && (
            <>
              {reports.length === 0 ? (
                <div className="state-box">
                  <CheckCircle size={32} color="#287b5b" style={{ margin: "0 auto 12px" }} />
                  <h2>Queue is clear!</h2>
                  <p>No student reports or flags currently awaiting moderation.</p>
                </div>
              ) : (
                <div className="admin-report-list">
                  {reports.map((rep) => (
                    <article key={rep._id} className="admin-report-card">
                      <div className="admin-report-meta">
                        <span className={`status-pill status-${rep.status?.toLowerCase()}`}>
                          {rep.status}
                        </span>
                        <span>{new Date(rep.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>

                      <h2>
                        {rep.product?.title || "Removed Product"} <small>· Reason: {rep.reason}</small>
                      </h2>

                      <p>{rep.description || "No additional comments provided by student."}</p>

                      <div className="enquiry-card-foot">
                        <span>
                          Reported by: <strong>{rep.reporter?.name}</strong> ({rep.reporter?.collegeName})
                        </span>
                        <div>
                          {rep.status === "Pending" && (
                            <button
                              className="button-link"
                              disabled={busyAction === `report-${rep._id}`}
                              onClick={() => handleReviewReport(rep, "Reviewed")}
                            >
                              Mark Reviewed
                            </button>
                          )}
                          {rep.status !== "Resolved" && (
                            <button
                              className="button-link"
                              disabled={busyAction === `report-${rep._id}`}
                              onClick={() => handleReviewReport(rep, "Resolved")}
                            >
                              Resolve
                            </button>
                          )}
                          {rep.product && rep.product.status !== "Removed" && (
                            <button
                              className="button-link danger-link"
                              disabled={busyAction === `product-${rep.product._id}`}
                              onClick={() => handleModerateProduct({ _id: rep.product._id, title: rep.product.title }, "Removed")}
                            >
                              Remove Item Listing
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {reportPages > 1 && (
                <div className="admin-pagination">
                  <button disabled={reportPage <= 1} onClick={() => setReportPage(reportPage - 1)}>
                    ← Previous
                  </button>
                  <span>
                    Page {reportPage} of {reportPages}
                  </span>
                  <button disabled={reportPage >= reportPages} onClick={() => setReportPage(reportPage + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {tab === "Users" && (
            <>
              <form
                className="admin-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setUserPage(1);
                  setUserSearch(userSearchInput);
                }}
              >
                <input
                  value={userSearchInput}
                  onChange={(e) => setUserSearchInput(e.target.value)}
                  placeholder="Search accounts by student name, email, or college..."
                />
                <button className="button button-small" type="submit">
                  <Search size={14} /> Search
                </button>
              </form>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>College Affiliation</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </td>
                        <td>{u.collegeName}</td>
                        <td>
                          <span className={`status-pill ${u.role === "admin" ? "status-sold" : "status-available"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${u.accountStatus === "suspended" ? "status-removed" : "status-available"}`}>
                            {u.accountStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`button-link ${u.accountStatus === "active" ? "danger-link" : ""}`}
                            disabled={busyAction === `user-${u._id}`}
                            onClick={() =>
                              handleToggleUserStatus(u, u.accountStatus === "active" ? "suspended" : "active")
                            }
                          >
                            {u.accountStatus === "active" ? "Suspend Account" : "Reactivate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                          No student accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {userPages > 1 && (
                <div className="admin-pagination">
                  <button disabled={userPage <= 1} onClick={() => setUserPage(userPage - 1)}>
                    ← Previous
                  </button>
                  <span>
                    Page {userPage} of {userPages}
                  </span>
                  <button disabled={userPage >= userPages} onClick={() => setUserPage(userPage + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
