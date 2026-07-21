from backend.database import SessionLocal
from backend.models.models import Bin
import random

db = SessionLocal()
bins = db.query(Bin).filter(Bin.ward == 'Lien Chieu').all()

# Realistic coordinates along Nguyen Luong Bang / Ton Duc Thang street
coords = [
    (16.0730, 108.1500),
    (16.0715, 108.1520),
    (16.0690, 108.1540),
    (16.0665, 108.1555),
    (16.0640, 108.1580),
    (16.0620, 108.1610),
    (16.0600, 108.1630),
    (16.0580, 108.1650),
    (16.0560, 108.1680),
    (16.0540, 108.1700)
]

for i, b in enumerate(bins):
    if i < len(coords):
        b.latitude = coords[i][0] + random.uniform(-0.0002, 0.0002)
        b.longitude = coords[i][1] + random.uniform(-0.0002, 0.0002)

db.commit()
print('Lien Chieu Bins updated with realistic road curve.')
