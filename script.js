(function () {
  "use strict";

  var cfg = window.TYPEC_MUSIC || {};
  var contactEmail = (cfg.contactEmail || "").trim();

  // Keep visible mailto links in sync with config.js
  if (contactEmail) {
    document.querySelectorAll(".contact-email-link, footer a[href^='mailto:']").forEach(function (a) {
      a.href = "mailto:" + contactEmail;
      if (a.classList.contains("contact-email-link")) a.textContent = contactEmail;
    });
  }

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      nav.classList.toggle("open", !open);
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        nav.classList.remove("open");
      });
    });
  }

  // Pre-register buttons set the product select
  document.querySelectorAll("[data-product]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var select = document.getElementById("pr-product");
      if (select) select.value = btn.getAttribute("data-product") || "";
    });
  });

  function statusEl(form, text, kind) {
    var el = form.querySelector(".form-status");
    if (!el) return;
    el.textContent = text;
    el.className = "form-status" + (kind ? " " + kind : "");
  }

  function gather(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = typeof value === "string" ? value.trim() : value;
    });
    return data;
  }

  var ATTACH_LIMIT = 10 * 1024 * 1024; // FormSubmit documented total
  var FILE_INPUT_IDS = ["pr-music", "pr-video", "pr-artwork", "pr-other"];

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace(/\.0$/, "") + " KB";
    return (n / (1024 * 1024)).toFixed(1).replace(/\.0$/, "") + " MB";
  }

  function listedFiles() {
    var out = [];
    FILE_INPUT_IDS.forEach(function (id) {
      var input = document.getElementById(id);
      if (!input || !input.files) return;
      Array.prototype.forEach.call(input.files, function (file) {
        out.push({ file: file, input: id, name: file.name, size: file.size });
      });
    });
    return out;
  }

  function designBlobSize() {
    var blob = window.TYPEC_DESIGN && window.TYPEC_DESIGN.blob;
    return blob ? blob.size : 0;
  }

  function attachmentTotal() {
    var total = designBlobSize();
    listedFiles().forEach(function (item) { total += item.size; });
    return total;
  }

  function updateUploadMeter() {
    var el = document.getElementById("pr-upload-meter");
    if (!el) return;
    var files = listedFiles();
    var design = designBlobSize();
    var total = attachmentTotal();
    var parts = [];
    if (files.length) {
      parts.push(files.length === 1 ? "1 file selected" : files.length + " files selected");
    }
    if (design) parts.push("Nova design PNG " + formatBytes(design));
    var text;
    if (!files.length && !design) {
      text = "No files selected. You can attach up to 10 MB in total. For anything larger, paste a share link.";
    } else {
      text = parts.join(" · ") + ". Attachments: " + formatBytes(total) + " of 10 MB.";
      if (total > ATTACH_LIMIT) {
        text += " That’s over FormSubmit’s 10 MB limit — remove some files or paste a Google Drive, WeTransfer or Dropbox share link instead. The form will not attach oversized files.";
      } else if (total > ATTACH_LIMIT * 0.8) {
        text += " Close to the limit — a video will usually need a share link.";
      }
    }
    el.textContent = text;
    el.className = "upload-meter" + (total > ATTACH_LIMIT ? " is-err" : total > ATTACH_LIMIT * 0.8 ? " is-warn" : files.length || design ? " is-ok" : "");
  }

  FILE_INPUT_IDS.forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener("change", updateUploadMeter);
  });
  updateUploadMeter();

  function subjectFor(type, data) {
    if (type === "pre-register") return "Type C Custom pre-register" + (data.stick ? ": " + data.stick : "");
    if (type === "artist-interest") return "Type C Custom artist interest" + (data.artist ? ": " + data.artist : "");
    return "Type C Custom contact";
  }

  function bodyFor(type, data) {
    var lines = [];
    if (data.name) lines.push("Name: " + data.name);
    if (data.artist) lines.push("Artist: " + data.artist);
    if (data.email) lines.push("Email: " + data.email);
    if (data.stick) lines.push("Stick: " + data.stick);
    if (data.links) lines.push("Links: " + data.links);
    if (data.share_links) lines.push("Share links for large files: " + data.share_links);
    if (data.file_list) lines.push("Files offered: " + data.file_list);
    if (data.message) lines.push("", data.message);
    return lines.join("\n");
  }

  function mailtoFallback(type, data) {
    if (!contactEmail) return false;
    var url =
      "mailto:" +
      encodeURIComponent(contactEmail) +
      "?subject=" +
      encodeURIComponent(subjectFor(type, data)) +
      "&body=" +
      encodeURIComponent(bodyFor(type, data));
    window.location.href = url;
    return true;
  }

  function sendForm(form) {
    var type = form.getAttribute("data-form") || "contact";
    var data = gather(form);

    if (data.website) {
      // Honeypot tripped — pretend success, do not send.
      statusEl(form, "Thanks — we’ve got that.", "ok");
      form.reset();
      updateUploadMeter();
      return;
    }
    delete data.website;

    if (!contactEmail) {
      statusEl(form, "The contact email isn’t set yet, so this form can’t be delivered. Please try again later.", "err");
      return;
    }

    var payload = {
      name: data.name || "",
      email: data.email || "",
      message: data.message || "",
      _subject: subjectFor(type, data),
      _template: "table",
      _captcha: "false",
      _replyto: data.email || ""
    };
    if (data.artist) payload.artist = data.artist;
    if (data.stick) payload.stick = data.stick;
    if (data.links) payload.links = data.links;
    if (typeof data.share_links === "string" && data.share_links) {
      payload.share_links = data.share_links;
    }

    var files = type === "pre-register" ? listedFiles() : [];
    var design = window.TYPEC_DESIGN || {};
    var designSize = design.blob ? design.blob.size : 0;
    var fileTotal = designSize;
    files.forEach(function (item) { fileTotal += item.size; });
    var overLimit = fileTotal > ATTACH_LIMIT;
    var attachable = overLimit ? [] : files;
    if (files.length) {
      payload.file_list = files.map(function (item) {
        return item.name + " (" + formatBytes(item.size) + ")";
      }).join("; ");
    }
    if (overLimit) {
      payload.attachments_note = "Files were not attached because they total " + formatBytes(fileTotal) + ", over FormSubmit’s 10 MB limit. Please use the share links if provided.";
    }
    data.file_list = payload.file_list || "";

    var btn = form.querySelector('button[type="submit"]');
    if (type === "pre-register" && overLimit && !(data.share_links && String(data.share_links).trim())) {
      statusEl(form, "Those files total " + formatBytes(fileTotal) + ", over FormSubmit’s 10 MB attachment limit. Remove some files or paste a Google Drive, WeTransfer or Dropbox share link, then send again.", "err");
      var linkBox = document.getElementById("pr-share-links");
      if (linkBox) linkBox.focus();
      return;
    }

    statusEl(form, "Sending…");
    if (btn) btn.disabled = true;

    var headers = { Accept: "application/json" };
    var body;
    var useFormData = (design.blob && (type === "pre-register" || type === "contact") && !overLimit) || attachable.length > 0;
    if (useFormData) {
      var fd = new FormData();
      Object.keys(payload).forEach(function (key) { fd.append(key, payload[key]); });
      if (design.blob && (type === "pre-register" || type === "contact") && !overLimit) {
        fd.append("attachment_design", design.blob, "type-c-custom-design.png");
      }
      attachable.forEach(function (item) {
        var key = item.input === "pr-music" ? "attachment_music"
          : item.input === "pr-video" ? "attachment_video"
          : item.input === "pr-artwork" ? "attachment_artwork"
          : "attachment_other";
        fd.append(key, item.file, item.name);
      });
      body = fd;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(contactEmail), {
      method: "POST",
      headers: headers,
      body: body
    })
      .then(function (res) {
        return res.json().then(function (json) {
          return { ok: res.ok, json: json };
        }, function () {
          return { ok: res.ok, json: {} };
        });
      })
      .then(function (result) {
        if (result.ok && result.json && String(result.json.success) !== "false") {
          statusEl(form, "Thanks — your message is on its way. If this is the first one, we may need to confirm the inbox before it lands.", "ok");
          form.reset();
          var note = form.querySelector("[id$='-design-note']");
          if (note) note.hidden = true;
          updateUploadMeter();
          return;
        }
        throw new Error((result.json && (result.json.message || result.json.error)) || "Send failed");
      })
      .catch(function () {
        var used = mailtoFallback(type, data);
        statusEl(
          form,
          used
            ? "The web form didn’t go through, so your email app should open with the same message ready to send. Attach small files or the Nova PNG there yourself; keep share links in the message for anything large."
            : "Something went wrong sending the form. Please email us directly.",
          used ? "ok" : "err"
        );
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  window.TYPEC_REFRESH_UPLOAD = updateUploadMeter;

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      sendForm(form);
    });
  });
})();
