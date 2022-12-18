import path from "path";
import { getManifest, IronConfig, saveManifest } from "./project.js";
import fs from "fs";
import { DEFAULT_LANG_FILE } from "./structures.js";
import chalk from "chalk";
import { EOL } from "os";
import _ from "lodash";
import prompts from "prompts";
import yaml from "js-yaml";

export const createLanguage = async (
    ironConfig: IronConfig,
    languageCode: string,
    languageName: string,
    baseLanguage?: string
) => {
    const langPath = path.join(
        ironConfig.rootPath,
        "lang",
        `${languageCode}.yml`
    );
    if (!fs.existsSync(langPath)) {
        fs.mkdirSync(path.join(ironConfig.rootPath, "lang"), {
            recursive: true,
        });
    }
    const baseLangPath = path.join(
        ironConfig.rootPath,
        "lang",
        `${baseLanguage}.yml`
    );
    if (baseLanguage && fs.existsSync(baseLangPath)) {
        fs.copyFileSync(baseLangPath, langPath);
    } else {
        fs.writeFileSync(langPath, DEFAULT_LANG_FILE);
    }
    const manifest = await getManifest(ironConfig);
    if (!manifest.languages) {
        manifest.languages = [];
    }
    manifest.languages.push({
        lang: languageCode,
        name: languageName,
        path: `lang/${languageCode}.json`,
    });
    await saveManifest(ironConfig, manifest);
};

export const updateLanguage = async (
    ironConfig: IronConfig,
    languageCode: string,
    baseLanguage: string,
    interactive: boolean
) => {
    const langPath = path.join(
        ironConfig.rootPath,
        "lang",
        `${languageCode}.yml`
    );
    const baseLangPath = path.join(
        ironConfig.rootPath,
        "lang",
        `${baseLanguage}.yml`
    );
    if (!fs.existsSync(langPath) || !fs.existsSync(baseLangPath)) {
        console.log(
            chalk.red(
                `Language ${languageCode} or base language ${baseLanguage} does not exist.`
            )
        );
        return;
    }
    const lang = fs.readFileSync(langPath, "utf8");
    const baseLang = fs.readFileSync(baseLangPath, "utf8");
    const baseLangLines = yaml.load(baseLang) as any;
    const langLines = yaml.load(lang) as any;
    const diff = _.difference(Object.keys(baseLangLines), Object.keys(langLines));
    if (interactive) {
        for (const key of diff) {
            const label = baseLangLines[key];
            const response = await prompts({
                type: "text",
                name: "translation",
                message: key,
                initial: label,
            });
            if (response.translation) {
                langLines[key] = response.translation;
            }
        }
    } else {
        for (const key of diff) {
            langLines[key] = baseLangLines[key];
        }
    }
    fs.writeFileSync(langPath, yaml.dump(langLines));
};
