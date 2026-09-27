-- schema.sql - Schema completo Aurora RP (MySQL 5.7+/8.0, utf8mb4)
-- Importe: mysql -u samp -p samp_rp < sql/schema.sql
CREATE DATABASE IF NOT EXISTS samp_rp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE samp_rp;

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(24) NOT NULL UNIQUE,
  password_hash CHAR(128) NOT NULL,
  salt VARCHAR(17) NOT NULL,
  admin_level TINYINT NOT NULL DEFAULT 0,
  banned TINYINT NOT NULL DEFAULT 0,
  ban_reason VARCHAR(128) DEFAULT NULL,
  register_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT NULL,
  last_ip VARCHAR(45) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  name VARCHAR(24) NOT NULL UNIQUE,
  sex TINYINT NOT NULL DEFAULT 0,
  age TINYINT NOT NULL DEFAULT 18,
  skin SMALLINT NOT NULL DEFAULT 0,
  pos_x FLOAT DEFAULT 1529.6, pos_y FLOAT DEFAULT -1671.0, pos_z FLOAT DEFAULT 13.5,
  angle FLOAT DEFAULT 0, interior INT DEFAULT 0, vw INT DEFAULT 0,
  health FLOAT DEFAULT 100, armour FLOAT DEFAULT 0,
  hunger FLOAT DEFAULT 100, thirst FLOAT DEFAULT 100,
  money INT DEFAULT 1500, bank INT DEFAULT 3000,
  level INT DEFAULT 1, exp INT DEFAULT 0,
  job_id TINYINT DEFAULT 0, job_level INT DEFAULT 0, job_exp INT DEFAULT 0,
  org_id INT DEFAULT 0, org_rank INT DEFAULT 0,
  muted INT DEFAULT 0, jailed INT DEFAULT 0, jail_time INT DEFAULT 0,
  phone_number INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(48) NOT NULL UNIQUE,
  weight FLOAT DEFAULT 0.1,
  max_stack INT DEFAULT 64,
  item_type TINYINT DEFAULT 0 COMMENT '0 misc 1 comida 2 bebida 3 arma 4 droga 5 ferramenta',
  price INT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  char_id INT NOT NULL,
  item_id INT NOT NULL,
  amount INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_inv (char_id, item_id),
  FOREIGN KEY (char_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_char INT DEFAULT NULL,
  owner_org INT DEFAULT NULL,
  model INT NOT NULL,
  pos_x FLOAT DEFAULT 0, pos_y FLOAT DEFAULT 0, pos_z FLOAT DEFAULT 0, angle FLOAT DEFAULT 0,
  color1 INT DEFAULT -1, color2 INT DEFAULT -1,
  plate VARCHAR(12) DEFAULT 'AURORA',
  fuel FLOAT DEFAULT 100, mileage FLOAT DEFAULT 0,
  locked TINYINT DEFAULT 1, impounded TINYINT DEFAULT 0,
  insurance TINYINT DEFAULT 0, price INT DEFAULT 0,
  FOREIGN KEY (owner_char) REFERENCES characters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_char INT DEFAULT NULL,
  price INT DEFAULT 50000,
  ext_x FLOAT DEFAULT 0, ext_y FLOAT DEFAULT 0, ext_z FLOAT DEFAULT 0,
  int_x FLOAT DEFAULT 0, int_y FLOAT DEFAULT 0, int_z FLOAT DEFAULT 0,
  interior INT DEFAULT 0,
  locked TINYINT DEFAULT 1,
  FOREIGN KEY (owner_char) REFERENCES characters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_char INT DEFAULT NULL,
  name VARCHAR(48) DEFAULT 'Empresa',
  biz_type TINYINT DEFAULT 0,
  price INT DEFAULT 100000,
  vault INT DEFAULT 0,
  ext_x FLOAT DEFAULT 0, ext_y FLOAT DEFAULT 0, ext_z FLOAT DEFAULT 0,
  FOREIGN KEY (owner_char) REFERENCES characters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_char INT DEFAULT NULL,
  label VARCHAR(48) DEFAULT 'Propriedade',
  prop_type TINYINT DEFAULT 0,
  price INT DEFAULT 0,
  pos_x FLOAT DEFAULT 0, pos_y FLOAT DEFAULT 0, pos_z FLOAT DEFAULT 0,
  FOREIGN KEY (owner_char) REFERENCES characters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(48) NOT NULL UNIQUE,
  org_type TINYINT DEFAULT 0 COMMENT '0 gov 1 policia 2 saude 3 mecanica 4 crime 5 privada',
  leader_char INT DEFAULT 0,
  vault INT DEFAULT 0,
  base_x FLOAT DEFAULT 0, base_y FLOAT DEFAULT 0, base_z FLOAT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organization_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  char_id INT NOT NULL,
  rank_id INT DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mem (org_id, char_id),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (char_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  char_id INT NOT NULL,
  job_id TINYINT NOT NULL,
  job_level INT DEFAULT 1,
  job_exp INT DEFAULT 0,
  deliveries INT DEFAULT 0,
  UNIQUE KEY uq_job (char_id, job_id),
  FOREIGN KEY (char_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_char INT DEFAULT 0,
  to_char INT DEFAULT 0,
  `type` VARCHAR(24) DEFAULT 'pay',
  amount INT DEFAULT 0,
  reason VARCHAR(128) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_from (from_char), KEY idx_to (to_char)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS punishments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_char INT DEFAULT 0,
  target_account INT DEFAULT 0,
  target_name VARCHAR(24) DEFAULT '',
  `type` VARCHAR(16) DEFAULT 'kick' COMMENT 'kick ban tempban mute jail warn unban',
  reason VARCHAR(128) DEFAULT '',
  duration_min INT DEFAULT 0,
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS phone_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_char INT NOT NULL,
  name VARCHAR(32) NOT NULL,
  number INT NOT NULL,
  FOREIGN KEY (owner_char) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_char INT NOT NULL,
  to_char INT NOT NULL,
  text VARCHAR(160) NOT NULL,
  is_read TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `type` INT DEFAULT 0,
  text VARCHAR(255) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Itens base
INSERT IGNORE INTO items (id,name,weight,max_stack,item_type,price) VALUES
(1,'Pao',0.2,32,1,15),
(2,'Agua',0.3,32,2,10),
(3,'Kit Reparo',2.0,5,5,250),
(4,'Celular',0.1,1,5,500),
(5,'Corda',0.5,8,0,40);

-- Orgs padrao (sem dono)
INSERT IGNORE INTO organizations (id,name,org_type,base_x,base_y,base_z) VALUES
(1,'Policia Militar',1,1553.0,-1675.0,16.0),
(2,'Hospital Central',2,1173.0,-1323.0,15.0),
(3,'Mecanicos Aurora',3,1025.0,-1027.0,32.0),
(4,'Prefeitura',0,1481.0,-1771.0,18.0);
