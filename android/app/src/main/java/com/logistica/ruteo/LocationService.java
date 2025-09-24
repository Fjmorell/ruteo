package com.logistica.ruteo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class LocationService extends Service {

    private static final String TAG = "LocationService";
    private static final String CHANNEL_ID = "location_channel";
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private boolean shouldRestart = true;

    // 🔑 Supabase REST endpoint
    private static final String SUPABASE_URL = "https://ijptwyglnrpizhrwfgnq.supabase.co/rest/v1/ubicaciones_actuales";
    private static final String SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHR3eWdsbnJwaXpocndmZ25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTcxOTEsImV4cCI6MjA3MzczMzE5MX0.QVbTNdcByXfrj7eB7-pKXW74ZiHtOct8VTMAuBhXsSU";

    private String choferId = "DESCONOCIDO";

    @Override
    public void onCreate() {
        super.onCreate();

        // 🔹 Leer choferId desde las preferencias de Capacitor
        SharedPreferences capacitorPrefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        choferId = capacitorPrefs.getString("choferId", null);

        if (choferId == null) {
            // Compatibilidad con posibles guardados anteriores en preferencias por defecto
            SharedPreferences legacyPrefs = PreferenceManager.getDefaultSharedPreferences(this);
            choferId = legacyPrefs.getString("choferId", "DESCONOCIDO");
        }

        Log.d(TAG, "🆔 Chofer ID cargado: " + choferId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            boolean tieneBackground = ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
            if (!tieneBackground) {
                Log.w(TAG, "⚠️ Permiso ACCESS_BACKGROUND_LOCATION no concedido; el servicio podría detenerse en segundo plano.");
            }
        }

        if (choferId == null || "DESCONOCIDO".equals(choferId) || choferId.isEmpty()) {
            Log.w(TAG, "⚠️ Sin choferId válido, deteniendo servicio de ubicación");
            shouldRestart = false;
            stopSelf();
            return;
        }

        createNotificationChannel();
        startForeground(1, getNotification());

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(10000); // cada 10 segundos
        locationRequest.setFastestInterval(5000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) return;

                for (Location location : locationResult.getLocations()) {
                    double lat = location.getLatitude();
                    double lng = location.getLongitude();
                    Log.d(TAG, "📍 Nueva ubicación: " + lat + ", " + lng);

                    enviarUbicacionASupabase(lat, lng);
                }
            }
        };

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "▶️ LocationService iniciado en primer plano");
        return START_STICKY;
    }

    private void enviarUbicacionASupabase(double lat, double lng) {
        new Thread(() -> {
            try {
                URL url = new URL(SUPABASE_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("apikey", SUPABASE_API_KEY);
                conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_API_KEY);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                JSONObject json = new JSONObject();
                json.put("chofer_id", choferId);
                json.put("lat", lat);
                json.put("lng", lng);
                json.put("updated_at", System.currentTimeMillis());

                OutputStream os = conn.getOutputStream();
                os.write(json.toString().getBytes());
                os.flush();
                os.close();

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "✅ Supabase response: " + responseCode);

                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "❌ Error enviando ubicación: " + e.getMessage(), e);
            }
        }).start();
    }

    private void requestRestart() {
        if (!shouldRestart) {
            Log.d(TAG, "ℹ️ Reinicio no requerido porque shouldRestart=false");
            return;
        }
        Intent restartIntent = new Intent(this, RestartReceiver.class);
        restartIntent.setAction(RestartReceiver.ACTION_RESTART_LOCATION_SERVICE);
        sendBroadcast(restartIntent);
    }

    private Notification getNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Ruteo Choferes")
                .setContentText("📡 Compartiendo ubicación en segundo plano...")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
            );

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
        Log.d(TAG, "🛑 Servicio destruido, solicitando reinicio");
        requestRestart();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "🧹 Task removida, solicitando reinicio");
        requestRestart();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
