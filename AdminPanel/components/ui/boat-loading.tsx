import Image from "next/image"

export function BoatLoading({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { logo: "h-10 w-24" },
    md: { logo: "h-14 w-36" },
    lg: { logo: "h-20 w-52" }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.98);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.6;
          }
        }

        .logo-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        .loading-text {
          animation: fadeIn 0.5s ease-in;
        }
      `}</style>

      {/* Logo with pulse animation */}
      <div className={`${sizeMap[size].logo} relative logo-pulse`}>
        <Image
          src="/logo/heavyd.svg"
          alt="Loading"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Loading text */}
      <p className="text-sm text-gray-500 loading-text">Loading...</p>
    </div>
  )
}
