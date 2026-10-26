import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";

const categories = ["Textbooks and Notes", "Calculators and Electronics", "Lab Equipment", "Stationery", "Hostel Essentials", "Clothing and Accessories", "Sports Equipment", "Other"];
const initial = { title: "", description: "", category: categories[0], price: "", condition: "Good", images: [] };

export default function ListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then((product) => setForm({
      title: product.title, description: product.description, category: product.category,
      price: String(product.price), condition: product.condition, images: product.images || []
    })).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  function addImage() {
    try {
      const url = new URL(imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      if (form.images.length >= 5) return setError("You can add up to 5 image URLs.");
      if (form.images.includes(url.href)) return setError("That image is already on your listing.");
      setForm({ ...form, images: [...form.images, url.href] });
      setImageUrl("");
      setError("");
    } catch {
      setError("Enter a valid image URL beginning with https://.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { ...form, title: form.title.trim(), description: form.description.trim(), price: Number(form.price) };
      const product = id ? await api.patch(`/products/${id}`, body) : await api.post("/products", body);
      navigate(`/products/${product._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page-status">Loading listing…</div>;
  return <main className="editor-page section-shell">
    <Link className="back-link" to={id ? `/products/${id}` : "/"}><ArrowLeft size={16} /> Back</Link>
    <div className="editor-heading"><span className="eyebrow">{id ? "GIVE YOUR LISTING A REFRESH" : "MAKE ROOM FOR SOMETHING NEW"}</span><h1>{id ? "Edit your listing" : "Pass it along."}</h1><p>A clear description helps the right person find it.</p></div>
    <form className="editor-card" onSubmit={submit}>
      <label>What are you selling?<input maxLength="100" required minLength="3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. First-year engineering textbook set" /></label>
      <label>Tell us a little about it<textarea required minLength="10" maxLength="2000" rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Share the condition, useful details, and anything a new owner should know." /></label>
      <div className="form-two-col">
        <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Condition<select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>{["Like New", "Good", "Used"].map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label>Price <span className="field-hint">(INR)</span><div className="price-entry"><span>₹</span><input type="number" min="0" max="10000000" step="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></div></label>
      <fieldset className="image-fieldset"><legend>Images <span className="field-hint">(up to 5 hosted image URLs)</span></legend>
        <div className="image-url-row"><input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" aria-label="Hosted image URL" /><button className="button button-outline" type="button" onClick={addImage}><ImagePlus size={16} /> Add</button></div>
        {form.images.length > 0 && <ul className="image-list">{form.images.map((url) => <li key={url}><img src={url} alt="Listing preview" /><span>{new URL(url).hostname}</span><button type="button" aria-label="Remove image" onClick={() => setForm({ ...form, images: form.images.filter((image) => image !== url) })}><X size={15} /></button></li>)}</ul>}
        <small>Image uploads are not configured yet. Use image links you are allowed to share.</small>
      </fieldset>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="editor-actions"><Link className="button-link" to={id ? `/products/${id}` : "/"}>Cancel</Link><button className="button" disabled={busy}>{busy ? "Saving…" : id ? "Save changes" : "Publish listing"}</button></div>
    </form>
  </main>;
}
