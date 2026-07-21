package com.example.managementdriver.models;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "stops")
public class RouteStop {
    @PrimaryKey
    @NonNull
    private String id;
    private String address;
    private double latitude;
    private double longitude;
    private Priority priority;
    private boolean isCollected;
    private int fillLevel;
    private String notes;
    private String photoUri;

    public RouteStop(@NonNull String id, String address, double latitude, double longitude, Priority priority, boolean isCollected, int fillLevel, String notes, String photoUri) {
        this.id = id;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.priority = priority;
        this.isCollected = isCollected;
        this.fillLevel = fillLevel;
        this.notes = notes;
        this.photoUri = photoUri;
    }

    // Getters and Setters
    @NonNull
    public String getId() { return id; }
    public void setId(@NonNull String id) { this.id = id; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public boolean isCollected() { return isCollected; }
    public void setCollected(boolean collected) { isCollected = collected; }

    public int getFillLevel() { return fillLevel; }
    public void setFillLevel(int fillLevel) { this.fillLevel = fillLevel; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPhotoUri() { return photoUri; }
    public void setPhotoUri(String photoUri) { this.photoUri = photoUri; }

    public enum Priority {
        NORMAL, HIGH, OVERFLOW_RISK
    }
}
