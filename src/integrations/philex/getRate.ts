// integrations/philex/shipping.ts
import { BASE_URL, authenticatePhilex } from "./Auth";

interface PriceRequest {
  type: "pouch" | "box"; // adjust if PhilEx supports more
  weight: string; // must be string
  declared_value: string; // must be string
  sender_province: string;
  sender_municipality: string;
  sender_barangay: string;
  recipient_province: string;
  recipient_municipality: string;
  recipient_barangay: string;
}

// utils/philexMapping.ts

export function convertRegion(region: string): "Luzon" | "Visayas" | "Mindanao" {
  const regionMapping: Record<string, "Luzon" | "Visayas" | "Mindanao"> = {
    "Region I (Ilocos Region)": "Luzon",
    "Region II (Cagayan Valley)": "Luzon",
    "Region III (Central Luzon)": "Luzon",
    "Region IV-A (CALABARZON)": "Luzon",
    "Region IV-B (MIMAROPA)": "Luzon",
    "Region V (Bicol Region)": "Luzon",
    "Region VI (Western Visayas)": "Visayas",
    "Region VII (Central Visayas)": "Visayas",
    "Region VIII (Eastern Visayas)": "Visayas",
    "Region IX (Zamboanga Peninsula)": "Mindanao",
    "Region X (Northern Mindanao)": "Mindanao",
    "Region XI (Davao Region)": "Mindanao",
    "Region XII (SOCCSKSARGEN)": "Mindanao",
    "Region XIII (Caraga)": "Mindanao",
    "Cordillera Administrative Region (CAR)": "Luzon",
    "National Capital Region (NCR)": "Luzon",
    "Autonomous Region in Muslim Mindanao (ARMM)": "Mindanao",
  };

  return regionMapping[region] ?? "Luzon";
}

export function convertProvince(province: string): string {
  const provinceMapping: Record<string, string> = {
    "Ncr, City Of Manila, First District": "Metro Manila",
    "Ncr, Second District": "Metro Manila",
    "Ncr, Third District": "Metro Manila",
    "Ncr, Fourth District": "Metro Manila",
  };

  return provinceMapping[province] ?? province;
}

export function removeParentheses(name: string): string {
  if (/quezon city/i.test(name)) {
    return "Quezon City";
  }

  // strip "City of", "City", and anything in parentheses
  return name.replace(/^City\s+Of\s+|\s*City$|\s*\(.*?\)\s*/gi, "").trim();
}

export const getPhilExRate = async (params: {
  type: "pouch" | "box";
  weight: number;
  declared_value: number;
  sender: {
    province: string;
    municipality: string;
    barangay: string;
  };
  recipient: {
    province: string;
    municipality: string;
    barangay: string;
  };
}): Promise<number> => {
  const token = await authenticatePhilex();

  const priceUrl = `${BASE_URL}/company/prices`;

  const priceRequest: PriceRequest[] = [
    {
      type: params.type,
      weight: params.weight.toString(),
      declared_value: params.declared_value.toString(),
      sender_province: params.sender.province,
      sender_municipality: params.sender.municipality,
      sender_barangay: params.sender.barangay,
      recipient_province: params.recipient.province,
      recipient_municipality: params.recipient.municipality,
      recipient_barangay: params.recipient.barangay,
    },
  ];

  try {
    const priceRes = await fetch(priceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(priceRequest),
    });

    const data = await priceRes.json();

    if (!priceRes.ok || data.code === "VALIDATION_ERROR") {
      console.warn("PhilEx not serviceable:", data.error || data);
      return 100; // 👈 fallback default shipping rate
    }

    return data.results?.fees?.total_rate ?? 50;
  } catch (err) {
    console.error("PhilEx rate fetch failed:", err);
    return 100; // 👈 fallback if API call fails
  }
};
