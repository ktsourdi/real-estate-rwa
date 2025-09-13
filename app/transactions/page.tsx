import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const transactions = [
  {
    id: 1,
    date: "2024-01-15",
    property: "Athens Apartment",
    type: "Buy",
    amount: "€1,250.00",
    tokens: 50,
    status: "completed"
  },
  {
    id: 2,
    date: "2024-01-14",
    property: "Thessaloniki Loft",
    type: "Buy",
    amount: "€1,800.00",
    tokens: 100,
    status: "completed"
  },
  {
    id: 3,
    date: "2024-01-10",
    property: "Athens Apartment",
    type: "Rent",
    amount: "€28.50",
    tokens: null,
    status: "completed"
  },
  {
    id: 4,
    date: "2024-01-08",
    property: "Crete Villa",
    type: "Buy",
    amount: "€3,375.00",
    tokens: 75,
    status: "completed"
  },
  {
    id: 5,
    date: "2024-01-05",
    property: "Mykonos Hotel",
    type: "Buy",
    amount: "€3,000.00",
    tokens: 25,
    status: "completed"
  },
  {
    id: 6,
    date: "2024-01-03",
    property: "Thessaloniki Loft",
    type: "Rent",
    amount: "€78.40",
    tokens: null,
    status: "completed"
  },
  {
    id: 7,
    date: "2024-01-01",
    property: "Rhodes Apartment",
    type: "Buy",
    amount: "€2,100.00",
    tokens: 60,
    status: "pending"
  },
  {
    id: 8,
    date: "2023-12-28",
    property: "Crete Villa",
    type: "Rent",
    amount: "€180.00",
    tokens: null,
    status: "completed"
  },
  {
    id: 9,
    date: "2023-12-25",
    property: "Mykonos Hotel",
    type: "Rent",
    amount: "€196.88",
    tokens: null,
    status: "completed"
  },
  {
    id: 10,
    date: "2023-12-22",
    property: "Rhodes Apartment",
    type: "Rent",
    amount: "€108.50",
    tokens: null,
    status: "completed"
  }
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Buy':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
    case 'Sell':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
    case 'Rent':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'failed':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default function Transactions() {
  const totalVolume = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount.replace('€', '').replace(',', '')), 0)

  const buyTransactions = transactions.filter(t => t.type === 'Buy' && t.status === 'completed')
  const rentTransactions = transactions.filter(t => t.type === 'Rent' && t.status === 'completed')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground mt-2">
            Complete history of your real estate investments and earnings.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{totalVolume.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {buyTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Property purchases</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {rentTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{Math.round(totalVolume / transactions.length).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              A complete record of all your property investments and rent earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border-separate border-spacing-0">
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Property</TableHead>
                    <TableHead className="font-semibold text-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-foreground">Tokens</TableHead>
                    <TableHead className="font-semibold text-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-200">
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.property}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{transaction.tokens ? transaction.tokens : '-'}</span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(transaction.status) as any} className="font-medium">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}