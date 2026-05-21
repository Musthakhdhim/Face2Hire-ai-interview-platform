package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.service.TextExtractionService;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

@Service
public class TextExtractionServiceImpl implements TextExtractionService {

    @Override
    public String extractText(byte[] fileData, String fileName) throws IOException {
        try (InputStream stream = new ByteArrayInputStream(fileData)) {
            BodyContentHandler handler = new BodyContentHandler(-1);
            Metadata metadata = new Metadata();
            metadata.set("resourceName", fileName);
            ParseContext context = new ParseContext();
            AutoDetectParser parser = new AutoDetectParser();
            parser.parse(stream, handler, metadata, context);
            System.out.println(handler.toString());
            return handler.toString();
        } catch (SAXException | TikaException e) {
            throw new IOException("Failed to extract text from file", e);
        }
    }
}