import { describe, expect, it } from "vitest";
import { resolveHeroScreenMode } from "./heroScreenProfiles";

describe("live slideshow profile resolution", () => {
  it("uses the edited laptop layout across realistic desktop widths when it is the only saved one", () => {
    const layouts = { laptop: { positions: { title: { x: 5, y: 19 } } } };
    expect(resolveHeroScreenMode(1366, layouts)).toBe("laptop");
    expect(resolveHeroScreenMode(1440, layouts)).toBe("laptop");
    expect(resolveHeroScreenMode(1512, layouts)).toBe("laptop");
    expect(resolveHeroScreenMode(1920, layouts)).toBe("laptop");
  });

  it("selects the nearest saved desktop profile, preserving explicit monitor layouts", () => {
    const layouts = { laptop: {}, monitor24: {}, monitor27: {} };
    expect(resolveHeroScreenMode(1366, layouts)).toBe("laptop");
    expect(resolveHeroScreenMode(1920, layouts)).toBe("monitor24");
    expect(resolveHeroScreenMode(2560, layouts)).toBe("monitor27");
  });

  it("selects an individually configured MacBook at its matching width", () => {
    expect(resolveHeroScreenMode(1440, { laptop: {}, macbookAir15: {} })).toBe("macbookAir15");
  });

  it("prefers generic monitor on a tied CSS width when both profiles are saved", () => {
    expect(resolveHeroScreenMode(1920, { imac24: {}, monitor24: {} })).toBe("monitor24");
    expect(resolveHeroScreenMode(1920, { imac24: {} })).toBe("imac24");
  });

  it("never applies an unrelated desktop layout to a phone or tablet", () => {
    const layouts = { laptop: {} };
    expect(resolveHeroScreenMode(390, layouts)).toBe("mobile");
    expect(resolveHeroScreenMode(800, layouts)).toBe("tabletMedium");
  });

  it("selects available mobile presets independently of desktop presets", () => {
    const layouts = { laptop: {}, mobile: {}, iphoneProMax: {} };
    expect(resolveHeroScreenMode(390, layouts)).toBe("mobile");
    expect(resolveHeroScreenMode(440, layouts)).toBe("iphoneProMax");
    expect(resolveHeroScreenMode(1366, layouts)).toBe("laptop");
  });
});
