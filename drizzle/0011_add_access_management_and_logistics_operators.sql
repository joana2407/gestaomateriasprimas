ALTER TABLE `users`
  ADD COLUMN `pode_gerir_acessos` boolean NOT NULL DEFAULT false;

UPDATE `users`
  SET `pode_gerir_acessos` = true
  WHERE `id` = 1;

INSERT INTO `users` (`openId`, `name`, `loginMethod`, `role`, `pode_gerir_acessos`)
VALUES
  ('pin-richard-dias', 'Richard Dias', 'pin', 'logistica', false),
  ('pin-marcelo-loureiro', 'Marcelo Loureiro', 'pin', 'logistica', false),
  ('pin-pedro-magina', 'Pedro Magina', 'pin', 'logistica', false),
  ('pin-pedro-lemos', 'Pedro Lemos', 'pin', 'logistica', false)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `loginMethod` = 'pin';

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, '888b19a43b151683c87895f6211d9f8640f97bdc8ef32f03dbe057c8f5e56d32', true FROM `users` WHERE `openId` = 'pin-richard-dias'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, '4fac6dbe26e823ed6edf999c63fab3507119cf3cbfb56036511aa62e258c35b4', true FROM `users` WHERE `openId` = 'pin-marcelo-loureiro'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, '446e21f212ab200933c4c9a0802e1ff0c410bbd75fca10168746fc49883096db', true FROM `users` WHERE `openId` = 'pin-pedro-magina'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;

INSERT INTO `operadores_pin` (`user_id`, `pin_hash`, `ativo`)
SELECT `id`, '0591b59c1bdd9acd2847a202ddd02c3f14f9b5a049a5707c3279c1e967745ed4', true FROM `users` WHERE `openId` = 'pin-pedro-lemos'
ON DUPLICATE KEY UPDATE `pin_hash` = VALUES(`pin_hash`), `ativo` = true;
