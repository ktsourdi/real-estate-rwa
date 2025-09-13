import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Wallet, Building, TrendingUp, DollarSign } from 'lucide-react'

const walletData = {
  balance: '120.45',
  currency: 'USDC',
  totalInvested: '12,450',
  totalValue: '13,280',
  totalYield: '6.7%',
  monthlyIncome: '540.20'
}

const holdings = [
  {
    id: 1,
    property: "Athens Apartment",
    location: "Kolonaki, Athens",
    tokensOwned: 50,
    totalTokens: 1000,
    percentage: 5.0,
    investedAmount: 1250,
    currentValue: 1340,
    monthlyRent: 28.50
  },
  {
    id: 2,
    property: "Thessaloniki Loft",
    location: "Ladadika, Thessaloniki",
    tokensOwned: 100,
    totalTokens: 800,
    percentage: 12.5,
    investedAmount: 1800,
    currentValue: 1920,
    monthlyRent: 78.40
  },
  {
    id: 3,
    property: "Crete Villa",
    location: "Chania, Crete",
    tokensOwned: 75,
    totalTokens: 1200,
    percentage: 6.25,
    investedAmount: 3375,
    currentValue: 3600,
    monthlyRent: 180.00
  },
  {
    id: 4,
    property: "Mykonos Hotel",
    location: "Mykonos Town, Mykonos",
    tokensOwned: 25,
    totalTokens: 2000,
    percentage: 1.25,
    investedAmount: 3000,
    currentValue: 3150,
    monthlyRent: 196.88
  },
  {
    id: 5,
    property: "Rhodes Apartment",
    location: "Old Town, Rhodes",
    tokensOwned: 60,
    totalTokens: 600,
    percentage: 10.0,
    investedAmount: 2100,
    currentValue: 2240,
    monthlyRent: 108.50
  }
]

export default function Portfolio() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
          <p className="text-muted-foreground mt-2">
            Track your real estate investments and earnings.
          </p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {walletData.balance} {walletData.currency}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available for investment</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{walletData.totalInvested}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Across {holdings.length} properties</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{walletData.totalValue}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">+{walletData.totalYield} total return</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{walletData.monthlyIncome}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From rent distributions</p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>
              Properties in your investment portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {holdings.map((holding) => {
                const profitLoss = holding.currentValue - holding.investedAmount
                const profitLossPercentage = ((profitLoss / holding.investedAmount) * 100).toFixed(1)
                
                return (
                  <div key={holding.id} className="border border-border/50 rounded-xl p-6 space-y-4 bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 transition-all duration-300 hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{holding.property}</h3>
                        <p className="text-sm text-muted-foreground">{holding.location}</p>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-center mt-2 sm:mt-0 border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                        {holding.percentage}% ownership
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tokens Owned</p>
                        <p className="font-semibold">{holding.tokensOwned}/{holding.totalTokens}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Invested</p>
                        <p className="font-semibold">€{holding.investedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="font-semibold">€{holding.currentValue.toLocaleString()}</p>
                        <p className={`text-xs font-medium ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {profitLoss >= 0 ? '+' : ''}€{profitLoss} ({profitLossPercentage}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Rent</p>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">€{holding.monthlyRent}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ownership</span>
                        <span>{holding.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div 
                          className="gradient-emerald rounded-full h-3 transition-all duration-500 shadow-sm"
                          style={{ width: `${holding.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}