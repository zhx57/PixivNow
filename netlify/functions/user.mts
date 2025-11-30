import handler from "../../api/user.js";
import { vercelToNetlifyAdapter } from "./utils/adapter.js";

export default vercelToNetlifyAdapter(handler);
