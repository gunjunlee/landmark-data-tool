const {app, BrowserWindow, ipcMain, ipcRenderer, dialog} = require('electron');
const fs = require('fs');
const io = require('socket.io')();
const path = require('path');

let win;

function createWindow(){
    win = new BrowserWindow({width: 800, height: 600});
    win.loadFile('index.html')

    // Open the DevTools.
    win.webContents.openDevTools()
    
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});

var rootDir = '/'

ipcMain.on('saveLandmarks', (event, landmarks) => {
    console.log('landmarks:', landmarks);
    fs.writeFile(path.join(rootDir, 'landmarks', landmarks.fileName), landmarks.landmarks, 
        (err)=>{
            console.error(err)
            fs.readdir(path.join(rootDir, 'landmarks'), (err, dir) => {
                if (!dir) return;
                win.webContents.send('setDoneList', {dir: dir});
            });
        });
})

ipcMain.on('getDoneList', (event) => {
    fs.readdir(path.join(rootDir, 'landmarks'), (err, dir) => {
        if (!dir) return;
        win.webContents.send('setDoneList', {dir: dir});
    });
})

ipcMain.on('getLandmark', (event, fileName) => {
    fs.readFile(path.join(rootDir, 'landmarks', fileName), 'utf8', (err, data) => {
        console.log(err, data);
        if(err) return
        if(!data) return
        win.webContents.send('setLandmark', data);
    })
})

ipcMain.on('openFolder', (event) => {
    dialog.showOpenDialog({properties: ['openDirectory']}, (filePath, bookmarks) => {
        rootDir = filePath[0];
        win.webContents.send('setRootDir', rootDir);
        fs.readdir(path.join(rootDir, 'images'), (err, files) => {
            if (!files) return;
            if (err) {
                console.error(err);
            }
            win.webContents.send('setImageList', {files: files});
        });
    });
})