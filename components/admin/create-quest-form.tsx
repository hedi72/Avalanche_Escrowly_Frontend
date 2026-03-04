"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BasicInformationForm } from "./create-quest-components/basic-information-form";
import { QuestDetailsForm } from "./create-quest-components/quest-details-form";
import { RewardsForm } from "./create-quest-components/rewards-form";
import { SchedulingStatusForm } from "./create-quest-components/scheduling-status-form";
import { useCreateQuestForm } from "./create-quest-components/use-create-quest-form";

interface CreateQuestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateQuestForm({ onSuccess, onCancel }: CreateQuestFormProps) {
  const {
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
    platformInteractions,
    steps,
    setSteps,
    register,
    handleSubmit,
    onSubmit,
    setValue,
    watch,
    rewardTokenAddress,
    account,
    chainId,
    expectedChainId,
    isCoreWalletInstalled,
    isWalletConnected,
    connectWallet,
    ensureWalletNetwork,
  } = useCreateQuestForm(onSuccess);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* <div className="mb-6">
        <h2 className="text-2xl font-bold">Create New Quest</h2>
        <p className="text-muted-foreground">
          Fill in the details below to create a new quest
        </p>
      </div> */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Alert>
          <AlertDescription className="space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Core Wallet {isCoreWalletInstalled ? "installed" : "missing"}</Badge>
              <Badge variant="outline">{isWalletConnected ? "wallet connected" : "wallet not connected"}</Badge>
              <Badge variant="outline">reward token: {rewardTokenAddress || "missing"}</Badge>
              <Badge variant="outline">chain: {chainId ?? "not connected"} / expected {expectedChainId}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void connectWallet()}>
                Connect Core Wallet
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void ensureWalletNetwork()}>
                Switch To Fuji
              </Button>
            </div>
            <div className="break-all text-muted-foreground">
              Sponsor wallet: {account ?? "Not connected"}
            </div>
            <div className="text-muted-foreground">
              The MVP create flow will deploy the campaign on Avalanche, save the campaign mapping in the backend, fund escrow, and trigger activation directly when the quest is created as active. For immediate activation, use a start time that is now or in the past.
            </div>
          </AlertDescription>
        </Alert>
        <BasicInformationForm register={register} watch={watch} setValue={setValue} />
        <QuestDetailsForm
          register={register}
          platform={platform}
          setPlatform={setPlatform}
          interactionType={interactionType}
          setInteractionType={setInteractionType}
          channelId={channelId}
          setChannelId={setChannelId}
          platformInteractions={platformInteractions}
          events={events}
          loadingEvents={loadingEvents}
          setValue={setValue}
          steps={steps}
          setSteps={setSteps}
        />
        <RewardsForm
          register={register}
          selectedBadges={selectedBadges}
          setSelectedBadges={setSelectedBadges}
          badges={badges}
          loadingBadges={loadingBadges}
        />
        <SchedulingStatusForm
          register={register}
          status={status}
          setStatus={setStatus}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          setValue={setValue}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Quest"
            )}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
