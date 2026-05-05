import { useTranslation } from 'react-i18next'

export function Workflow() {
  const { t } = useTranslation()

  const steps = t('workflow.steps', { returnObjects: true }) as Array<{
    title: string
    description: string
    duration: string
  }>

  return (
    <section id="workflow" className="container mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1280px] space-y-12">
      <div className="max-w-2xl space-y-4">
        <h2 className="text-3xl font-semibold text-foreground">
          {t('workflow.title')}
        </h2>
        <p className="text-base text-muted-foreground">
          {t('workflow.description')}
        </p>
      </div>
      <ol className="grid gap-6 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-3xl p-6 sm:p-8 bg-card text-card-foreground border border-border shadow-[0_20px_50px_-20px_rgb(var(--color-background)/0.9)] space-y-4 border-primary/20"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="text-xl font-semibold text-card-foreground">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs uppercase tracking-widest text-primary">
              리드타임 {step.duration}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
