-- =========================================================
-- Farmer's Fresh — Local Farmer-to-Consumer Marketplace
-- Database schema + demo data (MySQL / MariaDB)
-- Import this file once in phpMyAdmin (Import tab).
-- =========================================================

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS farmers_fresh;
CREATE DATABASE farmers_fresh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE farmers_fresh;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('consumer','farmer','admin') NOT NULL DEFAULT 'consumer',
  phone VARCHAR(15),
  district VARCHAR(60),
  village VARCHAR(80),
  address VARCHAR(255),
  farm_name VARCHAR(120),
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category ENUM('Vegetables','Fruits','Grains & Pulses','Dairy & More') NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  typical_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  season VARCHAR(40),
  image_url VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  benefits TEXT
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  catalog_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  custom_image VARCHAR(255),
  notes VARCHAR(255),
  is_organic TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_id) REFERENCES catalog(id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consumer_id INT NOT NULL,
  farmer_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_mode ENUM('COD','Pickup') NOT NULL DEFAULT 'COD',
  delivery_address VARCHAR(255),
  phone VARCHAR(15),
  status ENUM('Placed','Accepted','Packed','Delivered','Rejected','Cancelled') NOT NULL DEFAULT 'Placed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  consumer_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_review (product_id, consumer_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Demo users
--   admin@farmersfresh.in    / admin123
--   murugan@farmersfresh.in  / farmer123   (also lakshmi@, selvam@)
--   priya@farmersfresh.in    / consumer123 (also arun@)
-- ---------------------------------------------------------

INSERT INTO users (id,name,email,password_hash,role,phone,district,village,address,farm_name,is_approved) VALUES
(1,'Admin','admin@farmersfresh.in','$2y$10$U5jMw0vqCbTG96hTDbj6vecvlHaW.ZuZ6wHHN.5Aur9GibiOHJWH2','admin','9000000000','Chennai',NULL,'Farmer''s Fresh Office, Chennai',NULL,1),
(2,'Murugan K','murugan@farmersfresh.in','$2y$10$orngzzZaAUXUG6rMESLLW.E1rd2Ad98agjg/odkN0XWsFHNK7a6m.','farmer','9840011122','Thanjavur','Thiruvaiyaru','Thiruvaiyaru, Thanjavur','Cauvery Delta Farms',1),
(3,'Lakshmi R','lakshmi@farmersfresh.in','$2y$10$orngzzZaAUXUG6rMESLLW.E1rd2Ad98agjg/odkN0XWsFHNK7a6m.','farmer','9840033344','Krishnagiri','Kaveripattinam','Kaveripattinam, Krishnagiri','Lakshmi Orchards',1),
(4,'Selvam P','selvam@farmersfresh.in','$2y$10$orngzzZaAUXUG6rMESLLW.E1rd2Ad98agjg/odkN0XWsFHNK7a6m.','farmer','9840055566','Nilgiris','Kotagiri','Kotagiri, Nilgiris','Blue Hills Organic',1),
(5,'Ravi S','ravi@farmersfresh.in','$2y$10$orngzzZaAUXUG6rMESLLW.E1rd2Ad98agjg/odkN0XWsFHNK7a6m.','farmer','9840077788','Madurai','Melur','Melur, Madurai','Ravi Natural Farm',0),
(6,'Priya Natarajan','priya@farmersfresh.in','$2y$10$DI.BfaaKwUkgh.oyCL9X6.qXX0D6kRfmhr9cF9wuwcXMAOtVTPcuu','consumer','9876543210','Chennai',NULL,'12, Lake View Road, Velachery, Chennai - 600042',NULL,1),
(7,'Arun Kumar','arun@farmersfresh.in','$2y$10$DI.BfaaKwUkgh.oyCL9X6.qXX0D6kRfmhr9cF9wuwcXMAOtVTPcuu','consumer','9876501234','Chennai',NULL,'45, Gandhi Street, Tambaram, Chennai - 600045',NULL,1);

-- ---------------------------------------------------------
-- Product catalog. Photos are in frontend/public/images/products/<slug>.jpg
-- (from Wikimedia Commons; credits on the website's Photo credits page)
-- ---------------------------------------------------------
INSERT INTO catalog (id,slug,name,category,unit,typical_price,season,image_url,description,benefits) VALUES
(1,'tomato','Tomato','Vegetables','kg',30,'All year','/images/products/tomato.jpg','Juicy, sun-ripened country tomatoes picked at the peak of redness. Perfect for rasam, chutneys, curries and fresh salads.','Rich in lycopene and vitamin C; supports heart and skin health.'),
(2,'onion','Small Onion (Shallot)','Vegetables','kg',60,'All year','/images/products/onion.jpg','Pungent and sweet sambar onions grown in red soil. The heart of every South Indian kitchen, from sambar to vatha kuzhambu.','Contains antioxidants and sulphur compounds that support immunity.'),
(3,'potato','Potato','Vegetables','kg',35,'All year','/images/products/potato.jpg','Firm, earthy potatoes from the cool hill farms. Great for roasts, poriyal, masala dosa filling and crispy fries.','Good source of energy, potassium and vitamin B6.'),
(4,'carrot','Carrot','Vegetables','kg',55,'Oct – Mar','/images/products/carrot.jpg','Crunchy, sweet Ooty carrots with a deep orange colour. Lovely raw in salads, in halwa or tossed into a quick poriyal.','Packed with beta-carotene for eye health and glowing skin.'),
(5,'brinjal','Brinjal','Vegetables','kg',40,'All year','/images/products/brinjal.jpg','Tender purple brinjals with soft seeds and glossy skin. Ideal for ennai kathirikai, sambar and smoky baingan bharta.','High in fibre and low in calories; aids digestion.'),
(6,'ladys-finger','Lady''s Finger (Okra)','Vegetables','kg',45,'Mar – Oct','/images/products/ladys-finger.jpg','Young, tender okra that snaps cleanly. Makes a crisp vendakkai fry, a tangy puli kuzhambu or a light mor kuzhambu.','Rich in folate, vitamin K and soluble fibre.'),
(7,'drumstick','Drumstick','Vegetables','kg',80,'Feb – Jun','/images/products/drumstick.jpg','Long, fleshy murungakkai straight from backyard trees. The soul of a good sambar and drumstick kootu.','Loaded with calcium, iron and vitamin C.'),
(8,'cabbage','Cabbage','Vegetables','kg',30,'Nov – Feb','/images/products/cabbage.jpg','Tight, fresh green cabbage heads with crisp leaves. Use for cabbage poriyal, coleslaw or vegetable kurma.','Rich in vitamin K and C; supports gut health.'),
(9,'cauliflower','Cauliflower','Vegetables','piece',40,'Nov – Feb','/images/products/cauliflower.jpg','Creamy white cauliflower with dense florets. Perfect for gobi 65, aloo gobi and flavourful kurma.','Good source of vitamin C, folate and choline.'),
(10,'spinach','Spinach (Keerai)','Vegetables','bunch',20,'All year','/images/products/spinach.jpg','Freshly cut leafy greens, washed and bundled the same morning. Make keerai masiyal, palak paneer or a simple dal.','Excellent source of iron, calcium and folate.'),
(11,'green-chilli','Green Chilli','Vegetables','kg',70,'All year','/images/products/green-chilli.jpg','Bright, fiery green chillies with a fresh aroma. A must for tempering, chutneys and pickles.','Contains capsaicin and vitamin C; boosts metabolism.'),
(12,'beans','Beans','Vegetables','kg',60,'Oct – Mar','/images/products/beans.jpg','Tender French beans without strings, snapped fresh from the vine. Great for beans poriyal, fried rice and paruppu usili.','Rich in fibre, vitamin A and plant protein.'),
(13,'bitter-gourd','Bitter Gourd','Vegetables','kg',50,'Mar – Sep','/images/products/bitter-gourd.jpg','Firm green pavakkai with prominent ridges. Makes crispy chips, a tangy pitlai or a jaggery-balanced curry.','Known to help regulate blood sugar; rich in iron.'),
(14,'pumpkin','Pumpkin','Vegetables','kg',25,'All year','/images/products/pumpkin.jpg','Sweet yellow pumpkin with dense flesh. Wonderful in sambar, kootu, halwa or a creamy soup.','High in vitamin A and antioxidants; good for eyes.'),
(15,'banana','Banana','Fruits','dozen',60,'All year','/images/products/banana.jpg','Naturally ripened Poovan and Robusta bananas — no carbide. A quick, healthy snack for all ages.','Instant energy, potassium and vitamin B6.'),
(16,'mango','Mango','Fruits','kg',120,'Apr – Jul','/images/products/mango.jpg','Fragrant Alphonso and Banganapalli mangoes, tree-ripened and sweet. The king of summer fruits.','Rich in vitamins A and C; supports immunity.'),
(17,'guava','Guava','Fruits','kg',60,'Aug – Mar','/images/products/guava.jpg','Crisp, fragrant country guavas with pink and white flesh. Best enjoyed with a pinch of salt and chilli.','Has more vitamin C than oranges; high in fibre.'),
(18,'papaya','Papaya','Fruits','piece',50,'All year','/images/products/papaya.jpg','Soft, orange-fleshed papayas ripened on the tree. Light on the stomach and great for breakfast.','Contains papain enzyme that aids digestion.'),
(19,'watermelon','Watermelon','Fruits','piece',70,'Mar – Jun','/images/products/watermelon.jpg','Big, juicy watermelons with sweet red flesh. The perfect cooler for hot Chennai summers.','Over 90% water; keeps you hydrated.'),
(20,'pomegranate','Pomegranate','Fruits','kg',160,'Sep – Feb','/images/products/pomegranate.jpg','Ruby-red Bhagwa pomegranates bursting with juicy arils. Lovely as juice, in curd rice or on salads.','Rich in antioxidants; supports heart health.'),
(21,'sapota','Sapota (Chikoo)','Fruits','kg',70,'Oct – Mar','/images/products/sapota.jpg','Soft, brown-skinned sapotas with a malty, caramel sweetness. Excellent in milkshakes.','Natural sugars for energy; rich in fibre.'),
(22,'coconut','Coconut','Fruits','piece',35,'All year','/images/products/coconut.jpg','Mature coconuts with thick, sweet kernel from coastal groves. For chutneys, curries and fresh coconut milk.','Healthy fats and minerals; a kitchen essential.'),
(23,'ponni-rice','Ponni Rice','Grains & Pulses','kg',65,'All year','/images/products/ponni-rice.jpg','Aged Ponni rice from Thanjavur delta farms. Soft, fluffy and aromatic — the everyday rice of Tamil Nadu.','Easily digestible source of energy.'),
(24,'ragi','Ragi (Finger Millet)','Grains & Pulses','kg',55,'All year','/images/products/ragi.jpg','Stone-cleaned ragi grown without chemicals. Make ragi kali, dosa, porridge or healthy cookies.','Very high in calcium; great for bones and diabetics.'),
(25,'toor-dal','Toor Dal','Grains & Pulses','kg',150,'All year','/images/products/toor-dal.jpg','Unpolished toor dal that cooks soft and creamy. The base of sambar, paruppu and dal tadka.','Good source of plant protein and folic acid.'),
(26,'groundnut','Groundnut','Grains & Pulses','kg',130,'Dec – Apr','/images/products/groundnut.jpg','Bold, freshly harvested groundnuts. Roast them, boil them or grind into chutney and oil.','Healthy fats, protein and vitamin E.'),
(27,'country-eggs','Country Eggs','Dairy & More','dozen',120,'All year','/images/products/country-eggs.jpg','Nattu kozhi eggs from free-range hens raised in the backyard. Richer yolk, better taste.','Complete protein with essential vitamins.'),
(28,'fresh-milk','Fresh Milk','Dairy & More','litre',60,'All year','/images/products/fresh-milk.jpg','Pure cow''s milk delivered fresh every morning from village dairies. No preservatives, no dilution.','Calcium and protein for strong bones.'),
(29,'honey','Wild Honey','Dairy & More','500 g',350,'All year','/images/products/honey.jpg','Raw forest honey collected from hill-region hives. Unheated and unprocessed with a deep floral flavour.','Natural antioxidant; soothes the throat.'),
(30,'jaggery','Jaggery (Vellam)','Dairy & More','kg',90,'All year','/images/products/jaggery.jpg','Chemical-free sugarcane jaggery made in traditional pans. Perfect for pongal, payasam and sweets.','Contains iron and minerals; a healthier sweetener.');

INSERT INTO products (id,farmer_id,catalog_id,price,quantity,is_organic,notes) VALUES
(1,2,23,62,300,1,'Grown with natural compost, no chemical sprays.'),
(2,2,24,52,120,1,'Grown with natural compost, no chemical sprays.'),
(3,2,25,145,80,0,'Harvested fresh before dispatch.'),
(4,2,15,55,60,1,'Grown with natural compost, no chemical sprays.'),
(5,2,22,32,150,0,'Harvested fresh before dispatch.'),
(6,2,7,75,40,1,'Grown with natural compost, no chemical sprays.'),
(7,2,10,18,50,1,'Grown with natural compost, no chemical sprays.'),
(8,2,2,58,200,0,'Harvested fresh before dispatch.'),
(9,2,1,28,150,0,'Harvested fresh before dispatch.'),
(10,2,5,38,70,1,'Grown with natural compost, no chemical sprays.'),
(11,2,26,125,90,0,'Harvested fresh before dispatch.'),
(12,2,30,85,60,1,'Grown with natural compost, no chemical sprays.'),
(13,3,16,115,180,1,'Grown with natural compost, no chemical sprays.'),
(14,3,17,55,90,1,'Grown with natural compost, no chemical sprays.'),
(15,3,18,45,40,0,'Harvested fresh before dispatch.'),
(16,3,21,65,70,0,'Harvested fresh before dispatch.'),
(17,3,20,150,60,0,'Harvested fresh before dispatch.'),
(18,3,19,65,25,0,'Harvested fresh before dispatch.'),
(19,3,6,42,60,1,'Grown with natural compost, no chemical sprays.'),
(20,3,11,65,30,0,'Harvested fresh before dispatch.'),
(21,3,13,48,40,1,'Grown with natural compost, no chemical sprays.'),
(22,3,14,22,80,0,'Harvested fresh before dispatch.'),
(23,3,27,110,40,1,'Grown with natural compost, no chemical sprays.'),
(24,3,28,58,100,0,'Harvested fresh before dispatch.'),
(25,3,29,340,25,1,'Grown with natural compost, no chemical sprays.'),
(26,4,3,34,250,1,'Grown with natural compost, no chemical sprays.'),
(27,4,4,52,120,1,'Grown with natural compost, no chemical sprays.'),
(28,4,8,28,90,1,'Grown with natural compost, no chemical sprays.'),
(29,4,9,38,60,1,'Grown with natural compost, no chemical sprays.'),
(30,4,12,58,70,1,'Grown with natural compost, no chemical sprays.'),
(31,4,1,32,100,1,'Grown with natural compost, no chemical sprays.');

INSERT INTO orders (id,consumer_id,farmer_id,total,payment_mode,delivery_address,phone,status,created_at) VALUES
(1,6,2,440,'COD','12, Lake View Road, Velachery, Chennai - 600042','9876543210','Delivered',DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2,7,3,285,'COD','45, Gandhi Street, Tambaram, Chennai - 600045','9876501234','Delivered',DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3,6,4,270,'Pickup','12, Lake View Road, Velachery, Chennai - 600042','9876543210','Delivered',DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4,7,2,152,'COD','45, Gandhi Street, Tambaram, Chennai - 600045','9876501234','Packed',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5,6,3,168,'COD','12, Lake View Road, Velachery, Chennai - 600042','9876543210','Accepted',DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6,7,4,66,'COD','45, Gandhi Street, Tambaram, Chennai - 600045','9876501234','Placed',DATE_SUB(NOW(), INTERVAL 0 DAY)),
(7,6,2,189,'Pickup','12, Lake View Road, Velachery, Chennai - 600042','9876543210','Placed',DATE_SUB(NOW(), INTERVAL 0 DAY));

INSERT INTO order_items (order_id,product_id,product_name,quantity,price) VALUES
(1,1,'Ponni Rice',5,62),
(1,4,'Banana',1,55),
(1,6,'Drumstick',1,75),
(2,13,'Mango',2,115),
(2,14,'Guava',1,55),
(3,26,'Potato',3,34),
(3,27,'Carrot',1,52),
(3,30,'Beans',2,58),
(4,9,'Tomato',2,28),
(4,8,'Small Onion (Shallot)',1,58),
(4,10,'Brinjal',1,38),
(5,23,'Country Eggs',1,110),
(5,24,'Fresh Milk',1,58),
(6,29,'Cauliflower',1,38),
(6,28,'Cabbage',1,28),
(7,2,'Ragi (Finger Millet)',2,52),
(7,12,'Jaggery (Vellam)',1,85);

INSERT INTO reviews (product_id,consumer_id,rating,comment) VALUES
(1,6,5,'Soft and aromatic rice, just like my grandmother used to cook. Will buy again!'),
(4,6,4,'Naturally ripened and sweet. A couple were slightly bruised but overall great.'),
(6,6,5,'Very fresh drumsticks, made an amazing sambar.'),
(13,7,5,'Best mangoes I have had this season. Super sweet!'),
(14,7,4,'Crunchy guavas, kids loved them.'),
(26,6,5,'Potatoes from the hills taste so different. Excellent quality.'),
(27,6,5,'Sweet and crunchy carrots. Fresh like straight from the farm.');

INSERT INTO messages (name,email,message) VALUES
('Karthik','karthik@example.com','Do you deliver to Porur? I would love to order vegetables weekly.');
