
      if (window.location.protocol === "file:") {
        document.getElementById("root").innerHTML =
          '<main style="min-height:100vh;padding:40px;background:#9381FF;color:#000000;font-family:Madimi One,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">' +
          '<h1 style="margin:0 0 12px;font-size:32px">Open Planuf Productions from the local app server</h1>' +
          '<p style="max-width:680px;color:#000000;line-height:1.55">This React/Vite app will appear blank when opened as a raw file. Use the running local app URL instead.</p>' +
          '<p><a style="display:inline-block;margin-top:12px;padding:12px 16px;border-radius:8px;background:#EE6352;color:#9381FF;font-weight:800;text-decoration:none" href="http://127.0.0.1:5173/">Open Planuf app</a></p>' +
          "</main>";
      }
      window.addEventListener("error", function (event) {
        var root = document.getElementById("root");
        if (root && !root.textContent) {
          root.innerHTML =
            '<main class="error-page"><h1>Planuf app render error</h1><p>' +
            String(event.message || "Unknown error") +
            "</p></main>";
        }
      });
    