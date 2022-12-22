import type cors from "cors";

export default <cors.CorsOptions>{
    origin: ["http://localhost:4000", "http://127.0.0.1:4000", "https://bookswap.onrender.com"],
    credentials: true,
};
