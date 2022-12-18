import chalk from "chalk";
import fs from "fs";
import { EOL } from "os";
import path from "path";
import prompts from "prompts";
import yaml from "js-yaml";
import os from "os";
import { createFoundryData } from "./foundry.js";

export enum ProjectType {
    System = "system",
    Module = "module",
}

export type IronConfig = {
    type: ProjectType;
    canonicalName: string;
    rootPath: string;
    foundryData: string;
    distPath?: string;
};

export type FoundryManifest = {
    id: string;
    title: string;
    version: string;
    description: string;
    compatibility?: {
        minimum: string;
        verified: string;
        maximum: string;
    };
    esmodules?: string[];
    languages?: {
        lang: string;
        name: string;
        path: string;
    }[];
};

export const getIronConfig = async () => {
    try {
        return JSON.parse(
            fs.readFileSync("./ironconfig.json", "utf-8")
        ) as IronConfig;
    } catch (e) {
        console.log(
            chalk.red("ironconfig.yml not found. Please run `iron init` first.")
        );
    }
};

export const createIronConfig = async (projectRoot?: string, defaultIconConfig?: Partial<IronConfig>) => {
    const userIronConfig = await prompts([
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
            initial: path.basename(projectRoot || process.cwd()),
            validate: (value) => {
                if (value.includes(" ")) {
                    return "Canonical name cannot contain spaces.";
                }
                return true;
            },
        },
        {
            type: "text",
            name: "rootPath",
            message: "What is the root path of the project?",
            initial: projectRoot || process.cwd(),
        },
        {
            type: "text",
            name: "foundryData",
            message: "What is the path to your Foundry VTT data directory?",
            initial: path.join(os.homedir(), ".iron", "foundrydata"),
        },
    ]);
    if (projectRoot && !fs.existsSync(projectRoot)) {
        fs.mkdirSync(projectRoot, { recursive: true });
    }
    const ironConfig = {...defaultIconConfig, ...userIronConfig}
    fs.writeFileSync(
        path.join(projectRoot || ".", "ironconfig.json"),
        JSON.stringify(ironConfig, null, 4)
    );
    try {
        const line = `ironconfig.json${EOL}`;
        const gitignore = fs.readFileSync(".gitignore", "utf-8").toString();
        if (!gitignore.includes(line)) {
            fs.appendFile(".gitignore", line, (err) => {
                if (err) throw err;
            });
        }
    } catch (e) {}
    return ironConfig as IronConfig;
};

export const createSystemConfig = async (ironConfig: IronConfig) => {
    const defaultSystemConfig = {
        id: ironConfig.canonicalName,
        version: "1.0.0",
        compatibility: {
            minimum: "10",
            verified: "10",
            maximum: "10",
        },
    };

    const userSystemConfig = await prompts([
        {
            type: "text",
            name: "title",
            message: "What is the title of the project?",
            initial: ironConfig.canonicalName,
        },
        {
            type: "text",
            name: "description",
            message: "What is the description of the project?",
            initial: "A Foundry VTT system.",
        },
    ]);
    const systemConfig = { ...defaultSystemConfig, ...userSystemConfig };

    fs.writeFileSync(
        path.join(ironConfig.rootPath, "system.yml"),
        yaml.dump(systemConfig)
    );
    return systemConfig as FoundryManifest;
};

export const createTemplateConfig = async (projectRoot: string) => {
    const templateConfig = {
        Actor: {
            types: ["hero", "npc"],
            templates: {
                base: {
                    hp: {
                        min: 0,
                        max: 0,
                        value: 0,
                    },
                    level: 1,
                },
            },
            hero: {
                templates: ["base"],
            },
            npc: {
                templates: ["base"],
            },
        },
        Item: {
            types: ["weapon", "spell"],
            weapon: {
                damage: 5,
            },
            spell: {
                level: 0,
                damage: 5,
            },
        },
    };
    fs.writeFileSync(
        path.join(projectRoot, "template.yml"),
        yaml.dump(templateConfig)
    );
    return templateConfig;
};

export const createModuleConfig = async (ironConfig: IronConfig) => {
    const defaultModuleConfig = {
        id: ironConfig.canonicalName,
        version: "1.0.0",
        compatibility: {
            minimum: "10",
            verified: "10",
            maximum: "10",
        },
    };

    const userModuleConfig = await prompts([
        {
            type: "text",
            name: "title",
            message: "What is the title of the project?",
            initial: ironConfig.canonicalName,
        },
        {
            type: "text",
            name: "description",
            message: "What is the description of the project?",
            initial: "A Foundry VTT system.",
        },
    ]);
    const moduleConfig = { ...defaultModuleConfig, ...userModuleConfig };

    fs.writeFileSync(
        path.join(ironConfig.rootPath, "module.yml"),
        yaml.dump(moduleConfig)
    );
    return moduleConfig as FoundryManifest;
};

export const getManifest = async (ironConfig: IronConfig) => {
    return yaml.load(
        fs.readFileSync(
            path.join(ironConfig.rootPath, `${ironConfig.type}.yml`),
            "utf8"
        )
    ) as FoundryManifest;
};

export const saveManifest = async (
    ironConfig: IronConfig,
    manifest: FoundryManifest
) => {
    fs.writeFileSync(
        path.join(ironConfig.rootPath, `${ironConfig.type}.yml`),
        yaml.dump(manifest)
    );
};

export const createREADME = async (
    manifest: FoundryManifest,
    projectRoot: string
) => {
    const readmePath = path.join(projectRoot, "README.md");
    if (!fs.existsSync(readmePath)) {
        const readme = `# ${manifest.title}`;
        fs.writeFileSync(readmePath, readme);
    }
};

export const createSymbolicLink = async (ironConfig: IronConfig) => {
    const targetPath = `${ironConfig.foundryData}${path.sep}Data${path.sep}${ironConfig.type}s${path.sep}${ironConfig.canonicalName}`;
    const sourcePath = ironConfig?.distPath ?? ironConfig.rootPath;
    fs.symlinkSync(path.resolve(sourcePath), targetPath, "dir");
}
