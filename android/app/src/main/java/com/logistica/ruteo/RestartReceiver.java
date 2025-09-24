package com.logistica.ruteo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

/**
 * Se asegura de volver a iniciar el servicio de ubicación cuando el sistema reinicia el dispositivo
 * o cuando el usuario cierra la app desde la vista de recientes.
 */
public class RestartReceiver extends BroadcastReceiver {

    private static final String TAG = "RestartReceiver";
    private static final String ACTION_QUICKBOOT_POWERON = "android.intent.action.QUICKBOOT_POWERON";
    public static final String ACTION_RESTART_LOCATION_SERVICE = "com.logistica.ruteo.RESTART_LOCATION_SERVICE";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        String action = intent.getAction();
        Log.d(TAG, "🔄 onReceive action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || ACTION_QUICKBOOT_POWERON.equals(action)
                || ACTION_RESTART_LOCATION_SERVICE.equals(action)) {
            Intent serviceIntent = new Intent(context, LocationService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
