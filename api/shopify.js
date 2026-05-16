export default async function handler(req, res) {
  const shop = "uhq06t-kz.myshopify.com";
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    // Podporuje ?from=YYYY-MM-DD&to=YYYY-MM-DD nebo pouzije aktualni mesic
    let from, to;
    if (req.query.from && req.query.to) {
      from = req.query.from;
      to = req.query.to;
    } else {
      const now = new Date();
      from = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-01";
      to = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()).padStart(2,"0");
    }

    const url = "https://" + shop + "/admin/api/2026-04/orders.json?status=any&limit=250"
      + "&created_at_min=" + from + "T00:00:00Z"
      + "&created_at_max=" + to + "T23:59:59Z";

    const response = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token }
    });

    const data = await response.json();
    if (data.errors) return res.status(401).json({ error: String(data.errors) });

    const orders = data.orders || [];
    const byDay = {};

    orders.forEach(order => {
      const date = order.created_at.split("T")[0];
      if (!byDay[date]) byDay[date] = { sales: 0, revenue: 0 };
      byDay[date].sales += 1;
      byDay[date].revenue += Math.round(parseFloat(order.total_price || 0) * 3.3);
    });

    res.status(200).json(byDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
