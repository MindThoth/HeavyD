"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "en" | "fr"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  en: {
    // Login
    login: {
      title: "Client Portal",
      description: "Access your project dashboard",
      email: "Email Address",
      emailPlaceholder: "Enter your email",
      accessCode: "Access Code",
      accessCodePlaceholder: "Enter your 4-8 digit code",
      button: "Sign In",
      loggingIn: "Signing in...",
      autoLogging: "Signing you in automatically...",
      pleaseWait: "Please wait a moment...",
      needHelp: "Need help accessing your account?",
      contactEmail: "Email us at",
      contactPhone: "Call us at",
      error: {
        required: "Email and access code are required",
        codeLength: "Access code must be 4-8 digits",
        connection: "Connection error. Please try again.",
      },
    },

    // Header
    header: {
      logout: "Logout",
      needHelp: "Need help?",
    },

    // Language
    language: {
      french: "Français",
      english: "English",
    },

    // Welcome
    welcome: {
      title: "Welcome back, {{name}}!",
    },

    // Project
    project: {
      title: "Project Information",
      client: "Client",
      company: "Company",
      service: "Service",
      status: "Project Status",
      currentStatus: "Current Status",
      stepsCompleted: "{{completed}} of {{total}} steps completed",
    },

    // Quote
    quote: {
      title: "Your Quote",
      label: "QUOTE",
      acceptQuote: "Accept Quote",
      processing: "Processing...",
      accepted: "Quote Accepted!",
      acceptedDescription: "We'll begin work on your project soon.",
      viewQuote: "View Quote",
      projectQuote: "Project Quote",
      detailedBreakdown: "Detailed breakdown and information",
    },

    // Receipt
    receipt: {
      title: "Your Receipt",
      label: "RECEIPT",
      paidLabel: "PAID",
      backToDashboard: "Back to Dashboard",
      headerTitle: "Heavy D Print & Design",
      companyName: "Heavy D Print & Design",
      tagline: "Professional Print & Design Services",
      clientInformation: "Client Information",
      documentDetails: "Document Details",
      receiptDetails: "Receipt Details",
      quoteBreakdown: "Quote Breakdown",
      clientName: "Client Name",
      company: "Company",
      service: "Service",
      email: "Email",
      phone: "Phone",
      documentType: "Document Type",
      receiptType: "Receipt",
      quoteType: "Quote",
      status: "Status",
      date: "Date",
      accessCode: "Access Code",
      itemDescription: "Item Description",
      quantity: "Quantity",
      unitPrice: "Unit Price",
      total: "Total",
      subtotal: "Subtotal",
      gst: "GST (5%)",
      qst: "QST (9.975%)",
      finalTotal: "Total with Taxes",
      totalAmount: "TOTAL AMOUNT",
      paidBadge: "PAID",
      payNow: "Pay Now",
      downloadPdf: "Download PDF",
      downloadQuotePdf: "Download Quote PDF",
      loadingDetails: "Loading {{type}} details...",
      receipt: "receipt",
      quote: "quote",
      thankYou: "Thank you for choosing Heavy D Print & Design for your project needs.",
      questionsContact: "Questions? Contact us at",
      or: "or",
      emailLabel: "Email",
      phoneLabel: "Phone",
      websiteLabel: "Website",
      copyright: "© 2024 Heavy D Print & Design. All rights reserved.",
      accessDenied: "Access Denied",
      invalidCredentials: "Invalid credentials provided.",
      viewReceipt: "View Receipt",
      projectReceipt: "Project Receipt",
    },

    // Timeline
    timeline: {
      title: "Project Timeline",
      quoteSent: "Quote has been prepared and sent",
      quoteAccepted: "Quote accepted, work will begin",
      inProgress: "Project is currently being worked on",
      designed: "Design phase has been completed",
      printed: "Printing phase has been completed",
      completed: "Project has been completed",
      paid: "Payment received, thank you!",
      statusDescriptions: {
        quote_sent: "Quote has been sent to you",
        quote_accepted: "Quote accepted, work will begin soon",
        in_progress: "Your project is currently being worked on",
        designed: "Design phase completed",
        printed: "Printing phase completed",
        completed: "Project completed successfully",
        paid: "Payment received, thank you!",
      },
    },

    // Revisions
    revisions: {
      title: "Design Revisions",
      description: "Review and provide feedback on design revisions",
      noRevisions: "No revisions available yet",
      notified: "You'll be notified when designs are ready for review",
      loading: "Loading revisions...",
      feedback: "Feedback for Revision {{number}}",
      feedbackPlaceholder: "Share your thoughts on this revision...",
      submitting: "Submitting...",
      submitFeedback: "Submit Feedback",
    },

    // Upload
    upload: {
      title: "File Upload",
      description: "Upload files, images, or documents for your project",
      success: "{{count}} file(s) uploaded successfully!",
      dragDrop: "Drag and drop files here",
      dropHere: "Drop files here",
      orClick: "or click to browse",
      chooseFiles: "Choose Files",
      or: "or",
      openFolder: "Open Folder",
      supportedFiles: "All file types supported",
      fileUploads: "File Uploads",
      failed: "Upload failed",
      completed: "Upload completed",
    },

    // Contact
    contact: {
      title: "Need Help?",
      description: "Have questions or need assistance? Get in touch with us.",
    },

    // Footer
    footer: {
      description: "Professional printing and design services",
    },

    // Loading
    loading: {
      general: "Loading...",
    },

    // Errors
    errors: {
      timeout: "Request timed out. Please try again.",
      cors: "Connection blocked. Please contact support.",
      network: "Network error. Please check your connection and try again.",
    },
  },
  fr: {
    // Login
    login: {
      title: "Portail Client",
      description: "Accédez à votre tableau de bord de projet",
      email: "Adresse e-mail",
      emailPlaceholder: "Entrez votre e-mail",
      accessCode: "Code d'accès",
      accessCodePlaceholder: "Entrez votre code à 4-8 chiffres",
      button: "Se connecter",
      loggingIn: "Connexion en cours...",
      autoLogging: "Connexion automatique en cours...",
      pleaseWait: "Veuillez patienter un moment...",
      needHelp: "Besoin d'aide pour accéder à votre compte?",
      contactEmail: "Envoyez-nous un e-mail à",
      contactPhone: "Appelez-nous au",
      error: {
        required: "L'e-mail et le code d'accès sont requis",
        codeLength: "Le code d'accès doit contenir 4 à 8 chiffres",
        connection: "Erreur de connexion. Veuillez réessayer.",
      },
    },

    // Header
    header: {
      logout: "Déconnexion",
      needHelp: "Besoin d'aide?",
    },

    // Language
    language: {
      french: "Français",
      english: "English",
    },

    // Welcome
    welcome: {
      title: "Bon retour, {{name}}!",
    },

    // Project
    project: {
      title: "Informations du Projet",
      client: "Client",
      company: "Entreprise",
      service: "Service",
      status: "Statut du Projet",
      currentStatus: "Statut Actuel",
      stepsCompleted: "{{completed}} sur {{total}} étapes terminées",
    },

    // Quote
    quote: {
      title: "Votre Devis",
      label: "DEVIS",
      acceptQuote: "Accepter le Devis",
      processing: "Traitement en cours...",
      accepted: "Devis Accepté!",
      acceptedDescription: "Nous commencerons bientôt à travailler sur votre projet.",
      viewQuote: "Voir le Devis",
      projectQuote: "Devis du Projet",
      detailedBreakdown: "Détail et informations complètes",
    },

    // Receipt
    receipt: {
      title: "Votre Reçu",
      label: "REÇU",
      paidLabel: "PAYÉ",
      backToDashboard: "Retour au Tableau de Bord",
      headerTitle: "Heavy D Print & Design",
      companyName: "Heavy D Print & Design",
      tagline: "Services Professionnels d'Impression et de Design",
      clientInformation: "Informations du Client",
      documentDetails: "Détails du Document",
      receiptDetails: "Détails du Reçu",
      quoteBreakdown: "Détail du Devis",
      clientName: "Nom du Client",
      company: "Entreprise",
      service: "Service",
      email: "Courriel",
      phone: "Téléphone",
      documentType: "Type de Document",
      receiptType: "Reçu",
      quoteType: "Devis",
      status: "Statut",
      date: "Date",
      accessCode: "Code d'Accès",
      itemDescription: "Description de l'Article",
      quantity: "Quantité",
      unitPrice: "Prix Unitaire",
      total: "Total",
      subtotal: "Sous-total",
      gst: "TPS (5%)",
      qst: "TVQ (9,975%)",
      finalTotal: "Total avec Taxes",
      totalAmount: "MONTANT TOTAL",
      paidBadge: "PAYÉ",
      payNow: "Payer Maintenant",
      downloadPdf: "Télécharger PDF",
      downloadQuotePdf: "Télécharger le Devis PDF",
      loadingDetails: "Chargement des détails du {{type}}...",
      receipt: "reçu",
      quote: "devis",
      thankYou: "Merci d'avoir choisi Heavy D Print & Design pour vos besoins de projet.",
      questionsContact: "Des questions? Contactez-nous à",
      or: "ou",
      emailLabel: "Courriel",
      phoneLabel: "Téléphone",
      websiteLabel: "Site Web",
      copyright: "© 2024 Heavy D Print & Design. Tous droits réservés.",
      accessDenied: "Accès Refusé",
      invalidCredentials: "Identifiants invalides fournis.",
      viewReceipt: "Voir le Reçu",
      projectReceipt: "Reçu du Projet",
    },

    // Timeline
    timeline: {
      title: "Chronologie du Projet",
      quoteSent: "Le devis a été préparé et envoyé",
      quoteAccepted: "Devis accepté, le travail va commencer",
      inProgress: "Le projet est actuellement en cours",
      designed: "La phase de conception est terminée",
      printed: "La phase d'impression est terminée",
      completed: "Le projet a été terminé",
      paid: "Paiement reçu, merci!",
      statusDescriptions: {
        quote_sent: "Le devis vous a été envoyé",
        quote_accepted: "Devis accepté, le travail va bientôt commencer",
        in_progress: "Votre projet est actuellement en cours",
        designed: "Phase de conception terminée",
        printed: "Phase d'impression terminée",
        completed: "Projet terminé avec succès",
        paid: "Paiement reçu, merci!",
      },
    },

    // Revisions
    revisions: {
      title: "Révisions de Design",
      description: "Examinez et donnez votre avis sur les révisions de design",
      noRevisions: "Aucune révision disponible pour le moment",
      notified: "Vous serez averti lorsque les designs seront prêts pour révision",
      loading: "Chargement des révisions...",
      feedback: "Commentaires pour la Révision {{number}}",
      feedbackPlaceholder: "Partagez vos pensées sur cette révision...",
      submitting: "Envoi en cours...",
      submitFeedback: "Soumettre les Commentaires",
    },

    // Upload
    upload: {
      title: "Téléchargement de Fichiers",
      description: "Téléchargez des fichiers, images ou documents pour votre projet",
      success: "{{count}} fichier(s) téléchargé(s) avec succès!",
      dragDrop: "Glissez et déposez les fichiers ici",
      dropHere: "Déposez les fichiers ici",
      orClick: "ou cliquez pour parcourir",
      chooseFiles: "Choisir des Fichiers",
      or: "ou",
      openFolder: "Ouvrir le Dossier",
      supportedFiles: "Tous les types de fichiers supportés",
      fileUploads: "Téléchargements de Fichiers",
      failed: "Échec du téléchargement",
      completed: "Téléchargement terminé",
    },

    // Contact
    contact: {
      title: "Besoin d'Aide?",
      description: "Avez-vous des questions ou besoin d'assistance? Contactez-nous.",
    },

    // Footer
    footer: {
      description: "Services professionnels d'impression et de design",
    },

    // Loading
    loading: {
      general: "Chargement...",
    },

    // Errors
    errors: {
      timeout: "Délai d'attente dépassé. Veuillez réessayer.",
      cors: "Connexion bloquée. Veuillez contacter le support.",
      network: "Erreur réseau. Vérifiez votre connexion et réessayez.",
    },
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("heavyd_language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fr")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("heavyd_language", lang)
  }

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    if (typeof value !== "string") {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }

    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match
      })
    }

    return value
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export function detectLanguageFromClient(clientLanguage: string): Language {
  if (clientLanguage && clientLanguage.toLowerCase().includes("fr")) {
    return "fr"
  }
  return "en"
}
