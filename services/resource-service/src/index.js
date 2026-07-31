import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();
const PORT = process.env.PORT || 3003;
app.listen(
    PORT,
    () => {
        console.log(
            `Resource Service running on port ${PORT}`
        );
    }
);