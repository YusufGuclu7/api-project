-- Initial setup for API Project Database
-- This file is executed when PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (handled by environment variables)
-- Extensions can be added here if needed

-- Set timezone
SET timezone = 'Europe/Istanbul';

-- Create indexes after Prisma migrations are applied
-- These will be created by Prisma migrate