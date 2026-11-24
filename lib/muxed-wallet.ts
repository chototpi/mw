
const API_BASE = process.env.NEXT_PUBLIC_MW_API;

// Kiểm tra cấu hình API
function getApiBase() {
  if (!API_BASE) {
    throw new Error("Missing NEXT_PUBLIC_MW_API");
  }

  return API_BASE.replace(/\/+$/, "");
}

// Lấy ví hiện tại
export async function getMuxedWallet() {
  const username = localStorage.getItem("pi_username");

  if (!username) {
    throw new Error("Username not found");
  }

  const response = await fetch(
    `${getApiBase()}/get-wallet?username=${encodeURIComponent(username)}`
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Get wallet failed");
  }

  return data.wallet;
}

// Tạo ví mới
export async function createMuxedAddress() {
  const uid = localStorage.getItem("uid");
  const username = localStorage.getItem("pi_username");

  if (!uid || !username) {
    throw new Error("User information not found");
  }

  const response = await fetch(
    `${getApiBase()}/create-muxed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uid,
        username
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success || !data.muxed) {
    throw new Error(data.error || "Create wallet failed");
  }

  return data.muxed;
}
