<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}

// Reset test DB via raw PDO — avoids FK purger issues and "unknown database" errors
// when the DB doesn't exist yet. Mirrors doctrine.yaml when@test dbname_suffix logic.
$dbUrl  = parse_url($_SERVER['DATABASE_URL']);
$host   = $dbUrl['host'];
$port   = $dbUrl['port'] ?? 3306;
$dbUser = $dbUrl['user'];
$dbPass = rawurldecode($dbUrl['pass'] ?? '');
$dbName = explode('?', ltrim($dbUrl['path'], '/'))[0];
$testDb = $dbName . '_test';

$pdo = new PDO(
    sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $host, $port),
    $dbUser,
    $dbPass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$pdo->exec(sprintf('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', $testDb));
$pdo->exec(sprintf('USE `%s`', $testDb));
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->exec('DROP TABLE IF EXISTS `user_task_like`');
$pdo->exec('DROP TABLE IF EXISTS `task`');
$pdo->exec('DROP TABLE IF EXISTS `user`');
$pdo->exec('DROP TABLE IF EXISTS `messenger_messages`');
$pdo->exec('DROP TABLE IF EXISTS `doctrine_migration_versions`');
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
$pdo = null;

passthru(sprintf('php "%s/../bin/console" --env=test doctrine:migrations:migrate --no-interaction', __DIR__));
passthru(sprintf('php "%s/../bin/console" --env=test doctrine:fixtures:load --no-interaction --append', __DIR__));
