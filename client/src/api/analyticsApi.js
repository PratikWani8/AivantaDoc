import axiosInstance from "./axios";

export const analyticsApi = {
  getOverview: () =>
    axiosInstance.get("/analytics/overview"),

  getSpendingTrends: () =>
    axiosInstance.get("/analytics/spending-trends"),

  getSpendByVendor: () =>
    axiosInstance.get("/analytics/vendor-performance"),

  getRiskDistribution: () =>
    axiosInstance.get("/analytics/risk-distribution"),

  getDocumentTrends: () =>
    axiosInstance.get("/analytics/document-trends"),

  getFinancialLeakage: () =>
    axiosInstance.get("/analytics/financial-leakage"),
};