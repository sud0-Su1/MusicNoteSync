import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCallback } from "react";

export function useSpotify() {
  const { toast } = useToast();

  // Check if the user is connected to Spotify
  const { 
    data: spotifyStatus, 
    isLoading,
    error, 
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ["/api/spotify/status"],
    retry: false,
  });

  // Get current playback data
  const { 
    data: playerData, 
    isLoading: isPlayerLoading,
    refetch: refetchPlayer 
  } = useQuery({
    queryKey: ["/api/spotify/player"],
    enabled: !!spotifyStatus?.connected,
    refetchInterval: 5000, // Poll every 5 seconds when enabled
  });

  // Get user's playlists
  const { 
    data: playlists,
    isLoading: isPlaylistsLoading
  } = useQuery({
    queryKey: ["/api/spotify/playlists"],
    enabled: !!spotifyStatus?.connected,
  });

  // Play/resume track
  const { mutate: playTrack, isPending: isPlayPending } = useMutation({
    mutationFn: async (uri?: string) => {
      return await apiRequest("POST", "/api/spotify/play", { uri });
    },
    onSuccess: () => {
      setTimeout(() => refetchPlayer(), 300);
    },
    onError: (error) => {
      toast({
        title: "Playback error",
        description: error instanceof Error ? error.message : "Failed to play track",
        variant: "destructive",
      });
    },
  });

  // Pause track
  const { mutate: pauseTrack, isPending: isPausePending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/spotify/pause", {});
    },
    onSuccess: () => {
      setTimeout(() => refetchPlayer(), 300);
    },
    onError: (error) => {
      toast({
        title: "Playback error",
        description: error instanceof Error ? error.message : "Failed to pause track",
        variant: "destructive",
      });
    },
  });

  // Skip to next track
  const { mutate: skipToNext, isPending: isNextPending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/spotify/next", {});
    },
    onSuccess: () => {
      setTimeout(() => refetchPlayer(), 300);
    },
    onError: (error) => {
      toast({
        title: "Playback error",
        description: error instanceof Error ? error.message : "Failed to skip to next track",
        variant: "destructive",
      });
    },
  });

  // Skip to previous track
  const { mutate: skipToPrevious, isPending: isPreviousPending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/spotify/previous", {});
    },
    onSuccess: () => {
      setTimeout(() => refetchPlayer(), 300);
    },
    onError: (error) => {
      toast({
        title: "Playback error",
        description: error instanceof Error ? error.message : "Failed to go to previous track",
        variant: "destructive",
      });
    },
  });

  // Disconnect from Spotify
  const { mutate: disconnect, isPending: isDisconnectPending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/spotify/disconnect", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spotify/status"] });
      toast({
        title: "Spotify disconnected",
        description: "Your Spotify account has been disconnected",
      });
    },
  });

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!spotifyStatus?.connected) return;
    
    if (playerData?.is_playing) {
      pauseTrack();
    } else {
      playTrack();
    }
  }, [spotifyStatus, playerData, pauseTrack, playTrack]);

  return {
    isConnected: !!spotifyStatus?.connected,
    isLoading,
    error,
    playerData,
    isPlayerLoading,
    playlists,
    isPlaylistsLoading,
    playTrack,
    pauseTrack,
    skipToNext,
    skipToPrevious,
    disconnect,
    togglePlayPause,
    isPlayPending,
    isPausePending,
    isNextPending,
    isPreviousPending,
    isDisconnectPending,
    refetchStatus,
    refetchPlayer,
  };
}
