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

  function subjectFor(type, data) {
    if (type === "pre-register") return "Type C Music pre-register" + (data.stick ? ": " + data.stick : "");
    if (type === "artist-interest") return "Type C Music artist interest" + (data.artist ? ": " + data.artist : "");
    return "Type C Music contact";
  }

  function bodyFor(type, data) {
    var lines = [];
    if (data.name) lines.push("Name: " + data.name);
    if (data.artist) lines.push("Artist: " + data.artist);
    if (data.email) lines.push("Email: " + data.email);
    if (data.stick) lines.push("Stick: " + data.stick);
    if (data.links) lines.push("Links: " + data.links);
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

    statusEl(form, "Sending…");
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(contactEmail), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
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
          return;
        }
        throw new Error((result.json && (result.json.message || result.json.error)) || "Send failed");
      })
      .catch(function () {
        var used = mailtoFallback(type, data);
        statusEl(
          form,
          used
            ? "The web form didn’t go through, so your email app should open with the same message ready to send."
            : "Something went wrong sending the form. Please email us directly.",
          used ? "ok" : "err"
        );
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      sendForm(form);
    });
  });
})();
