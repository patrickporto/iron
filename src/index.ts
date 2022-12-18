#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import { program } from "commander";
import path from "path";
import { build } from "./build.js";
import {
    createIronConfig,
    createModuleConfig,
    createREADME,
    createSymbolicLink,
    createSystemConfig,
    createTemplateConfig,
    getIronConfig,
    ProjectType,
} from "./project.js";
import {
    createFoundryData,
    downloadFoundry,
    getFoundryLatestVersion,
    listFoundryVersions,
    startFoundry,
} from "./foundry.js";
import { createLanguage, updateLanguage } from "./languages.js";
import {
    createPkg,
    createTSConfig,
    createTSMainScript,
    installDependencies,
    tsc,
} from "./tsproject.js";

const IRON_VERSION = "0.0.1";

program
    .version(IRON_VERSION)
    .description(
        "A powered CLI to improve developer experience for Foundry modules and systems."
    );

program
    .command("init")
    .description("Initialize the project")
    .action(async () => {
        console.log(chalk.green("Initializing..."));
        await createIronConfig();
        console.log(chalk.green("Initialized!"));
    });

program
    .command("link")
    .description("Link the project to Foundry VTT")
    .action(async () => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        console.log(chalk.green(`Linking ${ironConfig.type}...`));
        createSymbolicLink(ironConfig);
        console.log(chalk.green(`Linked ${ironConfig.type}!`));
    });

program
    .command("build")
    .description("Build the project")
    .action(async () => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        await build(ironConfig);
    });

program
    .command("new [directory]")
    .description("Create a new project")
    .action(async (directory) => {
        const projectRoot = path.resolve(directory || ".");
        const ironConfig = await createIronConfig(projectRoot, {
            distPath: path.resolve(path.join(directory, "dist")),
        });
        createFoundryData(ironConfig);
        let manifest;
        if (ironConfig.type === ProjectType.System) {
            manifest = await createSystemConfig(ironConfig);
            await createTemplateConfig(projectRoot);
        } else {
            manifest = await createModuleConfig(ironConfig);
        }
        await createLanguage(ironConfig, "en", "English");
        await createPkg(manifest, projectRoot);
        await createTSMainScript(ironConfig);
        createTSConfig(ironConfig);
        createREADME(manifest, projectRoot);
        await installDependencies(projectRoot);
        await tsc(projectRoot);
        await build(ironConfig);
        createSymbolicLink(ironConfig);
    });

const foundry = program.command("foundry");

foundry
    .command("download")
    .description("Download Foundry VTT")
    .action(downloadFoundry);

foundry
    .command("list")
    .alias("ls")
    .description("List Foundry VTT versions")
    .action(listFoundryVersions);

foundry
    .command("start [version]")
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
languages
    .command("add <lang> <name> [base]")
    .description("Add a language")
    .action(async (lang: string, name: string, base: string) => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        await createLanguage(ironConfig, lang, name, base || "en");
    });
languages
    .command("update <lang> [base]")
    .description("Update a language")
    .option("-i, --interactive", "Interactive mode")
    .action(async (lang: string, base: string, options: any) => {
        let ironConfig = await getIronConfig();
        if (!ironConfig) {
            return;
        }
        await updateLanguage(
            ironConfig,
            lang,
            base || "en",
            options.interactive
        );
    });

program.parse(process.argv);
