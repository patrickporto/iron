#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import { program } from "commander";
import path from "path";
import { build } from "./build.js";
import { createIronConfig, createLanguage, createMainScript, createModuleConfig, createPkg, createSystemConfig, createTemplateConfig, getIronConfig, ProjectType } from "./project.js";
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
        await createIronConfig();
        console.log(chalk.green("Initialized!"));
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
        const sourcePath = ironConfig?.distPath ?? ironConfig.rootPath;
        fs.symlinkSync(path.resolve(sourcePath), targetPath, "dir");
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

program.command("new [directory]")
    .description("Create a new project")
    .action(async (directory) => {
        const projectRoot = path.resolve(directory || ".");
        const ironConfig = await createIronConfig(projectRoot);
        let manifest
        if (ironConfig.type === ProjectType.System) {
            manifest = await createSystemConfig(ironConfig);
            await createTemplateConfig(projectRoot);
        } else {
            manifest = await createModuleConfig(ironConfig);
        }
        await createPkg(manifest, projectRoot);
        await createMainScript(ironConfig);
        await createLanguage(ironConfig, "en", "English");
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

const languages = program.command("languages").alias("lang");
languages.command("add <lang> <name> [base]")
    .description("Add a language")
    .action(async (lang: string, name: string, base: string) => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        await createLanguage(ironConfig, lang, name, base || "en");
    });


program.parse(process.argv);


