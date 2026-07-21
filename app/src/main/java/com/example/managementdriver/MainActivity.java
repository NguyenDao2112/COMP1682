package com.example.managementdriver;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.example.managementdriver.ui.login.LoginActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Redirect to LoginActivity or Dashboard based on session
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}
