#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import { program } from "commander";
import path from "path";
import prompts from "prompts";
import { EOL } from "os";
import { build } from "./build.js";
import { getIronConfig } from "./project.js";
import { downloadFoundry, getFoundryLatestVersion, listFoundryVersions, startFoundry } from "./foundry.js";

const IRON_VERSION = "0.0.1";

program
    .version(IRON_VERSION)
    .description(
        "A powered CLI to improve developer experience for Foundry modules and systems."
    );

program.command("init")
    .description("Initialize the project")
    .action(async () => {
        console.log(chalk.green("Initializing..."));
        const ironConfig = await prompts([
            {
                type: "select",
                name: "type",
                message: "What type of project is this?",
                choices: [
                    { title: "Module", value: "module" },
                    { title: "System", value: "system" },
                ],
            },
            {
                type: "text",
                name: "canonicalName",
                message: "What is the canonical name of the project?",
                initial: path.basename(process.cwd()),
                validate: (value) => {
                    if (value.includes(" ")) {
                        return "Canonical name cannot contain spaces.";
                    }
                    return true;
                }
            },
            {
                type: "text",
                name: "rootPath",
                message: "What is the root path of the project?",
                initial: process.cwd(),
            },
            {
                type: "text",
                name: "foundryData",
                message: "What is the path to your Foundry VTT data directory?",
                initial: "/home/username/.local/share/FoundryVTT/Data",
            },
        ]);
        fs.writeFileSync("./ironconfig.json", JSON.stringify(ironConfig, null, 4));
        console.log(chalk.green("Initialized!"));
        try {
            const line = `ironconfig.json${EOL}`
            const gitignore = fs.readFileSync('.gitignore', "utf-8").toString()
            if (!gitignore.includes(line)) {
              fs.appendFile('.gitignore', line, (err) => {
                if (err) throw err
              })
            }
        } catch(e) {
        }
    });

program.command("link")
    .description("Link the project to Foundry VTT")
    .action(async () => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        console.log(chalk.green(`Linking ${ironConfig.type}...`));
        const targetPath = `${ironConfig.foundryData}${path.sep}Data${path.sep}${ironConfig.type}s${path.sep}${ironConfig.canonicalName}`;
        fs.symlinkSync(path.resolve(ironConfig.rootPath), targetPath, "dir");
        console.log(chalk.green(`Linked ${ironConfig.type}!`));
    });

program.command("build")
    .description("Build the project")
    .action(async () => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        build(ironConfig)
    });

const foundry = program.command("foundry")

foundry.command("download")
    .description("Download Foundry VTT")
    .action(downloadFoundry);


foundry.command("list")
    .alias("ls")
    .description("List Foundry VTT versions")
    .action(listFoundryVersions);

foundry.command("start [version]")
    .description("Start Foundry VTT")
    .action(async (version: string) => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        const foundryVersion = version || getFoundryLatestVersion();
        startFoundry(ironConfig, foundryVersion);
    });


program.parse(process.argv);


