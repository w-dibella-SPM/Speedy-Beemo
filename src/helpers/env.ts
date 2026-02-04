import dotenv from "dotenv";
import path from "path";
import {BASE_DIR} from "../const";

dotenv.config({
    path: path.join(BASE_DIR, ".env"),
});