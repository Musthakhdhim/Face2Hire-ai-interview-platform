package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.OverallFeedbackDto;
import com.aiinterview.face2hire_backend.service.interview.PdfReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfReportServiceImpl implements PdfReportService {

    private final PDFont helvetica = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private final PDFont helveticaBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    @Override
    public byte[] generateFeedbackPdf(OverallFeedbackDto feedback, Long sessionId) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float margin = 50;
            float yStart = page.getMediaBox().getHeight() - margin;
            float yPosition = yStart;

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {

                // Title
                contentStream.beginText();
                contentStream.setFont(helveticaBold, 24);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Interview Feedback Report");
                contentStream.endText();
                yPosition -= 40;

                // Metadata
                contentStream.beginText();
                contentStream.setFont(helvetica, 10);
                contentStream.newLineAtOffset(margin, yPosition);
                String meta = String.format("Session ID: %d | Generated: %s",
                        sessionId,
                        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                contentStream.showText(meta);
                contentStream.endText();
                yPosition -= 30;

                // Overall Score
                contentStream.beginText();
                contentStream.setFont(helveticaBold, 36);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(formatScore(feedback.getOverallScore()) + "%");
                contentStream.endText();
                yPosition -= 50;

                // Sub-scores – FIXED: use %.0f for doubles and handle null
                contentStream.beginText();
                contentStream.setFont(helvetica, 12);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(String.format("Communication: %.0f%%",
                        safeDouble(feedback.getCommunicationScore())));
                contentStream.endText();
                yPosition -= 20;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(String.format("Technical Skills: %.0f%%",
                        safeDouble(feedback.getTechnicalScore())));
                contentStream.endText();
                yPosition -= 20;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(String.format("Confidence: %.0f%%",
                        safeDouble(feedback.getConfidenceScore())));
                contentStream.endText();
                yPosition -= 40;

                // Sections
                yPosition = addSection(contentStream, "Strengths", safeString(feedback.getStrengths()), margin, yPosition);
                yPosition = addSection(contentStream, "Areas for Improvement", safeString(feedback.getImprovements()), margin, yPosition);
                yPosition = addSection(contentStream, "Detailed Feedback", safeString(feedback.getDetailedFeedback()), margin, yPosition);

                String resources = feedback.getSuggestedResources() != null ?
                        String.join("\n", feedback.getSuggestedResources()) : "";
                addSection(contentStream, "Recommended Resources", resources, margin, yPosition);
            }

            document.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("PDF generation failed for session {}", sessionId, e);
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private float addSection(PDPageContentStream contentStream, String title, String content,
                             float margin, float yPosition) throws Exception {
        contentStream.beginText();
        contentStream.setFont(helveticaBold, 16);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(title);
        contentStream.endText();
        yPosition -= 25;

        contentStream.setFont(helvetica, 12);
        String[] lines = content.split("\n");
        for (String line : lines) {
            if (line.trim().isEmpty()) continue;
            contentStream.beginText();
            contentStream.newLineAtOffset(margin + 10, yPosition);
            contentStream.showText(line);
            contentStream.endText();
            yPosition -= 18;
        }
        yPosition -= 15;
        return yPosition;
    }

    private String formatScore(Double score) {
        return score != null ? String.format("%.0f", score) : "0";
    }

    private double safeDouble(Double value) {
        return value != null ? value : 0.0;
    }

    private String safeString(String str) {
        return str != null ? str : "";
    }
}