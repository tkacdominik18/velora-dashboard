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

    // Nacti kampane s jejich insights (utrata, nakliky, nakupy)
    const insightsUrl = "https://graph.facebook.com/v19.0/act_" + adAccountId + "/insights"
      + "?fields=campaign_id,campaign_name,spend,actions,action_values"
      + "&level=campaign"
      + "&time_range=" + encodeURIComponent(timeRange)
      + "&access_token=" + token;

    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (insightsData.error) {
      return res.status(400).json({ error: insightsData.error.message });
    }

    // Nacti aktivni kampane pro status a budget
    const campaignsUrl = "https://graph.facebook.com/v19.0/act_" + adAccountId + "/campaigns"
      + "?fields=id,name,status,daily_budget,lifetime_budget"
      + "&access_token=" + token;

    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    const campaignMeta = {};
    (campaignsData.data || []).forEach(c => {
      campaignMeta[c.id] = {
        status: c.status,
        daily_budget: c.daily_budget ? Math.round(parseInt(c.daily_budget) / 100 * 22.5) : null,
      };
    });

    // Spoj insights s meta daty kampani
    const campaigns = (insightsData.data || []).map(item => {
      // Pocet nakupu z actions
      const purchasesAction = (item.actions || []).find(a => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase");
      const purchases = purchasesAction ? parseInt(purchasesAction.value) : 0;

      // Trzby z action_values
      const revenueAction = (item.action_values || []).find(a => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase");
      const revenueUSD = revenueAction ? parseFloat(revenueAction.value) : 0;

      const meta = campaignMeta[item.campaign_id] || {};

      return {
        id: item.campaign_id,
        name: item.campaign_name,
        spend: Math.round(parseFloat(item.spend || 0) * 22.5),
        revenue: Math.round(revenueUSD * 22.5),
        purchases,
        status: meta.status || "UNKNOWN",
        daily_budget: meta.daily_budget || null,
      };
    });

    // Serad podle utracene castky (nejvice utracene prvni)
    campaigns.sort((a, b) => b.spend - a.spend);

    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
