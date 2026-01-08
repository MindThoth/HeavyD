"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Upload,
  Camera,
  CheckCircle,
  ArrowLeft,
  Receipt,
  AlertTriangle,
  Crop,
  RotateCcw,
  Palette,
  Plus,
  Eye,
  DollarSign,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { expenseApi, type Expense } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCache } from "@/app/providers/cache-provider"

interface ExtractedData {
  date: string
  vendor: string
  total: string
  category: string
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "view">("upload")
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [editedImagePreview, setEditedImagePreview] = useState<string>("")
  const [imageBase64, setImageBase64] = useState<string>("")
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    date: "",
    vendor: "",
    total: "",
    category: "",
  })
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [useManualEntry, setUseManualEntry] = useState(false)

  // Image editing states
  const [isEditing, setIsEditing] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isGrayscale, setIsGrayscale] = useState(false)
  const [imageQuality, setImageQuality] = useState(0.8)

  // Expense viewing states
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cache = useCache()

  const categories = ["Office Supplies", "Packaging", "Equipment", "Gas", "Food", "Other"]
  const webhookUrl = process.env.NEXT_PUBLIC_GAS_ENDPOINT || ""

  // Load expenses when viewing tab
  useEffect(() => {
    if (activeTab === "view") {
      loadExpenses()
    }
  }, [activeTab])

  const loadExpenses = async () => {
    try {
      // Check cache first
      const cachedExpenses = cache.get<{ expenses: Expense[], totalExpenses: number }>('expenses_data')
      if (cachedExpenses) {
        setExpenses(cachedExpenses.expenses)
        setTotalExpenses(cachedExpenses.totalExpenses)
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await expenseApi.getAllExpenses()
      if (response.success) {
        setExpenses(response.expenses)
        setTotalExpenses(response.totalExpenses)
        cache.set('expenses_data', { expenses: response.expenses, totalExpenses: response.totalExpenses })
      }
    } catch (error) {
      console.error("Error loading expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  // Convert file to base64
  const convertImageToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(",")[1]
        resolve(base64Data)
      }
      reader.onerror = (error) => reject(error)
    })

  // Compress and process image
  const processImageFile = (file: File, quality = 0.8, grayscale = false): Promise<string> =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = document.createElement("img")

      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }

      img.onload = () => {
        try {
          const maxSize = 1200
          let { width, height } = img

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          if (grayscale) {
            const imageData = ctx.getImageData(0, 0, width, height)
            const data = imageData.data

            for (let i = 0; i < data.length; i += 4) {
              const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
              data[i] = gray
              data[i + 1] = gray
              data[i + 2] = gray
            }

            ctx.putImageData(imageData, 0, 0)
          }

          const dataUrl = canvas.toDataURL("image/jpeg", quality)
          const base64Data = dataUrl.split(",")[1]

          URL.revokeObjectURL(img.src)
          resolve(base64Data)
        } catch (error) {
          console.error("Error processing image:", error)
          reject(new Error("Failed to process image"))
        }
      }

      img.onerror = (error) => {
        console.error("Error loading image:", error)
        reject(new Error("Failed to load image for processing"))
      }

      img.crossOrigin = "anonymous"
      img.src = URL.createObjectURL(file)
    })

  // Crop image
  const cropImage = useCallback(
    (imageSrc: string, cropArea: CropArea): Promise<string> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = document.createElement("img")

        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }

        img.onload = () => {
          try {
            const displayRect = imageRef.current?.getBoundingClientRect()
            if (!displayRect) {
              reject(new Error("Image reference not available"))
              return
            }

            const scaleX = img.naturalWidth / displayRect.width
            const scaleY = img.naturalHeight / displayRect.height

            const actualCropX = cropArea.x * scaleX
            const actualCropY = cropArea.y * scaleY
            const actualCropWidth = cropArea.width * scaleX
            const actualCropHeight = cropArea.height * scaleY

            canvas.width = actualCropWidth
            canvas.height = actualCropHeight

            ctx.clearRect(0, 0, actualCropWidth, actualCropHeight)
            ctx.drawImage(
              img,
              actualCropX,
              actualCropY,
              actualCropWidth,
              actualCropHeight,
              0,
              0,
              actualCropWidth,
              actualCropHeight
            )

            if (isGrayscale) {
              const imageData = ctx.getImageData(0, 0, actualCropWidth, actualCropHeight)
              const data = imageData.data

              for (let i = 0; i < data.length; i += 4) {
                const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
                data[i] = gray
                data[i + 1] = gray
                data[i + 2] = gray
              }

              ctx.putImageData(imageData, 0, 0)
            }

            const dataUrl = canvas.toDataURL("image/jpeg", imageQuality)
            URL.revokeObjectURL(img.src)
            resolve(dataUrl)
          } catch (error) {
            console.error("Error cropping image:", error)
            reject(new Error("Failed to crop image"))
          }
        }

        img.onerror = () => reject(new Error("Failed to load image for cropping"))
        img.crossOrigin = "anonymous"
        img.src = imageSrc
      })
    },
    [isGrayscale, imageQuality]
  )

  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
        setEditedImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError("")
      setUseManualEntry(false)
    } else {
      setError("Please upload a valid image file")
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      processFile(imageFile)
    } else {
      setError("Please drop a valid image file")
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setDragStart({ x, y })
    setCropArea({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCropArea({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const applyCrop = async () => {
    if (!imagePreview || cropArea.width < 10 || cropArea.height < 10) {
      setError("Please select a larger area to crop")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      const croppedImage = await cropImage(imagePreview, cropArea)
      setEditedImagePreview(croppedImage)
      setIsEditing(false)
      setCropArea({ x: 0, y: 0, width: 100, height: 100 })
    } catch (err) {
      console.error("Crop error:", err)
      setError("Failed to crop image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleGrayscale = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    setError("")

    try {
      const newGrayscale = !isGrayscale
      setIsGrayscale(newGrayscale)

      const processedBase64 = await processImageFile(uploadedImage, imageQuality, newGrayscale)
      const dataUrl = `data:image/jpeg;base64,${processedBase64}`
      setEditedImagePreview(dataUrl)
    } catch (err) {
      console.error("Grayscale toggle error:", err)
      setError("Failed to process image. Please try again.")
      setIsGrayscale(isGrayscale)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQualityChange = async (quality: number) => {
    if (!uploadedImage) return

    setImageQuality(quality)
    setIsProcessing(true)
    setError("")

    try {
      const processedBase64 = await processImageFile(uploadedImage, quality, isGrayscale)
      const dataUrl = `data:image/jpeg;base64,${processedBase64}`
      setEditedImagePreview(dataUrl)
    } catch (err) {
      console.error("Quality change error:", err)
      setError("Failed to adjust image quality. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetImage = () => {
    setEditedImagePreview(imagePreview)
    setIsGrayscale(false)
    setImageQuality(0.8)
    setIsEditing(false)
    setCropArea({ x: 0, y: 0, width: 100, height: 100 })
  }

  const proceedToScan = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    setError("")

    try {
      let finalBase64: string

      if (editedImagePreview !== imagePreview && editedImagePreview.startsWith("data:image")) {
        finalBase64 = editedImagePreview.split(",")[1]
      } else {
        finalBase64 = await processImageFile(uploadedImage, imageQuality, isGrayscale)
      }

      setImageBase64(finalBase64)
      setStep(3)
    } catch (err) {
      console.error("Process final image error:", err)
      setError("Failed to process image. Please try again or go back to adjust settings.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScanReceipt = async () => {
    if (!imageBase64) {
      setError("Please process the image first.")
      return
    }

    setIsScanning(true)
    setError("")

    try {
      console.log("Starting receipt extraction...")

      // Step 1: Upload image to Drive
      console.log("Step 1: Uploading image to Drive...")
      const uploadPayload = {
        mode: "upload_image",
        imageBase64: imageBase64,
        fileName: uploadedImage?.name || `receipt_${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      }

      const uploadResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(uploadPayload),
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: HTTP ${uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()

      if (uploadResult.error) {
        throw new Error(`Upload failed: ${uploadResult.error}`)
      }

      if (!uploadResult.imageUrl) {
        throw new Error("No image URL returned from upload")
      }

      console.log("Upload successful, image URL:", uploadResult.imageUrl)

      // Step 2: Extract data using the public Drive URL
      console.log("Step 2: Extracting data from image URL...")
      const extractPayload = {
        mode: "extract_url",
        imageUrl: uploadResult.imageUrl,
      }

      const extractResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(extractPayload),
      })

      if (!extractResponse.ok) {
        throw new Error(`Extraction failed: HTTP ${extractResponse.status}`)
      }

      const extractResult = await extractResponse.json()

      if (extractResult.error) {
        throw new Error(`Extraction failed: ${extractResult.error}`)
      }

      // Set extracted data
      setExtractedData({
        date: extractResult.date || new Date().toISOString().split("T")[0],
        vendor: extractResult.vendor || "",
        total: extractResult.total ? String(extractResult.total).replace(/[^0-9.]/g, "") : "",
        category: extractResult.category || "",
      })

      console.log("Extraction successful")
    } catch (err) {
      console.error("Complete scan error:", err)

      setUseManualEntry(true)
      setExtractedData({
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        total: "",
        category: "",
      })

      setError("Automatic scanning failed. Please enter the details manually.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleSaveToSheet = async () => {
    setIsSaving(true)
    setError("")

    try {
      if (!extractedData.date || !extractedData.vendor || !extractedData.total || !extractedData.category) {
        throw new Error("Please fill in all required fields")
      }

      const savePayload = {
        mode: "save_expense",
        date: extractedData.date,
        vendor: extractedData.vendor,
        total: Number.parseFloat(extractedData.total),
        category: extractedData.category,
        imageBase64: imageBase64,
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(savePayload),
      })

      if (!response.ok) {
        throw new Error(`Save failed: HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`Save failed: ${result.error}`)
      }

      console.log("Save operation completed successfully")
      setSuccess(true)
      setTimeout(() => {
        resetForm()
        setActiveTab("view")
        loadExpenses()
      }, 2000)
    } catch (err) {
      console.error("Save error:", err)
      setError(err instanceof Error ? err.message : "Failed to save to sheet")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setUploadedImage(null)
    setImagePreview("")
    setEditedImagePreview("")
    setImageBase64("")
    setExtractedData({ date: "", vendor: "", total: "", category: "" })
    setError("")
    setSuccess(false)
    setIsDragOver(false)
    setUseManualEntry(false)
    setIsEditing(false)
    setIsGrayscale(false)
    setImageQuality(0.8)
    setCropArea({ x: 0, y: 0, width: 100, height: 100 })
  }

  const updateExtractedData = (field: keyof ExtractedData, value: string) => {
    setExtractedData((prev) => ({ ...prev, [field]: value }))
  }

  const formatDateTime = (dateTimeStr: string | Date): string => {
    if (!dateTimeStr) return '-'

    // If it's already a string in the correct format, return it
    if (typeof dateTimeStr === 'string') {
      // Check if it matches "YYYY-MM-DD H:MM" or "YYYY-MM-DD HH:MM"
      if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/)) {
        return dateTimeStr
      }
      // Check if it's just a date without time
      if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateTimeStr + ' 00:00'
      }
    }

    // Try to parse as Date object
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return String(dateTimeStr) || '-'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
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
              <h2 className="text-2xl font-bold text-[#000050] mb-2">Success!</h2>
              <p className="text-gray-600 mb-6">
                Your expense has been saved to Google Sheets and the receipt has been stored in Google Drive.
              </p>
              <Button onClick={() => {
                resetForm()
                setSuccess(false)
              }} className="w-full bg-[#000050] hover:bg-[#000040] text-white">
                Add Another Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
        <p className="text-gray-600 mt-2">Upload receipts and track expenses</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "view")} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload Receipt
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {step === 1 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-[#000050] text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold">Upload Your Receipt</CardTitle>
                <CardDescription className="text-gray-200">
                  Snap a photo or upload an image of your receipt. We'll help you optimize it for better scanning.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="receipt-upload" className="text-sm font-medium text-[#000050]">
                    Receipt Image *
                  </Label>

                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                      isDragOver
                        ? "border-[#000050] bg-[#000050]/5 scale-105"
                        : "border-gray-300 hover:border-[#000050] hover:bg-gray-50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        <div
                          className={`p-3 rounded-full transition-colors ${
                            isDragOver ? "bg-[#000050] text-white" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Upload className="h-8 w-8" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className={`text-lg font-medium ${isDragOver ? "text-[#000050]" : "text-gray-700"}`}>
                          {isDragOver ? "Drop your receipt here" : "Drag & drop your receipt"}
                        </p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                      </div>

                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#000050]">Preview</Label>
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={imagePreview}
                        alt="Receipt preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{uploadedImage?.name}</span>
                      <span>{uploadedImage ? (uploadedImage.size / 1024 / 1024).toFixed(1) + " MB" : ""}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => setStep(2)}
                  disabled={!uploadedImage}
                  className="w-full bg-[#000050] hover:bg-[#000040] text-white py-3 text-lg"
                >
                  <Crop className="mr-2 h-5 w-5" />
                  Edit & Optimize Image
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-[#000050] text-white rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="p-2 text-white hover:bg-[#000040]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-xl font-bold">Edit & Optimize</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-[#000050]">Image Preview</Label>

                  <div className="relative">
                    <div
                      className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
                      onMouseDown={isEditing ? handleMouseDown : undefined}
                      onMouseMove={isEditing ? handleMouseMove : undefined}
                      onMouseUp={isEditing ? handleMouseUp : undefined}
                      style={{ cursor: isEditing ? "crosshair" : "default" }}
                    >
                      <img
                        ref={imageRef}
                        src={editedImagePreview}
                        alt="Receipt preview"
                        className={`w-full h-full object-contain ${isGrayscale ? "grayscale" : ""}`}
                        draggable={false}
                      />

                      {isEditing && cropArea.width > 0 && cropArea.height > 0 && (
                        <div
                          className="absolute border-2 border-[#000050] bg-[#000050]/20"
                          style={{
                            left: cropArea.x,
                            top: cropArea.y,
                            width: cropArea.width,
                            height: cropArea.height,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant={isEditing ? "default" : "outline"}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      <Crop className="mr-2 h-4 w-4" />
                      {isEditing ? "Cancel Crop" : "Crop Image"}
                    </Button>

                    <Button
                      onClick={toggleGrayscale}
                      variant={isGrayscale ? "default" : "outline"}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      {isGrayscale ? "Color" : "B&W"}
                    </Button>
                  </div>

                  {isEditing && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Click and drag to select the area you want to keep</p>
                      <Button
                        onClick={applyCrop}
                        disabled={cropArea.width < 10 || cropArea.height < 10 || isProcessing}
                        className="w-full bg-[#000050] hover:bg-[#000040] text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crop className="mr-2 h-4 w-4" />
                            Apply Crop
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#000050]">
                      Image Quality: {Math.round(imageQuality * 100)}%
                    </Label>
                    <input
                      type="range"
                      min="0.3"
                      max="1"
                      step="0.1"
                      value={imageQuality}
                      onChange={(e) => handleQualityChange(Number.parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={isProcessing}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Smaller file</span>
                      <span>Better quality</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={resetImage}
                      variant="outline"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>

                    <Button
                      onClick={proceedToScan}
                      className="w-full bg-[#000050] hover:bg-[#000040] text-white"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Receipt className="mr-2 h-4 w-4" />
                          Scan Receipt
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-[#000050] text-white rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="p-2 text-white hover:bg-[#000040]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-xl font-bold">
                    {useManualEntry ? "Enter Receipt Details" : "Confirm Receipt Details"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {useManualEntry && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Automatic scanning is temporarily unavailable. Please enter the receipt details manually.
                    </AlertDescription>
                  </Alert>
                )}

                {editedImagePreview && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#000050]">Processed Receipt Image</Label>
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={editedImagePreview}
                        alt="Processed receipt preview"
                        fill
                        className={`object-contain ${isGrayscale ? "grayscale" : ""}`}
                      />
                    </div>
                  </div>
                )}

                {!extractedData.vendor && !useManualEntry && (
                  <Button
                    onClick={handleScanReceipt}
                    disabled={isScanning}
                    className="w-full bg-[#000050] hover:bg-[#000040] text-white py-3 text-lg"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scanning Receipt...
                      </>
                    ) : (
                      <>
                        <Receipt className="mr-2 h-5 w-5" />
                        Extract Data from Receipt
                      </>
                    )}
                  </Button>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-[#000050]">
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={extractedData.date}
                      onChange={(e) => updateExtractedData("date", e.target.value)}
                      required
                      className="border-2 border-gray-200 focus:border-[#000050]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor" className="text-sm font-medium text-[#000050]">
                      Vendor
                    </Label>
                    <Input
                      id="vendor"
                      type="text"
                      value={extractedData.vendor}
                      onChange={(e) => updateExtractedData("vendor", e.target.value)}
                      placeholder="Enter vendor name"
                      required
                      className="border-2 border-gray-200 focus:border-[#000050]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total" className="text-sm font-medium text-[#000050]">
                      Total Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        $
                      </span>
                      <Input
                        id="total"
                        type="number"
                        step="0.01"
                        value={extractedData.total}
                        onChange={(e) => updateExtractedData("total", e.target.value)}
                        placeholder="0.00"
                        className="pl-8 border-2 border-gray-200 focus:border-[#000050]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-[#000050]">
                      Category
                    </Label>
                    <Select
                      value={extractedData.category}
                      onValueChange={(value) => updateExtractedData("category", value)}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-[#000050]">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSaveToSheet}
                  disabled={
                    isSaving ||
                    !extractedData.date ||
                    !extractedData.vendor ||
                    !extractedData.total ||
                    !extractedData.category
                  }
                  className="w-full bg-[#000050] hover:bg-[#000040] text-white py-3 text-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving to Sheet...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Save to Sheet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Expenses</CardTitle>
                  <CardDescription>View and manage your business expenses</CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-2xl font-bold text-[#000050]">
                    <DollarSign className="h-6 w-6" />
                    {totalExpenses.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Total Expenses</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#000050]" />
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No expenses found</p>
                  <Button
                    onClick={() => setActiveTab("upload")}
                    className="mt-4 bg-[#000050] hover:bg-[#000040]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Expense
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((expense, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900">{formatDateTime(expense.date)}</td>
                            <td className="py-3 px-4 text-gray-900">{expense.vendor}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {expense.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">
                              ${parseFloat(expense.total).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {expense.imageLink && expense.imageLink !== "Image not found in Temp" ? (
                                <a
                                  href={expense.imageLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#000050] hover:underline"
                                >
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
