-- V4: Alter lat and lng columns in submissions table to double precision to match Java Double type
ALTER TABLE submissions ALTER COLUMN lat TYPE double precision;
ALTER TABLE submissions ALTER COLUMN lng TYPE double precision;
