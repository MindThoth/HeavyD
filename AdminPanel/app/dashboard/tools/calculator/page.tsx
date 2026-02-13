"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator, Plus, Trash2, DollarSign } from "lucide-react"
import { calculatorApi, ServicePrice } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface CalculationItem {
  id: string
  service: string
  height: number
  width: number
  quantity: number
  totalSqInches: number
  materialCost: number
  printingCost: number
  totalCost: number
  suggestedPrice: number
  profit: number
}

export default function CalculatorPage() {
  const [service, setService] = useState("Vinyl Paper w/ Laminate")
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [multiplier, setMultiplier] = useState("4")
  const [items, setItems] = useState<CalculationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([])
  const [loadingPrices, setLoadingPrices] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadServicePrices()
  }, [])

  // Get available services from loaded prices
  const getAvailableServices = () => {
    return servicePrices.map(s => s.name)
  }

  const loadServicePrices = async () => {
    try {
      setLoadingPrices(true)
      const response = await calculatorApi.getCalculatorData()
      console.log("[Calculator] Response:", response)
      if (response.success && response.data) {
        console.log("[Calculator] Services data:", response.data.services)
        const services = response.data.services || []
        setServicePrices(services)

        // Set default service to first available service
        if (services.length > 0) {
          setService(services[0].name)
        }
      }
    } catch (error: any) {
      console.error("[Calculator] Error loading service prices:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load service prices",
        variant: "destructive"
      })
    } finally {
      setLoadingPrices(false)
    }
  }

  const calculatePrice = () => {
    if (!height || !width) {
      toast({
        title: "Error",
        description: "Please enter height and width",
        variant: "destructive"
      })
      return
    }

    // Find the service price from loaded data
    const servicePrice = servicePrices.find(s => s.name === service)

    if (!servicePrice) {
      toast({
        title: "Error",
        description: "Service pricing not found. Please wait for prices to load.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      const heightNum = parseFloat(height)
      const widthNum = parseFloat(width)
      const quantityNum = parseInt(quantity)
      const multiplierNum = parseFloat(multiplier)

      // Calculate total square inches
      const totalSqInches = heightNum * widthNum * quantityNum

      // Calculate costs using loaded service prices
      const materialCost = servicePrice.costPerSqIn * totalSqInches
      const totalCost = materialCost

      // Calculate suggested price using multiplier
      const suggestedPrice = servicePrice.pricePerSqIn * totalSqInches * multiplierNum

      // Calculate profit
      const profit = suggestedPrice - totalCost

      const newItem: CalculationItem = {
        id: Date.now().toString(),
        service,
        height: heightNum,
        width: widthNum,
        quantity: quantityNum,
        totalSqInches,
        materialCost,
        printingCost: 0, // No separate printing cost in new pricing model
        totalCost,
        suggestedPrice,
        profit
      }

      setItems([...items, newItem])
      toast({
        title: "Success",
        description: "Price calculated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate price",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const getTotals = () => {
    return items.reduce((acc, item) => ({
      totalCost: acc.totalCost + item.totalCost,
      suggestedPrice: acc.suggestedPrice + item.suggestedPrice,
      profit: acc.profit + item.profit
    }), { totalCost: 0, suggestedPrice: 0, profit: 0 })
  }

  const totals = getTotals()

  return (
    <div className="space-y-6">
      <Toaster />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pricing Calculator</h1>
        <p className="text-gray-600 mt-2">Calculate prices for stickers and vinyl work</p>
      </div>

      {/* Service Prices Display */}
      <Card>
        <CardHeader>
          <CardTitle>Service Pricing (Per Square Inch)</CardTitle>
          <CardDescription>Loaded from Price sheet - Verify pricing data</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPrices ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000050]"></div>
            </div>
          ) : servicePrices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {servicePrices.map((servicePrice, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <p className="font-medium text-gray-900 mb-2">{servicePrice.name}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Our Cost:</span>
                      <span className="font-medium text-orange-600">
                        ${typeof servicePrice.costPerSqIn === 'number' ? servicePrice.costPerSqIn.toFixed(4) : servicePrice.costPerSqIn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client Price:</span>
                      <span className="font-medium text-green-600">
                        ${typeof servicePrice.pricePerSqIn === 'number' ? servicePrice.pricePerSqIn.toFixed(4) : servicePrice.pricePerSqIn}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No service prices loaded</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calculate Price</CardTitle>
            <CardDescription>Enter dimensions to calculate pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service Type</Label>
                <Select value={service} onValueChange={setService} disabled={loadingPrices || servicePrices.length === 0}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder={loadingPrices ? "Loading..." : "Select service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {servicePrices.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="multiplier">Price Multiplier</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Default: 4x (suggested retail markup)
              </p>
            </div>

            {service && servicePrices.find(s => s.name === service) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Current Service Pricing:</p>
                <div className="text-xs text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Cost per sq in:</span>
                    <span className="font-medium">${servicePrices.find(s => s.name === service)?.costPerSqIn.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base price per sq in:</span>
                    <span className="font-medium">${servicePrices.find(s => s.name === service)?.pricePerSqIn.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={calculatePrice}
              disabled={loading || loadingPrices || servicePrices.length === 0}
              className="w-full bg-[#000050] hover:bg-blue-800"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? "Calculating..." : "Calculate & Add"}
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Total for all items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium">${totals.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Suggested Price:</span>
                <span className="font-medium text-green-600">
                  ${totals.suggestedPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-900 font-medium">Profit:</span>
                <span className="font-bold text-green-600">
                  ${totals.profit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Badge variant="outline" className="w-full justify-center">
                {items.length} item(s) in cart
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calculated Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.service}</p>
                    <p className="text-sm text-gray-600">
                      {item.height}" × {item.width}" × {item.quantity} qty = {item.totalSqInches.toFixed(2)} sq in
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cost: ${item.totalCost.toFixed(2)}</p>
                      <p className="font-medium text-green-600">Price: ${item.suggestedPrice.toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
