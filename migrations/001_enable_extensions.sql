-- Migration 001: Enable pgcrypto extension
-- Description: Enables UUID generation functions

CREATE EXTENSION IF NOT EXISTS pgcrypto;
