import { HeroSection } from './sections/HeroSection'
import { ServiceHighlights } from './sections/ServiceHighlights'
import { Workflow } from './sections/Workflow'
import { Testimonials } from './sections/Testimonials'

export function HomePage() {
  return (
    <div className="space-y-24">
      <HeroSection />
      <ServiceHighlights />
      <Workflow />
      <Testimonials />
    </div>
  )
}
