<?php
/**
 * TaskTest.php
 * Author: Kashif Bhatti
 * 17/09/2026
 */

use App\Repository\TaskRepository;
use App\Repository\UserRepository;

beforeEach(function () {
    $this->client = static::createClient();
    $container = static::getContainer();
    $this->user = $container->get(UserRepository::class)->find(1);
});

test('user can like and unlike a task', function () {
    $container = static::getContainer();
    $taskRepository = $container->get(TaskRepository::class);

    $task = $taskRepository->findOneBy(['user' => $this->user]);
    expect($task)->not->toBeNull();

    $beforeCount = $task->getLikes()->count();

    $this->client->loginUser($this->user);
    $this->client->request('POST', '/api/task/' . $task->getId() . '/like');

    expect($this->client->getResponse()->getStatusCode())->toBe(200);
    expect($task->getLikes()->count())->toBe($beforeCount + 1);

    //now unlike the task.
    $taskId = $task->getId();
    $this->client->request('POST', '/api/task/' . $taskId . '/like');
    $task = $taskRepository->find($taskId);
    expect($task->getLikes()->count())->toBe($beforeCount);
});

test('user can create and delete a task', function () {
    $container = static::getContainer();
    $taskRepository = $container->get(TaskRepository::class);

    $this->client->loginUser($this->user);

    // Create a new task
    $this->client->request('POST', '/api/task/new', ['name' => 'Test Task']);
    expect($this->client->getResponse()->getStatusCode())->toBe(200);

    $taskId = json_decode($this->client->getResponse()->getContent(), true)['data']['id'];

    // Mark the task as complete and rename it
    $this->client->request('POST', '/api/task/' . $taskId . '/edit', ['name' => 'Test Task Completed', 'is_complete' => true]);
    expect($this->client->getResponse()->getStatusCode())->toBe(200);

    expect($taskRepository->find($taskId)->getName())->toBe('Test Task Completed');
    expect($taskRepository->find($taskId)->isComplete())->toBeTrue();

    // Delete the task
    $this->client->request('POST', '/api/task/' . $taskId . '/delete');
    expect($this->client->getResponse()->getStatusCode())->toBe(200);

    $taskRepository->getEntityManager()->clear();
    expect($taskRepository->find($taskId))->toBeNull();
});
