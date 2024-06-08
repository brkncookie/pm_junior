import yargs from "yargs";

function pm_junior(args: yargs.Arguments) {
  console.log(args);
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
