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

import * as vscode from "vscode";
import * as path from "path";

import { Locator, LocatorRunner } from "../ArtifactLocator";
import { ConfigSetting } from "../ConfigSetting";

export type EdgeTpuCfg = {
  "edgetpu-compile": any;
};

export class EdgeTpuConfigSetting extends ConfigSetting {
  static backendName = "EdgeTPU";
  static ext = ".edgetpucfg";

  constructor() {
    super();
    this.sections = {
      ".tflite": "edgetpu-compile",
    };
  }

  /**
   * Add postfix(_edgetpu) to file name of new input path
   * @returns void
   */
  public updateOutPath(
    newpath: string,
    rawObj: { [key: string]: any },
    kSection: string
  ): void {
    const ext = path.extname(newpath);
    const name = path.basename(newpath, ext) + "_edgetpu" + ext;
    const dir = path.dirname(newpath);
    const outpath = path.join(dir, name);
    if (rawObj[kSection]) {
      rawObj[kSection].output_path = outpath;
    }
  }

  protected _initBaseModelsLocatorRunner() {
    let locatorRunner = new LocatorRunner();

    locatorRunner.register({
      artifactAttr: {
        ext: ".tflite",
        icon: new vscode.ThemeIcon("symbol-variable"),
      },
      locator: new Locator((value: string) => {
        value += "";
        const filterd = value
          .split(" ")
          .filter((val) => !val.endsWith("_edgetpu.tflite"));
        value = filterd.join(" ");
        return LocatorRunner.searchWithExt(".tflite", value);
      }),
    });

    this.baseModelsLocatorRunner = locatorRunner;
  }

  protected _initProductsLocatorRunner() {
    let locatorRunner = new LocatorRunner();

    /**
     * ABOUT ORDERING
     *
     * The registration order determines the order in the tree view
     */

    // NOTE
    // Shows <model>_edgetpu.tflite
    // <model>_edgetpu.tflite generated by <model>.tflite is product type
    locatorRunner.register({
      artifactAttr: {
        ext: ".tflite",
        icon: new vscode.ThemeIcon("symbol-variable"),
        openViewType: "one.viewer.circle",
      },
      locator: new Locator((value: string) => {
        value += "";
        const filterd = value
          .split(" ")
          .filter((val) => val.endsWith("_edgetpu.tflite"));
        value = filterd.join(" ");
        return LocatorRunner.searchWithExt(".tflite", value);
      }),
    });

    locatorRunner.register({
      // 'default' view type is 'text editor' (vscode.openWith)
      artifactAttr: {
        ext: ".log",
        openViewType: "default",
        icon: vscode.ThemeIcon.File,
        canHide: true,
      },
      locator: new Locator((value: string) => {
        value += "";
        const filterd = value
          .split(" ")
          .filter((val) => val.endsWith("_edgetpu.tflite"));
        value = filterd.join(" ");
        return LocatorRunner.searchWithExt(".tflite", value).map((filepath) =>
          filepath.replace(".tflite", ".log")
        );
      }),
    });

    this.productsLocatorRunner = locatorRunner;
  }
}