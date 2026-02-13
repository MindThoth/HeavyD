"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, File, CheckCircle, AlertCircle, X, ExternalLink } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface FileUploadZoneProps {
  uploadFolderLink: string
  onUploadComplete?: (files: string[]) => void
}

interface UploadingFile {
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  error?: string
}

export function FileUploadZone({ uploadFolderLink, onUploadComplete }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const { t } = useLanguage()

  const extractFolderIdFromUrl = (url: string): string | null => {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  const uploadFileToGoogleDrive = async (file: File, folderId: string): Promise<void> => {
    // Convert file to base64 for Google Apps Script
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.readAsDataURL(file)
    })

    const requestData = {
      action: "uploadFile",
      folderId: folderId,
      fileName: file.name,
      fileData: base64Data,
      mimeType: file.type,
      fileSize: file.size.toString(),
    }

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(requestData),
      },
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "Upload failed")
    }

    return result
  }

  const handleFiles = useCallback(
    async (files: FileList) => {
      const folderId = extractFolderIdFromUrl(uploadFolderLink)
      if (!folderId) {
        alert("Invalid upload folder link. Please contact support.")
        return
      }

      const newUploadingFiles: UploadingFile[] = Array.from(files).map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }))

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

      // Upload files one by one
      for (let i = 0; i < newUploadingFiles.length; i++) {
        const uploadingFile = newUploadingFiles[i]

        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.file === uploadingFile.file && f.status === "uploading"
                  ? { ...f, progress: Math.min(f.progress + 10, 90) }
                  : f,
              ),
            )
          }, 200)

          await uploadFileToGoogleDrive(uploadingFile.file, folderId)

          clearInterval(progressInterval)

          // Mark as completed
          setUploadingFiles((prev) =>
            prev.map((f) => (f.file === uploadingFile.file ? { ...f, progress: 100, status: "completed" } : f)),
          )
        } catch (error) {
          // Mark as error
          setUploadingFiles((prev) =>
            prev.map((f) => (f.file === uploadingFile.file ? { ...f, status: "error", error: error.message } : f)),
          )
        }
      }

      // Call completion callback
      const completedFiles = newUploadingFiles.filter((f) => f.status === "completed").map((f) => f.file.name)

      if (completedFiles.length > 0 && onUploadComplete) {
        onUploadComplete(completedFiles)
      }
    },
    [uploadFolderLink, onUploadComplete],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
      // Reset input
      e.target.value = ""
    },
    [handleFiles],
  )

  const removeFile = (fileToRemove: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== fileToRemove))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`transition-all duration-200 ${
          isDragOver
            ? "border-[#000050] border-2 border-dashed bg-blue-50"
            : "border-2 border-dashed border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? "text-[#000050]" : "text-gray-400"}`} />
          <p className={`text-lg font-medium mb-2 ${isDragOver ? "text-[#000050]" : "text-gray-900"}`}>
            {isDragOver ? t("upload.dropHere") : t("upload.dragDrop")}
          </p>
          <p className="text-gray-600 mb-4">{t("upload.orClick")}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <label htmlFor="file-upload">
              <Button
                type="button"
                className="bg-[#000050] hover:bg-blue-800 text-white cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("upload.chooseFiles")}
              </Button>
            </label>

            <span className="text-gray-500">{t("upload.or")}</span>

            <Button
              variant="outline"
              onClick={() => window.open(uploadFolderLink, "_blank")}
              className="bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("upload.openFolder")}
            </Button>
          </div>

          <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileInput} accept="*/*" />

          <p className="text-xs text-gray-500 mt-4">{t("upload.supportedFiles")}</p>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">{t("upload.fileUploads")}</h4>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {uploadingFile.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : uploadingFile.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <File className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{uploadingFile.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadingFile.file.size)}</p>

                    {uploadingFile.status === "uploading" && (
                      <Progress value={uploadingFile.progress} className="mt-2 h-2" />
                    )}

                    {uploadingFile.status === "error" && (
                      <p className="text-xs text-red-600 mt-1">{uploadingFile.error || t("upload.failed")}</p>
                    )}

                    {uploadingFile.status === "completed" && (
                      <p className="text-xs text-green-600 mt-1">{t("upload.completed")}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadingFile.file)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
