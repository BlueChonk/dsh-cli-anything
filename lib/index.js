import { defineTool } from "@deepseek-ai/dsh-tools";
import { spawn } from "node:child_process";

//#region src/utils.ts
const TIMEOUT_MS = 3e4;
const UPDATE_TIMEOUT_MS = 12e4;
const MAX_INPUT_LENGTH = 100;
/** 默认日志函数 */
const defaultLog = (message) => {
	console.warn(message);
};
/**
* 执行 cli-hub 命令
* @param args - 命令参数数组（不含 'cli-hub' 本身）
* @param timeout - 超时时间（毫秒）
* @param log - 可选的日志函数
* @returns 命令标准输出
*/
function runCliHub(args, timeout = TIMEOUT_MS, log = defaultLog) {
	return new Promise((resolve, reject) => {
		const child = spawn("cli-hub", args, {
			env: {
				...process.env,
				PYTHONIOENCODING: "utf-8"
			},
			windowsHide: true
		});
		let stdout = "";
		let stderr = "";
		let settled = false;
		const timer = setTimeout(() => {
			if (!settled) {
				settled = true;
				child.kill("SIGTERM");
				stdout = "";
				stderr = "";
				reject(/* @__PURE__ */ new Error(`cli-hub 命令超时（${timeout / 1e3}秒）`));
			}
		}, timeout);
		child.stdout.on("data", (data) => {
			stdout += data.toString("utf-8");
		});
		child.stderr.on("data", (data) => {
			stderr += data.toString("utf-8");
		});
		child.on("error", (err) => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				reject(/* @__PURE__ */ new Error(`无法启动 cli-hub: ${err.message}。请确保已安装 cli-anything-hub: pip install cli-anything-hub`));
			}
		});
		child.on("close", () => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				if (stderr.trim()) log(`[dsh-cli-anything] cli-hub stderr: ${stderr.trim()}`);
				resolve(stdout);
			}
		});
	});
}
/**
* 验证输入字符串
* @param value - 待验证的值
* @param fieldName - 字段名称（用于错误提示）
* @returns 去除首尾空格的字符串
* @throws 当值为空、非字符串、过长或包含控制字符时抛出错误
*/
function validateInput(value, fieldName) {
	if (!value || typeof value !== "string" || !value.trim()) throw new Error(`${fieldName} 不能为空`);
	const trimmed = value.trim();
	if (trimmed.length > MAX_INPUT_LENGTH) throw new Error(`${fieldName} 过长（最大 ${MAX_INPUT_LENGTH} 字符）`);
	if (/[\x00-\x1f\x7f]/.test(trimmed)) throw new Error(`${fieldName} 包含非法控制字符`);
	return trimmed;
}

//#endregion
//#region src/index.ts
/** 插件名称 */
const name = "@BlueChonk/dsh-cli-anything";
/** 依赖注入声明 */
const inject = ["tools"];
/** 工具定义列表 */
const TOOLS = [
	{
		name: "cli_hub_list",
		description: "列出所有可用的 CLI-Anything 工具。返回工具名称、类别、描述和安装状态。",
		parameters: {},
		action: "list"
	},
	{
		name: "cli_hub_search",
		description: "按关键词搜索 CLI-Anything 工具。",
		parameters: { query: {
			type: "string",
			required: true,
			description: "搜索关键词"
		} },
		action: "search",
		paramKey: "query",
		paramDesc: "搜索关键词"
	},
	{
		name: "cli_hub_info",
		description: "查看指定工具的详细信息。",
		parameters: { name: {
			type: "string",
			required: true,
			description: "工具名称"
		} },
		action: "info",
		paramKey: "name",
		paramDesc: "工具名称"
	},
	{
		name: "cli_hub_install",
		description: "安装指定的 CLI-Anything 工具。",
		parameters: {
			name: {
				type: "string",
				required: true,
				description: "要安装的工具名称"
			},
			confirm: {
				type: "boolean",
				description: "确认安装（破坏性操作）"
			}
		},
		action: "install",
		paramKey: "name",
		paramDesc: "工具名称",
		needsConfirm: true,
		confirmMsg: "此操作将安装新工具",
		timeout: UPDATE_TIMEOUT_MS
	},
	{
		name: "cli_hub_launch",
		description: "启动已安装的 CLI-Anything 工具。",
		parameters: { name: {
			type: "string",
			required: true,
			description: "要启动的工具名称"
		} },
		action: "launch",
		paramKey: "name",
		paramDesc: "工具名称"
	},
	{
		name: "cli_hub_update",
		description: "更新已安装的 CLI-Anything 工具到最新版本。",
		parameters: {
			name: {
				type: "string",
				required: true,
				description: "要更新的工具名称"
			},
			confirm: {
				type: "boolean",
				description: "确认更新（破坏性操作）"
			}
		},
		action: "update",
		paramKey: "name",
		paramDesc: "工具名称",
		needsConfirm: true,
		confirmMsg: "此操作将修改已安装的工具",
		timeout: UPDATE_TIMEOUT_MS
	},
	{
		name: "cli_hub_uninstall",
		description: "卸载已安装的 CLI-Anything 工具。",
		parameters: {
			name: {
				type: "string",
				required: true,
				description: "要卸载的工具名称"
			},
			confirm: {
				type: "boolean",
				description: "确认卸载（破坏性操作）"
			}
		},
		action: "uninstall",
		paramKey: "name",
		paramDesc: "工具名称",
		needsConfirm: true,
		confirmMsg: "此操作不可恢复",
		timeout: UPDATE_TIMEOUT_MS
	}
];
/**
* 注册单个工具
* @param tools - 工具注册表
* @param def - 工具定义
*/
function registerTool(tools, def) {
	return tools.register(defineTool({
		name: def.name,
		description: def.description,
		parameters: def.parameters,
		output: {
			schema: { type: "string" },
			render: (_args, value) => [{
				type: "text",
				text: value
			}]
		},
		async execute(args) {
			try {
				let param = "";
				if (def.paramKey) param = validateInput(args[def.paramKey], def.paramDesc || def.paramKey);
				if (def.needsConfirm && !args.confirm) return `⚠️ 确认${def.action} "${param}"？${def.confirmMsg}。设置 confirm=true 确认执行。`;
				return await runCliHub([def.action, param].filter(Boolean), def.timeout);
			} catch (error) {
				return `Error: ${error instanceof Error ? error.message : String(error)}`;
			}
		}
	}));
}
/**
* 插件入口函数
* @param ctx - Cordis 上下文
*/
function apply(ctx) {
	const tools = ctx.tools;
	for (const def of TOOLS) ctx.effect(() => registerTool(tools, def));
}

//#endregion
export { apply, inject, name };