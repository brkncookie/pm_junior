import yargs from "yargs";
import {
  getLock,
  getLockEntry,
  setLock,
  setLockEntry,
} from "./packages-metadata-ops";
import { PackageMetadata, getPackageMetadata } from "./packages-registery-ops";
import * as semver from "semver";

export interface Dependencies {
  [dep: string]: string;
}

type DependencyGraph = Array<{
  pkgName: string;
  version: string;
  dependencies: Dependencies;
}>;

export interface PackageJson {
  dependencies: Dependencies;
  devDependencies: Dependencies;
}

interface MainPackageInfo {
  [pkgName: string]: {
    url: string;
    version: string;
  };
}

type SecPackageInfo = Array<{
  pkgName: string;
  url: string;
  version: string;
  parent: string;
}>;

const mainPackagesInfo: MainPackageInfo = Object.create(null);
const SecPackagesInfo: SecPackageInfo = [];

let flat: boolean = false;

function isCircularDep(
  dep: string,
  semVer: string,
  dependencyGraph: DependencyGraph
) {
  const index = dependencyGraph.findIndex(
    (element) =>
      element.pkgName === dep && semver.satisfies(element.version, semVer)
  );

  if (index === -1) return false;
  return true;
}
async function resolvePackages(
  pkgName: string,
  semanticVersion: string,
  dependencyGraph: DependencyGraph = []
) {
  console.clear();
  console.log("### Resolving : " + pkgName + " ###");

  let pkgsMetadata: PackageMetadata;
  if (!(pkgsMetadata = getLockEntry(pkgName, semanticVersion)!))
    pkgsMetadata = await getPackageMetadata(pkgName);
  const versions = Object.keys(pkgsMetadata);

  let version;

  if (!semanticVersion) {
    version = versions[versions.length - 1];
  } else {
    if (!(version = semver.maxSatisfying(versions, semanticVersion)))
      throw new Error("Couldn't find a compatible version.");
  }
  const compatiblePkgVersion = pkgsMetadata[version];

  let firstCondition: boolean;
  let secondCondition: boolean;

  if (!flat) {
    firstCondition = !dependencyGraph.length;
    secondCondition = !!dependencyGraph.length;
  } else {
    firstCondition = !mainPackagesInfo[pkgName];
    if (!firstCondition) {
      secondCondition = !semver.satisfies(
        mainPackagesInfo[pkgName].version,
        semanticVersion
      );
    } else secondCondition = false;
  }

  if (firstCondition) {
    mainPackagesInfo[pkgName] = {
      url: compatiblePkgVersion.dist.tarball,
      version: version,
    };
  } else if (secondCondition) {
    SecPackagesInfo.push({
      pkgName: pkgName,
      url: compatiblePkgVersion.dist.tarball,
      version: version,
      parent: dependencyGraph
        .map(({ pkgName }) => pkgName)
        .slice(0)
        .join("/node_modules/"),
    });
  }

  setLockEntry(`${pkgName}@${semanticVersion || version}`, {
    version: version,
    url: compatiblePkgVersion.dist.tarball,
    dependencies: compatiblePkgVersion.dependencies || {},
    shasum: compatiblePkgVersion.dist.shasum,
  });

  if (compatiblePkgVersion.dependencies) {
    dependencyGraph.push({
      pkgName,
      version,
      dependencies: compatiblePkgVersion.dependencies,
    });
    await Promise.all(
      Object.entries(compatiblePkgVersion.dependencies)
        .filter(([dep, semVer]) => !isCircularDep(dep, semVer, dependencyGraph))
        .map(([dep, semVer]) =>
          resolvePackages(dep, semVer, dependencyGraph.slice())
        )
    );
    dependencyGraph.pop();
  }

  if (!semanticVersion) return { pkgName, version };
  return { pkgName, version: semanticVersion };
}

export default async function (pkgJson: PackageJson, args: yargs.Arguments) {
  getLock();
  if (args.flatten) flat = true;
  pkgJson.dependencies &&
    (
      await Promise.all(
        Object.entries(pkgJson.dependencies).map((pkg) =>
          resolvePackages(...pkg)
        )
      )
    ).forEach((pkg) => (pkgJson.dependencies[pkg.pkgName] = pkg.version));

  if (!args.production) {
    pkgJson.devDependencies &&
      (
        await Promise.all(
          Object.entries(pkgJson.devDependencies).map((pkg) =>
            resolvePackages(...pkg)
          )
        )
      ).forEach((pkg) => (pkgJson.devDependencies[pkg.pkgName] = pkg.version));
  }
  setLock();
  console.clear();
  return { mainPackagesInfo, SecPackagesInfo };
}
