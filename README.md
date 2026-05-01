# Kona LMS

## TODO

- [ ] Consistent naming of component files
- [ ] Rate limit openai requests
- [ ] Have separate storage account for learn.digital-lync.com
- [ ] Don't hardcode and commit cron job secrets

## Git Branches

- `production` - production branch (stable version)
- `staging` - staging branch
- `main` - main branch - latest version of the code
- `development` - development branch
- `feature/<feature-name>` - feature branches

## npm scripts

### Build and dev scripts

- `dev` – start dev server
- `build` – bundle application for production
- `export` – exports static website to `out` folder
- `analyze` – analyzes application bundle with [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `jest` – runs jest tests
- `jest:watch` – starts jest watch
- `test` – runs `jest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier

### Todo

- Add 404 page (no course found, through 404?)

### API

#### Courses

| Endpoint           | Method | Description      |
| ------------------ | ------ | ---------------- |
| /courses           | POST   | Create course.   |
| /courses           | GET    | Get all courses. |
| /courses/:courseId | PUT    | Update course.   |
| /courses/:courseId | GET    | Get course.      |
| /courses/:courseId | DELETE | Archive course.  |

#### Modules

| Endpoint           | Method | Description      |
| ------------------ | ------ | ---------------- |
| /modules           | POST   | Create module.   |
| /modules           | GET    | Get all modules. |
| /modules/:moduleId | PUT    | Update module.   |
| /modules/:moduleId | GET    | Get module.      |
| /modules/:moduleId | DELETE | Delete module.   |

### Topics

| Endpoint         | Method | Description     |
| ---------------- | ------ | --------------- |
| /topics          | POST   | Create topic.   |
| /topics          | GET    | Get all topics. |
| /topics/:topicId | PUT    | Update topic.   |
| /topics/:topicId | GET    | Get topic.      |
| /topics/:topicId | DELETE | Delete topic.   |
