import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FAQProps {
  items: Array<{ question: string; answer: string }>
}

export function FAQ({ items }: FAQProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="container mb-16">
      <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
