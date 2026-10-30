package com.safa.springbootapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Controller
public class JourneyController {
    private static final Set<String> ACADEMIC_QUERY_STOP_WORDS = Set.of(
        "about", "and", "did", "for", "his", "how", "the", "what", "when", "where", "which",
        "who", "with", "take", "course", "courses"
    );
    private static final java.util.regex.Pattern COMPLETE_ACADEMIC_LIST_PATTERN =
        java.util.regex.Pattern.compile(
            "(?is).*(?:\\b(?:all|every|each|complete|full|entire)\\b.*\\b(?:semester|courses?|records?|results?|transcript|grades?)\\b"
                + "|\\b(?:list|show|give|provide)\\b.*\\b(?:semester|courses?|records?|results?|transcript|grades?)\\b"
                + "|\\b(?:what|which)\\b.*\\b(?:courses?|records?|results?|grades?)\\b"
                + "|\\b(?:what|which)\\b.*\\b(?:study|studied|subjects?)\\b"
                + "|\\bhow\\s+many\\b.*\\b(?:semesters?|courses?|credits?)\\b"
                + "|\\b(?:total|overall)\\b.*\\b(?:credits?|courses?|semesters?)\\b).*");

    public record University(String name, String degree, String period, String logo, String introduction) {}
    public record Highlight(String label, String value, String note) {}
    public record Course(String code, String name, int credits, String gradePoint, String grade) {}
    public record SemesterProject(String name, String description, String subject, String image, String detailUrl) {}
    public record Memory(String image, String alt, String caption) {}
    public record Semester(int number, String term, String status, String gpa, int completedCredits,
                           List<Course> courses, String learning,
                           List<SemesterProject> projects, List<Memory> memories,
                           List<String> achievements, String reflection) {
        public boolean hasContent() {
            return !courses.isEmpty() || !learning.isBlank() || !projects.isEmpty() || !memories.isEmpty()
                || !achievements.isEmpty() || !reflection.isBlank();
        }
    }
    public record AcademicYear(int number, String label, String focus, List<Semester> semesters) {}
    public record PreviousEducation(String institution, String qualification, String period,
                                    String result, String logo) {}
    public record AcademicJourney(University university, List<Highlight> highlights,
                                  List<AcademicYear> years, List<PreviousEducation> beforeUniversity) {}
    private record SemesterMatch(Semester semester, int yearNumber, int score) {}

    private static final AcademicJourney ACADEMIC_JOURNEY = loadAcademicJourney();

    private static AcademicJourney loadAcademicJourney() {
        try (InputStream input = JourneyController.class.getResourceAsStream("/content/academic-journey.json")) {
            if (input == null) throw new IllegalStateException("Missing academic journey content");
            return new ObjectMapper().readValue(input, AcademicJourney.class);
        } catch (Exception error) {
            throw new IllegalStateException("Cannot load structured academic journey content", error);
        }
    }

    static String academicKnowledge(String query) {
        StringBuilder knowledge = new StringBuilder("Verified academic overview from the public Academic Journey:\n")
            .append("University: ").append(ACADEMIC_JOURNEY.university().name())
            .append("; Program: ").append(ACADEMIC_JOURNEY.university().degree()).append(".\n");
        ACADEMIC_JOURNEY.highlights().forEach(highlight ->
            knowledge.append(highlight.label()).append(": ").append(highlight.value()).append(".\n"));
        ACADEMIC_JOURNEY.beforeUniversity().forEach(education ->
            knowledge.append(education.qualification()).append(": ").append(education.institution())
                .append(", ").append(education.period()).append("; ").append(education.result()).append(".\n"));

        String normalized = query.toLowerCase(Locale.ROOT);
        boolean semesterQuestion = normalized.matches(
            "(?s).*\\b(?:semester|courses?|credits?|grades?|term|spring|summer|fall|cse\\d{3}|study|studied|subjects?)\\b.*");
        if (!semesterQuestion) return knowledge.toString().trim();

        Set<String> seasonTerms = Set.of("spring", "summer", "fall");
        Set<String> requestedSeasons = seasonTerms.stream()
            .filter(season -> normalized.matches("(?s).*\\b" + season + "\\b.*"))
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
        java.util.regex.Matcher requestedYear = java.util.regex.Pattern.compile("\\b(20\\d{2})\\b")
            .matcher(normalized);
        String requestedYearValue = requestedYear.find() ? requestedYear.group(1) : "";
        Set<String> terms = java.util.Arrays.stream(normalized
                .replaceAll("[^\\p{L}\\p{N}+#./-]+", " ").trim().split("\\s+"))
            .map(term -> term.replaceAll("^[./-]+|[./-]+$", ""))
            .filter(term -> term.length() >= 3 && !ACADEMIC_QUERY_STOP_WORDS.contains(term))
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
        java.util.regex.Matcher requestedSemester = java.util.regex.Pattern
            .compile("\\bsemester\\s+(\\d{1,2})\\b").matcher(normalized);
        String semesterNumber = requestedSemester.find()
            ? Integer.toString(Integer.parseInt(requestedSemester.group(1))) : "";
        java.util.regex.Matcher requestedAcademicYear = java.util.regex.Pattern
            .compile("\\byear\\s+(\\d)\\b").matcher(normalized);
        String academicYearNumber = requestedAcademicYear.find() ? requestedAcademicYear.group(1) : "";
        boolean allSemesters = COMPLETE_ACADEMIC_LIST_PATTERN.matcher(normalized).matches();
        boolean hasSpecificSemester = !semesterNumber.isEmpty() || !requestedSeasons.isEmpty()
            || !requestedYearValue.isEmpty() || !academicYearNumber.isEmpty()
            || terms.stream().anyMatch(term -> term.matches("cse\\d{3}"));
        List<SemesterMatch> allMatches = ACADEMIC_JOURNEY.years().stream()
            .flatMap(academicYear -> academicYear.semesters().stream()
                .map(semester -> new SemesterMatch(semester, academicYear.number(), scoreSemester(semester, terms,
                    semesterNumber))))
            .filter(match -> requestedSeasons.isEmpty()
                || requestedSeasons.stream().anyMatch(season ->
                    match.semester().term().toLowerCase(Locale.ROOT).startsWith(season)))
            .filter(match -> requestedYearValue.isEmpty()
                || match.semester().term().contains(requestedYearValue))
            .filter(match -> academicYearNumber.isEmpty()
                || Integer.toString(match.yearNumber()).equals(academicYearNumber))
            .filter(match -> semesterNumber.isEmpty()
                || Integer.toString(match.semester().number()).equals(semesterNumber))
            .filter(match -> terms.stream().filter(term -> term.matches("cse\\d{3}"))
                .allMatch(code -> match.semester().courses().stream()
                    .anyMatch(course -> course.code().equalsIgnoreCase(code))))
            .toList();
        List<SemesterMatch> matches;
        if (allSemesters || hasSpecificSemester) {
            matches = allMatches;
        } else {
            matches = allMatches.stream()
                .filter(match -> match.score() > 0)
                .sorted(java.util.Comparator.comparingInt(SemesterMatch::score).reversed())
                .limit(3)
                .toList();
        }

        for (SemesterMatch match : matches) {
            Semester semester = match.semester();
            knowledge.append("\n").append(ACADEMIC_JOURNEY.years().get(match.yearNumber() - 1).label())
                .append(" — ").append(semester.term()).append(" — Semester ")
                .append(semester.number()).append("; GPA ").append(semester.gpa())
                .append("; completed credits ").append(semester.completedCredits()).append(". ")
                .append(semester.learning()).append("\nCourse results: ");
            knowledge.append(semester.courses().stream()
                .map(course -> course.code() + " — " + course.name() + " (" + course.credits()
                    + (course.credits() == 1 ? " credit, " : " credits, ") + course.gradePoint()
                    + ", " + course.grade() + ")")
                .collect(java.util.stream.Collectors.joining("; ")));
            knowledge.append(".\n");
        }
        return knowledge.toString().trim();
    }

    private static int scoreSemester(Semester semester, Set<String> terms, String semesterNumber) {
        String record = semester.term() + " Semester " + semester.number() + " "
            + semester.gpa() + " " + semester.completedCredits() + " credits "
            + semester.learning() + " " + semester.courses().stream()
                .map(course -> course.code() + " " + course.name()).collect(java.util.stream.Collectors.joining(" "));
        String searchable = " " + record.toLowerCase(Locale.ROOT)
            .replaceAll("[^\\p{L}\\p{N}+#./-]+", " ") + " ";
        return (semesterNumber.equals(Integer.toString(semester.number())) ? 100 : 0)
            + (int) terms.stream().filter(term -> searchable.contains(" " + term + " ")).count();
    }

    @GetMapping({"/journey", "/academic-journey"})
    public String journey(Model model) {
        model.addAttribute("activePage", "journey");
        model.addAttribute("journey", ACADEMIC_JOURNEY);
        return "journey";
    }

    @GetMapping("/training-certifications")
    public String training(Model model) {
        model.addAttribute("activePage", "training");
        return "certifications";
    }
}
