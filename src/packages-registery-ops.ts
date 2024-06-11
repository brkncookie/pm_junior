import { request } from "undici";
import { Dependencies } from "./packages-ops";
import * as fs from "fs-extra";
import * as tar from "tar";

export interface PackageMetadata {
  [version: string]: {
    dependencies?: Dependencies;
    dist: { shasum: string; tarball: string };
  };
}

export async function installPackage(
  pkgName: string,
  url: string,
  location = ""
) {
  const pkgPath = `${process.cwd()}${location}/node_modules/${pkgName}`;
  fs.mkdirpSync(pkgPath);

  (await request(url)).body
    .pipe(tar.extract({ cwd: pkgPath, strip: 1 }))
    .on("close", () => {
      if (!location.length) console.log("^^^Installed " + pkgName);
    });
}

export async function getPackageMetadata(
  pkgName: string
): Promise<PackageMetadata> {
  const result = (await (
    await request(`https://registry.npmjs.org/${pkgName}`)
  ).body.json()) as { error: string } | { versions: PackageMetadata };

  if ("error" in result)
    throw new ReferenceError(`No package with name: ${pkgName}`);

  return result.versions;
}
