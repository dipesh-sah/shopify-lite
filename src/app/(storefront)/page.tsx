import {
  getSaleProductsAction,
  getBestSellingProductsAction,
  getHomepageContentAction,
} from "@/actions/storefront"
import { getFeaturedPostsAction } from "@/actions/blog"
import { getActiveCollectionsAction } from "@/actions/collections"
import { HeroBanner } from "@/components/storefront/HeroBanner"
import { WelcomeSection } from "@/components/storefront/WelcomeSection"
import { ProductGrid } from "@/components/storefront/ProductGrid"
import { CategoryShowcase } from "@/components/storefront/CategoryShowcase"
import { BlogSection } from "@/components/storefront/BlogSection"
import { NewFAQ } from "@/components/storefront/NewFAQ"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [
    saleProducts,
    bestSellers,
    content,
    collections,
    posts
  ] = await Promise.all([
    getSaleProductsAction(5),
    getBestSellingProductsAction(10),
    getHomepageContentAction(),
    getActiveCollectionsAction(),
    getFeaturedPostsAction(4)
  ])

  console.log(`[HomePage] Sale Products: ${saleProducts.length}, Best Sellers: ${bestSellers.length}`);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroBanner />
      <WelcomeSection />

      <ProductGrid
        title="Products On Sale!"
        products={saleProducts}
      />

      <ProductGrid
        title="Proven bestsellers"
        products={bestSellers}
        viewAllLink="/shop"
      />

      <CategoryShowcase categories={collections} />
      <BlogSection posts={posts} />
      <NewFAQ />
    </div>
  )
}
