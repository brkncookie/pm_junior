# pm_junior

**package-manager junior** aka _pm_junior_ is a basic NodeJS package manager written in TypeScript.

## Features

- **Package Installation**: Easily install NodeJS packages.
- **Seperation of Environements**: seperation between development environement and a production one.
- **Dependency-graph Resolution**:
  - Nested dependency-graph (default).
  - Flatten dependency-graph (use `--flatten` option).
- **Lockfile**: Uses lockfiles with the same syntax as `yarn.lock`.

## Installation

- Install from the npm registery:

```bash
npm install -g pm_junior
```

- Or clone this repo and use the link script:

```bash
git clone https://github.com/brkncookie/pm_junior
cd pm_junior && npm install && npm run link
```

## Usage

### Install Packages

- Parse the `package.json` and install the packages described in it:

  ```bash
  pm_junior install
  ```

- Install packages with a flatten dependency graph, default is nested:
  ```bash
  pm_junior install --flatten
  ```
- Install a specific package and add it to the `dependencies` property in package.json:
  ```bash
  pm_junior install <pkg_name>
  ```
- Install a specific package and add it to the `devDependencies` property in package.json:
  ```bash
  pm_junior install --dev <pkg_name>
  ```
- Install production level packages and ignore `devDependencies`:
  ```bash
  pm_junior install --production
  ```
- View the help page:
  ```bash
  pm_junior install --help
  ```
