import QRCode from "qrcode";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const table = params.get("tafel") ?? "1";

  const origin = new URL(request.url).origin;
  const menuUrl = `${origin}/welkom?tafel=${encodeURIComponent(table)}`;

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
