import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type SpotifyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SpotifyModal({ isOpen, onClose }: SpotifyModalProps) {
  const handleConnect = () => {
    // Redirect to Spotify auth endpoint
    window.location.href = "/api/spotify/auth";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Connect to Spotify</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-300 pt-4">
            Connect your Spotify account to play music directly in Notes & Vibes. We'll need your permission to:
          </DialogDescription>
        </DialogHeader>
        
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-center">
            <i className="ri-check-line text-green-500 mr-2"></i>
            <span>Access your Spotify playlists</span>
          </li>
          <li className="flex items-center">
            <i className="ri-check-line text-green-500 mr-2"></i>
            <span>Play music from your library</span>
          </li>
          <li className="flex items-center">
            <i className="ri-check-line text-green-500 mr-2"></i>
            <span>Control playback (play, pause, skip)</span>
          </li>
        </ul>
        
        <button 
          onClick={handleConnect}
          className="w-full py-3 bg-[#1DB954] hover:bg-opacity-90 transition rounded-md text-white font-medium flex items-center justify-center"
        >
          <i className="ri-spotify-fill mr-2 text-lg"></i> Continue with Spotify
        </button>
        
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
          By connecting, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
