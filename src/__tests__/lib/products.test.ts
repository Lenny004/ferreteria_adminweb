import {
  buildProductPayload,
  canManageProducts,
  emptyProductForm,
  productToForm,
} from "@/lib/products";

const validForm = {
  ...emptyProductForm,
  code: "  HER-1 ",
  description: " Martillo ",
  familyId: "family-1",
  measurementTypeId: "unit-1",
  salePrice: "9.5",
  costPrice: "4.25",
  minStock: "2",
};

describe("permisos del catálogo de productos", () => {
  it("permite editar a ADMIN y OWNER, no al contador", () => {
    expect(canManageProducts("ADMIN")).toBe(true);
    expect(canManageProducts("OWNER")).toBe(true);
    expect(canManageProducts("ACCOUNTANT")).toBe(false);
  });
});

describe("buildProductPayload", () => {
  it("normaliza textos y convierte números", () => {
    const result = buildProductPayload(validForm);
    expect(result).toEqual({
      ok: true,
      data: {
        code: "HER-1",
        description: "Martillo",
        familyId: "family-1",
        subfamilyId: null,
        measurementTypeId: "unit-1",
        barcode: null,
        salePrice: 9.5,
        costPrice: 4.25,
        minStock: 2,
        notes: null,
      },
    });
  });

  it("trata un número vacío como cero", () => {
    const result = buildProductPayload({ ...validForm, minStock: " " });
    expect(result.ok && result.data.minStock).toBe(0);
  });

  it("reporta campos obligatorios y números inválidos", () => {
    const result = buildProductPayload({
      ...emptyProductForm,
      salePrice: "-1",
      costPrice: "abc",
      minStock: "-3",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ["code", "costPrice", "description", "familyId", "measurementTypeId", "minStock", "salePrice"].sort(),
    );
  });
});

describe("productToForm", () => {
  it("usa ids directos o los de las relaciones", () => {
    const form = productToForm({
      id: "p-1",
      code: "HER-1",
      description: "Martillo",
      salePrice: "9.50",
      costPrice: 4,
      currentStock: "3",
      minStock: "1",
      isActive: false,
      family: { id: "family-1", code: "HER", name: "Herramientas" },
      subfamily: { id: "sub-1", name: "Manuales" },
      measurementType: { id: "unit-1", code: "UND", name: "Unidad" },
    });
    expect(form).toMatchObject({
      familyId: "family-1",
      subfamilyId: "sub-1",
      measurementTypeId: "unit-1",
      salePrice: "9.50",
      costPrice: "4",
      barcode: "",
      notes: "",
      isActive: false,
    });
  });

  it("prefiere las llaves planas cuando la API las incluye", () => {
    const form = productToForm({
      id: "p-1",
      code: "HER-1",
      description: "Martillo",
      salePrice: 1,
      costPrice: 1,
      currentStock: 0,
      minStock: 0,
      isActive: true,
      familyId: "family-2",
      subfamilyId: null,
      measurementTypeId: "unit-2",
      barcode: "740",
      notes: "Nota",
    });
    expect(form).toMatchObject({ familyId: "family-2", subfamilyId: "", measurementTypeId: "unit-2", barcode: "740", notes: "Nota" });
  });
});
