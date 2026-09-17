# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack

- **Symfony 8.1** / **PHP 8.4** / **Doctrine ORM 3.7** / **PostgreSQL**
- **Frontend**: AssetMapper + Stimulus.js + Hotwired Turbo for server-rendered Twig pages, plus **Vue 3.5** components for the `/api/task` SPA view. No build step — AssetMapper serves files directly from `assets/`. Import maps declared in `importmap.php`.
- **CSS**: Tailwind CSS via `symfonycasts/tailwind-bundle`, SCSS via `symfonycasts/sass-bundle`. Dark mode supported via Tailwind.
- **Tests**: Pest 5.2 (`pestphp/pest`) on top of PHPUnit, Zenstruck Foundry 2.13 for factories, DAMA Doctrine Test Bundle 8.6 for transaction isolation.

## Terminal command policy

Never run `symfony console`, `bin/console`, or cache-related commands (e.g. `cache:clear`, `cache:warmup`, `asset-map:compile`) as tool calls. Instead, tell the user which command(s) to run and wait for them to report the result.

## Commands

```bash
symfony serve -d                                     # start dev server
symfony console <command>                            # preferred over bin/console
php bin/phpunit                                      # run all tests
php bin/phpunit --filter TestName                    # run a single test
symfony console make:migration                       # generate migration after entity change
symfony console doctrine:migrations:migrate          # apply migrations
symfony console doctrine:fixtures:load               # load fixtures (dev/test only)
symfony console debug:router                         # list all routes
symfony console debug:container                      # inspect services
```

## Domain model

All ORM mappings use PHP 8 attributes; no YAML/XML. Both entities include `createdAt` / `updatedAt` (DateTimeImmutable) set via `#[PrePersist]` / `#[PreUpdate]` lifecycle hooks.

### User (`src/Entity/User.php`)
- `id` (BigInt, unsigned, auto), `email` (unique), `password`, `name`, `roles` (JSON array), `status` (`UserStatusEnum`: active/reported/deleted, lives in `src/Enum/`)
- Implements `UserInterface`, `PasswordAuthenticatedUserInterface`
- OneToMany → Task (orphanRemoval=true)
- ManyToMany → Task (owning side for likes, join table: `user_task_like`, composite PK on `user_id` + `task_id`)

### Task (`src/Entity/Task.php`)
- `id` (BigInt, unsigned, auto), `name`, `isComplete` (bool, default false)
- ManyToOne → User (inverse)
- ManyToMany → User (inverse side for likes, `mappedBy: 'likes'`)
- Toggle a like via `Task::addLike(User)` / `Task::removeLike(User)` — these delegate to the owning side.
- Count likes efficiently via `TaskRepository::countLikes(Task)`.

## Controllers

### `SecurityController`
- `GET /login` → renders login form with `AuthenticationUtils`
- `GET /logout` → intercepted by the security firewall

### `RegistrationController`
- `GET|POST /register` → registers user, hashes password, auto-authenticates via `FormLoginAuthenticator`

### `TaskController` (Twig CRUD, `src/Controller/TaskController.php`)
- All routes require `#[IsGranted('IS_AUTHENTICATED_FULLY')]`
- `GET /task` → list tasks for current user
- `GET|POST /task/new` → create task
- `GET /task/{id}` → show task (ownership check)
- `GET|POST /task/{id}/edit` → edit task (ownership check)
- `POST /task/{id}` → delete task with CSRF token (ownership check)

### `Api\BaseController` (`src/Controller/Api/BaseController.php`)
Abstract base with helpers:
- `success(data, message, status)` → `{success: true, data, message}`
- `error(error, errorMessages, code)` → `{success: false, message, data?}`

### `Api\TaskController` (`src/Controller/Api/TaskController.php`)
- Implements `CrudInterface` (`src/Interface/CrudInterface.php`)
- All routes require `#[IsGranted('IS_AUTHENTICATED_FULLY')]`
- CSRF validated via `#[IsCsrfTokenValid('ajax', tokenKey: 'X-CSRF-TOKEN', tokenSource: SOURCE_HEADER)]`
- `GET /api/task/all` → tasks for current user with like count & user's like status
- `GET /api/task` → renders `api/task/index.html.twig` (Vue app host)
- `POST /api/task/new` → create task from request payload
- `POST /api/task/{id}/edit` → update `name` / `is_complete`, ownership check
- `POST /api/task/{id}/delete` → delete task, ownership check
- `POST /api/task/{id}/like` → toggle like, returns `{"liked": bool, "count": int}`

## Forms

### `RegistrationFormType`
- `name` (TextType, NotBlank, Length 3–255)
- `email` (EmailType, NotBlank, Email, Length 3–255)
- `plainPassword` (RepeatedType/PasswordType, unmapped, NotBlank, Length 6–255, passwords-must-match message)

### `TaskType`
- `name` (TextType, NotBlank, Length 3–255)
- `isComplete` (CheckboxType, required=false) — only added when `$data->getId() !== null` (edit only, not create)

## Repositories

### `TaskRepository`
- `findAllWithLikes(int $userId): array` — GROUP BY with SUM(CASE) to return tasks with `likes` count and `user_liked` boolean
- `countLikes(Task $task): int` — counts users who liked a task

### `UserRepository`
- Implements `PasswordUpgraderInterface` → `upgradePassword()`

## Frontend

### Vue 3 components (`assets/vue/`)
The SPA view lives at `/api/task` (served by `Api\TaskController::index()`). The CSRF token is in a `<meta>` tag in `base.html.twig` (`csrf('ajax')`); Vue reads it on mount.

| File | Purpose |
|------|---------|
| `controllers/TaskList.js` | Root component — fetches tasks, owns list state, handles new-task form, search filter (lodash debounce 500ms) |
| `components/Task.js` | Table row — inline edit, like toggle, delete with confirm; emits `deleteTask`, `startEditing`, `notify`, `loading` |
| `components/Notification.js` | Toast notification — auto-dismiss after 4500ms, `success`/`error` status prop |
| `composables/useTaskApi.js` | `getTasks()` composable — `GET /api/task/all`, returns `{data, error}` |
| `types/task.type.ts` | TypeScript `Task` interface (`id`, `name`, `is_complete`, `user_id`, `likes`, `user_liked`) |

Vue is loaded via importmap (`vue 3.5.42`). Components are plain `.js` files using `defineComponent` / Options API. No `.vue` SFC files.

### Stimulus controllers (`assets/controllers/`)
- `hello_controller.js` — example scaffold
- `csrf_protection_controller.js` — auto-generated CSRF helper (used on login form)

### Stylesheets
- `assets/styles/app.scss` — global styles, `.auth-panel`, dark mode
- `assets/styles/admin.scss` — admin-specific styles
- `assets/styles/app.css` — additional global CSS

### Twig UX Components (`src/Twig/Components/`)
All use `#[AsTwigComponent]`: `Button`, `SecondaryButton`, `AdminButton`, `Heading`, `SubHeading`, `Text`, `Input`, `TextInput`, `Checkbox`, `ErrorText`. Used as `<twig:ComponentName />` in templates.

## Testing

Tests use Pest 5.2 syntax (`it()`, `beforeEach()`, `expect()`). All functional tests extend `WebTestCase` via `tests/TestCase.php`. DAMA Doctrine Test Bundle wraps each test in a rolled-back transaction.

### `tests/Feature/TaskTest.php`
- `user can like and unlike a task` — POST `/api/task/{id}/like` twice, asserts like count changes
- `user can create and delete a task` — POST new → edit → delete, asserts state changes at each step
- Relies on seeded data (fixture user ID 1 must exist); run fixtures before tests.

### Running tests against fixtures
```bash
symfony console doctrine:fixtures:load --env=test   # seed test DB
php bin/phpunit                                      # run suite
```

## Fixtures & Factories (`src/DataFixtures/`, `src/Factory/`)

| Class | What it does |
|-------|-------------|
| `UserFixtures` | Creates 2 users via `UserFactory::createMany(2)` |
| `TaskFixtures` | For each user, creates 15 tasks via `TaskFactory::createMany(15, ['user' => $user]); depends on UserFixtures` |
| `UserFactory` | Foundry factory — random email, name, hashed password, random `UserStatusEnum` |
| `TaskFactory` | Foundry factory — random `isComplete`, `faker()->streetName()` for name, linked to `UserFactory::new()` |

## Security configuration

- Password hasher: `auto` (bcrypt/argon2, reduced cost in test env)
- User provider: entity (User class, identifier: `email`)
- Firewall: `main` — form_login (login path: `app_login`, default target: `app_task_index`), CSRF enabled, logout
- AJAX endpoints use `X-CSRF-TOKEN` header (token id: `ajax`), not the form field

## Known incomplete areas

- No Doctrine migrations generated yet — run `make:migration` after schema is stable.
- `AppFixtures` and `AppStory` are empty placeholders.
- Vue components are `.js` files (Options API); no TypeScript compilation — `task.type.ts` is informational only.
