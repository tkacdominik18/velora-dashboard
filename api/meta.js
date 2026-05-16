export default async function handler(req, res) {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = "1405336980918594";

  try {
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
    const byDay = {};

    // Zacni s prvni stranou
    let nextUrl = "https://graph.facebook.com/v19.0/act_" + adAccountId + "/insights"
      + "?fields=spend,date_start"
      + "&time_increment=1"
      + "&limit=100"
      + "&time_range=" + encodeURIComponent(timeRange)
      + "&access_token=" + token;

    // Stankuj dokud neni vse nacteno
    while (nextUrl) {
      const response = await fetch(nextUrl);
      const data = await response.json();

      if (data.error) {
        return res.status(400).json({ error: data.error.message });
      }

      (data.data || []).forEach(record => {
        byDay[record.date_start] = {
          spend: Math.round(parseFloat(record.spend || 0) * 22.5)
        };
      });

      // Pokud Meta vrati dalsi stranku, pokracuj - jinak skonci
      nextUrl = data.paging?.next || null;
    }

    res.status(200).json(byDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
