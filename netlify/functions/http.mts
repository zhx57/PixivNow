import handler from "../../api/http.js";
import { vercelToNetlifyAdapter } from "./utils/adapter.js";

export default vercelToNetlifyAdapter(handler);
