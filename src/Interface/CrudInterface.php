<?php
/**
 * Interface CrudInterface
 * Author: Kashif Bhatti
 * 14/09/2026
 */

namespace App\Interface;

use App\Entity\Task;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

interface CrudInterface
{
    public function all(TaskRepository $taskRepository): JsonResponse;
    public function new(Request $request, EntityManagerInterface $em): JsonResponse;
    public function edit(Task $task, Request $request, EntityManagerInterface $em): JsonResponse;
    public function delete(Task $task, EntityManagerInterface $em): JsonResponse;
}
