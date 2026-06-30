import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Mic, Camera, ArrowLeft } from 'lucide-react';
import TextSubmitForm from '../components/TextSubmitForm';
import VoiceRecorder from '../components/VoiceRecorder';
import PhotoUpload from '../components/PhotoUpload';
import { useSubmission } from '../hooks/useSubmission';
import Navbar from '../components/Navbar';

export default function SubmitPage() {
  const [searchParams] = useSearchParams();
  const constituencyId = searchParams.get('constituencyId') || 'KA-01';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [lang, setLang] = useState('en-IN');
  
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
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans">
      {/* Shared Navbar */}
      <Navbar lang={lang} setLang={setLang} showMpPortal={true} />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-6">
        
        {/* Back navigation and constituency badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#5F5E5A] hover:text-[#FF6B35] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
          <span className="bg-[#FFE8DC] text-[#B8431D] border border-[#ECE7DE] text-[11px] font-sans font-medium px-3 py-1 rounded-full uppercase tracking-wider">
            Constituency ID: {constituencyId}
          </span>
        </div>

        {/* Tab Controls - Pill-style tabs */}
        <div className="bg-white p-1.5 rounded-[12px] border border-[#ECE7DE] flex items-center justify-between gap-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-grow py-2.5 rounded-[10px] text-xs font-sans font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text'
                ? 'bg-[#FF6B35] text-white'
                : 'text-[#5F5E5A] hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Text form
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-grow py-2.5 rounded-[10px] text-xs font-sans font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'voice'
                ? 'bg-[#FF6B35] text-white'
                : 'text-[#5F5E5A] hover:bg-slate-50'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice recorder
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex-grow py-2.5 rounded-[10px] text-xs font-sans font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'photo'
                ? 'bg-[#FF6B35] text-white'
                : 'text-[#5F5E5A] hover:bg-slate-50'
            }`}
          >
            <Camera className="w-4 h-4" /> Photo upload
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

      <footer className="bg-white border-t border-[#ECE7DE] py-6 px-6 text-center text-xs text-[#888780] font-sans font-medium">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}
