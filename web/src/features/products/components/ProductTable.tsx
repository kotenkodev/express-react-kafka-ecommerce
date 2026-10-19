import { Pencil, Trash2, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "../types";

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const ProductRow = ({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}) => {
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "—";

  const priceFormatted = Number(product.price || 0).toFixed(2);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-xl border border-border/40 select-none">
            {product.emoji || "📦"}
          </div>
          <div className="flex flex-col min-w-0 max-w-[220px]">
            <span className="font-medium text-sm text-foreground truncate">
              {product.name}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              ID: {product.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="secondary" className="text-xs font-normal">
          {categoryName}
        </Badge>
      </TableCell>

      <TableCell className="max-w-[260px]">
        <p
          className="text-xs text-muted-foreground truncate"
          title={product.description || ""}
        >
          {product.description || "—"}
        </p>
      </TableCell>

      <TableCell className="font-semibold text-foreground">
        ${priceFormatted}
      </TableCell>

      <TableCell>
        {isOutOfStock ? (
          <Badge variant="destructive" className="text-[11px] font-medium">
            0 (Out)
          </Badge>
        ) : isLowStock ? (
          <Badge
            variant="outline"
            className="text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
          >
            {product.stock} (Low)
          </Badge>
        ) : (
          <span className="text-sm font-medium text-foreground">
            {product.stock}
          </span>
        )}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {formatDate(product.createdAt)}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(product)}
            className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            <span>Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(product)}
            className="h-8 px-2.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            <span>Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export function ProductTable({
  products,
  isLoading = false,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="w-full rounded-2xl border border-border/70 overflow-hidden bg-card shadow-xs">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="min-w-[240px]">Product</TableHead>
            <TableHead className="min-w-[120px]">Category</TableHead>
            <TableHead className="min-w-[220px]">Description</TableHead>
            <TableHead className="min-w-[100px]">Price</TableHead>
            <TableHead className="min-w-[100px]">Stock</TableHead>
            <TableHead className="min-w-[120px]">Created</TableHead>
            <TableHead className="text-right min-w-[160px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-44 rounded-md" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14 rounded-md" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20 rounded-md" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <PackageSearch className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-sm text-foreground">
                    No products found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your product catalog is currently empty.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
