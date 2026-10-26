import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Enquiries() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [tab, setTab] = useState("received");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [outgoing, incoming] = await Promise.all([
        api.get("/enquiries/sent"),
        api.get("/enquiries/received")
      ]);
      setSent(outgoing);
      setReceived(incoming);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(enquiryId, status) {
    try {
      const updated = await api.patch(`/enquiries/${enquiryId}/status`, { status });
      setReceived((items) => items.map((item) => item._id === updated._id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  const items = tab === "received" ? received : sent;
  return <main className="section-shell listings-page">
    <div className="listings-heading"><div><span className="eyebrow">A GOOD CONVERSATION STARTS HERE</span><h1>Enquiries</h1><p>Coordinate directly with students about listings.</p></div></div>
    <div className="tab-switch" role="tablist" aria-label="Enquiry type">
      <button className={tab === "received" ? "tab-active" : ""} role="tab" aria-selected={tab === "received"} onClick={() => setTab("received")}>Received ({received.length})</button>
      <button className={tab === "sent" ? "tab-active" : ""} role="tab" aria-selected={tab === "sent"} onClick={() => setTab("sent")}>Sent ({sent.length})</button>
    </div>
    {error && <div className="form-error page-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
    {loading ? <div className="page-status">Loading enquiries…</div> : items.length ? <div className="enquiry-list">
      {items.map((enquiry) => <article className="enquiry-card" key={enquiry._id}>
        <div className="enquiry-card-head">
          <div><span className={`status-pill status-${enquiry.status.toLowerCase()}`}>{enquiry.status}</span>
            <h2><Link to={enquiry.product ? `/products/${enquiry.product._id}` : "#"}>{enquiry.product?.title || "Listing removed"}</Link></h2>
            <p>{tab === "received" ? "From" : "To"} <strong>{tab === "received" ? enquiry.buyer?.name : enquiry.seller?.name}</strong> · {tab === "received" ? enquiry.buyer?.collegeName : enquiry.seller?.collegeName}</p>
          </div>
          {enquiry.product?.price !== undefined && <strong className="enquiry-price">₹{enquiry.product.price.toLocaleString("en-IN")}</strong>}
        </div>
        <p className="enquiry-message">{enquiry.message}</p>
        <div className="enquiry-card-foot"><span>{new Date(enquiry.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
          {tab === "received" && !["Closed", "Declined"].includes(enquiry.status) && <div>
            {enquiry.status === "Pending" && <button className="button-link" onClick={() => updateStatus(enquiry._id, "Responded")}>Mark responded</button>}
            <button className="button-link" onClick={() => updateStatus(enquiry._id, "Accepted")}>Accept</button>
            <button className="button-link danger-link" onClick={() => updateStatus(enquiry._id, "Declined")}>Decline</button>
          </div>}
        </div>
      </article>)}
    </div> : <div className="state-box"><span className="empty-mark">✉</span><h2>No {tab} enquiries yet.</h2><p>{tab === "received" ? "When students ask about your listings, you’ll see their message here." : "When you ask about an item, your message will show here."}</p></div>}
  </main>;
}
