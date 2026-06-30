import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Mic, Camera, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import TextSubmitForm from '../components/TextSubmitForm';
import VoiceRecorder from '../components/VoiceRecorder';
import PhotoUpload from '../components/PhotoUpload';
import { useSubmission } from '../hooks/useSubmission';

export default function SubmitPage() {
  const [searchParams] = useSearchParams();
  const constituencyId = searchParams.get('constituencyId') || 'KA-01';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  
  const { submitting, handleTextSubmit, handleVoiceSubmit, handlePhotoSubmit } = useSubmission();

  const onSubmissionSuccess = (res) => {
    navigate('/submit/confirm', {
      state: {
        submissionId: res.id,
        type: res.type,
        themeLabel: res.themeLabel
      }
    });
  };

  const executeTextSubmit = (payload) => {
    handleTextSubmit(payload)
      .then(onSubmissionSuccess)
      .catch(() => {});
  };

  const executeVoiceSubmit = (formData) => {
    handleVoiceSubmit(formData)
      .then(onSubmissionSuccess)
      .catch(() => {});
  };

  const executePhotoSubmit = (formData) => {
    handlePhotoSubmit(formData)
      .then(onSubmissionSuccess)
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-3.5 px-6 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="bg-teal-50 text-primary border border-teal-100 text-xs font-bold px-3 py-1 rounded-full">
          Constituency ID: {constituencyId}
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-6">
        {/* Tab Controls */}
        <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Text Form
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'voice'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice Recorder
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'photo'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Camera className="w-4 h-4" /> Photo Upload
          </button>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'text' && (
          <TextSubmitForm
            constituencyId={constituencyId}
            onSubmit={executeTextSubmit}
            submitting={submitting}
          />
        )}
        {activeTab === 'voice' && (
          <VoiceRecorder
            constituencyId={constituencyId}
            onSubmit={executeVoiceSubmit}
            submitting={submitting}
          />
        )}
        {activeTab === 'photo' && (
          <PhotoUpload
            constituencyId={constituencyId}
            onSubmit={executePhotoSubmit}
            submitting={submitting}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-semibold">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}
