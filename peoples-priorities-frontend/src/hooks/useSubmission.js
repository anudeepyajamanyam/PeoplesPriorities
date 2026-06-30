import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitText, submitVoice, submitPhoto } from '../api/axios';

/**
 * Hook to manage submission states and toast notifications.
 */
export function useSubmission() {
  const [submitting, setSubmitting] = useState(false);

  const handleTextSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const res = await submitText(payload);
      toast.success("Suggestion submitted successfully!");
      return res;
    } catch (e) {
      toast.error(e.response?.data?.error || "Submission failed. Try again.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await submitVoice(formData);
      toast.success("Voice note submitted!");
      return res;
    } catch (e) {
      toast.error(e.response?.data?.error || "Voice submission failed. Try again.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await submitPhoto(formData);
      toast.success("Photo report submitted!");
      return res;
    } catch (e) {
      toast.error(e.response?.data?.error || "Photo submission failed. Try again.");
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    handleTextSubmit,
    handleVoiceSubmit,
    handlePhotoSubmit
  };
}
