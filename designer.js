(function () {
  "use strict";

  var photoImg = null;
  var colour = "cyan";
  var frame = "dual";

  var COLOURS = {
    cyan: { a: "#00e0fe", b: "#00e0fe", label: "Cyan" },
    magenta: { a: "#c44bff", b: "#c44bff", label: "Magenta" },
    purple: { a: "#8a33fd", b: "#b14bff", label: "Purple" },
    dual: { a: "#c44bff", b: "#00e0fe", label: "Cyan and magenta" },
    chrome: { a: "#d8dbe8", b: "#f4f5f8", label: "Chrome silver" }
  };

  var stick = document.getElementById("preview-stick");
  var card = document.getElementById("preview-card");
  if (!stick || !card) return;

  var nameInput = document.getElementById("nova-name");
  var lineInput = document.getElementById("nova-line");
  var photoInput = document.getElementById("nova-photo");
  var statusEl = document.getElementById("nova-status");

  function val(el) { return el && el.value ? el.value.trim() : ""; }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function roundedRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function glowRect(ctx, x, y, w, h, r, color, blur) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    roundedRect(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }

  function coverImage(ctx, img, x, y, w, h, r) {
    var scale = Math.max(w / img.width, h / img.height);
    var dw = img.width * scale;
    var dh = img.height * scale;
    var dx = x + (w - dw) / 2;
    var dy = y + (h - dh) / 2;
    ctx.save();
    roundedRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function placeholderFace(ctx, x, y, w, h, r, pal) {
    ctx.save();
    roundedRect(ctx, x, y, w, h, r);
    var g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#1a0a28");
    g.addColorStop(0.5, "#0a1020");
    g.addColorStop(1, "#081018");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = "rgba(216,219,232,0.7)";
    ctx.font = "600 22px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload a photo", x + w / 2, y + h / 2 - 10);
    ctx.font = "400 14px Outfit, system-ui, sans-serif";
    ctx.fillStyle = pal.a;
    ctx.fillText("Nova will place it here", x + w / 2, y + h / 2 + 16);
    ctx.restore();
  }

  function drawTextBlock(ctx, x, y, w, pal) {
    var name = val(nameInput) || "Your name";
    var line = val(lineInput);
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "800 42px Syne, sans-serif";
    var size = 42;
    while (size > 18 && ctx.measureText(name).width > w - 16) {
      size -= 2;
      ctx.font = "800 " + size + "px Syne, sans-serif";
    }
    var nameW = ctx.measureText(name).width;
    var lineW = 0;
    if (line) {
      ctx.font = "600 20px Outfit, sans-serif";
      lineW = ctx.measureText(line).width;
    }
    var boxW = Math.min(w, Math.max(nameW, lineW) + 20);
    var boxH = line ? 70 : 48;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundedRect(ctx, x - 8, y - (line ? 36 : 32), boxW, boxH, 8);
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#fff";
    ctx.font = "800 " + size + "px Syne, sans-serif";
    ctx.fillText(name, x, y);
    if (line) {
      ctx.font = "600 20px Outfit, sans-serif";
      ctx.fillStyle = pal.b;
      ctx.shadowBlur = 4;
      ctx.fillText(line, x, y + 26);
    }
    ctx.restore();
  }

  function drawFrame(ctx, x, y, w, h, r, pal, style) {
    if (style === "wave") {
      glowRect(ctx, x, y, w, h, r, pal.a, 16);
      ctx.save();
      ctx.beginPath();
      var midY = y + 18;
      var bars = 22;
      var gap = w / bars;
      ctx.fillStyle = pal.b;
      for (var i = 1; i < bars - 1; i++) {
        var bh = 5 + Math.abs(Math.sin(i * 0.7)) * 12;
        ctx.fillRect(x + i * gap, midY - bh, Math.max(2, gap * 0.35), bh);
      }
      var midY2 = y + h - 6;
      ctx.fillStyle = pal.a;
      for (var j = 1; j < bars - 1; j++) {
        var bh2 = 4 + Math.abs(Math.cos(j * 0.65)) * 8;
        ctx.fillRect(x + j * gap, midY2 - bh2, Math.max(2, gap * 0.35), bh2);
      }
      ctx.restore();
      return;
    }
    if (style === "dual") {
      glowRect(ctx, x - 2, y - 2, w + 4, h + 4, r + 2, pal.a, 22);
      glowRect(ctx, x + 4, y + 4, w - 8, h - 8, Math.max(4, r - 4), pal.b, 14);
      return;
    }
    if (style === "chrome") {
      ctx.save();
      var lg = ctx.createLinearGradient(x, y, x + w, y + h);
      lg.addColorStop(0, "#f7f8fb");
      lg.addColorStop(0.4, "#9aa0b4");
      lg.addColorStop(0.7, "#e8eaf2");
      lg.addColorStop(1, "#7c8194");
      ctx.strokeStyle = lg;
      ctx.lineWidth = 5;
      ctx.shadowColor = "rgba(216,219,232,0.6)";
      ctx.shadowBlur = 12;
      roundedRect(ctx, x, y, w, h, r);
      ctx.stroke();
      ctx.restore();
      return;
    }
    var col = style === "magenta" ? "#c44bff" : style === "cyan" ? "#00e0fe" : pal.a;
    glowRect(ctx, x, y, w, h, r, col, 20);
  }

  function drawUsbC(ctx, x, y, dir) {
    // Compact silver USB-C plug. dir is "down" or "right".
    var length = 34;
    var thick = 18;
    var px, py, w, h;
    if (dir === "right") {
      w = length;
      h = thick;
      px = x;
      py = y - thick / 2;
    } else {
      w = thick;
      h = length;
      px = x - thick / 2;
      py = y;
    }
    ctx.save();
    var g = ctx.createLinearGradient(px, py, px + w, py + (dir === "right" ? 0 : h));
    g.addColorStop(0, "#6a6e78");
    g.addColorStop(0.25, "#e4e6ee");
    g.addColorStop(0.55, "#a8adb8");
    g.addColorStop(1, "#5b5f68");
    ctx.fillStyle = g;
    roundedRect(ctx, px, py, w, h, thick / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    roundedRect(ctx, px, py, w, h, thick / 2);
    ctx.stroke();
    ctx.fillStyle = "#121317";
    if (dir === "right") {
      roundedRect(ctx, px + w - 16, py + 4, 11, h - 8, 4);
    } else {
      roundedRect(ctx, px + 4, py + h - 16, w - 8, 11, 4);
    }
    ctx.fill();
    ctx.restore();
  }

  function drawStick() {
    var ctx = stick.getContext("2d");
    var W = stick.width;
    var H = stick.height;
    var pal = COLOURS[colour] || COLOURS.cyan;
    ctx.clearRect(0, 0, W, H);

    var bg = ctx.createRadialGradient(W * 0.5, H * 0.4, 20, W * 0.5, H * 0.45, W * 0.7);
    bg.addColorStop(0, "#1a0c28");
    bg.addColorStop(1, "#050308");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var bodyW = 280;
    var bodyH = 620;
    var x = (W - bodyW) / 2;
    var y = 40;
    var r = 36;

    // outer glow behind body
    ctx.save();
    ctx.shadowColor = pal.a;
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#0a0a0d";
    roundedRect(ctx, x, y, bodyW, bodyH, r);
    ctx.fill();
    ctx.restore();

    // plastic body
    var bodyGrad = ctx.createLinearGradient(x, y, x + bodyW, y);
    bodyGrad.addColorStop(0, "#141418");
    bodyGrad.addColorStop(0.5, "#2a2a30");
    bodyGrad.addColorStop(1, "#101014");
    ctx.fillStyle = bodyGrad;
    roundedRect(ctx, x, y, bodyW, bodyH, r);
    ctx.fill();

    var inset = 18;
    var fx = x + inset;
    var fy = y + inset;
    var fw = bodyW - inset * 2;
    var fh = bodyH - 90;
    var fr = 22;

    if (photoImg) coverImage(ctx, photoImg, fx, fy, fw, fh, fr);
    else placeholderFace(ctx, fx, fy, fw, fh, fr, pal);

    // bottom fade for text
    var fade = ctx.createLinearGradient(fx, fy + fh - 120, fx, fy + fh);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.save();
    roundedRect(ctx, fx, fy, fw, fh, fr);
    ctx.clip();
    ctx.fillStyle = fade;
    ctx.fillRect(fx, fy + fh - 120, fw, 120);
    ctx.restore();

    drawFrame(ctx, fx, fy, fw, fh, fr, pal, frame);
    drawTextBlock(ctx, fx + 16, fy + fh - (val(lineInput) ? 40 : 24), fw - 24, pal);

    // brand tick
    ctx.fillStyle = "rgba(216,219,232,0.55)";
    ctx.font = "700 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TYPE C CUSTOM", x + bodyW / 2, y + bodyH - 22);

    drawUsbC(ctx, x + bodyW / 2, y + bodyH - 2, "down");
  }

  function drawCard() {
    var ctx = card.getContext("2d");
    var W = card.width;
    var H = card.height;
    var pal = COLOURS[colour] || COLOURS.cyan;
    ctx.clearRect(0, 0, W, H);

    var bg = ctx.createRadialGradient(W * 0.55, H * 0.45, 20, W * 0.5, H * 0.5, W * 0.65);
    bg.addColorStop(0, "#12081c");
    bg.addColorStop(1, "#050308");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var bodyW = 700;
    var bodyH = 440;
    var x = (W - bodyW) / 2 - 20;
    var y = (H - bodyH) / 2;
    var r = 28;

    ctx.save();
    ctx.shadowColor = pal.b;
    ctx.shadowBlur = 36;
    ctx.fillStyle = "#0c0c10";
    roundedRect(ctx, x, y, bodyW, bodyH, r);
    ctx.fill();
    ctx.restore();

    var bodyGrad = ctx.createLinearGradient(x, y, x, y + bodyH);
    bodyGrad.addColorStop(0, "#1a1a20");
    bodyGrad.addColorStop(1, "#0a0a0e");
    ctx.fillStyle = bodyGrad;
    roundedRect(ctx, x, y, bodyW, bodyH, r);
    ctx.fill();

    var inset = 16;
    var fx = x + inset;
    var fy = y + inset;
    var fw = bodyW - inset * 2;
    var fh = bodyH - inset * 2;
    var fr = 18;

    if (photoImg) coverImage(ctx, photoImg, fx, fy, fw, fh, fr);
    else placeholderFace(ctx, fx, fy, fw, fh, fr, pal);

    var fade = ctx.createLinearGradient(fx, fy + fh - 110, fx, fy + fh);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.save();
    roundedRect(ctx, fx, fy, fw, fh, fr);
    ctx.clip();
    ctx.fillStyle = fade;
    ctx.fillRect(fx, fy + fh - 110, fw, 110);
    ctx.restore();

    drawFrame(ctx, fx, fy, fw, fh, fr, pal, frame);
    drawTextBlock(ctx, fx + 20, fy + fh - (val(lineInput) ? 40 : 24), fw - 48, pal);

    drawUsbC(ctx, x + bodyW - 2, y + bodyH / 2, "right");

    ctx.fillStyle = "rgba(216,219,232,0.5)";
    ctx.font = "700 11px Outfit, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("TYPE C CUSTOM", x + bodyW - 18, y + bodyH - 10);
  }

  function redraw() {
    drawStick();
    drawCard();
  }

  function currentNote() {
    var pal = COLOURS[colour] || COLOURS.cyan;
    var frameNames = {
      dual: "Dual glow",
      cyan: "Cyan",
      magenta: "Magenta",
      chrome: "Chrome",
      wave: "Sound wave"
    };
    var parts = [
      "Nova layout (no AI — photo and text I supplied):",
      "Artist/name: " + (val(nameInput) || "(none)"),
      "Extra line: " + (val(lineInput) || "(none)"),
      "Colour: " + pal.label,
      "Frame: " + (frameNames[frame] || frame)
    ];
    return parts.join("\n");
  }

  function makeCombinedBlob(cb) {
    var out = document.createElement("canvas");
    out.width = 1600;
    out.height = 1000;
    var ctx = out.getContext("2d");
    ctx.fillStyle = "#050308";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = "#d8dbe8";
    ctx.font = "800 28px Syne, sans-serif";
    ctx.fillText("TYPE C CUSTOM", 40, 48);
    ctx.font = "500 16px Outfit, sans-serif";
    ctx.fillStyle = "#00e0fe";
    ctx.fillText("Stick and card layout — designed with Nova (layout only, no AI generation)", 40, 74);

    // draw previews scaled
    var sh = 820;
    var sw = Math.round(stick.width * (sh / stick.height));
    ctx.drawImage(stick, 40, 110, sw, sh);
    var ch = 640;
    var cw = Math.round(card.width * (ch / card.height));
    ctx.drawImage(card, 40 + sw + 40, 180, cw, ch);

    out.toBlob(function (blob) {
      cb(blob);
    }, "image/png");
  }

  function downloadPng() {
    makeCombinedBlob(function (blob) {
      if (!blob) {
        setStatus("Could not build the PNG. Try again in this browser.");
        return;
      }
      window.TYPEC_DESIGN = window.TYPEC_DESIGN || {};
      window.TYPEC_DESIGN.blob = blob;
      window.TYPEC_DESIGN.note = currentNote();
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "type-c-custom-design.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      setStatus("Saved type-c-custom-design.png. You can attach it to your enquiry next.");
    });
  }

  function sendWithEnquiry() {
    makeCombinedBlob(function (blob) {
      window.TYPEC_DESIGN = window.TYPEC_DESIGN || {};
      window.TYPEC_DESIGN.blob = blob;
      window.TYPEC_DESIGN.note = currentNote();
      var note = currentNote();
      ["pr-message", "ct-message"].forEach(function (id) {
        var ta = document.getElementById(id);
        if (!ta) return;
        var existing = ta.value.trim();
        if (existing && existing.indexOf("Nova layout") !== -1) {
          // replace previous auto note if present at the end
          ta.value = existing.replace(/\n*Nova layout[\s\S]*$/, "").trim();
          existing = ta.value.trim();
        }
        ta.value = (existing ? existing + "\n\n" : "") + note;
      });
      ["pr-design-note", "ct-design-note"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.hidden = false;
      });
      var sel = document.getElementById("pr-product");
      if (sel && !sel.value) sel.value = "Custom design — USB card";
      setStatus("Design ready. I’ve added the details to the pre-register and contact forms, and the PNG will be attached if you send from this page.");
      var target = document.getElementById("pre-register");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) {
        photoImg = null;
        redraw();
        return;
      }
      if (!file.type || file.type.indexOf("image/") !== 0) {
        setStatus("Please choose an image file (a photo or graphic).");
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        photoImg = img;
        redraw();
        setStatus("Photo added — you can change the name, colour and frame and the previews will update.");
      };
      img.onerror = function () {
        setStatus("That file couldn’t be read as an image.");
      };
      img.src = url;
    });
  }

  if (nameInput) nameInput.addEventListener("input", redraw);
  if (lineInput) lineInput.addEventListener("input", redraw);

  document.querySelectorAll("#nova-colours .swatch").forEach(function (btn) {
    btn.addEventListener("click", function () {
      colour = btn.getAttribute("data-colour") || "cyan";
      document.querySelectorAll("#nova-colours .swatch").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      redraw();
    });
  });

  document.querySelectorAll("#nova-frames input[name='frame']").forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (radio.checked) {
        frame = radio.value;
        redraw();
      }
    });
  });

  var dl = document.getElementById("nova-download");
  if (dl) dl.addEventListener("click", downloadPng);
  var send = document.getElementById("nova-send");
  if (send) send.addEventListener("click", sendWithEnquiry);

  redraw();
})();
