package com.example.managementdriver.ui.route;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.example.managementdriver.R;
import com.example.managementdriver.ui.login.LoginActivity;
import com.example.managementdriver.utils.NetworkUtils;
import com.example.managementdriver.utils.PrefsManager;
import com.example.managementdriver.network.ApiClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import com.google.android.material.switchmaterial.SwitchMaterial;

public class StatusActivity extends AppCompatActivity {

    private PrefsManager prefsManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_status);

        prefsManager = new PrefsManager(this);

        // Load Avatar
        ImageView ivAvatar = findViewById(R.id.ivStatusAvatar);
        Glide.with(this)
                .load("https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80")
                .placeholder(R.drawable.ic_driver_avatar)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .into(ivAvatar);
        
        ivAvatar.setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));

        // Sync Toggles with Preferences
        setupToggles();

        // Sync Driver ID in footer
        TextView tvFooterId = findViewById(R.id.tvFooterDriverId);
        if (tvFooterId != null) {
            tvFooterId.setText("Terminal ID: " + prefsManager.getDriverId());
        }

        // Bind Route ID to header
        TextView tvRoute = findViewById(R.id.tvRouteId);
        if (tvRoute != null) {
            tvRoute.setText(prefsManager.getRouteId());
        }

        // Sign Out Listener
        findViewById(R.id.btnSignOut).setOnClickListener(v -> handleLogout());

        // Setup Bottom Navigation
        setupNavigation();

        // Diagnostics Mock Click
        ((View) findViewById(R.id.ivHistoryIcon).getParent()).setOnClickListener(v -> {
            startActivity(new Intent(this, LogsActivity.class));
        });

        // Typewriter Diagnostics Console Simulation
        TextView tvConsole = findViewById(R.id.tvDiagnosticLogs);
        android.widget.ScrollView svConsole = findViewById(R.id.svDiagnosticConsole);
        if (tvConsole != null) {
            final String[] logs = new String[]{
                "[0.0s] Booting OBD-II secure diagnostics core... OK\n",
                "[0.4s] Initializing localized Room schema v2... Found\n",
                "[0.8s] Checking local network sockets... Active\n",
                "[1.2s] Connecting to fleet telemetry gateway... Connected\n",
                "[1.6s] Reconciling Room DB collections state... 100% Synced\n",
                "[2.0s] Verifying OBD-II OBD-WM-402 sensors... OK\n",
                "[2.4s] Fuel sensor online: 84% Capacity... OK\n",
                "[2.8s] GPS accuracy rating: 0.8 meters... Stable\n",
                "[3.2s] Diagnostics complete. All systems NOMINAL.\n"
            };

            android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
            tvConsole.setText(""); // clear placeholder

            for (int i = 0; i < logs.length; i++) {
                final String logLine = logs[i];
                final int delay = i * 500;
                handler.postDelayed(() -> {
                    tvConsole.append(logLine);
                    if (svConsole != null) {
                        svConsole.post(() -> svConsole.fullScroll(View.FOCUS_DOWN));
                    }
                }, delay);
            }
        }

        observeNetwork();
    }

    private void setupToggles() {
        SwitchMaterial swGps = findViewById(R.id.swGpsPrecision);
        SwitchMaterial swOffline = findViewById(R.id.swOfflineMap);

        if (swGps != null) {
            swGps.setChecked(prefsManager.isGpsPrecisionEnabled());
            swGps.setOnCheckedChangeListener((btn, isChecked) -> prefsManager.setGpsPrecisionEnabled(isChecked));
        }

        if (swOffline != null) {
            swOffline.setChecked(prefsManager.isOfflineMapEnabled());
            swOffline.setOnCheckedChangeListener((btn, isChecked) -> prefsManager.setOfflineMapEnabled(isChecked));
        }
    }

    private void setupNavigation() {
        findViewById(R.id.navRoute).setOnClickListener(v -> {
            Intent intent = new Intent(this, DashboardActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.navActivity).setOnClickListener(v -> {
            startActivity(new Intent(this, LogsActivity.class));
            finish();
        });

        findViewById(R.id.navProfile).setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileActivity.class));
            finish();
        });

        // Current page - do nothing or scroll to top
        findViewById(R.id.navStatus).setOnClickListener(v -> {});
    }

    private void observeNetwork() {
        TextView tvOnline = findViewById(R.id.tvOnlineStatus);
        View vOnlineDot = findViewById(R.id.vOnlineDot);

        // Start pulse animation
        if (vOnlineDot != null) {
            android.view.animation.Animation pulse = new android.view.animation.AlphaAnimation(0.3f, 1.0f);
            pulse.setDuration(1000);
            pulse.setRepeatMode(android.view.animation.Animation.REVERSE);
            pulse.setRepeatCount(android.view.animation.Animation.INFINITE);
            vOnlineDot.startAnimation(pulse);
        }

        NetworkUtils.observeNetworkStatus(this, new NetworkUtils.NetworkStatusListener() {
            @Override
            public void onNetworkAvailable() {
                runOnUiThread(() -> {
                    if (tvOnline != null) {
                        tvOnline.setText("ONLINE");
                        tvOnline.setTextColor(ContextCompat.getColor(StatusActivity.this, R.color.color_primary_green));
                    }
                    if (vOnlineDot != null) {
                        vOnlineDot.setBackgroundResource(R.drawable.bg_pulse_dot);
                        // Restart animation
                        android.view.animation.Animation pulse = new android.view.animation.AlphaAnimation(0.3f, 1.0f);
                        pulse.setDuration(1000);
                        pulse.setRepeatMode(android.view.animation.Animation.REVERSE);
                        pulse.setRepeatCount(android.view.animation.Animation.INFINITE);
                        vOnlineDot.startAnimation(pulse);
                    }
                });
            }

            @Override
            public void onNetworkLost() {
                runOnUiThread(() -> {
                    if (tvOnline != null) {
                        tvOnline.setText("OFFLINE");
                        tvOnline.setTextColor(ContextCompat.getColor(StatusActivity.this, R.color.color_status_alert));
                    }
                    if (vOnlineDot != null) {
                        vOnlineDot.setBackgroundColor(ContextCompat.getColor(StatusActivity.this, R.color.color_status_alert));
                        vOnlineDot.clearAnimation();
                    }
                });
            }
        });
    }

    private void handleLogout() {
        String token = "Bearer " + prefsManager.getToken();
        ApiClient.getApiService().updateDriverStatus(token, "Inactive").enqueue(new retrofit2.Callback<Void>() {
            @Override
            public void onResponse(retrofit2.Call<Void> call, retrofit2.Response<Void> response) {
                performLocalLogout();
            }

            @Override
            public void onFailure(retrofit2.Call<Void> call, Throwable t) {
                performLocalLogout();
            }
        });
    }

    private void performLocalLogout() {
        prefsManager.saveToken(null);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
        Toast.makeText(this, "Logged Out Successfully.", Toast.LENGTH_SHORT).show();
    }
}
