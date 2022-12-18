import chalk from "chalk";
import fs from "fs";

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
}

export const getIronConfig = async () => {
    try {
        return JSON.parse(fs.readFileSync("./ironconfig.json", "utf-8")) as IronConfig;
    } catch(e) {
        console.log(chalk.red("ironconfig.yml not found. Please run `iron init` first."))
    }
}
