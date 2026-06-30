package com.peoplespriorities.service;

import com.peoplespriorities.model.Constituency;
import com.peoplespriorities.model.Submission;
import com.peoplespriorities.repository.ConstituencyRepository;
import com.peoplespriorities.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Automatically seeds 60 demo submissions for Bengaluru North (KA-01)
 * when running under the "dev" profile, then triggers the AI pipeline.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class SeedDataRunner implements ApplicationRunner {

    private final ConstituencyRepository constituencyRepository;
    private final SubmissionRepository submissionRepository;
    private final AIOrchestrationJob aiOrchestrationJob;

    private static final String CONSTITUENCY_ID = "KA-01";
    private final Random random = new Random();

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting development profile seed runner...");

        Constituency constituency = constituencyRepository.findById(CONSTITUENCY_ID).orElse(null);
        if (constituency == null) {
            log.warn("Bengaluru North (KA-01) constituency not found in database. Seeding aborted.");
            return;
        }

        long existingCount = submissionRepository.countByConstituencyId(CONSTITUENCY_ID);
        if (existingCount > 0) {
            log.info("Submissions database is already seeded (count={}). Skipping seeding.", existingCount);
            return;
        }

        log.info("Seeding 60 realistic citizen submissions for Bengaluru North (KA-01)...");
        List<Submission> submissions = new ArrayList<>();

        // 1. Road Repair (20 submissions)
        String[] roadIssues = {
                "The road near Vidyaranyapura market has deep potholes causing daily accidents for two-wheelers.",
                "Potholes on Hebbal flyover slip road make riding dangerous at night. Needs urgent re-tarring.",
                "Broken pavement and large craters near Thanisandra main road causing traffic logjams.",
                "Street asphalt has completely worn out near Yelahanka Sector 4 park, throwing up clouds of dust.",
                "Big pothole at the intersection of Vidyaranyapura 5th Main. Already caused three skidding accidents.",
                "The speed breakers on Yelahanka bypass are not marked, causing vehicles to bottom out and crash.",
                "Unfinished utility trenches left open near Hebbal police station, blocking half the lane.",
                "Water logging on Thanisandra road during rains completely hides huge craters. Very unsafe.",
                "Vidyaranyapura bus stand road is muddy and lacks any asphalt layer.",
                "Hebbal outer ring road junction has deep ruts from heavy trucks. Needs immediate resurfacing."
        };
        seedCategory(submissions, constituency, "Roads & transport", "text", roadIssues, 20);

        // 2. Water Supply (15 submissions)
        String[] waterIssues = {
                "No public water supply in Yelahanka Upanagara for the last 5 days. Tankers are charging double.",
                "The borewell pump near Thanisandra primary school is broken. Residents have no drinking water.",
                "Vidyaranyapura block 2 receives contaminated water with bad odor. Health hazard.",
                "Frequent leakage in the main supply pipeline near Hebbal flyover is wasting gallons of clean water.",
                "We only get Cauvery water once in 10 days in Thanisandra. Please improve distribution frequency.",
                "The public tap near Yelahanka market has been leaking for a month, creating a muddy swamp.",
                "Water pressure in Vidyaranyapura block 4 is extremely low, barely filling half a bucket.",
                "Thanisandra ward needs a new drinking water kiosk. The existing one is defunct."
        };
        seedCategory(submissions, constituency, "Water supply", "voice", waterIssues, 15);

        // 3. School Infrastructure (14 submissions)
        String[] schoolIssues = {
                "Vidyaranyapura government school building has leaky ceilings. Classrooms get flooded in monsoon.",
                "No functional toilets for girls in Hebbal govt high school. Many girls are skipping classes.",
                "The primary school in Thanisandra lacks basic student desks. Children sit on cold floors.",
                "Yelahanka government primary school needs compound wall repairs to keep stray animals out.",
                "No computer lab or working science equipment in Vidyaranyapura senior secondary block.",
                "The playground at Hebbal school is full of garbage and weeds. Unfit for children.",
                "No drinking water facility inside Thanisandra government primary school campus."
        };
        seedCategory(submissions, constituency, "Education", "photo", schoolIssues, 14);

        // 4. PHC Staffing (11 submissions)
        String[] phcIssues = {
                "The primary health center in Yelahanka is open but no doctor is present after 2 PM.",
                "No basic medicines like paracetamol or insulin available at Hebbal government clinic.",
                "The PHC building in Thanisandra lacks clean drinking water and functional patient toilets.",
                "Vidyaranyapura health center has only one nurse who is overloaded. Doctor visits only twice a week.",
                "The maternal ward in Yelahanka PHC lacks operational ECG machines and ventilators.",
                "PHC in Thanisandra needs permanent staff. Currently running on contractual helpers."
        };
        seedCategory(submissions, constituency, "Healthcare", "text", phcIssues, 11);

        submissionRepository.saveAll(submissions);
        log.info("Successfully saved 60 demo submissions.");

        // Trigger the pipeline
        try {
            aiOrchestrationJob.runPipelineForConstituency(CONSTITUENCY_ID);
        } catch (Exception e) {
            log.error("Failed to run initial AI pipeline on seeded data: {}", e.getMessage(), e);
        }
    }

    private void seedCategory(List<Submission> submissions, Constituency constituency, String category,
                             String defaultType, String[] templates, int count) {
        String[] wards = {"Vidyaranyapura", "Hebbal", "Yelahanka", "Yelahanka Upanagara", "Thanisandra"};
        
        // Bengaluru North bounding box coordinates
        double baseLat = 13.0400;
        double baseLng = 77.5800;

        for (int i = 0; i < count; i++) {
            String template = templates[i % templates.length];
            String ward = wards[i % wards.length];
            
            // Random offset within ~3km
            double latOffset = (random.nextDouble() - 0.5) * 0.04;
            double lngOffset = (random.nextDouble() - 0.5) * 0.04;

            // Vary type
            String type = defaultType;
            if (i % 3 == 0) type = "text";
            else if (i % 3 == 1) type = "voice";
            else type = "photo";

            String gcsUri = null;
            if ("voice".equals(type)) {
                gcsUri = "gs://peoples-priorities-audio/demo-audio-" + random.nextInt(1000) + ".wav";
            } else if ("photo".equals(type)) {
                gcsUri = "gs://peoples-priorities-photos/demo-photo-" + random.nextInt(1000) + ".jpg";
            }

            Submission sub = Submission.builder()
                    .citizenId("citizen-" + random.nextInt(10000))
                    .constituency(constituency)
                    .type(type)
                    .rawContent(template)
                    .translatedContent(template)
                    .languageDetected("en")
                    .category(category)
                    .lat(baseLat + latOffset)
                    .lng(baseLng + lngOffset)
                    .ward(ward)
                    .gcsUri(gcsUri)
                    .status("pending")
                    .createdAt(Instant.now().minus(random.nextInt(30), ChronoUnit.HOURS))
                    .build();

            submissions.add(sub);
        }
    }
}
