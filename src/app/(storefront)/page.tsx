import {
  getSaleProductsAction,
  getBestSellingProductsAction,
  getHomepageContentAction,
} from "@/actions/storefront"
import { getActiveCollectionsAction } from "@/actions/collections"
import { HeroBanner } from "@/components/storefront/HeroBanner"
import { WelcomeSection } from "@/components/storefront/WelcomeSection"
import { ProductGrid } from "@/components/storefront/ProductGrid"
import { FAQ } from "@/components/storefront/FAQ"
import { CategoryShowcase } from "@/components/storefront/CategoryShowcase"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [
    saleProducts,
    bestSellers,
    content,
    collections
  ] = await Promise.all([
    getSaleProductsAction(5),
    getBestSellingProductsAction(10),
    getHomepageContentAction(),
    getActiveCollectionsAction()
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <HeroBanner />
      <WelcomeSection />

      <CategoryShowcase categories={collections} />

      <ProductGrid
        title="Products On Sale"
        products={saleProducts}
      />

      <ProductGrid
        title="Proven BestSellers"
        products={bestSellers}
        viewAllLink="/shop"
      />

      <FAQ items={content.faqs} />
    </div>
  )
}
