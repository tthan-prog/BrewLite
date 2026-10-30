
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import QRCode from "qrcode";
import "./menu.css";

type Category = "Tất cả" | "Cà phê" | "Trà" | "Trà sữa" | "Đá xay";
type Size = "S" | "M" | "L";
type View = "menu" | "cart" | "checkout";

type RecipeLine = { name: string; unit: string; quantity: number };

type Topping = {
  id: string;
  name: string;
  price: number;
  recipe: RecipeLine[];
};

type Product = {
  id: number;
  name: string;
  description: string;
  category: Exclude<Category, "Tất cả">;
  price: number;
  emoji: string;
  popular?: boolean;
  /** Số ly tối đa còn làm được theo nguyên liệu (hoặc tồn kho nếu chưa có công thức). */
  maxQuantity: number;
  available: boolean;
  recipe: RecipeLine[];
  /** Nguyên liệu mỗi ly theo size (size lớn dùng nhiều hơn). */
  recipeBySize: Record<string, RecipeLine[]>;
};

/** Giới hạn ly trên một dòng đơn — khớp MAX_ITEM_QUANTITY của API. */
const MAX_LINE_QTY = 50;

type Avail = { max: number; perCup: RecipeLine[] };
type CartCheck = { ok: boolean; lines: { max: number; ok: boolean }[] };
type Quote = {
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  promoError: string | null;
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
  maxQuantity?: number;
  available?: boolean;
  recipe?: RecipeLine[];
  recipeBySize?: Record<string, RecipeLine[]>;
};

type ApiTopping = { id: number; name: string; price: number; recipe?: RecipeLine[] };

type ApiOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
};

type PaymentMethod = "WALLET" | "CARD" | "BANK" | "MOMO" | "VNPAY";
const QR_METHODS: PaymentMethod[] = ["BANK", "MOMO", "VNPAY"];
const PROVIDER_LABEL: Record<string, string> = {
  BANK: "Ngân hàng (QR)",
  MOMO: "Ví MoMo (QR)",
  VNPAY: "VNPay (QR)",
};

type QrSession = {
  orderId: number;
  orderTotal: number;
  token: string;
  provider: string;
  mode: "SIMULATED" | "SANDBOX";
  qrContent: string;
  statusUrl: string;
  amount: number;
  expiresAt: string;
  dataUrl: string;
};

type IntentView = {
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  pointsEarned: number;
  pointsBalance: number | null;
};

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
    maxQuantity: p.maxQuantity ?? p.stock,
    available: p.available ?? p.stock > 0,
    recipe: p.recipe ?? [],
    recipeBySize: p.recipeBySize ?? {},
  };
}

/**
 * Khóa ngẫu nhiên cho Idempotency-Key. crypto.randomUUID chỉ có trên trang an toàn
 * (HTTPS hoặc localhost); mở bằng http://<IP LAN> trên điện thoại thì nó không tồn tại.
 */
function newKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Gộp nguyên liệu của ly (theo size) với nguyên liệu của các topping đã chọn. */
function mergeRecipe(base: RecipeLine[], toppings: Topping[]): RecipeLine[] {
  const merged = new Map<string, RecipeLine>();
  for (const line of [...base, ...toppings.flatMap((t) => t.recipe)]) {
    const current = merged.get(line.name);
    merged.set(line.name, current ? { ...current, quantity: current.quantity + line.quantity } : { ...line });
  }
  return [...merged.values()];
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
  // Số ly còn đặt thêm được và nguyên liệu mỗi ly với lựa chọn hiện tại (server tính theo
  // size + topping + mức đường + giỏ hàng).
  const [avail, setAvail] = useState<Avail | null>(null);
  // Kết quả kiểm tra cả giỏ hàng (mỗi dòng tối đa bao nhiêu ly) và báo giá có khuyến mãi.
  const [cartCheck, setCartCheck] = useState<CartCheck | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

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
  const [paymentFailure, setPaymentFailure] = useState<{ orderId: number; status: string; reason?: string } | null>(null);
  // Khóa idempotency gắn với nội dung giỏ: bấm đặt lại / thử thanh toán lại không tạo thêm đơn.
  const orderKeyRef = useRef<{ signature: string; key: string } | null>(null);

  const [qr, setQr] = useState<QrSession | null>(null);
  const [qrState, setQrState] = useState<"PENDING" | "FAILED" | "EXPIRED">("PENDING");
  const [secondsLeft, setSecondsLeft] = useState(0);

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
          apiToppings.map((t) => ({ id: String(t.id), name: t.name, price: t.price, recipe: t.recipe ?? [] }))
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

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    const toTopping = (t: Topping) => ({ toppingId: Number(t.id), quantity: 1 });
    const timer = window.setTimeout(() => {
      apiRequest<{ maxAdditional: number; perCup: RecipeLine[] }>("/products/availability", {
        method: "POST",
        body: JSON.stringify({
          cart: cart.map((item) => ({
            productId: item.product.id,
            size: item.size,
            sugar: item.sugar,
            ice: item.ice,
            quantity: item.quantity,
            toppings: item.toppings.map(toTopping),
          })),
          candidate: {
            productId: selected.id,
            size,
            sugar,
            ice,
            toppings: chosenToppings.map(toTopping),
          },
        }),
      })
        .then((r) => {
          if (!alive) return;
          setAvail({ max: r.maxAdditional, perCup: r.perCup });
        })
        .catch(() => {
          if (alive) setAvail(null);
        });
    }, 200);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [selected, size, sugar, ice, chosenToppings, cart]);

  // Giỏ hàng / thanh toán: hỏi server mỗi dòng tối đa bao nhiêu ly (nguyên liệu thật, đúng size,
  // topping, mức đường) và giới hạn ly mỗi dòng.
  useEffect(() => {
    if ((view !== "cart" && view !== "checkout") || cart.length === 0) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      apiRequest<CartCheck>("/products/cart-check", {
        method: "POST",
        body: JSON.stringify({
          cart: cart.map((item) => ({
            productId: item.product.id,
            size: item.size,
            sugar: item.sugar,
            ice: item.ice,
            quantity: item.quantity,
            toppings: item.toppings.map((t) => ({ toppingId: Number(t.id), quantity: 1 })),
          })),
        }),
      })
        .then((r) => {
          if (alive) setCartCheck(r);
        })
        .catch(() => {
          if (alive) setCartCheck(null);
        });
    }, 150);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cart, view]);

  // Thanh toán: báo giá (tạm tính, giảm giá, tổng) do máy chủ tính — cùng quy tắc khi tạo đơn.
  useEffect(() => {
    if (view !== "checkout" || cart.length === 0) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      apiRequest<Quote>("/products/quote", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            size: item.size,
            quantity: item.quantity,
            toppings: item.toppings.map((t) => ({ toppingId: Number(t.id), quantity: 1 })),
          })),
          promoCode: promo.trim() || undefined,
        }),
      })
        .then((r) => {
          if (alive) setQuote(r);
        })
        .catch(() => {
          if (alive) setQuote(null);
        });
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cart, view, promo]);

  // Làm mới tình trạng nguyên liệu mà không nhấp nháy giao diện.
  function refreshProducts() {
    apiRequest<ApiProduct[]>("/products")
      .then((list) => setProducts(list.map(toProduct)))
      .catch(() => undefined);
  }

  function finishQrPayment(session: QrSession, view: IntentView) {
    sessionStorage.setItem(
      "brewlite_last_order",
      JSON.stringify({
        id: session.orderId,
        status: "PAID",
        total: session.orderTotal,
        createdAt: new Date().toISOString(),
        pointsEarned: view.pointsEarned,
        pointsBalance: view.pointsBalance,
        method: session.provider,
      })
    );
    orderKeyRef.current = null;
    setCart([]);
    setQr(null);
    router.push("/orders/confirmation");
  }

  // Khi đang hiện mã QR: hỏi trạng thái phiên mỗi 2 giây; đếm ngược thời hạn.
  useEffect(() => {
    if (!qr || qrState !== "PENDING") return;
    let alive = true;
    const poll = window.setInterval(() => {
      apiRequest<IntentView>(`/payments/intents/${qr.token}`)
        .then((view) => {
          if (!alive) return;
          if (view.status === "PAID") {
            finishQrPayment(qr, view);
          } else if (view.status === "FAILED" || view.status === "EXPIRED") {
            setQrState(view.status);
          }
        })
        .catch(() => undefined);
    }, 2000);
    const tick = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((new Date(qr.expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => {
      alive = false;
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr, qrState]);

  async function openQr(orderId: number, orderTotal: number, provider: PaymentMethod, auth: Record<string, string>) {
    const intent = await apiRequest<Omit<QrSession, "dataUrl" | "orderId" | "orderTotal">>("/payments/intents", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ orderId, provider }),
    });
    const dataUrl = await QRCode.toDataURL(intent.qrContent, { margin: 1, width: 280, errorCorrectionLevel: "M" });
    setQrState("PENDING");
    setSecondsLeft(Math.max(0, Math.round((new Date(intent.expiresAt).getTime() - Date.now()) / 1000)));
    setQr({ ...intent, orderId, orderTotal, dataUrl });
  }

  async function renewQr() {
    const token = sessionStorage.getItem("brewlite_token");
    if (!qr || !token) return;
    setSubmitting(true);
    try {
      await openQr(qr.orderId, qr.orderTotal, qr.provider as PaymentMethod, { Authorization: `Bearer ${token}` });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không tạo được mã QR mới.");
      setQr(null);
    } finally {
      setSubmitting(false);
    }
  }

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

  /** Khóa dòng giỏ hàng cho lựa chọn đang xem (cùng món, size, đường, đá, topping thì gộp một dòng). */
  function lineKeyFor(product: Product) {
    const toppingIds = chosenToppings
      .map((topping) => topping.id)
      .sort()
      .join(",");
    return `${product.id}-${size}-${sugar}-${ice}-${toppingIds}`;
  }

  /** Số ly còn có thể thêm: nhỏ hơn của (nguyên liệu server tính) và (giới hạn ly/dòng − số ly dòng này đã có). */
  function maxAddableFor(product: Product) {
    const inLine = cart.find((item) => item.key === lineKeyFor(product))?.quantity ?? 0;
    const lineRoom = Math.max(0, MAX_LINE_QTY - inLine);
    if (avail !== null) return Math.min(avail.max, lineRoom);
    const inCart = cart
      .filter((item) => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    return Math.min(Math.max(0, product.maxQuantity - inCart), lineRoom);
  }

  const maxAddable = selected ? maxAddableFor(selected) : 0;
  // Số lượng hiển thị luôn nằm trong [1, số ly đặt được].
  const qty = selected ? Math.max(1, Math.min(quantity, maxAddable)) : quantity;

  function openProduct(product: Product) {
    setSelected(product);
    setView("menu");
    setSize("M");
    setSugar(50);
    setIce(50);
    setChosenToppings([]);
    setQuantity(1);
    setAvail(null);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart() {
    if (!selected) return;
    if (qty > maxAddableFor(selected)) {
      setNotice(
        `Chỉ có thể thêm tối đa ${maxAddableFor(selected)} ly "${selected.name}" với lựa chọn này (tối đa ${MAX_LINE_QTY} ly mỗi dòng, và theo nguyên liệu còn lại).`
      );
      return;
    }

    const key = lineKeyFor(selected);

    setCart((previous) => {
      const existing = previous.find((item) => item.key === key);

      if (existing) {
        return previous.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + qty }
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
          quantity: qty,
        },
      ];
    });

    setSelected(null);
    setNotice("Đã thêm đồ uống vào giỏ hàng!");
  }

  /** Số ly tối đa của dòng giỏ hàng: theo server (nguyên liệu thật) nếu có, luôn ≤ giới hạn ly/dòng. */
  function lineMax(index: number) {
    return Math.min(MAX_LINE_QTY, cartCheck?.lines[index]?.max ?? MAX_LINE_QTY);
  }

  function changeCartQuantity(key: string, change: number) {
    if (change > 0) {
      const index = cart.findIndex((item) => item.key === key);
      if (index >= 0 && cart[index].quantity + change > lineMax(index)) {
        setNotice(
          `Tối đa ${lineMax(index)} ly "${cart[index].product.name}" cho lựa chọn này (giới hạn ${MAX_LINE_QTY} ly mỗi dòng và theo nguyên liệu còn lại).`
        );
        return;
      }
    }
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

  /** Đưa các dòng vượt giới hạn về mức tối đa (xóa dòng nếu không còn làm được). */
  function fixCart() {
    if (!cartCheck) return;
    setCart((previous) =>
      previous
        .map((item, index) => {
          const max = cartCheck.lines[index]?.max ?? MAX_LINE_QTY;
          return { ...item, quantity: Math.min(item.quantity, max) };
        })
        .filter((item) => item.quantity > 0)
    );
    setCartCheck(null);
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
      sugar: item.sugar,
      ice: item.ice,
      toppings: item.toppings.map((t) => ({
        toppingId: Number(t.id),
        quantity: 1,
      })),
    }));
    const promoCode = promo.trim() || undefined;
    const signature = JSON.stringify({ items, promoCode });
    if (orderKeyRef.current?.signature !== signature) {
      orderKeyRef.current = { signature, key: newKey() };
    }

    setSubmitting(true);
    setNotice("");
    setPaymentFailure(null);
    try {
      const auth = { Authorization: `Bearer ${token}` };
      const order = await apiRequest<ApiOrder>("/orders", {
        method: "POST",
        headers: { ...auth, "Idempotency-Key": orderKeyRef.current.key },
        body: JSON.stringify({ items, promoCode }),
      });

      if (QR_METHODS.includes(customer.payment)) {
        // Thanh toán bằng mã QR: giữ đơn PENDING, hiện QR và chờ xác nhận.
        await openQr(order.id, order.total, customer.payment, auth);
        return;
      }

      const result = await apiRequest<{
        order: ApiOrder;
        payment: { status: string };
        failureReason?: string;
        pointsEarned?: number;
        pointsBalance?: number;
      }>("/payments", {
        method: "POST",
        headers: { ...auth, "Idempotency-Key": newKey() },
        body: JSON.stringify({
          orderId: order.id,
          method: customer.payment,
          simulate: simulateFail ? "FAIL" : "SUCCESS",
        }),
      });

      if (result.payment.status !== "SUCCESS") {
        // Thanh toán lỗi: giữ nguyên giỏ hàng để thử lại (cùng đơn, không trừ kho lần hai).
        setPaymentFailure({ orderId: result.order.id, status: result.order.status, reason: result.failureReason });
        return;
      }

      sessionStorage.setItem(
        "brewlite_last_order",
        JSON.stringify({
          id: result.order.id,
          status: result.order.status,
          total: result.order.total,
          createdAt: result.order.createdAt,
          pointsEarned: result.pointsEarned ?? 0,
          pointsBalance: result.pointsBalance ?? null,
          method: customer.payment,
        })
      );
      orderKeyRef.current = null;
      setCart([]);
      router.push("/orders/confirmation");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể đặt hàng lúc này."
      );
      refreshProducts(); // nguyên liệu có thể vừa hết: cập nhật số ly còn lại
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
                      {!product.available && (
                        <small>Hết nguyên liệu</small>
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

              {(selected.recipe.length > 0 || chosenToppings.length > 0) && (
                <div className="brew-recipe">
                  <strong>
                    Nguyên liệu mỗi ly (size {size}, đường {sugar}%, đá {ice}%
                    {chosenToppings.length > 0
                      ? ` + ${chosenToppings.map((t) => t.name).join(", ")}`
                      : ""}
                    )
                  </strong>
                  <ul>
                    {(avail?.perCup ??
                      mergeRecipe(selected.recipeBySize[size] ?? selected.recipe, chosenToppings)
                    ).map((r) => (
                      <li key={r.name}>
                        {r.name}: {r.quantity} {r.unit}
                      </li>
                    ))}
                  </ul>
                  <small>
                    {maxAddable > 0
                      ? `Có thể đặt thêm tối đa ${maxAddable} ly với lựa chọn này.`
                      : avail && avail.max > 0
                        ? `Dòng này đã đạt tối đa ${MAX_LINE_QTY} ly.`
                        : "Đã hết nguyên liệu cho lựa chọn này."}
                  </small>
                </div>
              )}

              <div className="brew-quantity-row">
                <strong>Số lượng</strong>

                <div className="brew-quantity">
                  <button
                    onClick={() => setQuantity(Math.max(1, qty - 1))}
                  >
                    −
                  </button>

                  <span>{qty}</span>

                  <button
                    disabled={qty >= maxAddable}
                    onClick={() => setQuantity(Math.min(maxAddable, qty + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="brew-primary brew-full"
                onClick={addToCart}
                disabled={maxAddable < 1}
              >
                {maxAddable < 1
                  ? avail && avail.max > 0
                    ? "Đã đạt tối đa mỗi dòng"
                    : "Hết nguyên liệu"
                  : `Thêm vào giỏ · ${money(selectedPrice * qty)}`}
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
                {cart.map((item, index) => (
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
                        disabled={item.quantity >= lineMax(index)}
                        title={
                          item.quantity >= lineMax(index)
                            ? `Tối đa ${lineMax(index)} ly cho lựa chọn này`
                            : undefined
                        }
                        onClick={() =>
                          changeCartQuantity(item.key, 1)
                        }
                      >
                        +
                      </button>
                      {cartCheck && !cartCheck.lines[index]?.ok && (
                        <small className="brew-line-warn">
                          Tối đa {lineMax(index)} ly
                        </small>
                      )}
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

                {cartCheck && !cartCheck.ok && (
                  <div className="brew-payment-failed" role="alert">
                    <strong>Một số đồ uống vượt số lượng làm được</strong>
                    <p>
                      Nguyên liệu còn lại hoặc giới hạn {MAX_LINE_QTY} ly mỗi dòng không đủ cho số
                      lượng đã chọn (xem dòng cảnh báo bên cạnh nút +).
                    </p>
                    <button type="button" className="brew-primary" onClick={fixCart}>
                      Giảm về mức tối đa
                    </button>
                  </div>
                )}

                <button
                  className="brew-primary brew-full"
                  disabled={cartCheck !== null && !cartCheck.ok}
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
                    <option value="MOMO">Ví MoMo - quét mã QR</option>
                    <option value="VNPAY">VNPay - quét mã QR</option>
                    <option value="BANK">Chuyển khoản ngân hàng - quét mã QR</option>
                  </select>
                </label>

                <label>
                  Mã khuyến mãi (nếu có)
                  <input
                    value={promo}
                    onChange={(event) => setPromo(event.target.value)}
                    placeholder="Nhập mã (ví dụ: WELCOME10)"
                    maxLength={32}
                  />
                  {quote?.promoError && promo.trim() && (
                    <small className="brew-promo-error" role="alert">{quote.promoError}</small>
                  )}
                  {quote?.promoCode && (
                    <small className="brew-promo-ok">
                      Đã áp dụng mã {quote.promoCode}: giảm {money(quote.discount)}.
                    </small>
                  )}
                </label>

                {!QR_METHODS.includes(customer.payment) && (
                  <label>
                    <input
                      type="checkbox"
                      checked={simulateFail}
                      onChange={(event) => setSimulateFail(event.target.checked)}
                    />{" "}
                    Giả lập thanh toán thất bại
                  </label>
                )}

                {paymentFailure && (
                  <div className="brew-payment-failed" role="alert">
                    <strong>Thanh toán thất bại</strong>
                    <p>
                      Đơn #{paymentFailure.orderId} chưa được thanh toán.
                      {paymentFailure.reason ? ` ${paymentFailure.reason}.` : ""} Giỏ
                      hàng vẫn được giữ nguyên, bạn có thể thử lại.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="brew-primary brew-full"
                  disabled={submitting || (cartCheck !== null && !cartCheck.ok)}
                >
                  {submitting
                    ? "Đang xử lý..."
                    : paymentFailure
                      ? `Thử thanh toán lại · ${money(quote?.total ?? subtotal)}`
                      : `Đặt hàng và thanh toán · ${money(quote?.total ?? subtotal)}`}
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

                {quote && quote.discount > 0 && (
                  <>
                    <div>
                      <span>Tạm tính</span>
                      <strong>{money(quote.subtotal)}</strong>
                    </div>
                    <div>
                      <span>Giảm giá ({quote.promoCode})</span>
                      <strong>-{money(quote.discount)}</strong>
                    </div>
                  </>
                )}

                <div className="brew-total">
                  <span>Tổng cộng</span>
                  <strong>{money(quote?.total ?? subtotal)}</strong>
                </div>

                {cartCheck && !cartCheck.ok && (
                  <p className="brew-promo-error" role="alert">
                    Giỏ hàng có đồ uống vượt số lượng làm được. Quay lại giỏ hàng để điều chỉnh.
                  </p>
                )}
              </aside>
            </form>
          )}
        </section>
      )}

      {qr && (
        <div className="brew-qr-overlay" role="dialog" aria-modal="true" aria-label="Thanh toán bằng mã QR">
          <div className="brew-qr-card">
            <h2 className="brew-qr-title">{PROVIDER_LABEL[qr.provider] ?? qr.provider}</h2>
            <p className="brew-qr-sub">
              Đơn #{qr.orderId} · <strong>{money(qr.amount)}</strong>
            </p>
            {qrState === "PENDING" ? (
              <>
                <div className="brew-qr-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr.dataUrl} alt="Mã QR thanh toán" width={240} height={240} />
                </div>
                <p className="brew-qr-timer">
                  Còn {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} · đang chờ thanh toán...
                </p>
                {qr.mode === "SIMULATED" ? (
                  <>
                    <p className="brew-qr-hint">
                      Quét mã bằng camera điện thoại (cùng Wi-Fi) để mở trang thanh toán thử. Đang dùng
                      chính điện thoại này thì bấm nút bên dưới.
                    </p>
                    <a className="brew-qr-link" href={qr.statusUrl} target="_blank" rel="noreferrer">
                      Mở trang thanh toán trên máy này
                    </a>
                  </>
                ) : (
                  <p className="brew-qr-hint">Chế độ sandbox của cổng thanh toán: làm theo hướng dẫn trên điện thoại.</p>
                )}
              </>
            ) : (
              <div className="brew-payment-failed" role="alert">
                <strong>{qrState === "EXPIRED" ? "Mã QR đã hết hạn" : "Thanh toán không thành công"}</strong>
                <p>Đơn #{qr.orderId} vẫn chưa được thanh toán. Bạn có thể tạo mã mới.</p>
                <button type="button" className="brew-primary" onClick={renewQr} disabled={submitting}>
                  Tạo mã QR mới
                </button>
              </div>
            )}
            <button
              type="button"
              className="brew-qr-close"
              onClick={() => {
                setQr(null);
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
