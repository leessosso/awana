import { Card } from '../ui/Card'

interface TestimonialProps {
  quote: string
  author: {
    name: string
    role: string
    company?: string
    avatar?: string
  }
  rating?: number
  className?: string
}

export function Testimonial({
  quote,
  author,
  rating,
  className = '',
}: TestimonialProps) {
  return (
    <Card className={className}>
      {rating && (
        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-lg ${
                i < rating ? 'text-yellow-400' : 'text-muted-foreground'
              }`}
            >
              ★
            </span>
          ))}
        </div>
      )}
      <blockquote className="text-muted-foreground mb-6 leading-relaxed">
        "{quote}"
      </blockquote>
      <div className="flex items-center">
        {author.avatar && (
          <img
            src={author.avatar}
            alt={author.name}
            className="w-12 h-12 rounded-full mr-4"
          />
        )}
        <div>
          <div className="font-semibold text-foreground">{author.name}</div>
          <div className="text-sm text-muted-foreground">
            {author.role}
            {author.company && ` at ${author.company}`}
          </div>
        </div>
      </div>
    </Card>
  )
}
