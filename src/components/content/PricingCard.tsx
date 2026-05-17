import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingCardProps {
  name: string
  price: number
  period?: string
  description: string
  features: PricingFeature[]
  buttonText: string
  onButtonClick?: () => void
  popular?: boolean
  className?: string
}

export function PricingCard({
  name,
  price,
  period = '월',
  description,
  features,
  buttonText,
  onButtonClick,
  popular = false,
  className = '',
}: PricingCardProps) {
  return (
    <Card
      className={`relative ${popular ? 'border-blue-500 shadow-lg' : ''} ${className}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="default">인기</Badge>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-card-foreground mb-2">{name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-card-foreground">
            ₩{price.toLocaleString()}
          </span>
          {period && <span className="text-muted-foreground">/{period}</span>}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="mb-8">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span
                className={`mr-3 ${
                  feature.included ? 'text-green-500' : 'text-muted-foreground'
                }`}
              >
                {feature.included ? '✓' : '✕'}
              </span>
              <span
                className={`${
                  feature.included
                    ? 'text-card-foreground'
                    : 'text-muted-foreground line-through'
                }`}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant={popular ? 'default' : 'outline'}
        className="w-full"
        onClick={onButtonClick}
      >
        {buttonText}
      </Button>
    </Card>
  )
}
