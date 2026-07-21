package com.example.managementdriver.ui;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.example.managementdriver.R;
import com.example.managementdriver.ui.login.LoginActivity;
import com.example.managementdriver.ui.route.DashboardActivity;
import com.example.managementdriver.utils.PrefsManager;

public class SplashActivity extends AppCompatActivity {

    // Same professional avatar URL used across the app
    private static final String AVATAR_URL = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_App_Splash);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        ImageView ivAvatar = findViewById(R.id.ivSplashAvatar);
        View tvAppName = findViewById(R.id.tvAppName);
        View tvSubtitle = findViewById(R.id.tvAppSubtitle);
        View pbSplash = findViewById(R.id.pbSplash);

        // SYNC: Load the real driver avatar (Nguyen Van Tuan)
        Glide.with(this)
                .load(AVATAR_URL)
                .placeholder(R.drawable.ic_driver_avatar)
                .error(R.drawable.ic_driver_avatar)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .into(ivAvatar);

        // CLEAN ANIMATIONS (Fixed Overlap Logic)
        ivAvatar.setAlpha(0f);
        ivAvatar.setScaleX(0.5f);
        ivAvatar.setScaleY(0.5f);
        tvAppName.setAlpha(0f);
        tvAppName.setTranslationY(40f);
        tvSubtitle.setAlpha(0f);
        pbSplash.setAlpha(0f);

        // Sequence: Avatar -> App Name -> Loading Bar
        ivAvatar.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(1200).start();
        tvAppName.animate().alpha(1f).translationY(0f).setDuration(800).setStartDelay(400).start();
        tvSubtitle.animate().alpha(1f).setDuration(800).setStartDelay(600).start();
        pbSplash.animate().alpha(1f).setDuration(1000).setStartDelay(1000).start();

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            PrefsManager prefsManager = new PrefsManager(this);
            if (prefsManager.getToken() != null) {
                Intent intent = new Intent(SplashActivity.this, DashboardActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
            } else {
                startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            }
            finish();
        }, 3200);
    }
}
