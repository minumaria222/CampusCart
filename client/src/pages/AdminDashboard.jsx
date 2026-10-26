import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const tabs = ["Overview", "Listings", "Reports", "Users"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
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
      setProducts(listingData.products);
      setReports(reportData.reports);
      setUsers(userData.users);
      setListingPages(listingData.pages);
      setReportPages(reportData.pages);
      setUserPages(userData.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [listingPage, listingSearch, reportPage, userPage, userSearch]);

  async function moderateProduct(product, status) {
    if (status === "Removed" && !window.confirm(`Remove "${product.title || "this listing"}" from public results?`)) return;
    try {
      const updated = await api.patch(`/admin/products/${product._id}/moderation`, { status });
      setProducts((items) => items.map((item) => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  async function reviewReport(report, status) {
    try {
      const updated = await api.patch(`/admin/reports/${report._id}`, { status });
      setReports((items) => items.map((item) => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  async function setAccountStatus(user, accountStatus) {
    if (accountStatus === "suspended" && !window.confirm(`Suspend ${user.name}'s account?`)) return;
    try {
      const updated = await api.patch(`/admin/users/${user._id}/status`, { accountStatus });
      setUsers((items) => items.map((item) => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  return <main className="section-shell admin-page">
    <div className="listings-heading"><div><span className="eyebrow">CAMPUSCART OPERATIONS</span><h1>Admin dashboard</h1><p>Review activity and help keep the marketplace useful.</p></div><button className="button button-outline" onClick={load}>Refresh data</button></div>
    {error && <div className="form-error page-error" role="alert">{error}<button onClick={load}>Retry</button></div>}
    {loading ? <div className="page-status">Loading marketplace data…</div> : <>
      <section className="admin-stats">
        {[
          ["Students", stats?.users], ["Available listings", stats?.activeListings],
          ["Items sold", stats?.soldListings], ["Pending reports", stats?.pendingReports]
        ].map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{value ?? "—"}</strong></article>)}
      </section>
      <div className="tab-switch admin-tabs" role="tablist" aria-label="Admin dashboard sections">
        {tabs.map((name) => <button key={name} className={tab === name ? "tab-active" : ""} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}
      </div>

      {tab === "Overview" && <section className="admin-overview-grid">
        <article className="admin-overview-card"><span className="eyebrow">NEEDS A LOOK</span><h2>{stats?.pendingReports} reports waiting</h2><p>Check report details and resolve or review each flag.</p><button className="button button-small" onClick={() => setTab("Reports")}>Review reports</button></article>
        <article className="admin-overview-card"><span className="eyebrow">SELLER MESSAGES</span><h2>{stats?.pendingEnquiries} pending enquiries</h2><p>Enquiries are visible only to the buyer and seller.</p></article>
      </section>}

      {tab === "Listings" && <>
        <form className="admin-search" onSubmit={(event) => { event.preventDefault(); setListingPage(1); setListingSearch(listingSearchInput); }}>
          <input value={listingSearchInput} onChange={(event) => setListingSearchInput(event.target.value)} maxLength="80" placeholder="Search listings, details, or college" aria-label="Search listings" />
          <button className="button button-small">Search</button>
        </form>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Listing</th><th>Seller</th><th>College</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {products.map((product) => <tr key={product._id}><td>{product.title}<small>₹{product.price.toLocaleString("en-IN")} · {product.category}</small></td><td>{product.seller?.name || "Unknown"}</td><td>{product.collegeName}</td><td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td><td>{product.status === "Removed" ? <button className="button-link" onClick={() => moderateProduct(product, "Available")}>Restore</button> : <button className="button-link danger-link" onClick={() => moderateProduct(product, "Removed")}>Remove</button>}</td></tr>)}
        {!products.length && <tr><td colSpan="5">No listings yet.</td></tr>}
        </tbody></table></div>
        <div className="admin-pagination"><button disabled={listingPage <= 1} onClick={() => setListingPage(listingPage - 1)}>← Previous</button><span>Page {listingPage} of {listingPages}</span><button disabled={listingPage >= listingPages} onClick={() => setListingPage(listingPage + 1)}>Next →</button></div>
      </>}

      {tab === "Reports" && <><div className="admin-report-list">{reports.map((report) => <article key={report._id} className="admin-report-card">
        <div className="admin-report-meta"><span className={`status-pill status-${report.status.toLowerCase()}`}>{report.status}</span><span>{new Date(report.createdAt).toLocaleDateString("en-IN")}</span></div>
        <h2>{report.product?.title || "Listing removed"} <small>· {report.reason}</small></h2>
        <p>{report.description || "No additional details provided."}</p>
        <div className="enquiry-card-foot"><span>Reported by {report.reporter?.name || "Student"} · {report.reporter?.collegeName}</span><div>
          {report.status === "Pending" && <button className="button-link" onClick={() => reviewReport(report, "Reviewed")}>Mark reviewed</button>}
          {report.status !== "Resolved" && <button className="button-link" onClick={() => reviewReport(report, "Resolved")}>Resolve</button>}
          {report.product && report.product.status !== "Removed" && <button className="button-link danger-link" onClick={() => moderateProduct({ _id: report.product._id }, "Removed")}>Remove listing</button>}
        </div></div>
      </article>)}{!reports.length && <div className="state-box"><h2>No reports to review.</h2><p>New flags from students will appear here.</p></div>}</div>
        <div className="admin-pagination"><button disabled={reportPage <= 1} onClick={() => setReportPage(reportPage - 1)}>← Previous</button><span>Page {reportPage} of {reportPages}</span><button disabled={reportPage >= reportPages} onClick={() => setReportPage(reportPage + 1)}>Next →</button></div>
      </>}

      {tab === "Users" && <>
        <form className="admin-search" onSubmit={(event) => { event.preventDefault(); setUserPage(1); setUserSearch(userSearchInput); }}>
          <input value={userSearchInput} onChange={(event) => setUserSearchInput(event.target.value)} maxLength="80" placeholder="Search name, email, or college" aria-label="Search accounts" />
          <button className="button button-small">Search</button>
        </form>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Student</th><th>College</th><th>Role</th><th>Account</th><th>Action</th></tr></thead><tbody>
        {users.map((user) => <tr key={user._id}><td>{user.name}<small>{user.email}</small></td><td>{user.collegeName}</td><td>{user.role}</td><td>{user.accountStatus}</td><td><button className={`button-link ${user.accountStatus === "active" ? "danger-link" : ""}`} onClick={() => setAccountStatus(user, user.accountStatus === "active" ? "suspended" : "active")}>{user.accountStatus === "active" ? "Suspend" : "Reactivate"}</button></td></tr>)}
        {!users.length && <tr><td colSpan="5">No accounts found.</td></tr>}
        </tbody></table></div>
        <div className="admin-pagination"><button disabled={userPage <= 1} onClick={() => setUserPage(userPage - 1)}>← Previous</button><span>Page {userPage} of {userPages}</span><button disabled={userPage >= userPages} onClick={() => setUserPage(userPage + 1)}>Next →</button></div>
      </>}
    </>}
  </main>;
}
