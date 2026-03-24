export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/influencer/:path*",
    "/brand/:path*",
    "/api/influencers/:path*",
    "/api/orders/:path*",
    "/api/payouts/:path*",
    "/api/shopify/:path*",
  ],
};
