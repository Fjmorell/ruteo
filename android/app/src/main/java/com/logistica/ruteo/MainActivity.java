package com.logistica.ruteo;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_CODE_LOCATION = 1001;
    private static final int REQUEST_CODE_BACKGROUND_LOCATION = 1002;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🚦 Chequear permisos antes de iniciar el servicio
        if (tienePermisos()) {
            iniciarServicio();
        } else {
            pedirPermisos();
        }
    }

    private boolean tienePermisos() {
        return tienePermisosForeground() && tienePermisoNotificaciones() && tienePermisoBackground();
    }

    private boolean tienePermisosForeground() {
        boolean fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean foreground = ContextCompat.checkSelfPermission(this, Manifest.permission.FOREGROUND_SERVICE) == PackageManager.PERMISSION_GRANTED;
        return fine && coarse && foreground;
    }

    private boolean tienePermisoBackground() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return true;
        }
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean tienePermisoNotificaciones() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }
        return ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private void pedirPermisos() {
        List<String> permisos = new ArrayList<>();
        permisos.add(Manifest.permission.ACCESS_FINE_LOCATION);
        permisos.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        permisos.add(Manifest.permission.FOREGROUND_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permisos.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        ActivityCompat.requestPermissions(this,
                permisos.toArray(new String[0]),
                REQUEST_CODE_LOCATION);
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_CODE_LOCATION) {
            if (tienePermisosForeground() && tienePermisoNotificaciones()) {
                if (tienePermisoBackground()) {
                    iniciarServicio();
                } else {
                    solicitarPermisoBackground();
                }
            } else {
                Toast.makeText(this, "La app necesita permisos de ubicación y notificaciones", Toast.LENGTH_LONG).show();
            }
        } else if (requestCode == REQUEST_CODE_BACKGROUND_LOCATION) {
            if (tienePermisoBackground()) {
                iniciarServicio();
            } else {
                mostrarInstruccionesBackground();
            }
        }
    }

    private void iniciarServicio() {
        Intent serviceIntent = new Intent(this, LocationService.class);
        ensureBatteryOptimizationsDisabled();
        ContextCompat.startForegroundService(this, serviceIntent);
    }

    private void solicitarPermisoBackground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION},
                    REQUEST_CODE_BACKGROUND_LOCATION);
        }
    }

    private void mostrarInstruccionesBackground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Toast.makeText(this,
                    "Activa 'Permitir siempre' para la ubicación desde Ajustes > Aplicaciones > Ruteo",
                    Toast.LENGTH_LONG).show();

            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        }
    }

    private void ensureBatteryOptimizationsDisabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(getPackageName())) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            }
        }
    }
}
