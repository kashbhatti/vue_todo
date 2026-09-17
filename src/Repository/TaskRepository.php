<?php

namespace App\Repository;

use App\Entity\Task;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    //    /**
    //     * @return Task[] Returns an array of Task objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('t.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Task
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    /**
     * @return array<int, array{id: int, name: string, is_complete: bool, user_id: int, likes: int, user_liked: bool}>
     */
    public function findAllWithLikes(int $userId): array
    {
        $rows = $this->createQueryBuilder('t')
            ->select('t.id, t.name, t.isComplete AS is_complete, IDENTITY(t.user) AS user_id')
            ->addSelect('COUNT(l) AS likes')
            ->addSelect('SUM(CASE WHEN l.id = :userId THEN 1 ELSE 0 END) AS user_liked')
            ->leftJoin('t.likes', 'l')
            ->groupBy('t.id')
            ->orderBy('t.id', 'ASC')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getArrayResult();

        return array_map(fn(array $row) => [
            ...$row,
            'user_id'    => (int)  $row['user_id'],
            'likes'      => (int)  $row['likes'],
            'user_liked' => (bool) $row['user_liked'],
        ], $rows);
    }

    public function countLikes(Task $task): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(task_like)')
            ->join('t.likes', 'task_like')
            ->where('t = :task')
            ->setParameter('task', $task)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
