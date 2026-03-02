import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { QuestService } from "@/lib/services";
import { Badge, Event } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";
import { useSession } from "next-auth/react";

interface CreateQuestFormData {
  title: string;
  description: string;
  reward: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
  status: "draft" | "active" | "completed" | "expired";
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  currentParticipants: number;
  badgeIds?: number[];
  platform_type?: string;
  interaction_type?: string;
  quest_link?: string;
  channel_id?: string;
  event_id?: number;
  quest_type?: string;
  progress_to_add?: number;
  createdBy?: number;
  added_by?: number;
  steps?: string[];
  manual_submission?: boolean;
  with_evidence?: boolean;
  requires_attachment?: boolean;
  featured?: boolean;
}

// Input sanitization helper
const sanitizeInput = (input: string) => {
  if (typeof window !== "undefined" && DOMPurify) {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  return input.replace(/<[^>]*>/g, "").replace(/[<>"'&]/g, "");
};

export const useCreateQuestForm = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "draft" | "active" | "completed" | "expired"
  >("draft");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("18:00");
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [platform, setPlatform] = useState<string>("");
  const [interactionType, setInteractionType] = useState<string>("");
  const [channelId, setChannelId] = useState<string>("");
  const [questType, setQuestType] = useState<string>("hedera_profile_completion");
  const [progressToAdd, setProgressToAdd] = useState<number>(10);
  const [steps, setSteps] = useState<string[]>([]);
  const { data: session } = useSession();

  const { toast } = useToast();

  const platformInteractions: { [key: string]: string[] } = {
    twitter: ["follow", "like", "comment", "tweet"],
    facebook: ["follow", "like", "comment", "share"],
    linkedin: [ "like", "comment", "share","connect"],
    discord: ["join", "message", "react"],
    other: ["visit", "signup", "complete", "submit", "participate"],
  };

  const { register, handleSubmit, setValue, watch } = useForm<CreateQuestFormData>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingBadges(true);
        setLoadingEvents(true);

        const [badgesList, eventsList] = await Promise.all([
          QuestService.getAllBadges(session?.user?.token),
          QuestService.getEvents(session?.user?.token),
        ]);

        setBadges(badgesList);
        setEvents(eventsList);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingBadges(false);
        setLoadingEvents(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: CreateQuestFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate Discord channel ID requirement
      if (platform === "discord" && interactionType === "join" && !channelId.trim()) {
        setError("Channel ID is required when platform is Discord and interaction is Join");
        toast({
          title: "Missing Channel ID",
          description: "Please provide a Discord channel ID for users to join.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (selectedBadges.length > 10) {
        setError("Cannot assign more than 10 badges to a single quest");
        toast({
          title: "Too Many Badges",
          description: "You can only assign up to 10 badges per quest. Please remove some badges and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (
        data.reward &&
        data.reward > 0 &&
        selectedBadges.length === 0 &&
        status === "active"
      ) {
        const confirmProceed = window.confirm(
          "This quest offers points but no badges. Are you sure you want to proceed?"
        );
        if (!confirmProceed) {
          setIsLoading(false);
          return;
        }
      }

      // Show loading toast
      const loadingToast = toast({
        title: "Creating Quest...",
        description: "Please wait while we create your quest.",
        variant: "default"
      });

      const formatDateTime = (date: Date | undefined, time: string) => {
        if (!date) return "";
        const [hours, minutes] = time.split(":");
        const dateWithTime = new Date(date);
        dateWithTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return dateWithTime.toISOString().slice(0, 19);
      };

      setValue("startDate", formatDateTime(startDate, startTime));
      setValue("endDate", formatDateTime(endDate, endTime));

      const questData = {
        ...data,
        title: sanitizeInput(data.title.trim()),
        description: sanitizeInput(data.description.trim()),
        status,
        startDate: formatDateTime(startDate, startTime),
        endDate: formatDateTime(endDate, endTime),
        maxParticipants: data.maxParticipants || undefined,
        currentParticipants: 0, // New quests start with 0 participants
        badgeIds: selectedBadges.length > 0 ? selectedBadges : undefined,
        quest_link: data.quest_link
          ? sanitizeInput(data.quest_link.trim())
          : undefined,
        // Include channel_id only when platform is discord and interaction is join
        channel_id: (platform === "discord" && interactionType === "join" && channelId.trim())
          ? sanitizeInput(channelId.trim())
          : undefined,
        // quest_type: questType,
        progress_to_add: progressToAdd,
        createdBy: session?.user?.id ? Number(session.user.id) : undefined,
        added_by: session?.user?.id ? Number(session.user.id) : undefined,
        steps: steps.filter(step => step.trim() !== ''), // Only include non-empty steps
        manual_submission: data.manual_submission || false, // Include the manual submission flag
        with_evidence: data.with_evidence || false, // Include the URL submission flag
        requires_attachment: data.requires_attachment || false, // Include the attachment requirement flag
        featured: data.featured || false, // Include the featured flag
      };

      await QuestService.createQuest(questData, session?.user?.token);
      
      // Dismiss loading toast
      loadingToast.dismiss();
      
      // Show success toast with appropriate message based on status
      let successTitle = "Quest Created Successfully! 🎉";
      let successDescription = "";
      
      if (status === "active") {
        successTitle = "Quest Created and Published! 🚀";
        successDescription = `"${questData.title}" is now live and available for users to complete. It offers ${data.reward || 0} points${selectedBadges.length > 0 ? ` and ${selectedBadges.length} badge${selectedBadges.length > 1 ? 's' : ''}` : ''}.`;
      } else if (status === "draft") {
        successTitle = "Quest Saved as Draft 📝";
        successDescription = `"${questData.title}" has been saved as a draft. You can edit and publish it later from the quest management page.`;
      } else {
        successDescription = `"${questData.title}" has been created with ${status} status.`;
      }
      
      toast({
        title: successTitle,
        description: successDescription,
        variant: "default"
      });
      
      onSuccess?.();
    } catch (err) {
      console.error("Error creating quest:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create quest. Please try again.";
      setError(errorMessage);
      
      // Show appropriate error toast
      let toastTitle = "Quest Creation Failed";
      let toastDescription = errorMessage;
      
      if (errorMessage.toLowerCase().includes('title') && errorMessage.toLowerCase().includes('already')) {
        toastTitle = "Duplicate Quest Title";
        toastDescription = "A quest with this title already exists. Please choose a different title.";
      } else if (errorMessage.toLowerCase().includes('validation')) {
        toastTitle = "Validation Error";
        toastDescription = "Please check all required fields and ensure they meet the requirements.";
      } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('unauthorized')) {
        toastTitle = "Permission Denied";
        toastDescription = "You don't have permission to create quests.";
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
        toastTitle = "Connection Error";
        toastDescription = "Unable to create quest due to connection issues. Please check your internet and try again.";
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedBadges,
    setSelectedBadges,
    badges,
    loadingBadges,
    events,
    loadingEvents,
    platform,
    setPlatform,
    interactionType,
    setInteractionType,
    channelId,
    setChannelId,
    questType,
    setQuestType,
    progressToAdd,
    setProgressToAdd,
    steps,
    setSteps,
    platformInteractions,
    register,
    handleSubmit,
    onSubmit,
    setValue,
    watch, 
  };
};
