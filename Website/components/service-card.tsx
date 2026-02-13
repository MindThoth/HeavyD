"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"

interface ServiceCardProps {
  id: string
  title: string
  description: string
  featured: boolean
  icon: LucideIcon
  imageUrl?: string
  popularText?: string
  getQuoteText?: string
  onGetQuote?: () => void
}

export function ServiceCard({
  id,
  title,
  description,
  featured,
  icon: Icon,
  imageUrl = "/placeholder.png",
  popularText = "Popular",
  getQuoteText = "Get a Quote",
  onGetQuote,
}: ServiceCardProps) {
  return (
    <Card
      className={`relative overflow-hidden hover:shadow-lg transition-shadow duration-300 ${
        featured ? "ring-2 ring-[#000050]" : ""
      }`}
    >
      {featured && <Badge className="absolute top-2 left-2 z-10 bg-[#000050] text-xs">{popularText}</Badge>}
      <div className="relative h-40 sm:h-48 overflow-hidden flex items-center justify-center p-4">
        <Image
          src={imageUrl || "/placeholder.png"}
          alt={title}
          width={400}
          height={300}
          className="object-contain w-full h-full"
        />
      </div>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#000050] text-white rounded-lg">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <CardDescription className="text-sm sm:text-base mb-4">{description}</CardDescription>
        <Button
          className="w-full bg-white text-[#000050] hover:bg-[#000050] hover:text-white border border-[#000050] transition-colors duration-300 text-sm sm:text-base"
          onClick={onGetQuote}
        >
          {getQuoteText}
        </Button>
      </CardContent>
    </Card>
  )
}
