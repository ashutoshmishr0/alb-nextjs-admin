export interface Filters {
  q: string;
  from: string;
  to: string;
  language: string;
  reportType: string;
  status: string;
  reportDeliveryStatus: string; // ✅ NEW: Report delivery status
  sortBy: string;
  sortOrder: "asc" | "desc";
  limit: number;
  selectFirstN?: number;
  source?: string; // ✅ NEW: Source filter
}

export interface Order {
  emailDelivered: any;
  _id: string;
  orderID: string;
  name: string;
  email: string;
  whatsapp: string;
  gender: string;
  reportLanguage: string;
  dateOfBirth: string;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  placeOfBirthPincode: string | null;
  paymentTxnId: string | null;
  amount: string;
  paymentAt: string | null;
  source: string;
  planName: string;
  astroConsultation: boolean;
  consultationDate: string | null;
  consultationTime: string | null;
  problemType: string | null;
  partnerName: string | null;
  partnerDateOfBirth: string | null;
  partnerTimeOfBirth: string | null;
  partnerPlaceOfBirth: string | null;
  partnerPlaceOfBirthPincode: string | null;
  expressDelivery: boolean;
  questionOne: string | null;
  questionTwo: string | null;
  assignedAstrologerId: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  orderFingerprint: string;
  razorpayOrderId: string;
  attemptCount: number;
  lastAttemptAt: string;
  expiresAt: string;
  deletedAt: string | null;
  status: "pending" | "paid" | "processing" | "delivered";
  drivePdfUploaded: boolean;
  driveFileId: string | null;
  driveFileUrl: string | null;
  driveUploadedAt: string | null;
  reportGenerationError: string | null;
  driveUploadError: string | null;
  emailSendError: string | null;
  reportDeliveryStatus: "pending" | "delivered" | "failed" | "processing";
  reportDeliveryAttemptedAt: string | null;
  reportDeliveryCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  formattedCreatedAt?: string;
  formattedPaymentAt?: string;
  formattedDeliveryAt?: string;
  paymentStatus?: string;
  selected?: boolean; // ✅ NEW: For frontend selection
  latitude?: string | null; // ✅ NEW: Latitude for location-based filtering
  longitude?: string | null; // ✅ NEW: Longitude for location-based filtering

}

export interface ApiResponse {
  success: boolean;
  message: string;
  filters?: {
    applied: any;
    base: any;
  };
  data: {
    items: Order[];
    pagination: {
      page: number;
      pages: number;
      total: number;
      limit: number;
      hasMore: boolean;
      showing: number;
    };
    summary?: {
      total: number;
      byDeliveryStatus?: {
        pending: number;
        delivered: number;
        failed: number;
      };
    };
  };
}