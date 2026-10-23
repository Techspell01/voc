package com.techspell.voc.ime;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.inputmethodservice.InputMethodService;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.techspell.voc.R;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The Voc keyboard. Talk in Malayalam, Hindi, Manglish or English and it writes the English
 * reply straight into whatever text box is open, without leaving the app you are in.
 */
public class VocImeService extends InputMethodService {

    // 60 seconds of 16 kHz mono audio: well inside the 3 MB the backend accepts.
    private static final long MAX_BYTES = 16000L * 2L * 60L;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final VocRecorder recorder = new VocRecorder();

    private TextView status;
    private Button mic;
    private volatile boolean busy;

    @Override
    public View onCreateInputView() {
        View view = getLayoutInflater().inflate(R.layout.voc_ime, null);
        status = view.findViewById(R.id.status);
        mic = view.findViewById(R.id.mic);
        Button switchKeyboard = view.findViewById(R.id.switch_kb);

        mic.setOnClickListener(v -> onMic());
        switchKeyboard.setOnClickListener(v -> {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) imm.showInputMethodPicker();
        });

        if (!busy && !recorder.isRecording()) say(R.string.ime_tap);
        return view;
    }

    @Override
    public void onStartInputView(android.view.inputmethod.EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        if (!busy && !recorder.isRecording()) say(R.string.ime_tap);
    }

    @Override
    public void onDestroy() {
        recorder.stop();
        io.shutdown();
        super.onDestroy();
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
        try {
            recorder.start(MAX_BYTES, () -> ui.post(this::finishRecording));
        } catch (Exception e) {
            say(R.string.ime_mic_denied);
            Toast.makeText(this, getString(R.string.ime_mic_denied), Toast.LENGTH_LONG).show();
            return;
        }
        if (mic != null) { mic.setEnabled(true); mic.setText(R.string.ime_stop); }
        say(R.string.ime_listening);
    }

    private void finishRecording() {
        if (!recorder.isRecording()) return;
        byte[] wav = recorder.stop();
        if (mic != null) mic.setText(R.string.ime_tap);
        if (wav == null) {
            say(R.string.ime_tap);
            return;
        }
        busy = true;
        if (mic != null) mic.setEnabled(false);
        say(R.string.ime_translating);
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
            settle();
        });
    }

    private void settle() {
        busy = false;
        if (mic != null) mic.setEnabled(true);
        say(R.string.ime_tap);
    }

    private void say(int text) { say(getString(text)); }

    private void say(String text) {
        ui.post(() -> {
            if (status != null) status.setText(text);
        });
    }
}
