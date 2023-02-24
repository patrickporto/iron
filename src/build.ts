import chalk from "chalk";
import fs from "fs";
import glob from "glob";
import Handlebars from "handlebars";
import yaml from "js-yaml";
import path from "path";
import { IronConfig, ProjectType } from "./project.js";

const getProjectPackageJson = () => {
    try {
        return JSON.parse(fs.readFileSync("./package.json", "utf-8"));
    } catch (e) {
        return {};
    }
};

const buildConfig = (ironConfig: IronConfig) => {
    const projectConfigName = `${ironConfig.type}.yml`;
    let projectConfig;
    try {
        projectConfig = yaml.load(
            fs.readFileSync(path.join(ironConfig.rootPath, projectConfigName), "utf-8")
        );
    } catch (e) {
        console.log(chalk.red(`${projectConfigName} not found.`));
        throw e;
    }

    let compiledProjectConfig;
    try {
        const projectConfigTemplate = Handlebars.compile(
            JSON.stringify(projectConfig, null, 4)
        );
        compiledProjectConfig = projectConfigTemplate({
            pkg: getProjectPackageJson(),
            env: process.env,
            ...ironConfig,
        });
    } catch (e) {
        console.log(chalk.red(`Invalid ${projectConfigName}.`));
        console.error(e);
        throw e;
    }
    const distDir = `${ironConfig?.distPath ?? "."}${path.sep}`
    if (!fs.existsSync(distDir)){
        fs.mkdirSync(distDir, { recursive: true });
    }
    try {
        fs.writeFileSync(
            path.join(distDir, `${ironConfig.type}.json`),
            compiledProjectConfig
        );
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const buildLang = (ironConfig: IronConfig) => {
    for (const langPath of glob.sync(path.join(ironConfig.rootPath, "lang", "*.yml"))) {
        let langConfig;
        try {
            langConfig = yaml.load(fs.readFileSync(langPath, "utf-8"));
        } catch (e) {
            console.log(chalk.red(`Invalid ${langPath}.`));
            throw e;
        }
        const langExt = path.extname(langPath);
        const langName = path.basename(langPath, langExt);
        const langDistDir = path.join(ironConfig?.distPath ?? ".", "lang");
        const langDistPath = path.join(langDistDir, `${langName}.json`);
        try {
            if (!fs.existsSync(langDistDir)){
                fs.mkdirSync(langDistDir, { recursive: true });
            }
            fs.writeFileSync(path.resolve(langDistPath), JSON.stringify(langConfig, null, 4));
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};

const buildTemplate = (ironConfig: IronConfig) => {
    const templateName = "template.yml";
    let templateConfig;
    try {
        templateConfig = yaml.load(
            fs.readFileSync(path.join(ironConfig.rootPath, templateName), "utf-8")
        );
    } catch (e) {
        console.log(chalk.red(`${templateName} not found.`));
        throw e;
    }

    const templateDistDir = ironConfig?.distPath ?? "."
    const templateDistPath = path.join(templateDistDir, "template.json");
    try {
        if (!fs.existsSync(templateDistDir)){
            fs.mkdirSync(templateDistDir, { recursive: true });
        }
        fs.writeFileSync(templateDistPath, JSON.stringify(templateConfig, null, 4));
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const build = async (ironConfig: IronConfig) => {
    console.log(chalk.green("Building..."));
    createDistFolder(ironConfig);
    buildConfig(ironConfig);
    if (ironConfig.type === ProjectType.System) {
        buildTemplate(ironConfig);
    }
    buildLang(ironConfig);
    console.log(chalk.green("Built!"));
};

export const createDistFolder = (ironConfig: IronConfig) => {
    if (ironConfig?.distPath && !fs.existsSync(ironConfig?.distPath)){
        fs.mkdirSync(ironConfig?.distPath, {
            recursive: true
        });
    }
}
