"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceCard } from "@/components/service-card"
import {
  Anchor,
  Palette,
  Truck,
  Sticker,
  Magnet,
  Camera,
  Star,
  ArrowRight,
  CheckCircle,
  Languages,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react"

export default function HeavyDLanding() {
  const [language, setLanguage] = useState("en")
  const [selectedService, setSelectedService] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
    preferredLanguage: "",
    timeline: "",
    additionalFiles: null as FileList | null,

    // Logo Design fields
    slogan: "",
    businessDescription: "",
    targetAudience: "",
    colorPreferences: "",
    designPreferences: "",
    imageInMind: "",
    additionalInfo: "",
    uploadFiles: null as FileList | null,

    // Boat Lettering fields
    boatName: "",
    existingDesign: "",
    uploadExistingDesign: null as FileList | null,
    layoutIdeas: "",
    boatLocation: "",
    hullType: "",
    hullColor: "",
    cabinColor: "",
    namesFront: "",
    nameStern: "",
    nameCabinCap: "",
    frontCapText: "",
    backCapText: "",
    bowDesign: "",
    needNumbers: "",
    whatNumbers: "",
    numbersHeight: "",
    front: "",
    back: "",
    differentCapName: "",
    capHeight: "",
    needPhoneNumber: "",
    phoneInWindow: "",
    windowWidth: "",
    uploadBoatPhotos: null as FileList | null,
    needInstall: "",
    installLocation: "",

    // Vehicle Lettering fields
    vehicleTypeText: "",
    vehicleColor: "",
    vehicleText: "",
    logoOnVehicle: "",
    uploadLogo: null as FileList | null,
    phoneOnVehicle: "",
    textInWindow: "",
    windowSize: "",
    vehicleLayoutIdeas: "",
    uploadVehiclePhotos: null as FileList | null,
    vehicleNeedInstall: "",
    vehicleInstallLocation: "",

    // Replace existing sticker fields with:
    stickers: [
      {
        stickerFor: "",
        stickerProjectDescription: "",
        preferredShape: "",
        lamination: "",
        stickerHeight: "",
        stickerWidth: "",
        quantity: "",
        hasStickerVisuals: "",
      },
    ],

    // Car Magnets fields
    magnetFor: "",
    magnetSize: "",
    magnetQuantity: "",
    magnetDesign: "",
    uploadMagnetDesign: null as FileList | null,

    // Drone Photography fields
    droneSubject: "",
    droneLocation: "",
    droneSpecificRequests: "",
    droneUsage: "",
    droneTimeline: "",

    // Legacy fields
    vehicleType: "",
    boatType: "",
    logoStyle: "",
    stickerQuantity: "",
    socialPlatforms: [] as string[],

    // Add these new fields to the formData state:
    bowDesignDetails: "",
    magnetProjectDescription: "",
    droneOtherSubject: "",
    additionalInformation: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadLink, setUploadLink] = useState("")
  const [hasFiles, setHasFiles] = useState(false)
  const [showMoreProjects, setShowMoreProjects] = useState(false)
  const [submissionInProgress, setSubmissionInProgress] = useState(false)
  const submissionRef = useRef(false)

  const scrollToForm = () => {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })
  }

  const translations = {
    en: {
      // Header
      getQuote: "Get a Quote",

      // Hero
      heroTitle: "Crafted on the Islands. Designed to Last.",
      heroSubtitle: "High-impact print & design services — from your boat name to your brand identity.",
      freeQuote: "Get Your Free Quote",
      viewWork: "View Our Work",

      // Services
      servicesTitle: "Our Services",
      servicesSubtitle:
        "We offer comprehensive print and design solutions for businesses and individuals across the Magdalen Islands and beyond.",
      popular: "Popular",

      services: [
        {
          id: "boat-lettering",
          title: "Boat Lettering",
          description: "Professional marine graphics and lettering for fishing boats and pleasure crafts",
          featured: true,
        },
        {
          id: "vehicle-lettering",
          title: "Vehicle Lettering",
          description: "Custom vehicle wraps, decals, and professional fleet graphics",
          featured: true,
        },
        {
          id: "logo-design",
          title: "Logo Design",
          description: "Professional vector logo design that represents your brand perfectly",
          featured: true,
        },
        {
          id: "stickers",
          title: "Custom Stickers",
          description: "High-quality stickers for bulk orders or custom designs using premium Avery materials",
          featured: false,
        },
        {
          id: "car-magnets",
          title: "Custom Car Magnets",
          description: "Removable magnetic signs for vehicles, perfect for temporary or seasonal business advertising",
          featured: false,
        },
        {
          id: "drone-photography",
          title: "Drone Photography",
          description: "Professional aerial photography for boats, properties, events, and promotional content",
          featured: false,
        },
      ],

      // Our Work
      ourWorkTitle: "Our Work",
      ourWorkSubtitle: "See some of our recent projects and the quality we deliver",

      // Why Choose Us
      whyChooseTitle: "Why Choose Heavy D?",
      whyChooseSubtitle: "Professional quality meets local expertise",
      premiumMaterials: "Premium Materials",
      premiumDesc: "We use high-end Avery papers and professional-grade materials for lasting results.",
      expertCraftsmanship: "Expert Craftsmanship",
      expertDesc: "With a degree in graphic communications and years of experience, we deliver professional results.",
      localExpertise: "Local Maritime Expertise",
      localDesc:
        "Based on the Magdalen Islands, we understand the unique needs of marine and fishing industry clients.",

      // Contact Form
      contactTitle: "Get Your Free Quote",
      contactSubtitle: "Tell us about your project and we'll provide a quote within 24 hours.",
      projectDetails: "Project Details",
      formDescription: "Fill out the form below and we'll get back to you with a personalized quote.",

      // Form Fields
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      company: "Company/Business Name",
      serviceNeeded: "Service Needed",
      selectService: "Select the service you need",
      projectDescription: "Project Description",
      projectPlaceholder:
        "Please describe your project in detail. Include any specific requirements, timeline, budget considerations, or questions you have.",
      submitQuote: "Submit Quote Request",

      // Footer
      footerDesc:
        "Professional print and design services serving the Magdalen Islands and beyond. From boat lettering to complete branding solutions.",
      servicesFooter: "Services",
      contactInfo: "Contact Info",
      followUs: "Follow Us",
      rightsReserved: "All rights reserved.",
    },
    fr: {
      // Header
      getQuote: "Obtenir un Devis",

      // Hero
      heroTitle: "Fabriqué aux Îles. Conçu pour durer.",
      heroSubtitle:
        "Services d'impression et de design à fort impact — du nom de votre bateau à l'identité de votre marque.",
      freeQuote: "Obtenez Votre Devis Gratuit",
      viewWork: "Voir Nos Réalisations",

      // Services
      servicesTitle: "Nos Services",
      servicesSubtitle:
        "Nous offrons des solutions complètes d'impression et de design pour les entreprises et particuliers des Îles-de-la-Madeleine et au-delà.",
      popular: "Populaire",

      services: [
        {
          id: "boat-lettering",
          title: "Lettrage de Bateaux",
          description:
            "Graphiques marins professionnels et lettrage pour bateaux de pêche et embarcations de plaisance",
          featured: true,
        },
        {
          id: "vehicle-lettering",
          title: "Lettrage de Véhicules",
          description: "Habillage de véhicules personnalisé, décalques et graphiques professionnels pour flottes",
          featured: true,
        },
        {
          id: "logo-design",
          title: "Conception de Logo",
          description: "Conception professionnelle de logos vectoriels qui représentent parfaitement votre marque",
          featured: true,
        },
        {
          id: "stickers",
          title: "Autocollants Personnalisés",
          description:
            "Autocollants de haute qualité pour commandes en gros ou designs personnalisés avec matériaux Avery premium",
          featured: false,
        },
        {
          id: "car-magnets",
          title: "Aimants pour Voiture",
          description:
            "Enseignes magnétiques amovibles pour véhicules, parfaites pour la publicité temporaire ou saisonnière",
          featured: false,
        },
        {
          id: "drone-photography",
          title: "Photographie par Drone",
          description:
            "Photographie aérienne professionnelle pour bateaux, propriétés, événements et contenu promotionnel",
          featured: false,
        },
      ],

      // Our Work
      ourWorkTitle: "Nos Réalisations",
      ourWorkSubtitle: "Découvrez quelques-uns de nos projets récents et la qualité que nous livrons",

      // Why Choose Us
      whyChooseTitle: "Pourquoi Choisir Heavy D?",
      whyChooseSubtitle: "Qualité professionnelle rencontre expertise locale",
      premiumMaterials: "Matériaux Premium",
      premiumDesc:
        "Nous utilisons des papiers Avery haut de gamme et des matériaux de qualité professionnelle pour des résultats durables.",
      expertCraftsmanship: "Savoir-faire Expert",
      expertDesc:
        "Avec un diplôme en communications graphiques et des années d'expérience, nous livrons des résultats professionnels.",
      localExpertise: "Expertise Maritime Locale",
      localDesc:
        "Basés aux Îles-de-la-Madeleine, nous comprenons les besoins uniques des clients de l'industrie marine et de la pêche.",

      // Contact Form
      contactTitle: "Obtenez Votre Devis Gratuit",
      contactSubtitle: "Parlez-nous de votre projet et nous vous fournirons un devis dans les 24 heures.",
      projectDetails: "Détails du Projet",
      formDescription: "Remplissez le formulaire ci-dessous et nous vous reviendrons avec un devis personnalisé.",

      // Form Fields
      fullName: "Nom Complet",
      email: "Adresse Courriel",
      phone: "Numéro de Téléphone",
      company: "Nom de l'Entreprise/Commerce",
      serviceNeeded: "Service Requis",
      selectService: "Sélectionnez le service dont vous avez besoin",
      projectDescription: "Description du Projet",
      projectPlaceholder:
        "Veuillez décrire votre projet en détail. Incluez toute exigence spécifique, échéancier, considérations budgétaires ou questions que vous avez.",
      submitQuote: "Soumettre la Demande de Devis",

      // Footer
      footerDesc:
        "Services professionnels d'impression et de design desservant les Îles-de-la-Madeleine et au-delà. Du lettrage de bateaux aux solutions de marque complètes.",
      servicesFooter: "Services",
      contactInfo: "Informations de Contact",
      followUs: "Suivez-nous",
      rightsReserved: "Tous droits réservés.",
    },
  }

  const t = translations[language as keyof typeof translations]

  const services = t.services.map((service, index) => {
    const serviceImages = [
      "/images/services/boat-lettering.png",
      "/images/services/vehicle-lettering.png",
      "/images/services/logo-design.png",
      "/images/services/custom-stickers.png",
      "/images/services/car-magnets.png",
      "/images/services/drone-photography.png",
    ]

    return {
      ...service,
      icon: [Anchor, Truck, Palette, Sticker, Magnet, Camera][index],
      imageUrl: serviceImages[index],
    }
  })

  const handleServiceChange = (service: string) => {
    setSelectedService(service)
    setFormData((prev) => ({ ...prev, service }))
  }

  const addSticker = () => {
    setFormData((prev) => ({
      ...prev,
      stickers: [
        ...prev.stickers,
        {
          stickerFor: "",
          stickerProjectDescription: "",
          preferredShape: "",
          lamination: "",
          stickerHeight: "",
          stickerWidth: "",
          quantity: "",
          hasStickerVisuals: "",
        },
      ],
    }))
  }

  const removeSticker = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((_, i) => i !== index),
    }))
  }

  const updateSticker = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      stickers: prev.stickers.map((sticker, i) => (i === index ? { ...sticker, [field]: value } : sticker)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent multiple submissions with multiple checks
    if (isSubmitting || isSubmitted || submissionInProgress || submissionRef.current) {
      console.log("Submission already in progress or completed, ignoring...")
      return
    }

    // Set all prevention flags
    setIsSubmitting(true)
    setSubmissionInProgress(true)
    submissionRef.current = true

    // Check if any file-related fields indicate files need to be shared
    const hasUploadedFiles = Object.entries(formData).some(([key, value]) => {
      return (
        (key.includes("has") && key.includes("Files") && value === "yes") ||
        (key.includes("has") && key.includes("Photos") && value === "yes") ||
        (key.includes("has") && key.includes("Visuals") && value === "yes") ||
        (key.includes("has") && key.includes("Design") && value === "yes")
      )
    })

    setHasFiles(hasUploadedFiles)

    // Google Apps Script Web App URL (from environment variable)
    const scriptURL = process.env.NEXT_PUBLIC_GAS_ENDPOINT || 
      "https://script.google.com/macros/s/AKfycbzgUkDdQPq6sJ0Lyc4z2rvZTw5RMNP9dxqt09n376oogm9yiMQZwKK1lGr3XmCPQIvFLg/exec"

    try {
      // Create a clean object with all form data, excluding FileList objects
      const formDataToSend: Record<string, any> = {}

      // Add all form fields to the object
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && !(value instanceof FileList)) {
          formDataToSend[key] = value
        }
      })

      // Add metadata
      formDataToSend.timestamp = new Date().toISOString()
      formDataToSend.language = language
      formDataToSend.hasFiles = hasUploadedFiles.toString()

      console.log("Sending data:", formDataToSend) // Debug log

      // Try multiple approaches to handle potential CORS issues
      let response: Response | null = null
      let lastError: Error | null = null

      // Approach 1: Standard fetch with JSON
      try {
        console.log("Attempting standard JSON fetch...")
        response = await fetch(scriptURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formDataToSend),
        })
        console.log("Standard fetch successful:", response.status)
      } catch (error) {
        console.log("Standard fetch failed:", error)
        lastError = error as Error
      }

      // Approach 2: If JSON fails, try form-encoded data
      if (!response || !response.ok) {
        try {
          console.log("Attempting form-encoded fetch...")
          const formBody = new URLSearchParams()
          Object.entries(formDataToSend).forEach(([key, value]) => {
            if (typeof value === "object") {
              formBody.append(key, JSON.stringify(value))
            } else {
              formBody.append(key, String(value))
            }
          })

          response = await fetch(scriptURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formBody.toString(),
          })
          console.log("Form-encoded fetch successful:", response.status)
        } catch (error) {
          console.log("Form-encoded fetch failed:", error)
          lastError = error as Error
        }
      }

      // Approach 3: If both fail, try with no-cors mode (last resort)
      if (!response || !response.ok) {
        try {
          console.log("Attempting no-cors fetch...")
          response = await fetch(scriptURL, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formDataToSend),
          })
          console.log("No-cors fetch completed (opaque response)")

          // With no-cors, we can't read the response, so assume success
          setIsSubmitted(true)
          setIsSubmitting(false)
          setSubmissionInProgress(false)
          submissionRef.current = false

          // Reset form
          setFormData({
            name: "",
            email: "",
            phone: "",
            company: "",
            service: "",
            message: "",
            preferredLanguage: "",
            timeline: "",
            additionalFiles: null,
            slogan: "",
            businessDescription: "",
            targetAudience: "",
            colorPreferences: "",
            designPreferences: "",
            imageInMind: "",
            additionalInfo: "",
            uploadFiles: null,
            boatName: "",
            existingDesign: "",
            uploadExistingDesign: null,
            layoutIdeas: "",
            boatLocation: "",
            hullType: "",
            hullColor: "",
            cabinColor: "",
            namesFront: "",
            nameStern: "",
            nameCabinCap: "",
            frontCapText: "",
            backCapText: "",
            bowDesign: "",
            needNumbers: "",
            whatNumbers: "",
            numbersHeight: "",
            front: "",
            back: "",
            differentCapName: "",
            capHeight: "",
            needPhoneNumber: "",
            phoneInWindow: "",
            windowWidth: "",
            uploadBoatPhotos: null,
            needInstall: "",
            installLocation: "",
            vehicleTypeText: "",
            vehicleColor: "",
            vehicleText: "",
            logoOnVehicle: "",
            uploadLogo: null,
            phoneOnVehicle: "",
            textInWindow: "",
            windowSize: "",
            vehicleLayoutIdeas: "",
            uploadVehiclePhotos: null,
            vehicleNeedInstall: "",
            vehicleInstallLocation: "",
            stickers: [
              {
                stickerFor: "",
                stickerProjectDescription: "",
                preferredShape: "",
                lamination: "",
                stickerHeight: "",
                stickerWidth: "",
                quantity: "",
                hasStickerVisuals: "",
              },
            ],
            magnetFor: "",
            magnetSize: "",
            magnetQuantity: "",
            magnetDesign: "",
            uploadMagnetDesign: null,
            droneSubject: "",
            droneLocation: "",
            droneSpecificRequests: "",
            droneUsage: "",
            droneTimeline: "",
            vehicleType: "",
            boatType: "",
            logoStyle: "",
            stickerQuantity: "",
            socialPlatforms: [],
            bowDesignDetails: "",
            magnetProjectDescription: "",
            droneOtherSubject: "",
            additionalInformation: "",
          })
          setSelectedService("")
          return // Exit early for no-cors success
        } catch (error) {
          console.log("No-cors fetch failed:", error)
          lastError = error as Error
        }
      }

      // If we have a response, try to process it
      if (response && response.ok) {
        console.log("Response status:", response.status)
        console.log("Response headers:", Object.fromEntries(response.headers.entries()))

        // Try to parse response
        let result
        try {
          const text = await response.text()
          console.log("Response text:", text)
          result = JSON.parse(text)
          if (result.uploadLink) {
            setUploadLink(result.uploadLink)
          }
        } catch (parseError) {
          console.log("Response parsing failed, assuming success")
          result = { result: "success" }
        }

        setIsSubmitted(true)
        setIsSubmitting(false)
        setSubmissionInProgress(false)
        submissionRef.current = false

        // Reset form (same as above)
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          service: "",
          message: "",
          preferredLanguage: "",
          timeline: "",
          additionalFiles: null,
          slogan: "",
          businessDescription: "",
          targetAudience: "",
          colorPreferences: "",
          designPreferences: "",
          imageInMind: "",
          additionalInfo: "",
          uploadFiles: null,
          boatName: "",
          existingDesign: "",
          uploadExistingDesign: null,
          layoutIdeas: "",
          boatLocation: "",
          hullType: "",
          hullColor: "",
          cabinColor: "",
          namesFront: "",
          nameStern: "",
          nameCabinCap: "",
          frontCapText: "",
          backCapText: "",
          bowDesign: "",
          needNumbers: "",
          whatNumbers: "",
          numbersHeight: "",
          front: "",
          back: "",
          differentCapName: "",
          capHeight: "",
          needPhoneNumber: "",
          phoneInWindow: "",
          windowWidth: "",
          uploadBoatPhotos: null,
          needInstall: "",
          installLocation: "",
          vehicleTypeText: "",
          vehicleColor: "",
          vehicleText: "",
          logoOnVehicle: "",
          uploadLogo: null,
          phoneOnVehicle: "",
          textInWindow: "",
          windowSize: "",
          vehicleLayoutIdeas: "",
          uploadVehiclePhotos: null,
          vehicleNeedInstall: "",
          vehicleInstallLocation: "",
          stickers: [
            {
              stickerFor: "",
              stickerProjectDescription: "",
              preferredShape: "",
              lamination: "",
              stickerHeight: "",
              stickerWidth: "",
              quantity: "",
              hasStickerVisuals: "",
            },
          ],
          magnetFor: "",
          magnetSize: "",
          magnetQuantity: "",
          magnetDesign: "",
          uploadMagnetDesign: null,
          droneSubject: "",
          droneLocation: "",
          droneSpecificRequests: "",
          droneUsage: "",
          droneTimeline: "",
          vehicleType: "",
          boatType: "",
          logoStyle: "",
          stickerQuantity: "",
          socialPlatforms: [],
          bowDesignDetails: "",
          magnetProjectDescription: "",
          droneOtherSubject: "",
          additionalInformation: "",
        })
        setSelectedService("")
      } else {
        // All approaches failed
        throw lastError || new Error(`HTTP error! status: ${response?.status || "unknown"}`)
      }
    } catch (error) {
      console.error("All submission attempts failed:", error)
      setIsSubmitting(false)
      setSubmissionInProgress(false)
      submissionRef.current = false

      // More specific error handling
      let errorMessage = ""
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        errorMessage =
          language === "en"
            ? "Network error: Please check your internet connection and try again. If the problem persists, contact us directly at nicholas.js.lachance@gmail.com"
            : "Erreur réseau: Veuillez vérifier votre connexion internet et réessayer. Si le problème persiste, contactez-nous directement à nicholas.js.lachance@gmail.com"
      } else {
        errorMessage =
          language === "en"
            ? "There was an error submitting your request. Please try again or contact us directly at nicholas.js.lachance@gmail.com"
            : "Il y a eu une erreur lors de la soumission de votre demande. Veuillez réessayer ou nous contacter directement à nicholas.js.lachance@gmail.com"
      }

      alert(errorMessage)
    }
  }

  const renderServiceSpecificFields = () => {
    const translations = {
      en: {
        // Logo Design
        slogan: "Do you have a slogan?",
        businessDescription: "Brief Description of the Business",
        businessDescriptionPlaceholder:
          "Provide a brief description of your business, including industry, products and/or services.",
        targetAudience: "Target Audience",
        targetAudiencePlaceholder:
          "Describe the primary audience for your business. Demographics, psychographics, geographic location.",
        colorPreferences: "Color preferences",
        designPreferences: "Design preferences",
        imageInMind: "Image That Comes to Mind",
        additionalInfo: "Additional Information",
        additionalInfoPlaceholder:
          "Anything else that might influence the design? Where will your logo be used? (Web, print, merch, vehicle lettering, etc.)",
        uploadFiles: "Upload Files",

        // Boat Lettering
        boatName: "Name of the boat",
        existingDesign: "Is there a design for the name already?",
        uploadExistingDesign: "Upload Existing Design",
        layoutIdeas: "Do you have design ideas?",
        boatLocation: "Where is the boat from?",
        hullType: "Hull type",
        hullColor: "Hull color",
        cabinColor: "Cabin color",
        namesFront: "Do you need the names in front?",
        nameStern: "Do you need the name on the stern?",
        nameCabinCap: "Do you need a name on the cabin's cap?",
        frontCapText: "What would you like on the front of the cabin's cap?",
        backCapText: "What would you like on the back of the cabin's cap?",
        bowDesign: "Do you need a bow design?",
        needNumbers: "Do you need numbers?",
        whatNumbers: "What are the numbers?",
        numbersHeight: "Height of the numbers (in inches)",
        front: "Front?",
        back: "Back?",
        differentCapName: "Would you like something different than the boat name on the cap?",
        capHeight: "Height of the front and back cap (in inches)",
        needPhoneNumber: "Do you need a phone number?",
        phoneInWindow: "Would you like it placed in the window?",
        windowWidth: "Width of the window (in inches)",
        uploadBoatPhotos: "Upload photos of your boat",
        needInstall: "Do you need install?",
        installLocation: "Location for install",
        bowDesignDetails: "What kind of bow design would you like?",

        // Vehicle Lettering
        vehicleTypeText: "What type of vehicle?",
        vehicleColor: "Vehicle color",
        vehicleText: "Describe your project or design vision",
        logoOnVehicle: "Do you have a logo?",
        uploadLogo: "Upload Logo",
        phoneOnVehicle: "Do you need a phone number on it?",
        textInWindow: "Should the text/logo go in the window?",
        windowSize: "Size of the window (in inches)",
        vehicleLayoutIdeas: "Do you already have layout ideas?",
        uploadVehiclePhotos: "Upload photos of your vehicle",

        // Stickers
        stickerFor: "What is the sticker for?",
        preferredShape: "Preferred Cut",
        preferredSize: "Preferred size",
        quantity: "Quantity",
        designPrintBoth: "Do you need design, print, or both?",
        uploadVisuals: "Upload visuals or references",
        stickerProjectDescription: "Describe your sticker project",

        // Car Magnets
        magnetFor: "What is the magnet for?",
        magnetSize: "Size needed",
        magnetQuantity: "Quantity",
        magnetDesign: "Do you have a design ready?",
        uploadMagnetDesign: "Upload your design",
        magnetProjectDescription: "Describe your magnet project",

        // Drone Photography
        droneSubject: "What would you like photographed?",
        droneLocation: "Location",
        droneSpecificRequests: "Specific shots or angles requested",
        droneUsage: "How will the photos be used?",
        droneTimeline: "When do you need the photography done?",
        droneOtherSubject: "Please specify what you'd like photographed",

        // Common options
        yes: "Yes",
        no: "No",
        notSure: "Not sure",
        circle: "Circle",
        square: "Square",
        rectangle: "Rectangle",
        dieCut: "Die-Cut",
        kissCut: "Kiss-Cut",
        other: "Other",
        design: "Design",
        print: "Print",
        both: "Both",
        boat: "Boat",
        property: "Property",
        event: "Event",
        business: "Business",
        other: "Other",
      },
      fr: {
        // Logo Design
        slogan: "Avez-vous un slogan?",
        businessDescription: "Brève description de l'entreprise",
        businessDescriptionPlaceholder:
          "Fournissez une brève description de votre entreprise, incluant l'industrie, les produits et/ou services.",
        targetAudience: "Public cible",
        targetAudiencePlaceholder:
          "Décrivez le public principal de votre entreprise. Démographie, psychographie, localisation géographique.",
        colorPreferences: "Préférences de couleur",
        designPreferences: "Préférences de design",
        imageInMind: "Image qui vous vient à l'esprit",
        additionalInfo: "Informations supplémentaires",
        additionalInfoPlaceholder:
          "Autre chose qui pourrait influencer le design? Où votre logo sera-t-il utilisé? (Web, impression, marchandise, lettrage de véhicule, etc.)",
        uploadFiles: "Télécharger des fichiers",

        // Boat Lettering
        boatName: "Nom du bateau",
        existingDesign: "Y a-t-il déjà un design pour le nom?",
        uploadExistingDesign: "Télécharger le design existant",
        layoutIdeas: "Avez-vous des idées de design?",
        boatLocation: "D'où vient le bateau?",
        hullType: "Type de coque",
        hullColor: "Couleur de la coque",
        cabinColor: "Couleur de la cabine",
        namesFront: "Avez-vous besoin des noms à l'avant?",
        nameStern: "Avez-vous besoin du nom sur la poupe?",
        nameCabinCap: "Avez-vous besoin d'un nom sur le capot de la cabine?",
        frontCapText: "Que souhaitez-vous à l'avant du capot de la cabine?",
        backCapText: "Que souhaitez-vous à l'arrière du capot de la cabine?",
        bowDesign: "Avez-vous besoin d'un design de proue?",
        needNumbers: "Avez-vous besoin de numéros?",
        whatNumbers: "Quels sont les numéros?",
        numbersHeight: "Hauteur des numéros (en pouces)",
        front: "Avant?",
        back: "Arrière?",
        differentCapName: "Aimeriez-vous quelque chose de différent du nom du bateau sur le capot?",
        capHeight: "Hauteur du capot avant et arrière (en pouces)",
        needPhoneNumber: "Avez-vous besoin d'un numéro de téléphone?",
        phoneInWindow: "Aimeriez-vous qu'il soit placé dans la fenêtre?",
        windowWidth: "Largeur de la fenêtre (en pouces)",
        uploadBoatPhotos: "Télécharger des photos de votre bateau",
        needInstall: "Avez-vous besoin d'installation?",
        installLocation: "Lieu d'installation",
        bowDesignDetails: "Quel type de design de proue aimeriez-vous?",

        // Vehicle Lettering
        vehicleTypeText: "Quel type de véhicule?",
        vehicleColor: "Couleur du véhicule",
        vehicleText: "Décrivez votre projet ou vision de design",
        logoOnVehicle: "Avez-vous un logo?",
        uploadLogo: "Télécharger le logo",
        phoneOnVehicle: "Avez-vous besoin d'un numéro de téléphone dessus?",
        textInWindow: "Le texte/logo doit-il aller dans la fenêtre?",
        windowSize: "Taille de la fenêtre (en pouces)",
        vehicleLayoutIdeas: "Avez-vous déjà des idées de mise en page?",
        uploadVehiclePhotos: "Télécharger des photos de votre véhicule",

        // Stickers
        stickerFor: "À quoi sert l'autocollant?",
        preferredShape: "Découpe Préférée",
        preferredSize: "Taille préférée",
        quantity: "Quantité",
        designPrintBoth: "Avez-vous besoin de design, impression, ou les deux?",
        uploadVisuals: "Télécharger des visuels ou références",
        stickerProjectDescription: "Décrivez votre projet d'autocollant",

        // Car Magnets
        magnetFor: "À quoi sert l'aimant?",
        magnetSize: "Taille nécessaire",
        magnetQuantity: "Quantité",
        magnetDesign: "Avez-vous un design prêt?",
        uploadMagnetDesign: "Téléchargez votre design",
        magnetProjectDescription: "Décrivez votre projet d'aimant",

        // Drone Photography
        droneSubject: "Qu'aimeriez-vous photographier?",
        droneLocation: "Emplacement",
        droneSpecificRequests: "Prises de vue ou angles spécifiques demandés",
        droneUsage: "Comment les photos seront-elles utilisées?",
        droneTimeline: "Quand avez-vous besoin de la photographie?",
        droneOtherSubject: "Veuillez spécifier ce que vous aimeriez photographier",

        // Common options
        yes: "Oui",
        no: "Non",
        notSure: "Pas sûr",
        circle: "Cercle",
        square: "Carré",
        rectangle: "Rectangle",
        dieCut: "Découpe Personnalisée",
        kissCut: "Découpe Kiss",
        other: "Autre",
        design: "Design",
        print: "Impression",
        both: "Les deux",
        boat: "Bateau",
        property: "Propriété",
        event: "Événement",
        business: "Entreprise",
        other: "Autre",
      },
    }

    const t = translations[language as keyof typeof translations]

    switch (selectedService) {
      case "logo-design":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="slogan">{t.slogan}</Label>
              <Input
                id="slogan"
                value={formData.slogan}
                onChange={(e) => setFormData((prev) => ({ ...prev, slogan: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">{t.businessDescription}</Label>
              <Textarea
                id="businessDescription"
                placeholder={t.businessDescriptionPlaceholder}
                value={formData.businessDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, businessDescription: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="targetAudience">{t.targetAudience}</Label>
              <Textarea
                id="targetAudience"
                placeholder={t.targetAudiencePlaceholder}
                value={formData.targetAudience}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="colorPreferences">{t.colorPreferences}</Label>
              <Input
                id="colorPreferences"
                value={formData.colorPreferences}
                onChange={(e) => setFormData((prev) => ({ ...prev, colorPreferences: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="designPreferences">{t.designPreferences}</Label>
              <Input
                id="designPreferences"
                value={formData.designPreferences}
                onChange={(e) => setFormData((prev) => ({ ...prev, designPreferences: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="imageInMind">{t.imageInMind}</Label>
              <Textarea
                id="imageInMind"
                value={formData.imageInMind}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageInMind: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="additionalInfo">{t.additionalInfo}</Label>
              <Textarea
                id="additionalInfo"
                placeholder={t.additionalInfoPlaceholder}
                value={formData.additionalInfo}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uploadFiles">{t.uploadFiles}</Label>
              <div className="text-sm text-gray-500 mb-1">
                {language === "en"
                  ? "Do you have files to share? You'll receive upload instructions after submitting the form."
                  : "Avez-vous des fichiers à partager? Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
              </div>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, hasLogoFiles: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select option" : "Sélectionnez une option"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "boat-lettering":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="boatName">{t.boatName}</Label>
              <Input
                id="boatName"
                value={formData.boatName}
                onChange={(e) => setFormData((prev) => ({ ...prev, boatName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="existingDesign">{t.existingDesign}</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, existingDesign: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select option" : "Sélectionnez une option"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.existingDesign === "yes" && (
              <div>
                <Label htmlFor="uploadExistingDesign">{t.uploadExistingDesign}</Label>
                <div className="text-sm text-gray-500 mb-1">
                  {language === "en"
                    ? "You'll receive upload instructions after submitting the form."
                    : "Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
                </div>
                <Select
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, hasExistingDesignFiles: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        language === "en" ? "Do you have files to share?" : "Avez-vous des fichiers à partager?"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.existingDesign === "no" && (
              <div>
                <Label htmlFor="layoutIdeas">{t.layoutIdeas}</Label>
                <Textarea
                  id="layoutIdeas"
                  value={formData.layoutIdeas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, layoutIdeas: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="boatLocation">{t.boatLocation}</Label>
              <Input
                id="boatLocation"
                value={formData.boatLocation}
                onChange={(e) => setFormData((prev) => ({ ...prev, boatLocation: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hullType">{t.hullType}</Label>
                <Input
                  id="hullType"
                  value={formData.hullType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hullType: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hullColor">{t.hullColor}</Label>
                <Input
                  id="hullColor"
                  value={formData.hullColor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hullColor: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cabinColor">{t.cabinColor}</Label>
                <Input
                  id="cabinColor"
                  value={formData.cabinColor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cabinColor: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Yes/No questions for boat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namesFront">{t.namesFront}</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, namesFront: value }))} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nameStern">{t.nameStern}</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, nameStern: value }))} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nameCabinCap">{t.nameCabinCap}</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, nameCabinCap: value }))} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bowDesign">{t.bowDesign}</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, bowDesign: value }))} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="needNumbers">{t.needNumbers}</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, needNumbers: value }))} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.nameCabinCap === "yes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frontCapText">{t.frontCapText}</Label>
                  <Input
                    id="frontCapText"
                    value={formData.frontCapText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, frontCapText: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="backCapText">{t.backCapText}</Label>
                  <Input
                    id="backCapText"
                    value={formData.backCapText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, backCapText: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}

            {formData.bowDesign === "yes" && (
              <div>
                <Label htmlFor="bowDesignDetails">{t.bowDesignDetails}</Label>
                <Textarea
                  id="bowDesignDetails"
                  value={formData.bowDesignDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bowDesignDetails: e.target.value }))}
                />
              </div>
            )}

            {formData.needNumbers === "yes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatNumbers">{t.whatNumbers}</Label>
                  <Input
                    id="whatNumbers"
                    value={formData.whatNumbers}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatNumbers: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="numbersHeight">{t.numbersHeight}</Label>
                  <Input
                    id="numbersHeight"
                    type="number"
                    value={formData.numbersHeight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, numbersHeight: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="uploadBoatPhotos">{t.uploadBoatPhotos}</Label>
              <div className="text-sm text-gray-500 mb-1">
                {language === "en"
                  ? "Do you have photos to share? You'll receive upload instructions after submitting the form."
                  : "Avez-vous des photos à partager? Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
              </div>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, hasBoatPhotos: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select option" : "Sélectionnez une option"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="needInstall">{t.needInstall}</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, needInstall: value }))} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.needInstall === "yes" && (
                <div>
                  <Label htmlFor="installLocation">{t.installLocation}</Label>
                  <Select
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, installLocation: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === "en" ? "Select location" : "Sélectionnez l'emplacement"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grande-Entrée">Grande-Entrée</SelectItem>
                      <SelectItem value="Cap-aux-Meules">Cap-aux-Meules</SelectItem>
                      <SelectItem value="Fatima">Fatima</SelectItem>
                      <SelectItem value="Havre-Aubert">Havre-Aubert</SelectItem>
                      <SelectItem value="Havre-aux-Maisons">Havre-aux-Maisons</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )

      case "vehicle-lettering":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleTypeText">{t.vehicleTypeText}</Label>
                <Input
                  id="vehicleTypeText"
                  value={formData.vehicleTypeText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vehicleTypeText: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleColor">{t.vehicleColor}</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vehicleColor: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vehicleText">{t.vehicleText}</Label>
              <Textarea
                id="vehicleText"
                value={formData.vehicleText}
                onChange={(e) => setFormData((prev) => ({ ...prev, vehicleText: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="logoOnVehicle">{t.logoOnVehicle}</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, logoOnVehicle: value }))} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.logoOnVehicle === "yes" && (
              <div>
                <Label htmlFor="uploadLogo">{t.uploadLogo}</Label>
                <div className="text-sm text-gray-500 mb-1">
                  {language === "en"
                    ? "You'll receive upload instructions after submitting the form."
                    : "Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
                </div>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, hasLogoFiles: value }))} required>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "en" ? "Do you have a logo to share?" : "Avez-vous un logo à partager?"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="uploadVehiclePhotos">{t.uploadVehiclePhotos}</Label>
              <div className="text-sm text-gray-500 mb-1">
                {language === "en"
                  ? "Do you have photos to share? You'll receive upload instructions after submitting the form."
                  : "Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
              </div>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, hasVehiclePhotos: value }))} required>
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select option" : "Sélectionnez une option"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleNeedInstall">
                  {language === "en" ? "Do you need install?" : "Avez-vous besoin d'installation?"}
                </Label>
                <Select
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicleNeedInstall: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.vehicleNeedInstall === "yes" && (
                <div>
                  <Label htmlFor="vehicleInstallLocation">
                    {language === "en" ? "Location for install" : "Lieu d'installation"}
                  </Label>
                  <Select
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicleInstallLocation: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === "en" ? "Select location" : "Sélectionnez l'emplacement"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grande-Entrée">Grande-Entrée</SelectItem>
                      <SelectItem value="Cap-aux-Meules">Cap-aux-Meules</SelectItem>
                      <SelectItem value="Fatima">Fatima</SelectItem>
                      <SelectItem value="Havre-Aubert">Havre-Aubert</SelectItem>
                      <SelectItem value="Havre-aux-Maisons">Havre-aux-Maisons</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )

      case "stickers":
        return (
          <div className="space-y-6">
            {formData.stickers.map((sticker, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                {formData.stickers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSticker(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                )}
                <h4 className="text-lg font-semibold mb-4">
                  {language === "en" ? `Sticker ${index + 1}` : `Autocollant ${index + 1}`}
                </h4>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`stickerFor-${index}`}>{t.stickerFor}</Label>
                    <Input
                      id={`stickerFor-${index}`}
                      required
                      value={sticker.stickerFor}
                      onChange={(e) => updateSticker(index, "stickerFor", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`stickerProjectDescription-${index}`}>{t.stickerProjectDescription}</Label>
                    <Textarea
                      id={`stickerProjectDescription-${index}`}
                      required
                      value={sticker.stickerProjectDescription}
                      onChange={(e) => updateSticker(index, "stickerProjectDescription", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`preferredShape-${index}`}>
                        {language === "en" ? "Print & Cut or Cut Only" : "Impression & Découpe ou Découpe Seulement"}
                      </Label>
                      <Select onValueChange={(value) => updateSticker(index, "preferredShape", value)} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="print-cut">
                            {language === "en" ? "Print & Cut" : "Impression & Découpe"}
                          </SelectItem>
                          <SelectItem value="cut-only">
                            {language === "en" ? "Cut Only" : "Découpe Seulement"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`lamination-${index}`}>
                        {language === "en" ? "Laminated or No-Lamination" : "Laminé ou Sans Lamination"}
                      </Label>
                      <Select onValueChange={(value) => updateSticker(index, "lamination", value)} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laminated">{language === "en" ? "Laminated" : "Laminé"}</SelectItem>
                          <SelectItem value="no-lamination">
                            {language === "en" ? "No-Lamination" : "Sans Lamination"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`stickerHeight-${index}`}>
                        {language === "en" ? "Height (in inches)" : "Hauteur (en pouces)"}
                      </Label>
                      <Input
                        id={`stickerHeight-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={sticker.stickerHeight}
                        onChange={(e) => updateSticker(index, "stickerHeight", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`stickerWidth-${index}`}>
                        {language === "en" ? "Width (in inches)" : "Largeur (en pouces)"}
                      </Label>
                      <Input
                        id={`stickerWidth-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        value={sticker.stickerWidth}
                        onChange={(e) => updateSticker(index, "stickerWidth", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${index}`}>{t.quantity}</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      required
                      value={sticker.quantity}
                      onChange={(e) => updateSticker(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`uploadVisuals-${index}`}>{t.uploadVisuals}</Label>
                    <div className="text-sm text-gray-500 mb-1">
                      {language === "en"
                        ? "Do you have visuals to share? You'll receive upload instructions after submitting the form."
                        : "Avez-vous des visuels à partager? Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
                    </div>
                    <Select onValueChange={(value) => updateSticker(index, "hasStickerVisuals", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "en" ? "Select option" : "Sélectionnez une option"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{t.yes}</SelectItem>
                        <SelectItem value="no">{t.no}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addSticker}
              className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 bg-transparent"
            >
              + {language === "en" ? "Add Another Sticker" : "Ajouter un Autre Autocollant"}
            </Button>
          </div>
        )

      case "car-magnets":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="magnetFor">{t.magnetFor}</Label>
              <Input
                id="magnetFor"
                value={formData.magnetFor}
                onChange={(e) => setFormData((prev) => ({ ...prev, magnetFor: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="magnetProjectDescription">{t.magnetProjectDescription}</Label>
              <Textarea
                id="magnetProjectDescription"
                value={formData.magnetProjectDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, magnetProjectDescription: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="magnetSize">{t.magnetSize}</Label>
                <Input
                  id="magnetSize"
                  placeholder="Ex: 12x24 in"
                  value={formData.magnetSize}
                  onChange={(e) => setFormData((prev) => ({ ...prev, magnetSize: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="magnetQuantity">{t.magnetQuantity}</Label>
                <Input
                  id="magnetQuantity"
                  type="number"
                  value={formData.magnetQuantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, magnetQuantity: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="magnetDesign">{t.magnetDesign}</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, magnetDesign: value }))} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t.yes}</SelectItem>
                  <SelectItem value="no">{t.no}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.magnetDesign === "yes" && (
              <div>
                <Label htmlFor="uploadMagnetDesign">{t.uploadMagnetDesign}</Label>
                <div className="text-sm text-gray-500 mb-1">
                  {language === "en"
                    ? "You'll receive upload instructions after submitting the form."
                    : "Vous recevrez des instructions de téléchargement après avoir soumis le formulaire."}
                </div>
                <Select
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, hasMagnetDesign: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        language === "en" ? "Do you have a design to share?" : "Avez-vous un design à partager?"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t.yes}</SelectItem>
                    <SelectItem value="no">{t.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )

      case "drone-photography":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="droneSubject">{t.droneSubject}</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, droneSubject: value }))} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boat">{t.boat}</SelectItem>
                  <SelectItem value="property">{t.property}</SelectItem>
                  <SelectItem value="event">{t.event}</SelectItem>
                  <SelectItem value="business">{t.business}</SelectItem>
                  <SelectItem value="other">{t.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.droneSubject === "other" && (
              <div>
                <Label htmlFor="droneOtherSubject">{t.droneOtherSubject}</Label>
                <Input
                  id="droneOtherSubject"
                  value={formData.droneOtherSubject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, droneOtherSubject: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="droneLocation">{t.droneLocation}</Label>
              <Input
                id="droneLocation"
                value={formData.droneLocation}
                onChange={(e) => setFormData((prev) => ({ ...prev, droneLocation: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="droneSpecificRequests">{t.droneSpecificRequests}</Label>
              <Textarea
                id="droneSpecificRequests"
                value={formData.droneSpecificRequests}
                onChange={(e) => setFormData((prev) => ({ ...prev, droneSpecificRequests: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="droneUsage">{t.droneUsage}</Label>
              <Input
                id="droneUsage"
                value={formData.droneUsage}
                onChange={(e) => setFormData((prev) => ({ ...prev, droneUsage: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="droneTimeline">{t.droneTimeline}</Label>
              <Input
                id="droneTimeline"
                type="date"
                value={formData.droneTimeline}
                onChange={(e) => setFormData((prev) => ({ ...prev, droneTimeline: e.target.value }))}
                required
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Update the main form section to include the new top fields
  const formTranslations = {
    en: {
      fullName: "Full Name",
      email: "Email",
      phone: "Phone Number",
      company: "Company or Brand Name",
      preferredLanguage: "Preferred Language",
      serviceType: "Service Type",
      selectLanguage: "Select preferred language",
      selectService: "Select service type",
      french: "Français",
      english: "English",
      both: "Both",
      logoDesign: "Logo Design",
      boatLettering: "Boat Lettering",
      vehicleLettering: "Vehicle Lettering",
      stickers: "Stickers",
      carMagnets: "Car Magnets",
      dronePhotography: "Drone Photography",
      additionalInformation: "Additional Information",
      uploadAdditional: "Do you have additional files to share?",
      submitQuote: "Submit Quote Request",
      successTitle: "Quote Request Submitted!",
      successMessage:
        "Thank you for your request! We'll review your project details and get back to you within 24 hours with a personalized quote.",
      successWithFilesMessage:
        "Thank you for your request! We noticed you have files to share. You'll receive an email with upload instructions shortly.",
      submitAnother: "Submit Another Request",
      uploadInstructions: "Upload Instructions",
      uploadInstructionsMessage: "To upload your files, please use this secure link:",
      uploadInstructionsNote: "Simply click the link above and drag & drop your files into the folder.",
    },
    fr: {
      fullName: "Nom Complet",
      email: "Courriel",
      phone: "Numéro de Téléphone",
      company: "Nom de l'Entreprise ou Marque",
      preferredLanguage: "Langue Préférée",
      serviceType: "Type de Service",
      selectLanguage: "Sélectionnez la langue préférée",
      selectService: "Sélectionnez le type de service",
      french: "Français",
      english: "English",
      both: "Les deux",
      logoDesign: "Conception de Logo",
      boatLettering: "Lettrage de Bateau",
      vehicleLettering: "Lettrage de Véhicule",
      stickers: "Autocollants",
      carMagnets: "Aimants pour Voiture",
      dronePhotography: "Photographie par Drone",
      additionalInformation: "Informations Supplémentaires",
      uploadAdditional: "Avez-vous des fichiers supplémentaires à partager?",
      submitQuote: "Soumettre la Demande de Devis",
      successTitle: "Demande de Devis Soumise!",
      successMessage:
        "Merci pour votre demande! Nous examinerons les détails de votre projet et vous reviendrons dans les 24 heures avec un devis personnalisé.",
      successWithFilesMessage:
        "Merci pour votre demande! Nous avons remarqué que vous avez des fichiers à partager. Vous recevrez un courriel avec des instructions de téléchargement sous peu.",
      submitAnother: "Soumettre une Autre Demande",
      uploadInstructions: "Instructions de Téléchargement",
      uploadInstructionsMessage: "Pour télécharger vos fichiers, veuillez utiliser ce lien sécurisé:",
      uploadInstructionsNote:
        "Cliquez simplement sur le lien ci-dessus et glissez-déposez vos fichiers dans le dossier.",
    },
  }

  const ft = formTranslations[language as keyof typeof formTranslations]

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md py-2 sm:py-3 px-4 sm:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="hover:scale-110 transition-transform duration-300 ease-in-out cursor-pointer">
              <Image src="/logo-blue.svg" alt="Heavy D Logo" width={100} height={40} className="h-8 sm:h-10 w-auto" />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Languages className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{language === "en" ? "FR" : "EN"}</span>
              <span className="sm:hidden">{language === "en" ? "FR" : "EN"}</span>
            </Button>
            <Button
              onClick={scrollToForm}
              size="sm"
              className="bg-white text-[#000050] hover:bg-[#000050] hover:text-white border border-[#000050] transition-colors duration-300 text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">{t.getQuote}</span>
              <span className="sm:hidden">Quote</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banner.jpg"
            alt="Magdalen Islands coastal scene with boats"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000050]/80 to-blue-800/60"></div>
        </div>
        <div className="relative z-10 py-16 sm:py-20 md:py-24 px-4 sm:px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-white">
              {t.heroTitle}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed text-white">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-[#000050] hover:bg-[#000050] hover:text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 transition-colors duration-300 w-full sm:w-auto"
                onClick={scrollToForm}
              >
                {t.freeQuote} <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                size="lg"
                className="bg-[#000050] text-white hover:bg-white hover:text-[#000050] text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 transition-colors duration-300 w-full sm:w-auto"
                onClick={() => document.getElementById("our-work")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t.viewWork}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t.servicesTitle}</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">{t.servicesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.description}
                featured={service.featured}
                icon={service.icon}
                imageUrl={service.imageUrl}
                popularText={t.popular}
                getQuoteText={t.getQuote}
                onGetQuote={() => {
                  scrollToForm()
                  handleServiceChange(service.id)
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Our Work Section */}
      <section id="our-work" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t.ourWorkTitle}</h2>
            <p className="text-lg sm:text-xl text-gray-600">{t.ourWorkSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Les Constructions JFM",
                category: language === "en" ? "Custom Vinyl" : "Vinyle Personnalisé",
                image: "/images/work/jfm-new.jpg",
              },
              {
                title: "Cap-A-Ben",
                category: language === "en" ? "Boat Lettering" : "Lettrage de Bateau",
                image: "/images/work/cap-a-ben-new.jpg",
              },
              {
                title: "Brideau Cycle",
                category: language === "en" ? "Bulk Stickers" : "Autocollants en Gros",
                image: "/images/work/cycle-new.jpg",
              },
              {
                title: "Last Pearl",
                category: language === "en" ? "Boat Lettering" : "Lettrage de Bateau",
                image: "/images/work/last-pearl-new.jpg",
              },
              {
                title: "Madelon",
                category: language === "en" ? "Vehicle Lettering" : "Lettrage de Véhicule",
                image: "/images/work/madelon-new.jpg",
              },
              {
                title: "Coby's Courage",
                category: language === "en" ? "Boat Lettering" : "Lettrage de Bateau",
                image: "/images/work/cobys-new.jpg",
              },
            ].map((work, index) => (
              <Card
                key={index}
                className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 sm:h-64 overflow-hidden">
                  <Image
                    src={work.image || "/placeholder.svg"}
                    alt={work.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Blue overlay that disappears on hover (desktop only) */}
                  <div className="absolute inset-0 bg-[#000050] bg-opacity-40 hidden md:block md:group-hover:bg-opacity-0 transition-opacity duration-300" />
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {work.category}
                  </Badge>
                  <h3 className="font-semibold text-base sm:text-lg">{work.title}</h3>
                </CardContent>
              </Card>
            ))}

            {/* Additional projects that show when expanded */}
            <div
              className={`col-span-full transition-all duration-500 ease-in-out ${showMoreProjects ? "opacity-100 max-h-none" : "opacity-0 max-h-0 overflow-hidden"}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-6 sm:mt-8">
                {[
                  {
                    title: "Mina",
                    category: language === "en" ? "Logo Design" : "Conception de Logo",
                    image: "/images/work/mina.jpg",
                  },
                  {
                    title: "Le Petit Louis 1",
                    category: language === "en" ? "Boat Lettering" : "Lettrage de Bateau",
                    image: "/images/work/petit-louis.jpg",
                  },
                  {
                    title: "Leanne Alexis II",
                    category: language === "en" ? "Boat Lettering" : "Lettrage de Bateau",
                    image: "/images/work/leanne-alexis.jpg",
                  },
                  {
                    title: "BMR Banner",
                    category: language === "en" ? "Custom Stickers" : "Autocollants Personnalisés",
                    image: "/images/work/bmr.jpg",
                  },
                  {
                    title: "Clara Jacob",
                    category: language === "en" ? "Boat Lettering" : "Lettrage de Bateau",
                    image: "/images/work/clara-jacob.jpg",
                  },
                  {
                    title: "L'Essentiel",
                    category: language === "en" ? "Logo Design" : "Conception de Logo",
                    image: "/images/work/essentiel.jpg",
                  },
                ].map((work, index) => (
                  <Card
                    key={`additional-${index}`}
                    className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="relative h-48 sm:h-64 overflow-hidden">
                      <Image
                        src={work.image || "/placeholder.svg"}
                        alt={work.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Blue overlay that disappears on hover (desktop only) */}
                      <div className="absolute inset-0 bg-[#000050] bg-opacity-40 hidden md:block md:group-hover:bg-opacity-0 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {work.category}
                      </Badge>
                      <h3 className="font-semibold text-base sm:text-lg">{work.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Button
              size="lg"
              onClick={() => setShowMoreProjects(!showMoreProjects)}
              className="bg-white text-[#000050] hover:bg-[#000050] hover:text-white border border-[#000050] transition-colors duration-300 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
            >
              {showMoreProjects
                ? language === "en"
                  ? "Show Less"
                  : "Voir Moins"
                : language === "en"
                  ? "View More Projects"
                  : "Voir Plus de Projets"}{" "}
              <ArrowRight
                className={`ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${showMoreProjects ? "rotate-90" : ""}`}
              />
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t.whyChooseTitle}</h2>
            <p className="text-lg sm:text-xl text-gray-600">{t.whyChooseSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="bg-[#000050] text-white p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{t.premiumMaterials}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t.premiumDesc}</p>
            </div>

            <div className="text-center">
              <div className="bg-[#000050] text-white p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{t.expertCraftsmanship}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t.expertDesc}</p>
            </div>

            <div className="text-center">
              <div className="bg-[#000050] text-white p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                <Anchor className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{t.localExpertise}</h3>
              <p className="text-sm sm:text-base text-gray-600">{t.localDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t.contactTitle}</h2>
            <p className="text-lg sm:text-xl text-gray-600">{t.contactSubtitle}</p>
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">{t.projectDetails}</CardTitle>
              <CardDescription className="text-sm sm:text-base">{t.formDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">{ft.successTitle}</h3>
                    <p className="text-green-700">{hasFiles ? ft.successWithFilesMessage : ft.successMessage}</p>
                    {hasFiles && uploadLink && (
                      <div className="mt-4">
                        <p>{ft.uploadInstructionsMessage}</p>
                        <a
                          href={uploadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          {uploadLink}
                        </a>
                        <p className="text-sm italic">{ft.uploadInstructionsNote}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setIsSubmitted(false)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="bg-white text-[#000050] hover:bg-[#000050] hover:text-white border border-[#000050] transition-colors duration-300"
                  >
                    {ft.submitAnother}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm sm:text-base">
                        {ft.fullName} *
                      </Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm sm:text-base">
                        {ft.email} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm sm:text-base">
                        {ft.phone}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-sm sm:text-base">
                        {ft.company}
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferredLanguage" className="text-sm sm:text-base">
                        {ft.preferredLanguage}
                      </Label>
                      <Select
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, preferredLanguage: value }))}
                        required
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={ft.selectLanguage} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="french">{ft.french}</SelectItem>
                          <SelectItem value="english">{ft.english}</SelectItem>
                          <SelectItem value="both">{ft.both}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="service" className="text-sm sm:text-base">
                        {ft.serviceType} *
                      </Label>
                      <Select value={selectedService} onValueChange={handleServiceChange} required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={ft.selectService} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo-design">{ft.logoDesign}</SelectItem>
                          <SelectItem value="boat-lettering">{ft.boatLettering}</SelectItem>
                          <SelectItem value="vehicle-lettering">{ft.vehicleLettering}</SelectItem>
                          <SelectItem value="stickers">{ft.stickers}</SelectItem>
                          <SelectItem value="car-magnets">{ft.carMagnets}</SelectItem>
                          <SelectItem value="drone-photography">{ft.dronePhotography}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Service-Specific Fields */}
                  {selectedService && (
                    <div className="border-t pt-4 sm:pt-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-4">
                        {language === "en" ? "Service Details" : "Détails du Service"}
                      </h3>
                      {renderServiceSpecificFields()}
                    </div>
                  )}

                  {/* Final Section */}
                  <div className="border-t pt-4 sm:pt-6">
                    <div>
                      <Label htmlFor="additionalInformation" className="text-sm sm:text-base">
                        {ft.additionalInformation}
                      </Label>
                      <Textarea
                        id="additionalInformation"
                        placeholder={
                          language === "en"
                            ? "Any additional details, timeline requirements, or special requests"
                            : "Tout détail supplémentaire, exigences de délai ou demandes spéciales"
                        }
                        value={formData.additionalInformation}
                        onChange={(e) => setFormData((prev) => ({ ...prev, additionalInformation: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || submissionInProgress || submissionRef.current}
                    className="w-full bg-white text-[#000050] hover:bg-[#000050] hover:text-white border border-[#000050] transition-colors duration-300 text-base sm:text-lg py-3 sm:py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || submissionInProgress ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#000050] mr-2"></div>
                        {language === "en" ? "Submitting..." : "Soumission en cours..."}
                      </div>
                    ) : (
                      ft.submitQuote
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000050] text-white py-8 sm:py-12 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="md:col-span-2">
              <div className="hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer inline-block">
                <Image
                  src="/logo-white.svg"
                  alt="Heavy D Logo"
                  width={120}
                  height={48}
                  className="h-10 sm:h-12 w-auto mb-4"
                />
              </div>
              <p className="text-sm sm:text-base text-gray-300 max-w-md">{t.footerDesc}</p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t.servicesFooter}</h3>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-300">
                {services.slice(0, 6).map((service) => (
                  <li key={service.id}>{service.title}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t.contactInfo}</h3>
              <div className="space-y-2 text-sm sm:text-base text-gray-300 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Grande-Entrée, Magdalen Islands</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>info@heavydetailing.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>(514) 883-6732</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-semibold mb-2">{t.followUs}</h4>
                <div className="flex space-x-3">
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white hover:scale-110 transition-all duration-300"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white hover:scale-110 transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white hover:scale-110 transition-all duration-300"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-300">
            <p>&copy; 2024 Heavy D Print & Design. {t.rightsReserved}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
