import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Minus,
  PackageSearch,
  Plus,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/features/cart/store/cartStore";
import { getProductById } from "@/features/products/api/products.api";
import { getErrorMessage } from "@/lib/error";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();

  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }: { id: string | undefined }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const cartQuantity = useCartStore(
    (state) =>
      state.items.find((item) => item.product.id === id)?.quantity ?? 0,
  );

  const {
    data: product,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("This product could not be found.");
      return getProductById(id);
    },
    enabled: Boolean(id),
    retry: 2,
  });

  const available = Math.max(0, (product?.stock ?? 0) - cartQuantity);
  const selectedQuantity = Math.min(quantity, available);

  const errorMessage = error ? getErrorMessage(error) : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/" />}
        className="gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to catalog
      </Button>

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading product"
          className="grid gap-6 md:grid-cols-2"
        >
          <Skeleton className="min-h-72 rounded-2xl md:min-h-96" />
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ) : errorMessage || !product ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageSearch className="h-6 w-6" />
          </div>
          <h1 className="text-base font-semibold">Product unavailable</h1>
          <p
            role="alert"
            className="mt-1.5 max-w-sm text-xs text-muted-foreground"
          >
            {errorMessage || "This product could not be found."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5 text-xs"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            Try again
          </Button>
        </div>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-xs">
          <div className="grid md:grid-cols-2">
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/50 to-muted/20 p-8 md:min-h-96 md:border-r md:border-b-0">
              {product.category?.name && (
                <Badge
                  variant="secondary"
                  className="absolute top-4 left-4 border border-border/40 bg-background/80 text-xs shadow-2xs backdrop-blur-md"
                >
                  {product.category.name}
                </Badge>
              )}
              <span
                role="img"
                aria-label={product.name}
                className="select-none text-8xl drop-shadow-md transition-transform duration-300 hover:scale-105 md:text-9xl"
              >
                {product.emoji || "📦"}
              </span>
            </div>

            <div className="flex flex-col justify-between p-6 md:p-8">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {product.name}
                  </h1>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={product.stock > 0 ? "outline" : "destructive"}
                    className={
                      product.stock > 0
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : ""
                    }
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </Badge>
                  {cartQuantity > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({cartQuantity} already in cart)
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="mt-8 space-y-4 border-t border-border/40 pt-6">
                {available > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        Quantity
                      </span>
                      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums">
                          {selectedQuantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="h-7 w-7 rounded-lg"
                          onClick={() =>
                            setQuantity((q) => Math.min(available, q + 1))
                          }
                          disabled={quantity >= available}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2 rounded-xl h-10 text-xs font-semibold shadow-xs"
                      onClick={() => {
                        addItem(product, selectedQuantity);
                        setAdded(true);
                        setTimeout(() => setAdded(false), 1500);
                      }}
                    >
                      {added ? (
                        <>
                          <Check className="h-4 w-4" />
                          Added to cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Add to cart &bull; $
                          {(selectedQuantity * Number(product.price)).toFixed(
                            2,
                          )}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button disabled className="w-full rounded-xl h-10 text-xs">
                    {product.stock === 0 ? "Out of stock" : "Max stock in cart"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
