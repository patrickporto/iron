#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import { program } from "commander";
import path from "path";

const IRON_VERSION = "0.0.1";

program
    .version(IRON_VERSION)
    .description(
        "A powered CLI to improve developer experience for Foundry modules and systems."
    );

program.command("link")
    .description("Link a module or system to Foundry VTT")
    .action(() => {
        let ironConfig
        try {
            ironConfig = JSON.parse(fs.readFileSync("./ironconfig.json", "utf-8"))
        } catch(e) {
            console.log(chalk.red("Could not find ironconfig.json in the current directory."))
            return
        }
        console.log(chalk.green(`Linking ${ironConfig.type}...`));
        const targetPath = `${ironConfig.foundryData}${path.sep}Data${path.sep}${ironConfig.type}s${path.sep}${ironConfig.canonicalName}`;
        fs.symlinkSync(path.resolve(ironConfig.rootPath), targetPath, "dir");
        console.log(chalk.green(`Linked ${ironConfig.type}!`));
    });


program.parse(process.argv);


