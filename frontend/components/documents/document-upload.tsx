"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { apiService } from "@/lib/api"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadProps {
  onUploadComplete?: () => void
}

interface UploadingFile {
  file: File
  title: string
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const { toast } = useToast()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        progress: 0,
        status: "uploading" as const,
      }))

      setUploadingFiles((prev) => [...prev, ...newFiles])

      // Upload each file
      newFiles.forEach((uploadFile, index) => {
        uploadDocument(uploadFile, index + uploadingFiles.length)
      })
    },
    [uploadingFiles.length],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/rtf": [".rtf"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const uploadDocument = async (uploadFile: UploadingFile, index: number) => {
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f, i) => (i === index && f.progress < 90 ? { ...f, progress: f.progress + 10 } : f)),
        )
      }, 200)

      await apiService.uploadDocument(uploadFile.file, uploadFile.title)

      clearInterval(progressInterval)
      setUploadingFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress: 100, status: "success" } : f)))

      toast({
        title: "Success",
        description: `${uploadFile.title} uploaded successfully`,
      })

      onUploadComplete?.()
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : f,
        ),
      )

      toast({
        title: "Error",
        description: `Failed to upload ${uploadFile.title}`,
        variant: "destructive",
      })
    }
  }

  const updateTitle = (index: number, title: string) => {
    setUploadingFiles((prev) => prev.map((f, i) => (i === index ? { ...f, title } : f)))
  }

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Upload PDF, Word, Excel, text files, and more to your knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">Supports PDF, Word, Excel, text files (max 50MB each)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploading Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadingFiles.map((uploadFile, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium">{uploadFile.file.name}</span>
                    {uploadFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {uploadFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploadFile.status === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {uploadFile.status === "uploading" && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`title-${index}`} className="text-xs">
                        Title:
                      </Label>
                      <Input
                        id={`title-${index}`}
                        value={uploadFile.title}
                        onChange={(e) => updateTitle(index, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Progress value={uploadFile.progress} className="h-2" />
                  </div>
                )}

                {uploadFile.status === "error" && <p className="text-xs text-red-500">{uploadFile.error}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
