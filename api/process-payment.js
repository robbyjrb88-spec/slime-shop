const SQUARE_LOCATION_ID = "LMEWWCGNR4K0P";
const SQUARE_API_BASE = "https://connect.squareupsandbox.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { sourceId, amount, itemName } = req.body;

  if (!sourceId || !amount) {
    res.status(400).json({ error: "Missing sourceId or amount" });
    return;
  }

  try {
    const response = await fetch(`${SQUARE_API_BASE}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2026-01-01",
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount: Math.round(Number(amount) * 100),
          currency: "USD",
        },
        location_id: SQUARE_LOCATION_ID,
        note: itemName || "Slime order",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.errors?.[0]?.detail || "Payment failed" });
      return;
    }

    res.status(200).json({ success: true, paymentId: data.payment.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
