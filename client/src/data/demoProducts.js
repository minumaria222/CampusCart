const demoSeller = {
  _id: "demo-seller-001",
  name: "CampusCart Student Ambassador",
  collegeName: "Apex University of Engineering & Tech"
};

export const demoProducts = [
  {
    _id: "demo-product-1",
    title: "Higher Engineering Mathematics (B.S. Grewal - 44th Ed.)",
    description: "Standard reference book for 1st & 2nd year engineering. In excellent condition with chapter bookmarks and neat pencil highlights.",
    category: "Textbooks and Notes",
    price: 450,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-25T10:00:00.000Z"
  },
  {
    _id: "demo-product-2",
    title: "Casio fx-991EX ClassWiz Scientific Calculator",
    description: "High-resolution display, 552 functions including matrix calculations and numerical integration. Screen protector applied.",
    category: "Calculators and Electronics",
    price: 850,
    condition: "Like New",
    images: ["https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-24T12:30:00.000Z"
  },
  {
    _id: "demo-product-3",
    title: "Arduino Starter Lab Kit with Sensors & Breadboard",
    description: "Complete electronics hardware bundle including Arduino Uno R3, jumper wires, ultrasonic sensors, motors, and resistors.",
    category: "Lab Equipment",
    price: 1100,
    condition: "Like New",
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-23T15:15:00.000Z"
  },
  {
    _id: "demo-product-4",
    title: "Rotring Professional Mini Drafter with Board Clamp",
    description: "Standard mechanical drafting tool for engineering graphics. Unbreakable scales, smooth rotating protractor head.",
    category: "Stationery",
    price: 480,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-22T09:45:00.000Z"
  },
  {
    _id: "demo-product-5",
    title: "Rechargeable LED Study Lamp with 3 Color Modes",
    description: "Compact foldable hostel study lamp with flexible gooseneck, touch dimmer, and 2000mAh battery backup during power cuts.",
    category: "Hostel Essentials",
    price: 380,
    condition: "Like New",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-21T18:00:00.000Z"
  },
  {
    _id: "demo-product-6",
    title: "Yonex Carbonex 8000 Plus Badminton Racket with Cover",
    description: "Durable graphite shaft, freshly strung at 24 lbs. Ideal for evening court sessions at the campus sports complex.",
    category: "Sports Equipment",
    price: 950,
    condition: "Used",
    images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-20T14:20:00.000Z"
  },
  {
    _id: "demo-product-7",
    title: "Student Laptop 14-inch (Core i5, 8GB RAM, 256GB SSD)",
    description: "Clean laptop suitable for programming, CAD simulations, and assignments. Battery lasts ~3.5 hours. Charger included.",
    category: "Calculators and Electronics",
    price: 16500,
    condition: "Used",
    images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-19T11:00:00.000Z"
  },
  {
    _id: "demo-product-8",
    title: "Waterproof Campus Backpack with Padded Laptop Sleeve",
    description: "32-liter volume, ergonomic shoulder straps, separate shoe/lunch compartment. No tears, all zippers slide smoothly.",
    category: "Hostel Essentials",
    price: 600,
    condition: "Good",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80"],
    seller: demoSeller,
    collegeName: "Apex University of Engineering & Tech",
    status: "Available",
    createdAt: "2026-10-18T16:40:00.000Z"
  }
];

/**
 * Filter, sort, and paginate the local mock demo catalogue.
 * @param {URLSearchParams} query
 */
export function getDemoProducts(query) {
  const page = Math.max(1, Number(query.get("page")) || 1);
  const limit = Math.min(40, Math.max(1, Number(query.get("limit")) || 12));
  const search = (query.get("search") || "").trim().toLowerCase();
  const category = query.get("category") || "";
  const condition = query.get("condition") || "";
  const minPrice = query.has("minPrice") && query.get("minPrice") !== "" ? Number(query.get("minPrice")) : undefined;
  const maxPrice = query.has("maxPrice") && query.get("maxPrice") !== "" ? Number(query.get("maxPrice")) : undefined;
  const sort = query.get("sort") || "newest";

  let filtered = demoProducts.filter((product) => {
    const matchesSearch =
      !search ||
      `${product.title} ${product.description} ${product.category}`.toLowerCase().includes(search);

    const matchesCategory = !category || product.category === category;
    const matchesCondition = !condition || product.condition === condition;
    const matchesMin = minPrice === undefined || product.price >= minPrice;
    const matchesMax = maxPrice === undefined || product.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesCondition && matchesMin && matchesMax;
  });

  if (sort === "price-asc") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else {
    filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return {
    products: paginated,
    total,
    page,
    limit,
    pages,
    source: "demo"
  };
}

/**
 * Find single product from demo catalogue.
 */
export function findDemoProduct(id) {
  return demoProducts.find((p) => p._id === id) || null;
}
