import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "";

  const priceFormatted = Number(product.price || 0).toFixed(2);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-0">
      {/* Top Banner / Hero with Emoji */}
      <div className="relative flex h-44 w-full items-center justify-center bg-gradient-to-b from-muted/50 to-muted/20 border-b border-border/40 overflow-hidden">
        {/* Category Badge */}
        {categoryName && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 text-[11px] font-medium backdrop-blur-md bg-background/80 shadow-xs border border-border/40"
          >
            {categoryName}
          </Badge>
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <Badge
            variant="destructive"
            className="absolute top-3 right-3 text-[10px] font-medium"
          >
            Out of stock
          </Badge>
        ) : isLowStock ? (
          <Badge
            variant="outline"
            className="absolute top-3 right-3 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium"
          >
            Only {product.stock} left
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="absolute top-3 right-3 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium"
          >
            In stock
          </Badge>
        )}

        {/* Product Emoji */}
        <span
          className="text-6xl select-none transition-transform duration-300 group-hover:scale-115 drop-shadow-sm"
          role="img"
          aria-label={product.name}
        >
          {product.emoji || "📦"}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          <Link to={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {product.description || "No description available."}
        </p>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between border-t border-border/40 p-4 pt-3 mt-auto bg-muted/10">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Price
          </span>
          <span className="text-lg font-bold text-foreground tracking-tight">
            ${priceFormatted}
          </span>
        </div>

        <Button
          size="sm"
          variant="default"
          disabled={isOutOfStock}
          onClick={() => onAddToCart?.(product)}
          className="gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </div>
    </Card>
  );
}
