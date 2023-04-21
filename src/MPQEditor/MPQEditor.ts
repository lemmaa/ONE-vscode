/*
 * Copyright (c) 2023 Samsung Electronics Co., Ltd. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as cp from "child_process";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as vscode from "vscode";

import { Balloon } from "../Utils/Balloon";
import { Logger } from "../Utils/Logger";
import { getNonce } from "../Utils/external/Nonce";
import { getUri } from "../Utils/external/Uri";
import { MPQData } from "./MPQData";

export class MPQEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "one.editor.mpq";
  public static readonly fileExtension = ".mpq.json";

  private _disposables: vscode.Disposable[] = [];
  private _mpqDataMap: any = {};

  /**
   * register MPQEditorProvider and its commands
   */
  public static register(context: vscode.ExtensionContext): void {
    const provider = new MPQEditorProvider(context);
    const registrations = [
      vscode.window.registerCustomEditorProvider(
        MPQEditorProvider.viewType,
        provider,
        {
          webviewOptions: { retainContextWhenHidden: true },
        }
      ),
      // Add command registration here
      vscode.commands.registerCommand(
        "one.editor.mpq.createFromDefaultExplorer",
        (uri) => {
          MPQEditorProvider.createMPQJson(uri);
        }
      ),
    ];

    registrations.forEach((disposable) =>
      context.subscriptions.push(disposable)
    );
  }

  /**
   * @brief create file with default mpq configuration
   * @returns valid uri of file on success or undefined on failure
   */
  public static async createDefaultMPQ(
    mpqName: string,
    dirPath: string,
    circleName: string
  ): Promise<vscode.Uri | undefined> {
    const content = `{"default_quantization_dtype": "uint8",
      "default_granularity": "channel",
      "layers": [],
      "model_path": "${circleName}"}`;

    // 'uri' path is not occupied, assured by validateInputPath
    const uri = vscode.Uri.file(`${dirPath}/${mpqName}`);

    const edit = new vscode.WorkspaceEdit();
    edit.createFile(uri);
    edit.insert(uri, new vscode.Position(0, 0), content);

    try {
      await vscode.workspace.applyEdit(edit);
      let document = await vscode.workspace.openTextDocument(uri);
      document.save();
    } catch (error) {
      return undefined;
    }

    return uri;
  }

  /**
   * @brief Create and open for edit default mpq file
   */
  public static createMPQJson(uri: vscode.Uri): void {
    const dirPath = path.parse(uri.path).dir;
    const modelName = path.parse(uri.path).name;
    const extName = path.parse(uri.path).ext.slice(1);
    const circleName = path.parse(uri.path).base;

    // try to guess unoccupied name for mpq.json
    let mpqName = MPQEditorProvider.findMPQName(modelName, dirPath);
    if (mpqName === undefined) {
      // failed to find valid name, just revert to initial version
      mpqName = modelName + MPQEditorProvider.fileExtension;
    }

    vscode.window
      .showInputBox({
        title: `Create mixed precision quantization configuration for '${modelName}.${extName}' :`,
        placeHolder: `Enter a file name`,
        value: mpqName,
        valueSelection: [
          0,
          mpqName.length - `${MPQEditorProvider.fileExtension}`.length,
        ],
        validateInput: (mpqName: string): string | undefined => {
          return MPQEditorProvider.validateMPQName(dirPath, mpqName);
        },
      })
      .then((value) => {
        if (!value) {
          Logger.debug("MPQEditor", "User hit the escape key!");
          return;
        }

        MPQEditorProvider.createDefaultMPQ(value!, dirPath, circleName).then(
          (uri) => {
            if (uri) {
              vscode.commands.executeCommand(
                "vscode.openWith",
                uri,
                MPQEditorProvider.viewType
              );
            } else {
              Logger.error(
                "MPQEditor",
                "createMPQJson",
                `Failed to create mpq file for the ${value}!`
              );
            }
          }
        );
      });
  }

  /**
   * @brief A helper function to validate mpqName
   * @note It checks whether
   * (1) 'mpqName' already exists in 'dirPath' directory
   * (2) 'mpqName' has valid extension
   * @returns 'undefined' on success or the cause of failure otherwise
   */
  public static validateMPQName(
    dirPath: string,
    mpqName: string
  ): string | undefined {
    const mpqPath: string = path.join(dirPath, mpqName);

    if (!mpqPath.endsWith(MPQEditorProvider.fileExtension)) {
      return "A file extension must be " + MPQEditorProvider.fileExtension;
    }

    if (fs.existsSync(mpqPath)) {
      return `A file or folder ${mpqPath} already exists at this location. Please choose a different name.`;
    }

    return undefined;
  }

  /**
   * @brief A helper function to find unoccupied mpq file-name
   * @returns valid file name for mpq configuration or undefined on failure
   * @throw Error, when input is invalid (e.g. baseMPQName is empty)
   */
  public static findMPQName(
    baseMPQName: string,
    dirPath: string
  ): string | undefined {
    if (baseMPQName.length === 0) {
      throw new Error("Invalid mixed precision quantization file name");
    }

    const baseName = baseMPQName;
    let mpqName: string | undefined = undefined;

    const options = { cwd: dirPath };
    // set maximal trials as maximal quantity of files + 1
    const files = glob.sync("*" + MPQEditorProvider.fileExtension, options);
    const maxMPQIndex = files.length + 1;

    for (let i = 0; i < maxMPQIndex; i++) {
      mpqName = baseMPQName + MPQEditorProvider.fileExtension;
      const mpqPath: string = path.join(dirPath, mpqName);
      if (!fs.existsSync(mpqPath)) {
        break;
      }
      baseMPQName = baseName + `(${i + 1})`;
      mpqName = undefined;
    }

    return mpqName;
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this._mpqDataMap[document.uri.toString()] = new MPQData();
    await this.initWebview(document, webviewPanel);
    this.initWebviewPanel(document, webviewPanel);
    this.updateWebview(document, webviewPanel.webview);
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private async initWebview(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    const webview: vscode.Webview = webviewPanel.webview;

    webview.options = {
      enableScripts: true,
    };

    const nonce = getNonce();
    const scriptUri = getUri(webview, this.context.extensionUri, [
      "media",
      "MPQEditor",
      "index.js",
    ]);
    const styleUri = getUri(webview, this.context.extensionUri, [
      "media",
      "MPQEditor",
      "style.css",
    ]);
    const codiconUri = getUri(webview, this.context.extensionUri, [
      "node_modules",
      "@vscode",
      "codicons",
      "dist",
      "codicon.css",
    ]);
    const toolkitUri = getUri(webview, this.context.extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const htmlUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media/MPQEditor/index.html"
    );
    let html = Buffer.from(
      await vscode.workspace.fs.readFile(htmlUri)
    ).toString();
    html = html.replace(/\${nonce}/g, `${nonce}`);
    html = html.replace(/\${webview.cspSource}/g, `${webview.cspSource}`);
    html = html.replace(/\${scriptUri}/g, `${scriptUri}`);
    html = html.replace(/\${toolkitUri}/g, `${toolkitUri}`);
    html = html.replace(/\${cssUri}/g, `${styleUri}`);
    html = html.replace(/\${codiconUri}/g, `${codiconUri}`);
    webview.html = html;

    // Receive message from the webview.
    webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "requestDisplayMPQ":
          this.updateWebview(document, webview);
          break;
        case "addSpecificLayerFromDialog":
          this.hadleAddSpecificLayerFromDialog(document);
          break;
        case "updateLayers":
          this._mpqDataMap[document.uri.toString()].setLayersSections(
            e.names,
            e.quantization,
            e.granularity
          );
          break;
        case "updateSpecificQuantization":
          this._mpqDataMap[document.uri.toString()].updateSectionOfLayer(
            e.name,
            "dtype",
            e.value
          );
          break;
        case "updateSpecificGranularity":
          this._mpqDataMap[document.uri.toString()].updateSectionOfLayer(
            e.name,
            "granularity",
            e.value
          );
          break;
        case "requestModelNodes":
          this.handleRequestModelNodes(document, webview);
          break;
        case "updateSection":
          this._mpqDataMap[document.uri.toString()].setSection(
            e.section,
            e.value
          );
          break;
        case "updateDocument":
          this.updateDocument(document);
          break;
        case "removeLayer":
          this.handleRemoveLayerFromLayers(e.name, document);
          break;
        default:
          break;
      }
    });
  }

  /**
   * @brief Update document
   */
  private async updateDocument(document: vscode.TextDocument) {
    if (
      this._mpqDataMap[document.uri.toString()].getAsString() !==
      document.getText()
    ) {
      MPQEditorProvider.updateDocumentBy(
        document,
        this._mpqDataMap[document.uri.toString()].getAsString()
      );
    }
  }

  /**
   * @brief Add layers to edit their quantization parameters
   */
  private hadleAddSpecificLayerFromDialog(document: vscode.TextDocument) {
    const nodes =
      this._mpqDataMap[document.uri.toString()].getDefaultModelLayers();
    const pickOptions = {
      title: "Add specific layers to edit their quantization parameters",
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: "Select layers",
      ignoreFocusOut: true,
      canPickMany: true,
    };

    vscode.window
      .showQuickPick(nodes, pickOptions)
      .then((values: string | undefined) => {
        if (!values) {
          return;
        }

        this._mpqDataMap[document.uri.toString()].addLayers(values);
        this.updateDocument(document);
      });
  }

  /**
   * @brief Remove layer from specif layers (add it to 'default' layers)
   */
  private handleRemoveLayerFromLayers(
    name: string,
    document: vscode.TextDocument
  ) {
    let curConf = this._mpqDataMap[document.uri.toString()];
    curConf.setLayersToDefault([name]);

    this.updateDocument(document);
  }

  private initWebviewPanel(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): void {
    vscode.commands.executeCommand(
      "setContext",
      MPQEditorProvider.viewType,
      true
    );

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (
          e.contentChanges.length > 0 &&
          e.document.uri.toString() === document.uri.toString()
        ) {
          this.updateWebview(document, webviewPanel.webview);
        }
      }
    );

    webviewPanel.onDidChangeViewState(
      () => {
        vscode.commands.executeCommand(
          "setContext",
          MPQEditorProvider.viewType,
          webviewPanel.visible
        );
      },
      null,
      this._disposables
    );

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      while (this._disposables.length) {
        const x = this._disposables.pop();
        if (x) {
          x.dispose();
        }
      }
      vscode.commands.executeCommand(
        "setContext",
        MPQEditorProvider.viewType,
        false
      );
    });
  }

  /**
   * @brief Update webview with document
   */
  private updateWebview(
    document: vscode.TextDocument,
    webview: vscode.Webview
  ): void {
    this._mpqDataMap[document.uri.toString()].setWithString(document.getText());
    const content = JSON.parse(document.getText());
    if (content !== undefined) {
      webview.postMessage({
        type: "displayMPQ",
        content: content,
      });
    }
  }

  /**
   * @brief Get path of the parent .circle file
   */
  private getModelFilePath(document: vscode.TextDocument): string {
    const dirPath = path.parse(document.uri.path).dir;
    let fileName =
      this._mpqDataMap[document.uri.toString()].getSection("model_path");
    return path.join(dirPath, fileName);
  }

  /**
   * @brief Get all model nodes
   */
  private handleRequestModelNodes(
    document: vscode.TextDocument,
    webview: vscode.Webview
  ): void {
    const K_DATA: string = "data";
    const K_EXIT: string = "exit";
    const K_ERROR: string = "error";
    let modelFilePath = this.getModelFilePath(document);

    // TODO integrate with Toolchain
    const tool = "/usr/share/one/bin/circle-operator";
    if (!fs.existsSync(tool)) {
      // check whether it is installed
      Balloon.info("To add more layers for editing please install Toolchain");
      return;
    }

    const toolargs = ["--name", modelFilePath];
    let result: string = "";
    let error: string = "";

    let runPromise = new Promise<string>((resolve, reject) => {
      let cmd = cp.spawn(tool, toolargs, { shell: false });

      cmd.stdout.on(K_DATA, (data: any) => {
        let str = data.toString();
        if (str.length > 0) {
          result = result + str;
        }
      });

      cmd.stderr.on(K_DATA, (data: any) => {
        error = result + data.toString();
        Logger.error("MPQEditor", error);
      });

      cmd.on(K_EXIT, (code: any) => {
        let codestr = code.toString();
        if (codestr === "0") {
          resolve(result);
        } else {
          let msg = "Failed to load model: " + modelFilePath;
          Balloon.error(msg);
          reject(msg);
        }
      });

      cmd.on(K_ERROR, () => {
        let msg = "Failed to run circle-operator: " + modelFilePath;
        Balloon.error(msg);
        reject(msg);
      });
    });

    runPromise
      .then((names) => {
        const layersNames = names.split(/\r?\n/);
        this._mpqDataMap[document.uri.toString()].setAllModelLayers(
          layersNames
        );
        webview.postMessage({
          type: "modelNodesChanged",
          names: layersNames,
        });
      })
      .catch((error) => {
        Logger.error("MPQEditor", error);
      });
  }

  /**
   * @brief Update document by text
   */
  public static async updateDocumentBy(
    document: vscode.TextDocument,
    text: string
  ) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      text
    );
    await vscode.workspace.applyEdit(edit);
  }
}