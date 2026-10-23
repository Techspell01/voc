package com.techspell.voc.ime;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.SystemClock;
import android.util.AttributeSet;
import android.view.View;

/** Five coral bars that move with the voice while recording, and rest faintly otherwise. */
public class VocWave extends View {

    private static final int BARS = 5;
    private static final int CORAL = 0xFFF2705F;

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private boolean active;
    private float level;

    public VocWave(Context context, AttributeSet attrs) {
        super(context, attrs);
        paint.setColor(CORAL);
    }

    public void setActive(boolean on) {
        active = on;
        invalidate();
    }

    public void setLevel(float v) {
        level = Math.max(0f, Math.min(1f, v));
        if (active) invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float w = getWidth();
        float h = getHeight();
        float slot = w / BARS;
        float bar = Math.max(dp(2.5f), slot * 0.5f);
        long t = SystemClock.uptimeMillis();

        paint.setAlpha(active ? 255 : 90);
        for (int i = 0; i < BARS; i++) {
            double phase = t / 260.0 + i * 0.9;
            float wobble = 0.5f + 0.5f * (float) Math.sin(phase);
            float amp = active
                    ? (0.2f + 0.8f * level) * (0.45f + 0.55f * wobble)
                    : 0.16f + 0.16f * wobble;
            float bh = Math.max(dp(3f), h * amp);
            float left = i * slot + (slot - bar) / 2f;
            float top = (h - bh) / 2f;
            canvas.drawRoundRect(new RectF(left, top, left + bar, top + bh), bar / 2f, bar / 2f, paint);
        }
        if (active) postInvalidateOnAnimation();
    }

    private float dp(float v) {
        return v * getResources().getDisplayMetrics().density;
    }
}
