<?php

namespace App\Twig\Components;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

#[AsTwigComponent]
final class Text
{
    public ?string $class = null;
    public ?string $span = null;
}
