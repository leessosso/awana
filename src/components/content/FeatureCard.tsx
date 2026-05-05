import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface FeatureCardProps {
  icon?: React.ReactNode
  title: string
  description: string
  badge?: string
  className?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  badge,
  className = '',
}: FeatureCardProps) {
  return (
    <Card
      className={`text-center hover:shadow-lg transition-shadow ${className}`}
    >
      {badge && (
        <div className="mb-4">
          <Badge variant="default">{badge}</Badge>
        </div>
      )}
      {icon && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full text-blue-600">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-card-foreground mb-4">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  )
}
