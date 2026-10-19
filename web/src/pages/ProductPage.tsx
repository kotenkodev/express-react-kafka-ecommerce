import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Minus, PackageSearch, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/features/cart/store/cartStore";
import { getProductById } from "@/features/products/api/products.api";
import type { Product } from "@/features/products/types";
import { getErrorMessage } from "@/lib/error";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();

  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }: { id: string | undefined }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const cartQuantity = useCartStore((state) =>
    state.items.find((item) => item.product.id === id)?.quantity ?? 0,
  );

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        if (!id) throw new Error("This product could not be found.");
        const result = await getProductById(id);
        if (!ignore) setProduct(result);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadProduct();
    return () => { ignore = true; };
  }, [id, retry]);

  const available = Math.max(0, (product?.stock ?? 0) - cartQuantity);
  const selectedQuantity = Math.min(quantity, available);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link to="/" />} className="gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Button>

      {isLoading ? (
        <div role="status" aria-label="Loading product" className="grid gap-6 md:grid-cols-2">
          <Skeleton className="min-h-72 rounded-2xl md:min-h-96" />
          <div className="space-y-5 py-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      ) : error || !product ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageSearch className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-semibold">Product unavailable</h1>
          <p role="alert" className="mt-2 max-w-sm text-sm text-muted-foreground">
            {error || "This product could not be found."}
          </p>
          <Button variant="outline" className="mt-5" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </Button>
        </div>
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="relative flex min-h-72 items-center justify-center overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/50 to-muted/20 p-10 md:min-h-112 md:border-r md:border-b-0">
              {product.category?.name && (
                <Badge variant="secondary" className="absolute top-4 left-4 border border-border/40 bg-background/80 text-xs shadow-xs backdrop-blur-md">
                  {product.category.name}
                </Badge>
              )}
              <span role="img" aria-label={product.name} className="select-none text-9xl drop-shadow-sm transition-transform duration-300 hover:scale-110">
                {product.emoji || "📦"}
              </span>
            </div>

            <div className="flex min-w-0 flex-col gap-6 p-6 lg:p-8">
              <div className="space-y-3">
                <Badge
                  variant={product.stock <= 0 ? "destructive" : "outline"}
                  className={product.stock <= 0 ? "" : product.stock <= 10
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}
                >
                  {product.stock <= 0 ? "Out of stock" : product.stock <= 10 ? `Only ${product.stock} left` : "In stock"}
                </Badge>
                <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{product.name}</h1>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price per item</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">${Number(product.price).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/40 pt-5">
                <h2 className="text-sm font-semibold">About this product</h2>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="mt-auto space-y-4 rounded-xl border border-border/40 bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <span id="product-quantity-label" className="text-xs font-semibold">Quantity</span>
                    <div role="group" aria-labelledby="product-quantity-label" className="flex w-fit items-center gap-2 rounded-lg border border-border/60 bg-background p-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Decrease quantity" disabled={selectedQuantity <= 1} onClick={() => { setQuantity(selectedQuantity - 1); setAdded(false); }}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{selectedQuantity}</span>
                      <Button variant="ghost" size="icon-sm" aria-label="Increase quantity" disabled={selectedQuantity >= available} onClick={() => { setQuantity(selectedQuantity + 1); setAdded(false); }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-xl font-bold tracking-tight">${(Number(product.price) * selectedQuantity).toFixed(2)}</p>
                  </div>
                </div>
                <Button className="w-full gap-2 shadow-sm transition-transform active:scale-95" disabled={available === 0} onClick={() => { addItem(product, selectedQuantity); setQuantity(1); setAdded(true); }}>
                  <ShoppingCart className="h-4 w-4" />
                  {product.stock <= 0 ? "Out of stock" : available === 0 ? "All available items in cart" : "Add to cart"}
                </Button>
                <p role="status" className="flex min-h-4 items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  {added && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                  {cartQuantity > 0 ? `${cartQuantity} ${cartQuantity === 1 ? "item" : "items"} in your cart` : "Choose a quantity to add to your cart."}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
