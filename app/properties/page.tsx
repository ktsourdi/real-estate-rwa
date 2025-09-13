import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, TrendingUp } from 'lucide-react'
import Image from 'next/image'

const properties = [
  {
    id: 1,
    title: "Athens Apartment",
    location: "Kolonaki, Athens",
    pricePerToken: "€25",
    yield: "4.7%",
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
    totalTokens: 1000,
    soldTokens: 750,
    description: "Modern apartment in prime Athens location"
  },
  {
    id: 2,
    title: "Thessaloniki Loft",
    location: "Ladadika, Thessaloniki",
    pricePerToken: "€18",
    yield: "5.2%",
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg",
    totalTokens: 800,
    soldTokens: 320,
    description: "Industrial loft in historic district"
  },
  {
    id: 3,
    title: "Crete Villa",
    location: "Chania, Crete",
    pricePerToken: "€45",
    yield: "6.0%",
    image: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg",
    totalTokens: 1200,
    soldTokens: 950,
    description: "Luxury villa with sea views"
  },
  {
    id: 4,
    title: "Mykonos Hotel",
    location: "Mykonos Town, Mykonos",
    pricePerToken: "€120",
    yield: "7.5%",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg",
    totalTokens: 2000,
    soldTokens: 1200,
    description: "Boutique hotel in tourist hotspot"
  },
  {
    id: 5,
    title: "Rhodes Apartment",
    location: "Old Town, Rhodes",
    pricePerToken: "€35",
    yield: "5.8%",
    image: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg",
    totalTokens: 600,
    soldTokens: 180,
    description: "Historic apartment with modern amenities"
  },
  {
    id: 6,
    title: "Patras Office",
    location: "City Center, Patras",
    pricePerToken: "€28",
    yield: "4.9%",
    image: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg",
    totalTokens: 900,
    soldTokens: 540,
    description: "Commercial office space in business district"
  }
]

export default function Properties() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
          <p className="text-muted-foreground mt-2">
            Discover and invest in tokenized real estate opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const soldPercentage = (property.soldTokens / property.totalTokens) * 100
            
            return (
              <Card key={property.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="glass-effect text-white border-white/20 shadow-lg">
                      {property.yield} yield
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="text-white">
                      <p className="text-sm font-medium opacity-90">Investment Opportunity</p>
                      <p className="text-xs opacity-75">Click to view details</p>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{property.title}</CardTitle>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    {property.description}
                  </p>
                  
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/30 dark:border-emerald-800/30">
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                        {property.pricePerToken}
                      </p>
                      <p className="text-sm text-muted-foreground">per token</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="font-medium">{property.yield}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">annual yield</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{property.soldTokens}/{property.totalTokens} tokens</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="gradient-emerald rounded-full h-3 transition-all duration-500 shadow-sm"
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {soldPercentage.toFixed(1)}% funded
                    </p>
                  </div>
                  
                  <Button className="w-full gradient-emerald hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-white border-0 hover:scale-[1.02]" size="lg">
                    Buy Tokens
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}