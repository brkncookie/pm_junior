import yargs from "yargs";
import * as packageMetadata from "./packages-metadata-ops";
import resolvePackages from "./packages-ops";
import { installPackage } from "./packages-registery-ops";

async function pm_junior(args: yargs.Arguments) {
  const jsonFile = await packageMetadata.getPackageJson(args);

  const packagesInfo = await resolvePackages(jsonFile, args);

  await Promise.all(
    Object.entries(packagesInfo.mainPackagesInfo).map((pkg) =>
      installPackage(pkg[0], pkg[1].url)
    )
  );

  await Promise.all(
    packagesInfo.SecPackagesInfo.map((pkg) =>
      installPackage(pkg.pkgName, pkg.url, `/node_modules/${pkg.parent}`)
    )
  );

  packageMetadata.setPackageJson(jsonFile);
}

yargs
  .command(
    "install",
    "Install Packages",
    (argv) => {
      argv.option("production", {
        type: "boolean",
        description: "Install production packages only",
      });
      argv.option("flatten", {
        type: "boolean",
        description:
          "Install with a flat dependency-graph, Default is a nested dependency-graph",
      });
      argv.option("dev", {
        type: "boolean",
        description: "Install as a development dependancy package",
      });
      argv.alias("D", "dev");
      return argv;
    },
    pm_junior
  )
  .fail((msg, err, yargs) => {
    yargs;
    if (err) console.error(err); // preserve stack
    console.error("Error:", msg);
    process.exit(1);
  })
  .usage("pm_junior <command> [args]")
  .version()
  .help()
  .parse();
