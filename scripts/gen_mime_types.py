#!/usr/bin/env python3
"""Generate MIME Type Registry"""
import json, csv
from pathlib import Path

OUT = Path("/home/alex/data-market/data")

mimes = [
    # Text
    ("text/plain",["txt","text","log","md"],"Plain text","Text"),
    ("text/html",["html","htm","shtml"],"HTML document","Text"),
    ("text/css",["css"],"Cascading Style Sheets","Text"),
    ("text/javascript",["js","mjs","cjs"],"JavaScript","Text"),
    ("text/csv",["csv"],"Comma-separated values","Text"),
    ("text/markdown",["md","markdown"],"Markdown","Text"),
    ("text/xml",["xml","xsl","xsd","rss"],"XML","Text"),
    ("text/yaml",["yaml","yml"],"YAML","Text"),
    ("text/tab-separated-values",["tsv"],"Tab-separated values","Text"),
    # Application
    ("application/json",["json","map"],"JSON","Application"),
    ("application/pdf",["pdf"],"PDF document","Application"),
    ("application/zip",["zip"],"ZIP archive","Application"),
    ("application/gzip",["gz"],"GZip compressed","Application"),
    ("application/x-tar",["tar"],"Tape Archive","Application"),
    ("application/x-www-form-urlencoded",[],"URL-encoded form data","Application"),
    ("application/octet-stream",["bin","dmg","iso"],"Generic binary","Application"),
    ("application/xml",["xml","xsl"],"XML (application)","Application"),
    ("application/ld+json",["jsonld"],"JSON-LD","Application"),
    ("application/dns-message",[],"DNS over HTTPS","Application"),
    ("application/grpc",[],"gRPC","Application"),
    ("application/protobuf",["pb","proto"],"Protocol Buffers","Application"),
    ("application/wasm",["wasm"],"WebAssembly","Application"),
    ("application/x-sh",["sh"],"Shell script","Application"),
    ("application/x-python",["py"],"Python script","Application"),
    ("application/typescript",["ts","tsx"],"TypeScript","Application"),
    ("application/x-httpd-php",["php"],"PHP script","Application"),
    ("application/x-java-archive",["jar"],"JAR archive","Application"),
    ("application/graphql",["graphql","gql"],"GraphQL","Application"),
    ("application/openapi+json",[],"OpenAPI spec","Application"),
    # Image
    ("image/jpeg",["jpg","jpeg","jpe"],"JPEG image","Image"),
    ("image/png",["png"],"PNG image","Image"),
    ("image/gif",["gif"],"GIF image","Image"),
    ("image/webp",["webp"],"WebP image","Image"),
    ("image/svg+xml",["svg","svgz"],"SVG vector","Image"),
    ("image/avif",["avif"],"AVIF image","Image"),
    ("image/bmp",["bmp"],"BMP image","Image"),
    ("image/tiff",["tif","tiff"],"TIFF image","Image"),
    ("image/x-icon",["ico"],"Icon","Image"),
    ("image/heic",["heic","heif"],"HEIC image","Image"),
    # Audio
    ("audio/mpeg",["mp3"],"MP3 audio","Audio"),
    ("audio/ogg",["ogg","oga"],"OGG audio","Audio"),
    ("audio/wav",["wav"],"WAV audio","Audio"),
    ("audio/webm",["weba"],"WebM audio","Audio"),
    ("audio/aac",["aac"],"AAC audio","Audio"),
    ("audio/flac",["flac"],"FLAC audio","Audio"),
    ("audio/opus",["opus"],"Opus audio","Audio"),
    ("audio/midi",["mid","midi"],"MIDI","Audio"),
    # Video
    ("video/mp4",["mp4","m4v"],"MP4 video","Video"),
    ("video/webm",["webm"],"WebM video","Video"),
    ("video/ogg",["ogv"],"OGG video","Video"),
    ("video/avi",["avi"],"AVI video","Video"),
    ("video/mkv",["mkv"],"Matroska video","Video"),
    ("video/quicktime",["mov"],"QuickTime video","Video"),
    ("video/x-msvideo",["avi"],"AVI video","Video"),
    # Font
    ("font/woff",["woff"],"WOFF font","Font"),
    ("font/woff2",["woff2"],"WOFF2 font","Font"),
    ("font/ttf",["ttf"],"TrueType font","Font"),
    ("font/otf",["otf"],"OpenType font","Font"),
    # Multipart
    ("multipart/form-data",[],"Form data (multipart)","Multipart"),
    # Model
    ("model/gltf+json",["gltf"],"glTF model","Model"),
    ("model/gltf-binary",["glb"],"glTF binary","Model"),
    ("model/obj",["obj"],"OBJ 3D model","Model"),
]

rows = []
for mime, exts, desc, cat in mimes:
    rows.append({"mime_type":mime,"extensions":",".join(exts) if exts else "N/A","description":desc,"category":cat})

fields = ["mime_type","extensions","description","category"]
with open(OUT/"mime-types.json","w") as f:
    json.dump({"schema":fields,"count":len(rows),"updated":"2026-07-11","source":"IANA Media Types","data":rows}, f, indent=2)
with open(OUT/"mime-types.csv","w",newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader(); w.writerows(rows)
print(f"✅ mime-types ({(OUT/'mime-types.json').stat().st_size/1024:.1f} KB, {len(rows)} entries)")
