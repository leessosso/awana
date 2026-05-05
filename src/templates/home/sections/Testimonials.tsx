import { useTranslation } from 'react-i18next'

export function Testimonials() {
  const { t } = useTranslation()

  const testimonials = t('testimonials.items', {
    returnObjects: true,
  }) as Array<{
    name: string
    role: string
    quote: string
  }>

  return (
    <section className="container mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1280px] space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-semibold text-foreground">
          {t('testimonials.title')}
        </h2>
        <p className="max-w-2xl text-base text-muted-foreground">
          {t('testimonials.subtitle')}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {testimonials.map((item) => (
          <blockquote key={item.name} className="rounded-3xl p-6 sm:p-8 bg-card text-card-foreground border border-border shadow-[0_20px_50px_-20px_rgb(var(--color-background)/0.9)] space-y-4">
            <p className="text-sm text-muted-foreground">"{item.quote}"</p>
            <div className="text-sm">
              <div className="font-semibold text-card-foreground">
                {item.name}
              </div>
              <div className="text-muted-foreground">{item.role}</div>
            </div>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
