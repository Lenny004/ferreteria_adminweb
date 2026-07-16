"use client";

/**
 * Tarjeta de producto para el catálogo de la tienda pública.
 */

import Link from "next/link";
import { useState } from "react";
import { ImageIcon, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";

export type ProductCardProduct = {
  id: string;
  code: string;
  description: string;
  salePrice: string | number;
  currentStock: string | number;
  imageUrl?: string | null;
  brand?: { id?: string; name: string } | string | null;
  family?: { id?: string; name: string } | null;
};

export type ProductCardProps = {
  product: ProductCardProduct;
  onAddToCart?: (product: ProductCardProduct) => void;
  isAddingToCart?: boolean;
  addDisabled?: boolean;
  className?: string;
};

function resolveBrandName(brand: ProductCardProduct["brand"]): string | null {
  if (!brand) return null;
  return typeof brand === "string" ? brand : brand.name;
}

function ProductImage({ imageUrl, description }: { imageUrl?: string | null; description: string }) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !imageUrl || failed;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted">
      {showPlaceholder ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 opacity-40" aria-hidden="true" />
          <span className="sr-only">Sin imagen para {description}</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={description}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function ProductCard({
  product,
  onAddToCart,
  isAddingToCart = false,
  addDisabled = false,
  className,
}: ProductCardProps) {
  const stock = Number(product.currentStock);
  const inStock = !Number.isNaN(stock) && stock > 0;
  const brandName = resolveBrandName(product.brand);
  const canAdd = inStock && !addDisabled && !isAddingToCart;

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-border transition hover:border-foreground/30",
        className,
      )}
    >
      <Link href={`/tienda/producto/${product.id}`} className="group flex flex-1 flex-col">
        <ProductImage imageUrl={product.imageUrl} description={product.description} />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base leading-snug">{product.description}</CardTitle>
            <Badge variant={inStock ? "success" : "muted"} className="shrink-0">
              {inStock ? "Disponible" : "Agotado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="mt-auto space-y-1.5 text-sm">
          <p className="text-muted-foreground">Código: {product.code}</p>
          {brandName ? <p className="text-muted-foreground">{brandName}</p> : null}
          {product.family ? (
            <p className="text-muted-foreground">{product.family.name}</p>
          ) : null}
          <p className="text-lg font-semibold text-foreground">{formatMoney(product.salePrice)}</p>
        </CardContent>
      </Link>

      {onAddToCart ? (
        <CardContent className="pt-0">
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={!canAdd}
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {isAddingToCart ? "Agregando…" : "Agregar"}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
