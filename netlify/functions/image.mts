import handler from "../../api/image.js";
import { vercelToNetlifyAdapter } from "./utils/adapter.js";

export default vercelToNetlifyAdapter(handler);
