package com.peoplespriorities.service;

import com.google.cloud.speech.v1.RecognitionAudio;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.RecognizeResponse;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechRecognitionResult;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.Translation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

/**
 * Handles speech-to-text transcription using Cloud Speech-to-Text v1,
 * and translation to English using Cloud Translation API v2.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SpeechIngestionService {

    private final Translate translate;

    /**
     * Transcribes an audio file stored in Google Cloud Storage.
     *
     * @param gcsUri       Uri of the audio file in the format gs://bucket/name.wav
     * @param languageCode BCP-47 language tag (e.g. "hi-IN", "kn-IN", "ta-IN", "en-IN")
     * @return Transcript text, or fallback mock if Cloud SDK is not configured
     */
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "gcp-cb", fallbackMethod = "fallbackTranscribe")
    public String transcribe(String gcsUri, String languageCode) throws Exception {
        log.info("Starting transcription of {} with language code {}", gcsUri, languageCode);
        try (SpeechClient speechClient = SpeechClient.create()) {
            RecognitionConfig config = RecognitionConfig.newBuilder()
                    .setEncoding(RecognitionConfig.AudioEncoding.LINEAR16)
                    .setSampleRateHertz(16000)
                    .setLanguageCode(languageCode)
                    .build();
            RecognitionAudio audio = RecognitionAudio.newBuilder()
                    .setUri(gcsUri)
                    .build();

            RecognizeResponse response = speechClient.recognize(config, audio);
            String transcript = response.getResultsList().stream()
                    .map(result -> result.getAlternatives(0).getTranscript())
                    .collect(Collectors.joining(" "));

            if (transcript.isBlank()) {
                throw new RuntimeException("STT returned empty transcript");
            }

            return transcript;
        }
    }

    public String fallbackTranscribe(String gcsUri, String languageCode, Throwable t) {
        log.warn("Speech transcription failed or circuit breaker open: {}. Using fallback mock.", t.getMessage());
        return getFallbackMockTranscript(languageCode);
    }

    /**
     * Translates a text string from the source language to English.
     */
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "gcp-cb", fallbackMethod = "fallbackTranslateToEnglish")
    public String translateToEnglish(String text, String sourceLang) throws Exception {
        if (text == null || text.isBlank()) {
            return text;
        }
        if ("en".equalsIgnoreCase(sourceLang) || sourceLang.startsWith("en")) {
            return text;
        }
        log.info("Translating text from {} to en", sourceLang);
        Translation translation = translate.translate(
                text,
                Translate.TranslateOption.sourceLanguage(sourceLang),
                Translate.TranslateOption.targetLanguage("en")
        );
        return translation.getTranslatedText();
    }

    public String fallbackTranslateToEnglish(String text, String sourceLang, Throwable t) {
        log.warn("Translation failed or circuit breaker open: {}. Returning original text.", t.getMessage());
        return text;
    }

    private String getFallbackMockTranscript(String languageCode) {
        if (languageCode.startsWith("hi")) {
            return "सड़क पर गड्ढे बहुत हैं और बारिश में जलभराव हो जाता है जिससे दुर्घटनाएं होती हैं।";
        } else if (languageCode.startsWith("kn")) {
            return "ರಸ್ತೆಗಳು ಸರಿಯಿಲ್ಲ ಮತ್ತು ಕುಡಿಯುವ ನೀರಿನ ಸಮಸ್ಯೆ ತುಂಬಾ ಹೆಚ್ಚಾಗಿದೆ.";
        } else if (languageCode.startsWith("ta")) {
            return "சாலையில் தண்ணீர் தேங்கி நிற்பதால் போக்குவரத்து நெரிசல் மற்றும் விபத்துக்கள் ஏற்படுகின்றன.";
        }
        return "The local public health center lacks staff and basic medicines. We need immediate support.";
    }
}
