package com.techspell.voc.ime;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** The two calls the keyboard makes: speech to text, then the English reply. */
public final class VocApi {

    private static final String BASE = "https://usevoc.vercel.app";
    private static final int CONNECT_MS = 20000;
    private static final int READ_MS = 60000;

    private VocApi() { }

    /** Speech to text. lang=auto lets the service work out Malayalam, Hindi or English itself. */
    public static String transcribe(byte[] wav) throws Exception {
        JSONObject body = json(post("/api/transcribe?lang=auto", "audio/wav", wav));
        String text = body.optString("text", "").trim();
        if (text.isEmpty()) throw new Exception(plain(body, "Couldn't hear any words."));
        return text;
    }

    /** The English reply. Nothing from this is ever stored. */
    public static String translate(String said) throws Exception {
        JSONObject payload = new JSONObject();
        payload.put("kind", "translate");
        payload.put("text", said);
        byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
        JSONObject body = json(post("/api/compose", "application/json; charset=utf-8", bytes));
        JSONObject result = body.optJSONObject("result");
        if (result == null) throw new Exception(plain(body, "Couldn't translate that."));
        String text = result.optString("text", "").trim();
        if (text.isEmpty()) throw new Exception(plain(body, "Couldn't translate that."));
        return text;
    }

    private static String post(String path, String contentType, byte[] body) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(BASE + path).openConnection();
        try {
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(CONNECT_MS);
            conn.setReadTimeout(READ_MS);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", contentType);
            conn.setRequestProperty("Accept", "application/json");
            OutputStream out = conn.getOutputStream();
            out.write(body);
            out.close();
            int code = conn.getResponseCode();
            InputStream in = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
            String text = read(in);
            if (code >= 400) throw new Exception(message(text, code));
            return text;
        } finally {
            conn.disconnect();
        }
    }

    private static String read(InputStream in) throws Exception {
        if (in == null) return "";
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        byte[] chunk = new byte[4096];
        int n;
        while ((n = in.read(chunk)) > 0) bytes.write(chunk, 0, n);
        in.close();
        return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
    }

    private static JSONObject json(String body) throws Exception {
        try {
            return new JSONObject(body);
        } catch (Exception e) {
            throw new Exception("Voc sent back something unexpected. Try again.");
        }
    }

    /** Every failure from our own functions is a plain sentence in "message". */
    private static String plain(JSONObject body, String fallback) {
        String message = body.optString("message", "").trim();
        return message.isEmpty() ? fallback : message;
    }

    private static String message(String body, int code) {
        try {
            String text = new JSONObject(body).optString("message", "").trim();
            if (!text.isEmpty()) return text;
        } catch (Exception ignored) { }
        if (code == 413) return "That piece of audio is too long.";
        if (code == 429) return "Too many requests at once. Try again in a moment.";
        if (code >= 500) return "Voc's speech service is busy. Try again in a moment.";
        if (code >= 400) return "Voc could not use that. Try again.";
        return "Could not reach Voc.";
    }
}
