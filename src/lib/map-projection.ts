import * as d3 from "d3";

export const VIEWBOX = { x: -80, y: -20, w: 700, h: 720 };
export const VIEWBOX_STR = "-80 -20 700 720";

export function indiaProjection() {
  return d3.geoMercator().center([82, 22]).scale(1150).translate([300, 340]);
}

export const stateNameToCode: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OR",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TG",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "West Bengal": "WB",
  Delhi: "DL",
  "Jammu & Kashmir": "JK",
  Ladakh: "LA",
  Puducherry: "PY",
  Chandigarh: "CH",
  "Andaman & Nicobar": "AN",
  Lakshadweep: "LD",
  "Dadra and Nagar Haveli and Daman and Diu": "DD",
};

export const TEHSIL_STATES = ["UP"];
