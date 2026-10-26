import { Link } from "react-router-dom";
import { ArrowUpRight, Tag } from "lucide-react";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function ProductCard({ product }) {
  const image = product.images?.[0];
  return (
    <article className="product-card">
      <Link className={`product-image ${image ? "" : "image-placeholder"}`} to={`/products/${product._id}`}>
        {image ? <img src={image} alt={product.title} loading="lazy" /> : <span>Ready for a new chapter</span>}
        <span className="image-condition">{product.condition}</span>
      </Link>
      <div className="product-card-body">
        <div className="product-category"><Tag size={13} /> {product.category}</div>
        <Link className="product-title" to={`/products/${product._id}`}>{product.title}</Link>
        <div className="product-card-bottom">
          <strong>{money.format(product.price)}</strong>
          <Link className="round-link" aria-label={`View ${product.title}`} to={`/products/${product._id}`}><ArrowUpRight size={17} /></Link>
        </div>
        <p className="product-college">{product.collegeName}</p>
      </div>
    </article>
  );
}
