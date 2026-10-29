const PRODUCTS = [
  { id: "pink",   name: "Unicorn Pink",    price: "15.00" },
  { id: "purple", name: "Galaxy Purple",   price: "15.00" },
  { id: "blue",   name: "Sky Blue",        price: "15.00" },
  { id: "green",  name: "Mint Green",      price: "15.00" },
  { id: "yellow", name: "Sunshine Yellow", price: "15.00" },
];

const SQUARE_APP_ID = "sandbox-sq0idb-UBEwG1bug8S2dU35VU4hLg";
const SQUARE_LOCATION_ID = "LMEWWCGNR4K0P";
const VENMO_USERNAME = "Maria-Castro-937";

const grid = document.getElementById("product-grid");

for (const p of PRODUCTS) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <div class="slime-jar ${p.id}"><span class="shine"></span></div>
    <h2>${p.name}</h2>
    <p class="price">$${p.price}</p>
    <div id="paypal-${p.id}" class="paypal-btn"></div>
    <a class="venmo-btn" target="_blank" rel="noopener" href="https://venmo.com/${VENMO_USERNAME}?txn=pay&amount=${p.price}&note=${encodeURIComponent(p.name + " Slime")}">Pay with Venmo</a>
    <button type="button" class="cashapp-select-btn" data-id="${p.id}">Pay with Cash App</button>
  `;
  grid.appendChild(card);
}

// ---- PayPal ----
if (window.paypal) {
  for (const p of PRODUCTS) {
    paypal.Buttons({
      fundingSource: paypal.FUNDING.PAYPAL,
      style: { shape: "pill", color: "gold", label: "pay", height: 40 },
      createOrder: (data, actions) => actions.order.create({
        purchase_units: [{
          description: p.name + " Slime",
          amount: { value: p.price, currency_code: "USD" },
        }],
      }),
      onApprove: (data, actions) => actions.order.capture().then((details) => {
        alert("Thanks " + details.payer.name.given_name + "! Your " + p.name + " slime order is in. 🦄");
      }),
    }).render("#paypal-" + p.id);
  }
}

// ---- Cash App Pay (via Square) ----
let squarePayments = null;
let cashAppPayInstance = null;

async function initSquarePayments() {
  if (!window.Square) return null;
  if (!squarePayments) {
    squarePayments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
  }
  return squarePayments;
}

async function selectCashAppProduct(p) {
  const section = document.getElementById("cashapp-checkout");
  const selectedLabel = document.getElementById("cashapp-selected");
  const status = document.getElementById("cashapp-status");
  const mount = document.getElementById("cash-app-pay-btn");

  status.textContent = "";
  selectedLabel.textContent = `${p.name} Slime — $${p.price}`;
  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth", block: "center" });

  status.textContent = "Loading Cash App Pay...";

  let payments;
  try {
    payments = await initSquarePayments();
  } catch (err) {
    status.textContent = "Cash App Pay failed to load: " + err.message;
    return;
  }
  if (!payments) {
    status.textContent = "Cash App Pay isn't available right now (Square SDK didn't load — try refreshing the page).";
    return;
  }

  try {
    if (cashAppPayInstance) {
      await cashAppPayInstance.destroy();
      mount.innerHTML = "";
    }

    const paymentRequest = payments.paymentRequest({
      countryCode: "US",
      currencyCode: "USD",
      locationId: SQUARE_LOCATION_ID,
      total: { amount: p.price, label: p.name + " Slime" },
    });

    cashAppPayInstance = await payments.cashAppPay(paymentRequest, {
      redirectURL: window.location.href,
      referenceId: p.id,
    });

    await cashAppPayInstance.attach("#cash-app-pay-btn");
    status.textContent = "";
  } catch (err) {
    status.textContent = "Couldn't load Cash App Pay: " + err.message;
    return;
  }

  cashAppPayInstance.addEventListener("ontokenization", async (event) => {
    const { tokenResult } = event.detail;
    if (tokenResult.status === "OK") {
      status.textContent = "Processing payment...";
      try {
        const res = await fetch("/api/process-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: tokenResult.token,
            amount: p.price,
            itemName: p.name + " Slime",
          }),
        });
        const data = await res.json();
        if (data.success) {
          status.textContent = "Thanks! Your " + p.name + " slime order is in. 🦄";
        } else {
          status.textContent = "Payment failed: " + (data.error || "unknown error");
        }
      } catch (err) {
        status.textContent = "Payment failed: " + err.message;
      }
    } else {
      status.textContent = "Payment was not completed.";
    }
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".cashapp-select-btn");
  if (!btn) return;
  const p = PRODUCTS.find((prod) => prod.id === btn.dataset.id);
  if (p) selectCashAppProduct(p);
});
