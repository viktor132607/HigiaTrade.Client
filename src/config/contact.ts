export const CONTACT_PHONE_DISPLAY = "0888 822 861";
export const CONTACT_PHONE_COMPACT = "0888822861";
export const CONTACT_PHONE_LINK = "+359888822861";

export const CONTACT_EMAILS = [
  "iliev132607@gmail.com",
  "higiatrade@abv.bg",
] as const;

export const CONTACT_ADDRESS_BG = "гр. Русе, ул. Акад. Михаил Арнаудов №3";
export const CONTACT_ADDRESS_EN = "3 Acad. Mihail Arnaudov St., Ruse, Bulgaria";

export const CONTACT_AREA_BG =
  "За района на гр. Русе, Силистра, Разград, Свищов, Бяла и Търговище";
export const CONTACT_AREA_EN =
  "Serving the Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte area";

const MAP_QUERY = encodeURIComponent(CONTACT_ADDRESS_BG);

export const CONTACT_MAP_URL =
  `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

export const CONTACT_EMBED_MAP_URL =
  `https://www.google.com/maps?hl=bg&q=${MAP_QUERY}&z=16&output=embed`;
