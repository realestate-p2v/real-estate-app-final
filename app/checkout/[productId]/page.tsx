import { Checkout } from "@/components/checkout";
import { getProduct, PRODUCTS } from "@/lib/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, Clock, CheckCircle } from "lucide-react";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    productId: product.id,
  }));
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/#pricing"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pricing
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="mb-6 text-2xl font-bold text-foreground">
              Order Summary
            </h1>

            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {product.name} Package
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {product.photoLimit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    ${(product.priceInCents / 100).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    ${(product.originalPriceInCents / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <h3 className="font-medium text-foreground">
                {"What's included:"}
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>100% Money-Back Guarantee if Not Thrilled</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>{product.deliveryTime}</span>
              </div>
            </div>
          </div>

          {/* Stripe Checkout */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              Payment Details
            </h2>
            <Checkout productId={productId} />
          </div>
        </div>
      </main>
    </div>
  );
}
