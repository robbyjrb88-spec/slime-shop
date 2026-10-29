const PRODUCTS = [
  { id: "pink",   name: "Unicorn Pink",    price: "15.00" },
  { id: "purple", name: "Galaxy Purple",   price: "15.00" },
  { id: "blue",   name: "Sky Blue",        price: "15.00" },
  { id: "green",  name: "Mint Green",      price: "15.00" },
  { id: "yellow", name: "Sunshine Yellow", price: "15.00" },
];

const grid = document.getElementById("product-grid");

for (const p of PRODUCTS) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <div class="slime-jar ${p.id}"><span class="shine"></span></div>
    <h2>${p.name}</h2>
    <p class="price">$${p.price}</p>
    <div id="paypal-${p.id}" class="paypal-btn"></div>
  `;
  grid.appendChild(card);
}

if (window.paypal) {
  for (const p of PRODUCTS) {
    paypal.Buttons({
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
