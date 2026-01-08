"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { clientsApi } from "@/lib/api"
import { ArrowLeft, Loader2, CheckCircle, UserPlus } from "lucide-react"
import Link from "next/link"

export default function AddClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [accessCode, setAccessCode] = useState("")

  // Basic info
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [language, setLanguage] = useState("")
  const [service, setService] = useState("")

  // Boat Lettering specific fields
  const [boatName, setBoatName] = useState("")
  const [hasDesign, setHasDesign] = useState("")
  const [boatLocation, setBoatLocation] = useState("")
  const [hullType, setHullType] = useState("")
  const [hullColor, setHullColor] = useState("")
  const [cabinColor, setCabinColor] = useState("")
  const [needNamesFront, setNeedNamesFront] = useState("")
  const [needNameStern, setNeedNameStern] = useState("")
  const [needNameCabinCap, setNeedNameCabinCap] = useState("")
  const [needBowDesign, setNeedBowDesign] = useState("")
  const [needNumbers, setNeedNumbers] = useState("")
  const [frontCapText, setFrontCapText] = useState("")
  const [backCapText, setBackCapText] = useState("")
  const [bowDesignDescription, setBowDesignDescription] = useState("")
  const [numbers, setNumbers] = useState("")
  const [numbersHeight, setNumbersHeight] = useState("")
  const [hasBoatPhotos, setHasBoatPhotos] = useState("")
  const [needInstall, setNeedInstall] = useState("")
  const [installLocation, setInstallLocation] = useState("")

  // Generic
  const [additionalInfo, setAdditionalInfo] = useState("")

  const serviceTypes = [
    "Stickers",
    "Boat Lettering",
    "Vehicle Lettering",
    "Logo Design",
    "Car Magnets",
    "Drone Photography",
    "Other"
  ]

  const languages = ["English", "French"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate required fields
      if (!name || !service) {
        setError("Please fill in Name and Service Type")
        setLoading(false)
        return
      }

      // Prepare client data
      const clientData: Record<string, any> = {
        name,
        email,
        phone,
        company,
        language,
        service,
        additionalInfo
      }

      // Add Boat Lettering specific fields
      if (service === "Boat Lettering") {
        clientData.boatName = boatName
        clientData.hasDesign = hasDesign
        clientData.boatLocation = boatLocation
        clientData.hullType = hullType
        clientData.hullColor = hullColor
        clientData.cabinColor = cabinColor
        clientData.needNamesFront = needNamesFront
        clientData.needNameStern = needNameStern
        clientData.needNameCabinCap = needNameCabinCap
        clientData.needBowDesign = needBowDesign
        clientData.needNumbers = needNumbers
        clientData.frontCapText = frontCapText
        clientData.backCapText = backCapText
        clientData.bowDesignDescription = bowDesignDescription
        clientData.numbers = numbers
        clientData.numbersHeight = numbersHeight
        clientData.hasBoatPhotos = hasBoatPhotos
        clientData.needInstall = needInstall
        clientData.installLocation = installLocation
      }

      console.log("Submitting client data:", clientData)

      const response = await clientsApi.addClient(clientData)

      if (response.success) {
        setAccessCode(response.accessCode.toString())
        setSuccess(true)

        // Redirect to client page after 3 seconds
        setTimeout(() => {
          router.push(`/dashboard/client/${response.accessCode}`)
        }, 3000)
      } else {
        setError(response.message || "Failed to create client")
      }
    } catch (err) {
      console.error("Error creating client:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create client"
      setError(errorMessage)

      // Show helpful message if it's a fetch error
      if (errorMessage.includes("Failed to fetch")) {
        setError("Cannot connect to Google Apps Script. Please make sure you've deployed the updated code.gs with POST support.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="bg-[#000050] text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#000050] mb-2">Client Created!</h2>
              <p className="text-gray-600 mb-4">
                Client has been successfully added to the system.
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Access Code</p>
                <p className="text-3xl font-bold text-[#000050]">{accessCode}</p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Redirecting to client page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/clients" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
        <p className="text-gray-600 mt-2">Create a new client entry with folders and brief</p>
      </div>

      <Card>
        <CardHeader className="bg-[#000050] text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Client Information
          </CardTitle>
          <CardDescription className="text-gray-200">
            Fill in the client details below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(123) 456-7890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company or Brand Name</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">
                    Service Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={service} onValueChange={setService} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((serviceType) => (
                        <SelectItem key={serviceType} value={serviceType}>
                          {serviceType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Boat Lettering Specific Fields */}
            {service === "Boat Lettering" && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Boat Lettering Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="boatName">Name of the Boat</Label>
                    <Input
                      id="boatName"
                      value={boatName}
                      onChange={(e) => setBoatName(e.target.value)}
                      placeholder="Enter boat name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hasDesign">Is there a design for the name already?</Label>
                    <Select value={hasDesign} onValueChange={setHasDesign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="boatLocation">Where is the boat from?</Label>
                    <Input
                      id="boatLocation"
                      value={boatLocation}
                      onChange={(e) => setBoatLocation(e.target.value)}
                      placeholder="e.g., Montreal, Quebec"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hullType">Hull Type</Label>
                    <Input
                      id="hullType"
                      value={hullType}
                      onChange={(e) => setHullType(e.target.value)}
                      placeholder="e.g., Fiberglass, Aluminum"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hullColor">Hull Color</Label>
                    <Input
                      id="hullColor"
                      value={hullColor}
                      onChange={(e) => setHullColor(e.target.value)}
                      placeholder="Enter hull color"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cabinColor">Cabin Color</Label>
                    <Input
                      id="cabinColor"
                      value={cabinColor}
                      onChange={(e) => setCabinColor(e.target.value)}
                      placeholder="Enter cabin color"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needNamesFront">Do you need the names in front?</Label>
                    <Select value={needNamesFront} onValueChange={setNeedNamesFront}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needNameStern">Do you need the name on the stern?</Label>
                    <Select value={needNameStern} onValueChange={setNeedNameStern}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needNameCabinCap">Do you need a name on the cabin's cap?</Label>
                    <Select value={needNameCabinCap} onValueChange={setNeedNameCabinCap}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needBowDesign">Do you need a bow design?</Label>
                    <Select value={needBowDesign} onValueChange={setNeedBowDesign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needNumbers">Do you need numbers?</Label>
                    <Select value={needNumbers} onValueChange={setNeedNumbers}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hasBoatPhotos">Do you have photos of your boat?</Label>
                    <Select value={hasBoatPhotos} onValueChange={setHasBoatPhotos}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="needInstall">Do you need install?</Label>
                    <Select value={needInstall} onValueChange={setNeedInstall}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installLocation">Location for install</Label>
                    <Input
                      id="installLocation"
                      value={installLocation}
                      onChange={(e) => setInstallLocation(e.target.value)}
                      placeholder="e.g., Grande-Entrée"
                    />
                  </div>
                </div>

                {/* Text fields for boat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frontCapText">What would you like on the front of the cabin's cap?</Label>
                    <Input
                      id="frontCapText"
                      value={frontCapText}
                      onChange={(e) => setFrontCapText(e.target.value)}
                      placeholder="Enter text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backCapText">What would you like on the back of the cabin's cap?</Label>
                    <Input
                      id="backCapText"
                      value={backCapText}
                      onChange={(e) => setBackCapText(e.target.value)}
                      placeholder="Enter text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numbers">What are the numbers?</Label>
                    <Input
                      id="numbers"
                      value={numbers}
                      onChange={(e) => setNumbers(e.target.value)}
                      placeholder="Enter numbers"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numbersHeight">Height of the numbers (in inches)</Label>
                    <Input
                      id="numbersHeight"
                      type="number"
                      value={numbersHeight}
                      onChange={(e) => setNumbersHeight(e.target.value)}
                      placeholder="e.g., 12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bowDesignDescription">What kind of bow design would you like?</Label>
                  <Textarea
                    id="bowDesignDescription"
                    value={bowDesignDescription}
                    onChange={(e) => setBowDesignDescription(e.target.value)}
                    placeholder="Describe the bow design you want..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Generic Additional Info */}
            {service && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Details</Label>
                  <Textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Any additional details, timeline requirements, or special requests..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#000050] hover:bg-[#000040]"
                disabled={loading || !name || !service}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Client...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Client folders will be created in Google Drive</li>
            <li>• A project brief document will be generated</li>
            <li>• An access code will be assigned for tracking</li>
            <li>• The client will appear in your client list</li>
            <li>• You can share the upload link with the client for files</li>
          </ul>
        </CardContent>
      </Card>

      {error && error.includes("Google Apps Script") && (
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Deployment Required</h4>
            <p className="text-sm text-yellow-800 mb-2">
              Make sure you've deployed the updated code.gs with POST support:
            </p>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Open your Google Apps Script project</li>
              <li>Copy the updated code.gs content</li>
              <li>Click "Deploy" → "New deployment"</li>
              <li>Type: "Web app", Execute as: "Me", Who has access: "Anyone"</li>
              <li>Click "Deploy"</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
