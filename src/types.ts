export type OrderStatus =
  | "pending" | "routing" | "building" | "submitted" | "confirmed" | "failed";

export interface CreateOrderReq {
  type: "market";
  tokenIn: string;
  tokenOut: string;
  amount: number;
  maxSlippageBps?: number; // e.g. 100 = 1%
}
