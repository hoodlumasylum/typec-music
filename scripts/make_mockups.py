#!/usr/bin/env python3
"""Composite original artwork onto the USB-C card product photo."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("/workspace/typec-music")
OUT = ROOT / "assets"
TMP = Path("/tmp")

# Virtual sharp corners of the card's top face (TL, TR, BR, BL)
DST = np.float32(
    [
        [218.0, 288.0],
        [804.0, 84.0],
        [1055.0, 322.0],
        [430.0, 572.0],
    ]
)

# Credit-card proportions
RATIO = 85.60 / 53.98
PRINT_H = 1600
PRINT_W = int(round(PRINT_H * RATIO))
CORNER_R = int(round(3.18 / 53.98 * PRINT_H))

BEBAS = "/usr/share/fonts/truetype/sand-box/google/Bebas Neue/BebasNeue-Regular.ttf"
INTER = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
ARCHIVO_BLACK = "/usr/share/fonts/truetype/sand-box/google/Archivo Black/ArchivoBlack-Regular.ttf"


def font_inter(size: int, weight: int = 400) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(INTER, size)
    f.set_variation_by_axes([14, weight])
    return f


def rounded_mask(w: int, h: int, r: int) -> np.ndarray:
    mask = np.zeros((h, w), np.uint8)
    cv2.rectangle(mask, (r, 0), (w - r, h), 255, -1)
    cv2.rectangle(mask, (0, r), (w, h - r), 255, -1)
    for c in ((r, r), (w - r, r), (r, h - r), (w - r, h - r)):
        cv2.circle(mask, c, r, 255, -1)
    return mask


def cover_resize(im: Image.Image, w: int, h: int) -> Image.Image:
    scale = max(w / im.width, h / im.height)
    nw, nh = int(im.width * scale) + 1, int(im.height * scale) + 1
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return im.crop((left, top, left + w, top + h))


def make_print(
    art_path: Path,
    title: str,
    subtitle: str,
    title_size: int = 210,
    text_anchor: str = "bottom",
) -> np.ndarray:
    art = Image.open(art_path).convert("RGB")
    face = cover_resize(art, PRINT_W, PRINT_H)

    # Subtle vignette so edges feel printed, not cropped
    vign = Image.new("L", (PRINT_W, PRINT_H), 0)
    vd = ImageDraw.Draw(vign)
    pad = 20
    vd.rectangle((pad, pad, PRINT_W - pad, PRINT_H - pad), fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(40))
    dark = Image.new("RGB", face.size, (8, 8, 10))
    face = Image.composite(face, Image.blend(face, dark, 0.28), vign)

    overlay = Image.new("RGBA", face.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    title_font = ImageFont.truetype(BEBAS, title_size)
    sub_font = font_inter(48, 600)
    brand_font = font_inter(36, 650)
    tiny_font = font_inter(28, 500)

    # Brand mark — top left
    margin_x, margin_y = 90, 80
    d.text((margin_x, margin_y), "TYPE C MUSIC", font=brand_font, fill=(255, 255, 255, 220))
    # small accent bar under brand
    d.rectangle((margin_x, margin_y + 50, margin_x + 92, margin_y + 56), fill=(0, 240, 200, 255))

    # USB-C / format line — top right
    right_label = "USB-C  ·  UV PRINTED"
    bbox = d.textbbox((0, 0), right_label, font=tiny_font)
    rw = bbox[2] - bbox[0]
    d.text((PRINT_W - margin_x - rw, margin_y + 8), right_label, font=tiny_font, fill=(255, 255, 255, 190))

    # Title block
    # Measure title lines
    lines = title.split("\n")
    line_heights = []
    line_widths = []
    for line in lines:
        b = d.textbbox((0, 0), line, font=title_font)
        line_widths.append(b[2] - b[0])
        line_heights.append(b[3] - b[1])
    title_h = sum(line_heights) + (len(lines) - 1) * 8
    sub_b = d.textbbox((0, 0), subtitle, font=sub_font)
    sub_h = sub_b[3] - sub_b[1]

    if text_anchor == "bottom":
        block_bottom = PRINT_H - 110
        # gradient behind text
        grad = Image.new("RGBA", face.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(grad)
        for i in range(700):
            a = int(200 * (i / 699) ** 1.15)
            y = PRINT_H - 700 + i
            gd.line([(0, y), (PRINT_W, y)], fill=(0, 0, 0, a))
        overlay = Image.alpha_composite(grad, overlay)
        d = ImageDraw.Draw(overlay)
        y = block_bottom - sub_h - title_h - 24
    else:
        grad = Image.new("RGBA", face.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(grad)
        for i in range(640):
            a = int(190 * (1 - i / 639) ** 1.1)
            gd.line([(0, i), (PRINT_W, i)], fill=(0, 0, 0, a))
        overlay = Image.alpha_composite(grad, overlay)
        d = ImageDraw.Draw(overlay)
        y = 160

    for i, line in enumerate(lines):
        d.text((margin_x, y), line, font=title_font, fill=(255, 255, 255, 255))
        y += line_heights[i] + 8
    y += 10
    d.rectangle((margin_x, y, margin_x + 72, y + 5), fill=(0, 240, 200, 255))
    y += 18
    d.text((margin_x, y), subtitle, font=sub_font, fill=(230, 230, 230, 230))

    # Thin inner keyline so it feels like a printed card
    inset = 36
    key = Image.new("RGBA", face.size, (0, 0, 0, 0))
    kd = ImageDraw.Draw(key)
    kd.rounded_rectangle(
        (inset, inset, PRINT_W - inset, PRINT_H - inset),
        radius=max(8, CORNER_R - inset),
        outline=(255, 255, 255, 70),
        width=3,
    )
    overlay = Image.alpha_composite(overlay, key)

    face_rgba = face.convert("RGBA")
    composed = Image.alpha_composite(face_rgba, overlay).convert("RGB")
    arr = cv2.cvtColor(np.array(composed), cv2.COLOR_RGB2BGR)
    return arr


def warp_print(print_bgr: np.ndarray, base: np.ndarray) -> np.ndarray:
    h, w = base.shape[:2]
    mask = rounded_mask(PRINT_W, PRINT_H, CORNER_R)
    src = np.float32([[0, 0], [PRINT_W, 0], [PRINT_W, PRINT_H], [0, PRINT_H]])
    M = cv2.getPerspectiveTransform(src, DST)
    warped = cv2.warpPerspective(print_bgr, M, (w, h), flags=cv2.INTER_LANCZOS4)
    wmask = cv2.warpPerspective(mask, M, (w, h), flags=cv2.INTER_LANCZOS4)
    wmask = cv2.GaussianBlur(wmask, (5, 5), 0)
    alpha = (wmask.astype(np.float32) / 255.0)[..., None]

    base_f = base.astype(np.float32)
    art_f = warped.astype(np.float32)

    # Use the blank card's lighting as a soft multiply so the print sits on the plastic
    lum = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    # Normalise lighting inside the face so midtones stay close to 1
    ys, xs = np.where(wmask > 128)
    if len(xs):
        face_lum = lum[ys, xs]
        mid = float(np.median(face_lum))
        if mid < 1e-3:
            mid = 0.2
        lum_n = np.clip(lum / mid, 0.35, 1.8)
    else:
        lum_n = np.clip(lum * 3.0, 0.35, 1.8)
    shaded = np.clip(art_f * lum_n[..., None] ** 0.85, 0, 255)

    # Screen the original specular highlight back on so it stays glossy
    highlight = np.clip((lum - 0.28) / 0.72, 0, 1)
    highlight = highlight ** 1.15
    hl = (highlight * 255.0)[..., None]
    screened = 255.0 - (255.0 - shaded) * (1.0 - hl * 0.72 / 255.0 * 255.0)
    # Proper screen: 1-(1-a)(1-b)
    hl_img = np.repeat(hl, 3, axis=2)
    screened = 255.0 - (255.0 - shaded) * (1.0 - (hl_img / 255.0) * 0.85)
    screened = np.clip(screened, 0, 255)

    out = screened * alpha + base_f * (1.0 - alpha)
    return np.clip(out, 0, 255).astype(np.uint8)


def crop_product(img: np.ndarray) -> np.ndarray:
    # Tight-ish product crop including the USB connector and a little shadow
    # Original is 1280x720. Card occupies roughly x 160-1160, y 40-640
    x1, y1, x2, y2 = 150, 20, 1188, 680
    crop = img[y1:y2, x1:x2]
    return crop


def save_jpg(path: Path, bgr: np.ndarray, quality: int = 92) -> None:
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    im = Image.fromarray(rgb)
    im.save(path, "JPEG", quality=quality, optimize=True, subsampling=0)
    print(f"wrote {path} {im.size}")


def make_og(hero_bgr: np.ndarray) -> np.ndarray:
    """16:9 share image with typography on the left, stick on the right."""
    # Start from hero, darken left side, add type
    h, w = 720, 1280
    img = cv2.resize(hero_bgr, (w, h), interpolation=cv2.INTER_AREA)
    rgb = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).convert("RGBA")
    # shift the product a little right by pasting onto a wider dark canvas? keep as-is
    overlay = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # left gradient
    for x in range(0, 780):
        a = int(210 * (1 - x / 780) ** 0.85)
        d.line([(x, 0), (x, h)], fill=(7, 7, 8, a))
    title_font = ImageFont.truetype(BEBAS, 118)
    sub_font = font_inter(28, 500)
    brand_font = font_inter(26, 650)
    d.text((72, 160), "TYPE C MUSIC", font=brand_font, fill=(0, 240, 200, 255))
    d.text((72, 230), "MUSIC YOU", font=title_font, fill=(255, 255, 255, 255))
    d.text((72, 340), "CAN HOLD.", font=title_font, fill=(255, 255, 255, 255))
    d.text((72, 490), "Custom USB-C cards from independent artists.", font=sub_font, fill=(220, 220, 220, 230))
    d.text((72, 528), "Shipped from the UK.", font=sub_font, fill=(220, 220, 220, 230))
    out = Image.alpha_composite(rgb, overlay).convert("RGB")
    return cv2.cvtColor(np.array(out), cv2.COLOR_RGB2BGR)


def main() -> None:
    blank = cv2.imread(str(TMP / "usb-card-blank.jpg"))
    if blank is None:
        raise SystemExit("missing /tmp/usb-card-blank.jpg")

    products = [
        {
            "art": TMP / "art-hoodlum-asylum.jpg",
            "title": "HOODLUM\nASYLUM",
            "subtitle": "ARTIST COLLECTION",
            "title_size": 220,
            "anchor": "bottom",
            "product": OUT / "product-hoodlum-asylum.jpg",
            "hero": True,
        },
        {
            "art": TMP / "art-street-credibility.jpg",
            "title": "STREET\nCREDIBILITY",
            "subtitle": "HOODLUM ASYLUM",
            "title_size": 200,
            "anchor": "top",
            "product": OUT / "product-street-credibility.jpg",
            "hero": False,
        },
        {
            "art": TMP / "art-no-competition.jpg",
            "title": "NO\nCOMPETITION",
            "subtitle": "CODEAQUE  ×  NOVA",
            "title_size": 220,
            "anchor": "bottom",
            "product": OUT / "product-no-competition.jpg",
            "hero": False,
        },
    ]

    hero_img = None
    for p in products:
        face = make_print(p["art"], p["title"], p["subtitle"], p["title_size"], p["anchor"])
        # keep a flat print too, useful if we ever need it
        # cv2.imwrite(str(OUT / (p['product'].stem + '-flat.jpg')), face)
        comp = warp_print(face, blank)
        crop = crop_product(comp)
        save_jpg(p["product"], crop, 93)
        if p["hero"]:
            hero_img = comp
            save_jpg(OUT / "hero.jpg", comp, 93)

    if hero_img is not None:
        save_jpg(OUT / "og.jpg", make_og(hero_img), 90)

    # Also copy a smaller favicon source: we'll make SVG separately
    print("done")


if __name__ == "__main__":
    main()
