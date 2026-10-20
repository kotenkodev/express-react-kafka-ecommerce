import { ArrowLeft, PackageSearch, RefreshCw, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";

export default function RouteErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4 sm:p-6">
      <PageMeta
        title="Page Unavailable (404)"
        description="The page you are looking for does not exist or has encountered an error."
        noIndex={true}
      />
      <Card className="w-full max-w-2xl gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border/40 bg-muted/20 p-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight tracking-tight">
              KafkaShop
            </span>
            <span className="text-[10px] text-muted-foreground">
              E-Commerce
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground shadow-2xs">
            <PackageSearch
              className="h-10 w-10 stroke-[1.5]"
              aria-hidden="true"
            />
          </div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Something went wrong
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            This page is unavailable
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            We couldn&apos;t load the page you requested. Try again or head back
            to the catalog to keep exploring.
          </p>

          <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button render={<Link to="/" />} className="gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to catalog
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2 shadow-2xs"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </div>

        <div className="border-t border-border/40 bg-muted/20 px-6 py-3.5 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            If this keeps happening, please try again later.
          </p>
        </div>
      </Card>
    </main>
  );
}
