// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const axios = require('axios')
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "pdman-ext" is now active!');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('pdman-ext.helloWorld', async function () {
		const webViewPanel = vscode.window.createWebviewPanel(
			'pdmaner1',
			'pdmaner2',
			vscode.ViewColumn.Five,
			{
				enableScripts: true,
			}
		)
		const webview = webViewPanel.webview
		const remoteUrl = 'http://localhost:3000/'
		// 获取远程HTML内容，注意：需要将HTML文件（不是打包后的）中的注释全部删除，否则在后续replace方法中会有问题
		const { data: content } = await axios.get(remoteUrl)
		const replacedScript = content.replace(/<script defer src="(.*)"/, (match, matchedStr) => {
			return `<script defer src="${remoteUrl}${matchedStr.slice(1)}"`
		})
		const replacedContent = replacedScript.replace(/href="(.*)"/g, (match, matchedStr) => {
			try {
				const fullPath = remoteUrl + matchedStr
				return `href="${fullPath}"`
			} catch (error) {
				console.log(error);
			}
		})
		// 添加内容安全策略：vscode插件能不能加载远程资源，就看有没有CSP元数据信息
		/* img-src： 用来控制允许添加来自哪里的图片路径
		 *	script-src：用来控制允许添加来自哪里的脚本路径
		 		style-src：用来控制允许添加来自哪里的css样式路径
				font-src：用来控制允许添加来自哪里的字体路径
		 */
		const cspStr = `
	<meta
		http-equiv="Content-Security-Policy"
		content="default-src 'none'; img-src ${remoteUrl} https:; script-src 'unsafe-eval' ${remoteUrl}; style-src 'self' 'unsafe-inline' ${remoteUrl}; font-src 'self' ${remoteUrl}; connect-src ${remoteUrl} ws://0.0.0.0:3000/ws; manifest-src ${remoteUrl}"
	/>
		`
		// 在head标签中添加CSP元数据meta信息，由于head标签中的内容有\r\n，所以匹配所有任意字符不能使用.*，只能换成[^]
		const cspContent = replacedContent.replace(/<head>([^]*)<\/head>/, (matched, matchedStr) => {
			return `<head>${cspStr}${matchedStr}</head>` 
		})
		webview.onDidReceiveMessage(e => {
			const type = e.type
			switch(type) {
				case 'finished':
					console.log('扩展收到了来自页面的消息');
					webview.postMessage({content: '扩展发送给页面的数据', type: 'send'})
					break
				case 'saveFile':
					vscode.window.showSaveDialog({
						title: 'Save as',
						saveLabel: '保存',
						filters: {
							PDMan: ['(*.pdman.json)']
						}
					}).then(res => console.dir(res))
					break
			}
		})
		webview.html = cspContent
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
