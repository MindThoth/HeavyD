"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Download, MessageSquare, RefreshCw, ImageIcon, AlertCircle } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { translations } from "@/lib/translations"

interface RevisionImage {
  id: string
  name: string
  url: string
  fullUrl?: string
  directUrl?: string
  viewUrl?: string
  mimeType: string
  size: number
  lastModified: string
}

interface RevisionGalleryProps {
  revisionFolderLink: string
  clientData: {
    name: string
    company: string
    email: string
    service: string
    accessCode: string
  }
}

export function RevisionGallery({ revisionFolderLink, clientData }: RevisionGalleryProps) {
  const { language } = useLanguage()
  const t = translations[language]

  const [images, setImages] = useState<RevisionImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<RevisionImage | null>(null)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)

  // Use the same script URL as the main app
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

  const fetchImages = async () => {
    if (!revisionFolderLink) {
      setError(t.revisions?.noFolderLink || "No folder link provided")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("🖼️ Fetching images from folder:", revisionFolderLink)
      console.log("🔗 Using script URL:", SCRIPT_URL)

      // Use getFolderImages action with folderLink parameter
      const fetchUrl = `${SCRIPT_URL}?action=getFolderImages&folderLink=${encodeURIComponent(revisionFolderLink)}`
      console.log("📡 Full fetch URL:", fetchUrl)

      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response ok:", response.ok)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📡 API Response:", data)

      if (data.success) {
        const imageList = data.images || []
        setImages(imageList)
        console.log(`✅ Successfully loaded ${imageList.length} images`)
      } else {
        throw new Error(data.message || t.revisions?.fetchError || "Failed to fetch images")
      }
    } catch (err) {
      console.error("❌ Error fetching images:", err)

      // Provide more specific error messages
      let errorMessage = t.revisions?.fetchError || "Failed to fetch images"

      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else if (err.message.includes("HTTP error")) {
          errorMessage = `Server error: ${err.message}. Please try again later.`
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (revisionFolderLink) {
      fetchImages()
    }
  }, [revisionFolderLink])

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !selectedImage) return

    setSubmittingComment(true)
    setCommentSuccess(false)

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "comment",
          name: clientData.name,
          company: clientData.company,
          service: clientData.service,
          email: clientData.email,
          comment: comment.trim(),
          imageUrl: selectedImage.url,
          accessCode: clientData.accessCode,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setComment("")
          setSelectedImage(null)
          setCommentSuccess(true)
          setTimeout(() => setCommentSuccess(false), 3000)
        } else {
          throw new Error(result.message || "Failed to submit comment")
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (err) {
      console.error("❌ Error submitting comment:", err)
      alert(err instanceof Error ? err.message : t.revisions?.submitError || "Failed to submit comment")
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  if (!revisionFolderLink) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">{t.revisions?.loading || "Loading images..."}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <Button onClick={fetchImages} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.revisions?.retry || "Try Again"}
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 mb-2">{t.revisions?.noImages || "No design revisions available yet"}</p>
            <p className="text-sm text-gray-500">{t.revisions?.checkBack || "Check back later for updates"}</p>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {t.revisions?.found?.replace("{count}", images.length.toString()) ||
                  `Found ${images.length} revision(s)`}
              </p>
              <Button onClick={fetchImages} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.revisions?.refresh || "Refresh"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-gray-100">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.name}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                      onError={(e) => {
                        console.error(`Failed to load image: ${image.name}`)
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex items-center justify-center h-full">
                              <div class="text-center">
                                <svg class="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-xs text-gray-500">Image unavailable</p>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm mb-1 truncate" title={image.name}>
                      {image.name}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(image.size)}</span>
                      <span>{formatDate(image.lastModified)}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-transparent"
                        onClick={() => setSelectedImage(image)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {t.revisions?.comment || "Comment"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = image.directUrl || image.url
                          link.download = image.name
                          link.target = "_blank"
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Comment Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {t.revisions?.commentOn || "Comment on"}: {selectedImage.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(null)
                      setComment("")
                    }}
                  >
                    ✕
                  </Button>
                </div>

                <div className="mb-4">
                  <img
                    src={selectedImage.url || "/placeholder.svg"}
                    alt={selectedImage.name}
                    className="w-full max-h-64 object-contain rounded-lg bg-gray-100"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium mb-2">
                      {t.revisions?.yourComment || "Your Comment"}
                    </label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t.revisions?.commentPlaceholder || "Share your feedback on this design..."}
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  {commentSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        {t.revisions?.commentSuccess || "Comment submitted successfully!"}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!comment.trim() || submittingComment}
                      className="flex-1"
                    >
                      {submittingComment ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t.revisions?.submitting || "Submitting..."}
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t.revisions?.submitComment || "Submit Comment"}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null)
                        setComment("")
                      }}
                    >
                      {t.common?.cancel || "Cancel"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
