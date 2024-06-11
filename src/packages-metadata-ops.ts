import yargs from "yargs";
import * as fs from "fs-extra";
import findUp from "find-up";
import { Dependencies } from "./packages-ops";
import * as yaml from "js-yaml";

interface LockEntries {
  [pkgName: string]: {
    version: string;
    url: string;
    shasum: string;
    dependencies: Dependencies;
  };
}

const toSet: LockEntries = Object.create(null);
const toGet: LockEntries = Object.create(null);

export function setLock() {
  fs.writeFileSync("./pm_junior-lock.yml", yaml.dump(toSet, { noRefs: true }));
}

export function getLock() {
  fs.pathExistsSync("./pm_junior-lock.yml") &&
    Object.assign(
      toGet,
      yaml.load(fs.readFileSync("./pm_junior-lock.yml", "utf-8"))
    );
}

export function setLockEntry(pkgName: string, lockEntry: LockEntries[string]) {
  toSet[pkgName] = toSet[pkgName] || Object.create(null);
  Object.assign(toSet[pkgName], lockEntry);
}

export function getLockEntry(pkgName: string, semanticVersion: string) {
  const lockEntry = toGet[`${pkgName}@${semanticVersion}`];

  const packageMetadata = lockEntry
    ? {
        [lockEntry.version]: {
          dependencies: lockEntry.dependencies,
          dist: { shasum: lockEntry.shasum, tarball: lockEntry.url },
        },
      }
    : null;

  return packageMetadata;
}

export async function getPackageJson(args: yargs.Arguments) {
  const jsonFile = fs.readJsonSync((await findUp("package.json"))!);

  jsonFile.dependencies = jsonFile.dependencies || {};
  jsonFile.devDependencies = jsonFile.devDependencies || {};

  const packages = args._.slice(1);

  if (packages.length) {
    args.dev && packages.forEach((pkg) => (jsonFile.devDependencies[pkg] = ""));
    !args.dev && packages.forEach((pkg) => (jsonFile.dependencies[pkg] = ""));
  }

  return jsonFile;
}

export async function setPackageJson(jsonFile: any) {
  fs.writeJson((await findUp("package.json"))!, jsonFile, { spaces: 2 });
}
