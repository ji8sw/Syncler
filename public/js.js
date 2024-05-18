document.addEventListener("DOMContentLoaded", function() {
    let socket;

    function Sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function RequestFrame() {
        if (socket.readyState !== 1)
        {
            console.log(socket.readyState)
            await new Promise(resolve => setTimeout(resolve, 1));
        }

        const Package = 
        {
            Type: "RequestFrame"
        }

        socket.send(JSON.stringify(Package))
    }

    function DefineSettings(_Width = 1280, _Height = 720)
    {
        const Package = 
        {
            Type: "DefineSettings",
            Width: _Width,
            Height: _Height
        }

        socket.send(JSON.stringify(Package))
    }

    document.getElementById('ToggleSettingsButton').addEventListener('click', function() {
        ToggleSettings()
    });

    document.getElementById('ConnectButton').addEventListener('click', function() {
        var Width = document.getElementById("Width").value;
        var Height = document.getElementById("Height").value;
        var IP = document.getElementById("IP").value;
        Connect(Width, Height, IP)
        ToggleSettings()
    });

    function ToggleSettings()
    {
        var Menu = document.getElementById("SettingsMenu");
        if (Menu.style.display == "none")
            Menu.style.display = 'block'
        else
            Menu.style.display = 'none'
    }

    async function Connect(Width = 1280, Height = 720, IP = "192.168.1.*", Port = 3000)
    {
        if (socket && socket.readyState <= 1) { // Check if the socket is connecting or open
            console.log("Closing existing socket");
            await new Promise(resolve => {
                socket.onclose = () => resolve();
                socket.close();
            });
        }

        console.log("connecting with settings: " + Width + "x" + Height)
        socket = new WebSocket(`ws://${IP}:${Port}`);

        socket.onopen = function(event) {
            console.log("WebSocket connection established, starting frame stream");
            DefineSettings(Width, Height);
            RequestFrame();
        };

        socket.onmessage = function(PackageData) {
            const Package = JSON.parse(PackageData.data);
    
            if (Package.type === 'image') {
                const FrameData = 'data:image/jpeg;base64,' + Package.data;
                document.body.style.backgroundImage = `url(${FrameData})`;
            }
    
            RequestFrame();
        };
    
        socket.onerror = function(error) {
            console.error("WebSocket error:", error);
        };
    
        socket.onclose = function(event) {
            console.log("WebSocket connection closed");
        };

        while (socket.readyState !== 1) {
            console.log("waiting for connection, currently: " + socket.readyState)
            await Sleep(100)
        }
        
        DefineSettings(Width, Height)
        RequestFrame()
    }
});
