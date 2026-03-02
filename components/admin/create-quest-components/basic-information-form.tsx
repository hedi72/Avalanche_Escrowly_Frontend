'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface BasicInformationFormProps {
  register: UseFormRegister<any>;
  watch?: UseFormWatch<any>;
  setValue?: UseFormSetValue<any>;
}

export function BasicInformationForm({ register, watch, setValue }: BasicInformationFormProps) {
  const manualSubmission = watch?.('manual_submission') || false;
  const withEvidence = watch?.('with_evidence') || false;
  const requiresAttachment = watch?.('requires_attachment') || false;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Quest Title *</Label>
          <Input
            id="title"
            placeholder="Enter quest title (max 100 characters)"
            className="max-w-md pr-8"
            {...register('title')}
            maxLength={100}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Required field</span>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Quest Description *</Label>
          <Textarea
            id="description"
            placeholder="Provide a detailed description of the quest (max 500 characters)"
            className="max-w-md"
            {...register('description')}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Required field</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Checkbox
            id="manual_submission"
            checked={manualSubmission}
            onCheckedChange={(checked) => {
              setValue?.('manual_submission', checked === true);
              // Reset both checkboxes when manual submission is unchecked
              if (!checked) {
                setValue?.('with_evidence', false);
                setValue?.('requires_attachment', false);
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
        {manualSubmission && (
          <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
            {/* URL Submission checkbox */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="with_evidence"
                  checked={withEvidence}
                  onCheckedChange={(checked) => {
                    setValue?.('with_evidence', checked === true);
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
                  checked={requiresAttachment}
                  onCheckedChange={(checked) => {
                    setValue?.('requires_attachment', checked === true);
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
            checked={watch?.('featured') || false}
            onCheckedChange={(checked) => {
              setValue?.('featured', checked === true);
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
  );
}