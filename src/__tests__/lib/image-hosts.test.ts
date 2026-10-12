import { getConfiguredPublicImageOrigins, isAllowedImageSource } from "@/lib/image-hosts";

describe("allowlist de imágenes demo", () => {
  it("acepta solo orígenes HTTPS sin rutas ni comodines", () => {
    expect(
      getConfiguredPublicImageOrigins(
        "https://picsum.photos, http://inseguro.test, https://otro.test/ruta, https://*.test",
      ),
    ).toEqual(["https://picsum.photos"]);
  });

  it("no trata una URL protocol-relative como una imagen local", () => {
    expect(isAllowedImageSource("//cdn.example.test/image.png")).toBe(false);
  });
});
