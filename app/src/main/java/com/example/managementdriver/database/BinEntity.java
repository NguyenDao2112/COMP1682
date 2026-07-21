package com.example.managementdriver.database;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import androidx.room.Ignore;

@Entity(tableName = "bins")
public class BinEntity {
    @PrimaryKey
    @NonNull
    public String binId;
    
    public String databaseId;
    public String locationName;
    public double latitude;
    public double longitude;
    public double fillLevel;
    public String binType;
    public String zone;
    public int stopNumber;
    public String collectionStatus;
    public long lastUpdated;
    public boolean isSynced = true;

    public BinEntity() {}

    @Ignore
    public BinEntity(@NonNull String binId, String databaseId, String locationName, double latitude, double longitude, double fillLevel, String binType, String zone, int stopNumber, String collectionStatus) {
        this.binId = binId;
        this.databaseId = databaseId;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.fillLevel = fillLevel;
        this.binType = binType;
        this.zone = zone;
        this.stopNumber = stopNumber;
        this.collectionStatus = collectionStatus;
        this.lastUpdated = System.currentTimeMillis();
    }
}
