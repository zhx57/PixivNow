import handler from "../../api/random.js";
import { vercelToNetlifyAdapter } from "./utils/adapter.js";

export default vercelToNetlifyAdapter(handler);
