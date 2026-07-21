package com.example.managementdriver.ui.route;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.example.managementdriver.utils.NetworkUtils;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.example.managementdriver.R;
import com.example.managementdriver.models.BinCollection;
import com.example.managementdriver.models.RouteResponse;
import com.example.managementdriver.network.ApiClient;
import com.example.managementdriver.ui.login.LoginActivity;
import com.example.managementdriver.utils.PrefsManager;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {

    private PrefsManager prefsManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        prefsManager = new PrefsManager(this);

        // SYNC DRIVER INFO
        TextView tvName = findViewById(R.id.tvDriverName);
        tvName.setText(prefsManager.getDriverName());

        ImageView ivProfileAvatar = findViewById(R.id.ivDriverAvatar);
        Glide.with(this)
                .load("https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80")
                .placeholder(R.drawable.ic_driver_avatar)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .into(ivProfileAvatar);
        
        ((TextView)findViewById(R.id.tvRouteId)).setText(prefsManager.getRouteId());
        ((TextView)findViewById(R.id.tvEmployeeId)).setText("Employee ID: #" + prefsManager.getDriverId());

        // Load Header Avatar
        ImageView ivHeaderAvatar = findViewById(R.id.ivProfileAvatar);
        if (ivHeaderAvatar != null) {
            Glide.with(this)
                    .load("https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80")
                    .placeholder(R.drawable.ic_driver_avatar)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .circleCrop()
                    .into(ivHeaderAvatar);
        }

        findViewById(R.id.navRoute).setOnClickListener(v -> finish());
        findViewById(R.id.navActivity).setOnClickListener(v -> {
            startActivity(new Intent(this, LogsActivity.class));
            finish();
        });
        findViewById(R.id.navStatus).setOnClickListener(v -> {
            startActivity(new Intent(this, StatusActivity.class));
            finish();
        });
        findViewById(R.id.navProfile).setOnClickListener(v -> {});

        fetchRealLifetimeStats();
        observeNetwork();
    }

    private void fetchRealLifetimeStats() {
        String token = "Bearer " + prefsManager.getToken();
        ApiClient.getApiService().getCollectionSequence(token).enqueue(new Callback<RouteResponse>() {
            @Override
            public void onResponse(Call<RouteResponse> call, Response<RouteResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<BinCollection> bins = response.body().getRoute();
                    int collectedCount = 0;
                    if (bins != null) {
                        for (BinCollection b : bins) {
                            String s = b.getCollectionStatus();
                            if (s != null && (s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                                collectedCount++;
                            }
                        }
                    }
                    int finalCollected = collectedCount;
                    runOnUiThread(() -> {
                        ((TextView)findViewById(R.id.tvLifetimeStops)).setText(String.valueOf(1240 + finalCollected));
                    });
                } else if (response.code() == 401) {
                    runOnUiThread(() -> {
                        Toast.makeText(ProfileActivity.this, "Session Expired. Please login again.", Toast.LENGTH_LONG).show();
                        redirectToLogin();
                    });
                }
            }
            @Override public void onFailure(Call<RouteResponse> call, Throwable t) {}
        });
    }

    private void handleLogout() {
        String token = "Bearer " + prefsManager.getToken();
        ApiClient.getApiService().updateDriverStatus(token, "Inactive").enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                performLocalLogout();
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
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
        Toast.makeText(this, "Shift Ended.", Toast.LENGTH_SHORT).show();
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
                        tvOnline.setTextColor(ContextCompat.getColor(ProfileActivity.this, R.color.color_primary_green));
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
                        tvOnline.setTextColor(ContextCompat.getColor(ProfileActivity.this, R.color.color_status_alert));
                    }
                    if (vOnlineDot != null) {
                        vOnlineDot.setBackgroundColor(ContextCompat.getColor(ProfileActivity.this, R.color.color_status_alert));
                        vOnlineDot.clearAnimation();
                    }
                });
            }
        });
    }

    private void redirectToLogin() {
        prefsManager.saveToken(null);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
