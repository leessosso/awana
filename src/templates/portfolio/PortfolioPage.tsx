import { useTranslation } from 'react-i18next'

export function PortfolioPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-16">
      <section className="container mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1280px] space-y-6">
        <h1 className="text-4xl font-semibold text-foreground">
          {t('portfolio.title')}
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          {t('portfolio.description')}
        </p>
      </section>
      <section className="container mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1280px] grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl p-6 sm:p-8 bg-card text-card-foreground border border-border shadow-[0_20px_50px_-20px_rgb(var(--color-background)/0.9)] space-y-6">
          <h2 className="text-2xl font-semibold text-card-foreground">
            {t('portfolio.sections.title')}
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {(
              t('portfolio.sections.items', { returnObjects: true }) as string[]
            ).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl p-6 sm:p-8 bg-card text-card-foreground border border-border shadow-[0_20px_50px_-20px_rgb(var(--color-background)/0.9)] space-y-4">
          <h3 className="text-xl font-semibold text-card-foreground">
            {t('portfolio.recommendations.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('portfolio.recommendations.description')}
          </p>
        </div>
      </section>
    </div>
  )
}
