"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { QuestService } from "@/lib/services";
import { AlertCircle, CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge, Quest, Event } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { EventsApi } from "@/lib/api/events";
import { useSession } from "next-auth/react";

const editQuestSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  reward: z.number().min(0, "Reward must be positive").optional(),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
  status: z.enum(["draft", "active", "completed", "expired"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxParticipants: z
    .number()
    .min(0, "Max participants cannot be negative")
    .optional()
    .nullable(),
  badgeIds: z.array(z.number()).optional(),
  platform_type: z.string().optional(),
  interaction_type: z.string().optional(),
  quest_link: z.string().optional(),
  channel_id: z.string().optional(),
  event_id: z.number().nullable().optional(),
  quest_type: z.string().optional(),
  progress_to_add: z.number().optional(),
  createdBy: z.number().optional(),
  added_by: z.number().optional(),
  steps: z.array(z.string()).optional(),
  manual_submission: z.boolean().optional(),
  with_evidence: z.boolean().optional(),
  requires_attachment: z.boolean().optional(),
  featured: z.boolean().optional(),
}).refine((data) => {
  // If platform is discord and interaction is join, channel_id is required
  if (data.platform_type === "discord" && data.interaction_type === "join") {
    return data.channel_id && data.channel_id.trim().length > 0;
  }
  return true;
}, {
  message: "Channel ID is required when platform is Discord and interaction is Join",
  path: ["channel_id"],
});

type EditQuestFormData = z.infer<typeof editQuestSchema>;

interface EditQuestFormProps {
  questId: number | string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditQuestForm({
  questId,
  onSuccess,
  onCancel,
}: EditQuestFormProps) {
  console.log("EditQuestForm mounted with questId:", questId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuest, setIsLoadingQuest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [status, setStatus] = useState<
    "draft" | "active" | "completed" | "expired"
  >("draft");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("18:00");
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [questType, setQuestType] = useState<string>("hedera_profile_completion");
  const [progressToAdd, setProgressToAdd] = useState<number>(10);
  const [steps, setSteps] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("none");
  const [channelId, setChannelId] = useState<string>("");
  const { toast } = useToast();
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditQuestFormData>({
    resolver: zodResolver(editQuestSchema),
  });

  // Fetch quest data by ID
  useEffect(() => {
    const fetchQuest = async () => {
      if (!questId) {
        console.log("No questId provided");
        return;
      }
      
      try {
        console.log("Starting to fetch quest with ID:", questId);
        console.log("Session token available:", session?.user?.token ? "Yes" : "No");
        
        setIsLoadingQuest(true);
        setError(null);
        
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
        );
        
        const questPromise = QuestService.getQuest(String(questId), session?.user?.token);
        
        console.log("Making API call...");
        const questData = await Promise.race([questPromise, timeoutPromise]);
        
        console.log("Quest data received:", questData);
        
        if (!questData) {
          throw new Error("Quest not found");
        }
        
        setQuest(questData);
        
        // Initialize form with quest data
        console.log("Quest platform_type from API:", questData.platform_type);
        console.log("Quest interaction_type from API:", questData.interaction_type);
        
        reset({
          title: questData.title,
          description: questData.description,
          reward: typeof questData.reward === "string" ? parseFloat(questData.reward) : questData.reward,
          difficulty: questData.difficulty as any,
          status: questData.status as any,
          maxParticipants: questData.maxParticipants,
          platform_type: questData.platform_type || "",
          interaction_type: questData.interaction_type || "",
          quest_link: questData.quest_link || "",
          event_id: questData.event_id,
          quest_type: questData.quest_type,
          progress_to_add: questData.progress_to_add,
          createdBy: questData.createdBy,
          added_by: questData.added_by,
          manual_submission: questData.manual_submission || false,
          with_evidence: questData.with_evidence || false,
          requires_attachment: questData.requires_attachment || false,
          featured: questData.featured || false,
        });
        
        // Initialize state variables
        setStatus((questData.status as any) || "draft");
        setStartDate(questData.startDate ? new Date(questData.startDate) : undefined);
        setEndDate(questData.endDate ? new Date(questData.endDate) : undefined);
        
        // Initialize time fields
        if (questData.startDate) {
          const date = new Date(questData.startDate);
          setStartTime(`${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`);
        }
        if (questData.endDate) {
          const date = new Date(questData.endDate);
          setEndTime(`${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`);
        }
        
        // Initialize badges
        const questBadgeIds = questData.badges?.map((badge: any) => 
          typeof badge === "object" ? badge.id : badge
        ) || [];
        setSelectedBadges(questBadgeIds);
        
        // Initialize quest type and progress
        setQuestType(questData.quest_type || "hedera_profile_completion");
        setProgressToAdd(questData.progress_to_add || 10);
        
        // Initialize selected event
        setSelectedEventId(questData.event_id ? String(questData.event_id) : "none");
        
        // Initialize channel_id
        setChannelId(questData.channel_id || "");
        
        // Parse and initialize steps from quest_steps
        if (questData.quest_steps && typeof questData.quest_steps === 'string') {
          const parsedSteps = questData.quest_steps.split('#quest_ending#').filter(step => step.trim() !== '');
          setSteps(parsedSteps);
        } else if (questData.quest_steps && typeof questData.quest_steps === 'string') {
          // Fallback to instructions field if quest_steps is not available
          const parsedSteps = questData.quest_steps.split('#quest_ending#').filter(step => step.trim() !== '');
          setSteps(parsedSteps);
        } else {
          setSteps([]);
        }
        
        // Force form to update platform and interaction types
        setTimeout(() => {
          if (questData.platform_type) {
            setValue("platform_type", questData.platform_type);
          }
          if (questData.interaction_type) {
            setValue("interaction_type", questData.interaction_type);
          }
        }, 100);
        
      } catch (err) {
        console.error("Error fetching quest:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch quest data. Please try again.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        console.log("Setting isLoadingQuest to false");
        setIsLoadingQuest(false);
      }
    };

    fetchQuest();
  }, [questId, session?.user?.token, reset, toast]);

  // Fetch badges and events when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingBadges(true);
        setLoadingEvents(true);

        const [badgesList, eventsList] = await Promise.all([
          QuestService.getAllBadges(session?.user?.token),
          EventsApi.list(session?.user?.token),
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
  }, [session?.user?.token]);

  const onSubmit = async (data: EditQuestFormData) => {
    if (!quest) {
      toast({
        title: "Error",
        description: "Quest data not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate Discord channel ID requirement
      if (data.platform_type === "discord" && data.interaction_type === "join" && !channelId.trim()) {
        setError("Channel ID is required when platform is Discord and interaction is Join");
        toast({
          title: "Missing Channel ID",
          description: "Please provide a Discord channel ID for users to join.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } catch (validationError) {
      setIsLoading(false);
      return;
    }

    // Show loading toast
    const loadingToast = toast({
      title: "Updating Quest...",
      description: "Please wait while we save your changes.",
      variant: "default"
    });

    try {
      console.log("Updating quest data:", data);
      console.log("Current quest event_id:", quest.event_id, "New event_id:", data.event_id);

      // Format dates with times
      const formatDateTime = (date: Date | undefined, time: string) => {
        if (!date) return undefined;
        const [hours, minutes] = time.split(":");
        const dateWithTime = new Date(date);
        dateWithTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return dateWithTime.toISOString();
      };

      // Only include fields that have been modified
      const updateData: any = {};

      if (data.title !== undefined && data.title !== quest.title) {
        updateData.title = data.title;
      }
      if (
        data.description !== undefined &&
        data.description !== quest.description
      ) {
        updateData.description = data.description;
      }
      if (
        data.reward !== undefined &&
        data.reward !==
          (typeof quest.reward === "string"
            ? parseFloat(quest.reward)
            : quest.reward)
      ) {
        updateData.reward = data.reward;
      }
      if (
        data.difficulty !== undefined &&
        data.difficulty !== quest.difficulty
      ) {
        updateData.difficulty = data.difficulty;
      }
      if (status !== quest.status) {
        updateData.status = status;
      }
      if (
        data.maxParticipants !== undefined &&
        data.maxParticipants !== quest.maxParticipants
      ) {
        updateData.maxParticipants = data.maxParticipants;
      }

      const formattedStartDate = formatDateTime(startDate, startTime);
      const formattedEndDate = formatDateTime(endDate, endTime);

      if (formattedStartDate !== quest.startDate) {
        updateData.startDate = formattedStartDate;
      }
      if (formattedEndDate !== quest.endDate) {
        updateData.endDate = formattedEndDate;
      }

      const currentBadgeIds =
        quest.badges?.map((badge) =>
          typeof badge === "object" ? badge.id : badge
        ) || [];
      if (
        JSON.stringify(selectedBadges.sort()) !==
        JSON.stringify(currentBadgeIds.sort())
      ) {
        updateData.badgeIds = selectedBadges.length > 0 ? selectedBadges : [];
      }

      // Handle event_id update - properly handle null to clear event association
      const currentEventId = quest.event_id;
      const newEventId = data.event_id;
      if (currentEventId !== newEventId) {
        updateData.event_id = newEventId;
      }
      if (data.platform_type !== quest.platform_type) {
        updateData.platform_type = data.platform_type === "" ? null : data.platform_type;
      }
      if (data.interaction_type !== quest.interaction_type) {
        updateData.interaction_type = data.interaction_type === "" ? null : data.interaction_type;
      }
      if (data.quest_link !== quest.quest_link) {
        updateData.quest_link = data.quest_link;
      }

      // Handle channel_id update
      if (channelId !== (quest.channel_id || "")) {
        updateData.channel_id = channelId.trim() || null;
      }

      // Handle manual_submission update
      if (data.manual_submission !== (quest.manual_submission || false)) {
        updateData.manual_submission = data.manual_submission || false;
      }

      // Handle with_evidence update
      if (data.with_evidence !== (quest.with_evidence || false)) {
        updateData.with_evidence = data.with_evidence || false;
      }

      // Handle requires_attachment update
      if (data.requires_attachment !== (quest.requires_attachment || false)) {
        updateData.requires_attachment = data.requires_attachment || false;
      }

      // Handle featured update
      if (data.featured !== (quest.featured || false)) {
        updateData.featured = data.featured || false;
      }

      // Handle steps update
      const filteredSteps = steps.filter(step => step.trim() !== '');
      const currentQuestSteps = quest.quest_steps || quest.quest_steps || '';
      const currentSteps = currentQuestSteps ? currentQuestSteps.split('#quest_ending#').filter((step: string) => step.trim() !== '') : [];
      
      if (JSON.stringify(filteredSteps) !== JSON.stringify(currentSteps)) {
        updateData.steps = filteredSteps;
      }

      console.log("Final update data being sent to backend:", updateData);

      if (Object.keys(updateData).length === 0) {
        // Dismiss loading toast
        loadingToast.dismiss();
        
        toast({
          title: "No Changes Detected",
          description: "No modifications were made to the quest.",
          variant: "default"
        });
        onSuccess?.();
        return;
      }

      await QuestService.updateQuest(String(quest.id), updateData, session?.user?.token);
      
      // Dismiss loading toast
      loadingToast.dismiss();
      
      console.log("Quest updated successfully");
      
      // Show success toast with details about what was updated
      const updatedFields = Object.keys(updateData);
      let successDescription = `"${data.title || quest.title}" has been successfully updated.`;
      
      if (updatedFields.includes('status')) {
        if (updateData.status === 'active') {
          successDescription += " The quest is now live and available to users.";
        } else if (updateData.status === 'draft') {
          successDescription += " The quest has been saved as a draft.";
        }
      }
      
      if (updatedFields.includes('reward')) {
        successDescription += ` Reward updated to ${updateData.reward} points.`;
      }
      
      toast({
        title: "Quest Updated Successfully! ✅",
        description: successDescription,
        variant: "default"
      });
      
      onSuccess?.();
    } catch (err: any) {
      // Dismiss loading toast
      loadingToast.dismiss();
      
      console.error("Error updating quest:", err);
      
      // Extract error message from the API error structure
      // The API client transforms errors, so we check multiple possible locations
      const errorMessage = err?.message || 
                           err?.response?.data?.message || 
                           err?.data?.message ||
                           "Failed to update quest. Please try again.";
      setError(errorMessage);
      
      // Show appropriate error toast
      let toastTitle = "Quest Update Failed";
      let toastDescription = errorMessage;
      
      if (errorMessage.toLowerCase().includes('title') && errorMessage.toLowerCase().includes('already')) {
        toastTitle = "Duplicate Quest Title";
        toastDescription = "A quest with this title already exists. Please choose a different title.";
      } else if (errorMessage.toLowerCase().includes('validation')) {
        toastTitle = "Validation Error";
        toastDescription = "Please check all fields and ensure they meet the requirements.";
      } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('unauthorized')) {
        toastTitle = "Permission Denied";
        toastDescription = "You don't have permission to update this quest.";
      } else if (errorMessage.toLowerCase().includes('not found')) {
        toastTitle = "Quest Not Found";
        toastDescription = "The quest could not be found. It may have been deleted.";
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
        toastTitle = "Connection Error";
        toastDescription = "Unable to update quest due to connection issues. Please check your internet and try again.";
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

  const toggleBadge = (badgeId: number) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId)
        ? prev.filter((id) => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  // Step management functions
  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  // Show loading state while fetching quest
  if (isLoadingQuest) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading quest data...</span>
          </div>
        </div>
        {/* Add timeout warning after some time */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          If this takes longer than expected, there might be a connection issue.
        </div>
      </div>
    );
  }

  // Show error if quest failed to load
  if (error || !quest) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load quest data. Please try again."}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setError("");
              // Trigger a refetch by updating the dependency
              if (questId && session?.user?.token) {
                setIsLoadingQuest(true);
                window.location.reload(); // Simple way to retry
              }
            }}
          >
            Retry
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* <div className="mb-6">
        <h2 className="text-2xl font-bold">Edit Quest</h2>
        <p className="text-muted-foreground">Update the quest details below</p>
      </div> */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quest Title</Label>
              <Input
                id="title"
                placeholder="Enter quest title"
                className="max-w-md"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter detailed quest description"
                rows={4}
                className="max-w-2xl"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="manual_submission"
                checked={watch("manual_submission") || false}
                onCheckedChange={(checked: boolean) => {
                  setValue("manual_submission", checked === true);
                  // Reset both checkboxes when manual submission is unchecked
                  if (!checked) {
                    setValue("with_evidence", false);
                    setValue("requires_attachment", false);
                  }
                }}
              />
              <Label 
                htmlFor="manual_submission" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Manual Submission Quest
              </Label>
            </div>
            <div className="text-xs text-muted-foreground ml-6">
              Check this box if the quest requires manual submission and verification
            </div>

           

            {/* URL and Attachment options - only visible when manual_submission is checked */}
            {watch("manual_submission") && (
              <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                {/* URL Submission checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="with_evidence"
                      checked={watch("with_evidence") || false}
                      onCheckedChange={(checked: boolean) => {
                        setValue("with_evidence", checked === true);
                      }}
                    />
                    <Label 
                      htmlFor="with_evidence" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      URL Submission Required
                    </Label>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    Check if users need to provide a URL as evidence (e.g., social media post link)
                  </div>
                </div>

                {/* Attachment Requirement checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="requires_attachment"
                      checked={watch("requires_attachment") || false}
                      onCheckedChange={(checked: boolean) => {
                        setValue("requires_attachment", checked === true);
                      }}
                    />
                    <Label 
                      htmlFor="requires_attachment" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Attachment Required
                    </Label>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    Check if users must provide an attachment (image, document, etc.) as evidence
                  </div>
                </div>
              </div>
            )}
             <div className="flex items-center space-x-3">
              <Checkbox
                id="featured"
                checked={watch("featured") || false}
                onCheckedChange={(checked: boolean) => {
                  setValue("featured", checked === true);
                }}
              />
              <Label 
                htmlFor="featured" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Featured Quest
              </Label>
            </div>
            <div className="text-xs text-muted-foreground ml-6">
              Featured quests are highlighted and shown prominently to users
            </div>
          </div>
        </div>

        {/* Quest Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Quest Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="reward">Reward (points)</Label>
              <Input
                id="reward"
                type="number"
                placeholder="Enter reward points"
                className="max-w-xs"
                {...register("reward", { valueAsNumber: true })}
              />
              {errors.reward && (
                <p className="text-sm text-destructive">
                  {errors.reward.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                placeholder="Enter max participants"
                className="max-w-xs"
                {...register("maxParticipants", {
                  setValueAs: (value) => {
                    if (value === "" || value === null || value === undefined) {
                      return undefined;
                    }
                    const num = Number(value);
                    return isNaN(num) ? undefined : num;
                  },
                })}
              />
              {errors.maxParticipants && (
                <p className="text-sm text-destructive">
                  {errors.maxParticipants.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={watch("difficulty") || quest?.difficulty || "easy"}
                onValueChange={(value) => setValue("difficulty", value as any)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as any)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quest_type">Quest Type</Label>
              <Select
                value={questType}
                onValueChange={(value) => {
                  setQuestType(value);
                  setValue("quest_type", value);
                }}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select quest type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hedera_profile_completion">Hedera Profile Completion</SelectItem>
                  <SelectItem value="social_engagement">Social Engagement</SelectItem>
                  <SelectItem value="event_participation">Event Participation</SelectItem>
                  <SelectItem value="community_contribution">Community Contribution</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress_to_add">Progress to Add</Label>
              <Input
                id="progress_to_add"
                type="number"
                placeholder="Enter progress value"
                className="max-w-xs"
                value={progressToAdd}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setProgressToAdd(value);
                  setValue("progress_to_add", value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Progress points to add when quest is completed
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Advanced Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add any advanced settings here if needed */}
          </div>
        </div>

        {/* Event Association */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Event Association
          </h3>

          <div className="space-y-2">
            <Label htmlFor="event_id">Associated Event (Optional)</Label>
            {loadingEvents ? (
              <div className="flex items-center space-x-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading events...
                </span>
              </div>
            ) : (
              <Select
                value={selectedEventId}
                onValueChange={(value) => {
                  setSelectedEventId(value);
                  setValue(
                    "event_id",
                    value === "none" ? null : Number(value)
                  );
                }}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.event_id && (
              <p className="text-sm text-destructive">
                {errors.event_id.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Associate this quest with a specific event (completely optional)
            </p>
          </div>
        </div>

        {/* Platform & Interaction */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Platform & Interaction
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platform_type">Platform Type</Label>
              <Select
                value={watch("platform_type") || "none"}
                onValueChange={(value) =>
                  setValue(
                    "platform_type",
                    value === "none" ? "" : value
                  )
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.platform_type && (
                <p className="text-sm text-destructive">
                  {errors.platform_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction_type">Interaction Type</Label>
              <Select
                value={watch("interaction_type") || "none"}
                onValueChange={(value) =>
                  setValue(
                    "interaction_type",
                    value === "none" ? "" : value
                  )
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select interaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="like">Like</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="follow">Follow</SelectItem>
                  <SelectItem value="join">Join</SelectItem>
                  <SelectItem value="visit">Visit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.interaction_type && (
                <p className="text-sm text-destructive">
                  {errors.interaction_type.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quest_link">Quest Link (Optional)</Label>
            <Input
              id="quest_link"
              type="url"
              placeholder="https://example.com/quest-target"
              className="max-w-md"
              {...register("quest_link")}
            />
            {errors.quest_link && (
              <p className="text-sm text-destructive">
                {errors.quest_link.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Link to the content or page users need to interact with
            </p>
          </div>

          {/* Discord Channel ID field - only show when platform is discord and interaction is join */}
          {watch("platform_type") === "discord" && watch("interaction_type") === "join" && (
            <div className="space-y-2">
              <Label htmlFor="channel_id" className="flex items-center gap-1">
                Discord Channel ID 
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="channel_id"
                placeholder="e.g., 123456789012345678"
                className={`max-w-md ${!channelId.trim() ? 'border-red-300 focus:border-red-500' : ''}`}
                value={channelId}
                onChange={(e) => {
                  setChannelId(e.target.value);
                  setValue("channel_id", e.target.value);
                }}
                required
              />
              {errors.channel_id && (
                <p className="text-sm text-destructive">
                  {errors.channel_id.message}
                </p>
              )}
              {!channelId.trim() && (
                <p className="text-xs text-red-500 mt-1">
                  Channel ID is required for Discord join quests
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the Discord channel ID that users need to join. You can get this by right-clicking on the channel and selecting "Copy ID".
              </p>
            </div>
          )}
        </div>

        {/* Quest Instructions */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Quest Instructions</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Step-by-Step Instructions (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Add step-by-step instructions to help users complete this quest.
            </div>
            
            {steps.length > 0 && (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <Input
                      placeholder={`Step ${index + 1} instruction...`}
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {steps.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-muted-foreground">
                  No instructions added yet. Click "Add Step" to create step-by-step instructions.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Schedule</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Start Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>End Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Associated Badges */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Associated Badges
          </h3>

          {loadingBadges ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading badges...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedBadges.includes(Number(badge.id))
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleBadge(Number(badge.id))}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <h4 className="font-medium">{badge.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Quest
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
