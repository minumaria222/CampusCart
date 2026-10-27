import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { api } from "../services/api.js";
import { getDemoProducts } from "../data/demoProducts.js";

const categories = [
  "Textbooks and Notes",
  "Calculators and Electronics",
  "Lab Equipment",
  "Stationery",
  "Hostel Essentials",
  "Clothing and Accessories",
  "Sports Equipment",
  "Other"
];

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({
    search: params.get("search") || "",
    category: params.get("category") || "",
    condition: params.get("condition") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    sort: params.get("sort") || "newest"
  });

  const [result, setResult] = useState({ products: [], total: 0, pages: 1, source: "database" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const page = Number(params.get("page") || 1);

  // Sync state with URL params & fetch products
  useEffect(() => {
    let active = true;

    setForm({
      search: params.get("search") || "",
      category: params.get("category") || "",
      condition: params.get("condition") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      sort: params.get("sort") || "newest"
    });

    setLoading(true);
    setError("");

    api.get(`/products?${params.toString()}`)
      .then((data) => {
        if (active) {
          setResult({ ...data, source: "database" });
        }
      })
      .catch((err) => {
        if (!active) return;

        // Graceful fallback: If MongoDB is offline (503) or API unreachable, use demo catalogue
        if (!err.status || err.status === 503) {
          const demoData = getDemoProducts(params);
          setResult(demoData);
          setError("");
          return;
        }

        setError(err.message || "Failed to load listings. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params, refreshKey]);

  function applyFilters(e) {
    e.preventDefault();
    const next = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v) next[k] = v;
    });
    setParams(next);
  }

  function clearFilters() {
    setForm({ search: "", category: "", condition: "", minPrice: "", maxPrice: "", sort: "newest" });
    setParams({});
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setParams(next);
    window.scrollTo({ top: 400, behavior: "smooth" });
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" /> THE TRUSTED CAMPUS MARKETPLACE
          </span>
          <h1>
            Good finds.<br />
            <span>Great campus</span> energy.
          </h1>
          <p>
            Give textbooks, lab equipment, and hostel essentials a second life.
            Buy and sell directly with students on your campus.
          </p>
          <a className="button hero-button" href="#marketplace">
            Explore the marketplace <ArrowDown size={17} />
          </a>
          <div className="hero-note">
            <span className="note-avatars">CC</span> Verified student listings. Zero listing fees.
          </div>
        </div>

        <div className="hero-art" aria-label="Campus illustration">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-stack">
            <div className="book book-green"><span>THE<br />ENGINEERING<br />HANDBOOK</span></div>
            <div className="book book-orange"><span>LAB<br />NOTES</span></div>
            <div className="book book-cream"><span>CAMPUS<br />ESSENTIALS</span></div>
          </div>
          <span className="art-spark spark-a">✳</span>
          <span className="art-spark spark-b">✦</span>
          <span className="art-caption">Pass it forward.</span>
        </div>
      </section>

      {/* Main Marketplace Area */}
      <main id="marketplace" className="marketplace section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BROWSE PRE-OWNED INVENTORY</span>
            <h2>Campus picks, <em>re-loved.</em></h2>
          </div>
          <p>Fair student pricing, verified peers, quick campus handoffs.</p>
        </div>

        {/* Filter Controls Bar */}
        <form className="filter-panel" onSubmit={applyFilters}>
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">Search listings</span>
            <input
              value={form.search}
              onChange={(e) => setForm({ ...form, search: e.target.value })}
              placeholder="Search books, drafters, calculators, hostel gear..."
            />
          </label>

          <div className="filter-row">
            <label>
              <span className="sr-only">Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Condition</span>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option value="">Any Condition</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Used">Used</option>
              </select>
            </label>

            <label className="price-input">
              <span className="sr-only">Min price</span>
              <input
                type="number"
                min="0"
                placeholder="Min ₹"
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
              />
            </label>

            <label className="price-input">
              <span className="sr-only">Max price</span>
              <input
                type="number"
                min="0"
                placeholder="Max ₹"
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
              />
            </label>

            <label>
              <span className="sr-only">Sort by</span>
              <select value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })}>
                <option value="newest">Recently Listed</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>

            <button className="button filter-button" type="submit">
              <SlidersHorizontal size={15} /> Filter
            </button>
            <button className="clear-button" type="button" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </form>

        {/* Quick Category Chips */}
        <div className="category-chips" aria-label="Browse popular categories">
          {categories.slice(0, 6).map((cat, idx) => (
            <button
              key={cat}
              type="button"
              className={`category-chip chip-${idx} ${form.category === cat ? "chip-selected" : ""}`}
              onClick={() => {
                const next = { ...form, category: cat };
                setForm(next);
                setParams({ category: cat, ...(form.search ? { search: form.search } : {}) });
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Line & Demo Notice */}
        <div className="results-line">
          <span>
            {loading ? "Searching inventory..." : `${result.total} ${result.total === 1 ? "find" : "finds"} found`}
          </span>
          <span>{result.source === "demo" ? "Offline Demo Catalogue" : "Live Campus Database"}</span>
        </div>

        {!loading && result.source === "demo" && (
          <div className="demo-notice" role="status">
            <strong>Offline Demo Mode:</strong> Database connection is currently unavailable (503).
            Showing sample campus catalogue for demonstration purposes. Live interactions require MongoDB.
          </div>
        )}

        {/* EXPLICIT 4 UI STATES */}
        {/* 1. ERROR STATE */}
        {error && (
          <div className="state-box state-error" role="alert">
            <strong>Could not load the marketplace catalogue.</strong>
            <p>{error}</p>
            <button className="button button-small" onClick={() => setRefreshKey((k) => k + 1)}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {/* 2. LOADING STATE */}
        {loading && !error && (
          <div className="product-grid" aria-busy="true">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div className="product-skeleton" key={n} />
            ))}
          </div>
        )}

        {/* 3. EMPTY STATE */}
        {!loading && !error && result.products.length === 0 && (
          <div className="state-box">
            <span className="empty-mark">✳</span>
            <h3>No matching campus items</h3>
            <p>We couldn’t find any items matching your active search or filters. Try adjusting your parameters.</p>
            <Link className="button button-small" to="/sell">
              List an item for sale <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* 4. SUCCESS STATE */}
        {!loading && !error && result.products.length > 0 && (
          <div className="product-grid">
            {result.products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && result.pages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => changePage(page - 1)}>
              ← Previous
            </button>
            <span>
              Page {page} of {result.pages}
            </span>
            <button disabled={page >= result.pages} onClick={() => changePage(page + 1)}>
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Sell Callout */}
      <section className="sell-banner section-shell">
        <div>
          <span className="eyebrow">DECLUTTER & EARN</span>
          <h2>Have equipment or books sitting idle?<br /><em>Another student needs them today.</em></h2>
        </div>
        <Link to="/sell" className="button button-dark">
          Create a Listing <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}
