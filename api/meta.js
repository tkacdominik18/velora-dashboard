export default async function handler(req, res) {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = "1405336980918594";

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

    const timeRange = JSON.stringify({ since: from, until: to });
    const url = "https://graph.facebook.com/v19.0/act_" + adAccountId + "/insights?fields=spend,date_start&time_increment=1&time_range=" + encodeURIComponent(timeRange) + "&access_token=" + token;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const byDay = {};
    const records = data.data || [];
    records.forEach(record => {
      const date = record.date_start;
      byDay[date] = {
        spend: Math.round(parseFloat(record.spend || 0) * 22.5)
      };
    });

    res.status(200).json(byDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
