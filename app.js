// =================== KONFIGURACE ===================
const GAS_URL = "https://script.google.com/macros/s/AKfycbyB7Uf9V9knZRrB8m4jig1zgCL87y2GxBJa_xX8RMpLvufrWmYb1b49I8duUzErLJ37/exec"; // <-- SEM VLOŽ URL Z APPS SCRIPTU

// Zaměstnanci a jejich PINy
const EMPLOYEES = {
  "2001": "Centrální tablet",
  "2002": "Filip Dvořáček",
  "2003": "Pavel Krchňavý",
  "2004": "Tereza Sovová",
  "2005": "Veronika Urbanová",
  "2006": "Jan Balek",
  "2007": "Marie Pölzerová",
  "2008": "Lea Vlčková",
  "2009": "Jitka Urbánková",
  "2010": "Eliška Pölzerová",
  "2011": "Markéta Devetterová",
  "2012": "Ester Hlaváčková",
  "2013": "Jan Pelán"
};

// Produkty rozdělené podle dodavatelů
const PRODUCTS = {
  "Plné vstupné": [
    { name: "Plný celokonferenční vstup", price: 40 },
    { name: "Plné ČTVRTEK", price: 20 },
    { name: "Plné PÁTEK", price: 90 },
    { name: "Plné SOBOTA", price: 430 },
    { name: "Plné NEDĚLE", price: 270 },
  ],
  "Snížené vstupné": [
    { name: "Snížený celokonferenční vstup", price: 40 },
    { name: "Snížené ČTVRTEK", price: 20 },
    { name: "Snížené PÁTEK", price: 90 },
    { name: "Snížené SOBOTA", price: 430 },
    { name: "Snížené NEDĚLE", price: 270 },
    ],
    "ZDARMA": [
    { name: "DÍTĚ", price: 50 },
    { name: "KNĚZ", price: 250 },
    { name: "JEPTIŠKA", price: 250 },
    { name: "SEXY JEPTIŠKA", price: 300 },
    { name: "PŘÍMLUVCE", price: 680 },
  ],
  "Parkování": [
    { name: "Parkování celokonferenční", price: 85 },
    { name: "Parkování ČTVRTEK", price: 40 },
    { name: "Parkování PÁTEK", price: 20 },
    { name: "Parkování SOBOTA", price: 180 },
    { name: "Parkování NEDĚLE", price: 350 }
  ],
};

// =================== STAV APLIKACE ===================
let enteredPin = "";
let currentEmployee = null;
let cart = []; // { supplier, name, price, qty }
let activeSupplier = Object.keys(PRODUCTS)[0];

// =================== DOM ELEMENTY ===================
const loginScreen = document.getElementById("login-screen");
const posScreen = document.getElementById("pos-screen");
const pinDots = document.querySelectorAll(".pin-dot");
const pinError = document.getElementById("pin-error");
const employeeNameEl = document.getElementById("employee-name");
const supplierTabsEl = document.getElementById("supplier-tabs");
const productGridEl = document.getElementById("product-grid");
const cartItemsEl = document.getElementById("cart-items");
const cartEmptyEl = document.getElementById("cart-empty");
const cartTotalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

// Aktivace okamžité odezvy (:active stavu) na mobilech
document.addEventListener("touchstart", function() {}, { passive: true });

// =================== HAPTICKÁ ODEZVA ===================
document.addEventListener('click', (e) => {
  // Zkontrolujeme, jestli uživatel klikl na nějaký interaktivní prvek
  const isClickable = e.target.closest('.pin-btn, .supplier-tab, .product-card, button');

  // Pokud ano a zařízení to podporuje (Android), lehce zavrní
  if (isClickable && navigator.vibrate) {
    navigator.vibrate(40); 
  }
});
// =================== PIN LOGIN ===================
document.querySelectorAll(".pin-btn[data-num]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (enteredPin.length >= 4) return;
    enteredPin += btn.dataset.num;
    updatePinDots();
    if (enteredPin.length === 4) checkPin();
  });
});

document.getElementById("pin-back").addEventListener("click", () => {
  enteredPin = enteredPin.slice(0, -1);
  updatePinDots();
});

document.getElementById("pin-clear").addEventListener("click", () => {
  enteredPin = "";
  updatePinDots();
});

function updatePinDots() {
  pinDots.forEach((dot, i) => {
    dot.classList.toggle("filled", i < enteredPin.length);
  });
  pinError.classList.add("hidden");
}

function checkPin() {
  const name = EMPLOYEES[enteredPin];
  if (name) {
    currentEmployee = { pin: enteredPin, name };
    employeeNameEl.textContent = name;
    loginScreen.classList.add("hidden");
    posScreen.classList.remove("hidden");
    renderSupplierTabs();
    renderProducts();
    renderCart();
  } else {
    pinError.classList.remove("hidden");
    setTimeout(() => {
      enteredPin = "";
      updatePinDots();
    }, 600);
  }
}

document.getElementById("logout-btn").addEventListener("click", () => {
  if (cart.length > 0 && !confirm("V košíku jsou nezaúčtované položky. Opravdu se chceš odhlásit?")) return;
  currentEmployee = null;
  cart = [];
  enteredPin = "";
  updatePinDots();
  posScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

// =================== ZÁLOŽKY DODAVATELŮ ===================
function renderSupplierTabs() {
  supplierTabsEl.innerHTML = "";
  Object.keys(PRODUCTS).forEach(supplier => {
    const tab = document.createElement("div");
    tab.className = "supplier-tab" + (supplier === activeSupplier ? " active" : "");
    tab.textContent = supplier;
    tab.addEventListener("click", () => {
      activeSupplier = supplier;
      renderSupplierTabs();
      renderProducts();
    });
    supplierTabsEl.appendChild(tab);
  });
}

// =================== PRODUKTY ===================
function renderProducts() {
  productGridEl.innerHTML = "";
  PRODUCTS[activeSupplier].forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="p-name">${product.name}</div>
      <div class="p-price">${product.price} Kč</div>
    `;
    card.addEventListener("click", () => addToCart(activeSupplier, product));
    productGridEl.appendChild(card);
  });
}

// =================== KOŠÍK ===================
function addToCart(supplier, product) {
  const existing = cart.find(i => i.supplier === supplier && i.name === product.name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ supplier, name: product.name, price: product.price, qty: 1 });
  }
  renderCart();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  if (cart.length === 0) {
    cartItemsEl.appendChild(cartEmptyEl);
    cartEmptyEl.classList.remove("hidden");
  } else {
    cartEmptyEl.classList.add("hidden");
    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-item flex justify-between items-center";
      row.innerHTML = `
        <div class="flex-1 pr-2">
          <div class="text-sm font-semibold text-slate-700">${item.name}</div>
          <div class="text-xs text-slate-400">${item.supplier} · ${item.price} Kč/ks</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="qty-btn" data-action="minus" data-index="${index}">−</button>
          <span class="w-6 text-center font-semibold">${item.qty}</span>
          <button class="qty-btn" data-action="plus" data-index="${index}">+</button>
          <button class="text-red-400 text-sm ml-1" data-action="remove" data-index="${index}">✕</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });
  }

  cartItemsEl.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      const action = btn.dataset.action;
      if (action === "plus") changeQty(idx, 1);
      if (action === "minus") changeQty(idx, -1);
      if (action === "remove") removeItem(idx);
    });
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  cartTotalEl.textContent = total + " Kč";
  checkoutBtn.disabled = cart.length === 0;
}

// =================== ZAÚČTOVÁNÍ ===================
const overlay = document.getElementById("overlay");
const overlayLoading = document.getElementById("overlay-loading");
const overlaySuccess = document.getElementById("overlay-success");
const overlayError = document.getElementById("overlay-error");

document.getElementById("overlay-close").addEventListener("click", () => {
  overlay.classList.add("hidden");
});

checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) return;

  overlay.classList.remove("hidden");
  overlayLoading.classList.remove("hidden");
  overlaySuccess.classList.add("hidden");
  overlayError.classList.add("hidden");

  const timestamp = new Date().toISOString();

  // Každá položka košíku = jeden řádek v tabulce
  const salesRows = cart.map(item => ({
    timestamp,
    employee: currentEmployee.name,
    supplier: item.supplier,
    product: item.name,
    quantity: item.qty,
    unitPrice: item.price,
    total: item.qty * item.price
  }));

  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", // Google Apps Script Web App vyžaduje no-cors z prohlížeče
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ sales: salesRows })
    });

    // Protože "no-cors" neumožňuje číst odpověď, po odeslání předpokládáme úspěch
    overlayLoading.classList.add("hidden");
    overlaySuccess.classList.remove("hidden");
    cart = [];
    renderCart();

    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 1500);

  } catch (err) {
    console.error(err);
    overlayLoading.classList.add("hidden");
    overlayError.classList.remove("hidden");
  }
});
