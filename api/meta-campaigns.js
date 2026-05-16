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
    const insightsByCampaign = {};

    let insightsNext = "https://graph.facebook.com/v19.0/act_" + adAccountId + "/insights"
      + "?fields=campaign_id,campaign_name,spend,actions,action_values"
      + "&level=campaign"
      + "&limit=100"
      + "&time_range=" + encodeURIComponent(timeRange)
      + "&access_token=" + token;

    while (insightsNext) {
      const insightsRes = await fetch(insightsNext);
      const insightsData = await insightsRes.json();

      if (insightsData.error) {
        return res.status(400).json({ error: insightsData.error.message });
      }

      (insightsData.data || []).forEach(item => {
        const existing = insightsByCampaign[item.campaign_id] || {
          id: item.campaign_id,
          name: item.campaign_name,
          spend: 0,
          revenue: 0,
          purchases: 0,
        };

        const purchasesAction = (item.actions || []).find(a =>
          a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
        );
        const revenueAction = (item.action_values || []).find(a =>
          a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
        );

        existing.spend += Math.round(parseFloat(item.spend || 0) * 22.5);
        existing.revenue += Math.round(parseFloat(revenueAction?.value || 0) * 22.5);
        existing.purchases += purchasesAction ? parseInt(purchasesAction.value) : 0;

        insightsByCampaign[item.campaign_id] = existing;
      });

      insightsNext = insightsData.paging?.next || null;
    }

    const campaignMeta = {};
    let campaignsNext = "https://graph.facebook.com/v19.0/act_" + adAccountId + "/campaigns"
      + "?fields=id,name,status,daily_budget,lifetime_budget"
      + "&limit=100"
      + "&access_token=" + token;

    while (campaignsNext) {
      const campaignsRes = await fetch(campaignsNext);
      const campaignsData = await campaignsRes.json();

      (campaignsData.data || []).forEach(c => {
        campaignMeta[c.id] = {
          status: c.status,
          daily_budget: c.daily_budget ? Math.round(parseInt(c.daily_budget) / 100 * 22.5) : null,
        };
      });

      campaignsNext = campaignsData.paging?.next || null;
    }

    const campaigns = Object.values(insightsByCampaign).map(item => ({
      ...item,
      status: campaignMeta[item.id]?.status || "UNKNOWN",
      daily_budget: campaignMeta[item.id]?.daily_budget || null,
    }));

campaigns.sort((a, b) => {
  const numA = parseInt(a.name.match(/\d+/) || [0]);
  const numB = parseInt(b.name.match(/\d+/) || [0]);
  return numB - numA;
});

    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
