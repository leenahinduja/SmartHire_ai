package com.cs.SmartHireAi.utils;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.InputStream;

public class ResumeParser {

    public static String parsePDF(InputStream inputStream) throws Exception {
        PDDocument document = PDDocument.load(inputStream);
        String text = new PDFTextStripper().getText(document);
        document.close();
        return text;
    }

    public static String parseDOCX(InputStream inputStream) throws Exception {
        XWPFDocument doc = new XWPFDocument(inputStream);
        return doc.getParagraphs()
                .stream()
                .map(p -> p.getText())
                .reduce("", String::concat);
    }
}
