import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, TrendingUp, Wallet, Receipt } from 'lucide-react'

const stats = [
  {
    title: 'Total Invested',
    value: '€12,450',
    change: '+12.5%',
    icon: Wallet,
    changeType: 'positive' as const
  },
  {
    title: 'Properties',
    value: '8',
    change: '+2 this month',
    icon: Building,
    changeType: 'positive' as const
  },
  {
    title: 'Annual Yield',
    value: '5.2%',
    change: '+0.3%',
    icon: TrendingUp,
    changeType: 'positive' as const
  },
  {
    title: 'Monthly Income',
    value: '€540',
    change: '+€45',
    icon: Receipt,
    changeType: 'positive' as const
  }
]

const recentProperties = [
  {
    id: 1,
    title: "Athens Apartment",
    location: "Kolonaki, Athens",
    invested: "€2,500",
    yield: "4.7%",
    status: "active"
  },
  {
    id: 2,
    title: "Thessaloniki Loft",
    location: "Ladadika, Thessaloniki",
    invested: "€1,800",
    yield: "5.2%",
    status: "active"
  },
  {
    id: 3,
    title: "Crete Villa",
    location: "Chania, Crete",
    invested: "€4,500",
    yield: "6.0%",
    status: "pending"
  }
]

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your investment overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <stat.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Properties */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Your Recent Investments</CardTitle>
            <CardDescription>
              Properties you've recently invested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gradient-emerald-subtle rounded-xl flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                      <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-muted-foreground">{property.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{property.invested}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status}
                      </Badge>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{property.yield}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}