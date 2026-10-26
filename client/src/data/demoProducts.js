const demoSeller = {
  _id: "campuscart-demo-seller",
  name: "CampusCart Student",
  collegeName: "CampusCart Demo College"
};

export const demoProducts = [
  {
    _id: "demo-product-1",
    title: "Engineering Mathematics Textbook",
    description: "A well-kept first-year engineering mathematics textbook. Notes and a few useful bookmarks included.",
    category: "Textbooks and Notes",
    price: 350,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-25T10:00:00.000Z"
  },
  {
    _id: "demo-product-2",
    title: "Casio Scientific Calculator",
    description: "Reliable scientific calculator in good working condition. Ideal for engineering and science courses.",
    category: "Calculators and Electronics",
    price: 650,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-24T10:00:00.000Z"
  },
  {
    _id: "demo-product-3",
    title: "Student Laptop for Projects",
    description: "Pre-owned laptop suitable for assignments, presentations, and everyday student work. Charger included.",
    category: "Calculators and Electronics",
    price: 18500,
    condition: "Used",
    images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-23T10:00:00.000Z"
  },
  {
    _id: "demo-product-4",
    title: "Beginner Electronics Lab Kit",
    description: "A starter kit with breadboard, jumper wires, LEDs, and basic components for college lab practice.",
    category: "Lab Equipment",
    price: 900,
    condition: "Like New",
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-22T10:00:00.000Z"
  },
  {
    _id: "demo-product-5",
    title: "Complete Drafter Set",
    description: "Drafting tools in a protective case. Great for technical drawing and architecture coursework.",
    category: "Stationery",
    price: 480,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-21T10:00:00.000Z"
  },
  {
    _id: "demo-product-6",
    title: "Desk Lamp for Hostel Room",
    description: "Compact study lamp with adjustable neck. A useful, space-saving addition to a hostel desk.",
    category: "Hostel Essentials",
    price: 550,
    condition: "Like New",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-20T10:00:00.000Z"
  },
  {
    _id: "demo-product-7",
    title: "Campus Badminton Racket",
    description: "Lightweight racket for casual games and practice after class. Grip is in good shape.",
    category: "Sports Equipment",
    price: 750,
    condition: "Used",
    images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-19T10:00:00.000Z"
  },
  {
    _id: "demo-product-8",
    title: "Campus Tote and Stationery Bundle",
    description: "Reusable tote bag with notebooks and pens. Handy for lectures and everyday campus errands.",
    category: "Stationery",
    price: 220,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "CampusCart Demo College",
    status: "Available",
    createdAt: "2026-10-18T10:00:00.000Z"
  }
];

export function getDemoProducts(query) {
  const page = Math.max(1, Number(query.get("page")) || 1);
  const limit = Math.min(40, Math.max(1, Number(query.get("limit")) || 12));
  const search = (query.get("search") || "").trim().toLowerCase();
  const category = query.get("category") || "";
  const condition = query.get("condition") || "";
  const minPrice = query.has("minPrice") ? Number(query.get("minPrice")) : undefined;
  const maxPrice = query.has("maxPrice") ? Number(query.get("maxPrice")) : undefined;
  const sort = query.get("sort") || "newest";

  let products = demoProducts.filter((product) => {
    const matchesSearch = !search || `${product.title} ${product.description}`.toLowerCase().includes(search);
    return matchesSearch &&
      (!category || product.category === category) &&
      (!condition || product.condition === condition) &&
      (minPrice === undefined || product.price >= minPrice) &&
      (maxPrice === undefined || product.price <= maxPrice);
  });

  if (sort === "price-asc") products = products.toSorted((a, b) => a.price - b.price);
  else if (sort === "price-desc") products = products.toSorted((a, b) => b.price - a.price);
  else products = products.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = products.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  return {
    products: products.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
    pages,
    source: "demo"
  };
}

export function findDemoProduct(id) {
  return demoProducts.find((product) => product._id === id);
}
