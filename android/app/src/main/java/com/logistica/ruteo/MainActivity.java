package com.logistica.ruteo;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_CODE_LOCATION = 1001;

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
        boolean fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean foreground = ContextCompat.checkSelfPermission(this, Manifest.permission.FOREGROUND_SERVICE) == PackageManager.PERMISSION_GRANTED;

        boolean background = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            background = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }

        boolean notifications = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notifications = ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        return fine && coarse && foreground && background && notifications;
    }

    private void pedirPermisos() {
        List<String> permisos = new ArrayList<>();
        permisos.add(Manifest.permission.ACCESS_FINE_LOCATION);
        permisos.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        permisos.add(Manifest.permission.FOREGROUND_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            permisos.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION);
        }

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
            if (tienePermisos()) {
                iniciarServicio();
            }
        }
    }

    private void iniciarServicio() {
        Intent serviceIntent = new Intent(this, LocationService.class);
        ensureBatteryOptimizationsDisabled();
        ContextCompat.startForegroundService(this, serviceIntent);
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
