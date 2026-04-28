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