'use strict'

import { app, protocol, BrowserWindow, dialog } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import path from 'path'
import fs from 'fs'
import download from 'download'
import zipper from 'zip-local'
import JSON5 from 'json5'
import {machineIdSync} from 'node-machine-id'

const EAU = require('electron-asar-hot-updater');
const isDevelopment = process.env.NODE_ENV !== 'production'

//模块依赖文件路径
let edgepath = path.join(__static, isDevelopment ? '../' : '../../ecryption/');
let regeditpath = path.join(__static, '../../regedit/');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])
/*
let importDll = (event, check) => {
  if (fsExistsSync(edgepath + 'dll/') && fsExistsSync(edgepath + 'electron-edge-js/') || isDevelopment) {
    electronEdge_Dencryption()
    event(check)
  } else {
    fs.mkdir(edgepath,function(){
      download('https://mhwee.alcedo.top/download/ecryption.zip', edgepath).then(() => {
        zipper.unzip(edgepath + 'ecryption.zip', function(error, unzipped) {
          if(!error) {
            unzipped.save(null, function() {
              electronEdge_Dencryption()
              event(check)
            });
          }
        });
      });
    })
  }
}
*/
function importRegedit (event) {
  let regedit = null
  if (fsExistsSync(regeditpath + 'vbs/') || isDevelopment) {
    regedit = require('regedit')
    checkVC(regedit, event)
  } else {
    fs.mkdir(edgepath,function(){
      download('https://mhwee.alcedo.top/download/regedit.zip', regeditpath).then(() => {
        zipper.unzip(regeditpath + 'regedit.zip', function(error, unzipped) {
          if(!error) {
            unzipped.save(null, function() {
              regedit = require('regedit')
              checkVC(regedit, event)
            });
          }
        });
      });
    })
  }
}

function checkVC (regedit, event) {
  let check = false
  regedit.setExternalVBSLocation('regedit/vbs');
  regedit.list(['HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{05360E8D-2964-400C-8C25-1921B7F5CA49}'], function(err, result) {
    if (!err) {
      let regdata = result['HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{05360E8D-2964-400C-8C25-1921B7F5CA49}'].values
      let version = regdata.DisplayVersion.value.split(".")
      if(version[0] != 14 || version[1] <= 23) {
        check = true
      } else (
        console.log('本机vc++版本', version)
      )
    }
    event(check)
    //暂时不需要加载dll文件了
    //importDll(event, check)
  })
}
function fsExistsSync (path) {
  try{
      fs.accessSync(path,fs.F_OK);
  }catch(e){
      return false;
  }
  return true;
}
/*
function electronEdge_Dencryption () {
  let edge = __non_webpack_require__(isDevelopment ? 'electron-edge-js' : edgepath + 'electron-edge-js');

  let DencryptionHelper = edge.func({
    assemblyFile: path.join(edgepath, 'dll/EncryptionHelper.dll'),
    typeName: 'EncryptionHelper.Startup',
    methodName: 'nodeDecrypt'
  });
  let EncryptionHelper = edge.func({
    assemblyFile: path.join(edgepath, 'dll/EncryptionHelper.dll'),
    typeName: 'EncryptionHelper.Startup',
    methodName: 'nodeEcrypt'
  });

  let Dencryption = (event, data) => {
    //解密文件
    let payload = {
      filebyte: data.hex,
      key: data.key,
    };
    DencryptionHelper(payload, function (error, result) {
      event(data.Oldversion, data.filepath, result)
    });
  }

  let Encryption = (event, data) => {
    //加密文件
    let payload = {
      filebyte: data.hex,
      key: data.key,
    };
    EncryptionHelper(payload, function (error, result) {
      event(result)
    });
  }

  console.log('Encryption Mode Init')
  app.fileDencryption = Dencryption
  app.fileEncryption = Encryption
}
*/

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ 
    width: 1600,
    height: 1080,
    useContentSize: true,
    frame: false,
    icon: path.join(__static, 'icon.png'),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    } 
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }

  let licensepath = path.join(__static, '../../license')
  fs.readFile(licensepath, function (err, data) {
    let apiurl = 'https://mhwee.com/update.php'
    if (!err && data.length > 0) {
      let lic = JSON5.parse(data)
      let licdate = new Date(lic.time)
      let date = new Date()
      let id = machineIdSync()
      if ((lic.UUID === id && licdate > date && lic.inside == 'InsideUser:' + id) || lic.inside == 'developers:3honesty_sway_Grimm_hits5_jilt_culminate7_surrender_decent4_8Humid_permit4_feed5_Midst') {
        apiurl = 'https://mhwee.com/insideupdate.php'
      }
    }
    //更新
    EAU.init({
      'api': apiurl, // The API EAU will talk to
      'server': false, // Where to check. true: server side, false: client side, default: true.
      'debug': false, // Default: false.
      'headers': { Authorization: 'token' }, // Default: {}
      'formatRes': function(res) { return res } // 对返回的数据进行格式化操作的回调函数，保证EAU可以正常操作操作数据。比如格式化后返回：{version: xx, asar: xx}
    });

    EAU.check(function (error, last, body) {
      if (error) {
        if (error === 'no_update_available') { return false; }
        dialog.showErrorBox('info', error)
        return false
      }

      EAU.progress(function (state) {
        // The state is an object that looks like this:
        // {
        //     percent: 0.5,               
        //     speed: 554732,              
        //     size: {
        //         total: 90044871,        
        //         transferred: 27610959   
        //     },
        //     time: {
        //         elapsed: 36.235,        
        //         remaining: 81.403       
        //     }
        // }
      })

      EAU.download(function (error) {
        if (error) {
          dialog.showErrorBox('info', error)
          return false
        }
        // dialog.showErrorBox('info', 'App updated successfully! Restart it please.')
        if (process.platform === 'darwin') {
          app.relaunch()
          app.quit()
        } else {
          app.quit()
        }
      })
    })
  })
  createWindow()
})

app.hide_window = () => {
  win.minimize()
}

app.load_environment = (event) => {
  importRegedit(event)
}
app.fileDencryption = () => {console.log('尚未完成初始化')}
app.fileEncryption = () => {console.log('尚未完成初始化')}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
