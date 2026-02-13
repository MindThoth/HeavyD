import Image from "next/image"

interface LogoLoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LogoLoading({ size = "md", className = "" }: LogoLoadingProps) {
  const sizeMap = {
    sm: "h-12 w-32",
    md: "h-16 w-40",
    lg: "h-24 w-60"
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeMap[size]} relative animate-pulse`}>
        <Image
          src="/logo/heavyd.svg"
          alt="Heavy D Loading"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}

export function LogoLoadingWhite({ size = "md", className = "" }: LogoLoadingProps) {
  const sizeMap = {
    sm: "h-12 w-32",
    md: "h-16 w-40",
    lg: "h-24 w-60"
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeMap[size]} relative animate-pulse`}>
        <Image
          src="/logo/heavyd-white.svg"
          alt="Heavy D Loading"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
