create table users(
id BIGINT NOT NULL AUTO_INCREMENT,

first_name varchar(255) not null,
last_name varchar(255) not null,
username varchar(255) not null,
password varchar(255) not null,
role varchar(255) DEFAULT 'basic',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE printers(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_model_id int not null,

printer_status_id int default 1,
label varchar(32) not null,
z_displacement real not null,
is_active boolean default true, 

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE printer_models(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_brand_id int not null,
label VARCHAR(255) NOT NULL,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE printer_brands(
id BIGINT NOT NULL AUTO_INCREMENT,

label VARCHAR(255) NOT NULL,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

insert into printer_brands(label) values("Creality");
insert into printer_brands(label) values("Bamboo Lab");

CREATE TABLE connection_lib(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_id int not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE connection_values(
id BIGINT NOT NULL AUTO_INCREMENT,

connection_lib_id int not null,
connection_type_id int not null,
value varchar(128) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE connection_types(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_brand_id int not null,
value varchar(32) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

insert into connection_types(label, value) values("Creality");
insert into connection_types(label) values("Bamboo Lab");

CREATE TABLE materials(
id BIGINT NOT NULL AUTO_INCREMENT,

label varchar(32) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE current_filaments(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_id int not null,
filament_id int not null,
entry_quantity real not null,
current_quantity real not null,
in_use boolean not null default true,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE filaments(
id BIGINT NOT NULL AUTO_INCREMENT,

filament_brand_id int not null,
material_id int not null,
color varchar(32) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE filament_brands(
id BIGINT NOT NULL AUTO_INCREMENT,

label varchar(32) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);



CREATE TABLE products(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_model_id int not null,
filament_brand_id int not null,
filament_material_id int not null,
file_id int,
image_path varchar(255),
sku varchar(32) not null,
included_items text not null,
print_time time not null,
weight_gross real not null,
weight_net real not null,
quantity int not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE jobs(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_id int not null,
product_id int not null,
status_id int not null default 1,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE printer_queue(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_id int not null,
job_id int not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE job_status(
id BIGINT NOT NULL AUTO_INCREMENT,

label varchar(32) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

insert into job_status(label) values("Aguardando impressão");
insert into job_status(label) values("Em impressão");
insert into job_status(label) values("Impressão Concluída");
insert into job_status(label) values("Concluído");
insert into job_status(label) values("Cancelado");

CREATE TABLE files(
id BIGINT NOT NULL AUTO_INCREMENT,

type varchar(32) not null,
path varchar(255) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE printer_status(
id BIGINT NOT NULL AUTO_INCREMENT,

label varchar(32) not null,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

CREATE TABLE tickets(
id BIGINT NOT NULL AUTO_INCREMENT,

printer_id int not null,
is_closed boolean default 0,
description text,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
closed_at DATETIME DEFAULT NULL,
deleted_at DATETIME DEFAULT NULL,
primary key(id)
);

insert into printer_status(label) values("Ociosa");
insert into printer_status(label) values("Em Impressão");
