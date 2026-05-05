import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const footerLinks = [
  {
    titleKey: 'footer.sections.templates',
    links: [
      { labelKey: 'navigation.home', href: '/' },
      { labelKey: 'navigation.service', href: '/service' },
      { labelKey: 'navigation.product', href: '/product' },
      { labelKey: 'navigation.portfolio', href: '/portfolio' },
    ],
  },
  {
    titleKey: 'footer.sections.resources',
    links: [
      { labelKey: 'footer.links.designSystem', href: '#' },
      { labelKey: 'footer.links.docs', href: '#' },
      { labelKey: 'footer.links.library', href: '#' },
    ],
  },
  {
    titleKey: 'footer.sections.company',
    links: [
      { labelKey: 'footer.links.about', href: '#' },
      { labelKey: 'footer.links.blog', href: '#' },
      { labelKey: 'footer.links.careers', href: '#' },
    ],
  },
]

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border/5 bg-background/90">
      <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1280px] flex flex-col gap-6 py-6 md:gap-12 md:py-12 md:flex-row md:items-start md:justify-between">
        {/* 브랜드 섹션 - 모바일에서 간결하게 */}
        <div className="space-y-2 md:max-w-sm md:space-y-4">
          <h2 className="text-lg font-semibold text-foreground md:text-xl">
            WebTemplateStudio
          </h2>
          <p className="hidden text-sm text-muted-foreground md:block">
            {t('footer.description')}
          </p>
        </div>

        {/* 링크 섹션 - 모바일에서 2열, 데스크톱에서 3열 */}
        <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3 md:gap-8">
          {footerLinks.map((section) => (
            <div key={section.titleKey} className="space-y-2 md:space-y-4">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground md:text-sm">
                {t(section.titleKey)}
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground md:space-y-3 md:text-sm">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      to={link.href}
                      className="transition hover:text-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 저작권 섹션 - 모바일에서 패딩 줄이기 */}
      <div className="border-t border-border/5 py-4 text-center text-xs text-muted-foreground md:py-6">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  )
}
