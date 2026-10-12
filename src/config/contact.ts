export const CONTACT_PHONE_DISPLAY = "0888 822 861";
export const CONTACT_PHONE_COMPACT = "0888822861";
export const CONTACT_PHONE_LINK = "+359888822861";
export const CONTACT_SECONDARY_PHONE_DISPLAY = "0883 778 177";
export const CONTACT_SECONDARY_PHONE_COMPACT = "0883778177";
export const CONTACT_SECONDARY_PHONE_LINK = "+359883778177";
export const CONTACT_PHONES = [
  { display: CONTACT_PHONE_DISPLAY, compact: CONTACT_PHONE_COMPACT, link: CONTACT_PHONE_LINK },
  { display: CONTACT_SECONDARY_PHONE_DISPLAY, compact: CONTACT_SECONDARY_PHONE_COMPACT, link: CONTACT_SECONDARY_PHONE_LINK },
] as const;

export const CONTACT_EMAILS = [
  "higiatrade@abv.bg",
] as const;

export const CONTACT_ADDRESS_BG = "гр. Русе, ул. „Потсдам“ №1";
export const CONTACT_ADDRESS_EN = "1 Potsdam St., Ruse, Bulgaria";

export const CONTACT_WORKING_HOURS = "08:00 – 17:00";

export const CONTACT_AREA_BG =
  "За района на гр. Русе, Силистра, Разград, Свищов, Бяла и Търговище";
export const CONTACT_AREA_EN =
  "Serving the Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte area";

const MAP_QUERY = encodeURIComponent(CONTACT_ADDRESS_BG);

export const CONTACT_MAP_URL =
  `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

export const CONTACT_EMBED_MAP_URL =
  `https://www.google.com/maps?hl=bg&q=${MAP_QUERY}&z=16&output=embed`;
