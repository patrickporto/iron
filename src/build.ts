import chalk from "chalk";
import fs from "fs";
import Handlebars from "handlebars";
import yaml from "js-yaml";
import path from "path";
import { IronConfig } from "./project.js";

const getProjectPackageJson = async () => {
    try {
        return JSON.parse(fs.readFileSync("./package.json", "utf-8"));
    } catch(e) {
        return {}
    }
}


const buildConfig = (ironConfig: IronConfig) => {
    const projectConfigName = `${ironConfig.type}.yml`
    let projectConfig;
    try {
        projectConfig = yaml.load(fs.readFileSync(`./${projectConfigName}`, "utf-8"));
    } catch (e) {
        console.log(chalk.red(`${projectConfigName} not found.`));
        throw e;
    }

    // Handlebars.registerHelper("pkg", (key: string) => {
    //     return JSON.parse(fs.readFileSync("./package2.json", "utf-8"))[key];
    // });

    let compiledProjectConfig
    try {
        const projectConfigTemplate = Handlebars.compile(JSON.stringify(projectConfig, null, 4))
        compiledProjectConfig = projectConfigTemplate({
            pkg: getProjectPackageJson(),
            ...ironConfig,
        })
    } catch (e) {
        console.log(chalk.red(`Invalid ${projectConfigName}.`));
        console.error(e)
        throw e;
    }

    try {
        fs.writeFileSync(`${ironConfig?.distPath ?? '.'}${path.sep}system.json`, compiledProjectConfig);
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const build = async (ironConfig: IronConfig) => {
    console.log(chalk.green("Building..."));
    try {
        buildConfig(ironConfig);
    } catch (e) {
        return;
    }
    console.log(chalk.green("Built!"));
}
