package com.techspell.voc.ime;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.SystemClock;
import android.util.AttributeSet;
import android.view.View;

/**
 * The coral mic disc. Idle it is a white mic on coral; while recording it breathes
 * with the voice (rings + a level halo) and shows a stop square.
 */
public class VocMicView extends View {

    private static final int CORAL = 0xFFF2705F;

    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);

    private boolean recording;
    private float level;
    private long since;

    public VocMicView(Context context, AttributeSet attrs) {
        super(context, attrs);
        line.setStyle(Paint.Style.STROKE);
        line.setStrokeCap(Paint.Cap.ROUND);
    }

    public void setRecording(boolean on) {
        recording = on;
        since = SystemClock.uptimeMillis();
        invalidate();
    }

    public void setLevel(float v) {
        level = Math.max(0f, Math.min(1f, v));
        if (recording) invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float w = getWidth();
        float h = getHeight();
        float cx = w / 2f;
        float cy = h / 2f;
        float edge = Math.min(w, h) / 2f - dp(1f);
        float disc = edge * 0.72f;
        long t = SystemClock.uptimeMillis() - since;

        if (recording) {
            for (int i = 0; i < 2; i++) {
                float phase = ((t / 1300f) + i * 0.5f) % 1f;
                line.setColor(CORAL);
                line.setAlpha((int) (80 * (1f - phase)));
                line.setStrokeWidth(dp(1.6f));
                canvas.drawCircle(cx, cy, disc + phase * (edge - disc), line);
            }
            line.setColor(CORAL);
            line.setAlpha(255);
            line.setStrokeWidth(dp(2.5f));
            canvas.drawCircle(cx, cy, disc + dp(2f) + level * dp(3.5f), line);
        }

        fill.setStyle(Paint.Style.FILL);
        fill.setColor(CORAL);
        canvas.drawCircle(cx, cy, disc, fill);

        fill.setColor(0xFFFFFFFF);
        if (recording) {
            float s = disc * 0.38f;
            canvas.drawRoundRect(new RectF(cx - s, cy - s, cx + s, cy + s), s * 0.28f, s * 0.28f, fill);
            postInvalidateOnAnimation();
        } else {
            mic(canvas, cx, cy, disc);
        }
    }

    private void mic(Canvas canvas, float cx, float cy, float disc) {
        float s = disc * 1.22f;                     // glyph height reference
        float half = s * 0.15f;                     // capsule half width
        float top = cy - s * 0.38f;
        float bottom = cy + s * 0.02f;

        fill.setStyle(Paint.Style.FILL);
        fill.setColor(0xFFFFFFFF);
        canvas.drawRoundRect(new RectF(cx - half, top, cx + half, bottom), half, half, fill);

        line.setColor(0xFFFFFFFF);
        line.setAlpha(255);
        line.setStrokeWidth(dp(1.7f));
        float r = s * 0.24f;
        RectF arc = new RectF(cx - r, bottom - r * 1.04f, cx + r, bottom + r * 0.96f);
        canvas.drawArc(arc, 0f, 180f, false, line);

        float foot = bottom + r * 0.96f;
        canvas.drawLine(cx, foot, cx, foot + s * 0.12f, line);
        canvas.drawLine(cx - s * 0.13f, foot + s * 0.12f, cx + s * 0.13f, foot + s * 0.12f, line);
    }

    private float dp(float v) {
        return v * getResources().getDisplayMetrics().density;
    }
}
