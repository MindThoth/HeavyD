"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, Clock, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { clientsApi, expenseApi } from "@/lib/api"
import { Client } from "@/lib/api"
import { BoatLoading } from "@/components/ui/boat-loading"

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load clients
      const clientsResponse = await clientsApi.getAllClients()
      const clientsData = clientsResponse.clients || []
      setClients(clientsData)

      // Calculate revenue from clients
      const totalRevenue = clientsData
        .filter((c) => c.price)
        .reduce((sum, c) => {
          const price = parseFloat(c.price.replace(/[^0-9.-]+/g, ""))
          return sum + (isNaN(price) ? 0 : price)
        }, 0)

      // Load expenses
      let totalExpenses = 0
      try {
        const expensesResponse = await expenseApi.getAllExpenses()
        totalExpenses = expensesResponse.totalExpenses || 0
      } catch (error) {
        console.error("Error loading expenses:", error)
      }

      // Calculate stats
      const activeProjects = clientsData.filter(
        (c) => c.status === "In Progress" || c.status === "Estimate Ready"
      ).length
      const completedProjects = clientsData.filter(
        (c) => c.status === "Completed" || c.status === "Paid"
      ).length

      setStats({
        totalClients: clientsData.length,
        activeProjects,
        completedProjects,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const openExpenseSheet = () => {
    window.open("https://docs.google.com/spreadsheets/d/1g_F1nDhv_lLrEWarvRa0gU_0Tulq30AxBL6-o-VbWWg", "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BoatLoading size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All registered clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Finished projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total project value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalExpenses.toFixed(2)}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={openExpenseSheet}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Expenses
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${stats.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
          <CardDescription>Your most recent client projects</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No clients found. Set up your Google Apps Script endpoint to load client data.
            </p>
          ) : (
            <div className="space-y-4">
              {clients.slice(0, 5).map((client) => (
                <Link
                  key={client.accessCode}
                  href={`/dashboard/client/${client.accessCode}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-600">{client.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{client.status}</p>
                    <p className="text-sm text-gray-600">{client.service}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
