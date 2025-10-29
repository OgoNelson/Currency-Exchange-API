-- Create database
CREATE DATABASE IF NOT EXISTS currency_exchange;

-- Use the database
USE currency_exchange;

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  capital VARCHAR(255),
  region VARCHAR(255),
  population BIGINT NOT NULL,
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(10, 4),
  estimated_gdp DECIMAL(20, 2),
  flag_url VARCHAR(500),
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_region (region),
  INDEX idx_currency_code (currency_code),
  INDEX idx_name (name)
);

-- Create system_status table
CREATE TABLE IF NOT EXISTS system_status (
  id INT PRIMARY KEY DEFAULT 1,
  total_countries INT DEFAULT 0,
  last_refreshed_at TIMESTAMP NULL,
  CONSTRAINT single_status CHECK (id = 1)
);

-- Insert initial status record
INSERT IGNORE INTO system_status (id, total_countries, last_refreshed_at) 
VALUES (1, 0, NULL);