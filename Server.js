const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const fs = require('fs');
const CaptureScreen = require('screenshot-desktop');
const sharp = require('sharp');

const Sessions = {};

wss.on('connection', function connection(ws) {
    console.log('Client connected');
    let Width = 1280
    let Height = 720
  
    ws.on('message', function incoming(PackageRaw) {   
        const Package = JSON.parse(PackageRaw);

        if (Package.Type === "RequestFrame") {
            CaptureScreen({ filename: 'Frame.jpg' }).then((Path) => {
                sharp(Path)
                    .resize(parseInt(Width), parseInt(Height))
                    .toBuffer()
                    .then(buffer => {
                        const FrameB64 = buffer.toString('base64');
                        console.log('Screenshot taken, sending.');
                        ws.send(JSON.stringify({ type: 'image', data: FrameB64 }));
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }).catch((Error) => {
                console.error('Error capturing screenshot:', Error);
            })
        }
        else if (Package.Type === "DefineSettings") {
            console.log("Client Defined Settings: " + Package.Width + "x" + Package.Height)
            Width = Package.Width;
            Height = Package.Height;
        }
        else
        {
            console.log("Recieved Unhandled Package: " + Package.Type)
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});