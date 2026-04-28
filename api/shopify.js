export default async function handler(req, res) {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const { from, to } = req.query;

  try {
    const url = `https://${shop}/admin/api/2026-04/orders.json?status=any&created_at_min=${from}&created_at_max=${to}&limit=250`;
    
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const orders = data.orders || [];

    const byDay = {};
    orders.forEach(order => {
      const date = order.created_at.split("T")[0];
      if (!byDay[date]) byDay[date] = { sales: 0, revenue: 0 };
      byDay[date].sales += 1;
      byDay[date].revenue += parseFloat(order.total_price || 0);
    });

    res.status(200).json(byDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
