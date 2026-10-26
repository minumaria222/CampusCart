import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { api } from "../services/api.js";
import { getDemoProducts } from "../data/demoProducts.js";

const categories = [
  "Textbooks and Notes", "Calculators and Electronics", "Lab Equipment", "Stationery",
  "Hostel Essentials", "Clothing and Accessories", "Sports Equipment", "Other"
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({
    search: params.get("search") || "",
    category: params.get("category") || "",
    condition: params.get("condition") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    sort: params.get("sort") || "newest"
  });
  const [result, setResult] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const page = Number(params.get("page") || 1);
  const [refreshKey, setRefreshKey] = useState(0);

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
      .then((data) => { if (active) setResult({ ...data, source: "database" }); })
      .catch((err) => {
        if (!active) return;
        if (!err.status || err.status === 503) {
          setResult(getDemoProducts(params));
          setError("");
          return;
        }
        setError(err.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params, refreshKey]);

  function applyFilters(event) {
    event.preventDefault();
    const next = {};
    Object.entries(form).forEach(([key, value]) => { if (value) next[key] = value; });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot" /> THE STUDENT-TO-STUDENT MARKETPLACE</span>
          <h1>Good finds.<br /><span>Great campus</span> energy.</h1>
          <p>Give pre-loved essentials a second life. Find what you need from students who get campus life.</p>
          <a className="button hero-button" href="#marketplace">Explore the marketplace <ArrowDown size={17} /></a>
          <div className="hero-note"><span className="note-avatars">CC</span> Made for campus. Shared by campus.</div>
        </div>
        <div className="hero-art" aria-label="Illustration of books and study supplies">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-stack">
            <div className="book book-green"><span>THE<br />STUDENT<br />HANDBOOK</span></div>
            <div className="book book-orange"><span>IDEAS<br />IN MOTION</span></div>
            <div className="book book-cream"><span>LEARN<br />GROW<br />REPEAT</span></div>
          </div>
          <span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✦</span>
          <span className="art-caption">Pass it on.</span>
        </div>
      </section>

      <main id="marketplace" className="marketplace section-shell">
        <div className="section-heading">
          <div><span className="eyebrow">YOUR NEXT GREAT FIND</span><h2>Campus picks, <em>re-loved.</em></h2></div>
          <p>Useful things, fair prices, a new owner around the corner.</p>
        </div>
        <form className="filter-panel" onSubmit={applyFilters}>
          <label className="search-field"><Search size={18} /><span className="sr-only">Search listings</span>
            <input value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} placeholder="Search books, calculators, dorm finds…" />
          </label>
          <div className="filter-row">
            <label><span className="sr-only">Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}
            </select></label>
            <label><span className="sr-only">Condition</span><select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              <option value="">Any condition</option>{["Like New", "Good", "Used"].map((c) => <option key={c}>{c}</option>)}
            </select></label>
            <label className="price-input"><span className="sr-only">Minimum price in rupees</span><input type="number" min="0" placeholder="Min ₹" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} /></label>
            <label className="price-input"><span className="sr-only">Maximum price in rupees</span><input type="number" min="0" placeholder="Max ₹" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} /></label>
            <label><span className="sr-only">Sort listings</span><select value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })}>
              <option value="newest">Recently listed</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
            </select></label>
            <button className="button filter-button" type="submit"><SlidersHorizontal size={16} /> Apply</button>
            <button className="clear-button" type="button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        <div className="category-chips" aria-label="Browse categories">
          {categories.slice(0, 5).map((category, index) => (
            <button key={category} className={`category-chip chip-${index}`} onClick={() => {
              const next = { ...form, category };
              setForm(next);
              setParams({ category, ...(form.search ? { search: form.search } : {}) });
            }}>{category}</button>
          ))}
        </div>

        <div className="results-line"><span>{loading ? "Finding good stuff…" : `${result.total} ${result.total === 1 ? "find" : "finds"} to explore`}</span><span>{result.source === "demo" ? "Local demo catalogue" : "New listings added by students"}</span></div>
        {!loading && result.source === "demo" && <p className="demo-notice" role="status">Demo listings — examples shown locally because MongoDB is unavailable. These are not saved or real marketplace listings.</p>}
        {error ? <div className="state-box state-error"><strong>We couldn’t load the marketplace.</strong><p>{error}</p><button className="button button-small" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button></div> :
          loading ? <div className="product-grid">{[1, 2, 3, 4].map((n) => <div className="product-skeleton" key={n} />)}</div> :
            result.products.length ? <div className="product-grid">{result.products.map((product) => <ProductCard key={product._id} product={product} />)}</div> :
              <div className="state-box"><span className="empty-mark">✳</span><h3>No finds just yet</h3><p>Try a different search or be the first to list something useful.</p><Link className="button button-small" to="/sell">Sell an item <ArrowRight size={15} /></Link></div>
        }
        {!loading && !error && result.pages > 1 && <div className="pagination">
          <button disabled={page <= 1} onClick={() => changePage(page - 1)}>← Previous</button>
          <span>Page {page} of {result.pages}</span>
          <button disabled={page >= result.pages} onClick={() => changePage(page + 1)}>Next →</button>
        </div>}
      </main>
      <section className="sell-banner section-shell">
        <div><span className="eyebrow">CLEAR YOUR SHELF, NOT YOUR WALLET</span><h2>That thing you don’t need?<br /><em>Someone on campus does.</em></h2></div>
        <Link to="/sell" className="button button-dark">List an item <ArrowRight size={17} /></Link>
      </section>
      <footer className="site-footer"><Link className="brand" to="/"><span className="brand-icon"><span>c</span></span><span>campus<span className="brand-accent">cart</span></span></Link><span>Good things go around. © {new Date().getFullYear()} CampusCart</span><a href="#marketplace">Back to top ↑</a></footer>
    </>
  );
}
