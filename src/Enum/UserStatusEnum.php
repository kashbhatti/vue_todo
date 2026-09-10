<?php

declare(strict_types=1);

namespace App\Enum;

enum UserStatusEnum: string
{
    case ACTIVE = 'active';
    case REPORTED = 'reported';
    case DELETED = 'deleted';
}