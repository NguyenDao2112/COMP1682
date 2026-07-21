package com.example.managementdriver.ui.route;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.example.managementdriver.R;
import com.example.managementdriver.database.AppDatabase;
import com.example.managementdriver.database.BinEntity;
import com.example.managementdriver.models.BinCollection;
import com.example.managementdriver.models.RouteResponse;
import com.example.managementdriver.network.ApiClient;
import com.example.managementdriver.utils.NetworkUtils;
import com.example.managementdriver.ui.login.LoginActivity;
import com.example.managementdriver.utils.PrefsManager;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LogsActivity extends AppCompatActivity {

    private List<BinCollection> collectedBins = new ArrayList<>();
    private LogsAdapter adapter;
    private PrefsManager prefsManager;
    private SwipeRefreshLayout swipeRefresh;
    private TextView tvSummary;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_logs);

        prefsManager = new PrefsManager(this);
        tvSummary = findViewById(R.id.tvRouteSubtitle);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        ((TextView)findViewById(R.id.tvRouteId)).setText(prefsManager.getRouteId());

        // Load Avatar
        ImageView ivAvatar = findViewById(R.id.ivLogsAvatar);
        Glide.with(this)
                .load("https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80")
                .placeholder(R.drawable.ic_driver_avatar)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .into(ivAvatar);
        
        ivAvatar.setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));

        RecyclerView rvLogs = findViewById(R.id.rvLogs);
        rvLogs.setLayoutManager(new LinearLayoutManager(this));
        adapter = new LogsAdapter(collectedBins);
        rvLogs.setAdapter(adapter);

        swipeRefresh.setOnRefreshListener(this::fetchRealHistory);

        findViewById(R.id.navRoute).setOnClickListener(v -> finish());
        findViewById(R.id.navStatus).setOnClickListener(v -> {
            startActivity(new Intent(this, StatusActivity.class));
            finish();
        });
        findViewById(R.id.navProfile).setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileActivity.class));
            finish();
        });

        fetchRealHistory();
        observeNetwork();
    }

    private void fetchRealHistory() {
        String token = "Bearer " + prefsManager.getToken();
        
        // Step 1: Load from Room First
        new Thread(() -> {
            List<BinEntity> entities = AppDatabase.getInstance(this).binDao().getAllBins();
            final List<BinCollection> offlineItems = new ArrayList<>();
            int total = entities.size();
            int completed = 0;
            for (BinEntity e : entities) {
                String s = e.collectionStatus;
                if (s != null && (s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                    offlineItems.add(new BinCollection(e.binId, e.locationName, e.latitude, e.longitude, e.fillLevel, e.binType, e.zone, e.stopNumber, e.collectionStatus));
                    completed++;
                }
            }
            final int finalTotal = total;
            final int finalCompleted = completed;
            runOnUiThread(() -> {
                if (collectedBins.isEmpty()) {
                    collectedBins.clear();
                    collectedBins.addAll(offlineItems);
                    adapter.notifyDataSetChanged();
                    updateUI(finalCompleted, finalTotal);
                }
            });
        }).start();

        // Step 2: Fetch Live
        ApiClient.getApiService().getCollectionSequence(token).enqueue(new Callback<RouteResponse>() {
            @Override
            public void onResponse(Call<RouteResponse> call, Response<RouteResponse> response) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    List<BinCollection> all = response.body().getRoute();
                    if (all != null && !all.isEmpty()) {
                        collectedBins.clear();
                        int total = all.size();
                        int completed = 0;
                        for (BinCollection b : all) {
                            String s = b.getCollectionStatus();
                            if (s != null && (s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                                collectedBins.add(b);
                                completed++;
                            }
                        }
                        final int finalCompleted = completed;
                        final int finalTotal = total;
                        runOnUiThread(() -> {
                            adapter.notifyDataSetChanged();
                            updateUI(finalCompleted, finalTotal);
                        });
                    }
                } else if (response.code() == 401) {
                    runOnUiThread(() -> {
                        android.widget.Toast.makeText(LogsActivity.this, "Session Expired. Please login again.", android.widget.Toast.LENGTH_LONG).show();
                        redirectToLogin();
                    });
                }
            }
            @Override public void onFailure(Call<RouteResponse> call, Throwable t) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
            }
        });
    }

    private void updateUI(int completed, int total) {
        int remaining = total - completed;
        tvSummary.setText(remaining + " STOPS REMAINING");
        
        TextView tvBinsCount = findViewById(R.id.tvBinsCount);
        TextView tvProgressPercent = findViewById(R.id.tvProgressPercent);
        ProgressBar pbPerformance = findViewById(R.id.pbPerformance);
        
        if (tvBinsCount != null) tvBinsCount.setText(completed + " / " + total);
        int percent = (total > 0) ? (completed * 100 / total) : 0;
        if (tvProgressPercent != null) tvProgressPercent.setText(percent + "%");
        if (pbPerformance != null) pbPerformance.setProgress(percent);
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
                        tvOnline.setTextColor(ContextCompat.getColor(LogsActivity.this, R.color.color_primary_green));
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
                        tvOnline.setTextColor(ContextCompat.getColor(LogsActivity.this, R.color.color_status_alert));
                    }
                    if (vOnlineDot != null) {
                        vOnlineDot.setBackgroundColor(ContextCompat.getColor(LogsActivity.this, R.color.color_status_alert));
                        vOnlineDot.clearAnimation();
                    }
                });
            }
        });
    }

    private static class LogsAdapter extends RecyclerView.Adapter<LogsAdapter.ViewHolder> {
        private List<BinCollection> items;
        LogsAdapter(List<BinCollection> items) { this.items = items; }

        @NonNull @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup p, int t) {
            return new ViewHolder(LayoutInflater.from(p.getContext()).inflate(R.layout.item_collection_log, p, false));
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder h, int pos) {
            BinCollection b = items.get(pos);
            h.id.setText(b.getBin_id());
            h.location.setText(b.getLocation_name());
            h.time.setText("Collected Task #" + b.getStopNumber());
            h.status.setText("Verified");
            
            String type = b.getBinType() != null ? b.getBinType() : "General";
            h.badge.setText(type.toUpperCase());

            // Dynamic badge color coding
            int bgVal = android.graphics.Color.parseColor("#E8F5E9"); // default light green (organic)
            int textVal = android.graphics.Color.parseColor("#10B981"); // default emerald green
            
            if ("Recycling".equalsIgnoreCase(type)) {
                bgVal = android.graphics.Color.parseColor("#E0F2FE"); // light blue
                textVal = android.graphics.Color.parseColor("#0369A1"); // dark blue
            } else if ("Organic".equalsIgnoreCase(type)) {
                bgVal = android.graphics.Color.parseColor("#FEF3C7"); // light amber
                textVal = android.graphics.Color.parseColor("#D97706"); // dark amber
            } else if ("Hazardous".equalsIgnoreCase(type) || "Overflow".equalsIgnoreCase(type)) {
                bgVal = android.graphics.Color.parseColor("#FEF2F2"); // light red
                textVal = android.graphics.Color.parseColor("#B91C1C"); // dark red
            }
            
            if (h.badgeCard != null) {
                h.badgeCard.setCardBackgroundColor(bgVal);
            }
            h.badge.setTextColor(textVal);
            
            String imageUrl = "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80";
            if ("Recycling".equalsIgnoreCase(b.getBinType())) imageUrl = "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80";
            
            Glide.with(h.itemView.getContext()).load(imageUrl).centerCrop().placeholder(R.drawable.ic_stops).diskCacheStrategy(DiskCacheStrategy.ALL).into(h.thumbnail);
        }

        @Override public int getItemCount() { return items.size(); }

        static class ViewHolder extends RecyclerView.ViewHolder {
            TextView id, badge, time, status, location;
            com.google.android.material.card.MaterialCardView badgeCard;
            ImageView thumbnail;
            ViewHolder(View v) {
                super(v);
                id = v.findViewById(R.id.tvBinId);
                badge = v.findViewById(R.id.tvBadge);
                time = v.findViewById(R.id.tvTimestamp);
                status = v.findViewById(R.id.tvStatus);
                location = v.findViewById(R.id.tvBinLocation);
                thumbnail = v.findViewById(R.id.ivThumbnail);
                badgeCard = v.findViewById(R.id.cvBadge);
            }
        }
    }

    private void redirectToLogin() {
        prefsManager.saveToken(null);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
