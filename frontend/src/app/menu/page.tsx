
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import "./menu.css";

type Category = "Tất cả" | "Cà phê" | "Trà" | "Trà sữa" | "Đá xay";
type Size = "S" | "M" | "L";
type View = "menu" | "cart" | "checkout";

type Topping = {
  id: string;
  name: string;
  price: number;
};

type Product = {
  id: number;
  name: string;
  description: string;
  category: Exclude<Category, "Tất cả">;
  price: number;
  emoji: string;
  popular?: boolean;
};

type CartItem = {
  key: string;
  product: Product;
  size: Size;
  sugar: number;
  ice: number;
  toppings: Topping[];
  quantity: number;
};

type ApiProduct = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  stock: number;
};

type ApiTopping = { id: number; name: string; price: number };

type ApiOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
};

type PaymentMethod = "WALLET" | "CARD";

const categories: Category[] = [
  "Tất cả",
  "Cà phê",
  "Trà",
  "Trà sữa",
  "Đá xay",
];

const sizePrices: Record<Size, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    category: (p.category as Product["category"]) ?? "Cà phê",
    price: p.price,
    emoji: p.imageUrl || "☕",
  };
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getItemPrice(item: CartItem) {
  return (
    item.product.price +
    sizePrices[item.size] +
    item.toppings.reduce((sum, topping) => sum + topping.price, 0)
  );
}

export default function MenuPage() {
  const [view, setView] = useState<View>("menu");
  const [category, setCategory] = useState<Category>("Tất cả");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState<Size>("M");
  const [sugar, setSugar] = useState(50);
  const [ice, setIce] = useState(50);
  const [chosenToppings, setChosenToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    "loading"
  );
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promo, setPromo] = useState("");
  const [simulateFail, setSimulateFail] = useState(false);
  // Khóa idempotency gắn với nội dung giỏ: bấm đặt lại / thử thanh toán lại không tạo thêm đơn.
  const orderKeyRef = useRef<{ signature: string; key: string } | null>(null);

  const [customer, setCustomer] = useState<{ payment: PaymentMethod }>({
    payment: "WALLET",
  });

  // Tải thực đơn và topping từ backend (Task 3).
  useEffect(() => {
    let alive = true;
    Promise.all([
      apiRequest<ApiProduct[]>("/products"),
      apiRequest<ApiTopping[]>("/toppings"),
    ])
      .then(([apiProducts, apiToppings]) => {
        if (!alive) return;
        setProducts(apiProducts.map(toProduct));
        setToppings(
          apiToppings.map((t) => ({ id: String(t.id), name: t.name, price: t.price }))
        );
        setLoadError("");
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setLoadError(
          error instanceof Error ? error.message : "Không tải được thực đơn."
        );
        setLoadState("error");
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  function reloadMenu() {
    setLoadState("loading");
    setReloadKey((n) => n + 1);
  }

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        category === "Tất cả" || product.category === category;

      const matchSearch = (
        product.name +
        " " +
        product.description
      )
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, category, search]);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const selectedPrice = selected
    ? selected.price +
      sizePrices[size] +
      chosenToppings.reduce((sum, topping) => sum + topping.price, 0)
    : 0;

  function goTo(nextView: View) {
    setView(nextView);
    setSelected(null);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product: Product) {
    setSelected(product);
    setView("menu");
    setSize("M");
    setSugar(50);
    setIce(50);
    setChosenToppings([]);
    setQuantity(1);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart() {
    if (!selected) return;

    const toppingIds = chosenToppings
      .map((topping) => topping.id)
      .sort()
      .join(",");

    const key =
      `${selected.id}-${size}-${sugar}-${ice}-${toppingIds}`;

    setCart((previous) => {
      const existing = previous.find((item) => item.key === key);

      if (existing) {
        return previous.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...previous,
        {
          key,
          product: selected,
          size,
          sugar,
          ice,
          toppings: [...chosenToppings],
          quantity,
        },
      ];
    });

    setSelected(null);
    setNotice("Đã thêm đồ uống vào giỏ hàng!");
  }

  function changeCartQuantity(key: string, change: number) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length || submitting) return;

    const token = sessionStorage.getItem("brewlite_token");
    if (!token) {
      setNotice("Bạn cần đăng nhập để đặt hàng. Đang chuyển tới trang đăng nhập...");
      router.push("/login");
      return;
    }

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      size: item.size,
      toppings: item.toppings.map((t) => ({
        toppingId: Number(t.id),
        quantity: 1,
      })),
    }));
    const promoCode = promo.trim() || undefined;
    const signature = JSON.stringify({ items, promoCode });
    if (orderKeyRef.current?.signature !== signature) {
      orderKeyRef.current = { signature, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    setNotice("");
    try {
      const auth = { Authorization: `Bearer ${token}` };
      const order = await apiRequest<ApiOrder>("/orders", {
        method: "POST",
        headers: { ...auth, "Idempotency-Key": orderKeyRef.current.key },
        body: JSON.stringify({ items, promoCode }),
      });

      const result = await apiRequest<{
        order: ApiOrder;
        payment: { status: string };
      }>("/payments", {
        method: "POST",
        headers: { ...auth, "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          orderId: order.id,
          method: customer.payment,
          simulate: simulateFail ? "FAIL" : "SUCCESS",
        }),
      });

      if (result.payment.status !== "SUCCESS") {
        // Thanh toán lỗi: giữ nguyên giỏ hàng để thử lại (cùng đơn, không trừ kho lần hai).
        setNotice(
          `Thanh toán thất bại (đơn #${result.order.id}: ${result.order.status}). Giỏ hàng được giữ nguyên, bạn có thể thử lại.`
        );
        return;
      }

      sessionStorage.setItem(
        "brewlite_last_order",
        JSON.stringify({
          id: result.order.id,
          status: result.order.status,
          total: result.order.total,
          createdAt: result.order.createdAt,
        })
      );
      orderKeyRef.current = null;
      setCart([]);
      router.push("/orders/confirmation");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể đặt hàng lúc này."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="brew-menu">
      <div className="brew-announcement">
        ☕ BrewLite — Một ly cà phê, ngàn cảm hứng
      </div>

      <header className="brew-header">
        <button
          className="brew-brand"
          onClick={() => goTo("menu")}
        >
          <span className="brew-logo">B</span>

          <span>
            <strong>BrewLite</strong>
            <small>COFFEE & MORE</small>
          </span>
        </button>

        <nav className="brew-nav">
          <button onClick={() => goTo("menu")}>
            Thực đơn
          </button>

          <button onClick={() => goTo("cart")}>
            Giỏ hàng <b>{cartCount}</b>
          </button>

          <Link href="/orders/history">Đơn hàng của tôi</Link>
        </nav>
      </header>

      {notice && (
        <div className="brew-notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      {view === "menu" && !selected && (
        <>
          <section className="brew-hero">
            <div>
              <span className="brew-eyebrow">
                BREWLITE — COFFEE & MORE
              </span>

              <h1>
                Một chút cà phê,
                <br />
                <em>cho ngày thêm vui.</em>
              </h1>

              <p>
                Từ cà phê đậm đà đến trà thơm mát,
                BrewLite luôn có một thức uống dành cho bạn.
              </p>

              <a href="#brew-products" className="brew-primary">
                Khám phá thực đơn ↘
              </a>
            </div>

            <div className="brew-hero-art">
              <div className="brew-circle">
                <span>☕</span>
              </div>

              <div className="brew-floating">
                ✨ Freshly brewed
              </div>
            </div>
          </section>

          <section className="brew-section" id="brew-products">
            <div className="brew-section-top">
              <div>
                <span className="brew-eyebrow">
                  THỰC ĐƠN BREWLITE
                </span>

                <h2>Chọn món bạn yêu thích</h2>
                <p>Cà phê, trà và nhiều thức uống hấp dẫn.</p>
              </div>

              <input
                className="brew-search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="🔎 Tìm đồ uống..."
                aria-label="Tìm đồ uống"
              />
            </div>

            <div className="brew-categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {loadState === "loading" ? (
              <div className="brew-empty" role="status">
                <h3>Đang tải thực đơn...</h3>
              </div>
            ) : loadState === "error" ? (
              <div className="brew-empty" role="alert">
                <h3>Không tải được thực đơn</h3>
                <p>{loadError}</p>
                <button className="brew-primary" onClick={reloadMenu}>
                  Thử lại
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="brew-empty">
                <h3>Hiện chưa có đồ uống nào</h3>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="brew-empty">
                <h3>Không tìm thấy đồ uống</h3>

                <button
                  className="brew-primary"
                  onClick={() => {
                    setSearch("");
                    setCategory("Tất cả");
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="brew-grid">
                {visibleProducts.map((product) => (
                  <article className="brew-card" key={product.id}>
                    <button
                      className="brew-card-art"
                      onClick={() => openProduct(product)}
                      aria-label={`Xem ${product.name}`}
                    >
                      <span>{product.emoji}</span>

                      {product.popular && (
                        <small>Bán chạy</small>
                      )}
                    </button>

                    <div className="brew-card-body">
                      <span className="brew-category">
                        {product.category}
                      </span>

                      <h3>{product.name}</h3>
                      <p>{product.description}</p>

                      <div className="brew-card-bottom">
                        <strong>
                          Từ {money(product.price)}
                        </strong>

                        <button
                          onClick={() => openProduct(product)}
                          aria-label={`Chọn ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {view === "menu" && selected && (
        <section className="brew-section">
          <button
            className="brew-back"
            onClick={() => setSelected(null)}
          >
            ← Quay lại thực đơn
          </button>

          <div className="brew-detail">
            <div className="brew-detail-art">
              {selected.emoji}
            </div>

            <div className="brew-detail-info">
              <span className="brew-eyebrow">
                {selected.category}
              </span>

              <h1>{selected.name}</h1>
              <p>{selected.description}</p>
              <h2>{money(selected.price)}</h2>

              <h3>Chọn kích thước</h3>

              <div className="brew-options">
                {(["S", "M", "L"] as Size[]).map((option) => (
                  <button
                    key={option}
                    className={size === option ? "active" : ""}
                    onClick={() => setSize(option)}
                  >
                    Size {option}
                    <small>
                      {sizePrices[option] === 0
                        ? "Giá gốc"
                        : "+" + money(sizePrices[option])}
                    </small>
                  </button>
                ))}
              </div>

              <h3>Mức đường</h3>

              <div className="brew-options">
                {[0, 30, 50, 70, 100].map((value) => (
                  <button
                    key={value}
                    className={sugar === value ? "active" : ""}
                    onClick={() => setSugar(value)}
                  >
                    {value}%
                  </button>
                ))}
              </div>

              <h3>Mức đá</h3>

              <div className="brew-options">
                {[0, 30, 50, 70, 100].map((value) => (
                  <button
                    key={value}
                    className={ice === value ? "active" : ""}
                    onClick={() => setIce(value)}
                  >
                    {value}%
                  </button>
                ))}
              </div>

              <h3>Topping thêm</h3>

              <div className="brew-toppings">
                {toppings.map((topping) => (
                  <label key={topping.id}>
                    <span>
                      {topping.name}
                      <small>+{money(topping.price)}</small>
                    </span>

                    <input
                      type="checkbox"
                      checked={chosenToppings.some(
                        (item) => item.id === topping.id
                      )}
                      onChange={(event) => {
                        setChosenToppings((previous) =>
                          event.target.checked
                            ? [...previous, topping]
                            : previous.filter(
                                (item) => item.id !== topping.id
                              )
                        );
                      }}
                    />
                  </label>
                ))}
              </div>

              <div className="brew-quantity-row">
                <strong>Số lượng</strong>

                <div className="brew-quantity">
                  <button
                    onClick={() =>
                      setQuantity((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                  >
                    −
                  </button>

                  <span>{quantity}</span>

                  <button
                    onClick={() =>
                      setQuantity((previous) => previous + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="brew-primary brew-full"
                onClick={addToCart}
              >
                Thêm vào giỏ · {money(selectedPrice * quantity)}
              </button>
            </div>
          </div>
        </section>
      )}

      {view === "cart" && (
        <section className="brew-section">
          <button
            className="brew-back"
            onClick={() => goTo("menu")}
          >
            ← Tiếp tục chọn đồ uống
          </button>

          <h1 className="brew-page-title">
            Giỏ hàng ({cartCount})
          </h1>

          {cart.length === 0 ? (
            <div className="brew-empty">
              <div>🛒</div>
              <h3>Giỏ hàng đang trống</h3>

              <button
                className="brew-primary"
                onClick={() => goTo("menu")}
              >
                Xem thực đơn
              </button>
            </div>
          ) : (
            <div className="brew-cart-layout">
              <div className="brew-cart-list">
                {cart.map((item) => (
                  <article
                    className="brew-cart-item"
                    key={item.key}
                  >
                    <div className="brew-cart-emoji">
                      {item.product.emoji}
                    </div>

                    <div className="brew-cart-info">
                      <h3>{item.product.name}</h3>

                      <p>
                        Size {item.size} · Đường {item.sugar}%
                        · Đá {item.ice}%
                      </p>

                      <p>
                        {item.toppings.length > 0
                          ? item.toppings
                              .map((topping) => topping.name)
                              .join(", ")
                          : "Không thêm topping"}
                      </p>

                      <strong>
                        {money(getItemPrice(item))}
                      </strong>

                      <button
                        className="brew-remove"
                        onClick={() =>
                          setCart((previous) =>
                            previous.filter(
                              (entry) => entry.key !== item.key
                            )
                          )
                        }
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="brew-quantity">
                      <button
                        onClick={() =>
                          changeCartQuantity(item.key, -1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          changeCartQuantity(item.key, 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="brew-summary">
                <h2>Tóm tắt đơn hàng</h2>

                <div>
                  <span>Tạm tính</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <div className="brew-total">
                  <span>Tổng cộng</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <button
                  className="brew-primary brew-full"
                  onClick={() => goTo("checkout")}
                >
                  Tiến hành thanh toán →
                </button>
              </aside>
            </div>
          )}
        </section>
      )}

      {view === "checkout" && (
        <section className="brew-section">
          <button
            className="brew-back"
            onClick={() => goTo("cart")}
          >
            ← Quay lại giỏ hàng
          </button>

          <h1 className="brew-page-title">Thanh toán</h1>

          {cart.length === 0 ? (
            <div className="brew-empty">
              Giỏ hàng đang trống.
            </div>
          ) : (
            <form
              className="brew-checkout"
              onSubmit={submitOrder}
            >
              <div className="brew-form">
                <h2>Thông tin khách hàng</h2>

                <label>
                  Phương thức thanh toán
                  <select
                    value={customer.payment}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        payment: event.target.value as PaymentMethod,
                      })
                    }
                  >
                    <option value="WALLET">Ví điện tử (mô phỏng)</option>
                    <option value="CARD">Thẻ (mô phỏng)</option>
                  </select>
                </label>

                <label>
                  Mã khuyến mãi (nếu có)
                  <input
                    value={promo}
                    onChange={(event) => setPromo(event.target.value)}
                    placeholder="WELCOME10"
                    maxLength={32}
                  />
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={simulateFail}
                    onChange={(event) => setSimulateFail(event.target.checked)}
                  />{" "}
                  Giả lập thanh toán thất bại (chỉ để demo)
                </label>

                <p className="brew-demo-alert">
                  Thanh toán là mô phỏng: không có giao dịch thật và không trừ
                  tiền. Đơn được tạo trên backend; bạn cần đăng nhập để đặt hàng.
                  Giá cuối cùng (kể cả khuyến mãi) do máy chủ tính.
                </p>

                <button
                  type="submit"
                  className="brew-primary brew-full"
                  disabled={submitting}
                >
                  {submitting
                    ? "Đang xử lý..."
                    : `Đặt hàng và thanh toán · ${money(subtotal)}`}
                </button>
              </div>

              <aside className="brew-summary">
                <h2>Đơn hàng của bạn</h2>

                {cart.map((item) => (
                  <div key={item.key}>
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>

                    <strong>
                      {money(
                        getItemPrice(item) * item.quantity
                      )}
                    </strong>
                  </div>
                ))}

                <div className="brew-total">
                  <span>Tổng cộng</span>
                  <strong>{money(subtotal)}</strong>
                </div>
              </aside>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
