import QRCode from "qrcode";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  // De QR hoort bij de menukaart: gasten kijken alvast wat er is, bestellen
  // doen ze daarna op de iPad van de tafel.
  const menuUrl = `${origin}/menu?kijken=1`;

  const png = await QRCode.toBuffer(menuUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
