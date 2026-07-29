import os

backups_dir = r"D:\COMP1682\ai-waste-optimizer\ai-waste-optimizer\backend\backups"
keep_files = ["waste_optimizer_backup_auto.db", "waste_optimizer_snapshot_20260730_01.db"]

if os.path.exists(backups_dir):
    for f in os.listdir(backups_dir):
        if f not in keep_files:
            file_path = os.path.join(backups_dir, f)
            try:
                os.remove(file_path)
                print(f"Removed old test snapshot: {f}")
            except Exception as e:
                print(f"Error removing {f}: {e}")
