package com.example.managementdriver.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface BinDao {
    @Query("SELECT * FROM bins ORDER BY stopNumber ASC")
    List<BinEntity> getAllBins();

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertBins(List<BinEntity> bins);

    @Update
    void updateBin(BinEntity bin);

    @Query("UPDATE bins SET collectionStatus = :status, isSynced = 1 WHERE databaseId = :id OR binId = :id")
    void markCollected(String id, String status);

    @Query("UPDATE bins SET collectionStatus = :status, isSynced = 0 WHERE databaseId = :id OR binId = :id")
    void markCollectedOffline(String id, String status);

    @Query("SELECT * FROM bins WHERE isSynced = 0")
    List<BinEntity> getUnsyncedBins();

    @Query("UPDATE bins SET isSynced = 1 WHERE binId = :id")
    void markSynced(String id);

    @Query("SELECT * FROM bins WHERE binId = :id LIMIT 1")
    BinEntity getBinById(String id);

    @Query("DELETE FROM bins")
    void deleteAll();
}
