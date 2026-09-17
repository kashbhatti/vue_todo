<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

class RegistrationFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', null, [
                'label' => 'Name',
                'attr' => [
                    'type' => 'text',
                    'placeholder' => 'Full name',
                    'autocomplete' => 'name'
                ],
                'constraints' => [
                    new NotBlank(message: 'Please enter a name'),
                    new Length(min: 3, max: 255, minMessage: 'Your name should be at least {{ limit }} characters', maxMessage: 'Your name should be at most {{ limit }} characters'),
                ],
            ])
            ->add('email', null, [
                'label' => 'Email',
                'attr' => [
                    'type' => 'email',
                    'placeholder' => 'you@example.com',
                    'autocomplete' => 'email'
                ],
                'constraints' => [
                    new Email(message: 'Please enter a valid email address'),
                    new NotBlank(message: 'Please enter an email'),
                    new Length(min: 3, max: 255, minMessage: 'Your email should be at least {{ limit }} characters', maxMessage: 'Your email should be at most {{ limit }} characters'),
                ],
            ])
            ->add('plainPassword', RepeatedType::class, [
                'type' => PasswordType::class,
                'mapped' => false,
                'invalid_message' => 'The password fields must match.',
                'first_options' => [
                    'label' => 'Password',
                    'attr' => ['autocomplete' => 'new-password', 'type' => 'password', 'placeholder' => 'Password'],
                ],
                'second_options' => [
                    'label' => 'Confirm password',
                    'attr' => ['autocomplete' => 'new-password', 'type' => 'password', 'placeholder' => 'Confirm Password'],
                ],
                'constraints' => [
                    new NotBlank(message: 'Please enter a password'),
                    new Length(min: 6, max: 255, minMessage: 'Your password should be at least {{ limit }} characters', maxMessage: 'Your password should be at most {{ limit }} characters'),
                ],
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}
