import DataUriParser from "datauri/parser.js";
import path from "path";

const parser = new DataUriParser();

const getDataUri = (file) => {
    const fileName = path.extname(file.originalname).toString();
    return parser.format(fileName, file.buffer).content;
};

export default getDataUri;