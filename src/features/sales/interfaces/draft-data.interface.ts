export interface DraftData {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    rate: number;
  }>;
  total?: number;
  notes?: string;
  createdAt: Date;
  [key: string]: unknown; // Allow flexibility while typed
}
