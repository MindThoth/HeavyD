"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white"
    >
      <Globe className="h-4 w-4 mr-2" />
      {language === "en" ? "Français" : "English"}
    </Button>
  )
}
