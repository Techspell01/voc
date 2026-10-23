package com.techspell.voc.ime;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.widget.Toast;

import com.techspell.voc.R;

/**
 * The microphone has to be allowed while the keyboard is on screen, and an InputMethodService
 * cannot ask for it itself, so a transparent activity pops up, asks, and hands the answer back.
 */
public class VocPermissionActivity extends Activity {

    private static final int REQUEST = 41;
    private static Runnable onGranted;

    public static void ask(Context context, Runnable then) {
        if (context.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            then.run();
            return;
        }
        onGranted = then;
        Intent intent = new Intent(context, VocPermissionActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (onGranted == null) { finish(); return; }
        if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            handBack();
            return;
        }
        requestPermissions(new String[] { android.Manifest.permission.RECORD_AUDIO }, REQUEST);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode != REQUEST) { finish(); return; }
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            handBack();
            return;
        }
        onGranted = null;
        Toast.makeText(this, getString(R.string.ime_mic_denied), Toast.LENGTH_LONG).show();
        finish();
    }

    private void handBack() {
        Runnable then = onGranted;
        onGranted = null;
        finish();
        if (then != null) then.run();
    }
}
