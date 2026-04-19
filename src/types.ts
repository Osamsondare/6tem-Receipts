export interface ReceiptItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  id: string;
  number: number;
  date: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessLogo?: string | null;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  notes: string;
  items: ReceiptItem[];
  subtotal: number;
  discountValue?: number;
  discountType?: "percent" | "amount";
  taxRate?: number;
  total: number;
  currency: string;
  currencySymbol: string;
  createdAt?: any;
}

export interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  receiptCount: number;
}
