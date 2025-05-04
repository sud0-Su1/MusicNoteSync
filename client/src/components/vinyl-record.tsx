import { cn } from "@/lib/utils";

type VinylRecordProps = {
  isPlaying: boolean;
  albumArt: string;
  size?: "sm" | "md" | "lg";
};

export default function VinylRecord({ 
  isPlaying, 
  albumArt,
  size = "md" 
}: VinylRecordProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-32 w-32"
  };
  
  return (
    <div className={cn(
      "vinyl-record relative rounded-full shadow-md", 
      sizeClasses[size],
      isPlaying && "animate-vinyl-spin"
    )}>
      <div className="vinyl-grooves"></div>
      <img 
        src={albumArt} 
        alt="Album Cover" 
        className="absolute inset-0 rounded-full opacity-50 mix-blend-overlay object-cover"
      />
    </div>
  );
}

// Define custom animation
export const VinylSpinAnimation = `
@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-vinyl-spin {
  animation: vinyl-spin 2s linear infinite;
}
`;
