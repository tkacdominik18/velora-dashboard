export default async function handler(req, res) {
  const shop = "uhq06t-kz.myshopify.com";
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    const url = "https://" + shop + "/admin/api/2026-04/orders.json?status=any&limit=250";
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
      byDay[date].revenue += Math.round(parseFloat(order.total_price || 0));
    });
    res.status(200).json(byDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
