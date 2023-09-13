# Development dependencies

* **bun** - for package management, building, and running TypeScript
* **vite** - for building and running the React app

**IMPORTANT**: Bun does not support windows yet, so you need to develop in a mac/linux environment. 

To download bun:
```
curl -fsSL https://bun.sh/install | bash
```

To download Vite:
```
bun install -g vite
```

# Application dependencies

All application dependencies can be fetched by running:
```
bun install
```
From the root directory.

# Running the application

To run the application, run:
```
cd apps/game
bun start
```
