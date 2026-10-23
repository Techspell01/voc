package com.techspell.voc.ime;

import android.app.Dialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.inputmethodservice.InputMethodService;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import com.techspell.voc.R;

import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The Voc keyboard. It is not a keyboard: a floating bar with one coral mic. Talk in
 * Malayalam, Hindi, Manglish or English and the English reply is written into whatever
 * text box is open, without leaving the app you are in.
 */
public class VocImeService extends InputMethodService {

    // 60 seconds of 16 kHz mono audio: well inside the 3 MB the backend accepts.
    private static final long MAX_BYTES = 16000L * 2L * 60L;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final VocRecorder recorder = new VocRecorder();

    private VocMicView orb;
    private VocWave wave;
    private ImageButton mic;
    private TextView status;
    private TextView hint;
    private volatile boolean busy;

    private final Runnable settleLater = this::settle;

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!recorder.isRecording()) return;
            float level = recorder.level();
            if (orb != null) orb.setLevel(level);
            if (wave != null) wave.setLevel(level);
            if (hint != null) hint.setText(clock(recorder.millis()));
            ui.postDelayed(this, 90);
        }
    };

    @Override
    public View onCreateInputView() {
        View view = getLayoutInflater().inflate(R.layout.voc_ime, null);
        orb = view.findViewById(R.id.orb);
        wave = view.findViewById(R.id.wave);
        mic = view.findViewById(R.id.mic);
        status = view.findViewById(R.id.status);
        hint = view.findViewById(R.id.hint);
        ImageButton switchKeyboard = view.findViewById(R.id.switch_kb);

        mic.setOnClickListener(v -> onMic());
        switchKeyboard.setOnClickListener(v -> {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) imm.showInputMethodPicker();
        });

        clearWindow();
        if (!busy && !recorder.isRecording()) settle();
        return view;
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        clearWindow();
        if (recorder.isRecording()) {
            if (orb != null) orb.setRecording(true);
            if (wave != null) wave.setActive(true);
            if (mic != null) mic.setContentDescription(getString(R.string.ime_stop));
            if (status != null) status.setText(R.string.ime_listening);
            ui.removeCallbacks(tick);
            ui.post(tick);
        } else if (!busy) settle();
    }

    @Override
    public void onFinishInputView(boolean finishingInput) {
        if (!recorder.isRecording()) ui.removeCallbacks(tick);
        super.onFinishInputView(finishingInput);
    }

    @Override
    public void onDestroy() {
        ui.removeCallbacks(tick);
        recorder.stop();
        io.shutdown();
        super.onDestroy();
    }

    /** No window colour, no dimming: the pill floats over the app behind it. */
    private void clearWindow() {
        setCandidatesViewShown(false);
        Dialog window = getWindow();
        if (window == null || window.getWindow() == null) return;
        window.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        window.getWindow().setDimAmount(0f);
    }

    private void onMic() {
        if (busy) return;
        if (recorder.isRecording()) {
            finishRecording();
            return;
        }
        VocPermissionActivity.ask(this, this::startRecording);
    }

    private void startRecording() {
        ui.removeCallbacks(tick);
        ui.removeCallbacks(settleLater);
        try {
            recorder.start(MAX_BYTES, () -> ui.post(this::finishRecording));
        } catch (Exception e) {
            say(R.string.ime_mic_denied);
            Toast.makeText(this, getString(R.string.ime_mic_denied), Toast.LENGTH_LONG).show();
            return;
        }
        if (orb != null) orb.setRecording(true);
        if (wave != null) { wave.setActive(true); wave.setLevel(0); }
        if (mic != null) mic.setContentDescription(getString(R.string.ime_stop));
        if (status != null) status.setText(R.string.ime_listening);
        if (hint != null) hint.setText(clock(0));
        ui.post(tick);
    }

    private void finishRecording() {
        if (!recorder.isRecording()) return;
        byte[] wav = recorder.stop();
        ui.removeCallbacks(tick);
        if (orb != null) orb.setRecording(false);
        if (wave != null) wave.setActive(false);
        if (mic != null) mic.setContentDescription(getString(R.string.ime_tap));
        if (wav == null) {
            settle();
            return;
        }
        busy = true;
        if (mic != null) mic.setEnabled(false);
        if (status != null) status.setText(R.string.ime_translating);
        if (hint != null) hint.setText(R.string.ime_hint);
        io.execute(() -> {
            try {
                String said = VocApi.transcribe(wav);
                String english = VocApi.translate(said);
                putInto(english);
            } catch (Exception e) {
                String message = e.getMessage() == null || e.getMessage().trim().isEmpty()
                        ? "Could not reach Voc." : e.getMessage().trim();
                ui.post(() -> {
                    Toast.makeText(VocImeService.this, message, Toast.LENGTH_LONG).show();
                    settle();
                });
            }
        });
    }

    /** Writes the English reply where the caret is, or copies it when nothing is focused. */
    private void putInto(String text) {
        ui.post(() -> {
            InputConnection input = getCurrentInputConnection();
            if (input != null) {
                input.commitText(text, 1);
            } else {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (clipboard != null) clipboard.setPrimaryClip(ClipData.newPlainText("Voc", text));
                Toast.makeText(this, getString(R.string.ime_copied), Toast.LENGTH_LONG).show();
            }
            busy = false;
            if (mic != null) mic.setEnabled(true);
            if (status != null) status.setText(R.string.ime_done);
            ui.removeCallbacks(settleLater);
            ui.postDelayed(settleLater, 1200);
        });
    }

    private void settle() {
        if (recorder.isRecording()) return;
        busy = false;
        if (mic != null) mic.setEnabled(true);
        if (status != null) status.setText(R.string.ime_tap);
        if (hint != null) hint.setText(R.string.ime_hint);
        if (mic != null) mic.setContentDescription(getString(R.string.ime_tap));
    }

    private static String clock(long ms) {
        long s = ms / 1000;
        return String.format(Locale.US, "%d:%02d", s / 60, s % 60);
    }

    private void say(int text) {
        ui.post(() -> {
            if (status != null) status.setText(text);
        });
    }
}
