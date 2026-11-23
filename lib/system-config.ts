export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: false,
  CLIENT_ID: "FfeMR82bJTYSIyOdDFdmYaKcRv2uQef9gECIy3FvOwU",
  REDIRECT_URI: "https://mw-alpha.vercel.app/callback",
} as const;

export const BACKEND_URLS = {
  APPROVE_PAYMENT: (paymentId: string) => `/api/payments/${paymentId}/approve`,
  COMPLETE_PAYMENT: (paymentId: string) => `/api/payments/${paymentId}/complete`,
  GET_PAYMENT: (paymentId: string) => `/api/payments/${paymentId}`,
} as const;

export const PI_BLOCKCHAIN_URLS = {
  TESTNET: "https://testnet.piblockchain.io",
  MAINNET: "https://mainnet.piblockchain.io",
  GET_TRANSACTION: (txid: string) => `/api/payments/${txid}`,
} as const;
