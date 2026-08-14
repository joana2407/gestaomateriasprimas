CREATE TABLE `operadores_pin` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `pin_hash` varchar(64) NOT NULL,
  `ativo` boolean NOT NULL DEFAULT true,
  `ultimo_acesso_em` timestamp NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `operadores_pin_id` PRIMARY KEY(`id`),
  CONSTRAINT `operadores_pin_user_id_unique` UNIQUE(`user_id`),
  CONSTRAINT `operadores_pin_pin_hash_unique` UNIQUE(`pin_hash`),
  CONSTRAINT `operadores_pin_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

INSERT INTO `users` (`openId`, `name`, `loginMethod`, `role`)
VALUES
  ('pin-logistica', 'Logística', 'pin', 'logistica'),
  ('pin-sabrina-esteves', 'Sabrina Esteves', 'pin', 'qualidade'),
  ('pin-neuza-antunes', 'Neuza Antunes', 'pin', 'qualidade')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `loginMethod` = 'pin';

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', true FROM `users` WHERE `openId` = 'pin-logistica'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, 'eaf493e8af54e4fb893988a51b83b390a725e24bbe1575a50625c811c08ecb6f', true FROM `users` WHERE `openId` = 'pin-sabrina-esteves'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, '2e3c969e2e9b367ade00279743f88ea0e32f283152223e3d9aaf1c14669d7cbe', true FROM `users` WHERE `openId` = 'pin-neuza-antunes'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, 'e41fbda961c9b0a19e1232a464bdf5a03c5b5568b12147ee234d4a473c425beb', true FROM `users` WHERE `id` = 1
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;
