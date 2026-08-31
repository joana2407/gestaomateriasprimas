-- Adiciona identidade de semana civil domingo–sábado aos relatórios RASFF.
-- A tabela já contém dados; os novos campos são preenchidos com valores neutros
-- antes de serem tornados obrigatórios.
ALTER TABLE rasff_relatorios
  ADD COLUMN ano_semana INT NOT NULL DEFAULT 0,
  ADD COLUMN numero_semana INT NOT NULL DEFAULT 0,
  ADD COLUMN codigo_semana VARCHAR(20) NOT NULL DEFAULT 'LEGADO',
  ADD COLUMN nome_ficheiro VARCHAR(180) NOT NULL DEFAULT 'relatorio-rasff-legado.md';

UPDATE rasff_relatorios
SET ano_semana = YEAR(periodo_inicio),
    numero_semana = FLOOR((DAYOFYEAR(periodo_inicio) - 1 + WEEKDAY(DATE_FORMAT(periodo_inicio, '%Y-01-01')) + 1) / 7) + 1,
    codigo_semana = CONCAT(YEAR(periodo_inicio), '-S', LPAD(FLOOR((DAYOFYEAR(periodo_inicio) - 1 + WEEKDAY(DATE_FORMAT(periodo_inicio, '%Y-01-01')) + 1) / 7) + 1, 2, '0')),
    nome_ficheiro = CONCAT('relatorio-rasff-', YEAR(periodo_inicio), '-S', LPAD(FLOOR((DAYOFYEAR(periodo_inicio) - 1 + WEEKDAY(DATE_FORMAT(periodo_inicio, '%Y-01-01')) + 1) / 7) + 1, 2, '0'), '.md')
WHERE codigo_semana = 'LEGADO';

CREATE INDEX rasff_relatorios_semana_idx ON rasff_relatorios (ano_semana, numero_semana);
CREATE UNIQUE INDEX rasff_relatorios_vigilancia_semana_idx ON rasff_relatorios (vigilancia_id, codigo_semana);
-- O índice único protege contra reprocessamento da mesma semana.
