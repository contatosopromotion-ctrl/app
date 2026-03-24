interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  currency: string;
  processed_at: string;
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

export interface ShopifyClient {
  getOrders(params: {
    status?: string;
    financial_status?: string;
    discount_code?: string;
    limit?: number;
    page_info?: string;
    created_at_min?: string;
    created_at_max?: string;
  }): Promise<{ orders: ShopifyOrder[]; nextPageInfo?: string }>;
}

export function createShopifyClient(
  shopDomain: string,
  accessToken: string
): ShopifyClient {
  const baseUrl = `https://${shopDomain}/admin/api/2024-01`;

  async function shopifyFetch(
    endpoint: string,
    queryParams: Record<string, string | number | undefined>
  ): Promise<{ data: ShopifyOrdersResponse; linkHeader: string | null }> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }

    const url = `${baseUrl}${endpoint}?${params}`;

    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ShopifyOrdersResponse;
    const linkHeader = response.headers.get("Link");

    return { data, linkHeader };
  }

  function parseNextPageInfo(linkHeader: string | null): string | undefined {
    if (!linkHeader) return undefined;

    const match = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
    return match ? match[1] : undefined;
  }

  return {
    async getOrders(params) {
      const queryParams: Record<string, string | number | undefined> = {
        status: params.status || "any",
        financial_status: params.financial_status || "paid",
        limit: params.limit || 250,
      };

      if (params.discount_code) queryParams.discount_code = params.discount_code;
      if (params.page_info) queryParams.page_info = params.page_info;
      if (params.created_at_min) queryParams.created_at_min = params.created_at_min;
      if (params.created_at_max) queryParams.created_at_max = params.created_at_max;

      const { data, linkHeader } = await shopifyFetch("/orders.json", queryParams);
      const nextPageInfo = parseNextPageInfo(linkHeader);

      return {
        orders: data.orders,
        nextPageInfo,
      };
    },
  };
}
