
"use client";

import { useEffect, useMemo, useState } from "react";
import "./menu.css";

type Category = "Tất cả" | "Cà phê" | "Trà" | "Trà sữa" | "Đá xay";
type Size = "S" | "M" | "L";
type View = "menu" | "cart" | "checkout" | "orders";

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

type SavedOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  pickup: string;
  payment: string;
  note: string;
  items: CartItem[];
  total: number;
  status: string;
};

const STORAGE_KEY = "brewlite-orders-v1";

const products: Product[] = [
  {
    id: 1,
    name: "Cà phê sữa đá",
    description: "Cà phê Việt đậm đà hòa cùng sữa đặc béo ngọt.",
    category: "Cà phê",
    price: 29000,
    emoji: "☕",
    popular: true,
  },
  {
    id: 2,
    name: "Bạc xỉu",
    description: "Vị sữa thơm béo cùng chút cà phê dịu nhẹ.",
    category: "Cà phê",
    price: 32000,
    emoji: "🥛",
    popular: true,
  },
  {
    id: 3,
    name: "Americano",
    description: "Espresso pha cùng nước, thanh nhẹ và tỉnh táo.",
    category: "Cà phê",
    price: 35000,
    emoji: "☕",
  },
  {
    id: 4,
    name: "Caramel Latte",
    description: "Espresso, sữa tươi và caramel ngọt thơm.",
    category: "Cà phê",
    price: 45000,
    emoji: "🍮",
    popular: true,
  },
  {
    id: 5,
    name: "Trà đào cam sả",
    description: "Trà đào thanh mát kết hợp cam và hương sả.",
    category: "Trà",
    price: 39000,
    emoji: "🍑",
    popular: true,
  },
  {
    id: 6,
    name: "Trà vải",
    description: "Hương trà nhẹ nhàng cùng vải ngọt thanh.",
    category: "Trà",
    price: 39000,
    emoji: "🍹",
  },
  {
    id: 7,
    name: "Trà chanh mật ong",
    description: "Trà chanh tươi mát, hòa quyện mật ong.",
    category: "Trà",
    price: 35000,
    emoji: "🍋",
  },
  {
    id: 8,
    name: "Trà sữa trân châu",
    description: "Trà sữa thơm béo cùng trân châu dai mềm.",
    category: "Trà sữa",
    price: 39000,
    emoji: "🧋",
    popular: true,
  },
  {
    id: 9,
    name: "Trà sữa matcha",
    description: "Matcha thơm dịu kết hợp sữa tươi.",
    category: "Trà sữa",
    price: 45000,
    emoji: "🍵",
  },
  {
    id: 10,
    name: "Trà sữa khoai môn",
    description: "Hương khoai môn ngọt nhẹ và sữa béo.",
    category: "Trà sữa",
    price: 42000,
    emoji: "🥤",
  },
  {
    id: 11,
    name: "Matcha đá xay",
    description: "Matcha xay cùng đá và lớp kem mềm mịn.",
    category: "Đá xay",
    price: 49000,
    emoji: "🍵",
    popular: true,
  },
  {
    id: 12,
    name: "Chocolate đá xay",
    description: "Chocolate đậm vị, mát lạnh và thơm béo.",
    category: "Đá xay",
    price: 49000,
    emoji: "🍫",
  },
];

const categories: Category[] = [
  "Tất cả",
  "Cà phê",
  "Trà",
  "Trà sữa",
  "Đá xay",
];

const toppings: Topping[] = [
  { id: "pearl", name: "Trân châu đen", price: 7000 },
  { id: "jelly", name: "Thạch cà phê", price: 6000 },
  { id: "pudding", name: "Pudding trứng", price: 8000 },
  { id: "cream", name: "Kem cheese", price: 10000 },
];

const sizePrices: Record<Size, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

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
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [notice, setNotice] = useState("");
  const [successOrder, setSuccessOrder] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    note: "",
    pickup: "Tại quán",
    payment: "QR",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setOrders(parsed as SavedOrder[]);
        }
      }
    } catch (error) {
      console.error("Lỗi đọc lịch sử đơn hàng:", error);
    } finally {
      setOrdersLoaded(true);
    }
  }, []);

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
  }, [category, search]);

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

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cart.length || !ordersLoaded) return;

    const order: SavedOrder = {
      id: "BL" + Date.now(),
      createdAt: new Date().toISOString(),
      customerName: customer.name.trim(),
      phone: customer.phone.trim(),
      pickup: customer.pickup,
      payment: customer.payment,
      note: customer.note,
      items: cart.map((item) => ({
        ...item,
        toppings: [...item.toppings],
      })),
      total: subtotal,
      status: "Đã đặt (demo)",
    };

    const updatedOrders = [order, ...orders];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedOrders)
      );
    } catch (error) {
      console.error("Lỗi lưu đơn hàng:", error);
      setNotice("Không thể lưu đơn hàng. Vui lòng thử lại.");
      return;
    }

    setOrders(updatedOrders);
    setCart([]);
    setSuccessOrder(order.id);
    setNotice("");
    setView("orders");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

          <button onClick={() => goTo("orders")}>
            Đơn hàng của tôi
          </button>
        </nav>
      </header>

      {notice && (
        <div className="brew-notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      {successOrder && (
        <div className="brew-success" role="status">
          <strong>✓ Đặt hàng demo thành công!</strong>
          <p>Mã đơn hàng: {successOrder}</p>
          <p>
            Đơn đã được lưu vào lịch sử trên trình duyệt.
            Chưa có giao dịch thanh toán thật.
          </p>
          <button onClick={() => setSuccessOrder("")}>
            Đóng thông báo
          </button>
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

            {visibleProducts.length === 0 ? (
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
                  Họ và tên
                  <input
                    required
                    minLength={2}
                    value={customer.name}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        name: event.target.value,
                      })
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </label>

                <label>
                  Số điện thoại
                  <input
                    required
                    pattern="[0-9]{9,11}"
                    value={customer.phone}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        phone: event.target.value,
                      })
                    }
                    placeholder="0901234567"
                  />
                </label>

                <label>
                  Hình thức nhận đồ uống
                  <select
                    value={customer.pickup}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        pickup: event.target.value,
                      })
                    }
                  >
                    <option>Tại quán</option>
                    <option>Mang đi</option>
                  </select>
                </label>

                <label>
                  Phương thức thanh toán
                  <select
                    value={customer.payment}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        payment: event.target.value,
                      })
                    }
                  >
                    <option value="QR">
                      Chuyển khoản QR (demo)
                    </option>
                    <option value="Ví điện tử">
                      Ví điện tử (demo)
                    </option>
                  </select>
                </label>

                <label>
                  Ghi chú
                  <textarea
                    rows={3}
                    value={customer.note}
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        note: event.target.value,
                      })
                    }
                    placeholder="Ghi chú cho quán..."
                  />
                </label>

                <p className="brew-demo-alert">
                  Đây là thanh toán mô phỏng.
                  Chưa có mã QR thật, chưa trừ tiền
                  và chưa gửi đơn hàng đến backend.
                </p>

                <button
                  type="submit"
                  className="brew-primary brew-full"
                  disabled={!ordersLoaded}
                >
                  {ordersLoaded
                    ? `Xác nhận đơn demo · ${money(subtotal)}`
                    : "Đang tải dữ liệu..."}
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

      {view === "orders" && (
        <section className="brew-section">
          <button
            className="brew-back"
            onClick={() => goTo("menu")}
          >
            ← Quay lại thực đơn
          </button>

          <h1 className="brew-page-title">
            Đơn hàng của tôi
          </h1>

          <p className="brew-orders-intro">
            Lịch sử đơn hàng demo đã lưu trên trình duyệt này.
          </p>

          {!ordersLoaded ? (
            <div className="brew-empty">
              Đang tải lịch sử đơn hàng...
            </div>
          ) : orders.length === 0 ? (
            <div className="brew-empty">
              <div>🧾</div>
              <h3>Bạn chưa có đơn hàng nào</h3>
              <p>Hãy chọn một thức uống yêu thích nhé!</p>

              <button
                className="brew-primary"
                onClick={() => goTo("menu")}
              >
                Khám phá thực đơn
              </button>
            </div>
          ) : (
            <div className="brew-orders-list">
              {orders.map((order) => (
                <article
                  className="brew-order-card"
                  key={order.id}
                >
                  <div className="brew-order-header">
                    <div>
                      <h2>Đơn hàng #{order.id}</h2>

                      <p>
                        {new Date(
                          order.createdAt
                        ).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <span className="brew-order-status">
                      {order.status}
                    </span>
                  </div>

                  <div className="brew-order-customer">
                    <p>
                      <strong>Khách hàng:</strong>{" "}
                      {order.customerName}
                    </p>

                    <p>
                      <strong>Số điện thoại:</strong>{" "}
                      {order.phone}
                    </p>

                    <p>
                      <strong>Nhận đồ uống:</strong>{" "}
                      {order.pickup}
                    </p>

                    <p>
                      <strong>Thanh toán:</strong>{" "}
                      {order.payment} (demo)
                    </p>

                    {order.note && (
                      <p>
                        <strong>Ghi chú:</strong>{" "}
                        {order.note}
                      </p>
                    )}
                  </div>

                  <h3 className="brew-order-subtitle">
                    Chi tiết đồ uống
                  </h3>

                  <div className="brew-order-items">
                    {order.items.map((item) => (
                      <div
                        className="brew-order-item"
                        key={item.key}
                      >
                        <div>
                          <strong>
                            {item.product.emoji}{" "}
                            {item.product.name}
                          </strong>

                          <p>
                            Size {item.size} · Đường{" "}
                            {item.sugar}% · Đá {item.ice}%
                          </p>

                          <p>
                            {item.toppings.length
                              ? item.toppings
                                  .map(
                                    (topping) => topping.name
                                  )
                                  .join(", ")
                              : "Không thêm topping"}
                          </p>

                          <p>
                            Số lượng: {item.quantity}
                          </p>
                        </div>

                        <strong>
                          {money(
                            getItemPrice(item) *
                              item.quantity
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div className="brew-order-total">
                    <span>Tổng thanh toán (demo)</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="brew-footer">
        <strong>BrewLite ☕</strong>
        <span>Cà phê ngon, ngày thêm vui.</span>
        <small>
          © 2026 BrewLite · Frontend demo
        </small>
      </footer>
    </main>
  );
}
