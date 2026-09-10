<?php

namespace App\Controller\Api;

use App\Entity\Task;
use App\Entity\User;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class TaskController extends BaseController
{
    #[Route('/api/task', name: 'app_api_task', methods: 'GET')]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function index(): Response
    {
        return $this->render('api/task/index.html.twig', [
            'controller_name' => 'Api/TaskController',
        ]);
    }

    #[Route('/api/task/{id}/like', name: 'api_task_like', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
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
}
