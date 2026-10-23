package com.techspell.voc.ime;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;

import java.io.ByteArrayOutputStream;

/** Listens at 16 kHz mono and hands back a WAV file, the same shape the website sends. */
public class VocRecorder {

    public interface OnLimit { void reached(); }

    private static final int RATE = 16000;
    private static final int CHANNEL = AudioFormat.CHANNEL_IN_MONO;
    private static final int ENCODING = AudioFormat.ENCODING_PCM_16BIT;

    private AudioRecord record;
    private Thread thread;
    private ByteArrayOutputStream pcm;
    private volatile boolean running;
    private volatile long bytes;
    private long limitBytes;
    private OnLimit onLimit;

    public synchronized boolean isRecording() { return record != null; }

    /** Starts listening. Throws SecurityException when the microphone is not allowed yet. */
    public synchronized void start(long maxBytes, OnLimit reached) throws IllegalStateException {
        if (record != null) return;
        int min = AudioRecord.getMinBufferSize(RATE, CHANNEL, ENCODING);
        if (min <= 0) throw new IllegalStateException("No microphone available.");
        int buffer = Math.max(min * 2, 8192);
        AudioRecord r = new AudioRecord(MediaRecorder.AudioSource.MIC, RATE, CHANNEL, ENCODING, buffer);
        if (r.getState() != AudioRecord.STATE_INITIALIZED) {
            r.release();
            throw new IllegalStateException("No microphone available.");
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        limitBytes = maxBytes;
        onLimit = reached;
        bytes = 0;
        record = r;
        pcm = out;
        running = true;
        r.startRecording();
        thread = new Thread(() -> {
            byte[] chunk = new byte[buffer];
            while (running) {
                int n = r.read(chunk, 0, chunk.length);
                if (n <= 0) break;
                synchronized (out) { out.write(chunk, 0, n); }
                bytes += n;
                if (limitBytes > 0 && bytes >= limitBytes && running) {
                    running = false;
                    if (onLimit != null) onLimit.reached();
                }
            }
        }, "voc-rec");
        thread.start();
    }

    /** Stops and returns the recording as a WAV file, or null when there is nothing to send. */
    public synchronized byte[] stop() {
        if (record == null) return null;
        running = false;
        try { record.stop(); } catch (IllegalStateException ignored) { }
        if (thread != null) {
            try { thread.join(1500); } catch (InterruptedException ignored) { }
        }
        ByteArrayOutputStream out = pcm;
        byte[] data;
        if (out != null) synchronized (out) { data = out.toByteArray(); } else data = new byte[0];
        try { record.release(); } catch (Exception ignored) { }
        record = null;
        thread = null;
        pcm = null;
        onLimit = null;
        limitBytes = 0;
        bytes = 0;
        return data.length > 64 ? wav(data) : null;
    }

    private static byte[] wav(byte[] pcm) {
        int len = pcm.length;
        byte[] w = new byte[44 + len];
        intToLE(w, 0, 0x46464952);              // RIFF
        intToLE(w, 4, 36 + len);
        intToLE(w, 8, 0x45564157);              // WAVE
        intToLE(w, 12, 0x20746d66);             // fmt
        intToLE(w, 16, 16);
        w[20] = 1;                              // PCM
        w[21] = 0;
        w[22] = 1;                              // mono
        w[23] = 0;
        intToLE(w, 24, RATE);
        intToLE(w, 28, RATE * 2);               // bytes per second
        w[32] = 2;                              // block align
        w[33] = 0;
        w[34] = 16;                             // bits per sample
        w[35] = 0;
        intToLE(w, 36, 0x61746164);             // data
        intToLE(w, 40, len);
        System.arraycopy(pcm, 0, w, 44, len);
        return w;
    }

    private static void intToLE(byte[] at, int i, int v) {
        at[i] = (byte) v;
        at[i + 1] = (byte) (v >> 8);
        at[i + 2] = (byte) (v >> 16);
        at[i + 3] = (byte) (v >> 24);
    }
}
