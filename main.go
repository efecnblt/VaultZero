package main

  import (
        "embed"
        "log"

        "github.com/wailsapp/wails/v2"
        "github.com/wailsapp/wails/v2/pkg/options"
        "github.com/wailsapp/wails/v2/pkg/options/assetserver"
        "github.com/wailsapp/wails/v2/pkg/options/windows"
  )

  //go:embed all:frontend/dist
  var assets embed.FS

  func main() {
        // Create an instance of the app structure
        app := NewApp()

        // Create application with options
        err := wails.Run(&options.App{
                Title:  "VaultZero - Password Manager",
                Width:  1200,
                Height: 800,
                AssetServer: &assetserver.Options{
                        Assets: assets,
                },
                BackgroundColour: &options.RGBA{R: 15, G: 23, B: 42, A: 1},
                OnStartup:        app.startup,
                OnDomReady:       app.domReady,
                OnBeforeClose:    app.beforeClose,
                OnShutdown:       app.shutdown,
                Bind: []interface{}{
                        app,
                },
                Windows: &windows.Options{
                        WebviewIsTransparent: false,
                        WindowIsTranslucent:  false,
                },
        })

        if err != nil {
                log.Fatal(err)
        }
  }