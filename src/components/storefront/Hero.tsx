import Link from "next/link"
import { Button } from "@/components/ui/button"

interface HeroProps {
  title: string
  subtitle: string
  image: string
  buttonText: string
  buttonLink: string
}

export function Hero({ title, subtitle, image, buttonText, buttonLink }: HeroProps) {
  if (!image) return null

  return (
    <div className="relative h-[500px] w-full overflow-hidden mb-12">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="container relative h-full flex flex-col justify-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold max-w-2xl mb-4 leading-tight">
          {title || "The future of healing"}
        </h1>
        <p className="text-lg md:text-xl max-w-xl mb-8 opacity-90">
          {subtitle || "Discover our premium collection"}
        </p>
        {buttonText && (
          <Button asChild size="lg" className="w-fit bg-green-600 hover:bg-green-700 text-white border-0">
            <Link href={buttonLink || "/products"}>
              {buttonText}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
