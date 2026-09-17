<?php

namespace App\Form;

use App\Entity\Task;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

class TaskType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('name', null, [
            'label' => 'Task Name',
            'attr' => [
                'type' => 'text',
                'placeholder' => 'Enter task name',
            ],
            'constraints' => [
                new NotBlank(message: 'Please enter a task name'),
                new Length(min: 3, max: 255, minMessage: 'Task name should be at least {{ limit }} characters', maxMessage: 'Task name should be at most {{ limit }} characters'),
            ],
        ]);

        // Only show isComplete on edit
        $data = $builder->getData();
        if ($data && $data->getId() !== null) {
            $builder->add('isComplete', CheckboxType::class, [
                'label' => 'Completed',
                'required' => false,
            ]);
        }
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Task::class,
        ]);
    }
}
