-- Migration: Update service_type values from Bulgarian to English
-- Date: 2026-02-11

UPDATE services 
SET service_type = 'civil_liability' 
WHERE service_type = 'гражданска';

UPDATE services 
SET service_type = 'vignette' 
WHERE service_type = 'винетка';

UPDATE services 
SET service_type = 'inspection' 
WHERE service_type = 'преглед';

UPDATE services 
SET service_type = 'casco' 
WHERE service_type = 'каско';

UPDATE services 
SET service_type = 'tax' 
WHERE service_type = 'данък';

UPDATE services 
SET service_type = 'fire_extinguisher' 
WHERE service_type = 'пожарогасител';

UPDATE services 
SET service_type = 'repair' 
WHERE service_type = 'ремонт';

UPDATE services 
SET service_type = 'maintenance' 
WHERE service_type = 'обслужване';

UPDATE services 
SET service_type = 'tires' 
WHERE service_type = 'гуми';

UPDATE services 
SET service_type = 'refuel' 
WHERE service_type = 'зареждане';

UPDATE services 
SET service_type = 'other' 
WHERE service_type = 'друго';

-- Verify the update
SELECT service_type, COUNT(*) as count 
FROM services 
GROUP BY service_type 
ORDER BY count DESC;
