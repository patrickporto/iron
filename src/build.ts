import chalk from "chalk";
import fs from "fs";
import glob from "glob";
import Handlebars from "handlebars";
import yaml from "js-yaml";
import path from "path";
import { IronConfig } from "./project.js";

const getProjectPackageJson = async () => {
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

    // Handlebars.registerHelper("pkg", (key: string) => {
    //     return JSON.parse(fs.readFileSync("./package2.json", "utf-8"))[key];
    // });

    let compiledProjectConfig;
    try {
        const projectConfigTemplate = Handlebars.compile(
            JSON.stringify(projectConfig, null, 4)
        );
        compiledProjectConfig = projectConfigTemplate({
            pkg: getProjectPackageJson(),
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
            path.join(distDir, "system.json"),
            compiledProjectConfig
        );
    } catch (e) {
        console.error(e);
        throw e;
    }
};

const buildLang = (ironConfig: IronConfig) => {
    for (const langPath of glob.sync("./lang/*.yml")) {
        let langConfig;
        try {
            langConfig = yaml.load(fs.readFileSync(langPath, "utf-8"));
        } catch (e) {
            console.log(chalk.red(`Invalid ${langPath}.`));
            throw e;
        }
        const langExt = path.extname(langPath);
        const langName = path.basename(langPath, langExt);
        const langDistDir = `${ironConfig?.distPath ?? "."}${path.sep}lang`
        const langDistPath = `${langDistDir}${
            path.sep
        }${langName}.json`;
        try {
            if (!fs.existsSync(langDistDir)){
                fs.mkdirSync(langDistDir, { recursive: true });
            }
            fs.writeFileSync(langDistPath, JSON.stringify(langConfig, null, 4));
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};

export const build = async (ironConfig: IronConfig) => {
    console.log(chalk.green("Building..."));
    buildConfig(ironConfig);
    buildLang(ironConfig);
    console.log(chalk.green("Built!"));
};
