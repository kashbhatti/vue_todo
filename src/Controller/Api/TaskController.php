<?php

namespace App\Controller\Api;

use App\Entity\Task;
use App\Entity\User;
use App\Interface\CrudInterface;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsCsrfTokenValid;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class TaskController extends BaseController implements CrudInterface
{
    #[Route('/api/task/all', name: 'api_task_all', methods: 'GET')]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function all(TaskRepository $taskRepository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->success([
            'tasks' => $taskRepository->findAllWithLikes($user->getId()),
        ], 'Tasks retrieved successfully.');
    }

    #[Route('/api/task', name: 'api_task_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function index(): Response
    {
        return $this->render('api/task/index.html.twig');
    }

    #[Route('/api/task/{id}/edit', name: 'api_task_edit', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[IsCsrfTokenValid('ajax', tokenKey: 'X-CSRF-TOKEN', tokenSource: IsCsrfTokenValid::SOURCE_HEADER)]
    public function edit(Task $task, Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($task->getUser() !== $user) {
            return $this->error('Access denied.', [], Response::HTTP_FORBIDDEN);
        }

        $payload = $request->getPayload();
        $task->setName($payload->getString('name'));
        $task->setIsComplete($payload->getBoolean('is_complete'));
        $em->flush();

        return $this->success([
            'id' => $task->getId(),
            'name' => $task->getName(),
            'is_complete' => $task->isComplete(),
        ], 'Task updated successfully.');
    }

    #[Route('/api/task/{id}/delete', name: 'api_task_delete', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[IsCsrfTokenValid('ajax', tokenKey: 'X-CSRF-TOKEN', tokenSource: IsCsrfTokenValid::SOURCE_HEADER)]
    public function delete(Task $task, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($task->getUser() !== $user) {
            return $this->error('Access denied.', [], Response::HTTP_FORBIDDEN);
        }

        $em->remove($task);
        $em->flush();

        return $this->success([], 'Task deleted successfully.');
    }

    #[Route('/api/task/{id}/like', name: 'api_task_like', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[IsCsrfTokenValid('ajax', tokenKey: 'X-CSRF-TOKEN', tokenSource: IsCsrfTokenValid::SOURCE_HEADER)]
    public function like(Task $task, EntityManagerInterface $em, TaskRepository $repo): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($task->getLikes()->contains($user)) {
            $task->removeLike($user);
            $liked = false;
        } else {
            $task->addLike($user);
            $liked = true;
        }

        $em->flush();

        return $this->success([
            'liked' => $liked,
            'count' => $repo->countLikes($task),
        ], 'Task like status updated successfully.');
    }

    #[Route('/api/task/new', name: 'api_task_new', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[IsCsrfTokenValid('ajax', tokenKey: 'X-CSRF-TOKEN', tokenSource: IsCsrfTokenValid::SOURCE_HEADER)]
    public function new(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $task = new Task();
        $task->setName($request->getPayload()->getString('name'));
        $task->setUser($user);

        $em->persist($task);
        $em->flush();

        return $this->success([
            'id' => $task->getId(),
            'name' => $task->getName(),
            'is_complete' => false,
            'user_id' => $user->getId(),
            'likes' => 0,
            'user_liked' => false,
        ], 'Task created successfully.');
    }
}
