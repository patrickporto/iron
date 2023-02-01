import { getIronConfig } from "./project.js";
import { build } from "./build.js";

export const buildIronProject = async () => {
    let ironConfig = await getIronConfig();
    if (!ironConfig) {
        return;
    }
    await build(ironConfig);
}
