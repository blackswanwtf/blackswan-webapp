function withValidProperties(
  properties: Record<string, undefined | string | string[]>
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    })
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: "1",
      name: "Black Swan AI",
      subtitle: "Know when to sell.",
      description:
        "AI Agents working to analyse tokens, markets and events to ensure you sell before everyone else",
      screenshotUrls: ["https://blackswan.wtf/og.png"],
      iconUrl: "https://blackswan.wtf/logo.png",
      splashImageUrl: "https://blackswan.wtf/logo.png",
      splashBackgroundColor: "#000000",
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: "utility",
      tags: ["AI", "Agents", "Analysis", "Hold", "Sell"],
      heroImageUrl: "https://blackswan.wtf/og.png",
      tagline: "Know when to sell.",
      ogTitle: "Black Swan AI",
      ogDescription:
        "AI Agents working to analyse tokens, markets and events to ensure you sell before everyone else",
      ogImageUrl: "https://blackswan.wtf/og.png",
    }),
    baseBuilder: {
      allowedAddresses: ["0x58452ACf286388C8e7bae090Cb8Cbde8433f718b"],
    },
  });
}
